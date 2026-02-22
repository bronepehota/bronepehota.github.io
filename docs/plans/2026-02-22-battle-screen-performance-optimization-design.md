# Design: Battle Screen Performance Optimization

**Date:** 2026-02-22
**Status:** Approved
**Priority:** High

## Problem

After the battle screen redesign with special effects, the app lags noticeably (3-5 seconds) on mid-range Android phones when switching between units.

## Root Cause Analysis

Identified performance bottlenecks in `GameSession.tsx`:

1. **Animated CSS effects** (highest impact):
   - `combat-grid-bg` - infinite background-position animation
   - SVG noise overlay with `feTurbulence` filter
   - Animated scan line
   - 4x corner brackets with `animate-pulse-slow`

2. **Navigation dock re-renders**:
   - 10-20+ `<Image>` components re-render on every unit switch
   - No memoization of navigation cards

3. **UnitCard re-renders**:
   - Complex component with many `useState` hooks
   - `_shortenWeaponName` function created on every render
   - SoldierCard components re-render unnecessarily

## Solution

### 1. Remove Heavy CSS Effects (Global)

Remove from `GameSession.tsx`:
- Lines 306-345: Entire "Battle Screen Atmosphere - Tactical HUD Effects" section
- Keep only: vignette effect (lightweight radial-gradient)

Update `globals.css` - remove unused animations:
- `.combat-grid-bg` (lines 706-712)
- `.combat-scanlines` (lines 714-724)
- `.animate-scan` related code

**Expected impact:** ~80% performance improvement

### 2. Memoize Navigation Dock Components

Create `UnitNavigationCard.tsx`:
```tsx
const UnitNavigationCard = memo(({ unit, isActive, onClick, ... }) => {
  // Render single unit nav card with Image
}, (prev, next) => {
  // Custom comparison for props
});
```

Move `getUnitDockStyles` outside component (or use `useMemo`).

### 3. Optimize UnitCard

Move `_shortenWeaponName` to `src/lib/unit-utils.ts`:
```typescript
export function shortenWeaponName(name: string): string { ... }
```

Memoize SoldierCard in UnitCard:
```tsx
const MemoizedSoldierCard = memo(SoldierCard, arePropsEqual);
```

### 4. Testing Checklist

- [ ] Visual check: No lag when switching units on Android
- [ ] FPS check: 55-60 FPS in Chrome DevTools
- [ ] Regression: Combat modals still work
- [ ] Regression: Navigation functions correctly

## Implementation Order

1. Remove CSS effects (quick win, high impact)
2. Move helper function to utils
3. Memoize navigation cards
4. Memoize SoldierCard
5. Test on device

## Files to Modify

- `src/components/GameSession.tsx` - remove effects, add memo
- `src/components/cards/UnitCard.tsx` - add memo, use utils
- `src/app/globals.css` - cleanup unused animations
- `src/lib/unit-utils.ts` - add `shortenWeaponName`
- `src/components/GameSession/UnitNavigationCard.tsx` - new file

## Success Criteria

- Unit switching is instant (< 100ms) on mid-range Android
- FPS stays above 55 during interactions
- Visual style remains acceptable (cleaner but still tactical)
