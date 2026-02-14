from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
REAL_GENERATED_DIR = ROOT_DIR / "src" / "data" / "real" / "generated"
MOCK_GENERATED_DIR = ROOT_DIR / "src" / "data" / "mock" / "generated"
RUNS_DIR = ROOT_DIR.parent / "manual scraping" / "data" / "runs"

UNIVERSITY_ID = "university-universitatea-din-bucuresti"
UNIVERSITY_NAME = "Universitatea din Bucuresti"
UNIVERSITY_CITY = "Bucuresti"
UNIVERSITY_LOCATION = "Bucuresti, Romania"
UNIVERSITY_OFFICIAL_URL = "https://unibuc.ro/"
DEFAULT_UNIBUC_LOGO_URL = (
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCIJxtOagqPgO5yVx98F1sbiXDb98ug1IpAkaa4XHL1nnx3VcFUytiHKGCGX3W2skFXleg3w0nLrl2jBXTb-5ihVwZw3y_Gnws5gz_dWcn0urk_Ei0i1VZJ8wC1hSvBQSu77N6s6TqEUBqE2zZx91kTS1yKn1Mi9tVBiTKaGeTORojYY_wfObZoUv9Z2DhtP7uHh8OjnuMQLDY_5T-65BBiQjElSSGDqlkPJ7J-L5a98-kMMSUKbuHZ6RY8c_jLOU_-9qVqJeSws0U"
)

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

MOJIBAKE_PATTERN = re.compile(r"[ÃÅÈÂ]")
CEDILLA_TO_COMMA_MAP = str.maketrans(
    {
        "Ş": "Ș",
        "ş": "ș",
        "Ţ": "Ț",
        "ţ": "ț",
    }
)


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


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def resolve_run_id(explicit_run_id: str | None) -> str:
    if explicit_run_id:
        run_dir = RUNS_DIR / explicit_run_id / "raw" / "ub" / "programs"
        if not run_dir.exists() or not any(run_dir.glob("*.json")):
            raise SystemExit(f"Run '{explicit_run_id}' does not contain UB program files.")
        return explicit_run_id

    if not RUNS_DIR.exists():
        raise SystemExit(f"Runs directory not found: {RUNS_DIR}")

    candidates: list[tuple[float, str]] = []
    for run_path in RUNS_DIR.iterdir():
        if not run_path.is_dir():
            continue
        ub_programs_dir = run_path / "raw" / "ub" / "programs"
        if ub_programs_dir.exists() and any(ub_programs_dir.glob("*.json")):
            candidates.append((run_path.stat().st_mtime, run_path.name))

    if not candidates:
        raise SystemExit("No UB runs found under manual scraping/data/runs.")

    candidates.sort(reverse=True)
    return candidates[0][1]


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
    if "master" in normalized:
        return "Master"
    return "Licenta"


def normalize_language(language: str) -> str:
    normalized = normalize_for_search(language)
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


def resolve_unibuc_logo() -> str:
    mock_universities_path = MOCK_GENERATED_DIR / "universities.json"
    if not mock_universities_path.exists():
        return DEFAULT_UNIBUC_LOGO_URL
    payload = read_json(mock_universities_path)
    universities = payload.get("universities", [])
    for university in universities:
        if university.get("id") == UNIVERSITY_ID and normalize_text(university.get("logoUrl", "")):
            return normalize_text(university["logoUrl"])
    return DEFAULT_UNIBUC_LOGO_URL


def load_mock_labels() -> tuple[dict[str, str], dict[str, Any], list[dict[str, Any]]]:
    favorites_path = MOCK_GENERATED_DIR / "favorites.json"
    screen_copy_path = MOCK_GENERATED_DIR / "screen-copy.json"

    favorites_payload = read_json(favorites_path).get("favorites", {})
    screen_copy = read_json(screen_copy_path).get("screenCopy", [])

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


