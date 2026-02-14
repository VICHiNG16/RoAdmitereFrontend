from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "src/data/mock/generated/stitch-manifest.json"
UNIVERSITIES_PATH = ROOT / "src/data/mock/generated/universities.json"
FACULTIES_PATH = ROOT / "src/data/mock/generated/faculties.json"
PROGRAMS_PATH = ROOT / "src/data/mock/generated/programs.json"
FILTERS_PATH = ROOT / "src/data/mock/generated/filters.json"
FAVORITES_PATH = ROOT / "src/data/mock/generated/favorites.json"
SCREEN_COPY_PATH = ROOT / "src/data/mock/generated/screen-copy.json"

PARITY_THRESHOLDS = {"ios": 2.0, "android": 3.0}
PIXEL_DELTA_THRESHOLD = 16
MOJIBAKE_CODEPOINTS = {0x00C2, 0x00C3, 0x00C4, 0x00C5, 0x00C8}
PERF_THRESHOLDS = {"avgFpsMin": 55.0, "p95FrameMsMax": 22.0, "droppedFramesMax": 3}
REQUIRED_PERF_FLOWS = [
    "explore-tab-switch",
    "detail-entry",
    "filter-modal-transition",
    "favorites-tab-switch",
]

QA_ROUTE_FILES = [
    ROOT / "app/(tabs)/explore/index.tsx",
    ROOT / "app/(tabs)/favorites/index.tsx",
    ROOT / "app/modals/university/[id].tsx",
    ROOT / "app/modals/faculty/[id].tsx",
    ROOT / "app/modals/program/[id].tsx",
    ROOT / "app/modals/filter-universities.tsx",
    ROOT / "app/modals/filter-faculties.tsx",
    ROOT / "app/modals/filter-programs.tsx",
]
PLACEHOLDER_MARKERS = ["TODO", "FIXME", "PhasePlaceholder"]


@dataclass
class ParityScreenResult:
    platform: str
    screen_id: int
    role: str
    reference_path: str
    capture_path: str
    diff_path: str | None
    status: str
    diff_percent: float | None
    threshold_percent: float
    size_mismatch: bool
    message: str | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Phase 5 QA runner: parity diff, text/data integrity checks, performance budget validation."
    )
    parser.add_argument(
        "--capture-root",
        type=Path,
        default=ROOT / ".tmp/phase5/captures",
        help="Folder containing device screenshots at <capture-root>/<platform>/<screenId>.png",
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=ROOT / ".tmp/phase5",
        help="Folder where JSON results, diff images, and parity overlay HTML will be written.",
    )
    parser.add_argument(
        "--performance-metrics",
        type=Path,
        default=ROOT / ".tmp/phase5/performance_metrics.json",
        help="Optional JSON file with fps/frame metrics by platform/flow.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=ROOT / "docs/phase_5_discrepancy_report.md",
        help="Markdown discrepancy report output path.",
    )
    return parser.parse_args()


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def normalize_rel(path: Path, base: Path | None = None) -> str:
    current_base = base if base is not None else ROOT
    try:
        relative = path.relative_to(current_base)
    except ValueError:
        relative = path
    return str(relative).replace("\\", "/")


