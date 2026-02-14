from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

try:
    from bs4 import BeautifulSoup
except ImportError as exc:  # pragma: no cover - user-actionable dependency error
    raise SystemExit(
        "Missing dependency: beautifulsoup4. Install with `pip install beautifulsoup4`."
    ) from exc


ROOT_DIR = Path(__file__).resolve().parents[1]
STITCH_ROOT = ROOT_DIR / "stitch_roadmitere"

MANIFEST_OUTPUT_PATH = ROOT_DIR / "src" / "data" / "mock" / "generated" / "stitch-manifest.json"
TOKENS_OUTPUT_PATH = ROOT_DIR / "src" / "theme" / "generated" / "tokens.raw.json"
MOCK_OUTPUT_PATH = ROOT_DIR / "src" / "data" / "mock" / "generated" / "mock-data.raw.json"

SCREEN_ROLE_BY_ID: dict[int, str] = {
    1: "explore-universities",
    2: "university-detail",
    3: "explore-faculties",
    4: "faculty-detail",
    5: "filter-faculties",
    6: "explore-programs",
    7: "program-detail",
    8: "favorites-programs",
    9: "favorites-universities",
    10: "filter-universities",
    11: "filter-programs",
    12: "favorites-faculties",
    13: "favorites-empty",
}

MOJIBAKE_REPAIR_PATTERN = re.compile(r"[ÃÄÅÈÂâ]")
CEDILLA_TO_COMMA_MAP = str.maketrans({
    "Ş": "Ș",
    "ş": "ș",
    "Ţ": "Ț",
    "ţ": "ț",
})


@dataclass(frozen=True)
class ScreenDocument:
    screen_id: int
    folder_name: str
    code_path: Path
    screenshot_path: Path
    html: str
    soup: BeautifulSoup


def parse_screen_id(folder_name: str) -> int:
    match = re.search(r"_(\d+)$", folder_name)
    if not match:
        raise ValueError(f"Folder name is missing numeric suffix: {folder_name}")
    return int(match.group(1))


def list_screen_paths() -> list[tuple[int, Path, Path]]:
    if not STITCH_ROOT.exists():
        raise FileNotFoundError(f"Missing Stitch root: {STITCH_ROOT}")

    paths: list[tuple[int, Path, Path]] = []
    for folder in STITCH_ROOT.iterdir():
        if not folder.is_dir():
            continue
        code_path = folder / "code.html"
        screenshot_path = folder / "screen.png"
        if not code_path.exists() or not screenshot_path.exists():
            continue
        screen_id = parse_screen_id(folder.name)
        paths.append((screen_id, code_path, screenshot_path))

    return sorted(paths, key=lambda item: item[0])


def load_screen_documents() -> list[ScreenDocument]:
    documents: list[ScreenDocument] = []
    for screen_id, code_path, screenshot_path in list_screen_paths():
        html = code_path.read_text(encoding="utf-8")
        soup = BeautifulSoup(html, "html.parser")
        documents.append(
            ScreenDocument(
                screen_id=screen_id,
                folder_name=code_path.parent.name,
                code_path=code_path,
                screenshot_path=screenshot_path,
                html=html,
                soup=soup,
            )
        )
    return documents


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = re.sub(r"\s+", " ", value).strip()

    # Stitch HTML payloads occasionally contain mojibake from mixed UTF-8/latin-1 decoding.
    if MOJIBAKE_REPAIR_PATTERN.search(normalized):
        for _ in range(2):
            try:
                repaired = normalized.encode("latin-1").decode("utf-8")
            except UnicodeError:
                break
            if repaired == normalized:
                break
            normalized = repaired

    return unicodedata.normalize("NFC", normalized.translate(CEDILLA_TO_COMMA_MAP))


def ordered_unique(values: Iterable[str]) -> list[str]:
    output: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = normalize_text(value)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        output.append(normalized)
    return output


def class_list(element: Any) -> list[str]:
    classes = element.get("class", [])
    return [str(value) for value in classes] if classes else []


def has_class_fragment(element: Any, fragment: str) -> bool:
    return any(fragment in class_name for class_name in class_list(element))


def is_icon_tag(element: Any) -> bool:
    classes = class_list(element)
    return "material-icons" in classes or "material-symbols-outlined" in classes


def text_without_icons(element: Any) -> str:
    clone = BeautifulSoup(str(element), "html.parser")
    for icon in clone.select(".material-icons, .material-symbols-outlined"):
        icon.decompose()
    return normalize_text(clone.get_text(" ", strip=True))


def extract_int(value: str | None) -> int | None:
    if not value:
        return None
    match = re.search(r"(\d+)", value)
    return int(match.group(1)) if match else None


def extract_float(value: str | None) -> float | None:
    if not value:
        return None
    match = re.search(r"(\d+(?:[.,]\d+)?)", value)
    if not match:
        return None
    return float(match.group(1).replace(",", "."))


def split_bullet_text(value: str) -> list[str]:
    if not value:
        return []
    return [part for part in (normalize_text(piece) for piece in re.split(r"[•·]", value)) if part]


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-")
    return slug or "item"


def stable_entity_id(prefix: str, *parts: str) -> str:
    joined = "-".join(part for part in parts if normalize_text(part))
    return f"{prefix}-{slugify(joined or prefix)}"


def relative_to_root(path: Path) -> str:
    return path.relative_to(ROOT_DIR).as_posix()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
