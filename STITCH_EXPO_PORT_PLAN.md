# Stitch ZIP to Expo RN (TypeScript) Strict Port Plan

## Summary
1. Build a strict, screen-by-screen RN port from Stitch HTML/CSS into Expo, preserving resting layout pixel-for-pixel, preserving all mock data, then adding animation in a separate pass.
2. Current grounded inventory in `RoAdmitereFrontend/stitch_roadmitere` contains 13 screen folders, each with `code.html` + `screen.png`; CSS is inline in HTML; no separate local mock JSON/fonts/assets were found.
3. All tokenized design values should be centralized once, then reused everywhere (`theme.ts`, `typography.ts`, `shadows.ts`) with zero ad-hoc style drift.

## A) Inventory & Extraction

### 1) ZIP/Export structure (current extracted state)
1. Root found: `RoAdmitereFrontend/stitch_roadmitere`.
2. Per screen: `explorează_universități_X/code.html` + `explorează_universități_X/screen.png`.
3. No standalone `.css` files; styles live in `<script id="tailwind-config">` and `<style>` blocks.
4. No local font files (`.ttf/.otf/.woff`) found.
5. No local mock data files (`.json/.csv`) found.
6. Image assets are mostly remote URLs (`lh3.googleusercontent.com`) plus `data:image/svg+xml` blobs in CSS.

### 2) Screen map (source of truth)
| Screen ID | Source file | Role |
|---|---|---|
| 1 | `stitch_roadmitere/explorează_universități_1/code.html` | Explore: Universități |
| 2 | `stitch_roadmitere/explorează_universități_2/code.html` | University detail |
| 3 | `stitch_roadmitere/explorează_universități_3/code.html` | Explore: Facultăți |
| 4 | `stitch_roadmitere/explorează_universități_4/code.html` | Faculty detail |
| 5 | `stitch_roadmitere/explorează_universități_5/code.html` | Filter: Facultăți |
| 6 | `stitch_roadmitere/explorează_universități_6/code.html` | Explore: Programe |
| 7 | `stitch_roadmitere/explorează_universități_7/code.html` | Program detail |
| 8 | `stitch_roadmitere/explorează_universități_8/code.html` | Favorites: Programe |
| 9 | `stitch_roadmitere/explorează_universități_9/code.html` | Favorites: Universități |
| 10 | `stitch_roadmitere/explorează_universități_10/code.html` | Filter: Universități |
| 11 | `stitch_roadmitere/explorează_universități_11/code.html` | Filter: Programe |
| 12 | `stitch_roadmitere/explorează_universități_12/code.html` | Favorites: Facultăți |
| 13 | `stitch_roadmitere/explorează_universități_13/code.html` | Favorites empty state |

### 3) Token inventory from CSS/Tailwind
1. Core colors repeatedly used: `#E07A5F`, `#C86045`, `#FDFCF5`, `#81B29A`, `#6B9680`, `#F4F1DE`, `#3D405B`, `#FFFFFF`.
2. Variant colors across favorites screens: `#F2DCCB`, `#E9EFEC`, `#F2EFE9`, `#F0EFE9`, `#E6E4DC`, `#EBE7D6`, `#F6E4DF`, `#D1DBD4`, `#E2EBE5`, `#F9F8F1`, `#FAF9F6`, `#FFFCF9`.
3. Shadow primitives found:
   - `soft: 0 10px 40px -10px rgba(0,0,0,0.05)`
   - `card: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)`
   - `sticker: 2px 4px 8px rgba(224,122,95,0.3)`
   - `float: 0 10px 30px -5px rgba(61,64,91,0.15)`
   - `tab: 0 -2px 6px rgba(0,0,0,0.03)`
   - nav custom shadow: `0 -5px 20px -5px rgba(0,0,0,0.05)`.
4. Typography families: `Plus Jakarta Sans` (400–800), `Pacifico`; plus Material Icons/Symbols web fonts.
5. Border radius scale: `8, 16, 24, 32, full` + custom `6px`, `2.5rem`, `2rem`.
6. Notable custom sizes: `h/w 52`, `56`, text sizes `[10,11,12,14,16,18,20,28,32,80]`, `min-height: max(884px,100dvh)` pattern.

