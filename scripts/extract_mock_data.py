from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from extraction_common import (
    MOCK_OUTPUT_PATH,
    ROOT_DIR,
    class_list,
    extract_float,
    extract_int,
    is_icon_tag,
    load_screen_documents,
    normalize_text,
    ordered_unique,
    relative_to_root,
    split_bullet_text,
    stable_entity_id,
    text_without_icons,
    write_json,
)

MOCK_GENERATED_DIR = ROOT_DIR / "src" / "data" / "mock" / "generated"
UNIVERSITIES_OUTPUT_PATH = MOCK_GENERATED_DIR / "universities.json"
FACULTIES_OUTPUT_PATH = MOCK_GENERATED_DIR / "faculties.json"
PROGRAMS_OUTPUT_PATH = MOCK_GENERATED_DIR / "programs.json"
FILTERS_OUTPUT_PATH = MOCK_GENERATED_DIR / "filters.json"
FAVORITES_OUTPUT_PATH = MOCK_GENERATED_DIR / "favorites.json"
SCREEN_COPY_OUTPUT_PATH = MOCK_GENERATED_DIR / "screen-copy.json"
PRESENTATION_OUTPUT_PATH = MOCK_GENERATED_DIR / "presentation.json"


def first_text_matching(container: Any, pattern: str) -> str:
    regex = re.compile(pattern, flags=re.IGNORECASE)
    for value in container.stripped_strings:
        text = normalize_text(str(value))
        if text and regex.search(text):
            return text
    return ""


def non_icon_span_texts(container: Any) -> list[str]:
    values: list[str] = []
    for span in container.find_all("span"):
        if is_icon_tag(span):
            continue
        if span.select_one(".material-icons, .material-symbols-outlined"):
            continue
        text = normalize_text(span.get_text(" ", strip=True))
        if text:
            values.append(text)
    return values


def merge_record(store: dict[str, dict[str, Any]], entity_id: str, record: dict[str, Any]) -> None:
    existing = store.get(entity_id)
    if not existing:
        store[entity_id] = record
        return

    for key, value in record.items():
        if key == "id":
            continue
        if key == "sourceScreens":
            existing[key] = sorted(set(existing.get(key, []) + value))
            continue
        if key == "isFavorite":
            existing[key] = bool(existing.get(key, False) or value)
            continue
        if isinstance(value, list):
            merged = existing.get(key, [])
            for item in value:
                if item not in merged:
                    merged.append(item)
            existing[key] = merged
            continue
        if existing.get(key) in (None, "", []):
            existing[key] = value


def parse_checkbox_options(section: Any) -> list[dict[str, Any]]:
    options: list[dict[str, Any]] = []
    for label in section.find_all("label"):
        name = ""
        count = None
        for span in label.find_all("span"):
            if is_icon_tag(span):
                continue
            value = normalize_text(span.get_text(" ", strip=True))
            if not value:
                continue
            if re.fullmatch(r"\d+", value):
                count = int(value)
            elif value.lower() != "check" and not name:
                name = value
        if not name:
            continue
        options.append(
            {
                "id": stable_entity_id("option", name),
                "label": name,
                "count": count,
                "selected": label.find("input", checked=True) is not None,
                "description": "",
            }
        )
    return options


def parse_filter_footer(soup: Any) -> dict[str, Any]:
    reset_label = ""
    apply_label = ""
    selected_count = None

    for button in soup.find_all("button"):
        label = text_without_icons(button)
        if not label:
            continue
        if "Resetează" in label and not reset_label:
            reset_label = label
        if "Aplică" in label:
            apply_label = re.sub(r"\s+\d+\s*$", "", label).strip()
            badge_value = ""
            for span in button.find_all("span"):
                if is_icon_tag(span):
                    continue
                text = normalize_text(span.get_text(" ", strip=True))
                if re.fullmatch(r"\d+", text):
                    badge_value = text
            selected_count = int(badge_value) if badge_value else selected_count

    return {
        "resetLabel": reset_label,
        "applyLabel": apply_label,
        "selectedCount": selected_count,
    }


def extract_tab_metadata(soup: Any) -> tuple[list[str], str]:
    tabs: list[str] = []
    active_tab = ""
    for button in soup.select("header button"):
        label = text_without_icons(button)
        if label not in {"Universități", "Facultăți", "Programe"}:
            continue
        tabs.append(label)
        if "shadow-tab" in " ".join(class_list(button)):
            active_tab = label
    return tabs, active_tab


def extract_add_card_label(soup: Any) -> str:
    for card in soup.select('main div[class*="border-dashed"]'):
        for span in card.find_all("span"):
            if is_icon_tag(span):
                continue
            label = normalize_text(span.get_text(" ", strip=True))
            if label:
                return label
    return ""


