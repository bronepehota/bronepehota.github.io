# Grenade Target List Scroll (#165) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the grenade blast-check target list being clipped (~3 visible, no scroll) and make multi-target grenade checks fully usable on mobile — scrollable list, sticky «arming panel» with live hit tally, newest-check auto-scroll, and frontend-design polish.

**Architecture:** Root cause is a flexbox bug — the modal's scroll container (`flex-1 overflow-y-auto`) sits in a `max-h-[90vh] overflow-hidden flex flex-col` parent without `min-h-0`, so it never shrinks to trigger overflow scrolling; the overflow is clipped instead. Fix = one `min-h-0` class. On top, restructure the grenade RESULTS in `CombatResults.tsx`: per-check testid + «ЦЕЛЬ N» label, sticky input section with live tally, `useRef`/`useEffect` auto-scroll, and polish (empty-state, danger tint, haptic feedback, density). The reducer/hook logic is unchanged — `grenadeBlastChecks[]` already accumulates without limit.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Jest + React Testing Library (unit), Playwright (E2E).

## Global Constraints

- **Mobile-first**; touch targets ≥ 44×44px. All UI copy in Russian; code/identifiers in English.
- Dark theme (slate-900 base), `font-mono` for tech/combat UI. Reuse `cn()` from `@/lib/utils` and Lucide icons — no new fonts/palette.
- Follow existing patterns exactly. **Do not break existing tests.** E2E selector priority: `getByTestId` > `getByRole` > `getByText`.
- `npm run validate` = type-check + lint + unit (NO E2E). Run `npm run test:e2e` separately.
- **Commit after every task.** Branch `fix/165-grenade-targets-scroll` already exists — stay on it.
- jsdom (unit tests) does NOT compute flex layout/overflow, so the `min-h-0` fix and scroll behavior are validated by the E2E (Task 6), not unit tests. Auto-scroll (`scrollIntoView`) is a no-op in jsdom and likewise E2E-validated.

**Spec:** `docs/superpowers/specs/2026-06-30-grenade-targets-scroll-design.md`

---

### Task 1: Per-check structure — testid, «ЦЕЛЬ N» label, newest highlight

**Files:**
- Modify: `src/components/combat/CombatResults.tsx` (grenade checks map, ~`:392–470`)
- Test: `src/__tests__/components/combat/CombatResults.test.tsx`

**Interfaces:**
- Produces: per-check element with `data-testid="grenade-blast-check"` (singular); the last check carries `ref={lastCheckRef}` (defined in Task 3 — for now use a local `null` ref placeholder is NOT needed; the ref is added in Task 3). This task only adds testid + label + ring class.

- [ ] **Step 1: Write the failing tests**

Append to the `describe('Grenade blast checks', ...)` block in `src/__tests__/components/combat/CombatResults.test.tsx`:

```tsx
    it('should render a "ЦЕЛЬ N" label and testid for each blast check', () => {
      const resultWithChecks: CombatResult = {
        ...mockGrenadeResult,
        grenadeBlastChecks: [
          { armor: 2, roll: 15, hit: true },
          { armor: 3, roll: 8, hit: false },
          { armor: 2, roll: 20, hit: true },
        ],
      };

      render(<CombatResults {...defaultProps} result={resultWithChecks} />);

      const checks = screen.getAllByTestId('grenade-blast-check');
      expect(checks).toHaveLength(3);

      expect(screen.getByText('ЦЕЛЬ 1')).toBeInTheDocument();
      expect(screen.getByText('ЦЕЛЬ 2')).toBeInTheDocument();
      expect(screen.getByText('ЦЕЛЬ 3')).toBeInTheDocument();
    });

    it('should highlight only the newest (last) blast check with a ring', () => {
      const resultWithChecks: CombatResult = {
        ...mockGrenadeResult,
        grenadeBlastChecks: [
          { armor: 2, roll: 15, hit: true },
          { armor: 3, roll: 8, hit: false },
        ],
      };

      render(<CombatResults {...defaultProps} result={resultWithChecks} />);

      const checks = screen.getAllByTestId('grenade-blast-check');
      expect(checks[1]).toHaveClass('ring-2');
      expect(checks[0]).not.toHaveClass('ring-2');
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/__tests__/components/combat/CombatResults.test.tsx -t "ЦЕЛЬ N"`
Expected: FAIL — no element with `data-testid="grenade-blast-check"`, no text «ЦЕЛЬ N».