def compute_diff(reference_path: Path, capture_path: Path, diff_output_path: Path) -> dict[str, Any]:
    reference = Image.open(reference_path).convert("RGBA")
    capture = Image.open(capture_path).convert("RGBA")

    size_mismatch = reference.size != capture.size
    if size_mismatch:
        capture = capture.resize(reference.size, Image.Resampling.BICUBIC)

    reference_np = np.asarray(reference, dtype=np.int16)
    capture_np = np.asarray(capture, dtype=np.int16)

    channel_delta = np.abs(reference_np[:, :, :3] - capture_np[:, :, :3])
    changed = np.any(channel_delta > PIXEL_DELTA_THRESHOLD, axis=2)

    changed_pixels = int(changed.sum())
    total_pixels = int(changed.size)
    diff_percent = (changed_pixels / total_pixels) * 100.0 if total_pixels else 0.0
    mean_channel_delta = float(channel_delta.mean()) if total_pixels else 0.0

    diff_overlay = np.zeros((changed.shape[0], changed.shape[1], 4), dtype=np.uint8)
    diff_overlay[:, :, 0] = 255
    diff_overlay[:, :, 1] = 32
    diff_overlay[:, :, 2] = 96
    diff_overlay[:, :, 3] = changed.astype(np.uint8) * 180
    diff_image = Image.alpha_composite(reference, Image.fromarray(diff_overlay, mode="RGBA"))

    diff_output_path.parent.mkdir(parents=True, exist_ok=True)
    diff_image.save(diff_output_path)

    return {
        "diffPercent": round(diff_percent, 4),
        "changedPixels": changed_pixels,
        "totalPixels": total_pixels,
        "meanChannelDelta": round(mean_channel_delta, 4),
        "sizeMismatch": size_mismatch,
        "referenceSize": {"width": reference.size[0], "height": reference.size[1]},
        "captureSize": {"width": capture.size[0], "height": capture.size[1]},
    }


def run_parity_checks(
    screens: list[dict[str, Any]],
    capture_root: Path,
    output_root: Path,
) -> dict[str, Any]:
    platform_summaries: dict[str, dict[str, Any]] = {}
    all_results: list[ParityScreenResult] = []
    discrepancies: list[str] = []

    for platform, threshold in PARITY_THRESHOLDS.items():
        platform_results: list[ParityScreenResult] = []
        missing_count = 0
        failed_count = 0
        passed_count = 0

        for screen in screens:
            screen_id = int(screen["screenId"])
            role = str(screen["role"])
            reference_path = ROOT / str(screen["screenshotPath"])
            capture_path = capture_root / platform / f"{screen_id:02d}.png"
            diff_path = output_root / "diffs" / platform / f"{screen_id:02d}_diff.png"

            if not reference_path.exists():
                result = ParityScreenResult(
                    platform=platform,
                    screen_id=screen_id,
                    role=role,
                    reference_path=normalize_rel(reference_path),
                    capture_path=normalize_rel(capture_path),
                    diff_path=None,
                    status="missing_reference",
                    diff_percent=None,
                    threshold_percent=threshold,
                    size_mismatch=False,
                    message="Reference screenshot missing.",
                )
                missing_count += 1
                discrepancies.append(f"[{platform}] Screen {screen_id}: missing reference screenshot.")
                platform_results.append(result)
                continue

            if not capture_path.exists():
                result = ParityScreenResult(
                    platform=platform,
                    screen_id=screen_id,
                    role=role,
                    reference_path=normalize_rel(reference_path),
                    capture_path=normalize_rel(capture_path),
                    diff_path=None,
                    status="missing_capture",
                    diff_percent=None,
                    threshold_percent=threshold,
                    size_mismatch=False,
                    message="Capture screenshot missing.",
                )
                missing_count += 1
                discrepancies.append(f"[{platform}] Screen {screen_id}: missing capture screenshot.")
                platform_results.append(result)
                continue

            diff_metrics = compute_diff(reference_path, capture_path, diff_path)
            diff_percent = float(diff_metrics["diffPercent"])
            size_mismatch = bool(diff_metrics["sizeMismatch"])
            within_threshold = diff_percent <= threshold and not size_mismatch

            status = "pass" if within_threshold else "fail"
            if status == "pass":
                passed_count += 1
            else:
                failed_count += 1
                reason = (
                    f"diff {diff_percent:.2f}% > {threshold:.2f}%"
                    if diff_percent > threshold
                    else "capture size mismatch"
                )
                discrepancies.append(f"[{platform}] Screen {screen_id}: {reason}.")

            result = ParityScreenResult(
                platform=platform,
                screen_id=screen_id,
                role=role,
                reference_path=normalize_rel(reference_path),
                capture_path=normalize_rel(capture_path),
                diff_path=normalize_rel(diff_path),
                status=status,
                diff_percent=diff_percent,
                threshold_percent=threshold,
                size_mismatch=size_mismatch,
                message=None,
            )
            platform_results.append(result)

        if failed_count > 0:
            platform_status = "fail"
        elif missing_count > 0:
            platform_status = "blocked"
        else:
            platform_status = "pass"

        platform_summaries[platform] = {
            "status": platform_status,
            "thresholdPercent": threshold,
            "passCount": passed_count,
            "failCount": failed_count,
            "missingCount": missing_count,
            "total": len(platform_results),
        }
        all_results.extend(platform_results)

    overall_status = "pass"
    if any(summary["status"] == "fail" for summary in platform_summaries.values()):
        overall_status = "fail"
    elif any(summary["status"] == "blocked" for summary in platform_summaries.values()):
        overall_status = "blocked"

    serialized_results = [
        {
            "platform": result.platform,
            "screenId": result.screen_id,
            "role": result.role,
            "referencePath": result.reference_path,
            "capturePath": result.capture_path,
            "diffPath": result.diff_path,
            "status": result.status,
            "diffPercent": result.diff_percent,
            "thresholdPercent": result.threshold_percent,
            "sizeMismatch": result.size_mismatch,
            "message": result.message,
        }
        for result in all_results
    ]

    return {
        "status": overall_status,
        "platforms": platform_summaries,
        "screens": serialized_results,
        "discrepancies": sorted(set(discrepancies)),
    }


