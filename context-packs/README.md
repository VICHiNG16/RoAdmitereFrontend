# Context Packs - Stitch to Expo RN

This folder is a reset-safe plan split for multiple Codex instances.

## How to use after reset
1. Open `context-packs/00_master_index.md`.
2. Pick exactly one active pack from `10_phase_packs/`.
3. Give the new instance only:
- `context-packs/00_master_index.md`
- `context-packs/01_locked_decisions.md`
- One phase pack file
4. Require a handoff update in `context-packs/99_handoff_log.md` before stopping.

## Why this works
- Global rules are centralized.
- Each phase has strict scope and acceptance checks.
- Handoffs are standardized, so no context loss between instances.