### 4) Extraction pipeline (deterministic, no manual copying)
1. Create `scripts/extractStitchManifest.ts`: enumerate screens/files/titles.
2. Create `scripts/extractTokens.ts`: parse HTML and generate raw token JSON.
3. Create `scripts/extractMockData.ts`: parse static text/content/cards/chips/counts into typed JSON.
4. Create `scripts/downloadRemoteAssets.ts`: pull remote `lh3` images into `assets/stitch/` with stable filenames.
5. Generate outputs: `src/theme/generated/tokens.raw.json`, `src/data/mock/generated/*.json`, `src/assets-map.ts`.
6. Manual review step compares generated data against screenshot text before implementation starts.

### 5) Risky parts and mitigation
1. Font parity risk (Google web fonts vs native rendering): use Expo font loading for Plus Jakarta Sans + Pacifico, lock weights and line-heights explicitly.
2. Material Symbols variance (`font-variation-settings`, filled hearts): build icon mapping table and freeze it; fallback to local SVG glyphs where needed.
3. Shadow parity iOS vs Android: map all shadows via `shadows.ts` with platform overrides and per-component calibrated values.
4. `backdrop-blur`, translucent bars, gradients: implement with `expo-blur` + `expo-linear-gradient`.
5. `mix-blend-multiply` logos: pre-process logos onto neutral background if blend effect differs in RN.
6. Absolute/sticky web positioning: convert to `SafeAreaView` + explicit absolute overlays + measured offsets.
7. Romanian diacritics encoding: enforce UTF-8 end-to-end in mock data and TS files; do not retype by hand.

## B) Architecture Proposal (Expo + TS)

### 1) Navigation structure (matching design)
1. Use Expo Router with typed routes.
2. Root: `(tabs)` with 2 custom bottom tabs visually matching Stitch.
3. Explore flow: segmented top tabs inside explore screen (`Universități`, `Facultăți`, `Programe`) + stack pushes to detail screens + filter screens as modal/slide-up routes.
4. Favorites flow: folder-tab UI inside one favorites screen with 3 sub-tabs + empty-state variant.

### 2) Proposed folder/file structure
```text
RoAdmitereFrontend/
  app/
    _layout.tsx
    (tabs)/
      _layout.tsx
      explore/index.tsx
      favorites/index.tsx
    modals/
      filter-universities.tsx
      filter-faculties.tsx
      filter-programs.tsx
      university/[id].tsx
      faculty/[id].tsx
      program/[id].tsx
  src/
    theme/
      theme.ts
      typography.ts
      shadows.ts
      spacing.ts
      radii.ts
      generated/tokens.raw.json
    data/
      mock/
        generated/
        types.ts
        selectors.ts
    components/
      Screen.tsx
      SearchBar.tsx
      SegmentedTabs.tsx
      CardUniversity.tsx
      CardFaculty.tsx
      CardProgram.tsx
      FavoriteButton.tsx
      PillBadge.tsx
      PrimaryButton.tsx
      EmptyState.tsx
      BottomNav.tsx
    features/
      explore/
      favorites/
      filters/
      details/
    utils/
      icons.ts
      parity.ts
  assets/
    fonts/
    stitch/
  scripts/
    extractStitchManifest.ts
    extractTokens.ts
    extractMockData.ts
    downloadRemoteAssets.ts
```

### 3) Token system
1. `theme.ts`: semantic colors and surfaces (`background`, `card`, `accent`, `muted`, tab variants).
2. `typography.ts`: font families, weights, exact `fontSize/lineHeight/letterSpacing`.
3. `shadows.ts`: CSS-to-RN mapped presets per component context.
4. `spacing.ts` + `radii.ts`: canonical numeric scales including one-off custom values from Stitch.
5. Rule: components consume only token files; no inline hex values or arbitrary radii outside tokens.

### 4) Component library (required set)
1. `SearchBar`
2. `SegmentedTabs`
3. `CardUniversity`
4. `CardFaculty`
5. `CardProgram`
6. `FavoriteButton`
7. `PillBadge`
8. `PrimaryButton`
9. `EmptyState`
10. `Screen` wrapper

