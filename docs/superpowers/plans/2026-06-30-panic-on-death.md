# Panic on any soldier death (incl. pilot) (#166) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the panic test trigger whenever a squad's `deadSoldiers` grows past the 50% threshold (community rules, once per game) — regardless of WHICH path caused the death. Currently only the manual-kill path triggers it; the pilot-death path (`UnitCard.handlePanicSurvivalTest`) marks a soldier dead without any panic check.

**Architecture:** Centralize the trigger in `UnitCard` via a `useEffect` that watches `unit.deadSoldiers` growth and opens the panic modal via `checkPanicTrigger`. Remove the now-redundant point trigger from `SoldierCard.handleToggleDead` (and its prop chain through `SquadView`). This covers all death paths (manual kill, pilot death, future) and removes the `setState`-inside-`updateUnit`-updater smell.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind, Jest (unit), Playwright (E2E).

## Global Constraints

- **Mobile-first**; UI copy Russian; code/identifiers English.
- `src/lib/panic-logic.ts` is NOT changed — `checkPanicTrigger` is correct (no `done` gate; `deadCount ≥ half && !panicTestUsed`).
- Panic auto-trigger is **community rules only** (`rulesVersion === 'community_star_system'`); tehnolog has no auto-panic by design. Once-per-game (`panicTestUsed`) is preserved.
- The effect must NOT trigger on mount (pre-existing deaths), on revive (undo kill, `deadCount` shrinks), when the modal is already open, or for machines.
- `UnitCard` already imports `useRef`, `useEffect`, `useCallback` from `react` (line 3) — no new React import needed. It does NOT yet import `checkPanicTrigger`.
- Removing the point trigger makes `checkPanicTrigger`, `rulesVersion`, `setShowPanicModal`, `isAddingKill`, `dead`, and `RulesVersionID` unused in `SoldierCard` (and `rulesVersion`/`setShowPanicModal`/`RulesVersionID` in `SquadView`) — all must be removed (lint-clean). `UnitCard` KEEPS `rulesVersion` (used elsewhere: `usePerWeaponAmmo`, modal) and `setShowPanicModal` (owns the state) — it only stops PASSING them to `SquadView`.
- TDD. `npm run validate` (type-check + lint + unit) + `npm run test:e2e` separately.
- **Commit after every task.** Branch `fix/166-panic-done-squad` already exists and is current — stay on it.

**Spec:** `docs/superpowers/specs/2026-06-30-panic-on-death-design.md`

---

### Task 1: Centralize panic trigger in `UnitCard` + remove the point trigger from `SoldierCard`

**Files:**
- Modify: `src/components/cards/UnitCard.tsx` (add `checkPanicTrigger` import + the `useEffect`/`useRef`; stop passing `rulesVersion`/`setShowPanicModal` to `SquadView`)
- Modify: `src/components/cards/SoldierCard.tsx` (remove the trigger block from `handleToggleDead`; remove now-unused import + props)
- Modify: `src/components/cards/unit-card/SquadView.tsx` (remove now-unused `rulesVersion`/`setShowPanicModal` props + their pass-through)

**Interfaces:**
- Produces: `UnitCard` owns the panic-on-death trigger (`useEffect` on `deadSoldiers` growth → `checkPanicTrigger` → `setShowPanicModal(true)`). `SoldierCard.handleToggleDead` only updates `deadSoldiers`. `SquadView` no longer threads `rulesVersion`/`setShowPanicModal` to `SoldierCard`.

- [ ] **Step 1: Add the centralized trigger to `UnitCard`**

In `src/components/cards/UnitCard.tsx`:
- Add the import with the other `panic-logic`/lib imports: `import { checkPanicTrigger } from '@/lib/panic-logic';`
- After the `isAllDead` / `isMachineDone` computations (around line 164, where `isSquad`, `unit`, `rulesVersion`, `showPanicModal` are all in scope), add:

