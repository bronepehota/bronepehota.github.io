# Combat Calculator — Standalone Page

## Context

The combat system (shot, melee, grenade) is currently embedded in the game session as a bottom-sheet modal tied to a specific unit (`ArmyUnit`). Players need a standalone calculator page (`/calculator`) accessible from the landing page where they can manually input all combat parameters without needing an active army or game session. This is useful for theory-crafting, learning mechanics, and quick probability checks.

## Approach

**Refactor + wrapper**: Decouple combat components from `ArmyUnit` by introducing a minimal `CombatantData` interface. Reuse all existing combat UI components (ActionSelector, ParameterInputs, CombatResults, AnimatedDice) with a full-page wrapper instead of a bottom-sheet. Maximum code reuse, minimal duplication.

The calculator mirrors the game session's `BottomSheetCombatModal` flow — same phased state machine (ACTION_SELECT → PARAMETERS → RESULTS → APPLY), same action type tabs, same execute button styling with tech corner decorations. The key difference: combat parameters come from user input (DiceInputPopup) rather than unit data.

## CombatantData Interface

```typescript
interface CombatantData {
  type: 'squad' | 'machine'
  range?: string          // "D6", "2D12+1" — undefined triggers Dice Input Popup
  power?: string          // "1D20", "2D6" — undefined triggers Dice Input Popup
  melee: number           // 0-10
  armor: number           // 0-10
  rank: number            // 0-5, for grenades
  weapons?: WeaponDef[]   // for machines
  grenadesAvailable: boolean
}
```

When `range` or `power` is `undefined`, combat components call `onDataNeeded(field)` callback. The calculator page shows a DiceInputPopup for the user to enter the value. Melee and rank are numeric (0-10 and 0-5 respectively) and also editable via DiceInputPopup in `number` mode.

## Page Flow

The calculator uses the same phased state machine as the game's combat modal:

```
1. Page loads → ACTION_SELECT phase immediately
2. User taps action card (ВЫСТРЕЛ / БЛИЖНИЙ БОЙ / ГРАНАТА) → PARAMETERS phase
3. ParameterInputs shows with dice placeholders ("?" marks) for unfilled stats
4. User taps placeholder → DiceInputPopup opens → sets value
5. User adjusts distance/armor/fortification → taps execute button (ВЫСТРЕЛИТЬ / АТАКОВАТЬ / БРОСИТЬ)
6. CombatResults shows → user taps ПРИНЯТЬ → APPLY phase
7. "Новый расчёт" button → back to ACTION_SELECT
```

Action type tabs (ВЫСТРЕЛ | БЛИЖНИЙ БОЙ | ГРАНАТА) are always visible at top — user can switch anytime, even mid-calculation, via `switchAction()`.

## Page Layout (`/calculator`)

```
┌─────────────────────────────────────┐
│ Header: [←] [icon] ВЫСТРЕЛ  [Rules]│  ← icon + color per action type
├─────────────────────────────────────┤
│ [ВЫСТРЕЛ] [БЛИЖНИЙ БОЙ] [ГРАНАТА]  │  ← action type tabs (always visible)
├─────────────────────────────────────┤
│                                     │
│  ACTION_SELECT:                     │
│    ActionSelector cards             │  ← existing component
│                                     │
│  PARAMETERS:                        │
│    ParameterInputs                  │  ← existing component (extended)
│    Distance/armor/fortification     │
│    Range/Power/Melee/Rank → Popup   │  ← clickable, re-editable
│    [ surprises ] [ aimed ] [EXEC]   │  ← toggle buttons + execute
│                                     │
│  RESULTS:                           │
│    CombatResults                    │  ← existing component
│                                     │
│  APPLY:                             │
│    "Новый расчёт" button            │
│                                     │
│                      [≡ modifiers]  │  ← floating side button
│                                      │
│  Modifiers slide-out panel ──────→  │  ← slide-out from right
│    [Баффы] [Дебаффы] [Ручной]      │  ← tabbed interface
│                                     │
└─────────────────────────────────────┘
```

Desktop (md+): wider content area with hidden tab labels shown. Mobile: vertical scroll, compact tab labels.

## Header

Dynamic header that changes based on selected action:
- **Icon**: Target (shot), Sword (melee), Bomb (grenade) in a colored bordered box
- **Title**: action name in action color, or "Калькулятор боя" when no action selected
- **Colors**: amber (shot), red (melee), emerald (grenade) — matches `BottomSheetCombatModal`

Action colors are defined in `getActionColors()` and shared across header, tabs, and execute button.

## Action Type Tabs

Always-visible tab bar at top. Three tabs with icons (Target, Sword, Bomb). Each tab uses its action color when active. Clicking a tab calls `selectAction()` or `switchAction()` depending on current phase. Tabs are disabled during ROLLING phase.

## DiceInputPopup

Military briefing aesthetic popup for entering combat parameters. Triggered when user taps any unfilled stat placeholder or an existing value (re-editable).

