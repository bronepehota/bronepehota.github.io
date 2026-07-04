# Machine ББ Melee + Таран Implementation Plan (#125)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement machine close-combat (ББ) for both rule versions and Таран (ramming infantry) for community Star System, with two card buttons feeding the existing combat modal.

**Architecture:** Pure resolution lives in `game-logic.ts` (machine melee strength, Таблица 7 outcome, ram D6 table) + types in `combat-types.ts`. `useCombatFlow` gains a machine branch in `executeMelee` (strength = currentDurability + ΣББ) and a new `executeRam` (reuses the grenade per-target pattern). `ParameterInputs` adds a defender-type selector (and ram count); `CombatResults` renders machine-melee outcomes and the ram results list. `MachineView` replaces the disabled #179 placeholder with two buttons; `UnitCard` wires handlers + passes `rulesVersion`.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind, Jest + RTL (unit), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-07-04-machine-melee-ram-design.md`

## Global Constraints

- **Rules (verbatim from spec):**
  - Machine melee **attack strength** = `D6 + currentDurability + ΣББ` (ΣББ = sum of `weapon.power` for `weapon.range === 'ББ'`; reuse `MachineView.meleeBonus` formula).
  - Defender strength (Таблица 6): infantry `D6+Бр`; machine `D6+броня+ΣББ`; artillery/no-pilot `броня` (no D6).
  - Outcome (Таблица 7): attacker ≤ defender → «отбита»; attacker > → infantry «уничтожен» / machine-artillery `damage = attacker − defender`.
  - Surprise (rear): attacker D6×2 best; defender **machine** loses ΣББ from defense.
  - **Таран (community only):** per rammed infantry roll D6 → `1–4 killed`, `5–6 survived`.
