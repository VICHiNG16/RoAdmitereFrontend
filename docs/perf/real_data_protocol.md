# Real Data Performance Capture Protocol

## Objective
Capture repeatable real-device performance metrics for core RoAdmitere flows using the real dataset (`dataSource=real`).

## Devices
- Mid-range Android (target baseline device class)
- iPhone (recent mainstream device class)

## Preconditions
1. Build a production-like bundle (`expo start --no-dev --minify` or release build).
2. Ensure the app is on the real data source toggle (`Real`).
3. Close background-heavy apps.
4. Restart app before each full run.

## Flows and Repetitions
Run each flow 20 times per device/platform unless noted.

1. `explore-tab-switch`
- Switch between all three Explore tabs rapidly and repeatedly.

2. `explore-search-burst`
- In Explore, enter 15+ characters quickly in search, clear, repeat.

3. `favorites-tab-switch`
- Switch between Favorites tabs rapidly and repeatedly.

4. `favorites-scroll`
- Scroll deep, bounce back to top, repeat.

5. `faculty-detail-program-scroll`
- Open a faculty with long program list and fast-scroll repeatedly.

6. `filter-modal-transition`
- Open/close each filter modal quickly.

7. `filter-option-burst`
- Rapidly toggle multiple options in each filter modal.

## Metric Format
Use the same `platforms -> [ { flow, avgFps, p95FrameMs, droppedFrames } ]` schema used by Phase 5 QA.

## Output Files
- Baseline snapshot: `.tmp/perf/real_data_baseline.json`
- Current candidate run: `.tmp/perf/real_data_current.json`
- Optional committed CI reference: `docs/perf/real_data_current.json`

## Acceptance Targets
- `avgFps >= 58`
- `p95FrameMs <= 19`
- `droppedFrames <= 2` for high-interaction tab/search flows

## Notes
- Capture both devices in the same session when possible.
- If one flow regresses, re-run that flow three times to confirm before filing.