**Dual mode:**
- `dice` mode — for range and power: dice type selector (D6/D12/D20), count stepper (1-5), bonus stepper (-10…+10), notation preview
- `number` mode — for melee (0-10) and rank (0-5): stepper with quick-select grid

**Structure:**
1. Header — status LED (pulsing, color-coded) + field title in `font-mono uppercase` + close button
2. Recent values — persisted history from localStorage (`bronepehota_dice_history`), shows up to 6 unique values with frequency indicator bars. Extracted to `src/lib/dice-history.ts` for testability.
3. Dice type selector (dice mode) — D6/D12/D20 buttons with diagonal accent when selected
4. Count & bonus steppers (dice mode) — side-by-side grid with military frame
5. Preview (dice mode) — large notation display with text-shadow glow
6. Number stepper (number mode) — large centered value with -/+ buttons, quick-select grid (0-10 or 0-5)
7. Submit button — matching action color with tech corner decorations

**Color coding:**
- `blue` — range (ДАЛЬНОСТЬ)
- `orange` — power (МОЩНОСТЬ)
- `cyan` — melee (БЛИЖНИЙ БОЙ)
- `emerald` — rank (РАНГ)

**Scanline overlay**: subtle `combat-scanlines` effect on popup body for military aesthetic.

**Re-editing**: Clicking an already-set dice value in ParameterInputs re-opens the popup with the current value pre-filled.

## Execute Button Panel

Matches `BottomSheetCombatModal` styling exactly:
- **Main button**: action-colored border, bg, text with `textShadow: '0 0 10px rgba(255,255,255,0.3)'`, tech corner decorations (2x2 corner lines), scale animation on hover/active
- **Label**: ВЫСТРЕЛИТЬ / АТАКОВАТЬ / БРОСИТЬ per action type
- **Toggles** (icon buttons, 44px touch targets):
  - Surprise attack (EyeOff icon, purple) — shot and melee only
  - Aimed shot (Crosshair icon, cyan) — shot only, squads only
  - Both show pulse indicator dot when active
- Active toggle labels shown in execute button subtitle on desktop

## Modifiers Panel

Slide-out panel from the right side, triggered by a floating button (SlidersHorizontal icon). Panel contains `ModifiersSelector` component with phase-based filtering.

**Floating button**: Fixed position, right side of screen. Turns purple when modifiers panel is open.

**Tabbed interface** (3 tabs):
1. **Баффы** (Sparkles icon, emerald) — grid of toggle cards from `standard-modifiers.json`. Active cards show pulsing dot, emerald border/glow. Grid: 2 columns.
2. **Дебаффы** (Skull icon, red) — same layout as buffs but red color scheme.
3. **Ручной** (SlidersHorizontal icon, blue) — NumberStepper rows for manual adjustment: range_bonus, power_bonus, melee_bonus, armor_bonus, distance_penalty. Non-zero values highlighted with blue border/bg.

**Active modifier chips**: Shown above tab content. Removable by clicking. Color-coded (emerald for buffs, red for debuffs).

**Tab badges**: Count of active items per tab (buff count, debuff count, indicator for non-zero manual values).

**Phase filtering** (`phase` prop: 'shot' | 'melee' | 'grenade'):
- shot/grenade: all numeric fields, all modifiers matching shot/grenade/always phases
- melee: melee_bonus only, melee-phase modifiers only

## RulesSelector Widget

Two-tab toggle: "Технолог" (official) / "Стар Систем" (community fan rules). Persists to localStorage as `bronepehota_calculator_rules`. Default: "tehnolog". Shown inline in the header.

Rules version affects:
- Fortification mechanics (armor bonus vs distance penalty)
- Vehicle damage (virtual fire vs zone-based)
- Special effects support
- Grenade distance calculation

## Landing Page Integration

Calculator accessible from landing page via `CTAButton` component:

**Normal state (no active battle)**: Flex row with two buttons:
- "ПЕРЕЙТИ В ШТАБ" — primary CTA (military-rust border)
- "КАЛЬКУЛЯТОР БОЯ" — secondary link (military-steel border, muted styling)

**Active battle state**: Compact battle card with three action buttons:
- "Начать заново" (RotateCcw icon)
- "Продолжить бой" / "В бой" (Sword icon, amber)
- "Калькулятор" / "Кальк" (Calculator icon)

**FinalCTA section**: Links to `/app` only (calculator link not duplicated here).

## File Structure

### Modified Files

1. **`src/hooks/useCombatFlow.ts`** — Accept `CombatantData` via 5th param of `startCombat`. In standalone mode, reads stats from `CombatantData` via `combatantToUnitLike()` adapter. In game mode, `BottomSheetCombatModal` creates `CombatantData` from `ArmyUnit`.

2. **`src/hooks/useStandaloneCombatFlow.ts`** — Adapter hook managing CombatantData state, connecting to useCombatFlow. Provides: `switchAction()`, `newCalculation()`, `updateCombatantField()`, `selectAction()`. Auto-starts with ACTION_SELECT phase.