```ts
  // Centralized panic-on-death trigger (#166): when this squad's deadSoldiers grows past the
  // threshold (community rules, once per game), open the panic modal. Covers ALL death paths
  // (manual kill, pilot death) — the squad's own UnitCard detects the loss.
  const prevDeadCountRef = useRef<number>(unit.deadSoldiers?.length ?? 0);
  useEffect(() => {
    if (!isSquad || rulesVersion !== 'community_star_system') return;
    const currentDead = unit.deadSoldiers?.length ?? 0;
    if (currentDead > prevDeadCountRef.current) {
      if (!showPanicModal && checkPanicTrigger(unit, rulesVersion)) {
        setShowPanicModal(true);
      }
    }
    prevDeadCountRef.current = currentDead;
  }, [unit, unit.deadSoldiers, rulesVersion, isSquad, showPanicModal]);
```

- [ ] **Step 2: Stop passing `rulesVersion`/`setShowPanicModal` from `UnitCard` to `SquadView`**

In `src/components/cards/UnitCard.tsx`, find the `<SquadView ... />` usage (around line 645-648) that passes `setShowPanicModal={setShowPanicModal}` and `rulesVersion={rulesVersion}`. Remove those two props from the `<SquadView>` element. (Leave the rest of the `<SquadView>` props intact.)

- [ ] **Step 3: Simplify `SoldierCard.handleToggleDead` + drop unused props/import**

In `src/components/cards/SoldierCard.tsx`:

(a) Remove the import: `import { checkPanicTrigger } from '@/lib/panic-logic';` (line ~10).

(b) Replace the whole `handleToggleDead` function (lines ~164-186) with the simplified version (only updates `deadSoldiers`):

```tsx
  const handleToggleDead = () => {
    updateUnit(unit.instanceId, (currentUnit: ArmyUnit) => {
      const currentDead = currentUnit.deadSoldiers || [];
      const newDead = currentDead.includes(soldierIndex)
        ? currentDead.filter(i => i !== soldierIndex)
        : [...currentDead, soldierIndex];
      return { ...currentUnit, deadSoldiers: newDead };
    });
  };
```

(This removes `dead`, `isAddingKill`, and the `if (isAddingKill && rulesVersion === 'community_star_system') { ... setShowPanicModal(true) }` block.)

(c) Remove the now-unused props from `SoldierCardProps`: `rulesVersion: RulesVersionID;` (~line 19) and `setShowPanicModal: (show: boolean) => void;` (~line 23). And remove them from the destructure (~lines 40, 44).

(d) If `RulesVersionID` becomes unused in `SoldierCard.tsx` (it was only for the `rulesVersion` prop type), remove its import too. Run lint to confirm no unused identifiers remain.

- [ ] **Step 4: Drop the now-unused props from `SquadView`**

In `src/components/cards/unit-card/SquadView.tsx`:
- Remove from the props interface: `setShowPanicModal: (show: boolean) => void;` (~line 9) and `rulesVersion: RulesVersionID;` (~line 10).
- Remove from the destructure: `setShowPanicModal,` (~line 28) and `rulesVersion,` (~line 29).
- Remove the pass-through to `<SoldierCard>`: `rulesVersion={rulesVersion}` (~line 53) and `setShowPanicModal={setShowPanicModal}` (~line 57).
- If `RulesVersionID` becomes unused, remove its import.

- [ ] **Step 5: Type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: clean — no unused imports/vars/props; `SquadView` no longer receives `rulesVersion`/`setShowPanicModal` (and `UnitCard` no longer passes them); no remaining reference to `checkPanicTrigger` in `SoldierCard`.

- [ ] **Step 6: Run existing unit tests**

Run: `npm run test`
Expected: ALL pass (no behavioral change to pure logic; the panic-logic tests are untouched).

- [ ] **Step 7: Commit**

```bash
git add src/components/cards/UnitCard.tsx src/components/cards/SoldierCard.tsx src/components/cards/unit-card/SquadView.tsx
git commit -m "fix(panic): #166 — centralize panic-on-death trigger in UnitCard (covers pilot-death path)"
```

---

### Task 2: E2E regression (manual kill → panic via the new trigger) + full validation

**Files:**
- Create: `e2e/panic-on-death.spec.ts`

