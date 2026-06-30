# Height Bonus + Modifier-Bar Layout (#164) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toggleable +1-to-hit "height bonus" for shooting from elevation (player convenience; not in v0.3 rules), gated by a config toggle (like panic) and activated per-shot via a chip in the combat modal — and reorganize the per-shot modifier chips into a labeled-pill bar above a full-width execute button (no section header) so adding the 3rd modifier doesn't overcrowd the action row.

**Architecture:** Two coupled parts. **(A) Mechanic:** new `isHeightBonus` per-combat parameter → `executeShot` adds +1 to the range roll via `addBonusToRoll(range, 1)`; a global `HeightBonusToggle` in the rules-config screen persists `bronepehota_height_bonus_enabled` to localStorage (gate, like panic); the combat modal reads the gate via `getHeightBonusEnabled()` and only then renders the per-shot "с высоты" chip. **(B) Layout:** refactor the existing `[surprise][aimed] [EXECUTE]` inline row into a `flex-wrap` pill bar (icon + short label) above a full-width execute button, preserving every existing `aria-label` so E2E regression stays green.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind, Jest + React Testing Library (unit), Playwright (E2E).

## Global Constraints

- **Mobile-first**; UI copy Russian; code/identifiers English. Reuse `cn()` (clsx + tailwind-merge) and Lucide icons; no new fonts/palette. Modifier accents are FIXED and must not change: surprise=purple, aimed=cyan, height=emerald.
- **Scope = shot only** (`actionType === 'shot'`), both squad and machine shooters. Not grenade, not melee (grenade-from-height is a separate v0.3 rule, стр. 41). Melee keeps only its surprise chip.
- **Gate model (like panic):** the global toggle is an *availability gate*, persisted to localStorage and read via a `getHeightBonusEnabled()` helper (mirror `getAimedShotEnabled()` / `panic-logic.ts:15`). The combat chip renders ONLY when the gate is on. There is **no auto-seeding** of `isHeightBonus` — the player toggles it per-shot.
- **+1 to the range ROLL** (`addBonusToRoll(range, 1)`, e.g. `D6` → `D6+1`), NOT −1 to distance. Applied in `executeShot` AFTER the aimed-shot `multiplyRange` step, so it stacks correctly (`D6` → `D12` → `D12+1`). `addBonusToRoll` is already imported in `useCombatFlow.ts:14`.
- **PRESERVE existing chip aria-labels EXACTLY** or E2E breaks: aimed `'Прицельный выстрел включён'`/`'Прицельный выстрел выключён'`, surprise `'Внезапная атака включена'`/`'Внезапная атака выключена'`. New height chip aria-label: `'Бонус за высоту включён'`/`'Бонус за высоту выключён'`.
- **Do NOT** change the global aimed/surprise toggles' (disconnected) behavior, the standalone calculator (`useStandaloneCombatFlow`), grenade, or melee math. TDD. `npm run validate` (type-check + lint + unit) + `npm run test:e2e` separately.
- **Commit after every task.** Branch `feat/164-height-bonus` already exists and is current — stay on it.

**Spec:** `docs/superpowers/specs/2026-06-30-height-bonus-design.md`

---

### Task 1: Core mechanic — `isHeightBonus` parameter + executeShot +1 (TDD)

**Files:**
- Modify: `src/lib/combat-types.ts` (add `isHeightBonus?: boolean` to `CombatParameters`)
- Modify: `src/hooks/useCombatFlow.ts` (default `isHeightBonus: false` in `initialCombatFlowState`; +1 step in `executeShot`)
- Test: `src/__tests__/hooks/useCombatFlow.test.ts` (new shot height-bonus tests)

**Interfaces:**
- Produces: `CombatParameters.isHeightBonus?: boolean`; `initialCombatFlowState.parameters.isHeightBonus = false`; in `executeShot`, after the aimed-shot step (~`:265`), `if (state.parameters.isHeightBonus) range = addBonusToRoll(range, 1)`. The returned `CombatResult.hitResult.bonus` then reflects the +1 (range `D6` → `D6+1` → parsed bonus `1`).

- [ ] **Step 1: Add the type field + default (so the test compiles)**

In `src/lib/combat-types.ts`, find the `CombatParameters` interface and its `isAimedShot` line:

```ts
  isSurpriseAttack: boolean;
  isAimedShot: boolean;
```