- [ ] **Step 3: Implement — restructure the per-check map**

In `src/components/combat/CombatResults.tsx`, replace the grenade checks map opening. Find this exact block (the `grenade-blast-checks` container and the first child `<div key={idx} ...>`):

```jsx
          {result.grenadeBlastChecks && result.grenadeBlastChecks.length > 0 && (
            <div data-testid="grenade-blast-checks" className="space-y-3">
              {result.grenadeBlastChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="space-y-3"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
```

Replace with (converts the arrow to a block body, adds testid + newest ring; the `lastCheckRef` is added in Task 3 so we reference `undefined` for now — a no-op):

```jsx
          {result.grenadeBlastChecks && result.grenadeBlastChecks.length > 0 && (
            <div data-testid="grenade-blast-checks" className="space-y-3">
              {result.grenadeBlastChecks.map((check, idx) => {
                const isLast = idx === result.grenadeBlastChecks!.length - 1;
                return (
                <div
                  key={idx}
                  data-testid="grenade-blast-check"
                  className={cn(
                    "space-y-3 rounded-lg",
                    isLast && "ring-2 ring-emerald-400/50 ring-offset-0"
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Per-target label */}
                  <div className="flex items-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400/80 bg-emerald-950/40 border border-emerald-700/40 rounded px-1.5 py-0.5">
                      ЦЕЛЬ {idx + 1}
                    </span>
                  </div>
```

Then the existing grid + result-label markup that followed stays unchanged, BUT the closing of the map item must now close the block body. Find the existing closing of one check item:

```jsx
                  {/* Result Label */}
                  <div className="flex justify-center">
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-black uppercase tracking-wider animate-pop-in",
                      check.hit
                        ? "bg-orange-950/80 border-orange-500/50 text-orange-400"
                        : "bg-slate-800/80 border-slate-600/50 text-slate-500"
                    )}>
                      {check.hit ? (
                        <>
                          <Skull className="w-4 h-4 inline mr-1" />
                          ПРОБИТО {check.roll}:{check.armor}
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 inline mr-1" />
                          НЕ ПРОБИТО {check.roll}:{check.armor}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
```

Replace its tail (the `</div>\n))}`  that closes the item + arrow) with a block-body close:

```jsx
                  {/* Result Label */}
                  <div className="flex justify-center">
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-black uppercase tracking-wider animate-pop-in",
                      check.hit
                        ? "bg-orange-950/80 border-orange-500/50 text-orange-400"
                        : "bg-slate-800/80 border-slate-600/50 text-slate-500"
                    )}>
                      {check.hit ? (
                        <>
                          <Skull className="w-4 h-4 inline mr-1" />
                          ПРОБИТО {check.roll}:{check.armor}
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 inline mr-1" />
                          НЕ ПРОБИТО {check.roll}:{check.armor}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
```