def run_data_integrity_checks(screens: list[dict[str, Any]]) -> dict[str, Any]:
    universities_payload = read_json(UNIVERSITIES_PATH)
    faculties_payload = read_json(FACULTIES_PATH)
    programs_payload = read_json(PROGRAMS_PATH)
    filters_payload = read_json(FILTERS_PATH)
    favorites_payload = read_json(FAVORITES_PATH)
    copy_payload = read_json(SCREEN_COPY_PATH)

    universities = universities_payload.get("universities", [])
    faculties = faculties_payload.get("faculties", [])
    programs = programs_payload.get("programs", [])
    filters = filters_payload.get("filters", [])
    favorites_collections = favorites_payload.get("favorites", {}).get("collections", [])
    screen_copy = copy_payload.get("screenCopy", [])

    checks: list[dict[str, Any]] = []
    discrepancies: list[str] = []

    manifest_ids = sorted(int(screen["screenId"]) for screen in screens)
    copy_ids = sorted(int(item["screenId"]) for item in screen_copy)
    check_copy_alignment = manifest_ids == copy_ids
    checks.append(
        {
            "id": "screen_copy_alignment",
            "status": "pass" if check_copy_alignment else "fail",
            "details": f"manifestIds={manifest_ids}, screenCopyIds={copy_ids}",
        }
    )
    if not check_copy_alignment:
        discrepancies.append("Screen copy entries do not align with manifest screen IDs.")

    count_ok = len(universities) > 0 and len(faculties) > 0 and len(programs) > 0 and len(filters) == 3
    checks.append(
        {
            "id": "dataset_counts",
            "status": "pass" if count_ok else "fail",
            "details": (
                f"universities={len(universities)}, faculties={len(faculties)}, "
                f"programs={len(programs)}, filters={len(filters)}"
            ),
        }
    )
    if not count_ok:
        discrepancies.append("Entity/filter dataset counts are out of expected range.")

    university_ids = {str(item.get("id")) for item in universities}
    faculty_ids = {str(item.get("id")) for item in faculties}
    program_ids = {str(item.get("id")) for item in programs}

    missing_favorites: list[str] = []
    for collection in favorites_collections:
        kind = str(collection.get("kind", ""))
        entity_ids = university_ids if kind == "universities" else faculty_ids if kind == "faculties" else program_ids
        for item in collection.get("items", []):
            entity_id = str(item.get("entityId"))
            if entity_id not in entity_ids:
                missing_favorites.append(f"{kind}:{entity_id}")

    favorites_ok = len(missing_favorites) == 0
    checks.append(
        {
            "id": "favorites_links",
            "status": "pass" if favorites_ok else "fail",
            "details": "all favorite entity links resolve" if favorites_ok else ", ".join(missing_favorites),
        }
    )
    if not favorites_ok:
        discrepancies.append("Favorites payload contains unresolved entity references.")

    filter_copy_issues: list[str] = []
    for filter_item in filters:
        title = str(filter_item.get("title", "")).strip()
        footer = filter_item.get("footer", {})
        reset_label = str(footer.get("resetLabel", "")).strip()
        apply_label = str(footer.get("applyLabel", "")).strip()
        if not title or not reset_label or not apply_label:
            filter_copy_issues.append(str(filter_item.get("id", "unknown-filter")))

    filter_copy_ok = len(filter_copy_issues) == 0
    checks.append(
        {
            "id": "filter_copy_labels",
            "status": "pass" if filter_copy_ok else "fail",
            "details": "all filter title/footer labels present"
            if filter_copy_ok
            else f"missing labels in: {', '.join(filter_copy_issues)}",
        }
    )
    if not filter_copy_ok:
        discrepancies.append("One or more filter screens are missing copy labels.")

    placeholder_hits: list[str] = []
    encoding_hits: list[str] = []
    for route_path in QA_ROUTE_FILES:
        content = route_path.read_text(encoding="utf-8")
        lines = content.splitlines()

        for index, line in enumerate(lines, start=1):
            if any(marker in line for marker in PLACEHOLDER_MARKERS):
                placeholder_hits.append(f"{normalize_rel(route_path)}:{index}")
            if any(ord(char) in MOJIBAKE_CODEPOINTS for char in line):
                encoding_hits.append(f"{normalize_rel(route_path)}:{index}")

    placeholders_ok = len(placeholder_hits) == 0
    checks.append(
        {
            "id": "placeholder_markers",
            "status": "pass" if placeholders_ok else "fail",
            "details": "none found" if placeholders_ok else ", ".join(placeholder_hits),
        }
    )
    if not placeholders_ok:
        discrepancies.append("Placeholder markers found in active QA routes.")

    encoding_ok = len(encoding_hits) == 0
    checks.append(
        {
            "id": "mojibake_scan",
            "status": "pass" if encoding_ok else "fail",
            "details": "none found" if encoding_ok else ", ".join(encoding_hits),
        }
    )
    if not encoding_ok:
        discrepancies.append("Potential mojibake characters found in active QA routes.")

    status = "pass" if all(check["status"] == "pass" for check in checks) else "fail"
    return {"status": status, "checks": checks, "discrepancies": discrepancies}


