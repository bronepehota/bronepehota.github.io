# Machine Card Redesign Implementation Plan (#179)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the machine card as a single cohesive, obvious module (clean-grid / soldier-mirror direction), mobile-first, preserving all functionality and the #163 pilot-test alert bar.

**Architecture:** `MachineView` becomes one bordered card laying out borderless sections (status header → weapons → melee → damage/repair → ammo). `TacticalDashboard` is restyled+renamed to `MachineStatusHeader` (clean badges, `PilotChip`, durability bar, alert bar). The pilot portrait moves out of the header into a new `PilotSheet` bottom-sheet (opened from a compact `PilotChip`). Dead panels and the unimplemented Ram button are deleted. Weapons stay the primary action (tap-to-fire); per-weapon ammo moves under each weapon.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, lucide-react, Jest + React Testing Library (unit), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-07-01-machine-card-redesign-design.md`

## Global Constraints

- **Mobile-first.** All user-facing text in **Russian**; code/identifiers in English.
- **Touch targets ≥ 44×44px** on mobile (WCAG 2.5.5) — every interactive element gets `min-w-[44px] min-h-[44px]` on mobile (desktop may shrink).
- **Path alias** `@/*` → `src/*`. Use `cn` from `@/lib/utils`; faction colors via `getFactionColors(faction)` from `@/lib/faction-colors`.
- **Do NOT change combat mechanics or data** — UI/UX only. `executeShot`, `calculateDamage`, ammo/shot accounting logic stay as-is.
- **Preserve these selectors exactly** (E2E depends on them):
  - `data-testid="assign-pilot-button"` — pilot entry (on `PilotChip` when no pilot).
  - `data-testid="pilot-survival-test-button"` — the urgent amber alert bar.
  - `data-testid="confirm-pilot-assignment"` — pilot assignment modal (untouched).
  - `aria-label="Выстрел: <weapon.name>"` on each ranged weapon row (disabled → `Оружие недоступно`).
  - The damage button must be findable by `getByRole('button', { name: /урон/i })` **and** contain a `svg.lucide-flame`.
- **LSP diagnostics can be stale** — trust `npm run type-check` (exit code) over in-editor squiggles.
- **Verify before commit:** `npm run validate` (type-check + lint + unit) must be green after every task. E2E (`npm run test:e2e`) is run in Task 8.
- **Branch:** `feat/179-machine-card-redesign` (already created, branched off `fix/163-defender-armor-test`). Commit per task. Co-author trailer: `Co-Authored-By: Claude <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/components/cards/unit-card/machine-view/PilotChip.tsx` — compact pilot status indicator (states: none/alive/dead/urgent); tap → open pilot.
- `src/components/cards/unit-card/machine-view/PilotSheet.tsx` — bottom-sheet: portrait + status + «Тест пилота» + «Сменить».
- `src/__tests__/components/unit-card/PilotChip.test.tsx`
- `src/__tests__/components/unit-card/PilotSheet.test.tsx`

**Modify:**
- `src/components/cards/unit-card/machine-view/TacticalDashboard.tsx` → **rename** to `MachineStatusHeader.tsx`: clean badges + `PilotChip` + durability bar + alert bar; image ~95px; display-only durability (no damage/repair buttons — those move to `MachineView`).
- `src/components/cards/unit-card/MachineView.tsx` — one cohesive card; damage/repair secondary row; pilot sheet wiring; ram removal; layout order.
- `src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx` — clean tappable rows; absorb per-weapon ammo mini-bars.
- `src/components/cards/unit-card/machine-view/MachineAmmoPanel.tsx` — slim to global ammo bar + shots + ±.
- `src/__tests__/components/unit-card/MachineView.test.tsx` — update pilot asserts (portrait no longer always visible).
- `src/__tests__/a11y/unit-card-accessibility.test.tsx` — repoint to new components (Task 1 prunes deleted; Task 8 adds new).

**Delete:**
- `src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx`
- `src/components/cards/unit-card/machine-view/MachinePilotPanel.tsx`
- `src/components/cards/unit-card/machine-view/MachineImage.tsx`
- `src/__tests__/components/unit-card/MachineStatsPanel.test.tsx`
- `src/__tests__/components/unit-card/MachinePilotPanel.test.tsx`

---

## Task 1: Remove dead machine panels + prune tests

`MachineStatsPanel`, `MachinePilotPanel`, `MachineImage` are imported **only** by tests (verified: `grep -rn "MachineStatsPanel\|MachinePilotPanel\|machine-view/MachineImage" src/components` → no matches outside their own files). `MachineView` uses only `TacticalDashboard`, `MachineAmmoPanel`, `MachineWeaponsList`. Delete the dead trio + their tests, and remove their blocks from the a11y test so the suite compiles.

**Files:**
- Delete: `src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx`, `MachinePilotPanel.tsx`, `MachineImage.tsx`
- Delete: `src/__tests__/components/unit-card/MachineStatsPanel.test.tsx`, `MachinePilotPanel.test.tsx`
- Modify: `src/__tests__/a11y/unit-card-accessibility.test.tsx`

- [ ] **Step 1: Verify the dead trio has no production importers**

Run: `grep -rn "MachineStatsPanel\|MachinePilotPanel\|machine-view/MachineImage'" src/components src/app`
Expected: no output (only test files reference them). If any production import appears, STOP and re-scope.

- [ ] **Step 2: Delete the 5 files**

```bash
git rm src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx \
       src/components/cards/unit-card/machine-view/MachinePilotPanel.tsx \
       src/components/cards/unit-card/machine-view/MachineImage.tsx \
       src/__tests__/components/unit-card/MachineStatsPanel.test.tsx \
       src/__tests__/components/unit-card/MachinePilotPanel.test.tsx
```

- [ ] **Step 3: Prune the a11y test**

In `src/__tests__/a11y/unit-card-accessibility.test.tsx`: remove the `import` lines for `MachineStatsPanel` (line 3) and `MachinePilotPanel` (line 5). Delete these `describe`/`it` blocks that reference them:
- "Minimum touch target size" → `describe('MachineStatsPanel', …)` (lines ~53-83) and `describe('MachinePilotPanel', …)` (lines ~108-156).
- "ARIA labels" → `describe('MachineStatsPanel', …)` (~176-202) and `describe('MachinePilotPanel', …)` (~204-245).
- "Keyboard navigation" → `it('MachineStatsPanel buttons are focusable', …)` (~263-286) and `it('MachinePilotPanel buttons are focusable', …)` (~307-322).
- "Disabled state accessibility" → `it('MachineStatsPanel disabled buttons are properly marked', …)` (~326-347) and `it('MachinePilotPanel disabled button during test', …)` (~349-371).

Keep: `UnitCardHeader` and `MachineAmmoPanel` blocks. (New-component a11y coverage is added in Task 8.) Also remove the now-unused `DurabilityZone` import if the linter flags it.

- [ ] **Step 4: Validate**

Run: `npm run validate`
Expected: PASS (type-check + lint + unit tests green). The `MachineAmmoPanel` a11y block still passes; deleted-panel tests are gone.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(machine-card): #179 — remove dead panels (MachineStatsPanel/PilotPanel/Image) + tests

These three components were imported only by tests; MachineView uses only
TacticalDashboard/MachineAmmoPanel/MachineWeaponsList. Prunes their blocks from
the a11y test (new-component a11y coverage added later).

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: PilotChip component (TDD)

Compact tappable pilot indicator that replaces the always-on pilot portrait in the header.

**Files:**
- Create: `src/components/cards/unit-card/machine-view/PilotChip.tsx`
- Test: `src/__tests__/components/unit-card/PilotChip.test.tsx`

**Interfaces:**
- Produces: `PilotChip` with props `{ pilotInfo: PilotInfo | null; pilotTestUrgent: boolean; onOpenPilot: () => void }`. Renders a `<button>` carrying `data-testid="assign-pilot-button"` when no pilot is assigned.

- [ ] **Step 1: Write the failing test**

`src/__tests__/components/unit-card/PilotChip.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PilotChip } from '@/components/cards/unit-card/machine-view/PilotChip';
import { PilotInfo } from '@/lib/types';

describe('PilotChip', () => {
  const alivePilot: PilotInfo = {
    squadInstanceId: 'squad-1', soldierIndex: 0, pilotArmor: 3, alive: true,
  };

  it('no pilot: shows "назначить" + assign-pilot-button test-id', () => {
    render(<PilotChip pilotInfo={null} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    const chip = screen.getByTestId('assign-pilot-button');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent(/назначить/i);
  });

  it('alive pilot: shows ЖИВ', () => {
    render(<PilotChip pilotInfo={alivePilot} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    expect(screen.getByText(/жив/i)).toBeInTheDocument();
  });

  it('dead pilot: shows ПОГИБ', () => {
    const dead = { ...alivePilot, alive: false };
    render(<PilotChip pilotInfo={dead} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    expect(screen.getByText(/погиб/i)).toBeInTheDocument();
  });

  it('urgent + alive: shows тревога marker', () => {
    render(<PilotChip pilotInfo={alivePilot} pilotTestUrgent={true} onOpenPilot={jest.fn()} />);
    expect(screen.getByText(/тревога/i)).toBeInTheDocument();
  });

  it('click calls onOpenPilot', () => {
    const onOpenPilot = jest.fn();
    render(<PilotChip pilotInfo={alivePilot} pilotTestUrgent={false} onOpenPilot={onOpenPilot} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenPilot).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PilotChip.test`
Expected: FAIL — module `PilotChip` not found.

- [ ] **Step 3: Implement PilotChip**

`src/components/cards/unit-card/machine-view/PilotChip.tsx`:
```tsx
'use client';

import { AlertTriangle, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PilotInfo } from '@/lib/types';

interface PilotChipProps {
  pilotInfo: PilotInfo | null;
  pilotTestUrgent: boolean;
  onOpenPilot: () => void;
}

export function PilotChip({ pilotInfo, pilotTestUrgent, onOpenPilot }: PilotChipProps) {
  const hasPilot = !!pilotInfo;
  const alive = !!pilotInfo?.alive;
  const urgent = hasPilot && alive && pilotTestUrgent;

  return (
    <button
      type="button"
      onClick={onOpenPilot}
      data-testid={hasPilot ? undefined : 'assign-pilot-button'}
      aria-label={
        !hasPilot ? 'Назначить пилота' :
        alive ? (urgent ? 'Тест пилота: получен урон' : 'Открыть карточку пилота') :
        'Пилот погиб'
      }
      className={cn(
        'w-full min-h-[44px] rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs font-semibold transition-colors',
        'border touch-manipulation',
        urgent
          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-[0_0_12px_-3px_rgba(245,158,11,0.6)]'
          : !hasPilot
            ? 'bg-slate-900/60 border-slate-700/50 text-slate-400'
            : alive
              ? 'bg-slate-900/60 border-purple-700/30 text-purple-200'
              : 'bg-red-950/40 border-red-700/40 text-red-300'
      )}
    >
      <span className="flex items-center gap-1.5 truncate">
        {urgent ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <Plane className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">
          {!hasPilot ? 'Пилота нет' : urgent ? 'Пилот' : 'Пилот назначен'}
        </span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        {urgent && (
          <span className="text-[9px] uppercase tracking-wide bg-amber-600/40 px-1.5 py-0.5 rounded">Тревога</span>
        )}
        {hasPilot && !urgent && (
          <span className={cn(
            'text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded',
            alive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
          )}>
            {alive ? 'Жив' : 'Погиб'}
          </span>
        )}
        {!hasPilot && <span className="text-[9px] text-slate-500">назначить</span>}
        <span className="text-slate-500 text-[10px]">▸</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- PilotChip.test`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/cards/unit-card/machine-view/PilotChip.tsx \
        src/__tests__/components/unit-card/PilotChip.test.tsx
git commit -m "feat(machine-card): #179 — PilotChip (compact pilot status → open pilot)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: PilotSheet component (TDD)

Bottom-sheet revealed by tapping `PilotChip` when a pilot is assigned. Uses `useBottomSheet` (swipe-down to close), mirroring `BottomSheetCombatModal`'s overlay pattern.

**Files:**
- Create: `src/components/cards/unit-card/machine-view/PilotSheet.tsx`
- Test: `src/__tests__/components/unit-card/PilotSheet.test.tsx`

**Interfaces:**
- Consumes: `useBottomSheet({ onClose, closeThreshold, isEnabled })` from `@/hooks/useBottomSheet`; `PilotInfo`, `GitHubPagesImage` from `@/components/GitHubPagesImage`.
- Produces: `PilotSheet` with props:
  ```ts
  interface PilotSheetProps {
    isOpen: boolean;
    onClose: () => void;
    pilotInfo: PilotInfo;
    pilotImage: string | null;
    survivalTest: { roll: number; survived: boolean; testedAt: number } | null;
    isTestRunning: boolean;
    onSurvivalTest: () => void;
    onAssignPilot: () => void; // "Сменить"
  }
  ```

- [ ] **Step 1: Write the failing test**

`src/__tests__/components/unit-card/PilotSheet.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PilotSheet } from '@/components/cards/unit-card/machine-view/PilotSheet';
import { PilotInfo } from '@/lib/types';

const alivePilot: PilotInfo = {
  squadInstanceId: 'squad-1', soldierIndex: 0, pilotArmor: 3, alive: true,
};

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  pilotInfo: alivePilot,
  pilotImage: '/images/pilot.png',
  survivalTest: null,
  isTestRunning: false,
  onSurvivalTest: jest.fn(),
  onAssignPilot: jest.fn(),
};

describe('PilotSheet', () => {
  it('closed: renders nothing', () => {
    const { container } = render(<PilotSheet {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('open + alive: shows portrait, броня, test button, сменить', () => {
    render(<PilotSheet {...baseProps} />);
    expect(screen.getByAltText('Пилот')).toBeInTheDocument();
    expect(screen.getByText(/броня/i)).toHaveTextContent('3');
    expect(screen.getByTestId('pilot-sheet-test-button')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /сменить/i })).toBeInTheDocument();
  });

  it('open + dead: no test button', () => {
    render(<PilotSheet {...baseProps} pilotInfo={{ ...alivePilot, alive: false }} />);
    expect(screen.queryByTestId('pilot-sheet-test-button')).not.toBeInTheDocument();
  });

  it('test button calls onSurvivalTest', () => {
    render(<PilotSheet {...baseProps} />);
    fireEvent.click(screen.getByTestId('pilot-sheet-test-button'));
    expect(baseProps.onSurvivalTest).toHaveBeenCalledTimes(1);
  });

  it('сменить calls onAssignPilot', () => {
    render(<PilotSheet {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /сменить/i }));
    expect(baseProps.onAssignPilot).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PilotSheet.test`
Expected: FAIL — module `PilotSheet` not found.

- [ ] **Step 3: Implement PilotSheet**

`src/components/cards/unit-card/machine-view/PilotSheet.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PilotInfo } from '@/lib/types';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';

interface PilotSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pilotInfo: PilotInfo;
  pilotImage: string | null;
  survivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  isTestRunning: boolean;
  onSurvivalTest: () => void;
  onAssignPilot: () => void;
}

export function PilotSheet({
  isOpen, onClose, pilotInfo, pilotImage, survivalTest, isTestRunning, onSurvivalTest, onAssignPilot,
}: PilotSheetProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({ onClose, isEnabled: isOpen });

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const alive = !!pilotInfo.alive;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Карточка пилота"
      className="fixed inset-0 z-[150] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        {...touchHandlers}
        className="relative w-full max-w-md bg-slate-900 border border-purple-700/30 rounded-t-2xl p-4 shadow-2xl"
      >
        <div className="w-10 h-1 bg-slate-600 rounded mx-auto mb-3" aria-hidden="true" />
        <div className="flex gap-3 items-center mb-4">
          <div className="w-16 aspect-[4/5] rounded-lg overflow-hidden border border-purple-700/30 bg-slate-950/60 shrink-0">
            <GitHubPagesImage
              src={pilotImage || '/images/soldiers/empty.png'}
              alt="Пилот"
              width={80}
              height={100}
              className="w-full h-full object-cover object-top"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-100">Пилот</div>
            <div className={cn(
              'text-xs mt-0.5 inline-block px-2 py-0.5 rounded',
              alive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
            )}>
              {alive ? `Жив · броня ${pilotInfo.pilotArmor ?? 0}` : 'Погиб'}
            </div>
            {survivalTest && (
              <div className={cn('text-[11px] mt-1', survivalTest.survived ? 'text-emerald-400' : 'text-red-400')}>
                {survivalTest.survived ? '✓ Выжил' : '✗ Погиб'} (бросок {survivalTest.roll})
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {alive && (
            <button
              type="button"
              onClick={onSurvivalTest}
              disabled={isTestRunning}
              data-testid="pilot-sheet-test-button"
              className={cn(
                'flex-1 min-h-[44px] rounded-lg px-3 py-2 text-sm font-bold border flex items-center justify-center gap-1.5 transition-colors',
                isTestRunning
                  ? 'bg-purple-950/50 border-purple-700/50 text-purple-300'
                  : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
              )}
            >
              {isTestRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Тест…</> : <><AlertTriangle className="w-4 h-4" /> Тест пилота</>}
            </button>
          )}
          <button
            type="button"
            onClick={onAssignPilot}
            className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-bold border border-slate-600/60 bg-slate-800/60 text-slate-200"
          >
            Сменить
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- PilotSheet.test`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/cards/unit-card/machine-view/PilotSheet.tsx \
        src/__tests__/components/unit-card/PilotSheet.test.tsx
git commit -m "feat(machine-card): #179 — PilotSheet (portrait/test/change bottom-sheet)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: MachineStatusHeader refactor + pilot UX wiring + damage/repair row

The keystone integration task. Rename `TacticalDashboard` → `MachineStatusHeader`, restyle to clean badges + `PilotChip` + durability bar + the preserved alert bar, image ~95px. Durability becomes display-only (the damage/repair buttons move to a new secondary row in `MachineView`). Wire `PilotChip` → `PilotSheet` in `MachineView`.

**Files:**
- Rename: `src/components/cards/unit-card/machine-view/TacticalDashboard.tsx` → `MachineStatusHeader.tsx`
- Modify: `src/components/cards/unit-card/MachineView.tsx`
- Modify: `src/__tests__/components/unit-card/MachineView.test.tsx`

**Interfaces:**
- Consumes: `PilotChip` (Task 2), `PilotSheet` (Task 3), `getFactionColors`, `GitHubPagesImage`.
- Produces: `MachineStatusHeader` with the SAME props as `TacticalDashboard` **minus** the durability control buttons being rendered inside it — but to minimize signature churn, keep `onUpdateDurability` in the props and simply do not render damage/repair here (they render in `MachineView`). Concretely the header renders: image (95px), `Прочн`/`Скор` badges, segmented durability bar, `PilotChip` (passes `onOpenPilot`, `pilotInfo`, `pilotTestUrgent`), and the alert bar (`pilot-survival-test-button`).

- [ ] **Step 1: Rename the file and update its export**

```bash
git mv src/components/cards/unit-card/machine-view/TacticalDashboard.tsx \
       src/components/cards/unit-card/machine-view/MachineStatusHeader.tsx
```

In `MachineStatusHeader.tsx`: rename `interface TacticalDashboardProps` → `MachineStatusHeaderProps`, rename the function `TacticalDashboard` → `MachineStatusHeader`. Add `pilotTestUrgent` is already a prop — keep it; pass it to `PilotChip`.

- [ ] **Step 2: Restyle MachineStatusHeader to the clean-grid header**

Rewrite the component body (keep the prop list identical; remove the tactical grid background, scan-line, corner brackets, and the right-hand pilot-portrait column). New structure:

```tsx
export function MachineStatusHeader({ /* same props as before */ }: MachineStatusHeaderProps) {
  const colors = getFactionColors(faction);
  const zoneColor = getZoneColor(zone.color);

  return (
    <div className="relative">
      {/* Status header row */}
      <div className="flex gap-2.5 items-stretch">
        {/* Machine image — ~95px mobile, tap → fullscreen */}
        <button
          type="button"
          onClick={onImageClick}
          className="relative w-[95px] aspect-[3/4] flex-shrink-0 rounded-lg overflow-hidden border"
          style={{ borderColor: `${colors.primary}40` }}
          aria-label={`Показать фото: ${machineName}`}
        >
          <GitHubPagesImage src={imageUrl} alt={machineName} width={120} height={160}
            className="w-full h-full object-cover object-center" unoptimized />
          {isDestroyed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Skull className="w-8 h-8 text-red-500" strokeWidth={2.5} />
            </div>
          )}
        </button>

        {/* Badges grid */}
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-1.5">
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg py-1 text-center">
            <div className="text-[8px] uppercase tracking-wide text-slate-500">Прочн</div>
            <div className={cn('text-base font-black leading-tight', zoneColor.text)}>
              {currentDurability}<span className="text-[9px] opacity-60">/{maxDurability}</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg py-1 text-center">
            <div className="text-[8px] uppercase tracking-wide text-slate-500">Скор</div>
            <div className="text-base font-black leading-tight text-cyan-400">
              {distanceInputUnit === 'cm' ? speed * stepToCmFactor : speed}
              <span className="text-[8px] opacity-60">{distanceInputUnit === 'cm' ? ' см' : ' ш'}</span>
            </div>
          </div>
          <div className="col-span-2">
            <PilotChip pilotInfo={pilotInfo} pilotTestUrgent={pilotTestUrgent} onOpenPilot={onOpenPilot} />
          </div>
        </div>
      </div>

      {/* Segmented durability bar */}
      <div className="flex gap-0.5 mt-2">
        {Array.from({ length: maxDurability }).map((_, i) => (
          <div key={i} className={cn('h-1.5 flex-1 rounded-sm',
            i < currentDurability ? zoneColor.bar : 'bg-slate-800')} />
        ))}
      </div>

      {/* #163 urgent pilot-test alert bar — UNCHANGED logic, preserve test-id */}
      {pilotInfo && pilotInfo.alive && (pilotTestUrgent || isPilotTestRunning || survivalTest) && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSurvivalTest(); }}
          disabled={isPilotTestRunning}
          data-testid="pilot-survival-test-button"
          className={cn(/* KEEP the existing 4-state className from TacticalDashboard lines 269-280 verbatim */)}
        >
          {/* KEEP the existing 4-state children from lines 282-290 verbatim */}
        </button>
      )}
    </div>
  );
}
```

Add `onOpenPilot: () => void` to `MachineStatusHeaderProps`. Remove now-unused imports (`Footprints`, `Plane`, the tactical-grid/scan markup) — keep `Shield`/`Skull`/`AlertTriangle`/`Check`/`Loader2`/`Flame` only if still used; let `npm run lint` guide unused-import cleanup.

- [ ] **Step 3: Wire MachineView — header, damage/repair row, pilot sheet**

In `MachineView.tsx`:
1. Update import: `import { MachineStatusHeader } from './machine-view/MachineStatusHeader';`
2. Add `import { useState } from 'react';` and `import { PilotSheet } from './machine-view/PilotSheet';`
3. Inside `MachineView`, add: `const [pilotSheetOpen, setPilotSheetOpen] = useState(false);`
4. Render the header (replacing the current `<TacticalDashboard …/>` block). Pass `onOpenPilot`:
   ```tsx
   <MachineStatusHeader
     {/* …all existing props… */}
     onOpenPilot={() => {
       if (!pilotInfo) onPilotAssign();
       else setPilotSheetOpen(true);
     }}
   />
   ```
5. Add the damage/repair secondary row (after the header, before ammo/weapons — final order is set in Task 7; for now place it directly under the header):
   ```tsx
   <div className="flex gap-1.5">
     <button type="button" onClick={() => updateDurability(-1)} disabled={currentDurability === 0}
       className="flex-1 min-h-[44px] rounded-lg py-2 text-xs font-bold border bg-red-950/30 border-red-800/40 text-red-300 flex items-center justify-center gap-1.5 disabled:opacity-30">
       <Flame className="w-4 h-4" /> <span>−1 Урон</span>
     </button>
     <button type="button" onClick={() => updateDurability(1)} disabled={currentDurability === maxDurability}
       className="flex-1 min-h-[44px] rounded-lg py-2 text-xs font-bold border bg-emerald-950/30 border-emerald-800/40 text-emerald-300 flex items-center justify-center gap-1.5 disabled:opacity-30">
       <Wrench className="w-4 h-4" /> <span>+1 Ремонт</span>
     </button>
   </div>
   ```
   Pull `currentDurability`/`maxDurability` from the existing vars (`unit.currentDurability || 0`, `machine.durability_max`). `updateDurability`, `onPilotAssign`, `onPilotSurvivalTest`, `pilotImage`, `pilotSurvivalTest`, `isPilotTestRunning` are all existing props.
6. Render the `PilotSheet` (near the other modals, e.g. after the ram-button block which is removed in Task 7):
   ```tsx
   {pilotInfo && (
     <PilotSheet
       isOpen={pilotSheetOpen}
       onClose={() => setPilotSheetOpen(false)}
       pilotInfo={pilotInfo}
       pilotImage={pilotImage}
       survivalTest={pilotSurvivalTest}
       isTestRunning={isPilotTestRunning}
       onSurvivalTest={onPilotSurvivalTest}
       onAssignPilot={() => { setPilotSheetOpen(false); onPilotAssign(); }}
     />
   )}
   ```
   (`pilotInfo` is already computed as `unit.pilotInfo || null` in `MachineView`.)

- [ ] **Step 4: Update MachineView.test.tsx pilot assertions**

The pilot portrait is no longer always rendered (it lives in `PilotSheet`, opened on tap). In `src/__tests__/components/unit-card/MachineView.test.tsx`:
- In `describe('Pilot panel integration', …)`: replace the two `screen.getByAltText('Пилот')` assertions. With a pilot assigned and the sheet closed, assert the chip instead:
  ```tsx
  it('renders pilot chip when pilot info is present', () => {
    const unit = createMockUnit({ pilotInfo: { squadInstanceId: 'squad-1', soldierIndex: 0, pilotArmor: 2, alive: true } });
    render(<MachineView {...defaultProps} unit={unit} />);
    expect(screen.getByText(/жив/i)).toBeInTheDocument();
  });

  it('survival test result does not crash render', () => {
    const unit = createMockUnit({ pilotInfo: { squadInstanceId: 'squad-1', soldierIndex: 0, pilotArmor: 2, alive: true } });
    render(<MachineView {...defaultProps} unit={unit}
      pilotSurvivalTest={{ roll: 15, survived: true, testedAt: Date.now() }} />);
    expect(screen.getByText(/жив/i)).toBeInTheDocument();
  });
  ```
- All other asserts (`прочность`, `боезапас`, weapon names, `ближний бой`) stay valid.

- [ ] **Step 5: Validate**

Run: `npm run validate`
Expected: PASS. If lint flags unused imports in `MachineStatusHeader.tsx` (e.g. `Footprints`, `Plane`), remove them.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(machine-card): #179 — MachineStatusHeader (clean badges + PilotChip) + damage/repair row + pilot sheet wiring

Rename TacticalDashboard → MachineStatusHeader, restyle to clean-grid header
(Прочн/Скор badges, ~95px image, PilotChip, durability bar). Preserve #163
pilot-survival-test-button alert bar. Move damage/repair into a secondary
row in MachineView; wire PilotChip → PilotSheet. Update MachineView pilot
asserts (portrait now lives in the sheet).

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: MachineWeaponsList — clean rows + per-weapon ammo

Restyle ranged weapon rows as clean, obviously-tappable buttons; move per-weapon ammo mini-bars (currently in `MachineAmmoPanel`) under each ranged weapon. **Preserve** `aria-label="Выстрел: <name>"` / `"Оружие недоступно"` and `onWeaponAttack`/`onWeaponInfo`/disabled logic.

**Files:**
- Modify: `src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx`
- Modify: `src/__tests__/components/unit-card/MachineView.test.tsx` (only if a weapon-ammo assert breaks — likely no change)

**Interfaces:**
- Consumes: same props as today (`weapons`, `weaponShots`, `fireRate`, `totalShotsUsed`, `currentAmmo`, `weaponAmmo`, `usePerWeaponAmmo`, `onWeaponAttack`, `onWeaponInfo`, `stepToCmFactor`).
- Produces: unchanged external behavior; visual restyle + per-weapon ammo rendered inline.

- [ ] **Step 1: Add a focused unit test for the preserved aria-label**

`src/__tests__/components/unit-card/MachineWeaponsList.test.tsx` — add (or confirm existing) test asserting the tap target aria-label is preserved:
```tsx
it('ranged weapon row has aria-label "Выстрел: <name>" and fires on click', () => {
  const onWeaponAttack = jest.fn();
  const weapons = [{ name: 'Пушка', range: 'D12', power: '2D6' }];
  const { container } = render(
    <MachineWeaponsList weapons={weapons} weaponShots={{}} fireRate={2} totalShotsUsed={0}
      currentAmmo={5} usePerWeaponAmmo={false} onWeaponAttack={onWeaponAttack} onWeaponInfo={jest.fn()}
      stepToCmFactor={5} />
  );
  const row = container.querySelector('[aria-label="Выстрел: Пушка"]');
  expect(row).toBeTruthy();
  fireEvent.click(row!);
  expect(onWeaponAttack).toHaveBeenCalledWith(0);
});