- **Single-army / manual target:** defender stats are player-entered (no tracked enemy unit).
- **`Таран` gated** by `rulesVersion === 'community_star_system'` (like panic/zone-damage).
- **Preserve existing flows:** soldier melee, shot, grenade unchanged; `executeMelee` machine branch must not break soldier branch (`isMachine` guard).
- **E2E-critical selectors preserved:** `Выстрел:` aria-label, `pilot-survival-test-button`, `assign-pilot-button`, damage button `/урон/` + `svg.lucide-flame`.
- Russian UI text; English code. Touch targets ≥44px. Trust `npm run type-check` over stale LSP.
- **Branch:** `feat/125-machine-melee` (off `main`, post-#179 merge). Commit per task. `Co-Authored-By: Claude <noreply@anthropic.com>`.

---

## File Structure

**Modify:**
- `src/lib/combat-types.ts` — add `'ram'` action; `targetType`, `defenderMeleeBonus`, `ramInfantryCount` params; `RamInfantryResult`; result fields.
- `src/lib/game-logic.ts` — `machineMeleeAttackerStrength`, `resolveMachineMeleeOutcome`, `ramInfantryKilled`, `calculateRam`.
- `src/hooks/useCombatFlow.ts` — machine branch in `executeMelee`; `executeRam`; `'ram'` in `executeAction`.
- `src/components/combat/ParameterInputs.tsx` — defender-type selector + conditional fields (machine melee); ram-infantry count stepper.
- `src/components/combat/CombatResults.tsx` — machine-melee outcome panel; ram results list (reuses grenade-blast pattern).
- `src/components/cards/unit-card/MachineView.tsx` — two buttons replace the disabled «Таран» placeholder.
- `src/components/cards/UnitCard.tsx` — `handleVehicleMelee`/`handleVehicleRam`; pass `rulesVersion` to `MachineView`; apply-result for `ram`/machine-melee.

**Create:**
- `src/__tests__/lib/machine-melee-ram.test.ts` — pure-logic unit tests.

---

## Task 1: Pure logic — machine melee + ram (TDD)

`game-logic.ts` resolution + `combat-types.ts` types, unit-tested in isolation.

**Files:**
- Modify: `src/lib/combat-types.ts`
- Modify: `src/lib/game-logic.ts`
- Create: `src/__tests__/lib/machine-melee-ram.test.ts`

**Interfaces:**
- Produces: `RamInfantryResult`, `MeleeDefenderType` (combat-types); `machineMeleeAttackerStrength`, `resolveMachineMeleeOutcome`, `ramInfantryKilled`, `calculateRam` (game-logic) — consumed by Task 2.

- [ ] **Step 1: Add types to combat-types.ts**

In `src/lib/combat-types.ts`:
1. Extend the action type (line 20):
```ts
export type CombatActionType = 'shot' | 'melee' | 'grenade' | 'ram';
```
2. Add `MeleeDefenderType` + `RamInfantryResult` near `GrenadeBlastResult` (after line 64):
```ts
/** Defender type for machine melee (Таблица 6 defense formula differs). */
export type MeleeDefenderType = 'infantry' | 'machine' | 'artillery';

/** One rammed-infantry result (Таран: D6 → 1-4 killed, 5-6 survived). */
export interface RamInfantryResult {
  index: number;
  roll: number;
  killed: boolean;
}
```
3. Extend `CombatParameters` (add inside the interface, after `targetMelee`):
```ts
  targetType?: MeleeDefenderType;     // Machine melee: defender type
  defenderMeleeBonus?: number;        // Machine melee: defender machine's ΣББ
  ramInfantryCount?: number;          // Таран: number of infantry rammed
```
4. Extend `CombatResult` (add inside the interface, after `meleeResult?`):
```ts
  meleeOutcome?: { outcome: 'repelled' | 'destroyed' | 'damage'; damage: number };
  ramInfantryResults?: RamInfantryResult[];
```

- [ ] **Step 2: Write failing tests**

`src/__tests__/lib/machine-melee-ram.test.ts`:
```ts
import {
  machineMeleeAttackerStrength,
  resolveMachineMeleeOutcome,
  ramInfantryKilled,
  calculateRam,
} from '@/lib/game-logic';

describe('machine melee strength', () => {
  it('currentDurability + ΣББ', () => {
    expect(machineMeleeAttackerStrength(8, 4)).toBe(12);
    expect(machineMeleeAttackerStrength(0, 0)).toBe(0);
  });
});

describe('resolveMachineMeleeOutcome (Таблица 7)', () => {
  it('attacker > defender → infantry destroyed', () => {
    const r = resolveMachineMeleeOutcome(15, 10, 'infantry');
    expect(r.outcome).toBe('destroyed');
    expect(r.winner).toBe('attacker');
    expect(r.damage).toBe(0);
  });
  it('attacker > defender → machine/artillery take damage = difference', () => {
    expect(resolveMachineMeleeOutcome(15, 10, 'machine')).toEqual({ winner: 'attacker', outcome: 'damage', damage: 5 });
    expect(resolveMachineMeleeOutcome(12, 10, 'artillery')).toEqual({ winner: 'attacker', outcome: 'damage', damage: 2 });
  });
  it('attacker ≤ defender → repelled (draw or defender wins)', () => {
    expect(resolveMachineMeleeOutcome(10, 15, 'infantry').outcome).toBe('repelled');
    expect(resolveMachineMeleeOutcome(10, 10, 'machine').outcome).toBe('repelled');
    expect(resolveMachineMeleeOutcome(10, 10, 'machine').winner).toBe('draw');
    expect(resolveMachineMeleeOutcome(5, 10, 'infantry').winner).toBe('defender');
  });
});

describe('ram table (Таран)', () => {
  it('1-4 killed, 5-6 survived', () => {
    expect(ramInfantryKilled(1)).toBe(true);
    expect(ramInfantryKilled(4)).toBe(true);
    expect(ramInfantryKilled(5)).toBe(false);
    expect(ramInfantryKilled(6)).toBe(false);
  });
  it('calculateRam returns one result per infantry, correct count, valid rolls', () => {
    const r = calculateRam(3);
    expect(r).toHaveLength(3);
    expect(r.map(x => x.index)).toEqual([0, 1, 2]);
    r.forEach(x => {
      expect(x.roll).toBeGreaterThanOrEqual(1);
      expect(x.roll).toBeLessThanOrEqual(6);
      expect(x.killed).toBe(ramInfantryKilled(x.roll));
    });
  });
  it('calculateRam(0) → empty', () => {
    expect(calculateRam(0)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests — verify FAIL**

Run: `npm test -- machine-melee-ram`
Expected: FAIL — the four functions are not exported (module has no such exports).

- [ ] **Step 4: Implement in game-logic.ts**

Append to `src/lib/game-logic.ts` (after `calculateMeleeWithSurpriseAttack`, ~line 288):
```ts
/**
 * Machine melee attacker strength = currentDurability (Броня) + ΣББ (Tehnolog §8 / Star System §8).
 * ΣББ is the sum of ББ-weapon powers (computed by the caller, e.g. MachineView.meleeBonus).
 */
export function machineMeleeAttackerStrength(currentDurability: number, meleeBonus: number): number {
  return currentDurability + meleeBonus;
}

export interface MachineMeleeOutcome {
  winner: 'attacker' | 'defender' | 'draw';
  outcome: 'repelled' | 'destroyed' | 'damage';
  damage: number;
}

/**
 * Resolve machine-melee outcome (Таблица 7). Caller passes already-computed totals.
 * attacker > defender → infantry destroyed / machine-artillery take damage = difference.
 * attacker ≤ defender → repelled.
 */
export function resolveMachineMeleeOutcome(
  attackerTotal: number,
  defenderTotal: number,
  defenderType: 'infantry' | 'machine' | 'artillery'
): MachineMeleeOutcome {
  if (attackerTotal > defenderTotal) {
    if (defenderType === 'infantry') return { winner: 'attacker', outcome: 'destroyed', damage: 0 };
    return { winner: 'attacker', outcome: 'damage', damage: attackerTotal - defenderTotal };
  }
  const winner = defenderTotal > attackerTotal ? 'defender' : 'draw';
  return { winner, outcome: 'repelled', damage: 0 };
}

/** Таран: D6 1-4 → killed, 5-6 → survived (Star System §8, PDF p.47). */
export function ramInfantryKilled(roll: number): boolean {
  return roll >= 1 && roll <= 4;
}

/** Roll D6 for each rammed infantryman. */
export function calculateRam(count: number): { index: number; roll: number; killed: boolean }[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const roll = rollDie(6);
    return { index: i, roll, killed: ramInfantryKilled(roll) };
  });
}
```
(If TS complains `MeleeDefenderType` is duplicated — it's also in combat-types.ts — remove the local `export type MeleeDefenderType` line here and import it from `@/lib/combat-types` instead. Keep a single source. Prefer defining in combat-types.ts and importing in game-logic.ts.)

- [ ] **Step 5: Run tests — verify PASS**

Run: `npm test -- machine-melee-ram`
Expected: PASS (all tests).

- [ ] **Step 6: Validate + commit**

Run: `npm run validate` (type-check + lint + unit). Expected: green.
```bash
git add src/lib/combat-types.ts src/lib/game-logic.ts src/__tests__/lib/machine-melee-ram.test.ts
git commit -m "feat(combat): #125 — machine melee + ram pure logic (Таблица 7, ram D6 table)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: useCombatFlow — machine melee branch + executeRam

