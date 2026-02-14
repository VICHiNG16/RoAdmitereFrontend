from __future__ import annotations

from typing import Any

from extraction_common import (
    MANIFEST_OUTPUT_PATH,
    SCREEN_ROLE_BY_ID,
    load_screen_documents,
    normalize_text,
    relative_to_root,
    sha256_text,
    write_json,
)


def build_manifest_payload() -> dict[str, Any]:
    documents = load_screen_documents()
    screens: list[dict[str, Any]] = []

    for document in documents:
        title = ""
        if document.soup.title:
            title = normalize_text(document.soup.title.get_text(" ", strip=True))

        screens.append(
            {
                "screenId": document.screen_id,
                "role": SCREEN_ROLE_BY_ID.get(document.screen_id, "unknown"),
                "folder": document.folder_name,
                "title": title,
                "codePath": relative_to_root(document.code_path),
                "screenshotPath": relative_to_root(document.screenshot_path),
                "htmlSha256": sha256_text(document.html),
            }
        )

    return {
        "meta": {
            "sourceRoot": "stitch_roadmitere",
            "screenCount": len(screens),
            "deterministicOrder": "screenId asc",
        },
        "screens": screens,
    }


def validate_manifest_titles(payload: dict[str, Any]) -> tuple[bool, list[int]]:
    documents = load_screen_documents()
    source_titles = {
        document.screen_id: normalize_text(document.soup.title.get_text(" ", strip=True))
        if document.soup.title
        else ""
        for document in documents
    }

    mismatches: list[int] = []
    for item in payload.get("screens", []):
        screen_id = int(item["screenId"])
        if normalize_text(item.get("title", "")) != source_titles.get(screen_id, ""):
            mismatches.append(screen_id)

    return not mismatches, mismatches


def extract_stitch_manifest(write_output: bool = True) -> dict[str, Any]:
    payload = build_manifest_payload()
    if write_output:
        write_json(MANIFEST_OUTPUT_PATH, payload)
    return payload


def main() -> None:
    payload = extract_stitch_manifest(write_output=True)
    title_ok, mismatches = validate_manifest_titles(payload)
    screen_ids = [screen["screenId"] for screen in payload["screens"]]
    deterministic_order_ok = screen_ids == sorted(screen_ids)

    print(f"Manifest generated: {relative_to_root(MANIFEST_OUTPUT_PATH)}")
    print(f"Parsed screens count: {payload['meta']['screenCount']}")
    print(f"Manifest titles match source HTML titles: {'yes' if title_ok else 'no'}")
    if mismatches:
        print(f"Manifest title mismatches on screen IDs: {', '.join(map(str, mismatches))}")
    print(f"Deterministic output order confirmed: {'yes' if deterministic_order_ok else 'no'}")


if __name__ == "__main__":
    main()

