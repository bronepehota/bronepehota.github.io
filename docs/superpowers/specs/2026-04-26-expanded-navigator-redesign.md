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
  - Squad: attack (⚔), armor (🛡), alive soldiers (♥)
  - Machine: attack (⚔), HP
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
2. **`src/components/GameSession.tsx`** — Replace expanded grid with sectioned layout (lines ~813-858)
3. **Potentially new**: `src/components/GameSession/ExpandedNavigator.tsx` — Extract expanded view into its own component to keep GameSession manageable

## Testing Requirements

- **Unit tests**: Test section grouping logic (categorize units into active/done/dead)
- **E2E tests**: Expand navigator, verify sections render, click unit closes navigator and navigates
- **Lint/Type-check**: All changes must pass `npm run validate`

## Behavior

- **Click unit**: `setFocusedUnitIdx(idx)` + `setIsDockExpanded(false)` — same as current
- **Swipe down**: Collapse to compact dock — same as current
- **Keyboard**: Arrow keys still work for navigation within expanded view

## Faction Color Integration

Active section cards use `getFactionColors(faction)` from `@/lib/faction-colors` for border and indicator colors. Done and Dead sections use fixed green/red regardless of faction.