def parse_universities(screen_by_id: dict[int, Any]) -> list[dict[str, Any]]:
    store: dict[str, dict[str, Any]] = {}

    screen_one = screen_by_id.get(1)
    if screen_one:
        for card in screen_one.soup.select('main div[class*="bg-surface-card"]'):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            if not name:
                continue

            city = ""
            location_row = next(
                (
                    row
                    for row in card.find_all("div")
                    if "text-deep-blue/60" in " ".join(class_list(row)) and "text-xs" in " ".join(class_list(row))
                ),
                None,
            )
            if location_row:
                candidates = non_icon_span_texts(location_row)
                city = candidates[0] if candidates else ""

            faculty_count_label = first_text_matching(card, r"\d+\s+Facult")
            logo = card.find("img")
            entity_id = stable_entity_id("university", name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "city": city,
                    "facultyCountLabel": faculty_count_label,
                    "facultyCount": extract_int(faculty_count_label),
                    "logoAlt": normalize_text(logo.get("alt", "")) if logo else "",
                    "logoUrl": normalize_text(logo.get("src", "")) if logo else "",
                    "description": "",
                    "locationLabel": "",
                    "isFavorite": False,
                    "sourceScreens": [1],
                },
            )

    screen_two = screen_by_id.get(2)
    if screen_two:
        detail_container = screen_two.soup.select_one("div.pt-12")
        if detail_container:
            heading = detail_container.find("h1")
            if heading:
                name = normalize_text(heading.get_text(" ", strip=True))
                location_label = first_text_matching(detail_container, r"România")
                city = normalize_text(location_label.split(",")[0]) if location_label else ""
                description_node = detail_container.find("p")
                description = normalize_text(description_node.get_text(" ", strip=True)) if description_node else ""
                faculty_total_label = first_text_matching(screen_two.soup, r"\d+\s+total")
                entity_id = stable_entity_id("university", name)
                merge_record(
                    store,
                    entity_id,
                    {
                        "id": entity_id,
                        "name": name,
                        "city": city,
                        "facultyCountLabel": faculty_total_label,
                        "facultyCount": extract_int(faculty_total_label),
                        "logoAlt": "",
                        "logoUrl": "",
                        "description": description,
                        "locationLabel": location_label,
                        "isFavorite": False,
                        "sourceScreens": [2],
                    },
                )

    screen_nine = screen_by_id.get(9)
    if screen_nine:
        for card in screen_nine.soup.select("main div.group"):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            if not name:
                continue

            city = ""
            for span in card.find_all("span"):
                if is_icon_tag(span):
                    continue
                value = normalize_text(span.get_text(" ", strip=True))
                if not value or value == name:
                    continue
                parent_classes = " ".join(class_list(span.parent))
                if "text-[10px]" in parent_classes or "uppercase" in parent_classes:
                    city = value
                    break

            entity_id = stable_entity_id("university", name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "city": city,
                    "facultyCountLabel": "",
                    "facultyCount": None,
                    "logoAlt": "",
                    "logoUrl": "",
                    "description": "",
                    "locationLabel": "",
                    "isFavorite": True,
                    "sourceScreens": [9],
                },
            )

    return sorted(store.values(), key=lambda item: item["id"])


