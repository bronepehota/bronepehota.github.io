# Melee Defender Uses Armor (#160) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In melee combat, the defender's stat is their armor (Бр), not ББ — fix the call site, rename the parameter for clarity, and update the UI so melee collects/ displays the target's armor.

**Architecture:** `calculateMelee`'s function body is unchanged (it adds the 2nd arg to the defender's D6). The bug is at the single call site: `useCombatFlow.executeMelee` passes `state.parameters.targetMelee` (ББ) instead of `state.parameters.targetArmor` (Бр), in both the normal and surprise-attack paths. Fix the call site (Task 1, TDD), rename the parameter `defenderMelee` → `defenderArmor` across the type + both rules + the game-logic helpers so the name stops lying (Task 2, refactor), then update `ParameterInputs` so melee shows the «Броня цели» field and preview (Task 3, E2E-verified).

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind, Jest + React Testing Library (unit), Playwright (E2E).

## Global Constraints

- **Mobile-first**; UI copy Russian; code/identifiers English. Reuse `cn()`/Lucide; no new fonts/palette.
- **Attacker side unchanged** — the attacker still uses ББ (`attackerMelee`). Machine-**attacker** melee (D6 + броня + ББ-оружие) is out of scope — that's #125.
- **Both rules versions** (`community_star_system`, `tehnolog`) must agree — `calculateMelee` is identical in both; change both.
- Do NOT touch `src/lib/calculator-engine.ts:58 calculateMelee` — it is a **different** function (standalone calculator, different signature).
- `calculateMelee`'s function body must NOT change behavior — only the call site (which stat is passed) and the parameter name change. Existing `calculateMelee(4,3)` tests stay green.
- Don't break shot/grenade. TDD. `npm run validate` (type-check + lint + unit) + `npm run test:e2e` separately.
- **Commit after every task.** Branch `fix/160-melee-defender-armor` already exists — stay on it.

**Spec:** `docs/superpowers/specs/2026-06-30-melee-defender-armor-design.md`

---

### Task 1: Defender uses armor — call site fix (TDD)

**Files:**
- Modify: `src/hooks/useCombatFlow.ts` (`executeMelee`, normal path `:543` + surprise-attack path `:527`)
- Test: `src/__tests__/hooks/useCombatFlow.test.ts` (melee outcome test `:136-145`)

**Interfaces:**
- Produces: `executeMelee` passes `state.parameters.targetArmor` (Бр) as the defender stat into `rules.calculateMelee` and into the surprise-attack `dTotal`. `MeleeResult.defenderTotal` now equals `defenderRoll + targetArmor`.

- [ ] **Step 1: Replace the melee outcome test with an armor-based one**

In `src/__tests__/hooks/useCombatFlow.test.ts`, find the existing melee test:

```ts
  it('melee: resolves a winner and adds soldier melee (rank melee=2)', async () => {
    const res = await runAction('melee', { targetMelee: 2 });
    expect(res.actionType).toBe('melee');
    expect(res.meleeResult).toBeDefined();
    expect(['attacker', 'defender', 'draw']).toContain(res.meleeResult!.winner);
    // attackerTotal = attackerRoll(1–6) + soldier.melee(2)
    expect(res.meleeResult!.attackerTotal).toBe(res.meleeResult!.attackerRoll + 2);
    expect(res.meleeResult!.attackerTotal).toBeGreaterThanOrEqual(3);
    expect(res.meleeResult!.attackerTotal).toBeLessThanOrEqual(8);
  });
```

Replace with (uses `targetArmor`, and asserts the defender total is built from armor):

