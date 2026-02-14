# Frontend Change Plan

## Summary
- Objective: reduce frontend regression risk while preserving current UX and parity.
- Strategy: incremental, non-breaking refactor with measurable gates.
- Current status: foundational Explore extraction + quality-gate foundation completed.

## Public Interface and Contract Changes
1. Added feature-level Explore contracts:
   - `src/features/explore/types.ts`
   - `ExploreFilterContext`, `ExploreDerivedItem`, `ExploreTabTransitionState`
2. Extended shared tab transition contract:
   - `src/utils/horizontal-tab-swipe.ts`
   - new `OrderedTabTransitionMeta<T>` and `resolveOrderedTabTransitionMeta(...)`
3. Added generated presentation metadata contract:
   - `src/data/mock/types.ts` (`ExplorePresentationMetadata` + related interfaces)
   - `src/data/mock/generated/presentation.json`
4. Expanded project scripts in `package.json`:
   - `lint`, `test`, `test:watch`, `guardrails:frontend`

## Backlog (Prioritized)

### P0 (High impact, low risk)
1. Keep Explore feature extraction stable and tested.
   - Status: implemented.
   - Done in: `src/features/explore/*`, `app/(tabs)/explore/index.tsx`.
2. Enforce local/CI gates for type/lint/test/guardrails/phase5.
   - Status: implemented.
   - Done in: `package.json`, `.eslintrc.cjs`, `jest.config.js`, `scripts/check_frontend_guardrails.py`, `.github/workflows/frontend-quality.yml`.
3. Shift text integrity earlier in ingestion.
   - Status: implemented.
   - Done in: `scripts/extraction_common.py` and regenerated mock outputs.

### P1 (Medium effort, medium risk)
1. Extract favorites feature layer (`src/features/favorites/*`) to reduce route complexity.
   - Status: pending.
   - Risk: moderate due UI parity sensitivity in composite layouts.
2. Move favorites visual mappings into generated metadata.
   - Status: pending.
   - Risk: low; mostly data contract migration.
3. Add metadata completeness assertion in extraction.
   - Status: pending.
   - Risk: low; script-only strictness change.

### P2 (Medium/high effort, controlled risk)
1. Virtualize large card lists in Explore/Favorites.
   - Status: pending.
   - Risk: moderate due animation and spacing parity changes.
2. Replace heuristic filter inference with canonical taxonomy fields.
   - Status: pending.
   - Risk: moderate due extraction/schema updates.
3. Add synthetic large-dataset perf regression suite.
   - Status: pending.
   - Risk: low; test infrastructure only.

## Validation Requirements Per Phase
1. Mandatory for all phases:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test -- --runInBand`
   - `npm run guardrails:frontend`
   - `python scripts/run_phase5_qa.py`
2. Additional for list virtualization phase:
   - large-dataset performance sampling for Explore/Favorites tab switches and scroll.

## Assumptions and Defaults
- Existing Expo Router + Reanimated stack remains unchanged.
- No visual redesign; only reliability and maintainability improvements.
- Runtime text normalization stays as fallback during migration, not as the primary data-quality mechanism.