def run_performance_checks(metrics_path: Path) -> dict[str, Any]:
    if not metrics_path.exists():
        return {
            "status": "blocked",
            "sourcePath": normalize_rel(metrics_path),
            "platforms": {},
            "discrepancies": ["Performance metrics file not found."],
        }

    payload = read_json(metrics_path)
    platforms = payload.get("platforms", {})
    discrepancies: list[str] = []
    platform_results: dict[str, Any] = {}

    for platform in ("ios", "android"):
        flow_rows = platforms.get(platform, [])
        flow_map = {str(row.get("flow", "")): row for row in flow_rows if isinstance(row, dict)}
        rows: list[dict[str, Any]] = []
        platform_status = "pass"

        for flow in REQUIRED_PERF_FLOWS:
            row = flow_map.get(flow)
            if row is None:
                rows.append(
                    {
                        "flow": flow,
                        "status": "fail",
                        "avgFps": None,
                        "p95FrameMs": None,
                        "droppedFrames": None,
                        "message": "Missing flow metrics.",
                    }
                )
                platform_status = "fail"
                discrepancies.append(f"[{platform}] Missing performance metrics for flow '{flow}'.")
                continue

            avg_fps = float(row.get("avgFps", 0.0))
            p95_frame_ms = float(row.get("p95FrameMs", 9999.0))
            dropped_frames = int(row.get("droppedFrames", 9999))
            flow_ok = (
                avg_fps >= PERF_THRESHOLDS["avgFpsMin"]
                and p95_frame_ms <= PERF_THRESHOLDS["p95FrameMsMax"]
                and dropped_frames <= PERF_THRESHOLDS["droppedFramesMax"]
            )
            if not flow_ok:
                platform_status = "fail"
                discrepancies.append(
                    f"[{platform}] Flow '{flow}' out of budget: "
                    f"avgFps={avg_fps}, p95FrameMs={p95_frame_ms}, droppedFrames={dropped_frames}."
                )

            rows.append(
                {
                    "flow": flow,
                    "status": "pass" if flow_ok else "fail",
                    "avgFps": avg_fps,
                    "p95FrameMs": p95_frame_ms,
                    "droppedFrames": dropped_frames,
                    "message": None if flow_ok else "Outside performance budget.",
                }
            )

        platform_results[platform] = {"status": platform_status, "rows": rows}

    overall_status = "pass" if all(result["status"] == "pass" for result in platform_results.values()) else "fail"
    return {
        "status": overall_status,
        "sourcePath": normalize_rel(metrics_path),
        "platforms": platform_results,
        "discrepancies": discrepancies,
    }


