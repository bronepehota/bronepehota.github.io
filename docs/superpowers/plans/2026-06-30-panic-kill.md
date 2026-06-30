# Kill in Panic (#167) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a panicking soldier be marked killed — show the existing УБИТЬ button in the panic state (DONE stays hidden).

**Architecture:** Purely presentational, one file. `SoldierActions.tsx` currently early-returns a lone static `Footprints` icon when `isInPanic`, hiding both DONE and KILL. Extract the kill button into a local `renderKillButton()` (DRY — it's identical in the normal and panic branches), then render `{!isDead && <Footprints indicator>}` + `{renderKillButton()}` in the panic branch. No logic change — `onToggleDead` (`SoldierCard.handleToggleDead`) is already wired.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind, Jest + React Testing Library (unit), Playwright (E2E).

## Global Constraints

- **Mobile-first**; touch targets ≥44×44px. UI copy Russian; code/identifiers English.
- Dark theme (slate-900), `font-mono` for combat UI. Reuse `cn()` from `@/lib/utils` and Lucide icons — no new fonts/palette.
- **Logic unchanged** — `onToggleDead`/`handleToggleDead` already work; this fix only unhides the button. Do NOT clear `panicState` on kill (out of scope; dead has stripe priority and `resolvePanic` clears at turn start).
- Do NOT change `SoldierCard.tsx:278` (`disabled={isDone || isDead || isInPanic}` on the center stats / combat initiation) — panicking soldiers still can't initiate combat (rules §10).
- Follow existing patterns. Don't break existing tests. TDD.
- `npm run validate` = type-check + lint + unit (no E2E); run `npm run test:e2e` separately.
- **Commit after every task.** Branch `fix/167-kill-panic-soldier` already exists — stay on it.

**Spec:** `docs/superpowers/specs/2026-06-30-panic-kill-design.md`

---

### Task 1: Show УБИТЬ in panic state (TDD)

**Files:**
- Modify: `src/components/cards/soldier-card/SoldierActions.tsx` (panic branch `:99-108`; kill button `:145-174`)
- Test: `src/__tests__/components/cards/soldier-card/SoldierActions.test.tsx`

**Interfaces:**
- Produces: in the panic branch, the element `data-testid="soldier-kill-button"` is rendered (with `data-soldier-index={soldierIndex}`); `data-testid="soldier-done-button"` is NOT rendered in panic. Clicking the kill button calls `onToggleDead`.

- [ ] **Step 1: Write the failing tests**

Append a new `describe` block inside the top-level `describe('SoldierActions', ...)` in `src/__tests__/components/cards/soldier-card/SoldierActions.test.tsx` (e.g. after the "Regular soldier rendering" block):

```tsx
  describe('Panic state rendering', () => {
    it('should show УБИТЬ button in panic state', () => {
      render(<SoldierActions {...defaultProps} isInPanic={true} />);

      expect(screen.getByTestId('soldier-kill-button')).toBeInTheDocument();
    });

    it('should NOT show ГОТОВ button in panic state', () => {
      render(<SoldierActions {...defaultProps} isInPanic={true} />);

      expect(screen.queryByTestId('soldier-done-button')).not.toBeInTheDocument();
    });

    it('should call onToggleDead when clicking УБИТЬ in panic state', () => {
      const onToggleDead = jest.fn();
      render(
        <SoldierActions {...defaultProps} isInPanic={true} onToggleDead={onToggleDead} />
      );

      fireEvent.click(screen.getByTestId('soldier-kill-button'));

      expect(onToggleDead).toHaveBeenCalledTimes(1);
    });

    it('should still render УБИТЬ (killed state) when panicking and dead', () => {
      render(<SoldierActions {...defaultProps} isInPanic={true} isDead={true} />);

      const killButton = screen.getByTestId('soldier-kill-button');
      expect(killButton).toBeInTheDocument();
      expect(killButton).toHaveAttribute('aria-pressed', 'true');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/__tests__/components/cards/soldier-card/SoldierActions.test.tsx -t "Panic state rendering"`
Expected: FAIL — `getByTestId('soldier-kill-button')` not found in panic (the panic branch renders only a Footprints icon).

- [ ] **Step 3: Extract `renderKillButton()`**

In `src/components/cards/soldier-card/SoldierActions.tsx`, find the end of `handleDeadClick` and the start of the pilot comment:

```jsx
  const handleDeadClick = () => {
    if (wasLongPressTriggered) return;
    if (!isDead) {
      onToggleDead();
    }
  };

  // Pilot navigation replaces done/kill
  if (isPilot && onNavigateToMachine) {
```

Insert a `renderKillButton` helper between them (it captures `isDead`, `isLongPressing`, `soldierIndex`, and the dead handlers):

```jsx
  const handleDeadClick = () => {
    if (wasLongPressTriggered) return;
    if (!isDead) {
      onToggleDead();
    }
  };

  // Shared kill button (rendered both in the normal stack and in the panic state)
  const renderKillButton = () => (
    <button
      onMouseDown={handleDeadMouseDown}
      onMouseUp={onEndLongPress}
      onMouseLeave={onEndLongPress}
      onTouchStart={handleDeadMouseDown}
      onTouchEnd={onEndLongPress}
      onClick={handleDeadClick}
      className={cn(
        "relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm font-mono font-black uppercase tracking-wider flex items-center justify-center border overflow-hidden transition-all",
        isDead
          ? "bg-red-900/40 hover:bg-red-900/60 border-red-700/50 text-red-400"
          : "bg-slate-800/30 hover:bg-slate-700/40 border-slate-700/40 text-slate-500",
        isLongPressing && "scale-95 opacity-80"
      )}
      type="button"
      title={isDead ? "Долгое нажатие для воскрешения" : "Пометить как убитый"}
      aria-label={isDead ? "Боец убит. Долгое нажатие для отмены." : "Пометить бойца как убитого"}
      aria-pressed={isDead}
      data-testid="soldier-kill-button"
      data-soldier-index={soldierIndex}
    >
      {isDead && (
        <>
          <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-500/30" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-red-500/30" aria-hidden="true" />
        </>
      )}
      <Skull className="w-5 h-5 flex-shrink-0" />
    </button>
  );

  // Pilot navigation replaces done/kill
  if (isPilot && onNavigateToMachine) {
```

- [ ] **Step 4: Rewrite the panic branch to show the indicator + kill button**

Find the current panic branch:

```jsx
  // Panic state
  if (isInPanic) {
    return (
      <div className="flex flex-col gap-1">
        <div className="relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm flex items-center justify-center border-2 bg-orange-950/30 border-orange-700/50 text-orange-400">
          <Footprints className="w-5 h-5" />
        </div>
      </div>
    );
  }
```

Replace with (indicator only when not dead, plus the shared kill button):

```jsx
  // Panic state — can be destroyed (rules §10), but cannot act (no DONE)
  if (isInPanic) {
    return (
      <div className="flex flex-col gap-1">
        {!isDead && (
          <div className="relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm flex items-center justify-center border-2 bg-orange-950/30 border-orange-700/50 text-orange-400">
            <Footprints className="w-5 h-5" />
          </div>
        )}
        {renderKillButton()}
      </div>
    );
  }
```

- [ ] **Step 5: Use the shared helper in the default branch (remove duplication)**

Find the inline kill button in the default return:

```jsx
      {/* УБИТЬ button */}
      <button
        onMouseDown={handleDeadMouseDown}
        onMouseUp={onEndLongPress}
        onMouseLeave={onEndLongPress}
        onTouchStart={handleDeadMouseDown}
        onTouchEnd={onEndLongPress}
        onClick={handleDeadClick}
        className={cn(
          "relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm font-mono font-black uppercase tracking-wider flex items-center justify-center border overflow-hidden transition-all",
          isDead
            ? "bg-red-900/40 hover:bg-red-900/60 border-red-700/50 text-red-400"
            : "bg-slate-800/30 hover:bg-slate-700/40 border-slate-700/40 text-slate-500",
          isLongPressing && "scale-95 opacity-80"
        )}
        type="button"
        title={isDead ? "Долгое нажатие для воскрещения" : "Пометить как убитый"}
        aria-label={isDead ? "Боец убит. Долгое нажатие для отмены." : "Пометить бойца как убитого"}
        aria-pressed={isDead}
        data-testid="soldier-kill-button"
        data-soldier-index={soldierIndex}
      >
        {isDead && (
          <>
            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-500/30" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-red-500/30" aria-hidden="true" />
          </>
        )}
        <Skull className="w-5 h-5 flex-shrink-0" />
      </button>
    </div>
  );
}
```

Replace with a call to the helper (keep the closing `</div>` and `);` of the component):

```jsx
      {/* УБИТЬ button */}
      {renderKillButton()}
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest src/__tests__/components/cards/soldier-card/SoldierActions.test.tsx`
Expected: PASS — all 4 new tests + every pre-existing test (pilot navigation, regular soldier DONE+УБИТЬ, pilot-in-panic priority, etc.) still green.

- [ ] **Step 7: Commit**

```bash
git add src/components/cards/soldier-card/SoldierActions.tsx src/__tests__/components/cards/soldier-card/SoldierActions.test.tsx
git commit -m "fix(soldier): allow marking a panicking soldier as killed (#167)"
```

---

### Task 2: E2E — kill a panicking soldier

**Files:**
- Create: `e2e/panic-kill.spec.ts`

**Interfaces:**
- Consumes: `setupGameSessionWithSquad`, `expandFirstUnit`, `clearStorage` from `./helpers/setup`; the seeded unit's `panicState` makes soldier 0 panicking; `data-testid="soldier-kill-button"` carries `data-soldier-index`.
- Produces: integration proof that a panicking soldier's УБИТЬ button is reachable and works.

Note: `isInPanic` is derived purely from `unit.panicState` (`SoldierCard.tsx:70`), independent of rules version — so seeding `panicState` via `unitOverrides` is enough to make soldier 0 render in panic. Seed `triggeredAtTurn: 1` (matches the helper's default `currentTurn: 1`) so `resolvePanic` does not clear it on load.

- [ ] **Step 1: Write the spec**

Create `e2e/panic-kill.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * #167 — a panicking soldier can be marked killed.
 */
test.describe('Kill in panic (#167)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, {
      unitOverrides: {
        instanceId: 'panic-kill-unit-1',
        // Soldier 0 is panicking this turn
        panicState: [{ soldierIndex: 0, testRoll: 6, rank: 2, triggeredAtTurn: 1 }],
      },
    });
    await expandFirstUnit(page);
  });

  test('panicking soldier shows a working УБИТЬ button and no ГОТОВ button', async ({ page }) => {
    const panickingKill = page.locator(
      '[data-testid="soldier-kill-button"][data-soldier-index="0"]'
    );
    await expect(panickingKill).toBeVisible({ timeout: 5000 });

    // DONE stays hidden for a panicking soldier
    const panickingDone = page.locator(
      '[data-testid="soldier-done-button"][data-soldier-index="0"]'
    );
    await expect(panickingDone).toHaveCount(0);

    // Killing the panicking soldier works
    await panickingKill.click({ force: true, timeout: 5000 });
    await expect(panickingKill).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run the spec (expect PASS now that Task 1 is in)**

Run: `npx playwright test e2e/panic-kill.spec.ts --project=chromium`
Expected: PASS. (Before Task 1 it would fail — no kill button for the panicking soldier.)

- [ ] **Step 3: Commit**

```bash
git add e2e/panic-kill.spec.ts
git commit -m "test(e2e): panicking soldier can be marked killed (#167)"
```

---

### Task 3: Full validation

**Files:** none (verification only)

- [ ] **Step 1: Type-check + lint + unit**

Run: `npm run validate`
Expected: PASS (type-check clean; unit tests all green, incl. the 4 new SoldierActions tests; lint has no NEW warnings in touched files).

- [ ] **Step 2: Full E2E suite (regression)**

Run: `npm run test:e2e`
Expected: all specs PASS, including new `panic-kill.spec.ts` and existing `soldier-state-management.spec.ts` (confirms normal DONE/УБИТЬ still work) and `combat.spec.ts`.

- [ ] **Step 3: Record green verification**

If Steps 1–2 surfaced fixups, commit them. Otherwise this task records green verification (no commit needed).