Wire Task 1 logic into the combat state machine. Soldier melee unchanged (`isMachine` guard).

**Files:**
- Modify: `src/hooks/useCombatFlow.ts`
- Modify: `src/__tests__/hooks/useCombatFlow.test.ts`

**Interfaces:**
- Consumes: `machineMeleeAttackerStrength`, `resolveMachineMeleeOutcome`, `calculateRam`, `MeleeDefenderType` (Task 1); `isMachine`, `rollDie` (existing).
- Produces: `executeMelee` returns a `CombatResult` with `meleeOutcome` for machines; `executeRam` returns a result with `ramInfantryResults`; both reachable via `executeAction` for `actionType === 'melee'|'ram'`.

- [ ] **Step 1: Extend imports in useCombatFlow.ts**

In `src/hooks/useCombatFlow.ts` (line 14 import block), add:
```ts
import { rollDie, multiplyRange, addBonusToRoll, rollGrenadeDistance, machineMeleeAttackerStrength, resolveMachineMeleeOutcome, calculateRam } from '@/lib/game-logic';
```
And import the type if not already:
```ts
import type { MeleeDefenderType } from '@/lib/combat-types';
```
(add `MeleeDefenderType` to the existing `combat-types` import on line 4-13).

- [ ] **Step 2: Rewrite executeMelee to handle a machine attacker**