def generate_overlay_html(
    parity_results: dict[str, Any],
    overlay_path: Path,
) -> None:
    entries: list[dict[str, Any]] = []
    for row in parity_results["screens"]:
        if row["status"] in {"missing_capture", "missing_reference"}:
            continue
        diff_path = row.get("diffPath")
        if diff_path is None:
            continue
        entries.append(
            {
                "platform": row["platform"],
                "screenId": row["screenId"],
                "role": row["role"],
                "referencePath": normalize_rel(ROOT / row["referencePath"], overlay_path.parent),
                "capturePath": normalize_rel(ROOT / row["capturePath"], overlay_path.parent),
                "diffPath": normalize_rel(ROOT / diff_path, overlay_path.parent),
                "diffPercent": row["diffPercent"],
                "thresholdPercent": row["thresholdPercent"],
            }
        )

    overlay_path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(entries, ensure_ascii=False)
    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Phase 5 Parity Overlay</title>
  <style>
    :root {{
      color-scheme: light;
      font-family: "Segoe UI", Arial, sans-serif;
      background: #f6f8fb;
      color: #132132;
    }}
    body {{
      margin: 0;
      padding: 20px;
      background: #f6f8fb;
    }}
    .controls {{
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
      align-items: end;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(10, 25, 47, 0.08);
      padding: 12px;
    }}
    label {{
      display: grid;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #3d4f66;
    }}
    select, input[type="range"] {{
      min-width: 180px;
    }}
    .meta {{
      font-size: 13px;
      color: #415a77;
    }}
    .canvas {{
      position: relative;
      border-radius: 12px;
      overflow: auto;
      max-height: calc(100vh - 220px);
      background: #0b1420;
      box-shadow: 0 10px 32px rgba(15, 23, 42, 0.22);
      padding: 12px;
    }}
    .stack {{
      position: relative;
      display: inline-block;
      line-height: 0;
    }}
    .stack img {{
      display: block;
      max-width: min(100%, 460px);
      height: auto;
      border-radius: 10px;
    }}
    #reference {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    .compare {{
      display: grid;
      grid-template-columns: repeat(3, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }}
    .compare figure {{
      margin: 0;
      background: #fff;
      border-radius: 10px;
      padding: 8px;
      box-shadow: 0 4px 14px rgba(10, 25, 47, 0.08);
    }}
    .compare figcaption {{
      font-size: 12px;
      color: #3d4f66;
      margin-top: 8px;
    }}
    .compare img {{
      max-width: 100%;
      border-radius: 6px;
    }}
    .empty {{
      padding: 24px;
      background: #fff;
      border-radius: 12px;
      border: 1px dashed #c5d2e0;
      color: #3d4f66;
      font-size: 14px;
    }}
  </style>