### 5) Important public APIs/interfaces/types
1. `src/data/mock/types.ts` exports: `University`, `Faculty`, `Program`, `FilterOption`, `FavoriteCollections`.
2. `src/components/*` props are typed with token-driven style variants only.
3. `src/utils/icons.ts` exports frozen `iconMap` so glyph choice is deterministic.
4. Route params are typed for detail screens (`id` required, source context optional).

## C) Implementation Phases (with acceptance criteria)

### Phase 0: Create theme tokens from CSS (no UI)
1. Implement extraction scripts and generate tokens + mock data from all 13 HTML files.
2. Build token mapping docs from raw values to semantic RN tokens.
3. Acceptance criteria: all `code.html` files parsed successfully; generated token/data JSON committed; no manual data transcription.

### Phase 1: Expo scaffold + navigation + asset/font plumbing
1. Initialize Expo TS app, configure Reanimated + Gesture Handler + Router.
2. Load fonts, set up safe-area, status bar behavior, and custom bottom tab shell.
3. Download/cache remote assets locally; wire `assets-map`.
4. Acceptance criteria: app runs on iOS + Android; custom bottom nav skeleton matches layout frame; offline launch works with local assets.

### Phase 2: Shared components built with tokens
1. Implement all shared components listed above.
2. Add a component gallery/dev screen to verify each component variant in isolation.
3. Acceptance criteria: components match Stitch snippets visually; props typed and reusable; no hardcoded design values outside token files.

### Phase 3: Screens in reuse-first order
1. Screen 3.1: Explore (`Universități`, `Facultăți`, `Programe`) from screens 1/3/6.
2. Screen 3.2: University detail from screen 2.
3. Screen 3.3: Faculty detail from screen 4.
4. Screen 3.4: Program detail from screen 7.
5. Screen 3.5: Filters (`universități`, `facultăți`, `programe`) from screens 10/5/11.
6. Screen 3.6: Favorites 3 sub-tabs + empty state from screens 9/12/8/13.
7. Acceptance criteria for each screen: parity checklist passed; text/data equals source HTML; navigation paths wired; no animation work added yet.

### Phase 4: Animation pass (Reanimated)
1. Card press: scale + shadow interpolation.
2. Favorite heart: pop animation + subtle haptic.
3. Segmented indicator: spring + content transition.
4. List entrance: stagger animation.
5. Bottom sheet open/close spring for filter presentation.
6. Acceptance criteria: resting layout unchanged from Phase 3; interaction feels native; reduced-motion fallback disables non-essential motion.

### Phase 5: QA for pixel parity + performance
1. Run per-screen parity checks and screenshot diffs.
2. Run cross-platform checks for shadows, fonts, spacing, tab states, empty states.
3. Validate performance (no dropped-frame hotspots in list/transition paths).
4. Acceptance criteria: parity thresholds met on both platforms; no missing data; all acceptance scenarios pass.

## D) Pixel-Parity Verification Method

### 1) Verification process (screen-by-screen)
1. Add a debug parity overlay mode: source `screen.png` sits above RN screen with opacity slider.
2. Align by landmarks: top status bar baseline, first header text baseline, bottom nav top edge.
3. Capture RN screenshots per screen and compare against reference.

### 2) Measurement checklist per screen
1. Outer paddings/margins.
2. Card dimensions and gaps.
3. Font size, line-height, weight.
4. Radius values for cards/buttons/chips.
5. Shadow shape/intensity.
6. Icon size and placement.
7. Color hex/opacity.
8. Bottom nav height, blur, and safe-area offset.
9. Truncation behavior (`numberOfLines`) and chip text.

### 3) Pixel match definition + tolerance
1. iOS tolerance: spacing/radius within ±1dp, typography baseline within ±1dp, screenshot diff <= 2%.
2. Android tolerance: spacing/radius within ±1.5dp, typography baseline within ±1.5dp, screenshot diff <= 3%.
3. Zero tolerance for wrong text/data, missing elements, wrong nav state.

### 4) Optional snapshot strategy
1. Automate flows with Maestro.
2. Capture device screenshots.
3. Use `pixelmatch` in CI for regression gates with per-screen thresholds.