3. **`src/components/combat/ParameterInputs.tsx`** — Extended `onDataNeeded` to accept `'range' | 'power' | 'melee' | 'rank'`. In calculator mode (`combatantData && onDataNeeded`), all stat values are clickable (re-editable) with hover states. Melee shows "Нажмите для ввода" when zero. Grenade shows rank with input prompt.

4. **`src/components/combat/ActionSelector.tsx`** — Reads capabilities from `CombatantData` (e.g., `grenadesAvailable`) instead of deriving from `ArmyUnit` internals.

5. **`src/components/landing/CTAButton.tsx`** — Added calculator links in both normal and active battle states.

### New Files

1. **`src/app/calculator/page.tsx`** — Next.js page, imports client component

2. **`src/components/calculator/CalculatorPage.tsx`** — Client component, orchestrates:
   - Action type tab state (always visible)
   - CombatantData state (from user input via DiceInputPopup)
   - Modifiers slide-out panel state
   - Renders: header (dynamic per action) + tabs + combat flow components + execute button panel + modifiers side panel
   - `DicePopupField` type: `'range' | 'power' | 'melee' | 'rank' | null`

3. **`src/components/calculator/DiceInputPopup.tsx`** — Military briefing dice/number input popup
   - Dual mode: `dice` (D6/D12/D20 + count + bonus) and `number` (stepper + grid)
   - 4 color themes: blue, orange, cyan, emerald
   - Persistent history via `dice-history.ts`
   - Aesthetic: scanline overlay, LED indicator, geometric corners, glow preview

4. **`src/components/calculator/RulesSelector.tsx`** — Rules version toggle widget

5. **`src/components/calculator/ModifiersSelector.tsx`** — Tabbed modifiers interface
   - 3 tabs: Баффы (grid), Дебаффы (grid), Ручной (NumberSteppers)
   - Phase-based filtering via `phase` prop
   - Active modifier chips with removal
   - Badge counts on tabs

6. **`src/lib/dice-history.ts`** — Pure functions for dice input history persistence
   - `loadHistory(raw)`, `saveEntry(raw, entry)`, `getRecentForField(history, field)`, `fieldFromTitle(title)`
   - Max 50 entries total, max 6 unique recent values per field
   - `HISTORY_KEY = 'bronepehota_dice_history'`

7. **`src/__tests__/dice-history.test.ts`** — Unit tests for dice history (12 tests)

8. **`e2e/calculator.spec.ts`** — E2E tests for calculator page (7 tests)

### Unchanged Files

- `src/lib/game-logic.ts` — pure functions, already unit-agnostic
- `src/lib/combat-types.ts` — result types
- `src/lib/combatant-data.ts` — CombatantData interface and adapter
- `src/components/combat/AnimatedDice.tsx` — visual dice component
- `src/components/combat/CombatResults.tsx` — result display
- `src/lib/modifier-utils.ts` — modifier logic
- `src/lib/rules-registry.ts` — rules registry
- `src/data/modifiers/standard-modifiers.json` — modifier catalog data

## Data Flow

```
CalculatorPage
  ├── RulesSelector → rulesVersion (state + localStorage)
  ├── ModifiersSelector (slide-out panel)
  │     ├── Tab: Баффы → catalog buffs (filtered by phase)
  │     ├── Tab: Дебаффы → catalog debuffs (filtered by phase)
  │     └── Tab: Ручной → numeric steppers → ModifierSummary
  ├── useStandaloneCombatFlow(CombatantData, rulesVersion, ModifierSummary)
  │     └── useCombatFlow(combatantToUnitLike(combatantData), ...)
  │           ├── ACTION_SELECT → ActionSelector
  │           ├── PARAMETERS → ParameterInputs
  │           │     └── onDataNeeded('range'|'power'|'melee'|'rank') → DiceInputPopup
  │           ├── EXECUTE → execute button (ВЫСТРЕЛИТЬ/АТАКОВАТЬ/БРОСИТЬ)
  │           └── RESULTS → CombatResults
  └── APPLY → "Новый расчёт" → ACTION_SELECT
```

## Verification

1. **Type check**: `npm run type-check` passes
2. **Unit tests**: `npm run test` — 1036+ tests pass including dice-history unit tests
3. **E2E tests**: `npm run test:e2e` — 85+ tests pass including 7 calculator-specific tests:
   - Page loads with action selector
   - Shot parameters phase with execute button
   - Tab switching between action types
   - Modifiers panel open/close with tab switching
   - Rules selector visibility
   - Melee input placeholder
   - Grenade stats display
4. **Mobile testing**: All touch targets ≥ 44px, DiceInputPopup opens as bottom-sheet on mobile
5. **Desktop testing**: Tab labels visible, wider content area
6. **Game session regression**: Existing combat flow in game session still works after refactoring
7. **Build**: `npm run build` succeeds (static export)
8. **Landing page**: Calculator link visible in both normal and active battle states
