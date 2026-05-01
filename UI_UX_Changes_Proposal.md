# SIC App — UI/UX Improvements Backlog (Discovery-only)

**Last updated:** 29 Apr 2026  
**Scope:** Discovery UX polish only (no payments/transactions). Changes are limited to theming consistency, layout consistency, filter behavior correctness, and removing “demo-like” placeholders.

---

## Why this matters (product outcomes)

- **Trust:** remove UI that looks like “fake data” (static dates/venues/offers).
- **Consistency:** one theme system across the app (light + dark works everywhere).
- **Cohesion:** shared header + card rhythm makes modules feel like one product.
- **Low risk:** no new flows, no new business logic, no transactions.

---

## Constraints (to keep implementation clean)

- Use the **existing design system** and theme primitives only (`src/ui/theme/colors.ts`, `useTheme.ts`, existing components).
- Prefer **reusing** existing building blocks (`ScreenHeader`, `FilterBottomSheet`, `EmptyState`, `ErrorState`, `ImageCarousel`) over creating new UI patterns.
- No new screens/routes unless explicitly listed (this backlog avoids new routes).

---

## Current state (what we’re fixing)

### Theme split (root cause)

- `src/ui/context/ThemeContext.tsx` is effectively **light-only**.
- `src/ui/theme/*` is **light + dark**, used in some screens (details) and some domains.

**Result today:** dark mode looks “partial” because list screens/cards/settings still hard-code light colors.

---

## Decisions (locked to reduce future churn)

1) **Single theme source of truth:** standardize on `src/ui/theme/useTheme.ts` + `src/ui/theme/colors.ts`.  
2) **No “real-looking placeholders”:** any hard-coded date/time/venue/offers must be conditional or derived from models.  
3) **List screens share a header contract:** either extend `ScreenHeader` OR introduce one shared list header component (see P1-01).

---

## Backlog (implementation-ready)

Each item includes: **Touchpoints**, **Steps**, and **Acceptance criteria**.

### P0 — Must do (unblocks consistent dark mode + trust)

#### P0-01 — Unify theming (single source of truth)

**Goal:** remove hard-coded hex colors from major discovery surfaces; ensure light/dark parity.

- **Touchpoints:**
  - `src/app/navigation/TabsNavigator.tsx`
  - `src/domains/restaurants/screens/RestaurantListScreen.tsx`
  - `src/domains/tiffins/screens/TiffinListScreen.tsx`
  - `src/domains/events/screens/EventListScreen.tsx`
  - `src/domains/settings/screens/SettingsScreen.tsx`
  - `src/domains/*/components/*Card.tsx`
- **Steps:**
  - Replace hard-coded backgrounds/borders/text colors with `colors.*` tokens from `src/ui/theme/colors.ts`.
  - Remove `ThemeContext` usage from screens where it blocks dark mode (migrate to `useTheme`).
- **Acceptance criteria:**
  - Switching theme updates **backgrounds, cards, and text** for Restaurants/Tiffins/Events/Settings.
  - No visible “light-only” blocks remain on list screens.

#### P0-02 — Bottom tabs: safe area + theme-aware surface

**Goal:** tabs feel consistent on all devices and in dark mode.

- **Touchpoints:** `src/app/navigation/TabsNavigator.tsx`
- **Steps:**
  - Replace fixed tab bar height/padding with safe-area based spacing.
  - Use theme tokens for tab bar background/border and active/inactive icon colors.
- **Acceptance criteria:**
  - Tab bar background matches theme (light/dark).
  - No excessive empty height; bottom padding adapts to device safe area.

#### P0-03 — Remove “real-looking placeholders” (data integrity polish)

**Goal:** UI never shows convincing but incorrect information.

- **Touchpoints:**
  - `src/domains/events/components/EventCard.tsx`
  - `src/domains/events/screens/EventListScreen.tsx`
  - `src/domains/restaurants/components/RestaurantCard.tsx`
- **Steps:**
  - Event date/time/venue strings must come from the event model (or show a neutral fallback).
  - Restaurant offer ribbon only renders when an offer exists.
  - Location label shows only if known; otherwise show neutral CTA text.
- **Acceptance criteria:**
  - No static “Thu, 05 Nov…” / fixed venue text.
  - No offer ribbon unless data supports it.
  - Location never lies.

#### P0-04 — Events list: apply filters/sort for real

**Goal:** filters are not “cosmetic”; state must change results.

