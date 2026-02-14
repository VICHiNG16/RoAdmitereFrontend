# Phase 0 Extraction Report

## Scope
- Implemented only Phase 0: Stitch HTML extraction, token grounding, mock data grounding, typed data models.
- No Expo scaffold, no React Native UI, no navigation, no animation work.

## Scripts Added
- `scripts/extract_stitch_manifest.py`
- `scripts/extract_tokens.py`
- `scripts/extract_mock_data.py`
- `scripts/run_phase0_extraction.py`
- `scripts/extraction_common.py`

## Typed Models Added
- `src/data/mock/types.ts`

## Generated Outputs
- `src/theme/generated/tokens.raw.json`
- `src/data/mock/generated/stitch-manifest.json`
- `src/data/mock/generated/mock-data.raw.json`
- `src/data/mock/generated/universities.json`
- `src/data/mock/generated/faculties.json`
- `src/data/mock/generated/programs.json`
- `src/data/mock/generated/filters.json`
- `src/data/mock/generated/favorites.json`
- `src/data/mock/generated/screen-copy.json`

## Validation Commands
```powershell
python -m py_compile scripts/extraction_common.py scripts/extract_stitch_manifest.py scripts/extract_tokens.py scripts/extract_mock_data.py scripts/run_phase0_extraction.py
$env:PYTHONIOENCODING='utf-8'; python scripts/run_phase0_extraction.py
```

## Validation Results
- Parsed screens count: `13` (pass)
- Manifest titles match source HTML titles: `yes` (pass)
- Token summary printed: `yes` (pass)
- Mock data summary printed: `yes` (pass)
- Deterministic output order confirmed: `yes` (pass)
- Deterministic regeneration hash check (`tokens.raw.json`, `stitch-manifest.json`, `mock-data.raw.json`): `stable=true` (pass)
- UTF-8 Romanian diacritics preserved in generated JSON (verified by UTF-8 Python reads).

## Current Extracted Counts
- Universities: `3`
- Faculties: `12`
- Programs: `12`
- Filter screens: `3`
- Favorite collections: `3`
- Screen copy entries: `13`