def parse_faculties(screen_by_id: dict[int, Any]) -> list[dict[str, Any]]:
    store: dict[str, dict[str, Any]] = {}

    screen_three = screen_by_id.get(3)
    if screen_three:
        for card in screen_three.soup.select('main div[class*="bg-surface-card"]'):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            if not name:
                continue

            span_values = non_icon_span_texts(card)
            program_count_label = next((value for value in span_values if re.search(r"\d+\s+Programe", value, re.I)), "")
            remaining = [value for value in span_values if value != program_count_label]
            university_name = remaining[0] if remaining else ""
            domain = remaining[1] if len(remaining) > 1 else ""

            icon = card.find("span", class_=lambda value: value and "material-icons" in value)
            icon_name = normalize_text(icon.get_text(" ", strip=True)) if icon else ""

            entity_id = stable_entity_id("faculty", name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "universityName": university_name,
                    "domain": domain,
                    "programCountLabel": program_count_label,
                    "programCount": extract_int(program_count_label),
                    "icon": icon_name,
                    "description": "",
                    "locationLabel": "",
                    "isFavorite": False,
                    "sourceScreens": [3],
                },
            )

    screen_two = screen_by_id.get(2)
    if screen_two:
        university_name = ""
        heading = screen_two.soup.find("h1")
        if heading:
            university_name = normalize_text(heading.get_text(" ", strip=True))
        for card in screen_two.soup.select('main div[class*="bg-surface-card"]'):
            subheading = card.find("h3")
            if not subheading:
                continue
            name = normalize_text(subheading.get_text(" ", strip=True))
            description_node = card.find("p")
            description = normalize_text(description_node.get_text(" ", strip=True)) if description_node else ""
            program_count_label = first_text_matching(card, r"\d+\s+programe")
            entity_id = stable_entity_id("faculty", name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "universityName": university_name,
                    "domain": "",
                    "programCountLabel": program_count_label,
                    "programCount": extract_int(program_count_label),
                    "icon": "",
                    "description": description,
                    "locationLabel": "",
                    "isFavorite": False,
                    "sourceScreens": [2],
                },
            )

    screen_four = screen_by_id.get(4)
    if screen_four:
        heading = screen_four.soup.find("h1")
        if heading:
            name = normalize_text(heading.get_text(" ", strip=True))
            university_name = first_text_matching(screen_four.soup, r"Universitatea")
            location_label = first_text_matching(screen_four.soup, r"Cluj")
            program_total_label = first_text_matching(screen_four.soup, r"\d+\s+total")
            entity_id = stable_entity_id("faculty", name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "universityName": university_name,
                    "domain": "",
                    "programCountLabel": program_total_label,
                    "programCount": extract_int(program_total_label),
                    "icon": "",
                    "description": "",
                    "locationLabel": location_label,
                    "isFavorite": False,
                    "sourceScreens": [4],
                },
            )

    screen_twelve = screen_by_id.get(12)
    if screen_twelve:
        for card in screen_twelve.soup.select("main div.group"):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            if not name:
                continue

            university_name = ""
            for span in card.find_all("span"):
                if is_icon_tag(span):
                    continue
                value = normalize_text(span.get_text(" ", strip=True))
                if not value or value == name:
                    continue
                parent_classes = " ".join(class_list(span.parent))
                if "text-[10px]" in parent_classes or "uppercase" in parent_classes:
                    university_name = value
                    break

            entity_id = stable_entity_id("faculty", name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "universityName": university_name,
                    "domain": "",
                    "programCountLabel": "",
                    "programCount": None,
                    "icon": "",
                    "description": "",
                    "locationLabel": "",
                    "isFavorite": True,
                    "sourceScreens": [12],
                },
            )

    return sorted(store.values(), key=lambda item: item["id"])