</head>
<body>
  <h1>Phase 5 Parity Overlay</h1>
  <p class="meta">Reference sits above capture with an opacity slider for landmark alignment checks.</p>
  <div id="app"></div>
  <script>
    const entries = {payload};
    const app = document.getElementById("app");

    if (!entries.length) {{
      app.innerHTML = '<div class="empty">No parity pairs found. Add screenshots under <code>.tmp/phase5/captures/ios</code> and <code>.tmp/phase5/captures/android</code>, then rerun <code>python scripts/run_phase5_qa.py</code>.</div>';
    }} else {{
      const platforms = [...new Set(entries.map((entry) => entry.platform))];
      let selectedPlatform = platforms.includes("ios") ? "ios" : platforms[0];

      const controls = document.createElement("div");
      controls.className = "controls";
      controls.innerHTML = `
        <label>Platform
          <select id="platformSelect"></select>
        </label>
        <label>Screen
          <select id="screenSelect"></select>
        </label>
        <label>Reference opacity
          <input id="opacitySlider" type="range" min="0" max="100" value="50" />
        </label>
        <div class="meta" id="meta"></div>
      `;

      const canvas = document.createElement("div");
      canvas.className = "canvas";
      canvas.innerHTML = `
        <div class="stack">
          <img id="capture" alt="RN capture" />
          <img id="reference" alt="Stitch reference overlay" />
        </div>
      `;

      const compare = document.createElement("div");
      compare.className = "compare";
      compare.innerHTML = `
        <figure>
          <img id="capturePreview" alt="Capture preview" />
          <figcaption>RN capture</figcaption>
        </figure>
        <figure>
          <img id="referencePreview" alt="Reference preview" />
          <figcaption>Stitch reference</figcaption>
        </figure>
        <figure>
          <img id="diffPreview" alt="Diff preview" />
          <figcaption>Diff heatmap</figcaption>
        </figure>
      `;

      app.appendChild(controls);
      app.appendChild(canvas);
      app.appendChild(compare);

      const platformSelect = document.getElementById("platformSelect");
      const screenSelect = document.getElementById("screenSelect");
      const opacitySlider = document.getElementById("opacitySlider");
      const meta = document.getElementById("meta");
      const capture = document.getElementById("capture");
      const reference = document.getElementById("reference");
      const capturePreview = document.getElementById("capturePreview");
      const referencePreview = document.getElementById("referencePreview");
      const diffPreview = document.getElementById("diffPreview");

      platformSelect.innerHTML = platforms.map((platform) => `<option value="${{platform}}">${{platform}}</option>`).join("");
      platformSelect.value = selectedPlatform;

      const updateScreenOptions = () => {{
        const platformEntries = entries.filter((entry) => entry.platform === selectedPlatform);
        screenSelect.innerHTML = platformEntries
          .map((entry) => `<option value="${{entry.screenId}}">${{String(entry.screenId).padStart(2, "0")}} - ${{entry.role}}</option>`)
          .join("");
        if (platformEntries.length > 0) {{
          screenSelect.value = String(platformEntries[0].screenId);
        }}
      }};

      const render = () => {{
        const platformEntries = entries.filter((entry) => entry.platform === selectedPlatform);
        const selected = platformEntries.find((entry) => String(entry.screenId) === String(screenSelect.value)) || platformEntries[0];
        if (!selected) {{
          return;
        }}
        const opacity = Number(opacitySlider.value) / 100;
        capture.src = selected.capturePath;
        reference.src = selected.referencePath;
        capturePreview.src = selected.capturePath;
        referencePreview.src = selected.referencePath;
        diffPreview.src = selected.diffPath;
        reference.style.opacity = opacity;
        meta.textContent = `screen=${{selected.screenId}} role=${{selected.role}} diff=${{selected.diffPercent.toFixed(2)}}% threshold=${{selected.thresholdPercent.toFixed(2)}}% overlay=${{opacitySlider.value}}%`;
      }};

      updateScreenOptions();
      render();

      platformSelect.addEventListener("change", () => {{
        selectedPlatform = platformSelect.value;
        updateScreenOptions();
        render();
      }});
      screenSelect.addEventListener("change", render);
      opacitySlider.addEventListener("input", render);
    }}
  </script>
