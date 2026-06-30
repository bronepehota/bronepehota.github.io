# «С тыла»: correct hit preview + visualize double power roll (#174) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the surprise-attack («с тыла») combat preview so the **hit** (ПОПАДАНИЕ) probability is no longer inflated, and the double-roll is correctly attributed to **power** (ПРОБИТИЕ): penetration probability recomputed as best-of-2, a «макс» marker on the power notation, and the tooltip reframed to мощность. The actual combat (`executeShot`, re-rolling damage) is unchanged — it is already correct.

**Architecture:** Three coupled changes, all in the combat preview layer. **(1) Math:** `calculateHitProbability` loses its surprise branch (hit = single-roll, per rules §8.3 — surprise does not affect the hit roll); `calculatePenetrationProbability` gains an `isSurpriseAttack` flag computing best-of-2 (`1−(1−p)²`). **(2) Wiring:** `HitProbabilityIndicator` passes `isSurpriseAttack` to penetration (not hit), adds a «макс» badge on the ПРОБИТИЕ bar, reframes the tooltip to мощность, and exposes testids on the two probability values. **(3) Notation:** `ParameterInputs` shows a «макс» marker next to the power dice notation when surprise+shot.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind, Jest (unit), Playwright (E2E).

## Global Constraints

- **Mobile-first**; UI copy Russian; code/identifiers English. Reuse `cn()`/Lucide; no new fonts/palette. Surprise accent stays purple (it is the existing surprise color).
- **Do NOT change `executeShot` / `executeMelee` / `executeGrenade` / `CombatResults`** — the actual combat and the `bothRolls` results visualization are already correct (§8.3: power rolled twice, best taken). This plan touches ONLY the preview/notation.
- **Rule (§8.3):** surprise attack lets the attacker roll the **Сила атаки (power/damage)** die twice and keep the best. It does NOT affect the **hit** (дальность) roll. `executeShot` already implements this correctly (comment `// surprise attack doesn't affect hit roll`).
- **Best-of-2 formula** for penetration preview: `pBest = 1 − (1 − pPerDie)²` on the per-die metric. Exact for single-die power; a slight over-estimate for multi-dice vs the true "best pool" (acceptable for a preview — note in a comment).
- **Rules-agnostic:** the fix applies to BOTH `tehnolog` and `community_star_system` (the surprise logic in the preview does not branch on `rulesVersion`).
- Removing the `isSurpriseAttack` parameter from `calculateHitProbability` requires updating ALL its callers (grep first). TDD. `npm run validate` (type-check + lint + unit) + `npm run test:e2e` separately.
- **Commit after every task.** Branch `fix/174-surprise-attack-preview` already exists and is current — stay on it.

**Spec:** `docs/superpowers/specs/2026-06-30-surprise-attack-preview-design.md`

---

### Task 1: Math + wiring in `HitProbabilityIndicator` + unit tests (TDD)

**Files:**
- Modify: `src/components/combat/HitProbabilityIndicator.tsx` (`calculateHitProbability` `:36`, `calculatePenetrationProbability` `:99`, component call sites `:164-165`, ПРОБИТИЕ bar `~:210`, tooltip `~:239`)
- Test: `src/__tests__/hit-probability-indicator.test.ts`

**Interfaces:**
- Produces: `calculateHitProbability(rangeStr, distanceSteps, fortification, rulesVersion)` — **no** surprise param (single-roll, always). `calculatePenetrationProbability(powerStr, targetArmor, fortification, rulesVersion, isSurpriseAttack=false)` — when `isSurpriseAttack`, returns best-of-2 (`pBest = 1−(1−p)²`). Component wires `isSurpriseAttack` into penetration only; adds a «макс» badge on ПРОБИТИЕ + `data-testid` on both % values; tooltip shows the hit threshold always and notes «мощность: максимум» when surprise.

- [ ] **Step 1: Grep all callers of `calculateHitProbability`**

Run: `grep -rn "calculateHitProbability" src --include=*.ts --include=*.tsx`
Expected: callers are `HitProbabilityIndicator.tsx:164` (component) and the test file. If any OTHER caller passes a 5th `isSurpriseAttack` arg, note it — it must be updated in Step 4.

- [ ] **Step 2: Write/update the unit tests (TDD)**

In `src/__tests__/hit-probability-indicator.test.ts`:

(a) The existing garbage-input test passes a 5th arg — update it (drop the arg, since the param is being removed):
```ts
  test('hit probability, garbage range → 0', () => {
    const r = calculateHitProbability('xyz', 4, 'none', 'tehnolog');
    expect(Number.isFinite(r.probability)).toBe(true);
    expect(r.probability).toBe(0);
  });
```
(If there are other `calculateHitProbability(..., true/false)` calls in this file, drop their 5th arg too.)

