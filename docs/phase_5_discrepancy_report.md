# Phase 5 Discrepancy Report

- Generated at (UTC): `2026-02-14T17:03:20+00:00`
- Overall status: `pass`
- Capture root: `.tmp/phase5/captures`
- Output root: `.tmp/phase5`
- Parity overlay: `.tmp/phase5/parity_overlay.html`

## Thresholds
- iOS screenshot diff threshold: `<= 2.00%`
- Android screenshot diff threshold: `<= 3.00%`
- Spacing/radius baseline tolerance is tracked via screenshot diff plus size mismatch detection.
- Performance thresholds: `avgFps >= 55.0`, `p95FrameMs <= 22.0`, `droppedFrames <= 3`.

## Data/Text Integrity Checks
| Check | Status | Details |
| --- | --- | --- |
| `screen_copy_alignment` | `pass` | manifestIds=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], screenCopyIds=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] |
| `dataset_counts` | `pass` | universities=3, faculties=12, programs=12, filters=3 |
| `favorites_links` | `pass` | all favorite entity links resolve |
| `filter_copy_labels` | `pass` | all filter title/footer labels present |
| `placeholder_markers` | `pass` | none found |
| `mojibake_scan` | `pass` | none found |

## Per-Screen Parity
| Screen | Role | iOS | Android |
| --- | --- | --- | --- |
| `01` | `explore-universities` | `pass` (0.00%) | `pass` (0.00%) |
| `02` | `university-detail` | `pass` (0.00%) | `pass` (0.00%) |
| `03` | `explore-faculties` | `pass` (0.00%) | `pass` (0.00%) |
| `04` | `faculty-detail` | `pass` (0.00%) | `pass` (0.00%) |
| `05` | `filter-faculties` | `pass` (0.00%) | `pass` (0.00%) |
| `06` | `explore-programs` | `pass` (0.00%) | `pass` (0.00%) |
| `07` | `program-detail` | `pass` (0.00%) | `pass` (0.00%) |
| `08` | `favorites-programs` | `pass` (0.00%) | `pass` (0.00%) |
| `09` | `favorites-universities` | `pass` (0.00%) | `pass` (0.00%) |
| `10` | `filter-universities` | `pass` (0.00%) | `pass` (0.00%) |
| `11` | `filter-programs` | `pass` (0.00%) | `pass` (0.00%) |
| `12` | `favorites-faculties` | `pass` (0.00%) | `pass` (0.00%) |
| `13` | `favorites-empty` | `pass` (0.00%) | `pass` (0.00%) |

## Platform Parity Summary
| Platform | Status | Pass | Fail | Missing | Total |
| --- | --- | --- | --- | --- | --- |
| `ios` | `pass` | `13` | `0` | `0` | `13` |
| `android` | `pass` | `13` | `0` | `0` | `13` |

## Performance Validation
- Metrics source: `docs/perf/real_data_current.json`
- Overall status: `pass`

| Platform | Flow | Status | avgFps | p95FrameMs | droppedFrames |
| --- | --- | --- | --- | --- | --- |
| `ios` | `explore-tab-switch` | `pass` | `58.40` | `18.70` | `1` |
| `ios` | `detail-entry` | `pass` | `57.20` | `19.40` | `2` |
| `ios` | `filter-modal-transition` | `pass` | `56.80` | `19.80` | `2` |
| `ios` | `favorites-tab-switch` | `pass` | `58.10` | `18.90` | `1` |
| `android` | `explore-tab-switch` | `pass` | `57.00` | `19.80` | `2` |
| `android` | `detail-entry` | `pass` | `55.90` | `20.80` | `2` |
| `android` | `filter-modal-transition` | `pass` | `55.60` | `21.00` | `3` |
| `android` | `favorites-tab-switch` | `pass` | `56.70` | `20.10` | `2` |

## Discrepancies
- No discrepancies detected.

## Commands
```powershell
npm run typecheck
python scripts/run_phase5_qa.py
```
