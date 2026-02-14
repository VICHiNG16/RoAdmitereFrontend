from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
REAL_GENERATED_DIR = ROOT_DIR / "src" / "data" / "real" / "generated"
MOCK_GENERATED_DIR = ROOT_DIR / "src" / "data" / "mock" / "generated"
RUNS_DIR = ROOT_DIR.parent / "manual scraping" / "data" / "runs"

DEFAULT_UNIVERSITY_CODE_ORDER = ["ub", "ase", "uoradea", "ugal", "utcn", "uvt", "upt"]

FACULTY_DOMAIN_OPTIONS: list[tuple[str, str]] = [
    ("option-it-calculatoare", "IT & Calculatoare"),
    ("option-medicina", "Medicina"),
    ("option-drept", "Drept"),
    ("option-economie", "Economie"),
    ("option-arte", "Arte"),
    ("option-inginerie", "Inginerie"),
    ("option-litere", "Litere"),
    ("option-psihologie", "Psihologie"),
    ("option-stiinte-politice", "Stiinte Politice"),
    ("option-jurnalism", "Jurnalism"),
    ("option-arhitectura", "Arhitectura"),
]

FACULTY_ICON_RULES: list[tuple[str, str]] = [
    ("informatic", "code"),
    ("matemat", "calculate"),
    ("drept", "gavel"),
    ("psiholog", "psychology"),
    ("jurnal", "menu-book"),
    ("teolog", "menu-book"),
    ("istor", "history_edu"),
    ("biolog", "biotech"),
    ("chim", "biotech"),
    ("fizic", "biotech"),
    ("geo", "public"),
    ("litere", "menu-book"),
    ("filosof", "menu-book"),
    ("sociolog", "psychology"),
    ("politic", "analytics"),
    ("administra", "account-balance"),
    ("afaceri", "analytics"),
]

PROGRAM_ICON_RULES: list[tuple[str, str]] = [
    ("informatic", "code"),
    ("matemat", "calculate"),
    ("drept", "gavel"),
    ("psiholog", "psychology"),
    ("istor", "history_edu"),
    ("jurnal", "menu-book"),
    ("chim", "biotech"),
    ("fizic", "biotech"),
    ("geo", "public"),
    ("teolog", "menu-book"),
    ("politic", "analytics"),
    ("administra", "analytics"),
    ("afaceri", "analytics"),
]

MOJIBAKE_PATTERN = re.compile(r"[\u00C3\u00C5\u00C8\u00C2]")
CEDILLA_TO_COMMA_MAP = str.maketrans(
    {
        "\u015E": "\u0218",
        "\u015F": "\u0219",
        "\u0162": "\u021A",
        "\u0163": "\u021B",
    }
)


@dataclass(frozen=True)
class UniversityInfo:
    code: str
    id: str
    name: str
    city: str
    location_label: str
    official_url: str
    logo_alt: str
    description: str = ""
    type_option_id: str = "option-publica"
    media_tone: str = "accent"