- **Touchpoints:** `src/domains/events/screens/EventListScreen.tsx`
- **Steps:**
  - Ensure `dateFilter` and `sortBy` are applied to the displayed list.
  - Keep filtering logic local to the screen (no new global state required).
- **Acceptance criteria:**
  - Changing sort/filter visibly changes the list ordering/content.

#### P0-05 — Settings: appearance toggle + guest CTA correctness

**Goal:** users can control theme and guest actions are not confusing.

- **Touchpoints:**
  - `src/domains/settings/screens/SettingsScreen.tsx`
  - `src/store/slices/uiSlice.ts` (theme state)
  - `src/ui/theme/*` (integration only)
- **Steps:**
  - Wire an “Appearance” toggle to the existing Redux theme mechanism.
  - Update guest CTA to navigate to Auth flow (do not call `logout` for “Login / Sign Up”).
- **Acceptance criteria:**
  - Theme toggle changes app theme immediately.
  - Guest CTA always routes to authentication screens.

#### P0-06 — Edit Profile: migrate off ThemeContext

**Goal:** remove a known theme mismatch and broken token usage (`theme.primary`).

- **Touchpoints:** `src/domains/settings/screens/EditProfileScreen.tsx`
- **Steps:**
  - Replace ThemeContext palette usage with `useTheme()` tokens.
- **Acceptance criteria:**
  - Screen renders correctly in light/dark.
  - No references to tokens that don’t exist.

---

### P1 — Should do (cohesion + consistency)

#### P1-01 — Standardize discovery list header

**Goal:** Restaurants/Tiffins/Events list pages share one consistent header layout.

- **Option A (lower code footprint):** extend `ScreenHeader` with optional slots for greeting + search.
- **Option B (clearer separation):** create a single shared `DiscoveryHeader` component used by all three list screens.

**Acceptance criteria:**
- Same spacing/typography across list headers.
- Search placement is consistent (either local per list or via global search, but not both confusingly).

#### P1-02 — Standardize card style + spacing

**Goal:** cards look like a family.

- **Touchpoints:**
  - `src/domains/restaurants/components/RestaurantCard.tsx`
  - `src/domains/tiffins/components/*`
  - `src/domains/events/components/EventCard.tsx`
- **Acceptance criteria:**
  - Same radius family and spacing rhythm across the three domains.
  - Borders/shadows are consistent and theme-aware.

#### P1-03 — Filtering UX consistency

**Goal:** one filter mental model across modules.

- Use `FilterBottomSheet` as the single home for filters (Sort + Category + Offers + Veg + Rating).
- Keep at most 1–2 quick chips outside the sheet (optional).

**Acceptance criteria:**
- Restaurants/Tiffins/Events filter UI behaves consistently.
- “Active filters count” is visible and correct.

#### P1-04 — Accessibility + touch targets

**Goal:** tappable elements are accessible and easy to hit.

- Ensure icon-only buttons include `accessibilityRole`, `accessibilityLabel`, and `hitSlop`.

**Acceptance criteria:**
- All icon-only actions announce properly to screen readers.
- Tap targets meet ~44×44 minimum.

---

### P2 — Nice to have (small polish)

#### P2-01 — Search input: clear (×) button

- **Touchpoints:** `src/domains/search/screens/SearchScreen.tsx`
- **Acceptance criteria:**
  - Clear button appears only when there is text; clears input and results state predictably.

#### P2-02 — Recent searches (optional)

- Local-only via storage; keep UX lightweight.

---

## Suggested execution plan (sequenced to reduce rework)

1) **Theme foundation**: P0-01 + P0-02 (unblocks dark mode everywhere).
2) **Trust cleanup**: P0-03 (remove placeholder data patterns).
3) **Correctness**: P0-04 (events filtering/sorting actually works).
4) **Settings + profile**: P0-05 + P0-06.
5) **Cohesion**: P1-01 + P1-02 + P1-03.
6) **Polish**: P1-04 and P2 items.

---

## QA checklist (fast, repeatable)

- Toggle light/dark; verify Restaurants/Tiffins/Events/Settings backgrounds + cards + text all update.
- Verify tab bar safe area on devices/emulators with different insets.
- Confirm no “static” event dates/venues or offer ribbons show without data.
- Confirm Events list filter/sort changes results.
- Tap-test all icon-only buttons (labels + hit areas).

---

## Notes / optional docs cleanup

- `filtering_changes_overview.md` and `icons_and_theme_overview.md` still reference older paths (e.g. `src/modules`, `src/core`). Consider updating them to match current structure (`src/domains`, `src/app`, `src/store`).