(The only change at the tail is `))}` → `);\n})}`  — closing the block-body arrow function.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/__tests__/components/combat/CombatResults.test.tsx`
Expected: PASS — all existing tests + the 2 new tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/combat/CombatResults.tsx src/__tests__/components/combat/CombatResults.test.tsx
git commit -m "feat(grenade): per-check testid, ЦЕЛЬ N label, newest-check ring (#165)"
```

---

### Task 2: Sticky «arming panel» + live hit tally

**Files:**
- Modify: `src/components/combat/CombatResults.tsx` (derived state near `:36`; input section `:472–475`)
- Test: `src/__tests__/components/combat/CombatResults.test.tsx`

**Interfaces:**
- Produces: input section (`data-testid="grenade-target-check-section"`) gains `sticky bottom-0` + solid bg + emerald top accent (red when distance roll === 1). New `data-testid="grenade-hit-tally"` span shows `💥 {hits}/{total} пробито`, hidden when no checks.

- [ ] **Step 1: Write the failing tests**

Append to the `describe('Grenade blast checks', ...)` block:

```tsx
    it('should show live hit tally and sticky input section', () => {
      const resultWithChecks: CombatResult = {
        ...mockGrenadeResult,
        grenadeBlastChecks: [
          { armor: 2, roll: 15, hit: true },
          { armor: 3, roll: 8, hit: false },
          { armor: 2, roll: 20, hit: true },
          { armor: 3, roll: 5, hit: false },
          { armor: 2, roll: 18, hit: true },
          { armor: 3, roll: 2, hit: false },
        ],
      };

      render(<CombatResults {...defaultProps} result={resultWithChecks} />);

      const tally = screen.getByTestId('grenade-hit-tally');
      expect(tally).toHaveTextContent('💥 3/6 пробито');

      const section = screen.getByTestId('grenade-target-check-section');
      expect(section).toHaveClass('sticky');
    });

    it('should hide hit tally when there are no checks', () => {
      render(<CombatResults {...defaultProps} />);

      expect(screen.queryByTestId('grenade-hit-tally')).not.toBeInTheDocument();
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/__tests__/components/combat/CombatResults.test.tsx -t "hit tally"`
Expected: FAIL — no `grenade-hit-tally`; section not sticky.

- [ ] **Step 3: Implement — derived state + sticky classes + tally**

3a. Add derived grenade state. Find the line:

```tsx
  const [grenadeTargetArmor, setGrenadeTargetArmor] = useState(2);
```

Replace with:

```tsx
  const [grenadeTargetArmor, setGrenadeTargetArmor] = useState(2);

  // Grenade target-check derived state (Phase 2)
  const grenadeChecks = result.grenadeBlastChecks ?? [];
  const grenadeHits = grenadeChecks.filter((c) => c.hit).length;
  const grenadeTotal = grenadeChecks.length;
  const isGrenadeDanger = isGrenade && (result.hitResult?.roll ?? 0) === 1;
```

3b. Make the input section sticky with a tally. Find:

```jsx
          {/* Grenade Target Check Input Section */}
          {isGrenade && onGrenadeCheckTarget && (
            <div data-testid="grenade-target-check-section" className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-xs opacity-60 uppercase font-bold mb-4 tracking-wider">
                ПРОВЕРИТЬ ЦЕЛЬ В ЗОНЕ ВЗРЫВА
              </div>

              <div className="space-y-4">
```

Replace the opening `<div data-testid="grenade-target-check-section" ...>` and its header with a sticky, accented panel that includes the tally and an empty-state hint:

```jsx
          {/* Grenade Target Check Input Section — sticky arming panel */}
          {isGrenade && onGrenadeCheckTarget && (
            <div
              data-testid="grenade-target-check-section"
              className={cn(
                "sticky bottom-0 z-10 bg-slate-800 p-4 rounded-lg border border-slate-700 border-t-2 shadow-[0_-10px_20px_rgba(0,0,0,0.45)]",
                isGrenadeDanger ? "border-t-red-500 animate-pulse" : "border-t-emerald-600/70"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs opacity-60 uppercase font-bold tracking-wider">
                  ПРОВЕРИТЬ ЦЕЛЬ В ЗОНЕ ВЗРЫВА
                </div>
                {grenadeTotal > 0 ? (
                  <span
                    data-testid="grenade-hit-tally"
                    className={cn(
                      "font-mono font-black text-xs whitespace-nowrap",
                      grenadeHits > 0 ? "text-emerald-400" : "text-slate-500"
                    )}
                  >
                    💥 {grenadeHits}/{grenadeTotal} пробито
                  </span>
                ) : null}
              </div>

              {grenadeTotal === 0 && (
                <div className="text-center text-[11px] text-slate-500 font-mono uppercase tracking-wider mb-3">
                  <Bomb className="inline w-3.5 h-3.5 mr-1 align-middle" />
                  Цели в зоне взрыва не проверены
                </div>
              )}

              <div className="space-y-4">
```

(The rest of the section — armor stepper + ВЗРЫВ button — stays unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/__tests__/components/combat/CombatResults.test.tsx`
Expected: PASS — including new tally/sticky tests AND the pre-existing `should not display blast checks when empty` and `should call onGrenadeCheckTarget when checking target`.

- [ ] **Step 5: Commit**

```bash
git add src/components/combat/CombatResults.tsx src/__tests__/components/combat/CombatResults.test.tsx
git commit -m "feat(grenade): sticky arming panel with live hit tally + empty-state (#165)"
```

---

### Task 3: Auto-scroll newest check into view

**Files:**
- Modify: `src/components/combat/CombatResults.tsx` (imports `:3`; ref on newest check; effect)

**Interfaces:**
- Consumes: the per-check map from Task 1 (newest = last item).
- Produces: when `grenadeTotal` grows, the newest `grenade-blast-check` is scrolled into view above the sticky panel. No new public interface.

Note: `scrollIntoView` is a no-op in jsdom, so this is validated by the E2E (Task 6), not a unit test.

- [ ] **Step 1: Add imports**

Find:

```tsx
import { useState } from 'react';
```

Replace with:

```tsx
import { useState, useEffect, useRef } from 'react';
```

- [ ] **Step 2: Add the ref + effect**

Find the derived-state block added in Task 2:

```tsx
  const isGrenadeDanger = isGrenade && (result.hitResult?.roll ?? 0) === 1;
```

Replace with:

```tsx
  const isGrenadeDanger = isGrenade && (result.hitResult?.roll ?? 0) === 1;

  // Auto-scroll the newest blast check into view above the sticky arming panel
  const lastCheckRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    lastCheckRef.current?.scrollIntoView({ block: 'nearest' });
  }, [grenadeTotal]);
