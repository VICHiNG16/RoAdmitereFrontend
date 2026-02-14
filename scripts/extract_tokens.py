from __future__ import annotations

import re
from typing import Any

from extraction_common import (
    TOKENS_OUTPUT_PATH,
    class_list,
    load_screen_documents,
    relative_to_root,
    write_json,
)


def extract_js_object_block(source: str, key: str) -> str:
    match = re.search(rf"\b{re.escape(key)}\s*:\s*{{", source)
    if not match:
        return ""

    start = match.end() - 1
    depth = 0
    quote: str | None = None
    escaped = False

    for index in range(start, len(source)):
        char = source[index]

        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue

        if char in ("'", '"'):
            quote = char
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return source[start + 1 : index]

    return ""


def parse_string_map(block: str) -> list[tuple[str, str]]:
    return [(name.strip(), value.strip()) for name, value in re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', block)]


def parse_font_family_map(block: str) -> list[tuple[str, tuple[str, ...]]]:
    values: list[tuple[str, tuple[str, ...]]] = []
    for family_name, family_value_blob in re.findall(r'"([^"]+)"\s*:\s*\[(.*?)\]', block, flags=re.S):
        family_values = tuple(item.strip() for item in re.findall(r'"([^"]+)"', family_value_blob))
        values.append((family_name.strip(), family_values))
    return values


def categorize_arbitrary_class(prefix: str) -> str:
    normalized = prefix.lstrip("-")
    if normalized.startswith("text"):
        return "text"
    if normalized.startswith("rounded"):
        return "radius"
    if normalized.startswith("shadow"):
        return "shadow"
    if normalized in {"h", "w", "min-h", "min-w", "max-h", "max-w", "aspect"}:
        return "size"
    if normalized.startswith(("p", "m", "gap", "inset", "top", "right", "bottom", "left", "translate", "space")):
        return "spacing"
    return "other"


def build_tokens_payload() -> dict[str, Any]:
    documents = load_screen_documents()

    colors: dict[tuple[str, str], set[int]] = {}
    font_families: dict[tuple[str, tuple[str, ...]], set[int]] = {}
    radii: dict[tuple[str, str], set[int]] = {}
    shadows: dict[tuple[str, str], set[int]] = {}

    arbitrary_tokens: dict[str, set[str]] = {
        "text": set(),
        "size": set(),
        "spacing": set(),
        "radius": set(),
        "shadow": set(),
        "other": set(),
    }

    combined_html = "\n".join(document.html for document in documents)

    for document in documents:
        config_script = document.soup.find("script", id="tailwind-config")
        if config_script:
            script_text = config_script.get_text("\n", strip=False)

            color_block = extract_js_object_block(script_text, "colors")
            for name, value in parse_string_map(color_block):
                colors.setdefault((name, value), set()).add(document.screen_id)

            font_block = extract_js_object_block(script_text, "fontFamily")
            for name, value_tuple in parse_font_family_map(font_block):
                font_families.setdefault((name, value_tuple), set()).add(document.screen_id)

            radius_block = extract_js_object_block(script_text, "borderRadius")
            for name, value in parse_string_map(radius_block):
                radii.setdefault((name, value), set()).add(document.screen_id)

            shadow_block = extract_js_object_block(script_text, "boxShadow")
            for name, value in parse_string_map(shadow_block):
                shadows.setdefault((name, value), set()).add(document.screen_id)

        for element in document.soup.find_all(True):
            for css_class in class_list(element):
                match = re.match(r"^(-?[A-Za-z0-9:_/-]+)-\[(.+)\]$", css_class)
                if not match:
                    continue
                prefix = match.group(1)
                category = categorize_arbitrary_class(prefix)
                arbitrary_tokens[category].add(css_class)

    def serialize_string_entries(store: dict[tuple[str, str], set[int]]) -> list[dict[str, Any]]:
        entries = [
            {
                "name": name,
                "value": value,
                "sourceScreens": sorted(screen_ids),
            }
            for (name, value), screen_ids in store.items()
        ]
        return sorted(entries, key=lambda item: (item["name"], item["value"]))

    def serialize_font_entries(store: dict[tuple[str, tuple[str, ...]], set[int]]) -> list[dict[str, Any]]:
        entries = [
            {
                "name": name,
                "values": list(values),
                "sourceScreens": sorted(screen_ids),
            }
            for (name, values), screen_ids in store.items()
        ]
        return sorted(entries, key=lambda item: (item["name"], ",".join(item["values"])))

    hex_colors = sorted({value.upper() for value in re.findall(r"#(?:[0-9A-Fa-f]{3,8})\b", combined_html)})
    rgba_colors = sorted({value.strip() for value in re.findall(r"rgba?\([^)]*\)", combined_html)})
    font_variation_settings = sorted(
        {value.strip() for value in re.findall(r"font-variation-settings:\s*([^;]+);", combined_html)}
    )
    min_height_rules = sorted({value.strip() for value in re.findall(r"min-height:\s*([^;]+);", combined_html)})
    data_image_refs = sorted({value.strip() for value in re.findall(r"data:image/[^\"')\s]+", combined_html)})

    payload = {
        "meta": {
            "sourceRoot": "stitch_roadmitere",
            "screenCount": len(documents),
            "deterministicOrder": "all lists sorted asc",
        },
        "tailwind": {
            "colors": serialize_string_entries(colors),
            "fontFamilies": serialize_font_entries(font_families),
            "borderRadius": serialize_string_entries(radii),
            "boxShadows": serialize_string_entries(shadows),
        },
        "css": {
            "hexColors": hex_colors,
            "rgbaColors": rgba_colors,
            "fontVariationSettings": font_variation_settings,
            "minHeightRules": min_height_rules,
            "dataImageRefs": data_image_refs,
        },
        "classArbitraryValues": {
            category: sorted(values)
            for category, values in arbitrary_tokens.items()
        },
    }

    return payload


def extract_tokens(write_output: bool = True) -> dict[str, Any]:
    payload = build_tokens_payload()
    if write_output:
        write_json(TOKENS_OUTPUT_PATH, payload)
    return payload


def main() -> None:
    payload = extract_tokens(write_output=True)
    tailwind = payload["tailwind"]
    css = payload["css"]
    arbitrary = payload["classArbitraryValues"]

    arbitrary_count = sum(len(values) for values in arbitrary.values())
    deterministic_order_ok = all(values == sorted(values) for values in arbitrary.values())

    print(f"Tokens generated: {relative_to_root(TOKENS_OUTPUT_PATH)}")
    print(
        "Token summary: "
        f"tailwindColors={len(tailwind['colors'])}, "
        f"tailwindFontFamilies={len(tailwind['fontFamilies'])}, "
        f"tailwindBorderRadius={len(tailwind['borderRadius'])}, "
        f"tailwindShadows={len(tailwind['boxShadows'])}, "
        f"hexColors={len(css['hexColors'])}, "
        f"rgbaColors={len(css['rgbaColors'])}, "
        f"arbitraryClassTokens={arbitrary_count}"
    )
    print(f"Deterministic output order confirmed: {'yes' if deterministic_order_ok else 'no'}")


if __name__ == "__main__":
    main()

