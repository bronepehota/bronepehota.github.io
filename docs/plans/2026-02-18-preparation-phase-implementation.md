# "Готовьте войска!" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the "Готовьте войска!" (Preparation) phase into the main army setup flow as the 5th step, with a minimalist redesign showing unit photos.

**Architecture:** Extend the existing 4-step setup flow to 5 steps by:
1. Adding a new `PrepArmyList` component to display units with soldier photos
2. Redesigning `BattlePreparationScreen` to remove duplicate headers
3. Updating `StepProgressIndicator` to show 5 steps
4. Integrating the preparation phase into `ArmyBuilder` flow
5. Updating navigation flow to go through preparation before battle

**Tech Stack:** TypeScript, React, Next.js 14, Tailwind CSS, Jest (unit tests), Playwright (E2E tests)

**Design Document:** `docs/plans/2026-02-18-preparation-phase-design.md`

---

## Task 1: Create PrepArmyList component

**Files:**
- Create: `src/components/preparation/PrepArmyList.tsx`

**Step 1: Write the failing test**

Create file: `src/__tests__/PrepArmyList.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { PrepArmyList } from '../components/preparation/PrepArmyList';
import { Army } from '../lib/types';

const mockArmy: Army = {
  name: 'Test Army',
  faction: 'polaris',
  units: [
    {
      instanceId: 'test_1',
      type: 'squad',
      data: {
        id: 'polaris_light_assault_clone',
        name: 'Штурмовики',
        soldiers: [
          { num: 1, image: '/images/soldiers/1.jpg', rank: 7 },
          { num: 2, image: '/images/soldiers/2.jpg', rank: 6 },
        ],
      } as any,
      instanceNumber: 1,
    },
  ],
  totalCost: 100,
  currentStep: 'unit-select',
};

describe('PrepArmyList', () => {
  it('renders squad with soldier images', () => {
    render(<PrepArmyList army={mockArmy} factionId="polaris" />);
    expect(screen.getByText('ШТУРМОВИКИ')).toBeInTheDocument();
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(2);
  });

  it('shows empty state when no units', () => {
    const emptyArmy = { ...mockArmy, units: [] };
    render(<PrepArmyList army={emptyArmy} factionId="polaris" />);
    expect(screen.getByText('Армия пуста')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- PrepArmyList.test.tsx`
Expected: FAIL with "Cannot find module '../components/preparation/PrepArmyList'"

**Step 3: Write minimal implementation**

Create file: `src/components/preparation/PrepArmyList.tsx`