## Test Cases & Scenarios
1. Explore segmented tab switch keeps exact visual state for each tab dataset.
2. Detail screen entry from each card preserves correct entity data.
3. Filter screen selections update selected chips/count badges correctly.
4. Favorites tabs render exact lists and empty state messaging.
5. Bottom tab switch (`Explorează` <-> `Favorite`) preserves state.
6. Heart toggle updates icon fill, animation, and haptic once per tap.
7. Long text truncates exactly as source (`line-clamp` parity equivalent).
8. Offline mode still renders logos/photos from local assets cache.
9. UTF-8 Romanian diacritics render correctly everywhere.

## E) Execution Prompts (mini-prompts)
1. **Phase 0**: `Implement only Phase 0: parse all Stitch HTML files in RoAdmitereFrontend/stitch_roadmitere, generate token JSON + typed mock data JSON + manifest, no UI code.`
2. **Phase 1**: `Implement only Phase 1: scaffold Expo TS + Router + Reanimated/Gesture/Haptics plumbing, load fonts/assets, and render only navigation shell with custom bottom tabs.`
3. **Phase 2**: `Implement only Phase 2: build shared token-driven components (SearchBar, SegmentedTabs, CardUniversity, CardFaculty, CardProgram, FavoriteButton, PillBadge, PrimaryButton, EmptyState, Screen).`
4. **Phase 3.1 Explore**: `Implement only Explore screens from Stitch 1/3/6 using shared components and generated mock data, no animations.`
5. **Phase 3.2 University Detail**: `Implement only University detail screen from Stitch 2 with exact layout/data and no animations.`
6. **Phase 3.3 Faculty Detail**: `Implement only Faculty detail screen from Stitch 4 with exact layout/data and no animations.`
7. **Phase 3.4 Program Detail**: `Implement only Program detail screen from Stitch 7 with exact layout/data and no animations.`
8. **Phase 3.5 Filters**: `Implement only filter screens from Stitch 10/5/11 with exact controls, selected states, and CTA bar; no animations.`
9. **Phase 3.6 Favorites**: `Implement only favorites flow from Stitch 9/12/8/13 with 3 sub-tabs + empty state, exact data and tab visuals.`
10. **Phase 4**: `Implement only animation pass using Reanimated + Gesture Handler + Haptics, preserving resting layouts from Phase 3 exactly.`
11. **Phase 5**: `Implement only QA pass: parity overlay tooling, screenshot diff checks, cross-platform visual/perf validation, and final discrepancy report.`

## F) Questions & Assumptions

### Missing inputs needed
1. Original Stitch ZIP with any local asset folders not present in current extraction.
2. Any official mock-data file if Stitch exported one separately.
3. Final font source preference: local font files vs Google packages.
4. Target reference devices for “pixel truth” sign-off.

### Safe placeholder approach if missing
1. If no mock-data file: generate typed mock data directly from HTML content and lock it.
2. If no local assets: download and vendor remote image URLs into `assets/stitch/`.
3. If no font files: use Expo Google font packages for Plus Jakarta Sans + Pacifico.
4. If an icon glyph is missing in vector packs: include local SVG fallback to preserve look.

### Explicit assumptions/defaults chosen
1. Expo Router + TypeScript is used.
2. Design tokens are single-source under `src/theme/*`.
3. Favorites are one screen with folder-style internal tabs.
4. Filter screens are modal/slide-up routes with spring open/close animation in Phase 4.
5. Current 13 screens are complete scope unless new ZIP adds screens.

## Next Action Checklist (exact upload/start order)
1. Upload the full Stitch ZIP to `RoAdmitereFrontend/inbox/stitch_export.zip`.
2. Upload pixel-truth screenshots to `RoAdmitereFrontend/pixel_truth/` with stable names `01.png` to `13.png` mapped to the screen table above.
3. Upload any local assets/fonts to `RoAdmitereFrontend/inbox/assets/` and `RoAdmitereFrontend/inbox/fonts/`.
4. Provide a one-line mapping file `RoAdmitereFrontend/inbox/screen_map.csv` if your screenshot naming differs.
5. Start Phase 0 immediately after upload using prompt #1 from section E.

## Suggested improvements to this plan
1. Add CI gate after Phase 3 that blocks merges if any screen diff exceeds threshold.
2. Add generated “design token drift” report so manual style drift is caught early.
3. Add deterministic icon mapping audit script before Phase 2 to prevent late glyph mismatches.
