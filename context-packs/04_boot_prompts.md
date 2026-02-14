# Boot Prompts Per Instance

Use one prompt per new instance. Keep scope strict.

## Instance A (Phase 0)
"Read context-packs/00_master_index.md, context-packs/01_locked_decisions.md, context-packs/02_repo_contract.md, and context-packs/10_phase_packs/phase_0_extraction.md. Implement only that phase and append handoff to context-packs/99_handoff_log.md."

## Instance B (Phase 1)
"Read context-packs/00_master_index.md, context-packs/01_locked_decisions.md, context-packs/02_repo_contract.md, context-packs/99_handoff_log.md, and context-packs/10_phase_packs/phase_1_scaffold.md. Implement only that phase and append handoff to context-packs/99_handoff_log.md."

## Instance C (Phase 2)
"Read context-packs/01_locked_decisions.md, context-packs/02_repo_contract.md, context-packs/99_handoff_log.md, and context-packs/10_phase_packs/phase_2_shared_components.md. Implement only that phase and append handoff to context-packs/99_handoff_log.md."

## Instance D (Phase 3A)
"Read locked decisions, repo contract, latest handoff log, and phase_3a_explore_tabs.md. Implement only that phase and append handoff."

## Instance E (Phase 3B + 3C)
"Read locked decisions, repo contract, latest handoff log, and phase_3b_university_detail.md then phase_3c_faculty_detail.md. Implement only those phases and append handoff."

## Instance F (Phase 3D + 3E)
"Read locked decisions, repo contract, latest handoff log, and phase_3d_program_detail.md then phase_3e_filters.md. Implement only those phases and append handoff."

## Instance G (Phase 3F)
"Read locked decisions, repo contract, latest handoff log, and phase_3f_favorites.md. Implement only that phase and append handoff."

## Instance H (Phase 4)
"Read locked decisions, repo contract, latest handoff log, and phase_4_animations.md. Implement only that phase and append handoff."

## Instance I (Phase 5)
"Read locked decisions, repo contract, latest handoff log, and phase_5_qa.md. Implement only that phase and append final handoff."

## Instance J (Wave 1 - Core Visual Fix)
"Read locked decisions, repo contract, and latest handoff log. Implement only Wave 1: fix mojibake/diacritics in active routes, fix bottom tab route names/labels/icons, remove duplicate top status area, and correct top spacing/proportions for Explore + Favorites. Do not implement shared state or filter logic. Run `npm run typecheck` and append handoff."

## Instance K (Wave 2 - Shared State + Dead Buttons)
"Read locked decisions, repo contract, and latest handoff log. Implement only Wave 2: add shared app state for favorites/filters and wire dead controls so every visible button does something (including favorite toggles and detail `Site oficial` with URL map + fallback feedback). Do not do parity/performance signoff. Run `npm run typecheck` and append handoff."

## Instance L (Wave 3 - Real Filters + Search)
"Read locked decisions, repo contract, and latest handoff log. Implement only Wave 3: make filter options toggle real draft state, `Reseteaza` restore defaults, `Aplica` persist filters to Explore lists, and make Explore search actually filter by active tab. Keep deterministic data order. Run `npm run typecheck` and append handoff."

## Instance M (Wave 4 - Final QA Signoff)
"Read locked decisions, repo contract, latest handoff log, and phase_5_qa.md. Implement only Wave 4: run Android-first then iOS parity/performance QA, resolve remaining discrepancies, and produce final discrepancy status. Run `npm run typecheck` and `python scripts/run_phase5_qa.py`, then append FINAL handoff."
