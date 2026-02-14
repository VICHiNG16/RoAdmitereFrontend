# RoAdmitere Frontend Polish Checklist

## Baseline capture set (Wave 0)
- [ ] iOS captures exported for Explore, Favorites, details, and filters.
- [ ] Android captures exported for Explore, Favorites, details, and filters.
- [ ] Short interaction videos recorded for tab switching, favorites switching, and filter modal open/close.

## PR guardrails
- [ ] No spring-based menu/tab transitions.
- [ ] No haptic feedback triggers.
- [ ] No new raw visual literals in route files (`app/**`): colors, rgba overlays, ad-hoc shadow values.
- [ ] New spacing/radius values use `theme` tokens.

## Motion quality checks
- [ ] Tab/segment transitions use calm timing motion only.
- [ ] Card press response is subtle and does not exceed `0.985` scale.
- [ ] Filter modal open/close motion is timing-based and deterministic.
- [ ] Reduced-motion mode removes non-essential movement.

## Visual rhythm checks
- [ ] Search, segmented controls, and card grids align on shared horizontal rails.
- [ ] Favorites grid uses deterministic two-column rows without uneven trailing gaps.
- [ ] Detail headers and action rows follow consistent spacing hierarchy.
- [ ] Filter footers do not overlap content on small screens.

## Accessibility and text checks
- [ ] Romanian diacritics render correctly across tabs, details, and filters.
- [ ] Long labels do not clip in pills, cards, footer actions, or segmented tabs.
- [ ] Touch targets remain usable (`>=40` logical px where practical).

## Final validation
- [ ] `npm run typecheck` passes.
- [ ] `python scripts/run_phase5_qa.py` passes with updated captures.
- [ ] Manual iOS and Android walkthrough completed.