```

- [ ] **Step 3: Attach the ref to the newest check**

In the per-check map (Task 1), find the item opening:

```jsx
                <div
                  key={idx}
                  data-testid="grenade-blast-check"
                  className={cn(
                    "space-y-3 rounded-lg",
                    isLast && "ring-2 ring-emerald-400/50 ring-offset-0"
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
```

Replace with (adds `ref` on the last item):

```jsx
                <div
                  key={idx}
                  ref={isLast ? lastCheckRef : undefined}
                  data-testid="grenade-blast-check"
                  className={cn(
                    "space-y-3 rounded-lg",
                    isLast && "ring-2 ring-emerald-400/50 ring-offset-0"
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
```

- [ ] **Step 4: Type-check + unit tests still pass**

Run: `npm run type-check && npx jest src/__tests__/components/combat/CombatResults.test.tsx`
Expected: type-check clean; all unit tests PASS (the effect is a no-op in jsdom, no regressions).

- [ ] **Step 5: Commit**

```bash
git add src/components/combat/CombatResults.tsx
git commit -m "feat(grenade): auto-scroll newest blast check into view (#165)"
```

---

### Task 4: Polish — haptic feedback + density tuning

**Files:**
- Modify: `src/components/combat/CombatResults.tsx` (ВЗРЫВ `onClick`; per-check grid padding)
- Test: `src/__tests__/components/combat/CombatResults.test.tsx`

**Interfaces:** None new. `navigator.vibrate(30)` is feature-detected (no-op where unsupported, e.g. iOS Safari).

- [ ] **Step 1: Write the failing test for haptic feedback**

Append to the `describe('Grenade blast checks', ...)` block:

```tsx
    it('should vibrate on explode when supported, and still check the target', async () => {
      const vibrateSpy = jest.fn();
      Object.defineProperty(window.navigator, 'vibrate', {
        value: vibrateSpy,
        configurable: true,
      });

      const onGrenadeCheckTarget = jest.fn();
      render(
        <CombatResults
          {...defaultProps}
          onGrenadeCheckTarget={onGrenadeCheckTarget}
        />
      );

      await userEvent.click(screen.getByTestId('grenade-explode-button'));

      expect(vibrateSpy).toHaveBeenCalledWith(30);
      expect(onGrenadeCheckTarget).toHaveBeenCalledWith(2);

      // restore
      Object.defineProperty(window.navigator, 'vibrate', {
        value: undefined,
        configurable: true,
      });
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/components/combat/CombatResults.test.tsx -t "vibrate"`
Expected: FAIL — `vibrateSpy` never called.

- [ ] **Step 3: Implement — haptic feedback on ВЗРЫВ**

Find the ВЗРЫВ button:

```jsx
                <button
                  data-testid="grenade-explode-button"
                  onClick={() => onGrenadeCheckTarget(grenadeTargetArmor)}
```

Replace the `onClick` with a feature-detected vibrate + the existing call:

```jsx
                <button
                  data-testid="grenade-explode-button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                      navigator.vibrate(30);
                    }
                    onGrenadeCheckTarget(grenadeTargetArmor);
                  }}
```

- [ ] **Step 4: Density tuning — tighten the per-check grid cells**

In the per-check grid, find the two cell openings (they mirror the shot card):

```jsx
                    {/* D20 Roll */}
                    <div className={cn(
                      "relative bg-slate-900/80 p-4 rounded-lg border-2",
```

and

```jsx
                    {/* Armor */}
                    <div className="relative bg-slate-900/80 p-4 rounded-lg border-2 border-slate-600/50">
```

Change both `p-4` → `p-3` (two separate edits, same file):

```jsx
                    {/* D20 Roll */}
                    <div className={cn(
                      "relative bg-slate-900/80 p-3 rounded-lg border-2",
```

```jsx
                    {/* Armor */}
                    <div className="relative bg-slate-900/80 p-3 rounded-lg border-2 border-slate-600/50">
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest src/__tests__/components/combat/CombatResults.test.tsx`
Expected: PASS — vibrate test green; all others unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/components/combat/CombatResults.tsx src/__tests__/components/combat/CombatResults.test.tsx
git commit -m "feat(grenade): haptic feedback on explode + denser check cards (#165)"
```

---

### Task 5: Core scroll fix (`min-h-0`) + scroll-fade edge hint

**Files:**
- Modify: `src/components/combat/BottomSheetCombatModal.tsx` (import `:3`, component body, scroll container `:243`)

**Interfaces:** None. The `min-h-0` fix is THE bug fix (overflowing grenade list scrolls instead of being clipped). The scroll-fade is a polish affordance (spec §4.4) — a top-edge gradient that appears when the content is scrolled, signaling "there is more above."

Note: jsdom cannot compute flex overflow or scroll position, so both are validated by the E2E (Task 6) + manual check (Task 7), not unit tests.

- [ ] **Step 1: Add `useState` import**

Find:

```tsx
import { useEffect, useMemo, useRef } from 'react';
```

Replace with:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
```

- [ ] **Step 2: Add scroll-position state**

Find:

```tsx
  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: true,
  });
```

Replace with:

```tsx
  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: true,
  });

  // Track whether the content area is scrolled, to show a top-edge fade hint (#165)
  const [contentScrolled, setContentScrolled] = useState(false);
```

- [ ] **Step 3: Apply the `min-h-0` fix + scroll listener**

Find:

```tsx
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-3">
```

Replace with:

```tsx
        {/* Content - Scrollable */}
        <div
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 md:p-3"
          onScroll={(e) => setContentScrolled(e.currentTarget.scrollTop > 4)}
        >
```

- [ ] **Step 4: Add the scroll-fade overlay as the first child of the scroll container**

Find:

```tsx
          onScroll={(e) => setContentScrolled(e.currentTarget.scrollTop > 4)}
        >
          {state.phase === 'ACTION_SELECT' && (
```

Replace with:

```tsx
          onScroll={(e) => setContentScrolled(e.currentTarget.scrollTop > 4)}
        >
          {contentScrolled && (
            <div
              aria-hidden="true"
              className="sticky top-0 -mt-2 md:-mt-3 h-2 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-[5]"
            />
          )}
          {state.phase === 'ACTION_SELECT' && (
```

- [ ] **Step 5: Type-check + combat unit suite still green**

Run: `npm run type-check && npm run test -- --testPathPattern=combat`
Expected: type-check clean; combat unit tests PASS (no behavior change in jsdom).

- [ ] **Step 6: Commit**

```bash
git add src/components/combat/BottomSheetCombatModal.tsx
git commit -m "fix(combat): min-h-0 scroll fix + scroll-fade edge hint (#165)"
```

---

### Task 6: E2E — grenade on 6+ targets (validates scroll, sticky, labels, auto-scroll)

**Files:**
- Create: `e2e/grenade-targets.spec.ts`

**Interfaces:**
- Consumes: `setupGameSessionWithSquad`, `clearStorage` from `./helpers/setup`; testids `grenade-target-check-section`, `grenade-explode-button`, `grenade-blast-check` (singular); button labels `ГРАНАТА` / `БРОСИТЬ` / `ПРИНЯТЬ`; text `ЦЕЛЬ N`.
- Produces: the integration test that proves Tasks 1–5 work together in a real browser (the `min-h-0` scroll fix, sticky arming panel, auto-scroll).

Assumptions to verify on first run (no existing grenade E2E to copy): the grenade action is reachable via the same «Выберите действие» → action-selector path as shot/melee in `combat.spec.ts`; after selecting ГРАНАТА the PARAMETERS phase shows a `БРОСИТЬ` button. If the grenade action requires selecting a specific soldier first, add that click before the action selector.

- [ ] **Step 1: Write the spec**

Create `e2e/grenade-targets.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * #165 — grenade target list must scroll and keep ВЗРЫВ reachable for many targets.
 */
test.describe('Grenade target list (#165)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('scrolls and keeps ВЗРЫВ reachable for 6+ targets', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'grenade-unit-1' },
    });

    // Open combat modal (same path as shot/melee in combat.spec.ts)
    const unitCard = page.getByTestId('unit-nav-grenade-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);

    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(500);

    // Select grenade
    const grenadeButton = page.getByRole('button', { name: /граната/i });
    await expect(grenadeButton).toBeVisible({ timeout: 3000 });
    await grenadeButton.click();
    await page.waitForTimeout(300);

    // Throw (distance roll) → results phase
    const throwButton = page.getByRole('button', { name: /бросить/i });
    await expect(throwButton).toBeVisible({ timeout: 3000 });
    await throwButton.click();
    await page.waitForTimeout(500);

    // Arming panel visible
    const section = page.getByTestId('grenade-target-check-section');
    await expect(section).toBeVisible({ timeout: 3000 });

    // Add 6 targets; explode button stays reachable after each add
    const explode = page.getByTestId('grenade-explode-button');
    for (let i = 1; i <= 6; i++) {
      await expect(explode).toBeVisible();
      await explode.click();
      await expect(page.getByTestId('grenade-blast-check')).toHaveCount(i);
    }

    // All six checks + labels present
    await expect(page.getByTestId('grenade-blast-check')).toHaveCount(6);
    const target6 = page.getByText('ЦЕЛЬ 6');
    await target6.scrollIntoViewIfNeeded();
    await expect(target6).toBeVisible();

    // ПРИНЯТЬ reachable by scrolling
    const applyButton = page.getByRole('button', { name: /принять/i });
    await applyButton.scrollIntoViewIfNeeded();
    await expect(applyButton).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec (expect PASS now that Tasks 1–5 are in)**

Run: `npx playwright test e2e/grenade-targets.spec.ts --project=chromium`
Expected: PASS. If it fails on reaching the grenade action, adjust per the assumptions note above, then re-run.

- [ ] **Step 3: Commit**

```bash
git add e2e/grenade-targets.spec.ts
git commit -m "test(e2e): grenade target list scrolls, ВЗРЫВ stays reachable for 6+ targets (#165)"
```

---

### Task 7: Full validation

**Files:** none (verification only)

- [ ] **Step 1: Type-check + lint + unit**

Run: `npm run validate`
Expected: PASS (type-check clean, lint clean, all unit tests green).

- [ ] **Step 2: Full E2E suite (regression: shot/melee must still pass)**

Run: `npm run test:e2e`
Expected: all specs PASS, including new `grenade-targets.spec.ts` and existing `combat.spec.ts`.

- [ ] **Step 3: Manual mobile check (optional but recommended)**

`npm run dev`, mobile viewport: throw a grenade, add 6 targets — confirm the list scrolls, the arming panel (tally + ВЗРЫВ) stays pinned, the newest check auto-scrolls into view with the emerald ring, and ПРИНЯТЬ is reachable at the bottom. Confirm shot/melee results look unchanged.

- [ ] **Step 4: Final commit if any fixups**

If Steps 1–3 surfaced fixups, commit them. Otherwise this task records green verification.