(b) Add a test locking single-roll hit value (no inflation possible — surprise is no longer a param):
```ts
  test('hit probability is single-roll: D6 vs distance 3 → 50% (3 of 6)', () => {
    const r = calculateHitProbability('D6', 3, 'none', 'tehnolog');
    expect(r.probability).toBe(50);
    expect(r.favorableRolls).toBe(3);
    expect(r.totalRolls).toBe(6);
  });
```

(c) Add penetration best-of-2 tests:
```ts
  test('penetration probability: D6 vs armor 3, normal → 50%', () => {
    const r = calculatePenetrationProbability('D6', 3, 'none', 'tehnolog', false);
    expect(r.probability).toBe(50);
  });

  test('penetration probability: D6 vs armor 3, surprise (с тыла) → best-of-2 = 75%', () => {
    // pPerDie = 3/6 = 0.5 → pBest = 1 − (1−0.5)² = 0.75
    const r = calculatePenetrationProbability('D6', 3, 'none', 'tehnolog', true);
    expect(r.probability).toBe(75);
    expect(r.penetratingDice).toBe(0.8); // 1 die × 0.75, rounded to 1 decimal
  });

  test('penetration probability: garbage power + surprise → 0 (no NaN)', () => {
    const r = calculatePenetrationProbability('xyz', 3, 'none', 'tehnolog', true);
    expect(Number.isFinite(r.probability)).toBe(true);
    expect(r.probability).toBe(0);
  });
```

- [ ] **Step 3: Run the tests to verify the new ones fail**

