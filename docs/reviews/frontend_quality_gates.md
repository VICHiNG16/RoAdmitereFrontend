# Frontend Quality Gates

## Gate Set

| Gate | Command | Pass Criteria | Fail Criteria |
| --- | --- | --- | --- |
| Type Safety | `npm run typecheck` | `tsc --noEmit` exits `0` | Any TypeScript error |
| Lint | `npm run lint` | ESLint exits `0` with `--max-warnings=0` | Any warning or error |
| Unit/Component Tests | `npm test -- --runInBand` | All Jest suites pass | Any failed suite/test |
| Frontend Guardrails | `npm run guardrails:frontend` | Route constraints script exits `0` | Raw color literals, spring/haptic usage, oversized route file |
| Visual/Perf QA | `python scripts/run_phase5_qa.py` | Data integrity + parity + performance all `pass` | Any `fail` status in phase5 outputs |

## Phase 5 Thresholds
- Source: `docs/phase_5_discrepancy_report.md`
- iOS screenshot diff: `<= 2.00%`
- Android screenshot diff: `<= 3.00%`
- Performance:
  - `avgFps >= 55.0`
  - `p95FrameMs <= 22.0`
  - `droppedFrames <= 3`

## CI-Ready Definition
- Workflow file: `.github/workflows/frontend-quality.yml`
- Trigger:
  - Pull requests touching frontend paths.
  - Manual `workflow_dispatch`.
- Job sequence:
  1. `npm ci`
  2. `npm run typecheck`
  3. `npm run lint`
  4. `npm test -- --runInBand`
  5. `npm run guardrails:frontend`
  6. `npm run qa:phase5`
  7. CI perf metrics source: `docs/perf/real_data_current.json` (real-data capture reference).

## Current Validation Snapshot
- Last validated locally: February 14, 2026.
- Result:
  - Typecheck: pass
  - Lint: pass
  - Tests: pass (`5` suites, `15` tests)
  - Guardrails: pass
  - Phase 5 QA: pass