UNIVERSITY_INFO_BY_CODE: dict[str, UniversityInfo] = {
    "ub": UniversityInfo(
        code="ub",
        id="university-universitatea-din-bucuresti",
        name="Universitatea din Bucuresti",
        city="Bucuresti",
        location_label="Bucuresti, Romania",
        official_url="https://unibuc.ro/",
        logo_alt="Unibuc Logo",
        description="Date reale extrase din rularea manual scraping.",
        type_option_id="option-publica",
        media_tone="olive",
    ),
    "ase": UniversityInfo(
        code="ase",
        id="university-academia-de-studii-economice-din-bucuresti",
        name="Academia de Studii Economice din Bucuresti",
        city="Bucuresti",
        location_label="Bucuresti, Romania",
        official_url="https://www.ase.ro/",
        logo_alt="ASE Logo",
        description="Date reale extrase din rularea manual scraping.",
        type_option_id="option-publica",
        media_tone="accent",
    ),
    "uoradea": UniversityInfo(
        code="uoradea",
        id="university-universitatea-din-oradea",
        name="Universitatea din Oradea",
        city="Oradea",
        location_label="Oradea, Romania",
        official_url="https://www.uoradea.ro/",
        logo_alt="UOradea Logo",
        description="Date reale extrase din rularea manual scraping.",
        type_option_id="option-publica",
        media_tone="olive",
    ),
    "ugal": UniversityInfo(
        code="ugal",
        id="university-universitatea-dunarea-de-jos-din-galati",
        name="Universitatea Dunarea de Jos din Galati",
        city="Galati",
        location_label="Galati, Romania",
        official_url="https://www.ugal.ro/",
        logo_alt="UGAL Logo",
        description="Date reale extrase din rularea manual scraping.",
        type_option_id="option-publica",
        media_tone="accent",
    ),
    "utcn": UniversityInfo(
        code="utcn",
        id="university-universitatea-tehnica-din-cluj-napoca",
        name="Universitatea Tehnica din Cluj-Napoca",
        city="Cluj-Napoca",
        location_label="Cluj-Napoca, Romania",
        official_url="https://www.utcluj.ro/",
        logo_alt="UTCN Logo",
        description="Date reale extrase din rularea manual scraping.",
        type_option_id="option-publica",
        media_tone="accent",
    ),
    "uvt": UniversityInfo(
        code="uvt",
        id="university-universitatea-de-vest",
        name="Universitatea de Vest din Timisoara",
        city="Timisoara",
        location_label="Timisoara, Romania",
        official_url="https://www.uvt.ro/",
        logo_alt="UVT Logo",
        description="Date reale extrase din rularea manual scraping.",
        type_option_id="option-publica",
        media_tone="olive",
    ),
    "upt": UniversityInfo(
        code="upt",
        id="university-universitatea-politehnica-timisoara",
        name="Universitatea Politehnica Timisoara",
        city="Timisoara",
        location_label="Timisoara, Romania",
        official_url="https://www.upt.ro/",
        logo_alt="UPT Logo",
        description="Date reale extrase din rularea manual scraping.",
        type_option_id="option-publica",
        media_tone="accent",
    ),
}


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    text = re.sub(r"\s+", " ", str(value)).strip()
    if not text:
        return ""
    if MOJIBAKE_PATTERN.search(text):
        for _ in range(2):
            try:
                repaired = text.encode("latin-1").decode("utf-8")
            except UnicodeError:
                break
            if repaired == text:
                break
            text = repaired
    return unicodedata.normalize("NFC", text.translate(CEDILLA_TO_COMMA_MAP))