it('disabled ranged row has aria-label "Оружие недоступно"', () => {
  const weapons = [{ name: 'Пушка', range: 'D12', power: '2D6' }];
  const { container } = render(
    <MachineWeaponsList weapons={weapons} weaponShots={{}} fireRate={2} totalShotsUsed={2}
      currentAmmo={0} usePerWeaponAmmo={false} onWeaponAttack={jest.fn()} onWeaponInfo={jest.fn()}
      stepToCmFactor={5} />
  );
  expect(container.querySelector('[aria-label="Оружие недоступно"]')).toBeTruthy();
});
```
(If this test file doesn't exist, create it with the import `import { MachineWeaponsList } from '@/components/cards/unit-card/machine-view/MachineWeaponsList';` and `import { render, fireEvent } from '@testing-library/react';` plus a wrapping `describe`.)

- [ ] **Step 2: Run tests — they should already PASS against current code**

Run: `npm test -- MachineWeaponsList`
Expected: PASS (the current rows already carry these aria-labels). These tests guard the restyle.

- [ ] **Step 3: Restyle the ranged rows + inline per-weapon ammo**

In `MachineWeaponsList.tsx`, replace each ranged weapon `<div role="button" …>` with a cleaner full-width `<button>`-styled row (same handlers, same `aria-label`, same disabled logic). Key changes:
- Wrap name + special badge in the flex row; keep the range/power badges.
- When `usePerWeaponAmmo` is true and the weapon is ranged, render a thin per-weapon ammo mini-bar directly beneath the row:
  ```tsx
  {usePerWeaponAmmo && (
    <div className="flex items-center gap-1 px-1 mt-1">
      <span className="text-[8px] text-slate-500 lowercase truncate">{weapon.name}</span>
      <div className="flex-1 flex gap-px">
        {Array.from({ length: weaponMaxAmmo }).map((_, i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-sm', i < weaponAmmoCount ? 'bg-blue-500' : 'bg-slate-800')} />
        ))}
      </div>
      <span className="text-[9px] text-blue-400">{weaponAmmoCount}/{weaponMaxAmmo}</span>
    </div>
  )}
  ```
  Compute `weaponAmmoCount`/`weaponMaxAmmo` as in `MachineAmmoPanel` (`weaponAmmo?.[idx] ?? weapon.ammo ?? maxAmmo`; `weapon.ammo ?? maxAmmo`). Pass `maxAmmo` (= `currentAmmo` pool default) — note `MachineWeaponsList` receives `currentAmmo`; reuse it as the default max fallback (matches `MachineAmmoPanel`'s `maxAmmo` usage). Add `maxAmmo` to props if not present (it currently isn't) — add `maxAmmo: number` and have `MachineView` pass `machine.ammo_max`.

- [ ] **Step 4: Add `maxAmmo` prop and wire it**

In `MachineWeaponsListProps` add `maxAmmo: number;`. In `MachineView.tsx`, pass `maxAmmo={machine.ammo_max}` to `<MachineWeaponsList …/>`.

- [ ] **Step 5: Validate**

Run: `npm run validate`
Expected: PASS, including `MachineView.test` (weapon names still render) and the new aria-label tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(machine-card): #179 — clean weapon rows + inline per-weapon ammo

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: MachineAmmoPanel — slim to global bar

Per-weapon ammo moved to `MachineWeaponsList` (Task 5). Slim `MachineAmmoPanel` to the global ammo bar + shots indicator + ± buttons (Tehnolog). For `usePerWeaponAmmo`, the global bar shows the total (sum across weapons) read-only (the per-weapon breakdown lives under each weapon now).

**Files:**
- Modify: `src/components/cards/unit-card/machine-view/MachineAmmoPanel.tsx`
- Modify: `src/__tests__/components/unit-card/MachineAmmoPanel.test.tsx` (if it asserts the removed per-weapon block)

**Interfaces:**
- Props unchanged externally (`currentAmmo`, `maxAmmo`, `shotsUsed`, `fireRate`, `weapons`, `weaponAmmo`, `onUpdateAmmo`, `usePerWeaponAmmo`). Internal render drops the per-weapon `<div>` loop (lines ~150-183).

- [ ] **Step 1: Read the current MachineAmmoPanel test to find per-weapon asserts**

Run: `npm test -- MachineAmmoPanel` (baseline green). Open `src/__tests__/components/unit-card/MachineAmmoPanel.test.tsx`; note any `it` that queries per-weapon weapon-name text rendered by the panel — those will move/lose their target.

- [ ] **Step 2: Remove the per-weapon block from MachineAmmoPanel**

Delete the per-weapon ammo loop (`{usePerWeaponAmmo && weapons.map(…).filter(…).map(…)}`, roughly lines 150-183). Keep the combined ammo + shots header bar. For `usePerWeaponAmmo`, the combined bar already computes `totalWeaponAmmo`/`maxWeaponAmmo` (lines ~97-104) — keep that branch for the read-only total; just drop the per-weapon detail rows.

- [ ] **Step 3: Update the MachineAmmoPanel test**

Remove/adjust any test that asserted per-weapon weapon-name rendering inside the panel (those names now render in `MachineWeaponsList`'s inline bars). Keep tests for the global bar, ± buttons, and 44px touch targets.

- [ ] **Step 4: Validate**

Run: `npm run validate`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(machine-card): #179 — slim MachineAmmoPanel to global bar (per-weapon ammo moved to weapons list)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: MachineView — single cohesive card + Ram removal

Wrap all sections in ONE bordered card (sections become borderless, separated by spacing) and remove the disabled Ram button + its `meleeBonus` calc. Set the final section order: **status header → damage/repair row → weapons → ammo**. (Melee renders inside `MachineWeaponsList`; the alert bar renders inside the header.)

**Files:**
- Modify: `src/components/cards/unit-card/MachineView.tsx`
- Modify: `src/__tests__/components/unit-card/MachineView.test.tsx` (remove any ram assert if present)

**Interfaces:** No external prop changes. `MachineView`'s root `<div>` gains the single card styling; inner panels lose their own outer borders (done by editing each panel's root className — `MachineStatusHeader` already borderless after Task 4; `MachineAmmoPanel`/`MachineWeaponsList` root wrappers drop their `bg-slate-900/60 … border`).

- [ ] **Step 1: Confirm no test asserts the Ram button**

Run: `grep -rn "Таран\|ram\|Скоро" src/__tests__ e2e`
Expected: no hits (the Ram button has no test coverage). If hits appear, capture them for Step 4.

- [ ] **Step 2: Remove the Ram button + meleeBonus from MachineView**

In `MachineView.tsx`: delete the `meleeBonus` computation (the `.filter(w => w.range === 'ББ')…reduce(…)`) and the entire Ram-button `<div>` block. Remove the now-unused `Sword` import if lint flags it.

- [ ] **Step 3: Wrap sections in one cohesive card; strip inner panel borders**

In `MachineView.tsx`, change the root `<div className="space-y-1.5">` to a single card:
```tsx
return (
  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-3">
    <MachineStatusHeader … />
    {/* damage/repair row (from Task 4) */}
    <MachineWeaponsList … />
    <MachineAmmoPanel … />
    {pilotInfo && (<PilotSheet … />)}
  </div>
);
```
Reorder so the damage/repair row sits directly under the header, then weapons, then ammo. Then strip the individual panel chrome:
- In `MachineAmmoPanel.tsx`: change the root `<div className="space-y-1.5">` inner panel `<div className="relative bg-slate-900/60 p-1.5 rounded-sm">` → drop `bg-slate-900/60 … rounded-sm` and the tech-corner divs; keep content. (It's now a borderless section inside the cohesive card.)
- In `MachineWeaponsList.tsx`: the ranged/melee rows already use their own backgrounds — keep those (they're tappable cards, fine), but ensure the section has no competing outer card border.

- [ ] **Step 4: Validate**

Run: `npm run validate`
Expected: PASS. `MachineView.test` still green (прочность/боезапас/weapon names/ближний бой asserts intact; pilot chip assert from Task 4 intact).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(machine-card): #179 — single cohesive card + remove Ram button

Wrap status/weapons/ammo in one bordered card (sections borderless, separated
by spacing). Remove the unimplemented Ram button + meleeBonus calc. Final
order: header → damage/repair → weapons → ammo.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: a11y coverage for new components + full regression

Repoint the a11y test to the new components (44px touch targets, focusable buttons, disabled states) and run the full unit + E2E regression to confirm nothing regressed (especially the #163 defender test and the `Выстрел:` weapon selector).

**Files:**
- Modify: `src/__tests__/a11y/unit-card-accessibility.test.tsx`

- [ ] **Step 1: Add a11y coverage for PilotChip, PilotSheet, MachineStatusHeader**

In `src/__tests__/a11y/unit-card-accessibility.test.tsx`, import the new components and add, inside the existing `describe('Minimum touch target size (44x44px)', …)`:
```tsx
describe('PilotChip', () => {
  it('chip meets 44px min touch target', () => {
    const { container } = render(<PilotChip pilotInfo={null} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('min-h-[44px]');
  });
});

describe('PilotSheet', () => {
  it('buttons meet 44px min touch target', () => {
    const { container } = render(<PilotSheet
      isOpen={true} onClose={jest.fn()}
      pilotInfo={{ squadInstanceId: 's', soldierIndex: 0, pilotArmor: 2, alive: true }}
      pilotImage={null} survivalTest={null} isTestRunning={false}
      onSurvivalTest={jest.fn()} onAssignPilot={jest.fn()} />);
    container.querySelectorAll('button').forEach(b => {
      expect(b.className).toContain('min-h-[44px]');
    });
  });
});
```
Add a `describe('MachineStatusHeader', …)` block asserting the damage/repair row buttons (rendered in `MachineView` — cover via the existing `MachineView.test` instead if rendering the header standalone needs too many props) carry `min-h-[44px]`. Prefer asserting on `MachineView` render for the damage/repair row.

- [ ] **Step 2: Validate**

Run: `npm run validate`
Expected: PASS.

- [ ] **Step 3: Run full E2E regression**

Run: `npm run test:e2e`
Expected: ALL GREEN. Pay attention to:
- `defender-pilot-test.spec.ts` — damage button (`/урон/i` / `svg.lucide-flame`) → `pilot-survival-test-button` appears → tap → modal.
- `pilot-functionality.spec.ts` — `assign-pilot-button` → `confirm-pilot-assignment`.
- `aimed-shot.spec.ts` — `getByRole('button', { name: /Выстрел:/i })` present & clickable.
- `combat.spec.ts`, `battle-buffs.spec.ts` — machine weapon fire still works.

If any E2E fails on a selector, fix the **component** to restore the selector (do not weaken the E2E) — re-read the Global Constraints preservation list.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test(machine-card): #179 — a11y coverage for PilotChip/PilotSheet + full regression green

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review Notes (plan author)

- **Spec coverage:** cohesive card (T7), clean-grid header (T4), weapons-as-primary (T5), pilot chip→sheet (T2/T3/T4), #163 amber bar preserved (T4), dead-code + ram removal (T1/T7), mobile-first 44px (T8 + Global), all functionality retained (no behavior change; only damage/repair relocated + portrait moved to sheet).
- **Selector preservation:** `assign-pilot-button` (T2 PilotChip), `pilot-survival-test-button` (T4 verbatim), `confirm-pilot-assignment` (untouched), `Выстрел:` aria-label (T5 guarded by test), damage `/урон/i` + `lucide-flame` (T4 row).
- **Known refinement vs. mockup:** damage/repair live in a secondary row directly under the header (co-located with durability bar above, actions below) — matches the approved final-card mockup. The portrait is only in `PilotSheet` (approved).
- **Type consistency:** `PilotChipProps.onOpenPilot`, `MachineStatusHeaderProps.onOpenPilot`, `PilotSheetProps` signatures align across T2/T3/T4. `MachineWeaponsList` gains `maxAmmo` (T4 wires it).
