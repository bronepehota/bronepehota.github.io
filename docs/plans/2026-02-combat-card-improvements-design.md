# Combat Card Improvements Design

**Date:** 2026-02-20
**Status:** Approved
**Component:** UnitCard → SoldierCard refactoring

## Overview

Redesign the combat card ("карточка боя") for better UX and visual clarity. Focus on mobile-first interaction with long-press gestures, visual status indicators, and improved button styling.

## Requirements

| # | Requirement | Solution |
|---|-------------|----------|
| 1 | Undo "end turn" for soldier | Long-press (600ms) on ГОТОВ button |
| 2 | Don't dim heavily on done | Soft opacity-90 instead of opacity-70 |
| 3 | Status stripe for done/dead/panic | Left-side colored stripe (green/red/orange) |
| 4 | Highlight armor value | Border + glow, same size |
| 5 | Interactive button styling | Gradient + glow for ЗАВЕРШИТЬ/УБИТЬ |

## Architecture

### New Component Structure

```
src/components/cards/
├── UnitCard.tsx          (existing, simplified)
├── SoldierCard.tsx       (NEW - single soldier card)
└── soldier-card/
    ├── StatusStripe.tsx      (NEW - colored status stripe)
    ├── SoldierStats.tsx      (NEW - armor, speed, etc.)
    ├── SoldierActions.tsx    (NEW - action buttons)
    └── SoldierImage.tsx      (NEW - photo with overlays)
```

### SoldierCard Structure

```tsx
<SoldierCard>
  <StatusStripe state={done | dead | panic | active} />
  <div className="flex">
    <div className="flex-1">
      <SoldierActions />
      <SoldierStats />
    </div>
    <SoldierImage />
  </div>
</SoldierCard>
```

## Visual Design

### StatusStripe Component

| State | Gradient | Glow | Width |
|-------|----------|------|-------|
| Active | Transparent | None | 4px |
| Done | Emerald-500→600 | Green | 6px |
| Dead | Red-600→700 | Red | 6px |
| Panic | Orange-500→Amber-500 | Orange | 6px |

```tsx
const stripeColors = {
  done: 'from-emerald-500 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
  dead: 'from-red-600 to-red-700 shadow-[0_0_12px_rgba(220,38,38,0.5)]',
  panic: 'from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(251,146,60,0.5)]',
  active: 'transparent',
};
```

### Soft Dimming

```tsx
// Before: isDone ? "opacity-70 grayscale-[0.3]" : ""
// After:
isDone ? "opacity-90" : ""
```

### Button Gradient + Glow

```tsx
// ГОТОВ button
className="bg-gradient-to-br from-emerald-600 to-emerald-800
           hover:from-emerald-500 hover:to-emerald-700
           shadow-[0_0_15px_rgba(16,185,129,0.5)]
           hover:shadow-[0_0_20px_rgba(16,185,129,0.7)]"

// УБИТЬ button
className="bg-gradient-to-br from-red-700 to-red-900
           hover:from-red-600 hover:to-red-800
           shadow-[0_0_15px_rgba(220,38,38,0.5)]
           hover:shadow-[0_0_20px_rgba(220,38,38,0.7)]"
```

### Armor Highlight (Style Only, Same Size)

```tsx
<div className="relative p-0.5 md:p-1 rounded-lg md:rounded-full
            min-h-[44px] min-w-[42px] md:min-w-[56px]
            bg-yellow-950/30 border-2 border-yellow-500/50
            shadow-[0_0_8px_rgba(234,179,8,0.25)]">
  <Shield className="w-[14px] md:w-[18px] text-yellow-400 mb-1 md:mb-0 shrink-0" />
  <span className="text-xs md:text-sm font-mono font-black text-yellow-200 leading-none">
    {s.armor}
  </span>
  <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-yellow-400/40" />
  <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-yellow-400/40" />
</div>
```

## Interactions

### Long Press for Undo

**New hook:** `src/hooks/useLongPress.ts`

```tsx
interface UseLongPressOptions {
  onLongPress: () => void;
  ms?: number;  // Default: 500ms
}

// Usage:
const doneLongPress = useLongPress({
  onLongPress: () => toggleAction(idx, 'done'),
  ms: 600,
});

const deathLongPress = useLongPress({
  onLongPress: () => toggleDead(idx),
  ms: 600,
});
```

**Visual feedback:**
- Press: `scale-95 opacity-80`
- Holding: pulsing white overlay
- 600ms → action triggered

## State Management

No new fields in `ArmyUnit`. Uses existing:
- `actionsUsed[idx].done` - toggle back to false
- `deadSoldiers: number[]` - remove idx

## Files

### New Files
- `src/components/cards/SoldierCard.tsx`
- `src/components/cards/soldier-card/StatusStripe.tsx`
- `src/hooks/useLongPress.ts`
- `src/hooks/__tests__/useLongPress.test.ts`

### Modified Files
- `src/components/cards/UnitCard.tsx`

## Testing

### Unit Tests for useLongPress
- Calls callback after 600ms
- Cancels if released early
- Resets timer on rapid tap

### Edge Cases
- Dead + long-press → alive (panic preserved)
- Missing actionsUsed → initialize empty object
- Empty deadSoldiers → toggle adds idx

## Accessibility

- `aria-pressed` on toggle buttons
- `aria-label`: "Долгое нажатие для отмены"
- `title` attribute for desktop tooltip
