# Combat Calculator — Standalone Page

## Context

The combat system (shot, melee, grenade) is currently embedded in the game session as a bottom-sheet modal tied to a specific unit (`ArmyUnit`). Players need a standalone calculator page (`/calculator`) accessible from the landing page where they can manually input all combat parameters without needing an active army or game session. This is useful for theory-crafting, learning mechanics, and quick probability checks.

## Approach

**Refactor + wrapper**: Decouple combat components from `ArmyUnit` by introducing a minimal `CombatantData` interface. Reuse all existing combat UI components (ActionSelector, ParameterInputs, CombatResults, AnimatedDice) with a full-page wrapper instead of a bottom-sheet. Maximum code reuse, minimal duplication.

## CombatantData Interface

```typescript
interface CombatantData {
  type: 'squad' | 'machine'
  range?: string          // "D6", "2D12+1" — undefined triggers Dice Input Popup
  power?: string          // "1D20", "2D6" — undefined triggers Dice Input Popup
  melee: number           // 0-10
  armor: number           // 0-10
  rank: number            // for grenades
  weapons?: WeaponDef[]   // for machines
  grenadesAvailable: boolean
}
```

When `range` or `power` is `undefined`, combat components call `onDataNeeded(field)` callback. The calculator page shows a Dice Input Popup for the user to enter the value.

## Page Layout (`/calculator`)

```
┌─────────────────────────────┐
│ Header: "КАЛЬКУЛЯТОР БОЯ"   │
│ + back button               │
├─────────────────────────────┤
│ RulesSelector               │  ← separate widget
│ [Технолог] [Стар Систем]    │
├─────────────────────────────┤
│ ModifiersSelector           │  ← separate widget
│ Catalog + numeric fields    │
│ +range, +power, +melee,     │
│ -distance, +armor           │
├─────────────────────────────┤
│ ActionSelector              │  ← existing component
│ [Выстрел] [Ближний] [Граната]│
├─────────────────────────────┤
│ ParameterInputs             │  ← existing component (refactored)
│ Distance, armor, melee,     │
│ fortification, toggles      │
│ Range/Power → Dice Popup    │
├─────────────────────────────┤
│ CombatResults               │  ← existing component
│ Animated dice, hit/damage   │
└─────────────────────────────┘
```

RulesSelector and ModifiersSelector are independent widgets that pass `rulesVersion` and `ModifierSummary` down to combat components via props.

Desktop (md+): two-column layout — inputs left, results right. Mobile: vertical scroll.

## Dice Input Popup

Triggered when user taps an empty range/power field in the calculator. Bottom-sheet on mobile, centered modal on desktop.

**Structure:**
1. Title — "ДАЛЬНОСТЬ" or "МОЩНОСТЬ" + current value (empty by default, shows entered notation like "2D12+2" after input)
2. Dice type selector — horizontal row of styled buttons: D6, D12, D20 (styled like AnimatedDice: rounded squares, gradient backgrounds, color-coded glow)
3. Quantity stepper — "-" / count / "+" (range 1-5, 44px touch targets)
4. Bonus stepper — "-" / bonus / "+" (range -10…+10)
5. Preview — "2D12+2" in `font-mono font-black text-2xl`
6. Confirm button

Color coding: blue for range, orange for power (matching CombatResults).

## RulesSelector Widget

Two-tab toggle: "Технолог" (official) / "Стар Систем" (community fan rules). Persists to localStorage as `bronepehota_calculator_rules`. Default: "tehnolog".

Rules version affects:
- Fortification mechanics (armor bonus vs distance penalty)
- Vehicle damage (virtual fire vs zone-based)
- Special effects support
- Grenade distance calculation

## ModifiersSelector Widget

Two input modes:

**Catalog mode** — dropdown/list of standard buffs and debuffs from `src/data/modifiers/standard-modifiers.json`. Selected modifiers shown as removable chips.

**Numeric fields** — quick manual entry:
- +дальность (range_bonus)
- ×дальность (range_multiply)
- +мощь (power_bonus)
- +ближний бой (melee_bonus)
- +броня (armor_bonus)
- −дистанция (distance_penalty)

Outputs `ModifierSummary` consumed by combat flow.

## Refactoring Plan

### Modified Files

1. **`src/hooks/useCombatFlow.ts`** — Accept `CombatantData` instead of requiring full `ArmyUnit`. In standalone mode, read stats from `CombatantData` directly. In game mode, `BottomSheetCombatModal` creates `CombatantData` from `ArmyUnit` (adapter pattern).

2. **`src/components/combat/ParameterInputs.tsx`** — Add optional `onDataNeeded?: (field: 'range' | 'power') => void` prop. When range/power is undefined, render a tappable placeholder that calls the callback instead of the stat display.

3. **`src/components/combat/ActionSelector.tsx`** — Read capabilities from `CombatantData` (e.g., `grenadesAvailable`) instead of deriving from `ArmyUnit` internals.

4. **`src/app/page.tsx`** — Add link to `/calculator` from landing page.

### New Files

1. **`src/app/calculator/page.tsx`** — Next.js page, imports client component
2. **`src/components/calculator/CalculatorPage.tsx`** — Client component, orchestrates:
   - RulesSelector state (localStorage persistence)
   - ModifiersSelector state → ModifierSummary
   - CombatantData state (from user input via Dice Input Popup)
   - Renders: header + RulesSelector + ModifiersSelector + combat flow components
3. **`src/components/calculator/DiceInputPopup.tsx`** — Dice type selector popup
4. **`src/components/calculator/RulesSelector.tsx`** — Rules version toggle widget
5. **`src/components/calculator/ModifiersSelector.tsx`** — Modifiers catalog + numeric fields widget
6. **`src/hooks/useStandaloneCombatFlow.ts`** — Adapter hook managing CombatantData state, connecting to useCombatFlow

### Unchanged Files

- `src/lib/game-logic.ts` — pure functions, already unit-agnostic
- `src/lib/combat-types.ts` — result types
- `src/components/combat/AnimatedDice.tsx` — visual dice component
- `src/components/combat/CombatResults.tsx` — result display
- `src/lib/modifier-utils.ts` — modifier logic
- `src/lib/rules-registry.ts` — rules registry
- `src/data/modifiers/standard-modifiers.json` — modifier catalog data

## Data Flow

```
CalculatorPage
  ├── RulesSelector → rulesVersion (state + localStorage)
  ├── ModifiersSelector → ModifierSummary (state)
  ├── useStandaloneCombatFlow(CombatantData, rulesVersion, ModifierSummary)
  │     └── useCombatFlow(combatantData, ...)
  │           ├── ActionSelector
  │           ├── ParameterInputs
  │           │     └── onDataNeeded('range'/'power') → DiceInputPopup
  │           └── CombatResults
```

## Verification

1. **Type check**: `npm run type-check` passes
2. **Unit tests**: `npm run test` — existing tests still pass, add tests for CombatantData adapter
3. **E2E test**: Navigate to /calculator, select action type, input parameters via Dice Input Popup, verify combat results display correctly
4. **Mobile testing**: Test on mobile viewport — all touch targets ≥ 44px, Dice Input Popup opens as bottom-sheet
5. **Desktop testing**: Two-column layout renders correctly, Dice Input Popup opens as centered modal
6. **Game session regression**: Existing combat flow in game session still works after refactoring
7. **Build**: `npm run build` succeeds (static export)