```ts
  it('melee: defender uses armor (Бр), not ББ', async () => {
    const res = await runAction('melee', { targetArmor: 2 });
    expect(res.actionType).toBe('melee');
    expect(res.meleeResult).toBeDefined();
    expect(['attacker', 'defender', 'draw']).toContain(res.meleeResult!.winner);
    // attackerTotal = attackerRoll(1–6) + soldier.melee(2) — attacker still ББ
    expect(res.meleeResult!.attackerTotal).toBe(res.meleeResult!.attackerRoll + 2);
    // defenderTotal = defenderRoll(1–6) + targetArmor(2) — defender uses Бр
    expect(res.meleeResult!.defenderTotal).toBe(res.meleeResult!.defenderRoll + 2);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/hooks/useCombatFlow.test.ts -t "defender uses armor"`
Expected: FAIL — `defenderTotal` is `defenderRoll + 0` (the code still reads `state.parameters.targetMelee`, which is unset → 0), not `defenderRoll + 2`.

- [ ] **Step 3: Fix the surprise-attack path**

In `src/hooks/useCombatFlow.ts`, find (inside `executeMelee`, surprise-attack branch):

```ts
      const dTotal = defenderRoll + state.parameters.targetMelee;
```

Replace with:

```ts
      const dTotal = defenderRoll + state.parameters.targetArmor;
```

- [ ] **Step 4: Fix the normal path**

Find:

```ts
      meleeResult = rules.calculateMelee(attackerMelee, state.parameters.targetMelee);
```

Replace with:

```ts
      meleeResult = rules.calculateMelee(attackerMelee, state.parameters.targetArmor);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/__tests__/hooks/useCombatFlow.test.ts`
