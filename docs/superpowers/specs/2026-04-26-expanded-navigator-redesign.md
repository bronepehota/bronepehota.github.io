# Expanded Navigator Redesign — Military HUD

**Date**: 2026-04-26
**Status**: Approved

## Problem

The expanded navigator in game session mode is a flat grid of identical small thumbnails with no grouping, no status labels, and no quick stat overview. It looks outdated and doesn't use the full-screen space effectively.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Visual style | Military HUD — dark, angular, faction-colored accents |
| Section layout | Vertical — Active, Done, Dead (top to bottom) |
| Card size | Medium — image + name + 2-3 key stats |
| Click behavior | Close navigator and navigate to unit |

## Component Changes

### UnitNavigationCard (expanded mode variant)

The existing `UnitNavigationCard` component stays for compact dock mode. The expanded view gets a new component or a size variant with:

- **Width**: ~100px (responsive, fills available columns)
- **Image area**: 55px height, unit image with gradient overlay
- **Number badge**: Top-left, monospace font, dark background with border
- **Name**: Bold, 10px, below image
- **Stats row**: 2-3 compact stat indicators:
  - Squad: power (⚔), armor (🛡), alive soldiers (♥)
  - Machine: primary weapon power (⚔), durability (HP)
- **Border radius**: 4px (angular, military feel)
- **Faction-colored border**: Active cards use faction accent color (red/cyan/yellow)

### Section Headers

Each section has a header bar with:
- **Diamond-shaped indicator** (CSS `clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)`)
- **Section label**: Uppercase, letter-spacing 2px, 11px
- **Count badge**: Right-aligned, semi-transparent background matching section color
- **Bottom border**: 1px solid in section color

### Section Styling

| Section | Indicator color | Border color | Card border | Card opacity |
|---------|----------------|-------------|-------------|-------------|
| Active (Активные) | Faction color | Faction color /30 | Faction color | 1.0 |
| Done (Походили) | #22c55e green | #14532d | #166534 | 0.7 |
| Dead (Убитые) | #991b1b dark red | #7f1d1d | #7f1d1d | 0.5 |

Dead unit names get `text-decoration: line-through`.

### Expanded View Layout

Replace current flat grid with three vertical sections. Each section:
1. Section header with indicator, label, count
2. Flex-wrap row of unit cards within that section
3. Sections scroll vertically within the expanded panel

### Top Bar

Add a minimal top bar to the expanded view:
- Left: "Полевой обзор" label (uppercase, muted)
- Right: "⟷ свайп вниз для закрытия" hint (muted)

### Collapsed Sections

When a section has 0 units (e.g., no dead units yet), the section header still renders but shows count "0" and the card area is empty. This keeps spatial consistency so users know where to look as the game progresses.

## Files to Modify

1. **`src/components/GameSession/UnitNavigationCard.tsx`** — Add expanded variant or accept a `variant` prop
2. **`src/components/GameSession.tsx`** — Replace expanded grid with sectioned layout (the `isDockExpanded` ternary and surrounding dock container, roughly lines 790-860)
3. **Potentially new**: `src/components/GameSession/ExpandedNavigator.tsx` — Extract expanded view into its own component to keep GameSession manageable

## Testing Requirements

- **Unit tests**: Test section grouping logic (categorize units into active/done/dead)
- **E2E tests**: Expand navigator, verify sections render, click unit closes navigator and navigates
- **Lint/Type-check**: All changes must pass `npm run validate`

## Behavior

- **Click unit**: `setFocusedUnitIdx(idx)` + `setIsDockExpanded(false)` — same as current
- **Swipe down**: Collapse to compact dock — same as current
- **Keyboard**: Not in scope for this redesign — no existing keyboard navigation to preserve

## Stats Derivation

Card stats map to actual data fields as follows:

| Display | Squad source | Machine source |
|---------|-------------|----------------|
| ⚔ Power | First soldier's `power` field (e.g. "1D6") | First weapon's `power` field |
| 🛡 Armor | First soldier's `armor` field (number) | — (not shown) |
| ♥ Alive | `soldiers.length - (deadSoldiers?.length \|\| 0)` | — (not shown) |
| HP | — | `currentDurability / durability_max` |

For squads, use first soldier (index 0) stats. For machines, use first weapon (index 0).

## Responsive Grid

Cards use `flex-wrap` within each section with `gap: 10px`. Card width is fixed at ~100px on mobile, filling naturally. Column counts are not hardcoded — `flex-wrap` handles responsive behavior automatically. On wider screens more cards fit per row.

## Props Interface (Expanded Variant)

New component `ExpandedUnitCard` receives:

```typescript
interface ExpandedUnitCardProps {
  unit: ArmyUnit;
  originalIndex: number;
  isActive: boolean;
  section: 'active' | 'done' | 'dead';
  isMachine: boolean;
  onClick: () => void;
  faction: FactionID;
}
```

Status derivation (isDone, isDead) moves to the parent `ExpandedNavigator` component, which groups units into sections and passes `section` prop down. This avoids duplicate status calculations.

## Accessibility

- Cards remain `<button>` elements with `aria-label` including unit name and status
- Section headers use `role="region"` with `aria-label` (e.g., "Активные юниты")
- Dead unit text with `line-through` has sufficient contrast (#fca5a5 on dark background)
- Section count badges include `aria-label` for screen readers

## Edge Cases

- **All units dead**: Active and Done sections render with count "0", Dead section contains all cards. No special handling needed — the vertical scroll accommodates this naturally.
- **No units**: Should not happen (army always has at least one unit), but all three sections render with count "0".

## Faction Color Integration

Active section cards use `getFactionColors(faction)` from `@/lib/faction-colors` directly (not the `getUnitDockStyles` wrapper). Use `border`, `text`, and `glow` keys from the returned object. Done and Dead sections use fixed green/red regardless of faction.