def parse_programs(screen_by_id: dict[int, Any]) -> list[dict[str, Any]]:
    store: dict[str, dict[str, Any]] = {}

    screen_six = screen_by_id.get(6)
    if screen_six:
        for card in screen_six.soup.select('main div[class*="bg-surface-card"]'):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            if not name:
                continue

            level = first_text_matching(card, r"Licen|Master")
            institution = ""
            duration_label = ""
            for row in card.find_all("div"):
                icon = row.find("span", class_=lambda value: value and "material-icons" in value)
                if not icon:
                    continue
                icon_name = normalize_text(icon.get_text(" ", strip=True))
                values = non_icon_span_texts(row)
                if not values:
                    continue
                if icon_name == "school":
                    institution = values[-1]
                if icon_name == "schedule":
                    duration_label = values[-1]

            faculty_label = ""
            for span in card.find_all("span"):
                if is_icon_tag(span):
                    continue
                value = normalize_text(span.get_text(" ", strip=True))
                if not value:
                    continue
                if value in {name, level, institution, duration_label}:
                    continue
                if re.search(r"Ani", value, re.IGNORECASE):
                    continue
                if len(value) <= 40:
                    faculty_label = value

            duration_parts = split_bullet_text(duration_label)
            study_mode = duration_parts[1] if len(duration_parts) > 1 else ""
            entity_id = stable_entity_id("program", name, institution)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "level": level,
                    "durationLabel": duration_label,
                    "durationYears": extract_int(duration_label),
                    "studyMode": study_mode,
                    "universityName": institution,
                    "facultyName": faculty_label,
                    "language": "",
                    "creditsLabel": "",
                    "admissionAverage": None,
                    "descriptionParagraphs": [],
                    "careerOpportunities": [],
                    "isFavorite": False,
                    "sourceScreens": [6],
                },
            )

    screen_four = screen_by_id.get(4)
    if screen_four:
        university_name = first_text_matching(screen_four.soup, r"Universitatea")
        faculty_name = ""
        heading = screen_four.soup.find("h1")
        if heading:
            faculty_name = normalize_text(heading.get_text(" ", strip=True))

        for card in screen_four.soup.select('main div[class*="bg-surface-card"]'):
            subheading = card.find("h3")
            if not subheading:
                continue
            name = normalize_text(subheading.get_text(" ", strip=True))
            summary_node = card.find("p")
            summary = normalize_text(summary_node.get_text(" ", strip=True)) if summary_node else ""
            parts = split_bullet_text(summary)
            language = parts[2] if len(parts) > 2 else ""
            study_mode = parts[1] if len(parts) > 1 else ""
            level = first_text_matching(card, r"Licen|Master")
            credits_label = first_text_matching(card, r"ECTS")
            mode_short = first_text_matching(card, r"\bIF\b|\bID\b")
            entity_id = stable_entity_id("program", name, university_name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "level": level,
                    "durationLabel": summary,
                    "durationYears": extract_int(summary),
                    "studyMode": mode_short or study_mode,
                    "universityName": university_name,
                    "facultyName": faculty_name,
                    "language": language,
                    "creditsLabel": credits_label,
                    "admissionAverage": None,
                    "descriptionParagraphs": [],
                    "careerOpportunities": [],
                    "isFavorite": False,
                    "sourceScreens": [4],
                },
            )

    screen_eight = screen_by_id.get(8)
    if screen_eight:
        for card in screen_eight.soup.select('main div[class*="bg-surface-card"]'):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            subtitle_node = card.find("p")
            subtitle = normalize_text(subtitle_node.get_text(" ", strip=True)) if subtitle_node else ""
            subtitle_parts = split_bullet_text(subtitle)
            faculty_name = subtitle_parts[0] if subtitle_parts else ""
            university_name = subtitle_parts[1] if len(subtitle_parts) > 1 else ""
            level = first_text_matching(card, r"Licen|Master")
            duration_label = first_text_matching(card, r"\d+\s+Ani")

            entity_id = stable_entity_id("program", name, university_name or faculty_name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "level": level,
                    "durationLabel": duration_label,
                    "durationYears": extract_int(duration_label),
                    "studyMode": "",
                    "universityName": university_name,
                    "facultyName": faculty_name,
                    "language": "",
                    "creditsLabel": "",
                    "admissionAverage": None,
                    "descriptionParagraphs": [],
                    "careerOpportunities": [],
                    "isFavorite": True,
                    "sourceScreens": [8],
                },
            )

    screen_seven = screen_by_id.get(7)
    if screen_seven:
        heading = screen_seven.soup.find("h1")
        if heading:
            name = normalize_text(heading.get_text(" ", strip=True))
            leading_none = screen_seven.soup.select_one("div.leading-none")
            institution_name = ""
            faculty_name = ""
            if leading_none:
                spans = [normalize_text(span.get_text(" ", strip=True)) for span in leading_none.find_all("span")]
                institution_name = spans[0] if spans else ""
                faculty_name = spans[1] if len(spans) > 1 else ""

            level = first_text_matching(screen_seven.soup, r"LICEN")
            metrics: dict[str, str] = {}
            metrics_grid = screen_seven.soup.select_one("main div.grid")
            if metrics_grid:
                for card in metrics_grid.find_all("div", recursive=False):
                    paragraphs = [normalize_text(node.get_text(" ", strip=True)) for node in card.find_all("p")]
                    if len(paragraphs) < 2:
                        continue
                    label = paragraphs[0]
                    value = paragraphs[1]
                    if label and value:
                        metrics[label] = value

            about_section = None
            career_section = None
            for section in screen_seven.soup.select('main div[class*="rounded-3xl"]'):
                heading_text = normalize_text(text_without_icons(section.find("h3"))) if section.find("h3") else ""
                if "Despre program" in heading_text:
                    about_section = section
                if "Oportunități carieră" in heading_text:
                    career_section = section

            description_paragraphs: list[str] = []
            if about_section:
                description_paragraphs = [
                    normalize_text(node.get_text(" ", strip=True))
                    for node in about_section.find_all("p")
                    if normalize_text(node.get_text(" ", strip=True))
                ]

            career_opportunities: list[str] = []
            if career_section:
                career_opportunities = ordered_unique(
                    [
                        normalize_text(span.get_text(" ", strip=True))
                        for span in career_section.select("div.flex.flex-wrap span")
                        if normalize_text(span.get_text(" ", strip=True))
                    ]
                )

            duration_label = ""
            credits_label = ""
            admission_average = None
            for metric_label, metric_value in metrics.items():
                if "Durată" in metric_label:
                    duration_label = metric_value
                if "Credite" in metric_label:
                    credits_label = metric_value
                if "Media Admitere" in metric_label:
                    admission_average = extract_float(metric_value)

            entity_id = stable_entity_id("program", name, institution_name)
            merge_record(
                store,
                entity_id,
                {
                    "id": entity_id,
                    "name": name,
                    "level": level,
                    "durationLabel": duration_label,
                    "durationYears": extract_int(duration_label),
                    "studyMode": metrics.get("Formă", ""),
                    "universityName": institution_name,
                    "facultyName": faculty_name,
                    "language": "",
                    "creditsLabel": credits_label,
                    "admissionAverage": admission_average,
                    "descriptionParagraphs": description_paragraphs,
                    "careerOpportunities": career_opportunities,
                    "isFavorite": False,
                    "sourceScreens": [7],
                },
            )

    return sorted(store.values(), key=lambda item: item["id"])