Expected: PASS — the melee test now green; all other tests in the file (shot, grenade) still green.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCombatFlow.ts src/__tests__/hooks/useCombatFlow.test.ts
git commit -m "fix(melee): defender stat is armor (Бр), not ББ (#160)"
```

---

### Task 2: Rename `defenderMelee` → `defenderArmor` (refactor)

**Files:**
- Modify: `src/lib/types.ts` (`CalculateMeleeFn` `:322`), `src/lib/rules/community_star_system.ts` (`:233`), `src/lib/rules/tehnolog.ts` (`:48`), `src/lib/game-logic.ts` (`calculateMelee` `:189`, `calculateMeleeWithSurpriseAttack` `:261`)

**Interfaces:**
- Produces: `CalculateMeleeFn = (attackerMelee: number, defenderArmor: number) => MeleeResult`. Both rules' `calculateMelee` and the game-logic helpers use the parameter name `defenderArmor`. No behavioral change — existing positional calls (incl. `useCombatFlow` from Task 1) are unaffected.

This is a pure rename for clarity (the parameter holds armor since Task 1). No new test needed — type-check + the full unit suite staying green is the gate.

- [ ] **Step 1: Rename in the type**

In `src/lib/types.ts`, find:

```ts
export type CalculateMeleeFn = (attackerMelee: number, defenderMelee: number) => MeleeResult;
```

Replace with:

```ts
export type CalculateMeleeFn = (attackerMelee: number, defenderArmor: number) => MeleeResult;
```

- [ ] **Step 2: Rename in community rules**

In `src/lib/rules/community_star_system.ts`, find:

```ts
  calculateMelee: (attackerMelee: number, defenderMelee: number): MeleeResult => {
    const aRoll = rollDie(6);
    const dRoll = rollDie(6);
    const aTotal = aRoll + attackerMelee;
    const dTotal = dRoll + defenderMelee;
```

Replace with:

```ts
  calculateMelee: (attackerMelee: number, defenderArmor: number): MeleeResult => {
    const aRoll = rollDie(6);
    const dRoll = rollDie(6);
    const aTotal = aRoll + attackerMelee;
    const dTotal = dRoll + defenderArmor;
```

- [ ] **Step 3: Rename in tehnolog rules**

In `src/lib/rules/tehnolog.ts`, find:

```ts
  calculateMelee: (attackerMelee: number, defenderMelee: number): MeleeResult => {
    const aRoll = rollDie(6);
    const dRoll = rollDie(6);
    const aTotal = aRoll + attackerMelee;
    const dTotal = dRoll + defenderMelee;
```

Replace with:

```ts
  calculateMelee: (attackerMelee: number, defenderArmor: number): MeleeResult => {
    const aRoll = rollDie(6);
    const dRoll = rollDie(6);
    const aTotal = aRoll + attackerMelee;
    const dTotal = dRoll + defenderArmor;
```

- [ ] **Step 4: Rename in game-logic helpers**

In `src/lib/game-logic.ts`:
- `calculateMelee` (`:189`) — rename its `defenderMelee` parameter to `defenderArmor` and update its body's `defenderMelee` reference(s) to `defenderArmor`.
- `calculateMeleeWithSurpriseAttack` (`:261`) — rename its `defenderMelee` parameter to `defenderArmor` and update its body's `defenderMelee` reference(s) to `defenderArmor`.

(Both are mechanical renames; bodies compute `dRoll + defenderMelee` → `dRoll + defenderArmor`. If the linter/type-checker reports other in-body references to `defenderMelee` in these two functions, rename those too.)

- [ ] **Step 5: Type-check + full unit suite**

Run: `npm run type-check && npm run test`
Expected: type-check clean; ALL unit tests pass (no behavioral change — existing `calculateMelee(4,3)` / `calculateMeleeWithSurpriseAttack(2,2)` tests are positional and unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/rules/community_star_system.ts src/lib/rules/tehnolog.ts src/lib/game-logic.ts
git commit -m "refactor(melee): rename defenderMelee → defenderArmor for clarity (#160)"
```

---

### Task 3: UI — melee uses the «Броня цели» field

**Files:**
- Modify: `src/components/combat/ParameterInputs.tsx` (armor field condition `:350`, remove melee «ББ цели» field `:370-389`, melee preview `:304`)

**Interfaces:** None new. Melee PARAMETERS now show the same «Броня цели» input as shot/grenade (bound to `targetArmor`); the melee stats preview shows the defender as `1D6+${effectiveTargetArmor}`.

This is a UI/interaction-pattern change — verified by the E2E in Task 4 (per CLAUDE.md, changed UI interaction → E2E). No unit test.

- [ ] **Step 1: Show the armor field for melee too**

In `src/components/combat/ParameterInputs.tsx`, find the armor field condition:

```tsx
          {/* Target Armor Input */}
          {(actionType === 'shot' || actionType === 'grenade') && (
            <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-[auto_1fr] sm:gap-2 sm:items-center gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold whitespace-nowrap sm:min-w-[70px]">
                Броня цели
              </label>
```

Replace the condition line only:

```tsx
          {/* Target Armor Input */}
          {(actionType === 'shot' || actionType === 'grenade' || actionType === 'melee') && (
            <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-[auto_1fr] sm:gap-2 sm:items-center gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold whitespace-nowrap sm:min-w-[70px]">
                Броня цели
              </label>
```

- [ ] **Step 2: Remove the melee «ББ цели» field**

Find and delete the entire melee target-melee block:

```tsx
          {/* Target Melee Input (for melee attacks) */}
          {actionType === 'melee' && (
            <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-[auto_1fr] sm:gap-2 sm:items-center gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold whitespace-nowrap sm:min-w-[70px]">
                ББ цели
              </label>
              <NumberStepper
                value={effectiveTargetMelee}
                onChange={(value) => {
                  onChange({ targetMelee: value });
                  onMemoryUpdate?.({ targetMelee: value });
                }}
                min={0}
                max={99}
                step={1}
                size="sm"
                className="flex-1 sm:justify-start"
              />
            </div>
          )}
```

(Delete the whole block above.)

- [ ] **Step 3: Melee preview defender uses armor**

Find the melee stats preview defender line (inside `renderMeleeStats`):

```tsx
              <DiceNotationDisplay rollStr={`1D6+${effectiveTargetMelee}`} color="red" />
```

Replace with:

```tsx
              <DiceNotationDisplay rollStr={`1D6+${effectiveTargetArmor}`} color="red" />
```

- [ ] **Step 4: Type-check + combat unit tests**

Run: `npm run type-check && npm run test -- --testPathPattern=combat`
Expected: type-check clean (if `effectiveTargetMelee` becomes unused, that is fine — it is still referenced by the `effectiveTargetMelee` const definition; do not remove the const unless type-check flags it); combat unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/combat/ParameterInputs.tsx
git commit -m "feat(melee-ui): defender input is «Броня цели», preview uses armor (#160)"
```

---

### Task 4: E2E — melee shows armor field and resolves

**Files:**
- Create: `e2e/melee-defender-armor.spec.ts`

**Interfaces:**
- Consumes: `setupGameSessionWithSquad`, `expandFirstUnit`/open-combat pattern from `combat.spec.ts`; button labels `БЛИЖНИЙ БОЙ` (select) and `АТАКОВАТЬ` (execute); the «Броня цели» label.
- Produces: integration proof that melee collects the defender's armor and resolves (validates Tasks 1 + 3).

Note: the D6 melee rolls are random, so the E2E asserts the UI flow (armor field present, «ББ цели» absent, results render) — not a specific winner.

- [ ] **Step 1: Write the spec**

Create `e2e/melee-defender-armor.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * #160 — melee defender uses armor (Бр): the parameters show «Броня цели»
 * (not «ББ цели»), and the melee resolves.
 */
test.describe('Melee defender armor (#160)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('melee shows «Броня цели» and resolves', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'melee-armor-unit-1' },
    });

    // Open combat modal (same path as combat.spec.ts)
    const unitCard = page.getByTestId('unit-nav-melee-armor-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);

    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(500);

    // Select melee (БЛИЖНИЙ БОЙ)
    const meleeButton = page.getByRole('button', { name: /ближний бой|бб/i });
    await expect(meleeButton).toBeVisible({ timeout: 3000 });
    await meleeButton.click();
    await page.waitForTimeout(300);

    // Parameters: «Броня цели» present, «ББ цели» absent
    await expect(page.getByText('Броня цели')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('ББ цели')).toHaveCount(0);

    // Execute (АТАКОВАТЬ) → results render
    const attackButton = page.getByRole('button', { name: /атаковать/i });
    await expect(attackButton).toBeVisible({ timeout: 3000 });
    await attackButton.click();
    await page.waitForTimeout(500);

    // Results: melee result label present (Победа/Контратака/Ничья)
    const meleeOutcome = page.locator('text=/(Победа|Контратака|Ничья)/');
    await expect(meleeOutcome.first()).toBeVisible({ timeout: 3000 });
  });
});
```

- [ ] **Step 2: Run the spec (expect PASS now that Tasks 1 + 3 are in)**

Run: `npx playwright test e2e/melee-defender-armor.spec.ts --project=chromium`
Expected: PASS. (Before Task 3, «ББ цели» would be present and «Броня цели» absent for melee → the label assertions would fail.)

- [ ] **Step 3: Commit**

```bash
git add e2e/melee-defender-armor.spec.ts
git commit -m "test(e2e): melee defender uses «Броня цели» (#160)"
```

---

### Task 5: Full validation

**Files:** none (verification only)

- [ ] **Step 1: Type-check + lint + unit**

Run: `npm run validate`
Expected: PASS (type-check clean; unit all green, incl. the updated melee test; lint no NEW warnings in touched files).

- [ ] **Step 2: Full E2E suite (regression)**

Run: `npm run test:e2e`
Expected: all specs PASS, incl. new `melee-defender-armor.spec.ts` and existing `combat.spec.ts` (shot/melee regression).

- [ ] **Step 3: Record green verification**

If Steps 1–2 surfaced fixups, commit them. Otherwise this task records green verification (no commit needed).
