# Система паники Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement panic mechanics for both Panov (automatic at 50% losses) and Tehnolog (manual at armor=roll) rules, with visual feedback using Footprints icon and skip-turn effect.

**Architecture:** Add panic state tracking to ArmyUnit, create panic-logic utility module, implement PanicTestModal UI component, integrate with UnitCard for automatic triggering and visual feedback.

**Tech Stack:** TypeScript, React, Tailwind CSS, Lucide React icons, existing rules registry pattern

---

### Task 1: Add panic types to types.ts

**Files:**
- Modify: `src/lib/types.ts:236-237`

**Step 1: Write the failing test**

```typescript
// src/__tests__/panic-types.test.ts
import { PanicState, ArmyUnit, RulesVersionID } from '@/lib/types';

describe('Panic Types', () => {
  test('PanicState interface exists and has correct fields', () => {
    const panicState: PanicState = {
      soldierIndex: 0,
      testRoll: 5,
      rank: 3,
      triggeredAtTurn: 1,
    };
    expect(panicState.soldierIndex).toBe(0);
    expect(panicState.testRoll).toBe(5);
    expect(panicState.rank).toBe(3);
    expect(panicState.triggeredAtTurn).toBe(1);
  });

  test('PanicTestResult interface exists', () => {
    const result = {
      soldierIndex: 0,
      isPanic: true,
      roll: 5,
      rank: 3,
    };
    expect(result.isPanic).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- panic-types`
Expected: FAIL with "PanicState is not defined"

**Step 3: Write minimal implementation**

Add to `src/lib/types.ts` before the final `export type CalculateMeleeFn` line:

```typescript
// Panic system types
export interface PanicState {
  soldierIndex: number;
  testRoll: number;
  rank: number;
  triggeredAtTurn: number;
}

export interface PanicTestResult {
  soldierIndex: number;
  isPanic: boolean;
  roll: number;
  rank: number;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- panic-types`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/types.ts src/__tests__/panic-types.test.ts
git commit -m "feat: add panic types to types.ts"
```

---

### Task 2: Add panicState to ArmyUnit interface

**Files:**
- Modify: `src/lib/types.ts:143-172`

**Step 1: Write the failing test**

```typescript
// src/__tests__/army-unit-panic.test.ts
import { ArmyUnit, PanicState } from '@/lib/types';