```tsx
'use client';

import { Army, ArmyUnit, FactionID } from '@/lib/types';
import SafeImage from '@/components/SafeImage';
import { Squad } from '@/lib/types';

interface PrepArmyListProps {
  army: Army;
  factionId: FactionID;
}

export function PrepArmyList({ army, factionId }: PrepArmyListProps) {
  if (army.units.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Армия пуста. Вернитесь к сбору армии.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" data-testid="prep-army-list">
      {army.units.map((unit) => {
        const title = unit.instanceNumber > 1
          ? `${unit.data.name} #${unit.instanceNumber}`
          : unit.data.name;

        if (unit.type === 'squad') {
          const squad = unit.data as Squad;
          const soldiers = squad.soldiers || [];

          return (
            <div key={unit.instanceId} className="space-y-2">
              <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
                {title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {soldiers.map((soldier) => (
                  <div
                    key={soldier.num}
                    className="relative w-[60px] h-[80px] flex-shrink-0"
                  >
                    <SafeImage
                      src={soldier.image || squad.image || '/images/placeholder.png'}
                      alt={`Боец ${soldier.num}`}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Machine
        return (
          <div key={unit.instanceId} className="space-y-2">
            <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
              {title}
            </h3>
            <div className="w-[60px] h-[80px] relative">
              <SafeImage
                src={unit.data.image || '/images/placeholder.png'}
                alt={unit.data.name}
                fill
                className="object-cover rounded"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- PrepArmyList.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/preparation/PrepArmyList.tsx src/__tests__/PrepArmyList.test.tsx
git commit -m "feat: add PrepArmyList component with soldier images

- Create new component to display army units with photos
- Show squad soldiers in a row, machines with single image
- Add empty state when no units
- Add unit tests

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Update StepProgressIndicator to 5 steps

**Files:**
- Modify: `src/components/rules/StepProgressIndicator.tsx`

**Step 1: Write the failing test**

Add to `src/__tests__/StepProgressIndicator.test.tsx` (create if not exists):

```tsx
import { render, screen } from '@testing-library/react';
import { StepProgressIndicator } from '../components/rules/StepProgressIndicator';

describe('StepProgressIndicator', () => {
  it('shows 5 steps total', () => {
    render(<StepProgressIndicator currentStep="preparation" selectedFaction="polaris" />);
    const steps = screen.getAllByRole('button');
    expect(steps).toHaveLength(5);
  });

  it('highlights preparation step as active', () => {
    render(<StepProgressIndicator currentStep="preparation" selectedFaction="polaris" />);
    const activeStep = screen.getByLabelText(/Шаг 5.*текущий шаг/);
    expect(activeStep).toBeInTheDocument();
  });

  it('shows first 4 steps as completed on preparation', () => {
    render(<StepProgressIndicator currentStep="preparation" selectedFaction="polaris" />);
    // Check for completed state (check icons)
    const completedSteps = screen.getAllByRole('button').slice(0, 4);
    completedSteps.forEach(step => {
      expect(step).toHaveClass(/text-green/);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- StepProgressIndicator.test.tsx`
Expected: FAIL - currently shows only 4 steps, or 'preparation' not handled

**Step 3: Update implementation**

Modify: `src/components/rules/StepProgressIndicator.tsx`

1. Add import:
```tsx
import { Shield, Coins, Book, Users, Sword } from 'lucide-react';
```

2. Update steps array (around line 14):
```tsx
const steps: Step[] = [
  { id: 1, label: 'Фракция', description: 'Выберите сторону конфликта', icon: Shield },
  { id: 2, label: 'Бюджет', description: 'Установите лимит очков армии', icon: Coins },
  { id: 3, label: 'Правила', description: 'Выберите версию правил', icon: Book },
  { id: 4, label: 'Армия', description: 'Соберите свою армию', icon: Users },
  { id: 5, label: 'Расстановка', description: 'Подготовьтесь к бою', icon: Sword },
];
```

3. Update interface (around line 22):
```tsx
interface StepProgressIndicatorProps {
  currentStep: 'faction' | 'budget' | 'rules' | 'units' | 'preparation' | 'complete';
  selectedFaction?: FactionID;
  selectedBudget?: number;
  selectedRules?: RulesVersionID;
}
```

4. Update getStepIndex function (around line 46):
```tsx
const getStepIndex = (): number => {
  switch (currentStep) {
    case 'faction': return 0;
    case 'budget': return 1;
    case 'rules': return 2;
    case 'units': return 3;
    case 'preparation': return 4;
    case 'complete': return 4;
    default: return 0;
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- StepProgressIndicator.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/rules/StepProgressIndicator.tsx src/__tests__/StepProgressIndicator.test.tsx
git commit -m "feat: add 5th step (preparation) to StepProgressIndicator

- Add 'Расстановка' step with Sword icon
- Update types to include 'preparation' in currentStep
- Update getStepIndex to handle 5 steps

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Update UnitSelector onToBattle handler

**Files:**
- Modify: `src/components/UnitSelector.tsx`

**Step 1: Update the onToBattle callback**

Find the `onToBattle` prop usage in UnitSelector (around line 440+). The button handler needs to set `currentStep: 'preparation'` instead of `'battle'` and NOT set `isInBattle: true`.

Look for the button with text "В БОЙ" or similar, and update its handler:

```tsx
// Change from:
onToBattle={() => {
  setArmy({ ...army, isInBattle: true, currentStep: 'battle' });
}}

// To:
onToBattle={() => {
  setArmy({ ...army, currentStep: 'preparation' });
}}
```

Note: The actual implementation is in the parent (ArmyBuilder), but UnitSelector calls the prop. Find where the button calls `onToBattle` and ensure it's not passing extra state.

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS - no type errors

**Step 3: Manual verification**

Run: `npm run dev`
Navigate to app, add units, click "В БОЙ" - should show preparation step highlighted.

**Step 4: Commit**

```bash
git add src/components/UnitSelector.tsx
git commit -m "feat: update onToBattle to go to preparation step

Change button handler to set currentStep='preparation'
instead of going directly to battle.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Update ArmyBuilder to handle preparation step

**Files:**
- Modify: `src/components/ArmyBuilder.tsx`

**Step 1: Update setupStep type and initialization**

Modify the useState for setupStep (around line 65):

```tsx
const [setupStep, setSetupStep] = useState<'faction' | 'budget' | 'rules' | 'units' | 'preparation'>(() => {
  if (army.currentStep === 'unit-select') return 'units';
  if (army.currentStep === 'preparation') return 'preparation';
  return 'faction';
});
```

**Step 2: Update sync effect**

Modify the useEffect that syncs setupStep with army.currentStep (around line 71):

```tsx
useEffect(() => {
  if (army.currentStep === 'faction-select' && (setupStep === 'units' || setupStep === 'rules' || setupStep === 'budget' || setupStep === 'preparation')) {
    setSetupStep('faction');
  } else if (army.currentStep === 'unit-select' && setupStep !== 'units') {
    setSetupStep('units');
  } else if (army.currentStep === 'preparation' && setupStep !== 'preparation') {
    setSetupStep('preparation');
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [army.currentStep]);
```

**Step 3: Add preparation step rendering**

Add new conditional rendering after the `unit-select` block (after line 160):

```tsx
{/* Preparation Step */}
{setupStep === 'preparation' && army.pointBudget && (
  <>
    <StepProgressIndicator
      currentStep={setupStep}
      selectedFaction={army.faction}
      selectedBudget={army.pointBudget}
      selectedRules={rulesVersion}
    />
    <BattlePreparationScreen
      army={army}
      setArmy={setArmy}
      onStartBattle={() => {
        setArmy({ ...army, isInBattle: true, currentStep: 'battle' });
        onEnterBattle?.();
      }}
      onBackToBuilder={() => {
        setSetupStep('units');
        setArmy({ ...army, currentStep: 'unit-select' });
      }}
    />
  </>
)}
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ArmyBuilder.tsx
git commit -m "feat: integrate preparation step into ArmyBuilder

- Add 'preparation' to setupStep type
- Add rendering of BattlePreparationScreen at preparation step
- Add navigation: back to units, forward to game

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Redesign BattlePreparationScreen

**Files:**
- Modify: `src/components/BattlePreparationScreen.tsx`

**Step 1: Remove the header block**

Delete lines 77-102 (the entire header block with back button, title, and faction indicator).

**Step 2: Replace CompactArmyCard with PrepArmyList**

1. Add import:
```tsx
import { PrepArmyList } from './preparation/PrepArmyList';
```

2. Find and remove the army list section (around lines 129-162) that uses `CompactArmyCard`.

3. Replace with PrepArmyList:
```tsx
{/* Army list with PrepArmyList */}
<div className="max-w-4xl mx-auto px-4 py-6">
  <PrepArmyList army={army} factionId={army.faction} />
</div>
```

**Step 3: Run dev server to verify**

Run: `npm run dev`
Navigate through flow to preparation step - should see simplified UI with just instruction text and unit photos.

**Step 4: Commit**

```bash
git add src/components/BattlePreparationScreen.tsx
git commit -m "refactor: redesign BattlePreparationScreen

- Remove duplicate header (use main header from page.tsx)
- Replace CompactArmyCard with PrepArmyList
- Simplify to minimal design with unit photos only

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Remove unused view state from page.tsx

**Files:**
- Modify: `src/app/app/page.tsx`

**Step 1: Remove 'preparation' from view type**

The view state should only be 'builder' | 'game'. Remove 'preparation'.

Find the view useState (around line 17) and simplify:

```tsx
const [view, setView] = useState<'builder' | 'game'>(() => {
  if (typeof window === 'undefined') return 'builder';
  const saved = localStorage.getItem('bronepehota_view');
  return (saved === 'builder' || saved === 'game') ? saved : 'builder';
});
```

**Step 2: Remove preparation-specific rendering**

Find and remove any `view === 'preparation'` conditional rendering (around line 444).

The BattlePreparationScreen is now rendered inside ArmyBuilder, not at page level.

**Step 3: Update view navigation**

Remove `handleEnterBattle` and `handleReturnToBuilderFromPrep` functions - no longer needed.

**Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/app/page.tsx
git commit -m "refactor: remove preparation view state from page.tsx

- BattlePreparationScreen now rendered within ArmyBuilder
- Simplify view state to 'builder' | 'game' only
- Remove unused handler functions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Update types in types.ts

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Update Army.currentStep type**

Find the `Army` interface and update `currentStep` type:

```tsx
interface Army {
  name: string;
  faction: FactionID;
  units: ArmyUnit[];
  totalCost: number;
  pointBudget?: number;
  currentStep: 'faction-select' | 'unit-select' | 'preparation' | 'battle';
  isInBattle: boolean;
  currentTurn: number;
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add 'preparation' to Army.currentStep type

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Write E2E tests

**Files:**
- Create: `e2e/preparation-phase.spec.ts`

**Step 1: Create E2E test file**

Create: `e2e/preparation-phase.spec.ts`

```tsx
import { test, expect } from '@playwright/test';

test.describe('Preparation Phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('completes flow to preparation step', async ({ page }) => {
    // Faction
    await page.click('[data-testid="faction-card-polaris"]');
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(300);

    // Budget
    await page.click('button:has-text("350")');
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(300);

    // Rules
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(300);

    // Add unit
    await page.click('[data-testid="add-unit-button-polaris_light_assault_clone"]');
    await page.waitForTimeout(300);

    // Go to preparation
    await page.click('[data-testid="to-battle-button"]');
    await page.waitForTimeout(300);

    // Verify 5th step is highlighted
    const step5 = page.getByLabel(/Шаг 5.*текущий шаг/);
    await expect(step5).toBeVisible();

    // Verify preparation screen is shown
    await expect(page.getByText('ГОТОВЬТЕ ВОЙСКА!')).toBeVisible();
  });

  test('displays soldier images for squad units', async ({ page }) => {
    // Navigate to preparation with a squad
    await page.goto('/app');
    await page.click('[data-testid="faction-card-polaris"]');
    await page.click('[data-testid="faction-continue-button"]');
    await page.click('button:has-text("350")');
    await page.click('[data-testid="budget-next-button"]');
    await page.click('[data-testid="rules-confirm-button"]');
    await page.click('[data-testid="add-unit-button-polaris_light_assault_clone"]');
    await page.click('[data-testid="to-battle-button"]');

    // Check for soldier images
    const images = await page.locator('[data-testid="prep-army-list"] img').count();
    expect(images).toBeGreaterThanOrEqual(6); // Light Assault Clone has 6 soldiers
  });

  test('shows empty state when army is empty', async ({ page }) => {
    // Navigate to preparation without adding units
    await page.goto('/app');
    await page.click('[data-testid="faction-card-polaris"]');
    await page.click('[data-testid="faction-continue-button"]');
    await page.click('button:has-text("350")');
    await page.click('[data-testid="budget-next-button"]');
    await page.click('[data-testid="rules-confirm-button"]');
    await page.click('[data-testid="to-battle-button"]'); // This might be disabled

    const emptyMessage = page.getByText('Армия пуста');
    await expect(emptyMessage).toBeVisible();
  });

  test('navigates back to unit select from preparation', async ({ page }) => {
    await page.goto('/app');
    await page.click('[data-testid="faction-card-polaris"]');
    await page.click('[data-testid="faction-continue-button"]');
    await page.click('button:has-text("350")');
    await page.click('[data-testid="budget-next-button"]');
    await page.click('[data-testid="rules-confirm-button"]');
    await page.click('[data-testid="add-unit-button-polaris_light_assault_clone"]');
    await page.click('[data-testid="to-battle-button"]');

    // Click back button in header
    await page.click('[data-testid="back-to-faction-button"]');

    // Should be back in unit selector
    await expect(page.getByTestId('unit-selector')).toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e -- preparation-phase.spec.ts`
Expected: Some tests may fail initially due to data-testid mismatches - update selectors as needed

**Step 3: Commit**

```bash
git add e2e/preparation-phase.spec.ts
git commit -m "test: add E2E tests for preparation phase

- Test complete flow to preparation step
- Test soldier images display
- Test empty army state
- Test back navigation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Create preparation directory

**Files:**
- Create: `src/components/preparation/`

**Step 1: Create directory**

Run: `mkdir -p src/components/preparation`

**Step 2: Create index file for cleaner imports**

Create: `src/components/preparation/index.ts`

```tsx
export { BattlePreparationScreen } from './BattlePreparationScreen';
export { PrepArmyList } from './PrepArmyList';
```

**Step 3: Move BattlePreparationScreen to preparation directory**

Run: `git mv src/components/BattlePreparationScreen.tsx src/components/preparation/BattlePreparationScreen.tsx`

**Step 4: Update imports**

Update imports in files that reference BattlePreparationScreen:
- `src/app/app/page.tsx`
- `src/components/ArmyBuilder.tsx`

Change from:
```tsx
import { BattlePreparationScreen } from '@/components/BattlePreparationScreen';
```

To:
```tsx
import { BattlePreparationScreen } from '@/components/preparation';
```

**Step 5: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/preparation/
git commit -m "refactor: organize preparation components

- Create dedicated preparation/ directory
- Move BattlePreparationScreen into preparation/
- Add index.ts for cleaner imports
- Update import paths

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Final integration and polish

**Step 1: Run all tests**

Run: `npm run validate`
Expected: All type checks, linters, and unit tests pass

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 3: Manual smoke test**

Run: `npm run dev`

Test the full flow:
1. Select faction → Budget → Rules
2. Add units → Click "В БОЙ"
3. Verify preparation screen shows with unit photos
4. Click "Начать бой" → verify initiative modal opens
5. Complete initiative → verify game session starts
6. Use back button to return to unit select

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete preparation phase integration

Full integration of "Готовьте войска!" as 5th step in army setup:
- PrepArmyList displays units with soldier photos
- StepProgressIndicator shows 5 steps
- Flow: Faction → Budget → Rules → Army → Preparation → Game
- E2E tests cover full flow
- Minimal UI design without duplicate headers

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

This implementation plan integrates the "Готовьте войска!" preparation phase into the main army setup flow as the 5th step. The new flow is:

**Фракция → Бюджет → Правила → Армия → Готовьте войска! → Игра**

Key changes:
1. New `PrepArmyList` component displays units with soldier/machine photos
2. `StepProgressIndicator` updated to 5 steps
3. `BattlePreparationScreen` redesigned with minimal UI (no duplicate header)
4. Preparation phase integrated into `ArmyBuilder` flow
5. E2E tests cover the new flow

**Total estimated time:** 2-3 hours

**Files modified/created:**
- `src/components/preparation/PrepArmyList.tsx` (new)
- `src/components/preparation/BattlePreparationScreen.tsx` (moved, edited)
- `src/components/preparation/index.ts` (new)
- `src/components/rules/StepProgressIndicator.tsx` (edited)
- `src/components/UnitSelector.tsx` (edited)
- `src/components/ArmyBuilder.tsx` (edited)
- `src/app/app/page.tsx` (edited)
- `src/lib/types.ts` (edited)
- `e2e/preparation-phase.spec.ts` (new)
- `src/__tests__/PrepArmyList.test.tsx` (new)
- `src/__tests__/StepProgressIndicator.test.tsx` (new)
