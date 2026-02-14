# Frontend Problem Matrix

| ID | Severity | Evidence | Impact | Root Cause | Risk | Proposed Change | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| H-1 | High | `app/(tabs)/favorites/index.tsx:103` | Change amplification and regression risk in favorites flow | Route owns state + rendering + navigation + motion orchestration | High | Extract `src/features/favorites/*` selectors/presentation/sections and keep route thin | Route complexity drops, tests still pass |
| H-2 | High | `app/(tabs)/explore/index.tsx:365`, `app/(tabs)/favorites/index.tsx:215` | Potential frame drops with larger datasets | Non-virtualized mapping in `View`/`ScrollView` | High | Move to `FlatList`/`SectionList` with memoized items | Perf profiling on synthetic large dataset + `phase5` pass |
| M-1 | Medium | `src/features/explore/presentation.ts:9` | Silent style drift if metadata missing | Runtime defaults for missing metadata | Medium | Add strict metadata completeness assertion during extraction | Extraction fails when metadata incomplete |
| M-2 | Medium | `src/features/explore/filters.ts:72` | Incorrect filtering when copy labels change | Heuristic substring inference | Medium | Emit canonical taxonomy tags in generated data | Deterministic tests over edge-case fixtures |
| M-3 | Medium | `src/utils/text.ts:30`, `app/(tabs)/favorites/index.tsx:82` | Data quality issues can be masked | Runtime normalization remains broad | Medium | Keep fallback but enforce stricter ingestion/QA checks | Mojibake scan fails on bad generated text |
| L-1 | Low | `app/(tabs)/favorites/index.tsx:52` | Duplicate visual mapping maintenance | Route-local metadata constants | Low | Move favorites icon/tone metadata to generated contract | Route constants removed; UI consumes generated map |