Add a new optional field right after `isAimedShot`:

```ts
  isSurpriseAttack: boolean;
  isAimedShot: boolean;
  /** Height advantage: +1 to the hit roll for this shot (player convenience, not in v0.3 rules). */
  isHeightBonus?: boolean;
```

In `src/hooks/useCombatFlow.ts`, find `initialCombatFlowState.parameters` (~`:28-35`):

```ts
  parameters: {
    distance: 5,
    targetArmor: 2,
    targetMelee: 2,
    fortification: 'none',
    isSurpriseAttack: false,
    isAimedShot: false,
  },
```

Add the default:

```ts
  parameters: {
    distance: 5,
    targetArmor: 2,
    targetMelee: 2,
    fortification: 'none',
    isSurpriseAttack: false,
    isAimedShot: false,
    isHeightBonus: false,
  },
```

- [ ] **Step 2: Write the failing tests**

In `src/__tests__/hooks/useCombatFlow.test.ts`, inside the `describe('useCombatFlow — combat outcomes', ...)` block (after the existing `'melee surprise-attack: defender uses armor'` test, ~line 160), add:

```ts
  it('shot: height bonus adds +1 to the hit roll (range bonus)', async () => {
    const { result } = renderHook(() => useCombatFlow());
    await act(async () => { result.current.startCombat(makeSquadUnit(), 0, undefined, 'shot'); });
    await act(async () => {
      result.current.setParameters({ distance: 3, targetArmor: 2, isHeightBonus: true });
    });
    await act(async () => { await result.current.executeAction(); });
    const hr = result.current.state.result?.hitResult;
    expect(hr).toBeDefined();
    // soldier.range = 'D6' (bonus 0) → height adds +1 → 'D6+1' → parsed bonus = 1
    expect(hr!.bonus).toBe(1);
  });

  it('shot: without height bonus the range has no added bonus', async () => {
    const res = await runAction('shot', { distance: 3, targetArmor: 2 });
    // soldier.range = 'D6' (bonus 0), no height
    expect(res.hitResult!.bonus).toBe(0);
  });
```

- [ ] **Step 3: Run the tests to verify the height test fails**