Run: `npx jest src/__tests__/hit-probability-indicator.test.ts`
Expected: the best-of-2 penetration test FAILS (function doesn't take `isSurpriseAttack` yet), the single-roll hit test may pass or fail depending on current behavior, the garbage tests may error on the dropped arg until Step 4 compiles. (At least the best-of-2 test must be RED.)

- [ ] **Step 4: Fix `calculateHitProbability` — remove the surprise branch + param**

In `src/components/combat/HitProbabilityIndicator.tsx`, replace the whole `calculateHitProbability` function (`:36-67`) with:

```ts
export function calculateHitProbability(
  rangeStr: string,
  distanceSteps: number,
  fortification: 'none' | 'light' | 'heavy',
  rulesVersion: RulesVersionID
): { probability: number; favorableRolls: number; totalRolls: number } {
  const { sides, bonus } = parseRoll(rangeStr);
  // Invalid/unusable notation (e.g. 'ББ', malformed editor input) → sides:0.
  if (sides < 1) return { probability: 0, favorableRolls: 0, totalRolls: 0 };

  // Community Star System: fortification adds to distance
  const effectiveDistance = rulesVersion === 'community_star_system'
    ? distanceSteps + (fortification === 'light' ? 1 : fortification === 'heavy' ? 2 : 0)
    : distanceSteps;

  const maxRoll = sides + bonus;

  // Single-roll hit probability. Surprise attack (§8.3) does NOT affect the hit roll —
  // the double-roll belongs to power (see calculatePenetrationProbability).
  const favorableRolls = Math.min(sides, Math.max(0, maxRoll - effectiveDistance + 1));
  const totalRolls = sides;
  const probability = totalRolls > 0 ? (favorableRolls / totalRolls) * 100 : 0;
  return { probability, favorableRolls, totalRolls };
}
```

- [ ] **Step 5: Fix `calculatePenetrationProbability` — add best-of-2**

Replace the `calculatePenetrationProbability` function (`:99-132`) with:

```ts
export function calculatePenetrationProbability(
  powerStr: string,
  targetArmor: number,
  fortification: 'none' | 'light' | 'heavy' = 'none',
  rulesVersion: RulesVersionID = 'tehnolog',
  isSurpriseAttack: boolean = false
): { probability: number; penetratingDice: number; totalDice: number } {
  const { dice, sides, bonus } = parseRoll(powerStr);
  // Invalid notation → sides:0 would divide by zero below; report 0% instead.
  if (sides < 1) return { probability: 0, penetratingDice: 0, totalDice: 0 };

  // Tehnolog rules: fortification adds to armor
  const effectiveArmor = rulesVersion === 'tehnolog'
    ? targetArmor + (fortification === 'light' ? 1 : fortification === 'heavy' ? 2 : 0)
    : targetArmor;

  // Single-roll per-die penetration chance: result > effectiveArmor.
  const favorableOutcomes = Math.min(sides, Math.max(0, sides + bonus - effectiveArmor));
  const pPerDie = favorableOutcomes / sides;

  // Surprise attack (§8.3 «с тыла»): power is rolled twice, take best.
  // Best-of-2 on the per-die metric: P(best of 2 penetrates) = 1 − (1 − p)².
  // Exact for single-die power; slight over-estimate for multi-dice vs the true
  // "best pool" (acceptable for a preview).
  const pBest = isSurpriseAttack ? 1 - Math.pow(1 - pPerDie, 2) : pPerDie;

  const probability = pBest * 100;
  const expectedPenetratingDice = pBest * dice;

  return {
    probability,
    penetratingDice: Math.round(expectedPenetratingDice * 10) / 10,
    totalDice: dice
  };
}
```

- [ ] **Step 6: Wire the component — hit without surprise, penetration with surprise + testids + макс badge + tooltip**

In the `HitProbabilityIndicator` component body (`:163-165`), replace the two `calculate*` calls:

```ts
  const hitProb = calculateHitProbability(rangeStr, distanceSteps, fortification, rulesVersion);
  const penProb = calculatePenetrationProbability(powerStr, targetArmor, fortification, rulesVersion, isSurpriseAttack);
```

Add `data-testid="hit-probability"` to the ПОПАДАНИЕ % span (the `<span className={cn("text-sm font-black font-mono leading-none", hitColor)}>` that renders `{Math.round(hitProb.probability)}%`):

```tsx
              <span data-testid="hit-probability" className={cn("text-sm font-black font-mono leading-none", hitColor)}>
                {Math.round(hitProb.probability)}%
              </span>
```

Add `data-testid="penetration-probability"` AND a «макс» badge to the ПРОБИТИЕ label row (the `<div className="flex items-center justify-between mb-1">` containing `<span ...>ПРОБИТИЕ</span>`):

```tsx
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-[8px] uppercase font-bold text-slate-500">
                ПРОБИТИЕ
                {isSurpriseAttack && (
                  <span className="text-purple-400 normal-case font-mono">макс</span>
                )}
              </span>
              <span data-testid="penetration-probability" className={cn("text-sm font-black font-mono leading-none", penColor)}>
                {Math.round(penProb.probability)}%
              </span>
            </div>
```

Reframe the tooltip (`:239-245`) — always show the hit threshold, and note мощность: максимум when surprise:

```tsx
      {/* Roll details tooltip */}
      <div className="text-center text-[9px] text-slate-600 font-mono">
        <span>
          Нужно бросить ≥{distanceSteps}{rulesVersion === 'community_star_system' && fortification !== 'none' ? ` +${fortification === 'light' ? 1 : 2}` : ''}
          {isSurpriseAttack && ' · мощность: максимум'}
        </span>
      </div>
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx jest src/__tests__/hit-probability-indicator.test.ts`
Expected: ALL pass (garbage tests, single-roll hit, penetration normal + best-of-2).

- [ ] **Step 8: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: clean (no caller of `calculateHitProbability` still passes a 5th arg — Step 1 grep confirmed the set; update any straggler).

- [ ] **Step 9: Commit**

```bash
git add src/components/combat/HitProbabilityIndicator.tsx src/__tests__/hit-probability-indicator.test.ts
git commit -m "fix(preview): #174 — hit not inflated by surprise; penetration = best-of-2; макс badge"
```

---

### Task 2: «макс» marker on the power dice notation (`ParameterInputs`)

**Files:**
- Modify: `src/components/combat/ParameterInputs.tsx` (power display block `~:218-240`)

**Interfaces:** None new. When `parameters.isSurpriseAttack && actionType === 'shot'`, the power dice-notation area shows a «макс» marker (e.g. a small badge after the `DiceNotationDisplay`), visualizing the double power roll. The roll string itself is NOT modified (it stays parseable).

- [ ] **Step 1: Add the «макс» marker next to the power notation**

In `src/components/combat/ParameterInputs.tsx`, find the power display. There are TWO render branches — the `onDataNeeded && combatantData` button branch (`:228-235`) and the plain `<DiceNotationDisplay>` branch (`:239`). Wrap each power notation in a flex row with a conditional «макс» badge.

For the button branch, change:
```tsx
                    {!unitStats.power ? 'Нажмите для ввода' : <DiceNotationDisplay rollStr={unitStats.power} color="orange" />}
```
to:
```tsx
                    {!unitStats.power ? 'Нажмите для ввода' : (
                      <span className="flex items-center gap-1">
                        <DiceNotationDisplay rollStr={unitStats.power} color="orange" />
                        {parameters.isSurpriseAttack && actionType === 'shot' && (
                          <span className="text-purple-400 text-[10px] font-mono font-bold" data-testid="power-max-marker">макс</span>
                        )}
                      </span>
                    )}
```

For the plain branch, change:
```tsx
                  <DiceNotationDisplay rollStr={unitStats.power} color="orange" />
```
to:
```tsx
                  <span className="flex items-center gap-1">
                    <DiceNotationDisplay rollStr={unitStats.power} color="orange" />
                    {parameters.isSurpriseAttack && actionType === 'shot' && (
                      <span className="text-purple-400 text-[10px] font-mono font-bold" data-testid="power-max-marker">макс</span>
                    )}
                  </span>
```

(`parameters` and `actionType` are already props of `ParameterInputs` — `parameters.isSurpriseAttack` is read elsewhere in this file at `:160`.)

- [ ] **Step 2: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: clean.

- [ ] **Step 3: Run the combat unit tests**

Run: `npx jest src/__tests__/hooks/useCombatFlow.test.ts src/__tests__/hit-probability-indicator.test.ts`
Expected: PASS (Task 1 + existing combat tests still green — this task is display-only).

- [ ] **Step 4: Commit**

```bash
git add src/components/combat/ParameterInputs.tsx
git commit -m "feat(preview): #174 — «макс» marker on power notation for «с тыла» shots"
```

---

### Task 3: E2E spec + full validation

**Files:**
- Create: `e2e/surprise-attack-preview.spec.ts`

**Interfaces:**
- Consumes: `setupGameSessionWithSquad` + `clearStorage` from `e2e/helpers/setup`; the surprise chip `aria-label*="Внезапная атака"`; `data-testid="hit-probability"`, `data-testid="penetration-probability"`, `data-testid="power-max-marker"` (added in Tasks 1-2).
- Produces: integration proof — toggling «с тыла» does NOT change ПОПАДАНИЕ %, DOES raise ПРОБИТИЕ %, and shows «макс».

Note: D6 is random, but the probability % values are deterministic given range/power/armor (the mock squad has fixed stats), so we CAN assert on the % deltas.

- [ ] **Step 1: Write the spec**

Create `e2e/surprise-attack-preview.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * #174 — surprise attack («с тыла») preview:
 * hit probability is NOT inflated; penetration reflects the double power roll (макс).
 */
test.describe('Surprise-attack preview (#174)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  async function openShotModal(page: Page) {
    const unitCard = page.getByTestId('unit-nav-surprise-unit-1');
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

  test('«с тыла» does not inflate hit; raises penetration; shows макс', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'surprise-unit-1' } });
    await openShotModal(page);

    const hitEl = page.getByTestId('hit-probability');
    const penEl = page.getByTestId('penetration-probability');

    await expect(hitEl).toBeVisible({ timeout: 3000 });
    const hitBefore = (await hitEl.textContent())!.trim();
    const penBefore = Number((await penEl.textContent())!.replace('%', '').trim());

    // No макс marker before toggling
    await expect(page.getByTestId('power-max-marker')).toHaveCount(0);

    // Toggle «с тыла» on
    const surpriseChip = page.locator('button[aria-label*="Внезапная атака"]');
    await surpriseChip.click();
    await page.waitForTimeout(200);

    // Hit probability UNCHANGED (not inflated)
    const hitAfter = (await hitEl.textContent())!.trim();
    expect(hitAfter).toBe(hitBefore);

    // Penetration probability INCREASED (best-of-2)
    const penAfter = Number((await penEl.textContent())!.replace('%', '').trim());
    expect(penAfter).toBeGreaterThan(penBefore);

    // макс marker now present (power notation)
    await expect(page.getByTestId('power-max-marker').first()).toBeVisible({ timeout: 2000 });
  });
});
```

(Adapt the `openShotModal` sequence to the helper's real behavior — it mirrors `e2e/combat.spec.ts`: click `unit-nav-<id>` → "Выберите действие" → "выстрел". The mock squad from `setupGameSessionWithSquad` has soldiers with range `D6`/`D12` and power `2D6` — fixed stats, so the % values are deterministic.)

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test e2e/surprise-attack-preview.spec.ts --project=chromium`
Expected: PASS. (Before Tasks 1-2, ПОПАДАНИЕ would change with surprise and no макс/penetration-delta — the test would fail.)

- [ ] **Step 3: Full validation**

Run: `npm run validate`
Expected: type-check clean; lint no NEW warnings in touched files; unit tests all green (incl. the updated hit-prob tests + new penetration best-of-2 tests).

Run: `npm run test:e2e`
Expected: all specs PASS, incl. new `surprise-attack-preview.spec.ts` AND regression (`combat.spec.ts`, `aimed-shot.spec.ts`, `battle-buffs.spec.ts`, `height-bonus.spec.ts`).

- [ ] **Step 4: Record green verification**

If Steps 2–3 surfaced fixups, commit them. Otherwise this task records green verification (no commit needed).