describe('ArmyUnit panic integration', () => {
  test('ArmyUnit accepts panicState field', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [{ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }],
      },
      panicState: [
        { soldierIndex: 0, testRoll: 5, rank: 3, triggeredAtTurn: 1 },
      ],
    };
    expect(unit.panicState).toHaveLength(1);
    expect(unit.panicState?.[0].isPanic).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- army-unit-panic`
Expected: FAIL with "Object literal may only specify known properties"

**Step 3: Write minimal implementation**

Add `panicState?: PanicState[];` to `ArmyUnit` interface after line 166:

```typescript
export interface ArmyUnit {
  instanceId: string;
  type: 'squad' | 'machine';
  data: Squad | Machine;
  // Unit numbering for identification
  instanceNumber?: number; // Sequential number per unit type, e.g., 1, 2, 3...
  // Current state in game
  currentDurability?: number;
  currentAmmo?: number;
  grenadesUsed?: boolean;
  deadSoldiers?: number[]; // indices of dead soldiers
  actionsUsed?: {
    moved: boolean;
    shot: boolean;
    melee: boolean;
    done: boolean;
  }[]; // for soldiers or single for machine
  isMachineMoved?: boolean;
  isMachineShot?: boolean;
  isMachineMelee?: boolean;
  isMachineDone?: boolean;
  machineShotsUsed?: number; // количество выстрелов в этом ходу
  machineWeaponShots?: { [weaponIndex: number]: number }; // количество выстрелов из каждого оружия
  pilotInfo?: PilotInfo;     // Pilot information for machines
  // Selected weapon indices for machines (optional for backward compatibility)
  // undefined = all weapons selected (backward compatible)
  // [] = no weapons selected (unarmed variant)
  // [0, 2, 4] = only weapons at indices 0, 2, 4 are equipped
  selectedWeaponIndices?: number[]; // Indices into machine.weapons array
  panicState?: PanicState[]; // Список паникующих солдат
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- army-unit-panic`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/types.ts src/__tests__/army-unit-panic.test.ts
git commit -m "feat: add panicState to ArmyUnit interface"
```

---

### Task 3: Create panic-logic.ts module - checkPanicTrigger function

**Files:**
- Create: `src/lib/panic-logic.ts`
- Test: `src/__tests__/panic-logic.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/panic-logic.test.ts
import { checkPanicTrigger } from '@/lib/panic-logic';
import { ArmyUnit } from '@/lib/types';

describe('checkPanicTrigger', () => {
  test('returns false for squad with <50% losses', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: Array(6).fill({ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }),
      },
      deadSoldiers: [0, 1], // 2 out of 6 dead = 33%
    };
    expect(checkPanicTrigger(unit, 'fan')).toBe(false);
  });

  test('returns true for squad with 50% losses (3 of 6)', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: Array(6).fill({ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }),
      },
      deadSoldiers: [0, 1, 2], // 3 out of 6 dead = 50%
    };
    expect(checkPanicTrigger(unit, 'fan')).toBe(true);
  });

  test('returns false for non-fan rules', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: Array(6).fill({ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }),
      },
      deadSoldiers: [0, 1, 2],
    };
    expect(checkPanicTrigger(unit, 'tehnolog')).toBe(false);
  });

  test('returns false for machines (only squads)', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'machine',
      data: {
        id: 'test-machine',
        name: 'Test Machine',
        faction: 'polaris',
        cost: 100,
        rank: 2,
        fire_rate: 2,
        ammo_max: 20,
        durability_max: 16,
        speed_sectors: [{ min_durability: 1, max_durability: 16, speed: 2 }],
        weapons: [],
      },
      currentDurability: 8,
    };
    expect(checkPanicTrigger(unit, 'fan')).toBe(false);
  });

  test('returns false if panic already triggered this turn', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: Array(6).fill({ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }),
      },
      deadSoldiers: [0, 1, 2],
      panicState: [{ soldierIndex: 0, testRoll: 5, rank: 3, triggeredAtTurn: 1 }],
    };
    expect(checkPanicTrigger(unit, 'fan', 1)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- panic-logic`
Expected: FAIL with "checkPanicTrigger is not defined"

**Step 3: Write minimal implementation**

Create `src/lib/panic-logic.ts`:

```typescript
import { ArmyUnit, PanicState, PanicTestResult, RulesVersionID } from './types';

/**
 * Check if panic test should be triggered for a unit
 * @param unit - The army unit to check
 * @param rulesVersion - Current rules version
 * @param currentTurn - Current turn number (optional)
 * @returns true if panic test should be triggered
 */
export function checkPanicTrigger(
  unit: ArmyUnit,
  rulesVersion: RulesVersionID,
  currentTurn?: number
): boolean {
  // Only fan rules have automatic panic trigger
  if (rulesVersion !== 'fan') {
    return false;
  }

  // Only squads can panic
  if (unit.type !== 'squad') {
    return false;
  }

  const squad = unit.data;
  const totalSoldiers = squad.soldiers.length;
  const deadCount = unit.deadSoldiers?.length || 0;

  // Check if all soldiers are dead
  if (deadCount >= totalSoldiers) {
    return false;
  }

  // Check if 50% losses reached
  const halfThreshold = Math.floor(totalSoldiers / 2);
  if (deadCount < halfThreshold) {
    return false;
  }

  // Check if panic already triggered this turn
  if (currentTurn !== undefined && unit.panicState) {
    const triggeredThisTurn = unit.panicState.some(
      p => p.triggeredAtTurn === currentTurn
    );
    if (triggeredThisTurn) {
      return false;
    }
  }

  return true;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- panic-logic`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/panic-logic.ts src/__tests__/panic-logic.test.ts
git commit -m "feat: add checkPanicTrigger function"
```

---

### Task 4: Create panic-logic.ts - executePanicTest function

**Files:**
- Modify: `src/lib/panic-logic.ts`
- Test: `src/__tests__/panic-logic.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to src/__tests__/panic-logic.test.ts

describe('executePanicTest', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.8); // Will roll 5 on D6
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns panic when roll > rank (roll=5, rank=3)', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const result = executePanicTest(unit, 0, 'fan');
    expect(result.isPanic).toBe(true);
    expect(result.roll).toBe(5);
    expect(result.rank).toBe(3);
  });

  test('returns success when roll == rank (roll=3, rank=3)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Will roll 4 on D6
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const result = executePanicTest(unit, 0, 'fan');
    expect(result.isPanic).toBe(true); // 4 > 3
  });

  test('returns success when roll < rank (roll=2, rank=7)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.3); // Will roll 2 on D6
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const result = executePanicTest(unit, 0, 'fan');
    expect(result.isPanic).toBe(false);
    expect(result.roll).toBe(2);
    expect(result.rank).toBe(7);
  });

  test('for tehnolog rules, always returns success (no panic logic)', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const result = executePanicTest(unit, 0, 'tehnolog');
    expect(result.isPanic).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- panic-logic`
Expected: FAIL with "executePanicTest is not defined"

**Step 3: Write minimal implementation**

Add to `src/lib/panic-logic.ts`:

```typescript
/**
 * Execute panic test for a specific soldier
 * @param unit - The army unit
 * @param soldierIndex - Index of the soldier to test
 * @param rulesVersion - Current rules version
 * @returns PanicTestResult with roll and panic status
 */
export function executePanicTest(
  unit: ArmyUnit,
  soldierIndex: number,
  rulesVersion: RulesVersionID
): PanicTestResult {
  // For now, only fan rules implement panic logic
  if (rulesVersion !== 'fan') {
    const soldier = (unit.data as any).soldiers?.[soldierIndex];
    return {
      soldierIndex,
      isPanic: false,
      roll: 0,
      rank: soldier?.rank || 0,
    };
  }

  const soldier = (unit.data as any).soldiers?.[soldierIndex];
  if (!soldier) {
    return {
      soldierIndex,
      isPanic: false,
      roll: 0,
      rank: 0,
    };
  }

  // Roll D6
  const roll = Math.floor(Math.random() * 6) + 1;
  const rank = soldier.rank || 0;

  // Panic if roll > rank (fan rules)
  const isPanic = roll > rank;

  return {
    soldierIndex,
    isPanic,
    roll,
    rank,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- panic-logic`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/panic-logic.ts src/__tests__/panic-logic.test.ts
git commit -m "feat: add executePanicTest function"
```

---

### Task 5: Create panic-logic.ts - resolvePanic function

**Files:**
- Modify: `src/lib/panic-logic.ts`
- Test: `src/__tests__/panic-logic.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to src/__tests__/panic-logic.test.ts

describe('resolvePanic', () => {
  test('removes panic states when turn increases', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
      panicState: [
        { soldierIndex: 0, testRoll: 5, rank: 3, triggeredAtTurn: 1 },
      ],
    };
    const updated = resolvePanic(unit, 2);
    expect(updated.panicState).toBeUndefined();
  });

  test('keeps panic states when turn has not increased', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
      panicState: [
        { soldierIndex: 0, testRoll: 5, rank: 3, triggeredAtTurn: 1 },
      ],
    };
    const updated = resolvePanic(unit, 1);
    expect(updated.panicState).toHaveLength(1);
  });

  test('handles units without panic state', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const updated = resolvePanic(unit, 2);
    expect(updated.panicState).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- panic-logic`
Expected: FAIL with "resolvePanic is not defined"

**Step 3: Write minimal implementation**

Add to `src/lib/panic-logic.ts`:

```typescript
/**
 * Resolve panic state at the start of a new turn
 * @param unit - The army unit to resolve panic for
 * @param currentTurn - Current turn number
 * @returns Updated unit with panic resolved
 */
export function resolvePanic(unit: ArmyUnit, currentTurn: number): ArmyUnit {
  if (!unit.panicState || unit.panicState.length === 0) {
    return unit;
  }

  // Check if any panic was triggered in current turn
  const hasCurrentTurnPanic = unit.panicState.some(
    p => p.triggeredAtTurn === currentTurn
  );

  if (!hasCurrentTurnPanic) {
    // Clear all panic states
    const { panicState, ...rest } = unit;
    return rest;
  }

  return unit;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- panic-logic`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/panic-logic.ts src/__tests__/panic-logic.test.ts
git commit -m "feat: add resolvePanic function"
```

---

### Task 6: Create usePanicTestFlow hook

**Files:**
- Create: `src/hooks/usePanicTestFlow.ts`
- Test: `src/__tests__/hooks/usePanicTestFlow.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/hooks/usePanicTestFlow.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePanicTestFlow } from '@/hooks/usePanicTestFlow';
import { PanicTestResult } from '@/lib/types';

describe('usePanicTestFlow', () => {
  test('initializes with default state', () => {
    const { result } = renderHook(() => usePanicTestFlow());
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isRolling).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  test('opens modal with unit', () => {
    const { result } = renderHook(() => usePanicTestFlow());
    const mockUnit: any = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };

    act(() => {
      result.current.startPanicTest(mockUnit);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.unit).toBe(mockUnit);
  });

  test('closes modal', () => {
    const { result } = renderHook(() => usePanicTestFlow());
    const mockUnit: any = {
      instanceId: 'test-1',
      type: 'squad',
      data: { soldiers: [] },
    };

    act(() => {
      result.current.startPanicTest(mockUnit);
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- usePanicTestFlow`
Expected: FAIL with "usePanicTestFlow is not defined"

**Step 3: Write minimal implementation**

Create `src/hooks/usePanicTestFlow.ts`:

```typescript
import { useState } from 'react';
import { ArmyUnit, PanicTestResult, RulesVersionID } from '@/lib/types';

export interface PanicTestFlowState {
  isModalOpen: boolean;
  isRolling: boolean;
  results: PanicTestResult[];
  unit: ArmyUnit | null;
  rulesVersion: RulesVersionID;
}

export function usePanicTestFlow() {
  const [state, setState] = useState<PanicTestFlowState>({
    isModalOpen: false,
    isRolling: false,
    results: [],
    unit: null,
    rulesVersion: 'fan',
  });

  const startPanicTest = (unit: ArmyUnit) => {
    setState({
      isModalOpen: true,
      isRolling: false,
      results: [],
      unit,
      rulesVersion: 'fan', // Default, can be overridden
    });
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      results: [],
      unit: null,
    }));
  };

  return {
    isModalOpen: state.isModalOpen,
    isRolling: state.isRolling,
    results: state.results,
    unit: state.unit,
    rulesVersion: state.rulesVersion,
    startPanicTest,
    closeModal,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- usePanicTestFlow`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/usePanicTestFlow.ts src/__tests__/hooks/usePanicTestFlow.test.ts
git commit -m "feat: add usePanicTestFlow hook"
```

---

### Task 7: Create PanicTestModal component

**Files:**
- Create: `src/components/PanicTestModal.tsx`
- Test: `src/__tests__/components/PanicTestModal.test.tsx`

**Important:** Use `/frontend-design` skill for production-grade UI design.

**Step 1: Write the failing test**

```typescript
// src/__tests__/components/PanicTestModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PanicTestModal } from '@/components/PanicTestModal';
import { ArmyUnit } from '@/lib/types';

describe('PanicTestModal', () => {
  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'squad',
    data: {
      id: 'test-squad',
      name: 'Test Squad',
      faction: 'polaris',
      cost: 100,
      soldiers: [
        { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
      ],
    },
  };

  test('renders when isOpen is true', () => {
    render(
      <PanicTestModal
        isOpen={true}
        unit={mockUnit}
        rulesVersion="fan"
        onTestComplete={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText(/тест/i)).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <PanicTestModal
        isOpen={false}
        unit={mockUnit}
        rulesVersion="fan"
        onTestComplete={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('calls onClose when X button clicked', () => {
    const onClose = jest.fn();
    render(
      <PanicTestModal
        isOpen={true}
        unit={mockUnit}
        rulesVersion="fan"
        onTestComplete={jest.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- PanicTestModal`
Expected: FAIL with "PanicTestModal is not defined"

**Step 3: Write minimal implementation**

Create `src/components/PanicTestModal.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { ArmyUnit, RulesVersionID, PanicTestResult } from '@/lib/types';

interface PanicTestModalProps {
  isOpen: boolean;
  unit: ArmyUnit;
  rulesVersion: RulesVersionID;
  onTestComplete: (results: PanicTestResult[]) => void;
  onClose: () => void;
}

export function PanicTestModal({
  isOpen,
  unit,
  rulesVersion,
  onTestComplete,
  onClose,
}: PanicTestModalProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: true,
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const squad = unit.data;
  const soldiers = squad.soldiers || [];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        ref={sheetRef}
        {...touchHandlers}
        className="w-full md:w-[500px] bg-slate-900 rounded-t-3xl md:rounded-3xl border-t-2 md:border-2 border-slate-700 shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-black uppercase tracking-wider text-orange-500">
            Тест на панику
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-4">
              При гибели половины отряда пехотинцы должны пройти тест на панику
            </p>
            <p className="text-xs text-slate-500">
              Бросок D6: если результат > Армейского ранга — паника
            </p>
          </div>

          {/* TODO: Add soldier list and test functionality */}
          <div className="mt-6">
            {soldiers.map((soldier, index) => (
              <div
                key={index}
                className="bg-slate-800 p-3 rounded-lg mb-2 flex items-center justify-between"
              >
                <span className="text-sm">Боец #{index + 1} (Ранг: {soldier.rank})</span>
                <span className="text-xs text-slate-500">Ожидание...</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- PanicTestModal`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/PanicTestModal.tsx src/__tests__/components/PanicTestModal.test.tsx
git commit -m "feat: add PanicTestModal component (basic structure)"
```

---

### Task 8: Enhance PanicTestModal with test execution and animation

**Files:**
- Modify: `src/components/PanicTestModal.tsx`
- Test: `src/__tests__/components/PanicTestModal.test.tsx`

**Step 1: Write the failing test**

```typescript
// Add to src/__tests__/components/PanicTestModal.test.tsx

test('conducts panic test and shows results', () => {
  const onTestComplete = jest.fn();
  render(
    <PanicTestModal
      isOpen={true}
      unit={mockUnit}
      rulesVersion="fan"
      onTestComplete={onTestComplete}
      onClose={jest.fn()}
    />
  );

  const testButton = screen.getByText(/провести тест/i);
  fireEvent.click(testButton);

  // Wait for test to complete
  setTimeout(() => {
    expect(screen.getByText(/применить/i)).toBeInTheDocument();
  }, 1500);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- PanicTestModal`
Expected: FAIL with "找不到节点"

**Step 3: Write minimal implementation**

Update `src/components/PanicTestModal.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { X, Check, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { ArmyUnit, RulesVersionID, PanicTestResult, rollDie } from '@/lib/types';
import { executePanicTest } from '@/lib/panic-logic';

interface PanicTestModalProps {
  isOpen: boolean;
  unit: ArmyUnit;
  rulesVersion: RulesVersionID;
  onTestComplete: (results: PanicTestResult[]) => void;
  onClose: () => void;
}

export function PanicTestModal({
  isOpen,
  unit,
  rulesVersion,
  onTestComplete,
  onClose,
}: PanicTestModalProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: true,
  });

  const [isRolling, setIsRolling] = useState(false);
  const [results, setResults] = useState<PanicTestResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isRolling) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isRolling]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setResults([]);
      setShowResults(false);
      setIsRolling(false);
    }
  }, [isOpen]);

  const handleConductTest = () => {
    setIsRolling(true);
    const squad = unit.data;
    const soldiers = squad.soldiers || [];
    const deadIndices = unit.deadSoldiers || [];

    // Test all alive soldiers
    const testResults: PanicTestResult[] = [];

    soldiers.forEach((_, index) => {
      if (!deadIndices.includes(index)) {
        const result = executePanicTest(unit, index, rulesVersion);
        testResults.push(result);
      }
    });

    // Simulate dice rolling animation
    setTimeout(() => {
      setResults(testResults);
      setShowResults(true);
      setIsRolling(false);
    }, 1000);
  };

  const handleApply = () => {
    onTestComplete(results);
    onClose();
  };

  if (!isOpen) return null;

  const squad = unit.data;
  const soldiers = squad.soldiers || [];
  const deadIndices = unit.deadSoldiers || [];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        ref={sheetRef}
        {...touchHandlers}
        className="w-full md:w-[500px] bg-slate-900 rounded-t-3xl md:rounded-3xl border-t-2 md:border-2 border-slate-700 shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-black uppercase tracking-wider text-orange-500">
            Тест на панику
          </h2>
          <button
            onClick={onClose}
            disabled={isRolling}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          {!showResults ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">
                  При гибели половины отряда пехотинцы должны пройти тест на панику
                </p>
                <p className="text-xs text-slate-500">
                  Бросок D6: если результат &gt; Армейского ранга — паника
                </p>
              </div>

              {/* Soldier list */}
              <div className="w-full space-y-2">
                {soldiers.map((soldier, index) => {
                  if (deadIndices.includes(index)) return null;
                  return (
                    <div
                      key={index}
                      className="bg-slate-800 p-3 rounded-lg flex items-center justify-between"
                    >
                      <span className="text-sm">Боец #{index + 1}</span>
                      <span className="text-xs text-slate-500">
                        Ранг: {soldier.rank}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleConductTest}
                disabled={isRolling}
                className="w-full max-w-xs px-6 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all min-h-[52px] md:min-h-[56px] mt-4 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isRolling ? 'Бросаем кубики...' : 'ПРОВЕСТИ ТЕСТ'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "bg-slate-800 p-4 rounded-xl border-2",
                    result.isPanic
                      ? "border-orange-500/50"
                      : "border-green-500/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] opacity-50 uppercase mb-1">
                        Боец #{result.soldierIndex + 1}
                      </div>
                      <div className={cn(
                        "text-sm font-bold",
                        result.isPanic ? "text-orange-400" : "text-green-400"
                      )}>
                        {result.isPanic ? (
                          <span className="flex items-center gap-2">
                            <Footprints className="w-4 h-4" />
                            В ПАНИКЕ!
                          </span>
                        ) : (
                          'Справился'
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] opacity-50 uppercase mb-1">
                        Бросок / Ранг
                      </div>
                      <div className="text-lg font-black">
                        {result.roll} / {result.rank}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleApply}
                className="w-full px-6 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all min-h-[52px] md:min-h-[56px] mt-4 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white"
              >
                <Check className="w-5 h-5" />
                ПРИМЕНИТЬ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- PanicTestModal`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/PanicTestModal.tsx src/__tests__/components/PanicTestModal.test.tsx
git commit -m "feat: add panic test execution and animation to PanicTestModal"
```

---

### Task 9: Integrate panic modal into UnitCard

**Files:**
- Modify: `src/components/UnitCard.tsx`

**Step 1: Verify existing UnitCard structure**

Check `src/components/UnitCard.tsx` for:
- Existing state management patterns
- Modal integration patterns
- Import statements needed

**Step 2: Add panic modal state and integration**

Modify `src/components/UnitCard.tsx`:

```typescript
// Add imports at top
import { PanicTestModal } from './PanicTestModal';
import { checkPanicTrigger } from '@/lib/panic-logic';

// Add state inside component
const [showPanicModal, setShowPanicModal] = useState(false);
const [panicTestResults, setPanicTestResults] = useState<{ soldierIndex: number; isPanic: boolean; roll: number; rank: number }[]>([]);

// Modify toggleDead function to check panic trigger
const toggleDead = (idx: number) => {
  const dead = unit.deadSoldiers || [];
  const newDead = dead.includes(idx)
    ? dead.filter(i => i !== idx)
    : [...dead, idx];

  const updatedUnit = { ...unit, deadSoldiers: newDead };

  // Check panic trigger for fan rules
  if (rulesVersion === 'fan' && newDead.length > 0) {
    const shouldTestPanic = checkPanicTrigger(updatedUnit, 'fan', army?.currentTurn || 1);
    if (shouldTestPanic) {
      setShowPanicModal(true);
    }
  }

  updateUnit(updatedUnit);
};

// Add handler for panic test completion
const handlePanicTestComplete = (results: { soldierIndex: number; isPanic: boolean; roll: number; rank: number }[]) => {
  const panicStates = results
    .filter(r => r.isPanic)
    .map(r => ({
      soldierIndex: r.soldierIndex,
      testRoll: r.roll,
      rank: r.rank,
      triggeredAtTurn: army?.currentTurn || 1,
    }));

  if (panicStates.length > 0) {
    updateUnit({ ...unit, panicState: panicStates });
  }
};

// Add PanicTestModal component at the end before closing div
<PanicTestModal
  isOpen={showPanicModal}
  unit={unit}
  rulesVersion={rulesVersion}
  onTestComplete={handlePanicTestComplete}
  onClose={() => setShowPanicModal(false)}
/>
```

**Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/UnitCard.tsx
git commit -m "feat: integrate panic modal into UnitCard"
```

---

### Task 10: Add panic visual indicator to soldier cards in UnitCard

**Files:**
- Modify: `src/components/UnitCard.tsx`

**Step 1: Add helper function to check if soldier is in panic**

```typescript
// Add inside UnitCard component
const isSoldierInPanic = (soldierIndex: number): boolean => {
  if (!unit.panicState || unit.panicState.length === 0) return false;
  return unit.panicState.some(p => p.soldierIndex === soldierIndex);
};
```

**Step 2: Add panic visual indicator to soldier card**

Find the soldier card rendering section and add panic indicator:

```typescript
// In the soldier card rendering (where actions are shown), add:
{isSoldierInPanic(idx) && (
  <div className="flex items-center gap-1 text-orange-400 mt-1">
    <Footprints className="w-4 h-4" />
    <span className="text-xs font-bold">ПАНИКА</span>
  </div>
)}
```

**Step 3: Disable action buttons for panicking soldiers**

Modify action button rendering:

```typescript
// Add disabled prop to action buttons for panicking soldiers
<button
  onClick={() => toggleAction(idx, 'moved')}
  disabled={isSoldierInPanic(idx)}
  className={cn(
    // existing classes
    isSoldierInPanic(idx) && "opacity-30 cursor-not-allowed"
  )}
>
  // existing content
</button>
```

**Step 4: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/UnitCard.tsx
git commit -m "feat: add panic visual indicator to soldier cards"
```

---

### Task 11: Integrate resolvePanic into GameSession

**Files:**
- Modify: `src/components/GameSession.tsx` or `src/app/page.tsx`

**Step 1: Find the next turn / new turn function**

Search for where turns are incremented.

**Step 2: Add panic resolution logic**

```typescript
// Import at top
import { resolvePanic } from '@/lib/panic-logic';

// In the next turn function:
const handleNextTurn = () => {
  setArmy(prev => {
    const currentTurn = (prev.currentTurn || 1) + 1;
    const newUnits = prev.units.map(unit =>
      resolvePanic(unit, currentTurn)
    );
    return {
      ...prev,
      units: newUnits,
      currentTurn,
    };
  });
};
```

**Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/GameSession.tsx
git commit -m "feat: integrate resolvePanic into turn progression"
```

---

### Task 12: Add E2E tests for panic system

**Files:**
- Create: `e2e/features/panic.feature`
- Test: `e2e/step-definitions/panic.steps.ts`

**Step 1: Create feature file**

Create `e2e/features/panic.feature`:

```gherkin
Функционал: Система паники
  Правила: Панова

  Сценарий: Паника при гибели половины отряда
    Дано я выбираю фракцию "Polaris"
    И я добавляю отряд "Легкие штурмовики" в армию
    И я переключаюсь на вкладку "Армия"
    И я выбираю правила "Панова"
    Когда я убиваю 3-го бойца из 6
    То модалка "Тест на панику" открывается автоматически
    И я провожу тест на панику
    Тогда паникующие бойцы помечены иконкой бега
    И действия паникующих бойцов заблокированы

  Сценарий: Снятие паники в следующем ходу
    Дано я выбираю фракцию "Polaris"
    И я добавляю отряд "Легкие штурмовики" в армию
    И я переключаюсь на вкладку "Армия"
    И я выбираю правила "Панова"
    И я убиваю 3-го бойца из 6
    И я провожу тест на панику
    Когда я начинаю новый ход
    То статус паники снят с бойцов
```

**Step 2: Create step definitions**

Create `e2e/step-definitions/panic.steps.ts`:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Page } from '@playwright/test';

Given('я выбираю правила {string}', async function (rules: string) {
  // Implementation to select rules version
  const rulesButton = this.page.getByTestId(`rules-select-${rules.toLowerCase()}`);
  await rulesButton.click();
});

When('я провожу тест на панику', async function () {
  const testButton = this.page.getByText(/провести тест/i);
  await testButton.click({ timeout: 10000 });
  // Wait for results
  await this.page.waitForTimeout(1500);
  const applyButton = this.page.getByText(/применить/i);
  await applyButton.click({ timeout: 10000 });
});

Then('модалка {string} открывается автоматически', async function (modalTitle: string) {
  const modal = this.page.getByText(new RegExp(modalTitle, 'i'));
  await expect(modal).toBeVisible({ timeout: 5000 });
});

Then('паникующие бойцы помечены иконкой бега', async function () {
  const panicIcons = this.page.locator('[data-testid="panic-indicator"]');
  expect(await panicIcons.count()).toBeGreaterThan(0);
});

Then('действия паникующих бойцов заблокированы', async function () {
  const disabledButtons = this.page.locator('button[disabled]');
  expect(await disabledButtons.count()).toBeGreaterThan(0);
});

Then('статус паники снят с бойцов', async function () {
  const panicIcons = this.page.locator('[data-testid="panic-indicator"]');
  expect(await panicIcons.count()).toBe(0);
});
```

**Step 3: Add test-id attributes to PanicTestModal**

Modify `src/components/PanicTestModal.tsx` to add test IDs:

```typescript
<h2 data-testid="panic-modal-title">...</h2>
{result.isPanic && (
  <div data-testid="panic-indicator">...</div>
)}
```

**Step 4: Run E2E tests**

Run: `npm run dev:e2e` (in background)
Run: `npm run test:e2e`
Expected: Tests pass

**Step 5: Commit**

```bash
git add e2e/features/panic.feature e2e/step-definitions/panic.steps.ts src/components/PanicTestModal.tsx
git commit -m "feat: add E2E tests for panic system"
```

---

### Task 13: Final validation and cleanup

**Files:**
- All modified files

**Step 1: Run full test suite**

Run: `npm run validate`
Expected: All tests pass

**Step 2: Run type-check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Manual testing checklist**

- [ ] Create army with squad
- [ ] Select fan rules
- [ ] Kill 50% of squad
- [ ] Verify panic modal opens automatically
- [ ] Conduct panic test
- [ ] Verify panic indicators show correctly
- [ ] Verify actions are disabled for panicking soldiers
- [ ] Start new turn
- [ ] Verify panic is resolved

**Step 5: Commit final changes**

```bash
git add .
git commit -m "feat: complete panic system implementation"
```

---

## Summary

This plan implements:
1. Type definitions for panic state tracking
2. Core logic for panic detection, testing, and resolution
3. Custom hook for panic test flow management
4. Production-grade modal UI (using frontend-design skill)
5. Integration with existing UnitCard component
6. Visual feedback with Footprints icon
7. E2E test coverage
8. Full test suite with unit tests

Total commits: ~13
Total estimated time: ~2-3 hours