Run: `npx jest src/__tests__/hooks/useCombatFlow.test.ts -t "height bonus"`
Expected: the first test FAILS — `hr.bonus` is `0` (the +1 step isn't implemented yet), expected `1`. The second ("without height bonus") PASSES.

- [ ] **Step 4: Implement the +1 step in executeShot**

In `src/hooks/useCombatFlow.ts`, inside `executeShot`, find the aimed-shot block (~`:262-265`):

```ts
    // 3. Aimed shot (applied on top of all modifiers)
    if (state.parameters.isAimedShot && state.unitType === 'squad') {
      range = multiplyRange(range, 2);
    }
```

Add the height step immediately after it:

```ts
    // 3. Aimed shot (applied on top of all modifiers)
    if (state.parameters.isAimedShot && state.unitType === 'squad') {
      range = multiplyRange(range, 2);
    }

    // 3.5 Height bonus: +1 to the hit roll (player convenience, not in v0.3 rules)
    if (state.parameters.isHeightBonus) {
      range = addBonusToRoll(range, 1);
    }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/__tests__/hooks/useCombatFlow.test.ts`
Expected: both new height tests PASS; all existing shot/melee/grenade tests still green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/combat-types.ts src/hooks/useCombatFlow.ts src/__tests__/hooks/useCombatFlow.test.ts
git commit -m "feat(combat): height bonus +1 to hit roll (#164)"
```

---

### Task 2: `HeightBonusToggle` component + `getHeightBonusEnabled()` helper

**Files:**
- Modify: `src/lib/constants.ts` (add `HEIGHT_BONUS_ENABLED` to `LOCAL_STORAGE_KEYS`)
- Create: `src/components/toggles/HeightBonusToggle.tsx`
- Test: `src/__tests__/components/toggles/HeightBonusToggle.test.tsx` (helper behavior)

**Interfaces:**
- Produces: `LOCAL_STORAGE_KEYS.HEIGHT_BONUS_ENABLED = 'bronepehota_height_bonus_enabled'`; `HeightBonusToggle` (props `enabled: boolean`, `onEnabledChange: (v: boolean) => void`) modeled on `AimedShotToggle`; `getHeightBonusEnabled(): boolean` reads localStorage (guards `typeof window`, defaults `false`). The toggle's outer wrapper has `data-testid="height-bonus-toggle"`; inner button has `aria-pressed`.

- [ ] **Step 1: Add the localStorage key**

In `src/lib/constants.ts`, find the `LOCAL_STORAGE_KEYS` object and the `SURPRISE_ATTACK_ENABLED` line:

```ts
  SURPRISE_ATTACK_ENABLED: 'bronepehota_surprise_attack_enabled',
```

Add right after it:

```ts
  SURPRISE_ATTACK_ENABLED: 'bronepehota_surprise_attack_enabled',
  HEIGHT_BONUS_ENABLED: 'bronepehota_height_bonus_enabled',
```

- [ ] **Step 2: Create the toggle component**

Create `src/components/toggles/HeightBonusToggle.tsx`. Model it exactly on `src/components/toggles/AimedShotToggle.tsx` (same structure: `useState` for an info modal, mount-effect loads from localStorage, `handleToggle` writes to localStorage and calls `onEnabledChange`, a styled card with icon + label + info button + switch, and an info modal explaining the rule). Key differences from `AimedShotToggle`:

- Icon: `Mountain` from `lucide-react` (instead of `Crosshair`).
- Color: emerald (`emerald-950/30`, `emerald-600/60`, `emerald-400`, etc.) everywhere `AimedShotToggle` uses cyan.
- Label/title: `С ВЫСОТЫ` (uppercase mono) and subtitle `+1 к попаданию`.
- Storage key constant: `const HEIGHT_BONUS_STORAGE_KEY = 'bronepehota_height_bonus_enabled';`
- Outer wrapper `data-testid="height-bonus-toggle"`.
- Info modal text — "Правило" block:
  ```
  Стрельба с возвышенности даёт +1 к броску на попадание.
  ```
  and "Применение" list:
  - Только для выстрелов (не гранаты / не ближний бой)
  - Пехота и техника
  - Включается на конкретный выстрел
  - Нет в правилах v0.3 — удобство по решению игрока
- Export the helper at the bottom:

```ts
// Helper function to get height-bonus gate state from localStorage
export function getHeightBonusEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(HEIGHT_BONUS_STORAGE_KEY);
  return saved === 'true';
}
```

(Read `src/components/toggles/AimedShotToggle.tsx` first and mirror its full JSX; only swap icon/color/labels/key as above. Do not invent a different structure.)

- [ ] **Step 3: Write the helper unit test**

Create `src/__tests__/components/toggles/HeightBonusToggle.test.tsx`:

```tsx
import { getHeightBonusEnabled } from '@/components/toggles/HeightBonusToggle';

