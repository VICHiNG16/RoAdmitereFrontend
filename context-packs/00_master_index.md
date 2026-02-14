# 00 Master Index

## Source of truth
- Full original plan: `STITCH_EXPO_PORT_PLAN.md`
- Stitch input screens: `stitch_roadmitere/**/code.html` and `stitch_roadmitere/**/screen.png`

## Always load first
1. `context-packs/01_locked_decisions.md`
2. `context-packs/02_repo_contract.md`

## Phase packs (one active at a time)
1. `context-packs/10_phase_packs/phase_0_extraction.md`
2. `context-packs/10_phase_packs/phase_1_scaffold.md`
3. `context-packs/10_phase_packs/phase_2_shared_components.md`
4. `context-packs/10_phase_packs/phase_3a_explore_tabs.md`
5. `context-packs/10_phase_packs/phase_3b_university_detail.md`
6. `context-packs/10_phase_packs/phase_3c_faculty_detail.md`
7. `context-packs/10_phase_packs/phase_3d_program_detail.md`
8. `context-packs/10_phase_packs/phase_3e_filters.md`
9. `context-packs/10_phase_packs/phase_3f_favorites.md`
10. `context-packs/10_phase_packs/phase_4_animations.md`
11. `context-packs/10_phase_packs/phase_5_qa.md`

## Instance sequencing recommendation
1. Instance A: Phase 0
2. Instance B: Phase 1
3. Instance C: Phase 2
4. Instance D: Phase 3a
5. Instance E: Phase 3b + 3c
6. Instance F: Phase 3d + 3e
7. Instance G: Phase 3f
8. Instance H: Phase 4
9. Instance I: Phase 5

## Reset protocol
1. New instance reads only required files.
2. New instance executes only active phase scope.
3. New instance appends status to `context-packs/99_handoff_log.md`.
4. If blocked, add blocker and next action in handoff log.
