# Frontend Code Review

## Scope and Baseline
- Scope: full frontend (`app/**`, `src/**`, frontend scripts).
- Strategy: incremental refactor + enforceable gates.
- Baseline checks (run on February 14, 2026): `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run guardrails:frontend`, `python scripts/run_phase5_qa.py` all pass.

## Findings

### Critical
- None.

### High

#### H-1: Favorites tab route still centralizes too many responsibilities
- Evidence: `app/(tabs)/favorites/index.tsx:103`, `app/(tabs)/favorites/index.tsx:215`, `app/(tabs)/favorites/index.tsx:336`
- Symptom: one route owns tab state transitions, collection transforms, empty state, three tab layouts, and navigation wiring.
- Root cause: feature logic is composed directly inside route instead of extracted feature modules.
- Impact: high regression probability when changing favorites behavior, animation, or card composition.
- Reproducibility: add a new favorites card field or list behavior and observe edits across multiple branches in one file.
- Recommended change: extract `src/features/favorites/*` (selectors, presentation, row builders, tab content sections), keep route as orchestration/composition only.
- Verification: route line count drops below 350; component and integration tests continue passing.

#### H-2: Non-virtualized list rendering in primary flows
- Evidence: `app/(tabs)/explore/index.tsx:365`, `app/(tabs)/favorites/index.tsx:215`, `app/(tabs)/favorites/index.tsx:338`
- Symptom: list rendering is done with array `.map()` inside `View`/`ScrollView` rather than `FlatList`/`SectionList`.
- Root cause: implementation optimized for small mock dataset size.
- Impact: frame drops and memory pressure when data scales beyond current mock volume.
- Reproducibility: expand dataset to hundreds of entities and profile tab switches and scroll interactions.
- Recommended change: migrate explore/favorites collections to virtualized lists with stable `keyExtractor` and memoized item renderers.
- Verification: keep `phase5` thresholds passing and compare added large-dataset perf runs.

### Medium

#### M-1: Presentation metadata fallback can hide contract drift
- Evidence: `src/features/explore/presentation.ts:9`, `src/features/explore/presentation.ts:15`, `src/features/explore/presentation.ts:16`
- Symptom: missing metadata silently falls back to `"accent"`/`"code"`.
- Root cause: defensive fallback without strict completeness assertion.
- Impact: visual inconsistencies can ship without detection after dataset changes.
- Reproducibility: remove one entity from `src/data/mock/generated/presentation.json` and observe no runtime failure.
- Recommended change: add extraction-time completeness checks that fail if any rendered entity lacks presentation metadata.
- Verification: unit test for metadata completeness + extraction script exit non-zero on missing entries.

#### M-2: Filter inference remains heuristic substring matching
- Evidence: `src/features/explore/filters.ts:72`, `src/features/explore/filters.ts:90`, `src/features/explore/filters.ts:137`
- Symptom: domain/language/study-form inference depends on text contains checks.
- Root cause: generated data does not yet provide explicit normalized taxonomy fields for filters.
- Impact: false positives/false negatives as copy evolves.
- Reproducibility: rename domain labels with ambiguous wording and observe inferred filters changing unexpectedly.
- Recommended change: emit canonical filter taxonomy fields from extraction (`domainTags`, `languageTags`, `studyFormTag`).
- Verification: deterministic fixture tests for inference on known edge cases.

#### M-3: Runtime text normalization still used as safety net in UI paths
- Evidence: `app/(tabs)/favorites/index.tsx:82`, `app/(tabs)/favorites/index.tsx:90`, `src/utils/text.ts:30`
- Symptom: display strings are still normalized at render time.
- Root cause: historical mojibake debt required runtime correction.
- Impact: data-quality regressions can be masked rather than surfaced early.
- Reproducibility: inject malformed copy into generated JSON and observe silent correction in UI.
- Recommended change: keep fallback for resilience, but enforce mojibake scan in extraction/QA and reduce runtime normalization usage to user-input paths.
- Verification: QA step fails on mojibake markers in generated files.

### Low

#### L-1: Favorites visual mappings are route-local and static
- Evidence: `app/(tabs)/favorites/index.tsx:52`, `app/(tabs)/favorites/index.tsx:58`
- Symptom: icon/tone mappings remain hardcoded in route.
- Root cause: metadata contract was introduced for Explore first.
- Impact: maintainability overhead and duplicated mapping rules.
- Reproducibility: add new favorites entity and update route constants manually.
- Recommended change: move favorites visual metadata into generated contract (same model as Explore).
- Verification: remove route-local visual maps and consume generated metadata only.
