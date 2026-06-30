# Vehicle zone damage via entered zone-max (#162) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the player marks the target as a vehicle (community rules, shot), damage uses the zone-based rule — armor = the entered zone-max threshold, and each penetrating die deals damage scaled by die type (D6→1, D12→2, D20→3) instead of +1. The choice is remembered per-attacker via the existing `TargetMemory`.

**Architecture:** Four changes. **(1) Rules engine:** community `calculateDamage` vehicle branch is rewritten to use the entered `targetArmor` as the zone-max threshold + damagePerDie (no `vehicleData`/`currentDurability`); `getDurabilityZone` removed. **(2) Wiring:** `targetIsVehicle` added to `CombatParameters` + `TargetMemory`; `executeShot` passes `isVehicle = state.parameters.targetIsVehicle` (the TARGET, not the attacker) on both damage paths. **(3) UI:** `ParameterInputs` shows a «цель — техника» toggle (community + shot); when on, the armor label becomes «макс зоны» and the value persists/recalls via `TargetMemory`. **(4) E2E + validation.**

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind, Jest (unit), Playwright (E2E).

## Global Constraints

- **Mobile-first**; UI copy Russian; code/identifiers English. Reuse `cn()`/Lucide; no new fonts/palette.
- **Community rules only** for the zone mechanic (tehnolog `calculateDamage` is unchanged — it damages vehicles like infantry by design). The toggle shows only when `rulesVersion === 'community_star_system' && actionType === 'shot'`.
- **`isVehicle` means the TARGET is a vehicle** (`state.parameters.targetIsVehicle`), NOT the attacker (`state.unitType === 'machine'`) — that was the original bug.
- **damagePerDie mapping is fixed:** D6→1, D12→2, D20→3 (other sides → 1 fallback).
- The `currentDurability`/`durabilityMax`/`vehicleData` params stay in `CalculateDamageFn`'s signature (backward-compat) but become unused in the community branch — prefix with `_` (the file already uses this convention, e.g. `_fortification`).
- `calculateHit`, penetration preview, tehnolog rules, grenades, melee are NOT changed.
- TDD. `npm run validate` + `npm run test:e2e` separately.
- **Commit after every task.** Branch `fix/162-vehicle-zone-damage` already exists and is current — stay on it.

**Spec:** `docs/superpowers/specs/2026-07-01-vehicle-zone-damage-design.md`

---

### Task 1: Rewrite community `calculateDamage` vehicle branch (entered zone-max threshold) — TDD

**Files:**
- Modify: `src/lib/rules/community_star_system.ts` (rewrite the vehicle branch `:196-218`; remove `getDurabilityZone` `:48-82`; clean unused imports)
- Test: `src/__tests__/community-star-system-rules.test.ts` (rewrite the vehicle/zone tests `:120-165`)

**Interfaces:**
- Produces: when `isVehicle === true`, community `calculateDamage` uses `targetArmor` as the zone-max threshold and adds `damagePerDie(sides)` (D6→1, D12→2, D20→3) for each die `> threshold`. Non-vehicle path unchanged. `getDurabilityZone` deleted.

- [ ] **Step 1: Rewrite the vehicle tests to the new contract**

In `src/__tests__/community-star-system-rules.test.ts`, replace the vehicle/zone tests (`:120-165`: "uses zone-based calculation for vehicle targets", "applies correct damage per die type", "handles different durability zones", and the `machineWithZones` explicit-zones test) with threshold-based tests. Use a guaranteed-penetration power (`D{sides}+99`) so damage is deterministic (every die penetrates):

```ts
    it('vehicle target: each penetrating die deals damagePerDie (D6=1, D12=2, D20=3)', () => {
      // threshold 5; high bonus guarantees penetration → damage = dice × damagePerDie
      const r6 = communityStarSystemRules.calculateDamage('D6+99', 5, undefined, undefined, true);
      const r12 = communityStarSystemRules.calculateDamage('D12+99', 5, undefined, undefined, true);
      const r20 = communityStarSystemRules.calculateDamage('D20+99', 5, undefined, undefined, true);
      expect(r6.damage).toBe(1);   // 1 die × D6 → 1
      expect(r12.damage).toBe(2);  // 1 die × D12 → 2
      expect(r20.damage).toBe(3);  // 1 die × D20 → 3
    });

    it('vehicle target: dice below the threshold deal no damage', () => {
      // threshold 99; bonus 0 → no die can exceed 99 → 0 damage
      const r = communityStarSystemRules.calculateDamage('2D12', 99, undefined, undefined, true);
      expect(r.damage).toBe(0);
      expect(r.rolls.length).toBe(2);
    });

    it('vehicle target: multi-die power sums damagePerDie per penetrating die', () => {
      // 2D12, threshold 0 → every die penetrates → 2 × 2 = 4
      const r = communityStarSystemRules.calculateDamage('2D12+99', 0, undefined, undefined, true);
      expect(r.damage).toBe(4);
    });

    it('non-vehicle target: still +1 per penetrating die (infantry)', () => {
      const r = communityStarSystemRules.calculateDamage('D6+99', 5, undefined, undefined, false);
      expect(r.damage).toBe(1);
    });
```

