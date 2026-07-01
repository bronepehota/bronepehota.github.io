# Defender pilot test on damage (#163) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The pilot armor/survival test (D12 vs machine durability → D6 vs pilot armor) must apply to the DEFENDER (the machine being damaged), not the attacker. Currently it runs in `executeShot` testing the ATTACKER (bug). Fix: remove that block; on the machine card, a full-width amber alert bar appears after damage (a `pilotTestUrgent` flag), and the player taps it once → one test (once-per-shot guarantee).

**Architecture:** Three changes. **(1) Remove** the pilot-test block from `useCombatFlow.executeShot` (tests the attacker; nothing consumes its result). **(2) Wire `pilotTestUrgent`** in `UnitCard` (state + `useEffect` on `currentDurability` decrease → true; reset in `handlePilotSurvivalTest`), threaded via `MachineView` to `TacticalDashboard`. **(3) Replace** the tiny corner Skull button in `TacticalDashboard` with a full-width amber alert bar (idle hidden / urgent pulse / running spinner / result ✓✗).

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind, Jest (unit), Playwright (E2E).

## Global Constraints

- **Mobile-first**; UI copy Russian; code/identifiers English. Reuse `cn()`/Lucide. Amber = urgent/damage accent.
- **Once-per-shot guarantee**: the test is MANUAL (player taps the alert bar once after applying the shot's damage). No auto-fire on durability-decrease (which would multi-fire). 3 damage = 1 tap = 1 test.
- `pilotTestUrgent` is **machine-local** state in `UnitCard`: set true only on `currentDurability` DECREASE (damage); reset on test tap; not on mount/repair/no-pilot.
- The pilot-test flow (`handlePilotSurvivalTest` → `usePilotTestFlow`) already does D12+D6 correctly with the machine's own data (`currentDurability` as armor, `pilotInfo.pilotArmor` as pilot armor) — reuse it unchanged.
- `executeShot`'s damage/hit/surprise logic is otherwise unchanged. `CombatResults` does NOT display the removed `pilotDied`/`armorTestRoll` (verified) — safe to delete.
- The manual corner Skull button in `TacticalDashboard` is REPLACED by the alert bar (the `data-testid="pilot-survival-test-button"` stays on the new bar).
- TDD. `npm run validate` + `npm run test:e2e` separately.
- **Commit after every task.** Branch `fix/163-defender-armor-test` already exists and is current — stay on it.

**Spec:** `docs/superpowers/specs/2026-07-01-defender-pilot-test-design.md`

---

### Task 1: Remove `executeShot` pilot block + wire `pilotTestUrgent` (UnitCard → MachineView)

**Files:**
- Modify: `src/hooks/useCombatFlow.ts` (delete the pilot-test block in `executeShot` ~`:332-360`)
- Modify: `src/components/cards/UnitCard.tsx` (`pilotTestUrgent` state + `prevDurabilityRef` + `useEffect`; reset in `handlePilotSurvivalTest`; pass prop to `<MachineView>`)
- Modify: `src/components/cards/unit-card/MachineView.tsx` (add `pilotTestUrgent` prop; pass to `<TacticalDashboard>`)

**Interfaces:**
- Produces: no pilot test in `executeShot`; `UnitCard` has `pilotTestUrgent` (true when the machine's `currentDurability` decreased since last test); `MachineView`/`TacticalDashboard` receive `pilotTestUrgent: boolean`.

- [ ] **Step 1: Delete the pilot-test block in `executeShot`**

In `src/hooks/useCombatFlow.ts`, delete the entire block:
```ts
      // Armor Test and Pilot Survival Test for machines with pilots
      if (isMachine(state.unit) && damageResult.damage > 0) {
        const machine = state.unit;
        if (machine.pilotInfo && machine.pilotInfo.alive) {
          // Machine armor = current durability (where marker is on damage scale)
          const currentDurability = machine.currentDurability || machine.data.durability_max;
          const machineArmor = currentDurability;

          // ARMOR TEST (Тест брони)
          const armorTestRoll = rollDie(12);

          // Animate armor test roll
          await animateDiceRoll();

          // Armor test: roll > machine armor means armor is penetrated
          if (armorTestRoll > machineArmor) {
            // Armor failed - run PILOT SURVIVAL TEST
            const survivalTestRoll = rollDie(6);
            const pilotArmor = machine.pilotInfo.pilotArmor;

            // Critical hit: roll of 6 always kills pilot
            // Otherwise, pilot dies if roll > pilot armor
            const pilotDied = survivalTestRoll === 6 || survivalTestRoll > pilotArmor;

            damageResult.pilotDied = pilotDied;
            damageResult.armorTestRoll = armorTestRoll;
            damageResult.survivalTestRoll = survivalTestRoll;
          } else {
            // Armor held - pilot survives
            damageResult.armorTestRoll = armorTestRoll;
          }
        }
      }
```
(Leave the surrounding `finalDisplay.power = damageResult.rolls;` and the closing braces of `if (hitResult.success)` intact. If `isMachine` becomes unused in the file, leave the import — it's used elsewhere. `rollDie` stays used elsewhere.)

- [ ] **Step 2: Add `pilotTestUrgent` state + effect in `UnitCard`**

In `src/components/cards/UnitCard.tsx`:
- Ensure `useRef` and `useEffect` are imported from `'react'` (the file already uses `useEffect`; add `useRef` if missing).
- Near the other state (e.g., by `const [showPanicModal, ...]` / `pilotTestFlow`), add:
```ts
  // #163: machine took damage → pilot test is urgent (alert bar). Reset on test run.
  const prevDurabilityRef = useRef<number>(unit.currentDurability ?? (isMachine(unit) ? (unit.data as Machine).durability_max : 0));
  const [pilotTestUrgent, setPilotTestUrgent] = useState(false);
  useEffect(() => {
    if (!isMachine(unit)) return;
    const current = unit.currentDurability ?? 0;
    if (current < prevDurabilityRef.current) {
      setPilotTestUrgent(true);
    }
    prevDurabilityRef.current = current;
  }, [unit.currentDurability, unit]);
```
(Adjust the `isMachine`/`Machine` imports if not present — `isMachine` is already imported; `Machine` type is already imported.)

- In `handlePilotSurvivalTest` (the function body, right after the early `return` guard / at the start of the actual work), add `setPilotTestUrgent(false);` so tapping the test clears the urgent flag:
```ts
  const handlePilotSurvivalTest = () => {
    if (!unit.pilotInfo || !unit.pilotInfo.alive) return;
    setPilotTestUrgent(false);
    // ...existing body (machineArmor, pilotArmor, pilotTestFlow.startTest...)
```

- [ ] **Step 3: Pass `pilotTestUrgent` to `<MachineView>` and onward**

In `UnitCard.tsx`, find the `<MachineView ... />` render and add the prop:
```tsx
          pilotTestUrgent={pilotTestUrgent}
```
(alongside the existing `onPilotSurvivalTest={handlePilotSurvivalTest}`, `isPilotTestRunning={pilotTestFlow.isOpen}`, etc.)

In `src/components/cards/unit-card/MachineView.tsx`:
- Add to `MachineViewProps`: `pilotTestUrgent: boolean;`
- Destructure it.
- Pass to `<TacticalDashboard>`: `pilotTestUrgent={pilotTestUrgent}`.

- [ ] **Step 4: Add `pilotTestUrgent` to `TacticalDashboardProps` (prop only; UI in Task 2)**

In `src/components/cards/unit-card/machine-view/TacticalDashboard.tsx`:
- Add to `TacticalDashboardProps`: `pilotTestUrgent: boolean;`
- Destructure it.
- (Do NOT change the button UI yet — that's Task 2. Just accept the prop so type-check passes.)

- [ ] **Step 5: Type-check + lint + unit tests**

Run: `npm run type-check && npm run lint` → clean.
Run: `npm run test` → all unit green (the removed executeShot block had no unit test asserting it; existing combat tests unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCombatFlow.ts src/components/cards/UnitCard.tsx src/components/cards/unit-card/MachineView.tsx src/components/cards/unit-card/machine-view/TacticalDashboard.tsx
git commit -m "fix(pilot): #163 — remove attacker pilot test from executeShot; wire pilotTestUrgent on machine damage"
```

---

### Task 2: TacticalDashboard — full-width amber alert bar (replaces corner Skull)

**Files:**
- Modify: `src/components/cards/unit-card/machine-view/TacticalDashboard.tsx` (delete corner Skull button `:249-273`; add alert bar)

**Interfaces:** Consumes `pilotTestUrgent`, `isPilotTestRunning`, `survivalTest`, `onSurvivalTest`. Produces a full-width bar: hidden when idle; amber+pulse when urgent; spinner when running; ✓выжил/✗погиб result.

- [ ] **Step 1: Delete the corner Skull button**

Delete the block `{/* Survival Test Button - Overlay ... */}` (the `<button ... onSurvivalTest ... Skull ... />` with `data-testid="pilot-survival-test-button"`, ~`:249-273`).

- [ ] **Step 2: Add the full-width alert bar**

At the end of the TacticalDashboard's root container (after the LEFT/RIGHT columns, as a full-width element — find the closing of the main flex row and place the bar after it, still inside the outer container), add:

```tsx
        {/* Pilot test alert bar — #163: prominent after damage (full-width) */}
        {pilotInfo && pilotInfo.alive && (pilotTestUrgent || isPilotTestRunning || survivalTest) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSurvivalTest(); }}
            disabled={isPilotTestRunning}
            data-testid="pilot-survival-test-button"
            className={cn(
              "mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-sm border text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all touch-manipulation",
              isPilotTestRunning
                ? "bg-purple-950/50 border-purple-700/50 text-purple-300"
                : pilotTestUrgent
                  ? "bg-amber-950/50 border-amber-500/60 text-amber-200 animate-pulse shadow-[0_0_12px_-3px_rgba(245,158,11,0.6)]"
                  : survivalTest
                    ? survivalTest.survived
                      ? "bg-green-950/40 border-green-700/50 text-green-300"
                      : "bg-red-950/40 border-red-700/50 text-red-300"
                    : "bg-slate-800/40 border-slate-700/50 text-slate-400"
            )}
          >
            {isPilotTestRunning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Тест пилота…</>
            ) : pilotTestUrgent ? (
              <><AlertTriangle className="w-3.5 h-3.5" /> Тест пилота · получен урон</>
            ) : survivalTest ? (
              survivalTest.survived
                ? <><Check className="w-3.5 h-3.5" /> Пилот выжил</>
                : <><Skull className="w-3.5 h-3.5" /> Пилот погиб</>
            ) : null}
          </button>
        )}
```

- Add the icon imports at the top: `AlertTriangle`, `Check`, `Loader2` to the existing `lucide-react` import (`Skull` is already imported).

- [ ] **Step 3: Type-check + lint**

Run: `npm run type-check && npm run lint` → clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/cards/unit-card/machine-view/TacticalDashboard.tsx
git commit -m "feat(machine-ui): #163 — full-width amber pilot-test alert bar (replaces corner skull)"
```

---

### Task 3: E2E + full validation

**Files:**
- Create: `e2e/defender-pilot-test.spec.ts`

**Interfaces:**
- Consumes: a game session with a machine + assigned alive pilot; the durability "Урон" button (`onUpdateDurability(-1)`); the alert bar `data-testid="pilot-survival-test-button"`.
- Produces: integration proof — damaging a machine (reduce durability) → alert bar appears (amber) → tap → pilot test runs; AND a shot no longer tests the attacker.

- [ ] **Step 1: Write the spec**

Create `e2e/defender-pilot-test.spec.ts`. Use `setupGameSessionWithMachine` (or a squad+machine via `extraUnits`) with a machine that has an alive `pilotInfo`. Mirror `e2e/combat.spec.ts` / `e2e/panic-on-death.spec.ts` for the session setup. Test:

```ts
import { test, expect } from '@playwright/test';
import { setupGameSessionWithMachine, expandFirstUnit, clearStorage } from './helpers/setup';

// #163 — damaging a machine (reducing durability) makes the pilot-test alert bar appear;
// tapping it runs the D12/D6 test. executeShot no longer tests the attacker.
test.describe('Defender pilot test (#163)', () => {
  test.beforeEach(async ({ page }) => { await clearStorage(page); });

  test('damage machine → pilot-test alert bar → tap → test runs', async ({ page }) => {
    await setupGameSessionWithMachine(page); // machine with a pilot (adjust helper to seed pilotInfo if needed)
    await expandFirstUnit(page);

    // Before damage: alert bar hidden
    await expect(page.getByTestId('pilot-survival-test-button')).toHaveCount(0);

    // Apply damage (reduce durability) — find the machine's "Урон" button
    const damageButton = page.getByRole('button', { name: /урон/i }).first();
    await damageButton.click({ force: true });
    await page.waitForTimeout(300);

    // Alert bar appears (urgent)
    const alertBar = page.getByTestId('pilot-survival-test-button');
    await expect(alertBar).toBeVisible({ timeout: 3000 });

    // Tap → test runs (modal/flow opens)
    await alertBar.click();
    await page.waitForTimeout(300);
    // The pilot test flow renders (PilotSurvivalTestModal or result). Assert something test-related is visible.
    // (Adapt to the real pilot-test UI — e.g., a dice/result element.)
  });
});
```

(Adapt to the real setup: if `setupGameSessionWithMachine` doesn't seed a pilot, seed `pilotInfo` via `unitOverrides` or `extraUnits`. Mirror `e2e/panic-kill.spec.ts` for the machine+pilot seeding. The key assertions: (1) bar hidden before damage, (2) bar visible (amber) after damage, (3) tap → test flow. Also confirm a normal shot (combat.spec flow) no longer triggers an attacker pilot test — the combat shot E2E staying green covers that.)

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test e2e/defender-pilot-test.spec.ts --project=chromium`
Expected: PASS. Adapt selectors/seed to the real UI.

- [ ] **Step 3: Full validation**

Run: `npm run validate` → type-check + lint clean; unit green.
Run: `npm run test:e2e` → all specs PASS, incl. new + regression (`combat.spec.ts` confirms executeShot no longer tests attacker; `vehicle-zone-damage`, etc.).

- [ ] **Step 4: Record green verification**

If Steps 2–3 surfaced fixups, commit them. Otherwise records green verification (no commit needed — but commit the new spec file).