</body>
</html>
"""
    overlay_path.write_text(html, encoding="utf-8")


def generate_markdown_report(
    screens: list[dict[str, Any]],
    parity_results: dict[str, Any],
    data_results: dict[str, Any],
    performance_results: dict[str, Any],
    overlay_path: Path,
    report_path: Path,
    capture_root: Path,
    output_root: Path,
) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).replace(microsecond=0).isoformat()

    parity_map: dict[int, dict[str, dict[str, Any]]] = {}
    for row in parity_results["screens"]:
        parity_map.setdefault(int(row["screenId"]), {})[str(row["platform"])] = row

    discrepancy_items = sorted(
        set(parity_results["discrepancies"] + data_results["discrepancies"] + performance_results["discrepancies"])
    )

    if parity_results["status"] == "fail" or data_results["status"] == "fail" or performance_results["status"] == "fail":
        overall_status = "fail"
    elif parity_results["status"] == "blocked" or performance_results["status"] == "blocked":
        overall_status = "blocked"
    else:
        overall_status = "pass"

    lines: list[str] = []
    lines.append("# Phase 5 Discrepancy Report")
    lines.append("")
    lines.append(f"- Generated at (UTC): `{timestamp}`")
    lines.append(f"- Overall status: `{overall_status}`")
    lines.append(f"- Capture root: `{normalize_rel(capture_root)}`")
    lines.append(f"- Output root: `{normalize_rel(output_root)}`")
    lines.append(f"- Parity overlay: `{normalize_rel(overlay_path)}`")
    lines.append("")
    lines.append("## Thresholds")
    lines.append(f"- iOS screenshot diff threshold: `<= {PARITY_THRESHOLDS['ios']:.2f}%`")
    lines.append(f"- Android screenshot diff threshold: `<= {PARITY_THRESHOLDS['android']:.2f}%`")
    lines.append("- Spacing/radius baseline tolerance is tracked via screenshot diff plus size mismatch detection.")
    lines.append(
        "- Performance thresholds: "
        f"`avgFps >= {PERF_THRESHOLDS['avgFpsMin']}`, "
        f"`p95FrameMs <= {PERF_THRESHOLDS['p95FrameMsMax']}`, "
        f"`droppedFrames <= {PERF_THRESHOLDS['droppedFramesMax']}`."
    )
    lines.append("")

    lines.append("## Data/Text Integrity Checks")
    lines.append("| Check | Status | Details |")
    lines.append("| --- | --- | --- |")
    for check in data_results["checks"]:
        lines.append(f"| `{check['id']}` | `{check['status']}` | {check['details']} |")
    lines.append("")

    lines.append("## Per-Screen Parity")
    lines.append("| Screen | Role | iOS | Android |")
    lines.append("| --- | --- | --- | --- |")
    for screen in sorted(screens, key=lambda item: int(item["screenId"])):
        screen_id = int(screen["screenId"])
        role = str(screen["role"])
        ios = parity_map.get(screen_id, {}).get("ios")
        android = parity_map.get(screen_id, {}).get("android")

        def cell(row: dict[str, Any] | None) -> str:
            if row is None:
                return "`missing`"
            if row["status"] in {"missing_capture", "missing_reference"}:
                return f"`{row['status']}`"
            diff_percent = row["diffPercent"]
            size_suffix = " +size-mismatch" if row["sizeMismatch"] else ""
            return f"`{row['status']}` ({diff_percent:.2f}%){size_suffix}"

        lines.append(f"| `{screen_id:02d}` | `{role}` | {cell(ios)} | {cell(android)} |")
    lines.append("")

    lines.append("## Platform Parity Summary")
    lines.append("| Platform | Status | Pass | Fail | Missing | Total |")
    lines.append("| --- | --- | --- | --- | --- | --- |")
    for platform in ("ios", "android"):
        summary = parity_results["platforms"][platform]
        lines.append(
            f"| `{platform}` | `{summary['status']}` | `{summary['passCount']}` | "
            f"`{summary['failCount']}` | `{summary['missingCount']}` | `{summary['total']}` |"
        )
    lines.append("")

    lines.append("## Performance Validation")
    lines.append(f"- Metrics source: `{performance_results['sourcePath']}`")
    lines.append(f"- Overall status: `{performance_results['status']}`")
    if performance_results["platforms"]:
        lines.append("")
        lines.append("| Platform | Flow | Status | avgFps | p95FrameMs | droppedFrames |")
        lines.append("| --- | --- | --- | --- | --- | --- |")
        for platform in ("ios", "android"):
            platform_result = performance_results["platforms"][platform]
            for row in platform_result["rows"]:
                avg_fps = "-" if row["avgFps"] is None else f"{row['avgFps']:.2f}"
                p95_frame_ms = "-" if row["p95FrameMs"] is None else f"{row['p95FrameMs']:.2f}"
                dropped_frames = "-" if row["droppedFrames"] is None else str(row["droppedFrames"])
                lines.append(
                    f"| `{platform}` | `{row['flow']}` | `{row['status']}` | "
                    f"`{avg_fps}` | `{p95_frame_ms}` | `{dropped_frames}` |"
                )
    lines.append("")

    lines.append("## Discrepancies")
    if discrepancy_items:
        for item in discrepancy_items:
            lines.append(f"- {item}")
    else:
        lines.append("- No discrepancies detected.")
    lines.append("")

    lines.append("## Commands")
    lines.append("```powershell")
    lines.append("npm run typecheck")
    lines.append("python scripts/run_phase5_qa.py")
    lines.append("```")
    lines.append("")

    report_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    args = parse_args()

    args.output_root.mkdir(parents=True, exist_ok=True)
    manifest_payload = read_json(MANIFEST_PATH)
    screens = sorted(manifest_payload.get("screens", []), key=lambda item: int(item["screenId"]))

    data_results = run_data_integrity_checks(screens)
    parity_results = run_parity_checks(screens, args.capture_root, args.output_root)
    performance_results = run_performance_checks(args.performance_metrics)

    overlay_path = args.output_root / "parity_overlay.html"
    generate_overlay_html(parity_results, overlay_path)

    results_path = args.output_root / "phase5_qa_results.json"
    full_results = {
        "generatedAtUtc": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "inputs": {
            "manifestPath": normalize_rel(MANIFEST_PATH),
            "captureRoot": normalize_rel(args.capture_root),
            "performanceMetricsPath": normalize_rel(args.performance_metrics),
        },
        "parity": parity_results,
        "dataIntegrity": data_results,
        "performance": performance_results,
        "overlayPath": normalize_rel(overlay_path),
    }
    results_path.write_text(json.dumps(full_results, ensure_ascii=False, indent=2), encoding="utf-8")

    generate_markdown_report(
        screens=screens,
        parity_results=parity_results,
        data_results=data_results,
        performance_results=performance_results,
        overlay_path=overlay_path,
        report_path=args.report_path,
        capture_root=args.capture_root,
        output_root=args.output_root,
    )

    print("Phase 5 QA run complete.")
    print(f"Data integrity status: {data_results['status']}")
    print(f"Parity status: {parity_results['status']}")
    print(f"Performance status: {performance_results['status']}")
    print(f"Wrote JSON results: {normalize_rel(results_path)}")
    print(f"Wrote discrepancy report: {normalize_rel(args.report_path)}")
    print(f"Wrote parity overlay: {normalize_rel(overlay_path)}")


if __name__ == "__main__":
    main()