def parse_filters(screen_by_id: dict[int, Any]) -> list[dict[str, Any]]:
    filters: list[dict[str, Any]] = []

    screen_five = screen_by_id.get(5)
    if screen_five:
        sections = screen_five.soup.select("main section")
        city_options = parse_checkbox_options(sections[0]) if sections else []
        domain_options: list[dict[str, Any]] = []
        if len(sections) > 1:
            for button in sections[1].find_all("button"):
                label = text_without_icons(button)
                if not label:
                    continue
                class_blob = " ".join(class_list(button))
                domain_options.append(
                    {
                        "id": stable_entity_id("option", label),
                        "label": label,
                        "count": None,
                        "selected": "bg-terracotta" in class_blob and "text-white" in class_blob,
                        "description": "",
                    }
                )
        filters.append(
            {
                "id": "filter-faculties",
                "screenId": 5,
                "title": first_text_matching(screen_five.soup, r"Filtrează facultăți"),
                "sections": [
                    {"id": "cities", "label": first_text_matching(sections[0], r"oraș"), "options": city_options}
                    if sections
                    else {"id": "cities", "label": "", "options": []},
                    {"id": "domains", "label": first_text_matching(sections[1], r"Domenii"), "options": domain_options}
                    if len(sections) > 1
                    else {"id": "domains", "label": "", "options": []},
                ],
                "footer": parse_filter_footer(screen_five.soup),
            }
        )

    screen_ten = screen_by_id.get(10)
    if screen_ten:
        sections = screen_ten.soup.select("main section")
        city_options = parse_checkbox_options(sections[0]) if sections else []
        type_options: list[dict[str, Any]] = []
        if len(sections) > 1:
            for button in sections[1].find_all("button"):
                class_blob = " ".join(class_list(button))
                name_node = button.find("span", class_=lambda value: value and "font-bold" in value and "block" in value)
                name = normalize_text(name_node.get_text(" ", strip=True)) if name_node else ""
                description_node = button.find("span", class_=lambda value: value and "text-xs" in value)
                description = normalize_text(description_node.get_text(" ", strip=True)) if description_node else ""
                if not name:
                    parts = [part for part in text_without_icons(button).split(" ") if part]
                    name = parts[0] if parts else ""
                if not name:
                    continue
                selected = "bg-olive/10" in class_blob or bool(
                    button.find("div", class_=lambda value: value and "bg-olive" in value and "rounded-full" in value)
                )
                type_options.append(
                    {
                        "id": stable_entity_id("option", name),
                        "label": name,
                        "count": None,
                        "selected": selected,
                        "description": description,
                    }
                )
        filters.append(
            {
                "id": "filter-universities",
                "screenId": 10,
                "title": first_text_matching(screen_ten.soup, r"Filtrează universități"),
                "sections": [
                    {"id": "cities", "label": first_text_matching(sections[0], r"Oraș"), "options": city_options}
                    if sections
                    else {"id": "cities", "label": "", "options": []},
                    {
                        "id": "university-types",
                        "label": first_text_matching(sections[1], r"Tip Universitate"),
                        "options": type_options,
                    }
                    if len(sections) > 1
                    else {"id": "university-types", "label": "", "options": []},
                ],
                "footer": parse_filter_footer(screen_ten.soup),
            }
        )

    screen_eleven = screen_by_id.get(11)
    if screen_eleven:
        sections = screen_eleven.soup.select("main section")
        language_options: list[dict[str, Any]] = []
        level_options: list[dict[str, Any]] = []
        format_options: list[dict[str, Any]] = []
        duration_options: list[dict[str, Any]] = []

        if sections:
            for button in sections[0].find_all("button"):
                class_blob = " ".join(class_list(button))
                label = ""
                count = None
                for span in button.find_all("span"):
                    if is_icon_tag(span):
                        continue
                    value = normalize_text(span.get_text(" ", strip=True))
                    if not value:
                        continue
                    if re.fullmatch(r"\d+", value):
                        count = int(value)
                    elif not label:
                        label = value
                if not label:
                    continue
                language_options.append(
                    {
                        "id": stable_entity_id("option", label),
                        "label": label,
                        "count": count,
                        "selected": "bg-terracotta" in class_blob and "text-white" in class_blob,
                        "description": "",
                    }
                )

        if len(sections) > 1:
            for button in sections[1].find_all("button"):
                class_blob = " ".join(class_list(button))
                label_node = button.find("span", class_=lambda value: value and "block" in value and "font-bold" in value)
                label = normalize_text(label_node.get_text(" ", strip=True)) if label_node else ""
                if not label:
                    continue
                level_options.append(
                    {
                        "id": stable_entity_id("option", label),
                        "label": label,
                        "count": None,
                        "selected": "border-deep-blue" in class_list(button),
                        "description": "",
                    }
                )

        if len(sections) > 2:
            for button in sections[2].find_all("button"):
                class_blob = " ".join(class_list(button))
                label = text_without_icons(button)
                if not label:
                    continue
                format_options.append(
                    {
                        "id": stable_entity_id("option", label),
                        "label": label,
                        "count": None,
                        "selected": "bg-olive" in class_blob and "text-white" in class_blob,
                        "description": "",
                    }
                )

        if len(sections) > 3:
            for button in sections[3].find_all("button"):
                class_blob = " ".join(class_list(button))
                label = text_without_icons(button)
                if not label:
                    continue
                duration_options.append(
                    {
                        "id": stable_entity_id("option", label),
                        "label": label,
                        "count": None,
                        "selected": "bg-terracotta" in class_blob and "text-white" in class_blob,
                        "description": "",
                    }
                )

        filters.append(
            {
                "id": "filter-programs",
                "screenId": 11,
                "title": first_text_matching(screen_eleven.soup, r"Filtrează programe"),
                "sections": [
                    {"id": "languages", "label": first_text_matching(sections[0], r"Limb"), "options": language_options}
                    if sections
                    else {"id": "languages", "label": "", "options": []},
                    {"id": "levels", "label": first_text_matching(sections[1], r"Nivel"), "options": level_options}
                    if len(sections) > 1
                    else {"id": "levels", "label": "", "options": []},
                    {"id": "study-forms", "label": first_text_matching(sections[2], r"Formă"), "options": format_options}
                    if len(sections) > 2
                    else {"id": "study-forms", "label": "", "options": []},
                    {"id": "durations", "label": first_text_matching(sections[3], r"Durată"), "options": duration_options}
                    if len(sections) > 3
                    else {"id": "durations", "label": "", "options": []},
                ],
                "footer": parse_filter_footer(screen_eleven.soup),
            }
        )

    return sorted(filters, key=lambda item: item["screenId"])


