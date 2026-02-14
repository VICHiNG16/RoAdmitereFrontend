from __future__ import annotations

from typing import Any

from extract_mock_data import extract_mock_data
from extract_stitch_manifest import extract_stitch_manifest, validate_manifest_titles
from extract_tokens import extract_tokens


def run_phase0_extraction() -> dict[str, Any]:
    manifest_payload = extract_stitch_manifest(write_output=True)
    tokens_payload = extract_tokens(write_output=True)
    mock_payload = extract_mock_data(write_output=True)

    token_arbitrary_count = sum(len(values) for values in tokens_payload["classArbitraryValues"].values())
    print(
        "Token summary: "
        f"tailwindColors={len(tokens_payload['tailwind']['colors'])}, "
        f"tailwindFontFamilies={len(tokens_payload['tailwind']['fontFamilies'])}, "
        f"tailwindBorderRadius={len(tokens_payload['tailwind']['borderRadius'])}, "
        f"tailwindShadows={len(tokens_payload['tailwind']['boxShadows'])}, "
        f"hexColors={len(tokens_payload['css']['hexColors'])}, "
        f"rgbaColors={len(tokens_payload['css']['rgbaColors'])}, "
        f"arbitraryClassTokens={token_arbitrary_count}"
    )
    print(
        "Mock data summary: "
        f"universities={len(mock_payload['universities'])}, "
        f"faculties={len(mock_payload['faculties'])}, "
        f"programs={len(mock_payload['programs'])}, "
        f"filterScreens={len(mock_payload['filters'])}, "
        f"favoriteCollections={len(mock_payload['favorites']['collections'])}, "
        f"screenCopyEntries={len(mock_payload['screenCopy'])}"
    )

    title_ok, mismatches = validate_manifest_titles(manifest_payload)
    screen_count_ok = manifest_payload["meta"]["screenCount"] == 13
    deterministic_ok = (
        [item["screenId"] for item in manifest_payload["screens"]]
        == sorted(item["screenId"] for item in manifest_payload["screens"])
        and all(values == sorted(values) for values in tokens_payload["classArbitraryValues"].values())
        and mock_payload["universities"] == sorted(mock_payload["universities"], key=lambda item: item["id"])
        and mock_payload["faculties"] == sorted(mock_payload["faculties"], key=lambda item: item["id"])
        and mock_payload["programs"] == sorted(mock_payload["programs"], key=lambda item: item["id"])
    )

    print("Phase 0 extraction run complete.")
    print(f"Acceptance 1 - Parsed screens count is 13: {'yes' if screen_count_ok else 'no'}")
    print(f"Acceptance 2 - Manifest titles match source HTML titles: {'yes' if title_ok else 'no'}")
    if mismatches:
        print(f"Manifest title mismatches: {', '.join(map(str, mismatches))}")
    print("Acceptance 3 - Token summary and mock data summary are printed: yes")
    print(f"Acceptance 4 - Deterministic output order confirmed: {'yes' if deterministic_ok else 'no'}")

    return {
        "manifest": manifest_payload,
        "tokens": tokens_payload,
        "mock": mock_payload,
        "checks": {
            "screenCountIs13": screen_count_ok,
            "manifestTitlesMatch": title_ok,
            "deterministicOrder": deterministic_ok,
        },
    }


if __name__ == "__main__":
    run_phase0_extraction()