Replace the attacker-stat block inside `executeMelee` (lines ~473-485, the `let attackerMelee = 0; …` block) with a machine-aware version. Keep the soldier branch identical. New block:
```ts
    // Get attacker melee stat
    let attackerMelee = 0;
    let isMachineAttacker = false;
    if (state.combatantData) {
      attackerMelee = state.combatantData.melee;
    } else if (isMachine(state.unit)) {
      isMachineAttacker = true;
      const machine = state.unit.data as import('@/lib/types').Machine;
      const durability = state.unit.currentDurability || 0;
      const sumBB = machine.weapons
        .filter(w => w.range === 'ББ')
        .map(w => parseInt(String(w.power), 10) || 0)
        .reduce((s, b) => s + b, 0);
      attackerMelee = machineMeleeAttackerStrength(durability, sumBB);
    } else if (isSquad(state.unit) && state.soldierIndex !== null) {
      attackerMelee = state.unit.data.soldiers[state.soldierIndex].melee;
    }

    // Apply melee bonus from active modifiers
    const mods = state.parameters.activeModifiers;
    if (mods && mods.meleeBonus !== 0) {
      attackerMelee += mods.meleeBonus;
    }
```
Then, after the dice animation + the existing `meleeResult` computation, add a machine-melee OUTCOME branch. Immediately before `const result: CombatResult = {` (line ~518), insert:
```ts
    // Machine melee: resolve outcome vs a typed defender (Таблица 7)
    let meleeOutcome: { outcome: 'repelled' | 'destroyed' | 'damage'; damage: number } | undefined;
    if (isMachineAttacker) {
      const targetType: MeleeDefenderType = state.parameters.targetType || 'infantry';
      const armor = state.parameters.targetArmor;
      if (targetType === 'artillery') {
        // Artillery/no-pilot: defense = armor only (no D6). Attacker still rolled above.
        const defenderTotal = armor;
        const o = resolveMachineMeleeOutcome(meleeResult.attackerTotal, defenderTotal, targetType);
        meleeOutcome = { outcome: o.outcome, damage: o.damage };
      } else {
        // infantry / machine defender: existing meleeResult already rolled D6 for defender.
        // For a machine defender, add its ΣББ unless surprise (rear) attack.
        let defenderTotal = meleeResult.defenderTotal;
        if (targetType === 'machine') {
          const defBB = state.parameters.defenderMeleeBonus || 0;
          defenderTotal = meleeResult.defenderRoll + armor + (state.parameters.isSurpriseAttack ? 0 : defBB);
        }
        const o = resolveMachineMeleeOutcome(meleeResult.attackerTotal, defenderTotal, targetType);
        meleeOutcome = { outcome: o.outcome, damage: o.damage };
        // Patch defenderTotal on the result so CombatResults shows the right number.
        (meleeResult as any).defenderTotal = defenderTotal;
      }
    }
```
Then add `meleeOutcome,` to the `result: CombatResult` object (after `meleeResult,`).

- [ ] **Step 3: Add executeRam**

After `executeMelee` (before `executeAction`, ~line 537), add:
```ts
  /**
   * Execute ram (Таран) — community Star System only.
   * Roll D6 per rammed infantryman: 1-4 killed, 5-6 survived.
   */
  const executeRam = useCallback(async (): Promise<CombatResult> => {
    if (!state.unit || state.actionType !== 'ram') {
      throw new Error('Cannot execute ram: invalid state');
    }
    dispatch({ type: 'EXECUTE_ROLL' });
    await animateDiceRoll();

    const count = Math.max(1, state.parameters.ramInfantryCount || 1);
    const ramInfantryResults = calculateRam(count);

    const result: CombatResult = {
      actionType: 'ram',
      unitType: state.unitType,
      parameters: { ...state.parameters },
      timestamp: Date.now(),
      unitName: state.combatantData ? 'Калькулятор' : state.unit.data.name,
      unitId: state.combatantData ? 'calculator' : state.unit.instanceId,
      ramInfantryResults,
    };

    dispatch({
      type: 'ROLL_COMPLETE',
      result,
      diceDisplay: { hit: ramInfantryResults[0]?.roll },
    });
    return result;
  }, [state, animateDiceRoll]);
```

- [ ] **Step 4: Wire 'ram' into executeAction**

In `executeAction` switch (line ~540-551), add a `ram` case before the default/throw:
```ts
      case 'ram':
        return await executeRam();
```