def parse_favorites(
    screen_by_id: dict[int, Any],
    universities: list[dict[str, Any]],
    faculties: list[dict[str, Any]],
    programs: list[dict[str, Any]],
) -> dict[str, Any]:
    university_by_name = {normalize_text(item["name"]): item["id"] for item in universities}
    faculty_by_name = {normalize_text(item["name"]): item["id"] for item in faculties}
    program_by_pair = {
        (normalize_text(item["name"]), normalize_text(item.get("universityName", ""))): item["id"] for item in programs
    }

    collections: list[dict[str, Any]] = []

    screen_nine = screen_by_id.get(9)
    if screen_nine:
        tabs, active_tab = extract_tab_metadata(screen_nine.soup)
        items: list[dict[str, Any]] = []
        for card in screen_nine.soup.select("main div.group"):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            city = ""
            for span in card.find_all("span"):
                if is_icon_tag(span):
                    continue
                value = normalize_text(span.get_text(" ", strip=True))
                if not value or value == name:
                    continue
                parent_classes = " ".join(class_list(span.parent))
                if "text-[10px]" in parent_classes or "uppercase" in parent_classes:
                    city = value
                    break
            items.append({"entityId": university_by_name.get(name, stable_entity_id("university", name)), "name": name, "subtitle": city})
        collections.append(
            {
                "kind": "universities",
                "screenId": 9,
                "tabs": tabs,
                "activeTab": active_tab,
                "items": items,
                "addCardLabel": extract_add_card_label(screen_nine.soup),
            }
        )

    screen_twelve = screen_by_id.get(12)
    if screen_twelve:
        tabs, active_tab = extract_tab_metadata(screen_twelve.soup)
        items: list[dict[str, Any]] = []
        for card in screen_twelve.soup.select("main div.group"):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            subtitle = ""
            for span in card.find_all("span"):
                if is_icon_tag(span):
                    continue
                value = normalize_text(span.get_text(" ", strip=True))
                if not value or value == name:
                    continue
                parent_classes = " ".join(class_list(span.parent))
                if "text-[10px]" in parent_classes or "uppercase" in parent_classes:
                    subtitle = value
                    break
            items.append({"entityId": faculty_by_name.get(name, stable_entity_id("faculty", name)), "name": name, "subtitle": subtitle})
        collections.append(
            {
                "kind": "faculties",
                "screenId": 12,
                "tabs": tabs,
                "activeTab": active_tab,
                "items": items,
                "addCardLabel": extract_add_card_label(screen_twelve.soup),
            }
        )

    screen_eight = screen_by_id.get(8)
    if screen_eight:
        tabs, active_tab = extract_tab_metadata(screen_eight.soup)
        items: list[dict[str, Any]] = []
        for card in screen_eight.soup.select('main div[class*="bg-surface-card"]'):
            heading = card.find("h2")
            if not heading:
                continue
            name = normalize_text(heading.get_text(" ", strip=True))
            subtitle_node = card.find("p")
            subtitle = normalize_text(subtitle_node.get_text(" ", strip=True)) if subtitle_node else ""
            subtitle_parts = split_bullet_text(subtitle)
            university_name = subtitle_parts[1] if len(subtitle_parts) > 1 else ""
            duration = first_text_matching(card, r"\d+\s+Ani")
            level = first_text_matching(card, r"Licen|Master")
            items.append(
                {
                    "entityId": program_by_pair.get((name, university_name), stable_entity_id("program", name, university_name)),
                    "name": name,
                    "subtitle": subtitle,
                    "level": level,
                    "durationLabel": duration,
                }
            )
        collections.append(
            {
                "kind": "programs",
                "screenId": 8,
                "tabs": tabs,
                "activeTab": active_tab,
                "items": items,
                "addCardLabel": extract_add_card_label(screen_eight.soup),
            }
        )

    empty_state = {"screenId": 13, "title": "", "description": "", "ctaLabel": ""}
    screen_thirteen = screen_by_id.get(13)
    if screen_thirteen:
        heading = screen_thirteen.soup.find("h2")
        description = screen_thirteen.soup.select_one("main p")
        cta_button = next(
            (button for button in screen_thirteen.soup.find_all("button") if "Explorează acum" in text_without_icons(button)),
            None,
        )
        empty_state = {
            "screenId": 13,
            "title": normalize_text(heading.get_text(" ", strip=True)) if heading else "",
            "description": normalize_text(description.get_text(" ", strip=True)) if description else "",
            "ctaLabel": text_without_icons(cta_button) if cta_button else "",
        }

    return {"collections": sorted(collections, key=lambda item: item["screenId"]), "emptyState": empty_state}