describe('getHeightBonusEnabled', () => {
  const KEY = 'bronepehota_height_bonus_enabled';

  afterEach(() => {
    localStorage.removeItem(KEY);
  });

  it('returns false when unset', () => {
    localStorage.removeItem(KEY);
    expect(getHeightBonusEnabled()).toBe(false);
  });

  it('returns true when set to "true"', () => {
    localStorage.setItem(KEY, 'true');
    expect(getHeightBonusEnabled()).toBe(true);
  });

  it('returns false when set to "false"', () => {
    localStorage.setItem(KEY, 'false');
    expect(getHeightBonusEnabled()).toBe(false);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `npx jest src/__tests__/components/toggles/HeightBonusToggle.test.tsx`
Expected: PASS (3/3).

- [ ] **Step 5: Type-check + lint**

Run: `npm run type-check`
Expected: clean (no unused imports; component mirrors AimedShotToggle so structure is valid).

- [ ] **Step 6: Commit**

```bash
git add src/lib/constants.ts src/components/toggles/HeightBonusToggle.tsx src/__tests__/components/toggles/HeightBonusToggle.test.tsx
git commit -m "feat(toggles): HeightBonusToggle + getHeightBonusEnabled gate (#164)"
```

---

### Task 3: Wire the gate toggle into rules config (ArmyBuilder + RulesSelector)

**Files:**
- Modify: `src/components/ArmyBuilder.tsx` (add `heightBonusEnabled` state + pass to `RulesSelector`)
- Modify: `src/components/rules/RulesSelector.tsx` (accept prop + mount `<HeightBonusToggle>`)

**Interfaces:**
- Produces: `ArmyBuilder` holds `heightBonusEnabled` (init from localStorage key `bronepehota_height_bonus_enabled`, default `false`) and passes `heightBonusEnabled` + `onHeightBonusEnabledChange` to `RulesSelector`; `RulesSelector` renders `<HeightBonusToggle>` in the same place as the other setup toggles.

No new unit test (wiring; verified by type-check now and the E2E in Task 6).

- [ ] **Step 1: Add state in ArmyBuilder**

In `src/components/ArmyBuilder.tsx`, find the surprise-attack state block (~`:75-82`):

```tsx
  // Surprise attack enabled state - persisted in localStorage
  const [surpriseAttackEnabled, setSurpriseAttackEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bronepehota_surprise_attack_enabled');
      return saved !== null ? saved === 'true' : false; // Default to disabled
    }
    return false;
  });
```

Add a parallel block right after it:

```tsx
  // Height bonus enabled state (gate) - persisted in localStorage
  const [heightBonusEnabled, setHeightBonusEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bronepehota_height_bonus_enabled');
      return saved !== null ? saved === 'true' : false; // Default to disabled
    }
    return false;
  });
```

- [ ] **Step 2: Pass the prop to RulesSelector**

In `src/components/ArmyBuilder.tsx`, find the `RulesSelector` usage (~`:251-257`) that passes `surpriseAttackEnabled`/`onSurpriseAttackEnabledChange`, and add the height props right after them (the convention is `XxxEnabled` + `onXxxEnabledChange`):

```tsx
                surpriseAttackEnabled={surpriseAttackEnabled}
                onSurpriseAttackEnabledChange={setSurpriseAttackEnabled}
                heightBonusEnabled={heightBonusEnabled}
                onHeightBonusEnabledChange={setHeightBonusEnabled}
```

- [ ] **Step 3: Accept the prop + mount the toggle in RulesSelector**

In `src/components/rules/RulesSelector.tsx`:
- Add to the props interface, right after `onSurpriseAttackEnabledChange?: (enabled: boolean) => void;` (~`:27`):
  ```tsx
  heightBonusEnabled?: boolean;
  onHeightBonusEnabledChange?: (enabled: boolean) => void;
  ```
- Add defaults in the destructure, right after `onSurpriseAttackEnabledChange,` (~`:48`):
  ```tsx
  heightBonusEnabled = false,
  onHeightBonusEnabledChange,
  ```
- Import at the top with the other toggle imports: `import { HeightBonusToggle } from '@/components/toggles/HeightBonusToggle';`
- In the toggle grid (~`:222-235`), right after the `<SurpriseAttackToggle>` block, mount the new toggle with the SAME conditional pattern the neighbors use:

```tsx
            {onHeightBonusEnabledChange && (
              <HeightBonusToggle
                enabled={heightBonusEnabled}
                onEnabledChange={onHeightBonusEnabledChange}
              />
            )}
```

- [ ] **Step 4: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/ArmyBuilder.tsx src/components/rules/RulesSelector.tsx
git commit -m "feat(config): mount HeightBonusToggle gate in rules setup (#164)"
```

---

### Task 4: Layout refactor — modifier pill bar (no header) + full-width execute

**Files:**
- Modify: `src/components/combat/BottomSheetCombatModal.tsx` (refactor the action row `:291-378`)

**Interfaces:** None new. The `[surprise-chip][aimed-chip] [EXECUTE]` inline row becomes: a `flex flex-wrap gap-1.5` bar of labeled pill-buttons (surprise + aimed), then a full-width (`w-full`) execute button on its own row. Every chip's `aria-label`, `onClick`, and gating condition is PRESERVED exactly — only the container + styling + added label text change. The active-modifiers subtitle under "ВЫСТРЕЛИТЬ" becomes always-visible (drops `hidden md:inline`) and uses an array-join.

This is a UI/interaction-pattern change — verified by E2E regression (existing `aimed-shot.spec.ts` must stay green) per CLAUDE.md. No new unit test.

- [ ] **Step 1: Replace the action row with bar + full-width execute**

In `src/components/combat/BottomSheetCombatModal.tsx`, find the block starting at the comment `{/* Execute button with surprise attack toggle */}` (~`:291`) through the end of that `<div className="flex gap-2 md:gap-3">…</div>` row (~`:379`). Replace the OUTER container from a single inline `flex gap-2 md:gap-3` row into TWO stacked blocks: (1) a modifier bar, (2) the execute button.

The surprise and aimed chips become labeled pills. Keep their `onClick`, `aria-label`, and the `(state.actionType === 'shot' || state.actionType === 'melee')` / `(state.actionType === 'shot' && state.unitType === 'squad')` gating conditions exactly. New markup:

```tsx
              {/* Modifier bar — labeled pills (no section header) */}
              <div className="flex flex-wrap gap-1.5">
                {/* Surprise attack — shot and melee */}
                {(state.actionType === 'shot' || state.actionType === 'melee') && (
                  <button
                    type="button"
                    onClick={() => onSetParameters({ isSurpriseAttack: !state.parameters.isSurpriseAttack })}
                    aria-label={state.parameters.isSurpriseAttack ? 'Внезапная атака включена' : 'Внезапная атака выключена'}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono min-h-[36px]',
                      'touch-manipulation active:scale-95 transition-all duration-200',
                      state.parameters.isSurpriseAttack
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    <EyeOff className={cn('w-3.5 h-3.5', state.parameters.isSurpriseAttack ? 'text-purple-400' : 'text-slate-400')} size={14} />
                    <span>с тыла</span>
                    {state.parameters.isSurpriseAttack && (
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                    )}
                  </button>
                )}

                {/* Aimed shot — shot, squads only */}
                {state.actionType === 'shot' && state.unitType === 'squad' && (
                  <button
                    type="button"
                    onClick={() => onSetParameters({ isAimedShot: !state.parameters.isAimedShot })}
                    aria-label={state.parameters.isAimedShot ? 'Прицельный выстрел включён' : 'Прицельный выстрел выключён'}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono min-h-[36px]',
                      'touch-manipulation active:scale-95 transition-all duration-200',
                      state.parameters.isAimedShot
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    <Crosshair className={cn('w-3.5 h-3.5', state.parameters.isAimedShot ? 'text-cyan-400' : 'text-slate-400')} size={14} />
                    <span>прицельный</span>
                    {state.parameters.isAimedShot && (
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    )}
                  </button>
                )}
              </div>

              {/* Execute button — full width, own row */}
              <button
                onClick={onExecuteAction}
                className={cn(
                  "relative w-full font-mono text-xs md:text-sm font-bold uppercase tracking-wider border-2 transition-all min-h-[44px] md:min-h-[48px] mt-2",
                  "hover:scale-[1.01] active:scale-95 overflow-hidden shimmer-effect",
                  "shadow-lg",
                  actionColors.button
                )}
                style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
              >
                <div className={cn("absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 opacity-40", actionColors.accent)} />
                <div className="absolute inset-0 shadow-inner pointer-events-none" />
                <div className="relative flex items-center justify-center gap-2 px-2 md:px-6 py-2 md:py-3">
                  <span>
                    {state.actionType === 'shot' ? 'ВЫСТРЕЛИТЬ' :
                     state.actionType === 'melee' ? 'АТАКОВАТЬ' : 'БРОСИТЬ'}
                  </span>
                  {/* Active modifiers subtitle (always visible) */}
                  {(state.parameters.isSurpriseAttack || state.parameters.isAimedShot) && (
                    <span className="text-[10px] opacity-80">
                      {[
                        state.parameters.isSurpriseAttack && 'с тыла',
                        state.parameters.isAimedShot && 'прицельный',
                      ].filter(Boolean).join(' + ')}
                    </span>
                  )}
                </div>
              </button>
```

Notes: (1) `EyeOff` and `Crosshair` are already imported in this file (used by the current chips) — confirm via the import list; if not, add them. (2) The execute button's label/`actionColors`/corner decorations are unchanged from the original; only `flex-1` → `w-full`, the wrapping `<div>` is removed (button is now a direct sibling of the bar), and the subtitle drops `hidden md:inline` and switches to array-join. (3) Keep the exact same `onClick={onExecuteAction}`.

- [ ] **Step 2: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: clean.

- [ ] **Step 3: Run E2E regression (chips must still work after relocation)**

Run: `npx playwright test e2e/aimed-shot.spec.ts e2e/battle-buffs.spec.ts e2e/combat.spec.ts --project=chromium`
Expected: all PASS — the aimed/surprise chips still render with their exact `aria-label`s and still toggle (the refactor only changed container/styling/labels, not behavior).

- [ ] **Step 4: Commit**

```bash
git add src/components/combat/BottomSheetCombatModal.tsx
git commit -m "refactor(combat-ui): modifier pill bar + full-width execute button (#164)"
```

---

### Task 5: Height chip (gated) in the bar + hit-prob preview +1

**Files:**
- Modify: `src/components/combat/BottomSheetCombatModal.tsx` (add gated height pill + extend subtitle)
- Modify: `src/components/combat/ParameterInputs.tsx` (apply +1 to hit-prob preview range)

**Interfaces:**
- Consumes: `getHeightBonusEnabled()` from `HeightBonusToggle` (Task 2); `state.parameters.isHeightBonus` (Task 1).
- Produces: a height pill rendered in the modifier bar ONLY when `getHeightBonusEnabled()` is true AND `actionType === 'shot'`; toggles `isHeightBonus`; the execute subtitle includes `с высоты`; `ParameterInputs` applies `addBonusToRoll(effectiveRange, 1)` to the preview range when `isHeightBonus`.

- [ ] **Step 1: Add the gated height pill to the modifier bar**

In `src/components/combat/BottomSheetCombatModal.tsx`:
- Import the helper: `import { getHeightBonusEnabled } from '@/components/toggles/HeightBonusToggle';` and the icon `import { Mountain } from 'lucide-react';` (add to the existing lucide import).
- Read the gate once near the top of the component (config value is stable during a session):
  ```tsx
  const heightBonusAvailable = getHeightBonusEnabled();
  ```
- In the modifier bar (from Task 4), after the aimed pill, add the height pill:

```tsx
                {/* Height bonus — shot only, gated by the config toggle */}
                {heightBonusAvailable && state.actionType === 'shot' && (
                  <button
                    type="button"
                    onClick={() => onSetParameters({ isHeightBonus: !state.parameters.isHeightBonus })}
                    aria-label={state.parameters.isHeightBonus ? 'Бонус за высоту включён' : 'Бонус за высоту выключён'}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono min-h-[36px]',
                      'touch-manipulation active:scale-95 transition-all duration-200',
                      state.parameters.isHeightBonus
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    <Mountain className={cn('w-3.5 h-3.5', state.parameters.isHeightBonus ? 'text-emerald-400' : 'text-slate-400')} size={14} />
                    <span>с высоты</span>
                    {state.parameters.isHeightBonus && (
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    )}
                  </button>
                )}
```

- Extend the execute subtitle's condition + array to include height:

```tsx
                  {(state.parameters.isSurpriseAttack || state.parameters.isAimedShot || state.parameters.isHeightBonus) && (
                    <span className="text-[10px] opacity-80">
                      {[
                        state.parameters.isSurpriseAttack && 'с тыла',
                        state.parameters.isAimedShot && 'прицельный',
                        state.parameters.isHeightBonus && 'с высоты',
                      ].filter(Boolean).join(' + ')}
                    </span>
                  )}
```

- [ ] **Step 2: Apply +1 to the hit-prob preview in ParameterInputs**

In `src/components/combat/ParameterInputs.tsx`:
- Add `addBonusToRoll` to the game-logic import (~`:10`): change `import { getUnitStats, multiplyRange } from '@/lib/game-logic';` → `import { getUnitStats, multiplyRange, addBonusToRoll } from '@/lib/game-logic';`
- Find the effective-range line (~`:155`):

```tsx
      const effectiveRange = isAimedShot && actionType === 'shot' ? multiplyRange(unitStats.range, 2) : unitStats.range;
```

Replace with a `let` + height adjustment:

```tsx
      let effectiveRange = isAimedShot && actionType === 'shot' ? multiplyRange(unitStats.range, 2) : unitStats.range;
      if (parameters.isHeightBonus && actionType === 'shot') {
        effectiveRange = addBonusToRoll(effectiveRange, 1);
      }
```

(`parameters` is already a prop of `ParameterInputs`; `isHeightBonus` is optional on `CombatParameters`, so the access is type-safe.)

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: clean (no unused imports).

- [ ] **Step 4: Run the relevant unit tests**

Run: `npx jest src/__tests__/hooks/useCombatFlow.test.ts src/__tests__/components/toggles/HeightBonusToggle.test.tsx`
Expected: PASS (Task 1 + Task 2 tests still green).

- [ ] **Step 5: Commit**

```bash
git add src/components/combat/BottomSheetCombatModal.tsx src/components/combat/ParameterInputs.tsx
git commit -m "feat(combat-ui): gated height-bonus chip + hit-prob preview +1 (#164)"
```

---

### Task 6: E2E spec + full validation

**Files:**
- Create: `e2e/height-bonus.spec.ts`

**Interfaces:**
- Consumes: the setup helpers (`setupGameSessionWithSquad`, `clearStorage`) from `e2e/helpers/setup`; the rules-config toggle testid `height-bonus-toggle`; the height chip `aria-label*="Бонус за высоту"`; the `ВЫСТРЕЛИТЬ` button.
- Produces: integration proof of the gate (off → no chip; on → chip), per-shot toggle, and persistence.

Note: D6 is random, so the E2E asserts the UI flow/gate/persistence, not a specific +1 outcome (that's covered by the unit test in Task 1).

- [ ] **Step 1: Write the spec**

Create `e2e/height-bonus.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * #164 — height bonus: a config toggle gates whether the per-shot "с высоты" chip
 * appears in the shot modal. The gate value persists across reloads.
 *
 * Open sequence mirrors e2e/combat.spec.ts (which uses the same helper):
 * click the unit-nav card → "Выберите действие" → "выстрел".
 */
test.describe('Height bonus (#164)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  async function openShotModal(page: Page) {
    const unitCard = page.getByTestId('unit-nav-height-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(400);
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(400);
    const shotButton = page.getByRole('button', { name: /выстрел/i }).first();
    await expect(shotButton).toBeVisible({ timeout: 3000 });
    await shotButton.click();
    await page.waitForTimeout(300);
  }

  test('gate off → height chip absent in shot modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'height-unit-1' } });
    await openShotModal(page);
    // Gate default OFF → height chip must NOT be present
    await expect(page.locator('button[aria-label*="Бонус за высоту"]')).toHaveCount(0);
  });

  test('gate on → height chip appears and toggles', async ({ page }) => {
    // Enable the gate before the session loads (the helper's goto runs this init script)
    await page.addInitScript(() => {
      localStorage.setItem('bronepehota_height_bonus_enabled', 'true');
    });
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'height-unit-1' } });
    await openShotModal(page);

    // Gate ON → chip present, starts off
    const heightChip = page.locator('button[aria-label*="Бонус за высоту"]');
    await expect(heightChip).toBeVisible({ timeout: 3000 });
    await expect(heightChip).toHaveAttribute('aria-label', 'Бонус за высоту выключен');

    // Toggle on → aria-label flips
    await heightChip.click();
    await expect(heightChip).toHaveAttribute('aria-label', 'Бонус за высоту включён');

    // Execute button subtitle now lists the active modifier
    const fireButton = page.getByRole('button', { name: /выстрелить/i });
    await expect(fireButton).toBeVisible({ timeout: 3000 });
    await expect(fireButton).toContainText('с высоты');

    // Execute → combat resolves
    await fireButton.click();
    await page.waitForTimeout(500);
  });

  test('gate persists across reload', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bronepehota_height_bonus_enabled', 'true');
    });
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'height-unit-1' } });
    // Reload re-runs the registered init scripts (army + gate) → gate stays on
    await page.reload();
    await openShotModal(page);
    await expect(page.locator('button[aria-label*="Бонус за высоту"]')).toBeVisible({ timeout: 3000 });
  });
});
```

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test e2e/height-bonus.spec.ts --project=chromium`
Expected: PASS (3 tests). Before Task 5, the height chip would not exist → the "gate on" test would fail.

- [ ] **Step 3: Full validation**

Run: `npm run validate`
Expected: type-check clean; lint no NEW warnings in touched files; unit tests all green (incl. Task 1 height tests + Task 2 helper tests).

Run: `npm run test:e2e`
Expected: all specs PASS, incl. new `height-bonus.spec.ts` AND regression (`aimed-shot.spec.ts`, `battle-buffs.spec.ts`, `combat.spec.ts`).

- [ ] **Step 4: Record green verification**

If Steps 2–3 surfaced fixups, commit them. Otherwise this task records green verification (no commit needed).