- [ ] **Step 5: Add wiring tests to useCombatFlow.test.ts**

The existing file uses `renderHook(() => useCombatFlow())` + `act` and tests at the wiring level (deep async execution is covered by Task 1 pure-logic tests + Task 6 E2E). Add to `src/__tests__/hooks/useCombatFlow.test.ts`:
```ts
  it('starts ram combat with actionType=ram and phase=PARAMETERS (#125)', () => {
    const { result } = renderHook(() => useCombatFlow());
    const machineUnit: ArmyUnit = {
      instanceId: 'm1', type: 'machine', instanceNumber: 1,
      data: { id: 'demolisher', name: 'Demolisher', faction: 'polaris', cost: 100, rank: 2,
        fire_rate: 2, ammo_max: 5, durability_max: 16, image: '', speed_sectors: [],
        weapons: [{ name: 'Claw', range: 'ББ', power: '2' }] },
      currentDurability: 10,
    } as any;
    act(() => { result.current.startCombat(machineUnit, undefined, undefined, 'ram'); });
    expect(result.current.state.actionType).toBe('ram');
    expect(result.current.state.phase).toBe('PARAMETERS');
    expect(result.current.isOpen).toBe(true);
  });

  it('starts machine melee combat with actionType=melee (#125)', () => {
    const { result } = renderHook(() => useCombatFlow());
    const machineUnit: ArmyUnit = {
      instanceId: 'm1', type: 'machine', instanceNumber: 1,
      data: { id: 'demolisher', name: 'Demolisher', faction: 'polaris', cost: 100, rank: 2,
        fire_rate: 2, ammo_max: 5, durability_max: 16, image: '', speed_sectors: [],
        weapons: [{ name: 'Claw', range: 'ББ', power: '2' }] },
      currentDurability: 10,
    } as any;
    act(() => { result.current.startCombat(machineUnit, undefined, undefined, 'melee'); });
    expect(result.current.state.actionType).toBe('melee');
    expect(result.current.state.phase).toBe('PARAMETERS');
  });

  it('accepts ramInfantryCount / targetType parameters (#125)', () => {
    const { result } = renderHook(() => useCombatFlow());
    act(() => { result.current.setParameters({ ramInfantryCount: 4, targetType: 'machine', defenderMeleeBonus: 3 }); });
    expect(result.current.state.parameters.ramInfantryCount).toBe(4);
    expect(result.current.state.parameters.targetType).toBe('machine');
    expect(result.current.state.parameters.defenderMeleeBonus).toBe(3);
  });
```
**Note:** deep execution (dice/animation/outcome) is verified by Task 1's pure-logic unit tests and Task 6's E2E — not duplicated here, matching the existing file's shallow style.

- [ ] **Step 6: Run tests + validate**