def parse_screen_copy(screen_by_id: dict[int, Any]) -> list[dict[str, Any]]:
    snapshots: list[dict[str, Any]] = []
    for screen_id in sorted(screen_by_id):
        document = screen_by_id[screen_id]
        headings = ordered_unique(
            normalize_text(node.get_text(" ", strip=True))
            for node in document.soup.find_all(re.compile(r"^h[1-3]$"))
        )
        paragraphs = ordered_unique(normalize_text(node.get_text(" ", strip=True)) for node in document.soup.find_all("p"))
        placeholders = ordered_unique(
            normalize_text(node.get("placeholder", ""))
            for node in document.soup.find_all("input")
            if node.get("placeholder")
        )
        button_labels = ordered_unique(
            text_without_icons(button)
            for button in document.soup.find_all("button")
            if text_without_icons(button)
        )
        badge_texts = ordered_unique(
            normalize_text(span.get_text(" ", strip=True))
            for span in document.soup.find_all("span")
            if not is_icon_tag(span)
            and normalize_text(span.get_text(" ", strip=True))
            and (
                re.search(r"\d", normalize_text(span.get_text(" ", strip=True)))
                or re.search(
                    r"Facult|Program|total|Ani|ECTS|Licen|Master|Favorite|Explorează|Filtre",
                    normalize_text(span.get_text(" ", strip=True)),
                    re.IGNORECASE,
                )
            )
        )
        image_alts = ordered_unique(
            normalize_text(image.get("alt", ""))
            for image in document.soup.find_all("img")
            if image.get("alt")
        )

        snapshots.append(
            {
                "screenId": screen_id,
                "title": normalize_text(document.soup.title.get_text(" ", strip=True)) if document.soup.title else "",
                "headings": headings,
                "paragraphs": paragraphs,
                "inputPlaceholders": placeholders,
                "buttonLabels": button_labels,
                "badgeTexts": badge_texts,
                "imageAlts": image_alts,
            }
        )

    return snapshots


def build_presentation_metadata(
    meta: dict[str, Any],
    universities: list[dict[str, Any]],
    faculties: list[dict[str, Any]],
    programs: list[dict[str, Any]],
) -> dict[str, Any]:
    university_media_tone_by_id: dict[str, str] = {
        "university-universitatea-babes-bolyai": "accent",
        "university-universitatea-din-bucuresti": "olive",
        "university-universitatea-de-vest": "accent",
    }
    university_type_option_by_id: dict[str, str] = {
        "university-universitatea-babes-bolyai": "option-privata",
        "university-universitatea-din-bucuresti": "option-publica",
        "university-universitatea-de-vest": "option-publica",
    }
    faculty_tone_by_id: dict[str, str] = {
        "faculty-facultatea-de-istorie": "accent",
        "faculty-facultatea-de-biologie": "olive",
        "faculty-facultatea-de-drept": "accent",
        "faculty-arte-si-design": "olive",
    }
    program_style_by_id: dict[str, dict[str, str]] = {
        "program-cibernetica-economica-ase-bucuresti": {"tone": "accent", "icon": "analytics"},
        "program-drept-ubb-cluj": {"tone": "olive", "icon": "gavel"},
        "program-psihologie-clinica-univ-din-bucuresti": {"tone": "deepBlue", "icon": "psychology"},
        "program-informatica-uvt-timisoara": {"tone": "accent", "icon": "code"},
    }

    university_payload: dict[str, Any] = {}
    for university in universities:
        entity_id = university["id"]
        university_payload[entity_id] = {
            "mediaTone": university_media_tone_by_id.get(entity_id, "accent"),
            "typeOptionId": university_type_option_by_id.get(entity_id),
        }

    faculty_payload: dict[str, Any] = {}
    for faculty in faculties:
        entity_id = faculty["id"]
        faculty_payload[entity_id] = {
            "tone": faculty_tone_by_id.get(entity_id, "accent"),
        }

    program_payload: dict[str, Any] = {}
    for program in programs:
        entity_id = program["id"]
        style = program_style_by_id.get(entity_id, {"tone": "accent", "icon": "code"})
        program_payload[entity_id] = {
            "tone": style["tone"],
            "icon": style["icon"],
        }

    return {
        "meta": {
            **meta,
            "deterministicOrder": "entity maps sorted by entityId",
        },
        "universities": dict(sorted(university_payload.items(), key=lambda item: item[0])),
        "faculties": dict(sorted(faculty_payload.items(), key=lambda item: item[0])),
        "programs": dict(sorted(program_payload.items(), key=lambda item: item[0])),
    }