**Interfaces:**
- Consumes: `setupGameSessionWithSquad`, `expandFirstUnit`, `clearStorage` from `e2e/helpers/setup`; the kill button `data-testid="soldier-kill-button"[data-soldier-index=N]`; the panic modal `data-testid="panic-modal-title"`; the `bronepehota_rules_version`/`bronepehota_panic_enabled` localStorage keys.
- Produces: integration proof that killing a soldier to cross the 50% threshold opens the panic modal via the NEW centralized `UnitCard` effect (for both done and not-done squads, community rules).

Note: the pilot-death path now flows through the SAME `UnitCard` effect (it updates `deadSoldiers`), so this regression test exercises the centralized mechanism. A dedicated pilot-death E2E requires machine + pilot + survival-test setup (out of scope here; the regression + code review cover it). D6 rolls are irrelevant — the trigger is threshold-based, deterministic.

- [ ] **Step 1: Write the spec**

Create `e2e/panic-on-death.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * #166 — panic triggers when a squad's losses cross 50% via the centralized UnitCard effect.
 * Covers the manual-kill path (the pilot-death path shares the same mechanism).
 * 6-soldier squad → threshold = floor(6/2) = 3. Seed 2 dead → killing 1 more crosses it.
 */
test.describe('Panic on death (#166)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  // Register AFTER setupGameSessionWithSquad so on reload this runs AFTER the helper's
  // localStorage.clear() (addInitScripts run in registration order) — keeps the gate values.
  async function enableCommunityPanic(page: Page) {
    await page.addInitScript(() => {
      localStorage.setItem('bronepehota_rules_version', 'community_star_system');
      localStorage.setItem('bronepehota_panic_enabled', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });
    await expandFirstUnit(page);
  }

  test('NOT-done squad: kill to threshold → panic modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'panic-a', deadSoldiers: [0, 1] },
    });
    await expandFirstUnit(page);
    await enableCommunityPanic(page);

    await page.locator('[data-testid="soldier-kill-button"][data-soldier-index="2"]').click({ force: true });
    await expect(page.getByTestId('panic-modal-title')).toBeVisible({ timeout: 3000 });
  });

  test('DONE squad: kill to threshold → panic modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: {
        instanceId: 'panic-b',
        deadSoldiers: [0, 1],
        actionsUsed: [0, 1, 2, 3, 4, 5].map(() => ({ moved: false, shot: false, melee: false, done: true })),
      },
    });
    await expandFirstUnit(page);
    await enableCommunityPanic(page);

    await page.locator('[data-testid="soldier-kill-button"][data-soldier-index="2"]').click({ force: true });
    await expect(page.getByTestId('panic-modal-title')).toBeVisible({ timeout: 3000 });
  });

  test('below threshold: no panic modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'panic-c', deadSoldiers: [0] }, // 1 dead < threshold 3
    });
    await expandFirstUnit(page);
    await enableCommunityPanic(page);

    await page.locator('[data-testid="soldier-kill-button"][data-soldier-index="1"]').click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.getByTestId('panic-modal-title')).toHaveCount(0); // 2 dead, still < 3
  });
});
```

(If the kill-button long-press mechanic interferes with a plain click, use `.click({ force: true })` as shown — it worked in the investigation repro. The `enableCommunityPanic` order trick is required because the helper's `addInitScript` calls `localStorage.clear()`.)

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test e2e/panic-on-death.spec.ts --project=chromium`
Expected: 3/3 PASS. (The "DONE squad" test is the #166 scenario; "below threshold" guards against false triggers.)

- [ ] **Step 3: Full validation**

Run: `npm run validate`
Expected: type-check clean; lint clean; unit tests all green.

Run: `npm run test:e2e`
Expected: all specs PASS, incl. new `panic-on-death.spec.ts` AND regression (`panic-kill.spec.ts`, `combat.spec.ts`, etc.).

- [ ] **Step 4: Record green verification**

If Steps 2–3 surfaced fixups, commit them. Otherwise this task records green verification (no commit needed).