(Remove the `mockMachine`/`machineWithZones` fixtures if they become unused after these rewrites. Drop the `currentDurability`/`durabilityMax`/`vehicleData` args from the calls — they're now ignored.)

- [ ] **Step 2: Run the tests to verify the vehicle ones fail**

Run: `npx jest src/__tests__/community-star-system-rules.test.ts`
Expected: the new vehicle tests FAIL (the branch still requires `vehicleData && currentDurability`, so `isVehicle=true` alone doesn't trigger zone damage → damage is 0 or infantry-style). Non-vehicle test passes.

- [ ] **Step 3: Rewrite the vehicle branch in `calculateDamage`**

In `src/lib/rules/community_star_system.ts`, replace the vehicle branch (`:196-218`, the `if (isVehicle && vehicleData && currentDurability !== undefined) { ... getDurabilityZone ... }` block) with:

```ts
    // Vehicle target (community rules §6): armor = entered zone-max threshold (targetArmor);
    // each penetrating die deals damage scaled by die type (D6→1, D12→2, D20→3).
    if (isVehicle) {
      const zoneMax = targetArmor;
      let damage = 0;
      for (let i = 0; i < dice; i++) {
        const r = rollDie(sides) + bonus;
        rolls.push(r);
        if (r > zoneMax) {
          if (sides === 6) damage += 1;
          else if (sides === 12) damage += 2;
          else if (sides === 20) damage += 3;
          else damage += 1; // fallback for other die types
        }
      }
      return { damage, rolls };
    }
```

- [ ] **Step 4: Delete `getDurabilityZone` + clean imports**

Delete the `getDurabilityZone` function (`:48-82`). Remove now-unused imports: `Machine`, `DurabilityZone` (check via lint — `Machine` may still be needed if referenced elsewhere in the file; `DurabilityZone` was only for `getDurabilityZone`). Also prefix the now-unused signature params `currentDurability`, `durabilityMax`, `vehicleData` with `_` (matching the file's `_fortification` convention):

```ts
  calculateDamage: (
    powerStr: string,
    targetArmor: number,
    _fortification: FortificationType = 'none',
    special?: WeaponSpecial,
    isVehicle?: boolean,
    _currentDurability?: number,
    _durabilityMax?: number,
    _vehicleData?: Machine
  ): DamageResult => {
```

(Keep `Machine` in the import only if `_vehicleData?: Machine` still references it — it does, so keep `Machine` imported; remove `DurabilityZone` if unused elsewhere.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/__tests__/community-star-system-rules.test.ts`
Expected: ALL pass (vehicle threshold-based + non-vehicle + existing hit/damage tests).

- [ ] **Step 6: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: clean (no unused `getDurabilityZone`/imports/params).

- [ ] **Step 7: Commit**

```bash
git add src/lib/rules/community_star_system.ts src/__tests__/community-star-system-rules.test.ts
git commit -m "fix(rules): #162 — community vehicle damage = entered zone-max threshold × damagePerDie"
```

---

### Task 2: Wire `targetIsVehicle` (CombatParameters + TargetMemory + executeShot)

**Files:**
- Modify: `src/lib/combat-types.ts` (add `targetIsVehicle?: boolean` to `CombatParameters`)
- Modify: `src/contexts/CombatTargetContext.tsx` (add `targetIsVehicle: boolean | null` to `TargetMemory` + `createEmptyMemory`)
- Modify: `src/hooks/useCombatFlow.ts` (`executeShot`: `isVehicle = state.parameters.targetIsVehicle` on both damage paths)
- Test: `src/__tests__/hooks/useCombatFlow.test.ts`

**Interfaces:**
- Produces: `CombatParameters.targetIsVehicle?: boolean`; `TargetMemory.targetIsVehicle: boolean | null`; `executeShot` passes `isVehicle = state.parameters.targetIsVehicle === true` to `calculateDamage` (both the normal `:318` and surprise `:303/310` paths).

- [ ] **Step 1: Add the field to `CombatParameters`**

In `src/lib/combat-types.ts`, find `CombatParameters` and add (near `targetArmor`):

```ts
  targetArmor: number;        // Target's armor value
  targetIsVehicle?: boolean;  // Target is a vehicle → community zone-based damage (#162)
```

- [ ] **Step 2: Add the field to `TargetMemory`**

In `src/contexts/CombatTargetContext.tsx`, add to the `TargetMemory` interface (after `targetMelee`):

```ts
  targetMelee: number | null;
  targetIsVehicle: boolean | null;  // Remembered vehicle-target toggle (#162)
```

And in `createEmptyMemory`, add `targetIsVehicle: null,` (after `targetMelee: null,`).

- [ ] **Step 3: Fix `isVehicle` in `executeShot`**

In `src/hooks/useCombatFlow.ts`, in `executeShot`, BOTH damage calls currently pass `state.unitType === 'machine'` as the `isVehicle` arg. Change both to `state.parameters.targetIsVehicle === true`:

Surprise path (`~:303` and `~:310`):
```ts
        const damage1 = rules.calculateDamage(
          power,
          state.parameters.targetArmor,
          state.parameters.fortification,
          undefined,
          state.parameters.targetIsVehicle === true
        );
```
(and the identical `damage2` call.)

Normal path (`~:318`):
```ts
        damageResult = rules.calculateDamage(
          power,
          state.parameters.targetArmor,
          state.parameters.fortification,
          undefined,
          state.parameters.targetIsVehicle === true
        );
```

- [ ] **Step 4: Write the unit test**

In `src/__tests__/hooks/useCombatFlow.test.ts`, add (in the combat-outcomes `describe`):

```ts
  it('shot: vehicle target (targetIsVehicle) deals damagePerDie, not infantry +1', async () => {
    // mock squad soldier has power '2D6'. Use a machine-like target via targetIsVehicle + high threshold guard.
    // Deterministic: community rules, targetIsVehicle=true, and assert the damage structure.
    const { result } = renderHook(() => useCombatFlow());
    await act(async () => { result.current.startCombat(makeSquadUnit(), 0, undefined, 'shot'); });
    await act(async () => {
      result.current.setParameters({ distance: 3, targetArmor: 0, targetIsVehicle: true });
    });
    await act(async () => { await result.current.executeAction(); });
    const dr = result.current.state.result?.damageResult;
    expect(dr).toBeDefined();
    // power 2D6, threshold 0 → every die penetrates → 2 dice × (D6→1) = 2 damage
    expect(dr!.damage).toBe(2);
  });
```

(Adjust the assertion if the mock squad's soldier power differs — `makeSquadUnit` soldier 0 has `power: 'D6'` (1 die → damage 1). If soldier 0 power is `D6`, expect `dr.damage === 1`; verify the mock squad's soldier[0].power in the test file and set the expectation accordingly. The key assertion: with `targetIsVehicle=true` + threshold 0, damage = dice × damagePerDie, NOT the infantry value.)

- [ ] **Step 5: Run the tests**

Run: `npx jest src/__tests__/hooks/useCombatFlow.test.ts`
Expected: the new vehicle test PASSES (community default rules + targetIsVehicle → zone damage). Existing shot/melee/grenade tests still green.

- [ ] **Step 6: Type-check + lint + commit**

Run: `npm run type-check && npm run lint` → clean.
```bash
git add src/lib/combat-types.ts src/contexts/CombatTargetContext.tsx src/hooks/useCombatFlow.ts src/__tests__/hooks/useCombatFlow.test.ts
git commit -m "feat(combat): #162 — wire targetIsVehicle to executeShot (isVehicle = target, not attacker)"
```

---

### Task 3: UI — «цель — техника» toggle + «макс зоны» label (`ParameterInputs`)

**Files:**
- Modify: `src/components/combat/ParameterInputs.tsx` (add effective `targetIsVehicle` recall; toggle; conditional label)

**Interfaces:**
- Consumes: `parameters.targetIsVehicle`, `targetMemory.targetIsVehicle`, `onMemoryUpdate`.
- Produces: a «цель — техника» toggle (community + shot) that sets `parameters.targetIsVehicle` + persists to `targetMemory`; when on, the armor field label shows «макс зоны».

- [ ] **Step 1: Add the effective recall + toggle**

In `src/components/combat/ParameterInputs.tsx`, near the other `effective*` values (`:57-63`), add:

```ts
  const effectiveTargetIsVehicle = targetMemory?.isDirty && targetMemory?.targetIsVehicle !== null
    ? !!targetMemory.targetIsVehicle
    : !!parameters.targetIsVehicle;
```

- [ ] **Step 2: Add the toggle + conditional label in the armor field**

Find the Target Armor Input block (`:361-379`). Change the label to be conditional and add a toggle. Replace the block with:

```tsx
          {(actionType === 'shot' || actionType === 'grenade' || actionType === 'melee') && (
            <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-[auto_1fr] sm:gap-2 sm:items-center gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold whitespace-nowrap sm:min-w-[70px]">
                {effectiveTargetIsVehicle ? 'макс зоны' : 'Броня цели'}
              </label>
              <div className="flex items-center gap-2">
                <NumberStepper
                  value={effectiveTargetArmor}
                  onChange={(value) => {
                    onChange({ targetArmor: value });
                    onMemoryUpdate?.({ targetArmor: value });
                  }}
                  min={0}
                  max={99}
                  step={1}
                  size="sm"
                  className="flex-1 sm:justify-start"
                />
                {rulesVersion === 'community_star_system' && actionType === 'shot' && (
                  <label className="flex items-center gap-1 text-[9px] md:text-[10px] font-mono uppercase text-slate-400 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      className="accent-cyan-500 w-3.5 h-3.5"
                      checked={effectiveTargetIsVehicle}
                      onChange={(e) => {
                        onChange({ targetIsVehicle: e.target.checked });
                        onMemoryUpdate?.({ targetIsVehicle: e.target.checked });
                      }}
                    />
                    цель — техника
                  </label>
                )}
              </div>
            </div>
          )}
```

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint` → clean.

- [ ] **Step 4: Run combat unit tests**

Run: `npx jest src/__tests__/hooks/useCombatFlow.test.ts src/__tests__/community-star-system-rules.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/combat/ParameterInputs.tsx
git commit -m "feat(combat-ui): #162 — «цель — техника» toggle + «макс зоны» label (community, shot)"
```

---

### Task 4: E2E + full validation

**Files:**
- Create: `e2e/vehicle-zone-damage.spec.ts`

**Interfaces:**
- Consumes: `setupGameSessionWithSquad`/`setupGameSessionWithMachine`, `clearStorage`; the «цель — техника» checkbox; the armor/«макс зоны» NumberStepper; combat results. Community rules via the addInitScript-after-setup trick.
- Produces: integration proof — toggling «цель — техника» + entering zone-max yields damagePerDie-scale damage; the toggle persists for the same attacker.

- [ ] **Step 1: Write the spec**

Create `e2e/vehicle-zone-damage.spec.ts`. Mirror `e2e/combat.spec.ts` for the open-shot sequence and the `enableCommunityRules` addInitScript-after-setup trick (register AFTER `setupGameSessionWithSquad` so it runs after the helper's `localStorage.clear()` on reload). Test:

```ts
import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * #162 — vehicle zone damage: «цель — техника» toggle → damagePerDie-scale damage;
 * toggle + zone-max remembered per attacker.
 */
test.describe('Vehicle zone damage (#162)', () => {
  test.beforeEach(async ({ page }) => { await clearStorage(page); });

  async function enableCommunity(page: Page) {
    await page.addInitScript(() => {
      localStorage.setItem('bronepehota_rules_version', 'community_star_system');
      localStorage.setItem('bronepehota_panic_enabled', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });
    await expandFirstUnit(page);
  }

  test('«цель — техника» toggle shows «макс зоны» and yields vehicle damage', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'vz-unit-1' } });
    await expandFirstUnit(page);
    await enableCommunity(page);

    // open shot modal (mirror combat.spec.ts)
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.getByRole('button', { name: /выстрел/i }).first().click();
    await page.waitForTimeout(300);

    // toggle «цель — техника» on
    const vehicleToggle = page.getByLabel('цель — техника');
    await expect(vehicleToggle).toBeVisible({ timeout: 3000 });
    await vehicleToggle.check();

    // label flipped to «макс зоны»
    await expect(page.getByText('макс зоны')).toBeVisible({ timeout: 2000 });

    // set zone-max (targetArmor) to 0 so any hit penetrates, then fire
    // (use the NumberStepper — set via its testid or keyboard; if no testid, set targetArmor=0 is default)
    const fireButton = page.getByRole('button', { name: /выстрелить/i });
    await fireButton.click();
    await page.waitForTimeout(500);

    // results render (combat resolved) — vehicle damage applied
    await expect(page.getByText(/урон|поврежд/i)).toBeVisible({ timeout: 3000 });
  });

  test('toggle remembers for the same attacker on re-open', async ({ page }) => {
    // setup, enable community, open shot, toggle on, close, re-open shot → toggle still on
    // (assert the checkbox is checked on re-open)
    // ... mirror the open sequence; this test guards the TargetMemory persistence.
  });
});
```

(Adapt the open-sequence + assertions to the real UI — read `e2e/combat.spec.ts`. The second test guards the per-attacker memory; if the re-open flow is complex, at minimum assert the toggle persists across a close/reopen of the same unit's shot modal.)

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test e2e/vehicle-zone-damage.spec.ts --project=chromium`
Expected: PASS. Adapt selectors/timing as needed (mirror `combat.spec.ts`).

- [ ] **Step 3: Full validation**

Run: `npm run validate` → type-check + lint clean; unit green.
Run: `npm run test:e2e` → all specs PASS, incl. new + regression (`combat`, `panic-on-death`, etc.).

- [ ] **Step 4: Record green verification**

If Steps 2–3 surfaced fixups, commit them. Otherwise records green verification.