def build_mock_payload() -> dict[str, Any]:
    documents = load_screen_documents()
    screen_by_id = {document.screen_id: document for document in documents}

    universities = parse_universities(screen_by_id)
    faculties = parse_faculties(screen_by_id)
    programs = parse_programs(screen_by_id)
    filters = parse_filters(screen_by_id)
    favorites = parse_favorites(screen_by_id, universities, faculties, programs)
    screen_copy = parse_screen_copy(screen_by_id)
    meta = {
        "sourceRoot": "stitch_roadmitere",
        "screenCount": len(documents),
        "deterministicOrder": "entity lists sorted by id; screen lists sorted by screenId",
        "counts": {
            "universities": len(universities),
            "faculties": len(faculties),
            "programs": len(programs),
            "filterScreens": len(filters),
            "favoriteCollections": len(favorites["collections"]),
        },
    }
    presentation = build_presentation_metadata(meta, universities, faculties, programs)

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


def write_mock_outputs(payload: dict[str, Any]) -> None:
    write_json(MOCK_OUTPUT_PATH, payload)
    shared_meta = payload["meta"]

    write_json(UNIVERSITIES_OUTPUT_PATH, {"meta": shared_meta, "universities": payload["universities"]})
    write_json(FACULTIES_OUTPUT_PATH, {"meta": shared_meta, "faculties": payload["faculties"]})
    write_json(PROGRAMS_OUTPUT_PATH, {"meta": shared_meta, "programs": payload["programs"]})
    write_json(FILTERS_OUTPUT_PATH, {"meta": shared_meta, "filters": payload["filters"]})
    write_json(FAVORITES_OUTPUT_PATH, {"meta": shared_meta, "favorites": payload["favorites"]})
    write_json(SCREEN_COPY_OUTPUT_PATH, {"meta": shared_meta, "screenCopy": payload["screenCopy"]})
    write_json(PRESENTATION_OUTPUT_PATH, payload["presentation"])


def extract_mock_data(write_output: bool = True) -> dict[str, Any]:
    payload = build_mock_payload()
    if write_output:
        write_mock_outputs(payload)
    return payload


def main() -> None:
    payload = extract_mock_data(write_output=True)
    deterministic_order_ok = (
        payload["universities"] == sorted(payload["universities"], key=lambda item: item["id"])
        and payload["faculties"] == sorted(payload["faculties"], key=lambda item: item["id"])
        and payload["programs"] == sorted(payload["programs"], key=lambda item: item["id"])
        and [item["screenId"] for item in payload["screenCopy"]]
        == sorted(item["screenId"] for item in payload["screenCopy"])
    )

    print(f"Mock data generated: {relative_to_root(MOCK_OUTPUT_PATH)}")
    print(
        "Mock data summary: "
        f"universities={len(payload['universities'])}, "
        f"faculties={len(payload['faculties'])}, "
        f"programs={len(payload['programs'])}, "
        f"filterScreens={len(payload['filters'])}, "
        f"favoriteCollections={len(payload['favorites']['collections'])}, "
        f"screenCopyEntries={len(payload['screenCopy'])}"
    )
    print(f"Deterministic output order confirmed: {'yes' if deterministic_order_ok else 'no'}")
    print("Additional generated files:")
    for path in [
        UNIVERSITIES_OUTPUT_PATH,
        FACULTIES_OUTPUT_PATH,
        PROGRAMS_OUTPUT_PATH,
        FILTERS_OUTPUT_PATH,
        FAVORITES_OUTPUT_PATH,
        SCREEN_COPY_OUTPUT_PATH,
        PRESENTATION_OUTPUT_PATH,
    ]:
        print(f"- {relative_to_root(path)}")


if __name__ == "__main__":
    main()