def build_real_payload(run_id: str) -> dict[str, Any]:
    programs_dir = RUNS_DIR / run_id / "raw" / "ub" / "programs"
    program_paths = sorted(programs_dir.glob("*.json"), key=lambda path: path.name)
    if not program_paths:
        raise SystemExit(f"No program files found in {programs_dir}")

    raw_programs: list[dict[str, Any]] = [read_json(path) for path in program_paths]

    grouped_by_faculty: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for program in raw_programs:
        faculty_name = normalize_text(program.get("faculty_name")) or "Facultate Necunoscuta"
        grouped_by_faculty[faculty_name].append(program)

    faculty_records: list[dict[str, Any]] = []
    real_programs: list[dict[str, Any]] = []
    domain_option_counter: Counter[str] = Counter()
    language_counter: Counter[str] = Counter()
    level_counter: Counter[str] = Counter()
    study_form_counter: Counter[str] = Counter()
    duration_counter: Counter[str] = Counter()

    for faculty_name in sorted(grouped_by_faculty.keys()):
        programs = grouped_by_faculty[faculty_name]
        domains = [normalize_text(item.get("domain")) for item in programs if normalize_text(item.get("domain"))]
        domain = Counter(domains).most_common(1)[0][0] if domains else ""
        faculty_id = f"faculty-{slugify(faculty_name)}"
        faculty_source_url = next((normalize_text(item.get("source_url")) for item in programs if normalize_text(item.get("source_url"))), "")
        program_count = len(programs)

        option_ids = infer_domain_option_ids(domain, faculty_name)
        for option_id in option_ids:
            domain_option_counter[option_id] += program_count

        faculty_records.append(
            {
                "id": faculty_id,
                "name": faculty_name,
                "universityName": UNIVERSITY_NAME,
                "domain": domain,
                "programCountLabel": f"{program_count} Programe",
                "programCount": program_count,
                "icon": pick_faculty_icon(faculty_name, domain),
                "description": "",
                "locationLabel": UNIVERSITY_LOCATION,
                "officialUrl": faculty_source_url or UNIVERSITY_OFFICIAL_URL,
                "isFavorite": False,
                "sourceScreens": [3, 4],
            }
        )

        for program in sorted(programs, key=lambda item: normalize_text(item.get("name"))):
            program_name = normalize_text(program.get("name")) or "Program fara nume"
            level = normalize_level(normalize_text(program.get("level")))
            program_uid = normalize_text(program.get("uid"))[:8] or "unknown"
            program_id = f"program-{slugify(program_name)}-{slugify(faculty_name)}-{slugify(level)}-{program_uid}"

            duration_years = parse_int(program.get("duration_years"))
            study_mode = normalize_text(program.get("study_mode"))
            language = normalize_language(normalize_text(program.get("language")))
            credits_raw = normalize_text(program.get("credits"))
            admission_average = parse_float(program.get("last_admission_grade"))
            spots_budget = parse_int(program.get("spots_budget"))
            spots_tax = parse_int(program.get("spots_tax"))
            admission_method = normalize_text(program.get("admission_method"))
            admission_dates = normalize_text(program.get("admission_dates"))
            source_url = normalize_text(program.get("source_url"))
            domain_value = normalize_text(program.get("domain"))

            duration_parts: list[str] = []
            if duration_years is not None:
                duration_parts.append(f"{duration_years} ani")
            elif normalize_text(program.get("duration_years")):
                duration_parts.append(normalize_text(program["duration_years"]))
            if study_mode:
                duration_parts.append(study_mode)
            if language:
                duration_parts.append(language)
            duration_label = " • ".join(duration_parts) if duration_parts else "-"

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

            if language:
                language_counter[language] += 1
            level_counter[level] += 1
            if study_mode and normalize_for_search(study_mode) in {"id", "distanta"}:
                study_form_counter["option-la-distanta-id"] += 1
            else:
                study_form_counter["option-cu-frecventa-if"] += 1
            if duration_years is not None:
                duration_counter[f"option-{duration_years}-ani"] += 1

            real_programs.append(
                {
                    "id": program_id,
                    "name": program_name,
                    "level": level,
                    "durationLabel": duration_label,
                    "durationYears": duration_years,
                    "studyMode": study_mode,
                    "universityName": UNIVERSITY_NAME,
                    "facultyName": faculty_name,
                    "language": language,
                    "creditsLabel": credits_raw,
                    "admissionAverage": admission_average,
                    "descriptionParagraphs": description_paragraphs,
                    "careerOpportunities": [],
                    "officialUrl": source_url or UNIVERSITY_OFFICIAL_URL,
                    "isFavorite": False,
                    "sourceScreens": [6, 7],
                }
            )

    faculty_records.sort(key=lambda item: item["id"])
    real_programs.sort(key=lambda item: item["id"])

    add_labels, empty_state, screen_copy = load_mock_labels()
    unibuc_logo_url = resolve_unibuc_logo()

    universities = [
        {
            "id": UNIVERSITY_ID,
            "name": UNIVERSITY_NAME,
            "city": UNIVERSITY_CITY,
            "facultyCountLabel": f"{len(faculty_records)} Facultati",
            "facultyCount": len(faculty_records),
            "logoAlt": "Unibuc Logo",
            "logoUrl": unibuc_logo_url,
            "description": "Date reale extrase din rularea manual scraping pentru UniBuc.",
            "locationLabel": UNIVERSITY_LOCATION,
            "officialUrl": UNIVERSITY_OFFICIAL_URL,
            "isFavorite": False,
            "sourceScreens": [1, 2, 9],
        }
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
                    "options": [
                        {
                            "id": "option-bucuresti",
                            "label": "Bucuresti",
                            "count": len(universities),
                            "selected": False,
                            "description": "",
                        }
                    ],
                },
                {
                    "id": "university-types",
                    "label": "Tip Universitate",
                    "options": [
                        {
                            "id": "option-publica",
                            "label": "Publica",
                            "count": None,
                            "selected": False,
                            "description": "Buget & Taxa",
                        },
                        {
                            "id": "option-privata",
                            "label": "Privata",
                            "count": None,
                            "selected": False,
                            "description": "Taxa",
                        },
                    ],
                },
            ],
            "footer": {"resetLabel": "Reseteaza", "applyLabel": "Aplica Filtre", "selectedCount": 0},
        },
        {
            "id": "filter-faculties",
            "screenId": 5,
            "title": "Filtreaza facultati",
            "sections": [
                {
                    "id": "cities",
                    "label": "Cauta oras",
                    "options": [
                        {
                            "id": "option-bucuresti",
                            "label": "Bucuresti",
                            "count": len(faculty_records),
                            "selected": False,
                            "description": "",
                        }
                    ],
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
            "footer": {"resetLabel": "Reseteaza", "applyLabel": "Aplica Filtre", "selectedCount": 0},
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
            "footer": {"resetLabel": "Reseteaza", "applyLabel": "Aplica Filtre", "selectedCount": 0},
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

    meta = {
        "sourceRoot": f"manual_scraping/{run_id}",
        "screenCount": len(screen_copy),
        "deterministicOrder": "entity lists sorted by id; screen lists sorted by screenId",
        "counts": {
            "universities": len(universities),
            "faculties": len(faculty_records),
            "programs": len(real_programs),
            "filterScreens": len(filters),
            "favoriteCollections": len(favorites["collections"]),
        },
    }

    university_presentation = {
        UNIVERSITY_ID: {
            "mediaTone": "olive",
            "typeOptionId": "option-publica",
        }
    }

    faculty_presentation: dict[str, dict[str, str]] = {}
    for index, faculty in enumerate(faculty_records):
        faculty_presentation[faculty["id"]] = {
            "tone": "olive" if index % 2 else "accent",
        }

    program_presentation: dict[str, dict[str, str]] = {}
    for index, program in enumerate(real_programs):
        icon = pick_program_icon(program["name"], program["facultyName"], "")
        tone = "deepBlue" if "master" in normalize_for_search(program["level"]) else ("olive" if index % 2 else "accent")
        program_presentation[program["id"]] = {
            "tone": tone,
            "icon": icon,
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
        "faculties": faculty_records,
        "programs": real_programs,
        "filters": filters,
        "favorites": favorites,
        "screenCopy": screen_copy,
        "presentation": presentation,
    }


def write_real_outputs(payload: dict[str, Any]) -> None:
    meta = payload["meta"]
    write_json(REAL_GENERATED_DIR / "universities.json", {"meta": meta, "universities": payload["universities"]})
    write_json(REAL_GENERATED_DIR / "faculties.json", {"meta": meta, "faculties": payload["faculties"]})
    write_json(REAL_GENERATED_DIR / "programs.json", {"meta": meta, "programs": payload["programs"]})
    write_json(REAL_GENERATED_DIR / "filters.json", {"meta": meta, "filters": payload["filters"]})
    write_json(REAL_GENERATED_DIR / "favorites.json", {"meta": meta, "favorites": payload["favorites"]})
    write_json(REAL_GENERATED_DIR / "screen-copy.json", {"meta": meta, "screenCopy": payload["screenCopy"]})
    write_json(REAL_GENERATED_DIR / "presentation.json", payload["presentation"])


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync UniBuc real scraping data into frontend-generated JSON files.")
    parser.add_argument("--run-id", type=str, default=None, help="Optional explicit run id to use.")
    args = parser.parse_args()

    run_id = resolve_run_id(args.run_id)
    payload = build_real_payload(run_id)
    write_real_outputs(payload)

    print(f"UniBuc real dataset synced from run: {run_id}")
    print(f"Output directory: {REAL_GENERATED_DIR.relative_to(ROOT_DIR).as_posix()}")
    print(
        "Counts: "
        f"universities={payload['meta']['counts']['universities']}, "
        f"faculties={payload['meta']['counts']['faculties']}, "
        f"programs={payload['meta']['counts']['programs']}"
    )


if __name__ == "__main__":
    main()