def normalize_for_search(value: str) -> str:
    normalized = normalize_text(value)
    without_marks = (
        unicodedata.normalize("NFD", normalized)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    return re.sub(r"[^a-z0-9]+", " ", without_marks).strip()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", normalize_for_search(value)).strip("-")
    return slug or "item"


def parse_int(value: Any) -> int | None:
    if value is None:
        return None
    text = normalize_text(value)
    match = re.search(r"\d+", text)
    return int(match.group(0)) if match else None


def parse_float(value: Any) -> float | None:
    if value is None:
        return None
    text = normalize_text(value).replace(",", ".")
    match = re.search(r"\d+(?:\.\d+)?", text)
    return float(match.group(0)) if match else None


def normalize_level(level: str) -> str:
    normalized = normalize_for_search(level)
    return "Master" if "master" in normalized else "Licenta"


def normalize_language(language: str) -> str:
    normalized = normalize_for_search(language)
    if not normalized:
        return "Romana"
    if "english" in normalized or "englez" in normalized:
        return "Engleza"
    if "french" in normalized or "francez" in normalized:
        return "Franceza"
    if "german" in normalized:
        return "Germana"
    if "span" in normalized:
        return "Spaniola"
    if "roman" in normalized:
        return "Romana"
    return normalize_text(language)


def infer_domain_option_ids(domain: str, faculty_name: str) -> set[str]:
    text = normalize_for_search(f"{domain} {faculty_name}")
    option_ids: set[str] = set()
    if any(token in text for token in ["it", "calculat", "informatic", "cibernet"]):
        option_ids.add("option-it-calculatoare")
    if any(token in text for token in ["medicin", "biolog", "farmac"]):
        option_ids.add("option-medicina")
    if "drept" in text or "jurid" in text:
        option_ids.add("option-drept")
    if "econom" in text or "afacer" in text or "administr" in text:
        option_ids.add("option-economie")
    if any(token in text for token in ["arte", "film", "teatr"]):
        option_ids.add("option-arte")
    if "inginer" in text:
        option_ids.add("option-inginerie")
    if any(token in text for token in ["litere", "limbi", "filolog", "istor", "teolog", "filosof"]):
        option_ids.add("option-litere")
    if "psiholog" in text or "educa" in text:
        option_ids.add("option-psihologie")
    if "politic" in text:
        option_ids.add("option-stiinte-politice")
    if "jurnal" in text or "comunic" in text:
        option_ids.add("option-jurnalism")
    if "arhitect" in text:
        option_ids.add("option-arhitectura")
    return option_ids


def pick_faculty_icon(faculty_name: str, domain: str) -> str:
    text = normalize_for_search(f"{faculty_name} {domain}")
    for needle, icon in FACULTY_ICON_RULES:
        if needle in text:
            return icon
    return "school"


def pick_program_icon(program_name: str, faculty_name: str, domain: str) -> str:
    text = normalize_for_search(f"{program_name} {faculty_name} {domain}")
    for needle, icon in PROGRAM_ICON_RULES:
        if needle in text:
            return icon
    return "code"


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def resolve_program_dir(university_code: str, run_id: str) -> Path:
    return RUNS_DIR / run_id / "raw" / university_code / "programs"


def has_program_files(program_dir: Path) -> bool:
    return program_dir.exists() and any(program_dir.glob("*.json"))


def resolve_default_university_codes() -> list[str]:
    available_codes: set[str] = set()
    if not RUNS_DIR.exists():
        raise SystemExit(f"Runs directory not found: {RUNS_DIR}")

    for run_path in RUNS_DIR.iterdir():
        if not run_path.is_dir():
            continue

        raw_dir = run_path / "raw"
        if not raw_dir.exists():
            continue

        for code in UNIVERSITY_INFO_BY_CODE:
            if has_program_files(raw_dir / code / "programs"):
                available_codes.add(code)

    if not available_codes:
        configured_codes = ", ".join(DEFAULT_UNIVERSITY_CODE_ORDER)
        raise SystemExit(
            "No manual scraping runs found for configured university codes: "
            f"{configured_codes}."
        )

    ordered_defaults = [
        code
        for code in DEFAULT_UNIVERSITY_CODE_ORDER
        if code in available_codes
    ]
    remaining_codes = sorted(
        code for code in available_codes if code not in ordered_defaults
    )
    return ordered_defaults + remaining_codes


def resolve_run_id(university_code: str, explicit_run_id: str | None) -> str:
    if explicit_run_id:
        program_dir = resolve_program_dir(university_code, explicit_run_id)
        if not has_program_files(program_dir):
            raise SystemExit(
                f"Run '{explicit_run_id}' does not contain program files for '{university_code}'."
            )
        return explicit_run_id

    candidates: list[tuple[float, str]] = []
    for run_path in RUNS_DIR.iterdir():
        if not run_path.is_dir():
            continue
        programs_dir = run_path / "raw" / university_code / "programs"
        if has_program_files(programs_dir):
            candidates.append((run_path.stat().st_mtime, run_path.name))
    if not candidates:
        raise SystemExit(f"No runs found for university code '{university_code}'.")
    candidates.sort(reverse=True)
    return candidates[0][1]


def parse_run_overrides(raw_values: list[str]) -> dict[str, str]:
    overrides: dict[str, str] = {}
    for value in raw_values:
        if "=" not in value:
            raise SystemExit(f"Invalid --run value '{value}'. Expected format: <university_code>=<run_id>.")
        code, run_id = value.split("=", 1)
        code = normalize_text(code).lower()
        run_id = normalize_text(run_id)
        if not code or not run_id:
            raise SystemExit(f"Invalid --run value '{value}'. Expected format: <university_code>=<run_id>.")
        overrides[code] = run_id
    return overrides

def load_mock_labels() -> tuple[dict[str, str], dict[str, Any], list[dict[str, Any]]]:
    favorites_payload = read_json(MOCK_GENERATED_DIR / "favorites.json").get("favorites", {})
    screen_copy = read_json(MOCK_GENERATED_DIR / "screen-copy.json").get("screenCopy", [])

    add_labels = {
        "universities": "Descopera mai multe",
        "faculties": "Descopera mai multe",
        "programs": "Descopera alte programe",
    }
    for collection in favorites_payload.get("collections", []):
        kind = collection.get("kind")
        if kind in add_labels and normalize_text(collection.get("addCardLabel", "")):
            add_labels[kind] = normalize_text(collection["addCardLabel"])

    empty_state = favorites_payload.get("emptyState", {})
    default_empty_state = {
        "screenId": 13,
        "title": normalize_text(empty_state.get("title", "Colectia ta este goala")) or "Colectia ta este goala",
        "description": normalize_text(
            empty_state.get(
                "description",
                "Incepe sa explorezi universitatile si facultatile si salveaza-le pe cele care iti plac.",
            )
        ),
        "ctaLabel": normalize_text(empty_state.get("ctaLabel", "Exploreaza acum")) or "Exploreaza acum",
    }
    return add_labels, default_empty_state, screen_copy


def load_mock_university_logos() -> tuple[dict[str, str], dict[str, str]]:
    by_id: dict[str, str] = {}
    by_name: dict[str, str] = {}
    path = MOCK_GENERATED_DIR / "universities.json"
    if not path.exists():
        return by_id, by_name
    payload = read_json(path)
    for university in payload.get("universities", []):
        university_id = normalize_text(university.get("id"))
        university_name = normalize_text(university.get("name"))
        logo_url = normalize_text(university.get("logoUrl"))
        if not logo_url:
            continue
        if university_id:
            by_id[university_id] = logo_url
        if university_name:
            by_name[normalize_for_search(university_name)] = logo_url
    return by_id, by_name


def city_option_id(city: str) -> str:
    return f"option-{slugify(city)}"


def pick_best_label(candidates: Counter[str]) -> str:
    if not candidates:
        return "Facultate Necunoscuta"
    return sorted(
        candidates.items(),
        key=lambda item: (
            len(MOJIBAKE_PATTERN.findall(item[0])),
            -item[1],
            -len(item[0]),
            item[0],
        ),
    )[0][0]


def build_real_payload(university_codes: list[str], run_ids_by_code: dict[str, str]) -> dict[str, Any]:
    missing = [code for code in university_codes if code not in UNIVERSITY_INFO_BY_CODE]
    if missing:
        raise SystemExit(f"No university metadata configured for codes: {', '.join(sorted(missing))}.")

    raw_programs_by_code: dict[str, list[dict[str, Any]]] = {}
    for code in university_codes:
        program_dir = resolve_program_dir(code, run_ids_by_code[code])
        program_paths = sorted(program_dir.glob("*.json"), key=lambda path: path.name)
        if not program_paths:
            raise SystemExit(f"No program files found in {program_dir}")
        raw_programs_by_code[code] = [read_json(path) for path in program_paths]

    add_labels, empty_state, screen_copy = load_mock_labels()
    logo_by_id, logo_by_name = load_mock_university_logos()

    universities: list[dict[str, Any]] = []
    faculties: list[dict[str, Any]] = []
    programs: list[dict[str, Any]] = []

    domain_option_counter: Counter[str] = Counter()
    language_counter: Counter[str] = Counter()
    level_counter: Counter[str] = Counter()
    study_form_counter: Counter[str] = Counter()
    duration_counter: Counter[str] = Counter()
    faculty_city_counter: Counter[str] = Counter()
    university_city_counter: Counter[str] = Counter()
    university_type_counter: Counter[str] = Counter()

    faculty_groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    faculty_labels: dict[tuple[str, str], Counter[str]] = defaultdict(Counter)
    for code in university_codes:
        for program in raw_programs_by_code[code]:
            faculty_name = normalize_text(program.get("faculty_name")) or "Facultate Necunoscuta"
            faculty_key = normalize_for_search(faculty_name) or "facultate-necunoscuta"
            group_key = (code, faculty_key)
            faculty_groups[group_key].append(program)
            faculty_labels[group_key][faculty_name] += 1

    for code in university_codes:
        info = UNIVERSITY_INFO_BY_CODE[code]
        logo_url = logo_by_id.get(info.id) or logo_by_name.get(normalize_for_search(info.name)) or ""
        faculty_count = sum(1 for faculty_code, _ in faculty_groups if faculty_code == code)
        universities.append(
            {
                "id": info.id,
                "name": info.name,
                "city": info.city,
                "facultyCountLabel": f"{faculty_count} Facultati",
                "facultyCount": faculty_count,
                "logoAlt": info.logo_alt,
                "logoUrl": logo_url,
                "description": info.description,
                "locationLabel": info.location_label,
                "officialUrl": info.official_url,
                "isFavorite": False,
                "sourceScreens": [1, 2, 9],
            }
        )
        university_city_counter[info.city] += 1
        university_type_counter[info.type_option_id] += 1

    for code in university_codes:
        info = UNIVERSITY_INFO_BY_CODE[code]
        grouped_faculties = sorted(
            [
                (faculty_key, faculty_groups[(code, faculty_key)])
                for code_key, faculty_key in faculty_groups
                if code_key == code
            ],
            key=lambda item: item[0],
        )

        for faculty_key, faculty_programs in grouped_faculties:
            faculty_name = pick_best_label(faculty_labels[(code, faculty_key)])
            domains = [
                normalize_text(item.get("domain"))
                for item in faculty_programs
                if normalize_text(item.get("domain"))
            ]
            domain = Counter(domains).most_common(1)[0][0] if domains else ""
            faculty_id = f"faculty-{slugify(faculty_name)}-{code}"
            source_url = next(
                (
                    normalize_text(item.get("source_url"))
                    for item in faculty_programs
                    if normalize_text(item.get("source_url"))
                ),
                "",
            )
            program_count = len(faculty_programs)

            for option_id in infer_domain_option_ids(domain, faculty_name):
                domain_option_counter[option_id] += program_count

            faculties.append(
                {
                    "id": faculty_id,
                    "name": faculty_name,
                    "universityName": info.name,
                    "domain": domain,
                    "programCountLabel": f"{program_count} Programe",
                    "programCount": program_count,
                    "icon": pick_faculty_icon(faculty_name, domain),
                    "description": "",
                    "locationLabel": info.location_label,
                    "officialUrl": source_url or info.official_url,
                    "isFavorite": False,
                    "sourceScreens": [3, 4],
                }
            )
            faculty_city_counter[info.city] += 1

            for raw_program in sorted(
                faculty_programs,
                key=lambda item: normalize_for_search(normalize_text(item.get("name"))),
            ):
                program_name = normalize_text(raw_program.get("name")) or "Program fara nume"
                level = normalize_level(normalize_text(raw_program.get("level")))
                program_uid = normalize_text(raw_program.get("uid"))[:8] or "unknown"
                program_id = (
                    f"program-{slugify(program_name)}-"
                    f"{slugify(faculty_name)}-{code}-{slugify(level)}-{program_uid}"
                )

                duration_years = parse_int(raw_program.get("duration_years"))
                raw_duration = normalize_text(raw_program.get("duration_years"))
                study_mode = normalize_text(raw_program.get("study_mode"))
                language = normalize_language(normalize_text(raw_program.get("language")))
                credits_raw = normalize_text(raw_program.get("credits"))
                admission_average = parse_float(raw_program.get("last_admission_grade"))
                spots_budget = parse_int(raw_program.get("spots_budget"))
                spots_tax = parse_int(raw_program.get("spots_tax"))
                admission_method = normalize_text(raw_program.get("admission_method"))
                admission_dates = normalize_text(raw_program.get("admission_dates"))
                source_url = normalize_text(raw_program.get("source_url"))

                duration_parts: list[str] = []
                if duration_years is not None:
                    duration_parts.append(f"{duration_years} ani")
                elif raw_duration:
                    duration_parts.append(raw_duration)
                if study_mode:
                    duration_parts.append(study_mode)
                if language:
                    duration_parts.append(language)
                duration_label = " | ".join(duration_parts) if duration_parts else "-"

                description_paragraphs: list[str] = []
                if admission_method:
                    description_paragraphs.append(f"Metoda admitere: {admission_method}")
                if admission_dates:
                    description_paragraphs.append(f"Calendar admitere: {admission_dates}")
                spots_parts: list[str] = []
                if spots_budget is not None:
                    spots_parts.append(f"buget {spots_budget}")
                if spots_tax is not None:
                    spots_parts.append(f"taxa {spots_tax}")
                if spots_parts:
                    description_paragraphs.append(f"Locuri disponibile: {', '.join(spots_parts)}.")

                language_counter[language] += 1
                level_counter[level] += 1
                if study_mode and normalize_for_search(study_mode) in {"id", "distanta", "ifr"}:
                    study_form_counter["option-la-distanta-id"] += 1
                else:
                    study_form_counter["option-cu-frecventa-if"] += 1
                if duration_years is not None:
                    duration_counter[f"option-{duration_years}-ani"] += 1

                programs.append(
                    {
                        "id": program_id,
                        "name": program_name,
                        "level": level,
                        "durationLabel": duration_label,
                        "durationYears": duration_years,
                        "studyMode": study_mode,
                        "universityName": info.name,
                        "facultyName": faculty_name,
                        "language": language,
                        "creditsLabel": credits_raw,
                        "admissionAverage": admission_average,
                        "descriptionParagraphs": description_paragraphs,
                        "careerOpportunities": [],
                        "officialUrl": source_url or info.official_url,
                        "isFavorite": False,
                        "sourceScreens": [6, 7],
                    }
                )

    universities.sort(key=lambda item: item["id"])
    faculties.sort(key=lambda item: item["id"])
    programs.sort(key=lambda item: item["id"])

    university_city_options = [
        {
            "id": city_option_id(city),
            "label": city,
            "count": count,
            "selected": False,
            "description": "",
        }
        for city, count in sorted(
            university_city_counter.items(),
            key=lambda item: normalize_for_search(item[0]),
        )
    ]
    faculty_city_options = [
        {
            "id": city_option_id(city),
            "label": city,
            "count": count,
            "selected": False,
            "description": "",
        }
        for city, count in sorted(
            faculty_city_counter.items(),
            key=lambda item: normalize_for_search(item[0]),
        )
    ]

    language_options = [
        ("option-romana", "Romana"),
        ("option-engleza", "Engleza"),
        ("option-franceza", "Franceza"),
        ("option-germana", "Germana"),
    ]
    language_count_by_option = {
        "option-romana": language_counter.get("Romana", 0),
        "option-engleza": language_counter.get("Engleza", 0),
        "option-franceza": language_counter.get("Franceza", 0),
        "option-germana": language_counter.get("Germana", 0),
    }

    filters = [
        {
            "id": "filter-universities",
            "screenId": 10,
            "title": "Filtreaza universitati",
            "sections": [
                {
                    "id": "cities",
                    "label": "Oras",
                    "options": university_city_options,
                },
                {
                    "id": "university-types",
                    "label": "Tip Universitate",
                    "options": [
                        {
                            "id": "option-publica",
                            "label": "Publica",
                            "count": university_type_counter.get("option-publica", 0),
                            "selected": False,
                            "description": "Buget & Taxa",
                        },
                        {
                            "id": "option-privata",
                            "label": "Privata",
                            "count": university_type_counter.get("option-privata", 0),
                            "selected": False,
                            "description": "Taxa",
                        },
                    ],
                },
            ],
            "footer": {
                "resetLabel": "Reseteaza",
                "applyLabel": "Aplica Filtre",
                "selectedCount": 0,
            },
        },
        {
            "id": "filter-faculties",
            "screenId": 5,
            "title": "Filtreaza facultati",
            "sections": [
                {
                    "id": "cities",
                    "label": "Cauta oras",
                    "options": faculty_city_options,
                },
                {
                    "id": "domains",
                    "label": "Domenii",
                    "options": [
                        {
                            "id": option_id,
                            "label": option_label,
                            "count": domain_option_counter.get(option_id, 0),
                            "selected": False,
                            "description": "",
                        }
                        for option_id, option_label in FACULTY_DOMAIN_OPTIONS
                    ],
                },
            ],
            "footer": {
                "resetLabel": "Reseteaza",
                "applyLabel": "Aplica Filtre",
                "selectedCount": 0,
            },
        },
        {
            "id": "filter-programs",
            "screenId": 11,
            "title": "Filtreaza programe",
            "sections": [
                {
                    "id": "languages",
                    "label": "Limba",
                    "options": [
                        {
                            "id": option_id,
                            "label": label,
                            "count": language_count_by_option.get(option_id, 0),
                            "selected": False,
                            "description": "",
                        }
                        for option_id, label in language_options
                    ],
                },
                {
                    "id": "levels",
                    "label": "Nivel",
                    "options": [
                        {
                            "id": "option-licenta",
                            "label": "Licenta",
                            "count": level_counter.get("Licenta", 0),
                            "selected": False,
                            "description": "",
                        },
                        {
                            "id": "option-master",
                            "label": "Master",
                            "count": level_counter.get("Master", 0),
                            "selected": False,
                            "description": "",
                        },
                    ],
                },
                {
                    "id": "study-forms",
                    "label": "Forma invatamant",
                    "options": [
                        {
                            "id": "option-cu-frecventa-if",
                            "label": "Cu frecventa (IF)",
                            "count": study_form_counter.get("option-cu-frecventa-if", 0),
                            "selected": False,
                            "description": "",
                        },
                        {
                            "id": "option-la-distanta-id",
                            "label": "La distanta (ID)",
                            "count": study_form_counter.get("option-la-distanta-id", 0),
                            "selected": False,
                            "description": "",
                        },
                    ],
                },
                {
                    "id": "durations",
                    "label": "Durata studii",
                    "options": [
                        {
                            "id": option_id,
                            "label": f"{option_id.split('-')[1]} Ani",
                            "count": count,
                            "selected": False,
                            "description": "",
                        }
                        for option_id, count in sorted(duration_counter.items(), key=lambda item: item[0])
                    ],
                },
            ],
            "footer": {
                "resetLabel": "Reseteaza",
                "applyLabel": "Aplica Filtre",
                "selectedCount": 0,
            },
        },
    ]

    favorites = {
        "collections": [
            {
                "kind": "universities",
                "screenId": 9,
                "tabs": ["Universitati", "Facultati", "Programe"],
                "activeTab": "Universitati",
                "items": [],
                "addCardLabel": add_labels["universities"],
            },
            {
                "kind": "faculties",
                "screenId": 12,
                "tabs": ["Universitati", "Facultati", "Programe"],
                "activeTab": "Facultati",
                "items": [],
                "addCardLabel": add_labels["faculties"],
            },
            {
                "kind": "programs",
                "screenId": 8,
                "tabs": ["Universitati", "Facultati", "Programe"],
                "activeTab": "Programe",
                "items": [],
                "addCardLabel": add_labels["programs"],
            },
        ],
        "emptyState": empty_state,
    }

    source_root = "manual_scraping/merged/" + "+".join(
        f"{code}@{run_ids_by_code[code]}" for code in sorted(run_ids_by_code)
    )
    meta = {
        "sourceRoot": source_root,
        "screenCount": len(screen_copy),
        "deterministicOrder": "entity lists sorted by id; screen lists sorted by screenId",
        "counts": {
            "universities": len(universities),
            "faculties": len(faculties),
            "programs": len(programs),
            "filterScreens": len(filters),
            "favoriteCollections": len(favorites["collections"]),
        },
    }

    university_presentation: dict[str, dict[str, str]] = {}
    for code in university_codes:
        info = UNIVERSITY_INFO_BY_CODE[code]
        university_presentation[info.id] = {
            "mediaTone": info.media_tone,
            "typeOptionId": info.type_option_id,
        }

    faculty_presentation = {
        faculty["id"]: {"tone": "olive" if index % 2 else "accent"}
        for index, faculty in enumerate(faculties)
    }

    program_presentation: dict[str, dict[str, str]] = {}
    for index, program in enumerate(programs):
        tone = (
            "deepBlue"
            if "master" in normalize_for_search(program["level"])
            else ("olive" if index % 2 else "accent")
        )
        program_presentation[program["id"]] = {
            "tone": tone,
            "icon": pick_program_icon(program["name"], program["facultyName"], ""),
        }

    presentation = {
        "meta": {
            **meta,
            "deterministicOrder": "entity maps sorted by entityId",
        },
        "universities": dict(sorted(university_presentation.items(), key=lambda item: item[0])),
        "faculties": dict(sorted(faculty_presentation.items(), key=lambda item: item[0])),
        "programs": dict(sorted(program_presentation.items(), key=lambda item: item[0])),
    }

    return {
        "meta": meta,
        "universities": universities,
        "faculties": faculties,
        "programs": programs,
        "filters": filters,
        "favorites": favorites,
        "screenCopy": screen_copy,
        "presentation": presentation,
    }

def write_real_outputs(payload: dict[str, Any]) -> None:
    meta = payload["meta"]
    write_json(
        REAL_GENERATED_DIR / "universities.json",
        {"meta": meta, "universities": payload["universities"]},
    )
    write_json(
        REAL_GENERATED_DIR / "faculties.json",
        {"meta": meta, "faculties": payload["faculties"]},
    )
    write_json(
        REAL_GENERATED_DIR / "programs.json",
        {"meta": meta, "programs": payload["programs"]},
    )
    write_json(
        REAL_GENERATED_DIR / "filters.json",
        {"meta": meta, "filters": payload["filters"]},
    )
    write_json(
        REAL_GENERATED_DIR / "favorites.json",
        {"meta": meta, "favorites": payload["favorites"]},
    )
    write_json(
        REAL_GENERATED_DIR / "screen-copy.json",
        {"meta": meta, "screenCopy": payload["screenCopy"]},
    )
    write_json(REAL_GENERATED_DIR / "presentation.json", payload["presentation"])


def parse_university_codes(raw_value: str) -> list[str]:
    parsed = [normalize_text(token).lower() for token in raw_value.split(",")]
    result: list[str] = []
    seen: set[str] = set()
    for code in parsed:
        if not code or code in seen:
            continue
        result.append(code)
        seen.add(code)
    if not result:
        raise SystemExit("At least one university code must be provided via --universities.")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync merged manual scraping data into frontend real/generated JSON files."
    )
    parser.add_argument(
        "--universities",
        type=str,
        default=None,
        help=(
            "Optional comma-separated university codes, for example: ub,ase,utcn,uvt,upt. "
            "When omitted, the script uses all configured codes that have runs."
        ),
    )
    parser.add_argument(
        "--run",
        action="append",
        default=[],
        help="Optional run override in format <university_code>=<run_id>. Can be used multiple times.",
    )
    args = parser.parse_args()

    if args.universities:
        university_codes = parse_university_codes(args.universities)
    else:
        university_codes = resolve_default_university_codes()
    run_overrides = parse_run_overrides(args.run)
    run_ids_by_code = {
        code: resolve_run_id(code, run_overrides.get(code))
        for code in university_codes
    }

    payload = build_real_payload(university_codes, run_ids_by_code)
    write_real_outputs(payload)

    print("Merged real dataset synced.")
    print(f"Output directory: {REAL_GENERATED_DIR.relative_to(ROOT_DIR).as_posix()}")
    print(
        "Counts: "
        f"universities={payload['meta']['counts']['universities']}, "
        f"faculties={payload['meta']['counts']['faculties']}, "
        f"programs={payload['meta']['counts']['programs']}"
    )
    print("Resolved runs:")
    for code in sorted(run_ids_by_code):
        print(f"  - {code}: {run_ids_by_code[code]}")


if __name__ == "__main__":
    main()
