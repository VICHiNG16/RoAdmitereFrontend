# Phase 0 - Extraction and Data Grounding

## Load in this instance
1. `context-packs/01_locked_decisions.md`
2. `context-packs/02_repo_contract.md`
3. This file only

## In scope
1. Parse all Stitch HTML files in `stitch_roadmitere/**/code.html`.
2. Generate manifest, raw token outputs, and mock data outputs.
3. Create typed data models for extracted entities.

## Out of scope
- Expo scaffold
- RN UI
- Navigation
- Animations

## Required outputs
- scripts for manifest/tokens/mock extraction
- generated JSON files under `src/theme/generated` and `src/data/mock/generated`
- extraction report doc

## Acceptance
1. Parsed screens count is 13.
2. Manifest titles match source HTML titles.
3. Token summary and mock data summary are printed.
4. Deterministic output order confirmed.

## Handoff required
Append completion details to `context-packs/99_handoff_log.md`.