Run: `npm test -- useCombatFlow` → green. Run: `npm run validate` → green.
```bash
git add src/hooks/useCombatFlow.ts src/__tests__/hooks/useCombatFlow.test.ts
git commit -m "feat(combat): #125 — machine melee branch + executeRam in useCombatFlow

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: ParameterInputs — defender-type selector + ram count

**Files:**
- Modify: `src/components/combat/ParameterInputs.tsx`

**Interfaces:**
- Consumes: `CombatParameters.targetType`, `defenderMeleeBonus`, `ramInfantryCount` (Task 1); the component already receives `parameters`, `actionType`, `onChange`, `unit`.
- Produces: when actionType is `'melee'` + unit is a machine → renders a defender-type selector (infantry/machine/artillery) + conditional armor/Бр + defender ΣББ fields; when `'ram'` → renders an infantry-count stepper. All changes flow through `onChange({ … })`.

- [ ] **Step 1: Add a melee target-type selector (machine attacker only)**

In `src/components/combat/ParameterInputs.tsx`, locate the melee stats render (`renderMeleeStats`, ~line 277) and the target-armor block (~line 406). Insert a new block, shown only when `actionType === 'melee' && unit?.type === 'machine'`, BEFORE the existing target-armor `{(actionType === 'shot' || actionType === 'grenade' || actionType === 'melee') && (…}` block:
```tsx
      {/* Machine melee: defender type selector (#125, Таблица 6) */}
      {actionType === 'melee' && unit?.type === 'machine' && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Тип цели</div>
          <div className="grid grid-cols-3 gap-1.5">
            {([['infantry', 'Пехотинец'], ['machine', 'Машина'], ['artillery', 'Орудие']] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ targetType: v })}
                className={cn(
                  'min-h-[44px] rounded-lg px-2 py-1.5 text-xs font-bold border transition-colors',
                  (parameters.targetType || 'infantry') === v
                    ? 'bg-cyan-950/50 border-cyan-600/60 text-cyan-300'
                    : 'bg-slate-900/40 border-slate-700/50 text-slate-400'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Defender machine's ΣББ (excluded on surprise attack) */}
          {(parameters.targetType || 'infantry') === 'machine' && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">ΣББ цели</span>
              <input
                type="number"
                min={0}
                value={parameters.defenderMeleeBonus ?? 0}
                onChange={(e) => onChange({ defenderMeleeBonus: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-16 min-h-[44px] bg-slate-900/60 border border-slate-700/50 rounded-lg text-center text-sm font-mono text-slate-200"
              />
            </div>
          )}
          {(parameters.isSurpriseAttack && (parameters.targetType || 'infantry') === 'machine') && (
            <div className="text-[10px] text-purple-400">Внезапная атака: ΣББ цели не учитывается</div>
          )}
        </div>
      )}
```
Adjust the existing target-armor field label: when `actionType === 'melee' && unit?.type === 'machine'`, the label should read `Бр` for `infantry` and `Броня` for `machine`/`artillery`. In the existing armor label (~line 409, `{effectiveTargetIsVehicle ? 'макс зоны' : 'Броня цели'}`), prepend:
```tsx
{actionType === 'melee' && unit?.type === 'machine'
  ? ((parameters.targetType || 'infantry') === 'infantry' ? 'Бр цели' : 'Броня цели')
  : (effectiveTargetIsVehicle ? 'макс зоны' : 'Броня цели')}
```

- [ ] **Step 2: Add ram infantry-count input**

When `actionType === 'ram'`, render a stepper instead of the shot/melee fields. Add near the top of the parameters render (before the shot/grenade/melee blocks):
```tsx
      {/* Таран: number of rammed infantry (#125, community only) */}
      {actionType === 'ram' && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Пехотинцев переехано</div>
          <div className="flex items-center justify-center gap-3">
            <button type="button" onClick={() => onChange({ ramInfantryCount: Math.max(1, (parameters.ramInfantryCount || 1) - 1) })}
              className="min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 border border-slate-700 text-xl text-slate-200">−</button>
            <div className="text-3xl font-black font-mono text-amber-300 w-10 text-center">{parameters.ramInfantryCount || 1}</div>
            <button type="button" onClick={() => onChange({ ramInfantryCount: Math.min(20, (parameters.ramInfantryCount || 1) + 1) })}
              className="min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 border border-slate-700 text-xl text-slate-200">+</button>
          </div>
          <div className="text-[10px] text-slate-500 text-center">D6 на каждого: 1–4 убит, 5–6 выжил</div>
        </div>
      )}
```

- [ ] **Step 3: Run existing + validate**

Run: `npm run validate` → green (no unit test for this UI task; covered by E2E in Task 6).
```bash
git add src/components/combat/ParameterInputs.tsx
git commit -m "feat(combat): #125 — defender-type selector (machine melee) + ram infantry count

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: CombatResults — machine-melee outcome + ram list

**Files:**
- Modify: `src/components/combat/CombatResults.tsx`

**Interfaces:**
- Consumes: `result.meleeOutcome` (machine melee) and `result.ramInfantryResults` (ram). Reuses the grenade blast-checks list pattern (lines ~404-525) for ram.

- [ ] **Step 1: Add a ram results list**

Near the top of `CombatResults.tsx` (after `const isMelee = …`, ~line 33), add:
```ts
  const isRam = result.actionType === 'ram';
  const ramResults = result.ramInfantryResults ?? [];
  const ramKilled = ramResults.filter(r => r.killed).length;
```
Then, after the grenade-blast-checks block (~line 404-525, the `{result.grenadeBlastChecks && …}` section), add a ram list that mirrors it:
```tsx
      {/* Таран results (#125) */}
      {isRam && ramResults.length > 0 && (
        <div data-testid="ram-infantry-results" className="space-y-2">
          {ramResults.map((r) => (
            <div key={r.index} data-testid="ram-infantry-result"
              className={cn('flex items-center justify-between px-3 py-2 rounded-lg border',
                r.killed ? 'bg-red-950/30 border-red-700/40' : 'bg-slate-900/40 border-slate-700/40')}>
              <span className="text-xs text-slate-400">Пехотинец {r.index + 1}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-200">D6: {r.roll}</span>
                <span className={cn('text-xs font-bold', r.killed ? 'text-red-400' : 'text-slate-400')}>
                  {r.killed ? 'Убит' : 'Отброшен'}
                </span>
              </span>
            </div>
          ))}
          <div data-testid="ram-kill-tally" className="text-center text-sm font-bold text-amber-300">
            💀 {ramKilled}/{ramResults.length} убито
          </div>
        </div>
      )}
```

- [ ] **Step 2: Add machine-melee outcome banner**

Inside the melee results IIFE (`{isMelee && result.meleeResult && (() => { … })}`, ~line 597), at the top of the returned `<div className="space-y-3">`, add:
```tsx
            {result.meleeOutcome && (
              <div className={cn('text-center px-4 py-3 rounded-lg border-2',
                result.meleeOutcome.outcome === 'destroyed' ? 'bg-red-900/30 border-red-500/50' :
                result.meleeOutcome.outcome === 'damage' ? 'bg-amber-900/30 border-amber-500/50' :
                'bg-slate-800/40 border-slate-600/50')}>
                <div className="text-lg font-black text-slate-100">
                  {result.meleeOutcome.outcome === 'destroyed' ? 'Цель уничтожена' :
                   result.meleeOutcome.outcome === 'damage' ? `Повреждений: ${result.meleeOutcome.damage}` :
                   'Атака отбита'}
                </div>
              </div>
            )}
```

- [ ] **Step 3: Validate**

Run: `npm run validate` → green.
```bash
git add src/components/combat/CombatResults.tsx
git commit -m "feat(combat): #125 — machine-melee outcome banner + ram results list

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: MachineView — two buttons + UnitCard handlers

**Files:**
- Modify: `src/components/cards/unit-card/MachineView.tsx`
- Modify: `src/components/cards/UnitCard.tsx`

**Interfaces:**
- Consumes: `MachineView` already computes `hasMelee`/`meleeBonus`. `UnitCard` has `rulesVersion` + `combatController.startCombat`.
- Produces: `onMelee()` + `onRam()` callbacks on MachineView; the disabled «Таран» placeholder is replaced by «Ближний бой» (always) + «Таран» (community only).

- [ ] **Step 1: Replace the disabled placeholder with two functional buttons**

In `src/components/cards/unit-card/MachineView.tsx`, replace the entire `{hasMelee && ( <div …>Таран{meleeBonus…}…</div> )}` block (the disabled ram placeholder, ~lines 165-176) with:
```tsx
      {/* Close-combat actions (#125). Melee always available; Ram = community only. */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={isDestroyed}
          onClick={onMelee}
          className="min-h-[44px] rounded-lg px-2 py-2 text-xs font-bold border border-red-700/50 bg-red-950/30 text-red-300 hover:bg-red-950/50 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
        >
          <Sword className="w-4 h-4" />
          Ближний бой{meleeBonus > 0 ? ` +${meleeBonus}` : ''}
        </button>
        {rulesVersion === 'community_star_system' && (
          <button
            type="button"
            disabled={isDestroyed}
            onClick={onRam}
            className="min-h-[44px] rounded-lg px-2 py-2 text-xs font-bold border border-amber-700/50 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            <Flame className="w-4 h-4" />
            Таран
          </button>
        )}
      </div>
```
Notes: `rulesVersion` is a new prop (see Step 3). The button shows whenever the machine exists (any machine can melee/ram); `meleeBonus` labels the ББ sum. Drop the `hasMelee` gate — melee is allowed even with ΣББ=0.

- [ ] **Step 2: Add onMelee/onRam/rulesVersion props to MachineView**

In `MachineView.tsx` props interface (after `onShowImage?`), add:
```ts
  rulesVersion?: string;
  onMelee?: () => void;
  onRam?: () => void;
```
Destructure `rulesVersion, onMelee, onRam` in the function signature. `isDestroyed` already exists (`unit.currentDurability === 0` is passed as `isDestroyed` prop from UnitCard — verify; if not, derive `const isDestroyed = (unit.currentDurability || 0) === 0`).

- [ ] **Step 3: Wire handlers + rulesVersion in UnitCard**

In `src/components/cards/UnitCard.tsx`, add handlers near `handleVehicleAttack` (~line 240):
```ts
  const handleVehicleMelee = () => {
    combatController.startCombat(unit, undefined, undefined, 'melee');
  };
  const handleVehicleRam = () => {
    combatController.startCombat(unit, undefined, undefined, 'ram');
  };
```
In the `<MachineView …/>` render (~line 688+), pass:
```tsx
            rulesVersion={rulesVersion}
            onMelee={handleVehicleMelee}
            onRam={handleVehicleRam}
```

- [ ] **Step 4: Apply-result for 'ram' and machine melee**

In `handleApplyResult` (UnitCard, the `if (!isSquad && result.unitType === 'machine')` block), ensure `actionType === 'melee'` and `actionType === 'ram'` mark the machine's melee/done state. After the existing `} else if (result.actionType === 'melee') { updateThisUnit((u) => ({ ...u, isMachineMelee: true })); }`, add:
```ts
        } else if (result.actionType === 'ram') {
          updateThisUnit((u) => ({ ...u, isMachineMelee: true }));
        }
```
(Ram and melee both consume the machine's action; neither spends ammo — leave `currentAmmo`/`weaponAmmo` untouched.)

- [ ] **Step 5: Validate**

Run: `npm run validate` → green.
```bash
git add src/components/cards/unit-card/MachineView.tsx src/components/cards/UnitCard.tsx
git commit -m "feat(machine-card): #125 — two close-combat buttons (melee + ram) wired to combat modal

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: E2E + full regression

**Files:**
- Create: `e2e/machine-melee-ram.spec.ts`
- Verify existing specs unchanged.

- [ ] **Step 1: Write machine melee + ram E2E**

`e2e/machine-melee-ram.spec.ts` — mirror the army-seed pattern from `e2e/defender-pilot-test.spec.ts` (seed `{ schemaVersion: 1, army }` with a machine having a ББ weapon + pilot; set `bronepehota_view=game`). Two tests:
1. **Melee**: open the machine card → tap «Ближний бой» → the combat modal opens → set target type «Пехотинец», Бр=3 → execute → results show a `meleeOutcome` banner («Цель уничтожена» / «Атака отбита» / «Повреждений: N»).
2. **Ram (community)**: set `bronepehota_rules_version=community_star_system` → «Таран» button visible → tap → set infantry count 3 → execute → `ram-infantry-results` shows 3 rows + `ram-kill-tally` «X/3 убито».
Use `getByRole('button', { name: /ближний бой|таран/i })`, `data-testid="ram-infantry-results"`. Follow `clearStorage(page)` + seeded localStorage via `addInitScript`.

- [ ] **Step 2: Run full E2E + validate**

Run: `npm run validate` → green. Run: `npm run test:e2e` → ALL green, including new spec + `combat.spec.ts`, `defender-pilot-test.spec.ts`, `aimed-shot.spec.ts` (unaffected).

- [ ] **Step 3: Commit**

```bash
git add e2e/machine-melee-ram.spec.ts
git commit -m "test(e2e): #125 — machine melee + ram flows

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review Notes (plan author)

- **Spec coverage:** machine melee strength (T1+T2), Таблица 7 outcome (T1+T2+T4), surprise/exclude-ББ (T2 + ParameterInputs hint T3), ram D6 table (T1), ram reuses grenade pattern (T4), two buttons replace placeholder (T5), community gate (T5), apply-result (T5), E2E (T6). Defender-type selector (T3).
- **Type consistency:** `MeleeDefenderType` defined once in combat-types.ts (Task 1 note ensures no duplicate); `RamInfantryResult` in combat-types.ts; `meleeOutcome`/`ramInfantryResults` on CombatResult; `targetType`/`defenderMeleeBonus`/`ramInfantryCount` on CombatParameters — names match across T1→T2→T3→T4.
- **Risk guards:** `executeMelee` machine branch is `isMachine`-guarded (soldier branch unchanged); `'ram'` handled in `executeAction` + `handleApplyResult`; grenade/shot paths untouched.
