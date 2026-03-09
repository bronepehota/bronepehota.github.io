# UnitCard Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor UnitCard.tsx from 1238 lines to ~200 lines by extracting logical components into focused, reusable modules.

**Architecture:** Component Decomposition - Extract logical chunks into focused sub-components while keeping UnitCard as the orchestrator. Create custom hooks for shared logic (useMachineStats, useUnitCardState).

**Tech Stack:** React 18, TypeScript 5.x, Next.js 14, Tailwind CSS, Jest, Playwright

---

## Task 1: Create directory structure and placeholder files

**Files:**
- Create: `src/components/cards/unit-card/hooks/useMachineStats.ts`
- Create: `src/components/cards/unit-card/hooks/useUnitCardState.ts`
- Create: `src/components/cards/unit-card/UnitCardHeader.tsx`
- Create: `src/components/cards/unit-card/SquadView.tsx`
- Create: `src/components/cards/unit-card/MachineView.tsx`
- Create: `src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx`
- Create: `src/components/cards/unit-card/machine-view/MachineAmmoPanel.tsx`
- Create: `src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx`
- Create: `src/components/cards/unit-card/machine-view/MachinePilotPanel.tsx`

**Step 1: Create hooks directory**

```bash
mkdir -p src/components/cards/unit-card/hooks
```

**Step 2: Create machine-view directory**

```bash
mkdir -p src/components/cards/unit-card/machine-view
```

**Step 3: Create placeholder files with basic exports**

```typescript
// src/components/cards/unit-card/hooks/useMachineStats.ts
export function useMachineStats() {
  throw new Error('Not implemented');
}
```

```bash
# Create all placeholder files
for file in \
  "src/components/cards/unit-card/hooks/useMachineStats.ts" \
  "src/components/cards/unit-card/hooks/useUnitCardState.ts" \
  "src/components/cards/unit-card/UnitCardHeader.tsx" \
  "src/components/cards/unit-card/SquadView.tsx" \
  "src/components/cards/unit-card/MachineView.tsx" \
  "src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx" \
  "src/components/cards/unit-card/machine-view/MachineAmmoPanel.tsx" \
  "src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx" \
  "src/components/cards/unit-card/machine-view/MachinePilotPanel.tsx"
do
  cat > "$file" << 'EOF'
// Placeholder - will be implemented
export {};
EOF
done
```

**Step 4: Commit**

```bash
git add src/components/cards/unit-card/
git commit -m "refactor(unit-card): create directory structure for UnitCard refactoring"
```

---

## Task 2: Extract useMachineStats hook

**Files:**
- Modify: `src/components/cards/unit-card/hooks/useMachineStats.ts`
- Create: `src/__tests__/hooks/useMachineStats.test.ts`

**Reference:** `src/components/cards/UnitCard.tsx` lines 123-161 (getMachineSpeed, getDurabilityZone, updateMachineStat, getZoneColor)

**Step 1: Write the failing test**

```typescript
// src/__tests__/hooks/useMachineStats.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMachineStats } from '@/components/cards/unit-card/hooks/useMachineStats';
import { ArmyUnit, Machine } from '@/lib/types';

describe('useMachineStats', () => {
  const mockMachine: Machine = {
    id: 'test_machine',
    name: 'Test Machine',
    shortName: 'TM',
    faction: 'polaris',
    cost: 100,
    rank: 2,
    fire_rate: 2,
    ammo_max: 20,
    durability_max: 16,
    image: '/images/test.jpg',
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 }
    ],
    weapons: []
  };

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    instanceNumber: 1,
    type: 'machine',
    data: mockMachine,
    currentDurability: 12,
    currentAmmo: 15
  };

  const mockUpdateUnit = jest.fn();

  it('returns current stats for machine', () => {
    const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

    expect(result.current.currentDurability).toBe(12);
    expect(result.current.maxDurability).toBe(16);
    expect(result.current.speed).toBe(2);
  });

  it('calculates correct speed for durability sector', () => {
    const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

    expect(result.current.speed).toBe(2); // 12 is in 9-16 sector

    act(() => {
      mockUnit.currentDurability = 6;
    });
    const { rerender } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));
    // 6 would be in 1-8 sector
  });

  it('throws error for squad units', () => {
    const squadUnit: ArmyUnit = {
      ...mockUnit,
      type: 'squad'
    };

    expect(() => {
      renderHook(() => useMachineStats(squadUnit, mockUpdateUnit));
    }).toThrow('useMachineStats is for machines only');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- useMachineStats.test.ts --no-coverage
```

Expected: FAIL with "useMachineStats is for machines only" or hook not returning expected values

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/hooks/useMachineStats.ts
import { useMemo, useCallback } from 'react';
import { ArmyUnit, Machine, DurabilityZone } from '@/lib/types';

export interface MachineStats {
  currentDurability: number;
  maxDurability: number;
  speed: number;
  zone: DurabilityZone;
  updateDurability: (delta: number) => void;
}

export function useMachineStats(
  unit: ArmyUnit,
  updateUnit: (updateFn: (u: ArmyUnit) => ArmyUnit) => void
): MachineStats {
  // Guard: only works for machines
  if (unit.type === 'squad') {
    throw new Error('useMachineStats is for machines only');
  }

  const data = unit.data as Machine;

  // Get machine speed based on current durability
  const speed = useMemo(() => {
    if (!unit.currentDurability) return 0;
    const sector = data.speed_sectors.find(s =>
      unit.currentDurability! >= s.min_durability &&
      unit.currentDurability! <= s.max_durability
    );
    return sector ? sector.speed : 0;
  }, [unit.currentDurability, data.speed_sectors]);

  // Get durability zone
  const zone = useMemo(() => {
    const current = unit.currentDurability || 0;
    const max = data.durability_max;

    // Check if custom zones are defined
    if (data.durabilityZones && data.durabilityZones.length > 0) {
      const foundZone = data.durabilityZones.find(zone => current > zone.max) ||
                       data.durabilityZones[data.durabilityZones.length - 1];
      // For green zone, use durability_max as the displayed value
      if (foundZone.color === 'green') {
        return { ...foundZone, max };
      }
      return foundZone;
    }

    // Default zones calculation (2/3 and 1/3)
    const greenThreshold = Math.ceil(max * 2 / 3);
    const yellowThreshold = Math.ceil(max / 3);

    if (current > greenThreshold) {
      return { max, color: 'green' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
    }
    if (current > yellowThreshold) {
      return { max: greenThreshold, color: 'yellow' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
    }
    return { max: yellowThreshold, color: 'red' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
  }, [unit.currentDurability, data.durability_max, data.durabilityZones]);

  // Update durability with bounds checking
  const updateDurability = useCallback((delta: number) => {
    const max = data.durability_max;
    const current = unit.currentDurability || 0;
    const newValue = Math.max(0, Math.min(max, current + delta));

    if (newValue === current) return; // No change needed

    if (newValue === 0) {
      updateUnit((u) => ({ ...u, currentDurability: 0, isMachineDone: true }));
    } else {
      updateUnit((u) => ({ ...u, currentDurability: newValue }));
    }
  }, [unit.currentDurability, data.durability_max, updateUnit]);

  return {
    currentDurability: unit.currentDurability || 0,
    maxDurability: data.durability_max,
    speed,
    zone,
    updateDurability
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- useMachineStats.test.ts --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/hooks/useMachineStats.ts src/__tests__/hooks/useMachineStats.test.ts
git commit -m "refactor(unit-card): extract useMachineStats hook with tests"
```

---

## Task 3: Extract useUnitCardState hook

**Files:**
- Modify: `src/components/cards/unit-card/hooks/useUnitCardState.ts`
- Create: `src/__tests__/hooks/useUnitCardState.test.ts`

**Reference:** `src/components/cards/UnitCard.tsx` lines 52-59, 67-72 (modal states, rules version, localStorage, pilot test result)

**Step 1: Write the failing test**

```typescript
// src/__tests__/hooks/useUnitCardState.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUnitCardState } from '@/components/cards/unit-card/hooks/useUnitCardState';
import { ArmyUnit, Squad } from '@/lib/types';

describe('useUnitCardState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'squad',
    data: {} as Squad,
  };

  it('initializes with default states', () => {
    const { result } = renderHook(() => useUnitCardState(mockUnit));

    expect(result.current.showImage).toBe(false);
    expect(result.current.showDetailsModal).toBe(false);
    expect(result.current.showPilotModal).toBe(false);
    expect(result.current.pilotSurvivalTest).toBe(null);
  });

  it('loads rules version from localStorage', async () => {
    localStorage.setItem('bronepehota_rules_version', 'tehnolog');

    const { result } = renderHook(() => useUnitCardState(mockUnit));

    await waitFor(() => {
      expect(result.current.rulesVersion).toBe('tehnolog');
    });
  });

  it('provides state setters', () => {
    const { result } = renderHook(() => useUnitCardState(mockUnit));

    act(() => {
      result.current.setShowImage(true);
    });

    expect(result.current.showImage).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- useUnitCardState.test.ts --no-coverage
```

Expected: FAIL with hook not defined

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/hooks/useUnitCardState.ts
import { useState, useEffect } from 'react';
import { ArmyUnit, RulesVersionID } from '@/lib/types';
import { getDefaultRulesVersion } from '@/lib/rules-registry';

export interface PilotSurvivalTest {
  roll: number;
  survived: boolean;
  testedAt: number;
}

export interface UnitCardState {
  // Modal states
  showImage: boolean;
  showDetailsModal: boolean;
  showPilotModal: boolean;
  // Rules
  rulesVersion: RulesVersionID;
  // Pilot survival test result
  pilotSurvivalTest: PilotSurvivalTest | null;
  // Setters
  setShowImage: (value: boolean) => void;
  setShowDetailsModal: (value: boolean) => void;
  setShowPilotModal: (value: boolean) => void;
  setPilotSurvivalTest: (test: PilotSurvivalTest | null) => void;
}

export function useUnitCardState(unit: ArmyUnit): UnitCardState {
  const [showImage, setShowImage] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>(getDefaultRulesVersion());
  const [pilotSurvivalTest, setPilotSurvivalTest] = useState<PilotSurvivalTest | null>(null);

  // Load rules version from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_rules_version');
    if (saved) {
      setRulesVersion(saved as RulesVersionID);
    }
  }, []);

  return {
    showImage,
    showDetailsModal,
    showPilotModal,
    rulesVersion,
    pilotSurvivalTest,
    setShowImage,
    setShowDetailsModal,
    setShowPilotModal,
    setPilotSurvivalTest
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- useUnitCardState.test.ts --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/hooks/useUnitCardState.ts src/__tests__/hooks/useUnitCardState.test.ts
git commit -m "refactor(unit-card): extract useUnitCardState hook with tests"
```

---

## Task 4: Create UnitCardHeader component

**Files:**
- Modify: `src/components/cards/unit-card/UnitCardHeader.tsx`
- Create: `src/__tests__/components/unit-card/UnitCardHeader.test.tsx`

**Reference:** `src/components/cards/UnitCard.tsx` lines 609-697 (Unit Header section)

**Step 1: Write the failing test**

```typescript
// src/__tests__/components/unit-card/UnitCardHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UnitCardHeader } from '@/components/cards/unit-card/UnitCardHeader';
import { ArmyUnit, Squad } from '@/lib/types';
import { CheckCircle2 } from 'lucide-react';

describe('UnitCardHeader', () => {
  const mockSquad: Squad = {
    id: 'test_squad',
    name: 'Test Squad',
    shortName: 'TS',
    faction: 'polaris',
    cost: 100,
    soldiers: []
  };

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    instanceNumber: 1,
    type: 'squad',
    data: mockSquad,
    actionsUsed: [],
    grenadesUsed: false
  };

  it('renders unit name and number', () => {
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={false}
        onToggleDone={jest.fn()}
        onOpenDetails={jest.fn()}
      />
    );

    expect(screen.getByText('Test Squad')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows CheckCircle icon when done', () => {
    const { rerender } = render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={true}
        onToggleDone={jest.fn()}
        onOpenDetails={jest.fn()}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument(); // Done toggle button
  });

  it('calls onToggleDone when done button clicked', () => {
    const onToggleDone = jest.fn();
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={false}
        onToggleDone={onToggleDone}
        onOpenDetails={jest.fn()}
      />
    );

    const doneButton = screen.getAllByRole('button')[1]; // Second button is done toggle
    fireEvent.click(doneButton);

    expect(onToggleDone).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- UnitCardHeader.test.tsx --no-coverage
```

Expected: FAIL with component not defined

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/UnitCardHeader.tsx
import React from 'react';
import { CheckCircle2, X, ImageIcon, Bomb, UserX } from 'lucide-react';
import { ArmyUnit, Squad } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UnitCardHeaderProps {
  unit: ArmyUnit;
  isDone: boolean;
  isAllDead?: boolean;
  grenadesAvailable?: boolean;
  grenadesUsed?: boolean;
  onToggleDone: () => void;
  onOpenDetails: () => void;
  showPhotoButton?: boolean;
  onShowPhoto?: () => void;
}

export function UnitCardHeader({
  unit,
  isDone,
  isAllDead = false,
  grenadesAvailable = false,
  grenadesUsed = false,
  onToggleDone,
  onOpenDetails,
  showPhotoButton = false,
  onShowPhoto
}: UnitCardHeaderProps) {
  const data = unit.data;
  const isSquad = unit.type === 'squad';

  // Calculate if squad is done
  const isSquadDone = isSquad && isDone && !isAllDead;

  return (
    <div
      className={cn(
        "p-2 md:p-3 flex justify-between items-center relative z-10 border-b border-slate-800/50",
        data.faction === 'polaris' ? "bg-red-950/20" : data.faction === 'protectorate' ? "bg-cyan-950/20" : "bg-yellow-950/20"
      )}
    >
      {/* Tech decoration - top line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-px",
        data.faction === 'polaris' ? "bg-red-600/20" : data.faction === 'protectorate' ? "bg-cyan-600/20" : "bg-yellow-600/20"
      )} />

      <div className={cn("flex-1 min-w-0", unit.instanceNumber && "pl-9 md:pl-11")}>
        {/* Row 1: Name + Done badge */}
        <div className="flex items-center gap-1 md:gap-2 min-w-0">
          <h3 className="min-w-0 flex-1 font-mono font-bold text-xs md:text-sm uppercase tracking-wide truncate" title={data.name}>{data.name}</h3>
          {isSquadDone && (
            <span className="shrink-0 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </span>
          )}
        </div>

        {/* Row 2: Status badges */}
        <div className="flex items-center gap-1 mt-0.5">
          {/* Cost */}
          <span className="text-[10px] md:text-xs font-mono font-bold text-slate-500">{data.cost} очк</span>

          {/* Grenade status - squads only */}
          {isSquad && grenadesAvailable && !isAllDead && (
            <div className={cn(
              "flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-sm border",
              grenadesUsed
                ? "bg-red-950/40 text-red-400 border-red-700/50"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-700/50"
            )}>
              <Bomb className="w-2 h-2 md:w-2.5 md:h-2.5 shrink-0" />
            </div>
          )}

          {/* All Dead badge */}
          {isAllDead && (
            <div className="bg-red-950/50 text-red-400 border border-red-700/70 px-1 py-0.5 rounded-sm text-[8px] md:text-[9px] font-mono font-black uppercase flex items-center gap-0.5">
              <UserX className="w-2 h-2 md:w-2.5 md:h-2.5 shrink-0" />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-0.5 md:gap-1" onClick={e => e.stopPropagation()}>
        {/* Machine Photo Button - Mobile only */}
        {showPhotoButton && onShowPhoto && (
          <button
            onClick={onShowPhoto}
            className="p-1.5 md:p-1 hover:bg-white/10 rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border border-slate-700/50 md:hidden"
            title="Показать фото"
            aria-label="Показать фото машины"
          >
            <ImageIcon className="w-4 h-4 opacity-50" />
          </button>
        )}

        <button
          onClick={onToggleDone}
          className="p-1.5 md:p-1 hover:bg-white/10 rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border border-slate-700/50"
          title={isDone ? "Отменить" : "Завершить ход"}
        >
          {isDone ? (
            <X className="w-4 h-4 opacity-50 text-slate-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 opacity-50" />
          )}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- UnitCardHeader.test.tsx --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/UnitCardHeader.tsx src/__tests__/components/unit-card/UnitCardHeader.test.tsx
git commit -m "refactor(unit-card): extract UnitCardHeader component with tests"
```

---

## Task 5: Create MachineStatsPanel component

**Files:**
- Modify: `src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx`
- Create: `src/__tests__/components/unit-card/MachineStatsPanel.test.tsx`

**Reference:** `src/components/cards/UnitCard.tsx` lines 723-798 (Durability + Speed section)

**Step 1: Write the failing test**

```typescript
// src/__tests__/components/unit-card/MachineStatsPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MachineStatsPanel } from '@/components/cards/unit-card/machine-view/MachineStatsPanel';
import { DurabilityZone } from '@/lib/types';

describe('MachineStatsPanel', () => {
  const mockZone: DurabilityZone = {
    max: 16,
    color: 'green',
    damagePerDie: { D6: 1, D12: 2, D20: 3 }
  };

  const defaultProps = {
    currentDurability: 12,
    maxDurability: 16,
    speed: 2,
    zone: mockZone,
    onUpdateDurability: jest.fn(),
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5
  };

  it('renders durability and speed values', () => {
    render(<MachineStatsPanel {...defaultProps} />);

    expect(screen.getByText('12')).toBeInTheDocument(); // Durability
    expect(screen.getByText('2шаг')).toBeInTheDocument(); // Speed
  });

  it('calls onUpdateDurability with -1 when damage button clicked', () => {
    const onUpdateDurability = jest.fn();
    render(<MachineStatsPanel {...defaultProps} onUpdateDurability={onUpdateDurability} />);

    const damageButton = screen.getAllByRole('button')[0]; // First button is damage
    fireEvent.click(damageButton);

    expect(onUpdateDurability).toHaveBeenCalledWith(-1);
  });

  it('disables damage button at durability 0', () => {
    render(<MachineStatsPanel {...defaultProps} currentDurability={0} />);

    const damageButton = screen.getAllByRole('button')[0];
    expect(damageButton).toBeDisabled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- MachineStatsPanel.test.tsx --no-coverage
```

Expected: FAIL with component not defined

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx
import React from 'react';
import { Shield, Footprints, Flame, Wrench } from 'lucide-react';
import { DurabilityZone } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MachineStatsPanelProps {
  currentDurability: number;
  maxDurability: number;
  speed: number;
  zone: DurabilityZone;
  onUpdateDurability: (delta: number) => void;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
}

export function MachineStatsPanel({
  currentDurability,
  maxDurability,
  speed,
  zone,
  onUpdateDurability,
  distanceInputUnit,
  stepToCmFactor
}: MachineStatsPanelProps) {

  const getZoneColor = (color: 'green' | 'yellow' | 'red') => {
    const colors = {
      green: { bar: 'bg-green-500', text: 'text-green-400' },
      yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400' },
      red: { bar: 'bg-red-500', text: 'text-red-400' }
    };
    return colors[color];
  };

  const zoneColor = getZoneColor(zone.color);

  return (
    <div className="relative bg-slate-900/60 p-2 rounded-sm">
      {/* Tech corners */}
      <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/50" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/50" />

      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" /> Прочность
        </span>
        <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
          <Footprints className="w-2.5 h-2.5 md:w-3 md:h-3" /> Скорость
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Durability controls - Tech Style */}
        <div className="flex-1 flex items-center gap-1">
          {/* Damage Button */}
          <button
            onClick={() => onUpdateDurability(-1)}
            disabled={currentDurability === 0}
            className={cn(
              "relative w-9 h-9 md:w-10 md:h-10 rounded-sm bg-red-950/30 hover:bg-red-950/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[40px] min-h-[40px] border-2 border-red-800/50 shrink-0 overflow-hidden",
              zoneColor.text
            )}
            title="Нанести урон"
          >
            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-600/40" />
            <Flame className="w-4 h-4" />
          </button>

          {/* Durability Value */}
          <span className={cn("text-sm md:text-base font-mono font-black min-w-[20px] text-center shrink-0", zoneColor.text)}>
            {currentDurability}
          </span>

          {/* Repair Button */}
          <button
            onClick={() => onUpdateDurability(1)}
            disabled={currentDurability === maxDurability}
            className={cn(
              "relative w-9 h-9 md:w-10 md:h-10 rounded-sm bg-emerald-950/30 hover:bg-emerald-950/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[40px] min-h-[40px] border-2 border-emerald-800/50 shrink-0 overflow-hidden",
              zoneColor.text
            )}
            title="Ремонт"
          >
            <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-emerald-600/40" />
            <Wrench className="w-4 h-4" />
          </button>

          {/* Segmented Progress Bar - Military Style */}
          <div className="flex-1 flex items-center gap-px">
            {Array.from({ length: maxDurability }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-sm transition-all flex-1",
                  i < currentDurability
                    ? zoneColor.bar
                    : "bg-slate-800"
                )}
              />
            ))}
          </div>
        </div>

        {/* Speed display - Tech Style */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <Footprints className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 mb-1 md:mb-0.5 shrink-0" />
          <span className="text-sm md:text-base font-mono font-black text-yellow-400">
            {distanceInputUnit === 'cm' ? `${speed * stepToCmFactor}см` : `${speed}шаг`}
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- MachineStatsPanel.test.tsx --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx src/__tests__/components/unit-card/MachineStatsPanel.test.tsx
git commit -m "refactor(unit-card): extract MachineStatsPanel component with tests"
```

---

## Task 6: Create MachineAmmoPanel component

**Files:**
- Modify: `src/components/cards/unit-card/machine-view/MachineAmmoPanel.tsx`
- Create: `src/__tests__/components/unit-card/MachineAmmoPanel.test.tsx`

**Reference:** `src/components/cards/UnitCard.tsx` lines 865-970 (Ammo + Shots section)

**Step 1: Write the failing test**

```typescript
// src/__tests__/components/unit-card/MachineAmmoPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MachineAmmoPanel } from '@/components/cards/unit-card/machine-view/MachineAmmoPanel';
import { Weapon } from '@/lib/types';

describe('MachineAmmoPanel', () => {
  const mockWeapons: Weapon[] = [
    { name: 'Cannon', range: 'D12', power: '2D20' },
    { name: 'MG', range: 'D6', power: '1D12' }
  ];

  const defaultProps = {
    currentAmmo: 15,
    maxAmmo: 20,
    shotsUsed: 0,
    weapons: mockWeapons,
    weaponShots: { 0: 0, 1: 0 },
    weaponAmmo: [15, 15],
    onUpdateAmmo: jest.fn(),
    onWeaponAttack: jest.fn(),
    onWeaponInfo: jest.fn(),
    usePerWeaponAmmo: false,
    rulesVersion: 'tehnolog' as const
  };

  it('renders ammo count and shots used', () => {
    render(<MachineAmmoPanel {...defaultProps} />);

    expect(screen.getByText('15')).toBeInTheDocument(); // Current ammo
    expect(screen.getByText('0')).toBeInTheDocument(); // Shots used
  });

  it('calls onWeaponAttack when weapon button clicked', () => {
    const onWeaponAttack = jest.fn();
    render(<MachineAmmoPanel {...defaultProps} onWeaponAttack={onWeaponAttack} />);

    const weaponButtons = screen.getAllByRole('button');
    fireEvent.click(weaponButtons[0]); // First weapon button

    expect(onWeaponAttack).toHaveBeenCalledWith(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- MachineAmmoPanel.test.tsx --no-coverage
```

Expected: FAIL with component not defined

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/machine-view/MachineAmmoPanel.tsx
import React from 'react';
import { Bomb, Target, Info } from 'lucide-react';
import { Weapon, RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MachineAmmoPanelProps {
  currentAmmo: number;
  maxAmmo: number;
  shotsUsed: number;
  weapons: Weapon[];
  weaponShots: Record<number, number>;
  weaponAmmo?: number[];
  onUpdateAmmo: (delta: number) => void;
  onWeaponAttack: (weaponIndex: number) => void;
  onWeaponInfo: (weapon: Weapon, weaponIdx: number) => void;
  usePerWeaponAmmo: boolean;
  rulesVersion: RulesVersionID;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
}

export function MachineAmmoPanel({
  currentAmmo,
  maxAmmo,
  shotsUsed,
  weapons,
  weaponShots,
  weaponAmmo,
  onUpdateAmmo,
  onWeaponAttack,
  onWeaponInfo,
  usePerWeaponAmmo,
  rulesVersion
}: MachineAmmoPanelProps) {

  return (
    <div className="relative bg-slate-900/60 p-2 rounded-sm">
      {/* Tech corners */}
      <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/50" />
      <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-slate-600/50" />
      <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-slate-600/50" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/50" />

      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
          <Bomb className="w-2.5 h-2.5 md:w-3 md:h-3" /> Боезапас
        </span>
        <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
          <Target className="w-2.5 h-2.5 md:w-3 md:h-3" /> Выстрелы
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Ammo progress bar - Segmented (only for tehnolog rules) */}
        {!usePerWeaponAmmo ? (
          <div className="flex-1 flex items-center gap-1">
            <div className="flex-1 flex items-center gap-px">
              {Array.from({ length: maxAmmo }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 rounded-sm transition-all flex-1",
                    i < currentAmmo
                      ? "bg-blue-500"
                      : "bg-slate-800"
                  )}
                />
              ))}
            </div>
            <span className="text-[9px] md:text-xs font-mono font-black text-blue-400 min-w-[38px] text-right shrink-0">
              {currentAmmo}/{maxAmmo}
            </span>
          </div>
        ) : (
          /* Per-weapon ammo (community_star_system) */
          <div className="flex-1 space-y-1">
            {weapons.map((weapon, idx) => {
              const isMelee = weapon.range === 'ББ';
              const weaponMaxAmmo = weaponAmmo?.[idx] || 0;
              const weaponShotsUsed = weaponShots[idx] || 0;

              return (
                <div key={idx} className="flex items-center gap-1">
                  {/* Attack button */}
                  <button
                    onClick={() => !isMelee && onWeaponAttack(idx)}
                    disabled={isMelee || weaponMaxAmmo === 0}
                    className={cn(
                      "px-2 py-1 text-[8px] md:text-[9px] font-mono font-bold rounded-sm border min-w-[60px] transition-colors",
                      isMelee
                        ? "bg-slate-800 text-slate-500 border-slate-700"
                        : weaponMaxAmmo > 0
                        ? "bg-blue-950/40 text-blue-400 border-blue-800/50 hover:bg-blue-950/60"
                        : "bg-red-950/40 text-red-400 border-red-800/50 disabled:opacity-50"
                    )}
                  >
                    {weapon.name}
                  </button>

                  {/* Ammo segments */}
                  {!isMelee && (
                    <div className="flex-1 flex items-center gap-px">
                      {Array.from({ length: maxAmmo }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 rounded-sm transition-all flex-1",
                            i < weaponMaxAmmo
                              ? "bg-blue-500"
                              : "bg-slate-800"
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Shots counter */}
                  <span className="text-[8px] md:text-[9px] font-mono font-black text-slate-400 min-w-[20px] text-right">
                    {weaponShotsUsed}
                  </span>

                  {/* Info button */}
                  <button
                    onClick={() => onWeaponInfo(weapon, idx)}
                    className="p-0.5 hover:bg-white/10 rounded transition-colors"
                    title="Информация об оружии"
                  >
                    <Info className="w-3 h-3 opacity-50" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- MachineAmmoPanel.test.tsx --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/machine-view/MachineAmmoPanel.tsx src/__tests__/components/unit-card/MachineAmmoPanel.test.tsx
git commit -m "refactor(unit-card): extract MachineAmmoPanel component with tests"
```

---

## Task 7: Create MachineWeaponsList component (for tehnolog rules)

**Files:**
- Modify: `src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx`
- Create: `src/__tests__/components/unit-card/MachineWeaponsList.test.tsx`

**Reference:** `src/components/cards/UnitCard.tsx` lines 971-1090 (Weapons list for tehnolog rules)

**Step 1: Write the failing test**

```typescript
// src/__tests__/components/unit-card/MachineWeaponsList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MachineWeaponsList } from '@/components/cards/unit-card/machine-view/MachineWeaponsList';
import { Weapon } from '@/lib/types';

describe('MachineWeaponsList', () => {
  const mockWeapons: Weapon[] = [
    { name: 'Cannon', range: 'D12', power: '2D20' },
    { name: 'MG', range: 'D6', power: '1D12' }
  ];

  const defaultProps = {
    weapons: mockWeapons,
    weaponShots: { 0: 0, 1: 0 },
    onWeaponAttack: jest.fn(),
    onWeaponInfo: jest.fn(),
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5
  };

  it('renders all weapons', () => {
    render(<MachineWeaponsList {...defaultProps} />);

    expect(screen.getByText('Cannon')).toBeInTheDocument();
    expect(screen.getByText('MG')).toBeInTheDocument();
  });

  it('calls onWeaponAttack when weapon clicked', () => {
    const onWeaponAttack = jest.fn();
    render(<MachineWeaponsList {...defaultProps} onWeaponAttack={onWeaponAttack} />);

    const weaponButton = screen.getByText('Cannon');
    fireEvent.click(weaponButton);

    expect(onWeaponAttack).toHaveBeenCalledWith(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- MachineWeaponsList.test.tsx --no-coverage
```

Expected: FAIL with component not defined

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx
import React from 'react';
import { Target, Info } from 'lucide-react';
import { Weapon } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatRange } from '@/lib/distance-utils';

interface MachineWeaponsListProps {
  weapons: Weapon[];
  weaponShots: Record<number, number>;
  onWeaponAttack: (weaponIndex: number) => void;
  onWeaponInfo: (weapon: Weapon, weaponIdx: number) => void;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
}

export function MachineWeaponsList({
  weapons,
  weaponShots,
  onWeaponAttack,
  onWeaponInfo,
  distanceInputUnit,
  stepToCmFactor
}: MachineWeaponsListProps) {

  return (
    <div className="space-y-1.5">
      {weapons.map((weapon, idx) => {
        const shotsUsed = weaponShots[idx] || 0;
        const isMelee = weapon.range === 'ББ';

        return (
          <div
            key={idx}
            className="relative bg-slate-900/60 p-2 rounded-sm"
          >
            {/* Tech corners */}
            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/50" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/50" />

            <div className="flex items-center gap-2">
              {/* Attack button */}
              <button
                onClick={() => onWeaponAttack(idx)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-left rounded-sm border transition-colors min-w-0",
                  isMelee
                    ? "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800"
                    : "bg-blue-950/30 border-blue-800/40 hover:bg-blue-950/50"
                )}
              >
                {/* Weapon name + stats */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <div className="flex items-center gap-1">
                      {isMelee ? (
                        <span className="text-[8px] md:text-[9px] font-mono font-black text-red-400">ББ</span>
                      ) : (
                        <span className="text-[9px] md:text-[10px] font-mono font-bold text-blue-400">{weapon.range}</span>
                      )}
                      <span className="text-[9px] md:text-[10px] font-mono font-bold text-white truncate">
                        {weapon.name}
                      </span>
                    </div>

                    {/* Power + CM range */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] md:text-[10px] font-mono font-bold text-red-400">
                        {weapon.power}
                      </span>
                      {!isMelee && (
                        <span className="text-[8px] md:text-[9px] font-mono opacity-50">
                          {formatRange(weapon.range, distanceInputUnit, stepToCmFactor)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shots counter */}
                  <div className="shrink-0 flex items-center gap-1">
                    <Target className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400 opacity-60" />
                    <span className="text-[9px] md:text-[10px] font-mono font-black text-amber-400 min-w-[16px] text-center">
                      {shotsUsed}
                    </span>
                  </div>

                  {/* Info button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWeaponInfo(weapon, idx);
                    }}
                    className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                    title="Информация об оружии"
                  >
                    <Info className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-50" />
                  </button>
                </div>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- MachineWeaponsList.test.tsx --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx src/__tests__/components/unit-card/MachineWeaponsList.test.tsx
git commit -m "refactor(unit-card): extract MachineWeaponsList component with tests"
```

---

## Task 8: Create MachinePilotPanel component

**Files:**
- Modify: `src/components/cards/unit-card/machine-view/MachinePilotPanel.tsx`
- Create: `src/__tests__/components/unit-card/MachinePilotPanel.test.tsx`

**Reference:** `src/components/cards/UnitCard.tsx` lines 800-863 (Pilot button with survival test)

**Step 1: Write the failing test**

```typescript
// src/__tests__/components/unit-card/MachinePilotPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MachinePilotPanel } from '@/components/cards/unit-card/machine-view/MachinePilotPanel';
import { PilotInfo } from '@/lib/types';

describe('MachinePilotPanel', () => {
  const defaultProps = {
    pilotInfo: null,
    pilotImage: null,
    survivalTest: null,
    onAssignPilot: jest.fn(),
    onSurvivalTest: jest.fn()
  };

  it('shows empty state when no pilot assigned', () => {
    render(<MachinePilotPanel {...defaultProps} />);

    expect(screen.getByText('Пилот')).toBeInTheDocument();
  });

  it('shows pilot image when assigned', () => {
    const mockPilot: PilotInfo = {
      squadInstanceId: 'squad-1',
      soldierIndex: 0,
      pilotArmor: 2,
      alive: true
    };

    render(
      <MachinePilotPanel
        {...defaultProps}
        pilotInfo={mockPilot}
        pilotImage="/images/pilot.jpg"
      />
    );

    expect(screen.getByText('ЖИВ')).toBeInTheDocument();
  });

  it('calls onAssignPilot when clicked', () => {
    const onAssignPilot = jest.fn();
    render(<MachinePilotPanel {...defaultProps} onAssignPilot={onAssignPilot} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onAssignPilot).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- MachinePilotPanel.test.tsx --no-coverage
```

Expected: FAIL with component not defined

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/machine-view/MachinePilotPanel.tsx
import React from 'react';
import { Plane, Skull } from 'lucide-react';
import { GitHubPagesImage as Image } from '@/components/GitHubPagesImage';
import { PilotInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PilotSurvivalTest {
  roll: number;
  survived: boolean;
  testedAt: number;
}

interface MachinePilotPanelProps {
  pilotInfo: PilotInfo | null;
  pilotImage: string | null;
  survivalTest: PilotSurvivalTest | null;
  onAssignPilot: () => void;
  onSurvivalTest: () => void;
  isTestRunning?: boolean;
}

export function MachinePilotPanel({
  pilotInfo,
  pilotImage,
  survivalTest,
  onAssignPilot,
  onSurvivalTest,
  isTestRunning = false
}: MachinePilotPanelProps) {

  return (
    <div className="row-span-2 w-12 h-28 md:w-14 md:h-28 shrink-0 relative">
      <button
        onClick={onAssignPilot}
        className="w-full h-full rounded-sm border-2 border-slate-700/50 overflow-hidden bg-slate-900/60 relative"
      >
        {/* Tech corners */}
        <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/40" />
        <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-slate-600/40" />
        <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-slate-600/40" />
        <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/40" />

        {pilotInfo ? (
          <>
            <Image
              src={pilotImage || '/images/soldiers/empty.png'}
              width={48}
              height={64}
              className="w-full h-full object-cover object-center"
              unoptimized
              alt="Пилот"
            />
            {/* Status overlay - Tech Style */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 text-[7px] md:text-[8px] font-mono font-bold text-center py-0.5 border-t",
              pilotInfo.alive
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-700/50"
                : "bg-red-950/90 text-red-300 border-red-700/50"
            )}>
              {pilotInfo.alive ? 'ЖИВ' : 'ПОГИБ'}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-0.5">
            <Plane className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[8px] md:text-[9px] font-mono font-bold uppercase">Пилот</span>
          </div>
        )}
      </button>

      {/* Survival Test Button - Overlay at bottom-right corner */}
      {pilotInfo && pilotInfo.alive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSurvivalTest();
          }}
          disabled={isTestRunning}
          className={cn(
            "absolute -bottom-1 -right-1 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-transform border-2 min-w-[36px] min-h-[36px]",
            isTestRunning && "animate-pulse",
            survivalTest
              ? survivalTest.survived
                ? "bg-green-600 border-green-900 text-white"
                : "bg-red-600 border-red-900 text-white"
              : isTestRunning
              ? "bg-purple-600 border-purple-900 text-white animate-spin"
              : "bg-purple-900 border-purple-950 text-purple-300 hover:bg-purple-800 hover:scale-110"
          )}
          title={survivalTest ? `Повторить тест (последний: ${survivalTest.survived ? 'ВЫЖИЛ' : 'ПОГИБ'})` : "Тест выживаемости пилота (D12 + D6)"}
        >
          <Skull className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- MachinePilotPanel.test.tsx --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/machine-view/MachinePilotPanel.tsx src/__tests__/components/unit-card/MachinePilotPanel.test.tsx
git commit -m "refactor(unit-card): extract MachinePilotPanel component with tests"
```

---

## Task 9: Create MachineView component

**Files:**
- Modify: `src/components/cards/unit-card/MachineView.tsx`
- Create: `src/__tests__/components/unit-card/MachineView.test.tsx`

**Reference:** `src/components/cards/UnitCard.tsx` lines 720-1090 (Machine layout sections)

**Step 1: Write the failing test**

```typescript
// src/__tests__/components/unit-card/MachineView.test.tsx
import { render, screen } from '@testing-library/react';
import { MachineView } from '@/components/cards/unit-card/MachineView';
import { ArmyUnit, Machine, DurabilityZone } from '@/lib/types';

describe('MachineView', () => {
  const mockMachine: Machine = {
    id: 'test_machine',
    name: 'Test Machine',
    shortName: 'TM',
    faction: 'polaris',
    cost: 100,
    rank: 2,
    fire_rate: 2,
    ammo_max: 20,
    durability_max: 16,
    image: '/images/test.jpg',
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 }
    ],
    weapons: [
      { name: 'Cannon', range: 'D12', power: '2D20' }
    ]
  };

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'machine',
    data: mockMachine,
    currentDurability: 12,
    currentAmmo: 15,
    machineShotsUsed: 0,
    machineWeaponShots: {}
  };

  const mockZone: DurabilityZone = {
    max: 16,
    color: 'green',
    damagePerDie: { D6: 1, D12: 2, D20: 3 }
  };

  const defaultProps = {
    unit: mockUnit,
    zone: mockZone,
    speed: 2,
    updateDurability: jest.fn(),
    updateAmmo: jest.fn(),
    onWeaponAttack: jest.fn(),
    onWeaponInfo: jest.fn(),
    onPilotAssign: jest.fn(),
    onPilotRemove: jest.fn(),
    onPilotSurvivalTest: jest.fn(),
    rulesVersion: 'tehnolog' as const,
    usePerWeaponAmmo: false,
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5
  };

  it('renders machine stats panel', () => {
    render(<MachineView {...defaultProps} />);

    expect(screen.getByText('Прочность')).toBeInTheDocument();
    expect(screen.getByText('Скорость')).toBeInTheDocument();
  });

  it('renders ammo panel', () => {
    render(<MachineView {...defaultProps} />);

    expect(screen.getByText('Боезапас')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- MachineView.test.tsx --no-coverage
```

Expected: FAIL with component not defined

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/MachineView.tsx
import React from 'react';
import { ArmyUnit, Machine, DurabilityZone, RulesVersionID } from '@/lib/types';
import { MachineStatsPanel } from './machine-view/MachineStatsPanel';
import { MachineAmmoPanel } from './machine-view/MachineAmmoPanel';
import { MachineWeaponsList } from './machine-view/MachineWeaponsList';
import { MachinePilotPanel } from './machine-view/MachinePilotPanel';

interface MachineViewProps {
  unit: ArmyUnit;
  zone: DurabilityZone;
  speed: number;
  updateDurability: (delta: number) => void;
  updateAmmo: (delta: number) => void;
  onWeaponAttack: (weaponIndex: number) => void;
  onWeaponInfo: (weapon: Weapon, weaponIdx: number) => void;
  onPilotAssign: () => void;
  onPilotRemove: () => void;
  onPilotSurvivalTest: () => void;
  pilotSurvivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  pilotImage: string | null;
  isPilotTestRunning: boolean;
  rulesVersion: RulesVersionID;
  usePerWeaponAmmo: boolean;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
}

export function MachineView({
  unit,
  zone,
  speed,
  updateDurability,
  updateAmmo,
  onWeaponAttack,
  onWeaponInfo,
  onPilotAssign,
  onPilotSurvivalTest,
  pilotSurvivalTest,
  pilotImage,
  isPilotTestRunning,
  rulesVersion,
  usePerWeaponAmmo,
  distanceInputUnit,
  stepToCmFactor
}: MachineViewProps) {
  const data = unit.data as Machine;

  // Get pilot image
  const getPilotImage = (): string | null => {
    if (!unit.pilotInfo) return null;
    return pilotImage;
  };

  return (
    <div className="space-y-2">
      {/* Machine Stats Header - Tech Layout */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        {/* ROW 1: Durability+Speed | PILOT (spans 2 rows) */}
        <MachineStatsPanel
          currentDurability={unit.currentDurability || 0}
          maxDurability={data.durability_max}
          speed={speed}
          zone={zone}
          onUpdateDurability={updateDurability}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
        />

        <MachinePilotPanel
          pilotInfo={unit.pilotInfo || null}
          pilotImage={getPilotImage()}
          survivalTest={pilotSurvivalTest}
          onAssignPilot={onPilotAssign}
          onSurvivalTest={onPilotSurvivalTest}
          isTestRunning={isPilotTestRunning}
        />

        {/* ROW 2: Ammo+Shots | (pilot continues) */}
        <MachineAmmoPanel
          currentAmmo={unit.currentAmmo || 0}
          maxAmmo={data.ammo_max}
          shotsUsed={unit.machineShotsUsed || 0}
          weapons={data.weapons}
          weaponShots={unit.machineWeaponShots || {}}
          weaponAmmo={unit.weaponAmmo}
          onUpdateAmmo={updateAmmo}
          onWeaponAttack={onWeaponAttack}
          onWeaponInfo={onWeaponInfo}
          usePerWeaponAmmo={usePerWeaponAmmo}
          rulesVersion={rulesVersion}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
        />
      </div>

      {/* Weapons List */}
      {!usePerWeaponAmmo && (
        <MachineWeaponsList
          weapons={data.weapons}
          weaponShots={unit.machineWeaponShots || {}}
          onWeaponAttack={onWeaponAttack}
          onWeaponInfo={onWeaponInfo}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
        />
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- MachineView.test.tsx --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/MachineView.tsx src/__tests__/components/unit-card/MachineView.test.tsx
git commit -m "refactor(unit-card): extract MachineView component with tests"
```

---

## Task 10: Create SquadView component

**Files:**
- Modify: `src/components/cards/unit-card/SquadView.tsx`
- Create: `src/__tests__/components/unit-card/SquadView.test.tsx`

**Reference:** `src/components/cards/UnitCard.tsx` lines 700-719 (Soldiers grid)

**Step 1: Write the failing test**

```typescript
// src/__tests__/components/unit-card/SquadView.test.tsx
import { render, screen } from '@testing-library/react';
import { SquadView } from '@/components/cards/unit-card/SquadView';
import { ArmyUnit, Squad } from '@/lib/types';

describe('SquadView', () => {
  const mockSquad: Squad = {
    id: 'test_squad',
    name: 'Test Squad',
    shortName: 'TS',
    faction: 'polaris',
    cost: 100,
    soldiers: [
      { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
    ]
  };

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'squad',
    data: mockSquad,
    actionsUsed: [{}]
  };

  const defaultProps = {
    unit: mockUnit,
    updateUnit: jest.fn(),
    onSoldierAction: jest.fn(),
    setShowSoldierImage: jest.fn(),
    setShowPanicModal: jest.fn(),
    rulesVersion: 'tehnolog' as const,
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5
  };

  it('renders soldiers grid', () => {
    render(<SquadView {...defaultProps} />);

    // SoldierCard should be rendered
    const soldierCards = document.querySelectorAll('[data-testid^="soldier-card-"]');
    expect(soldierCards.length).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- SquadView.test.tsx --no-coverage
```

Expected: FAIL with component not defined

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/unit-card/SquadView.tsx
import React from 'react';
import { ArmyUnit, Squad, RulesVersionID } from '@/lib/types';
import SoldierCard from '../SoldierCard';

interface SquadViewProps {
  unit: ArmyUnit;
  updateUnit: (instanceId: string, updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => void;
  onSoldierAction: (soldierIndex: number) => void;
  setShowSoldierImage: (idx: number | null) => void;
  setShowPanicModal: (value: boolean) => void;
  rulesVersion: RulesVersionID;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
}

export function SquadView({
  unit,
  updateUnit,
  onSoldierAction,
  setShowSoldierImage,
  setShowPanicModal,
  rulesVersion,
  distanceInputUnit,
  stepToCmFactor
}: SquadViewProps) {
  const data = unit.data as Squad;

  return (
    <div className="grid grid-cols-1 gap-1.5 md:gap-2">
      {data.soldiers.map((s, idx) => (
        <SoldierCard
          key={`soldier-${unit.instanceId}-${idx}-${s.num}`}
          squad={data}
          unit={unit}
          soldierIndex={idx}
          updateUnit={updateUnit}
          onSoldierAction={onSoldierAction}
          setShowSoldierImage={setShowSoldierImage}
          setShowPanicModal={setShowPanicModal}
          rulesVersion={rulesVersion}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
        />
      ))}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- SquadView.test.tsx --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/cards/unit-card/SquadView.tsx src/__tests__/components/unit-card/SquadView.test.tsx
git commit -m "refactor(unit-card): extract SquadView component with tests"
```

---

## Task 11: Refactor main UnitCard to use new components

**Files:**
- Modify: `src/components/cards/UnitCard.tsx` (大幅简化)
- Backup: `src/components/cards/UnitCard.legacy.tsx`

**Reference:** Original `src/components/cards/UnitCard.tsx` (full file)

**Step 1: Backup original UnitCard**

```bash
cp src/components/cards/UnitCard.tsx src/components/cards/UnitCard.legacy.tsx
git add src/components/cards/UnitCard.legacy.tsx
git commit -m "refactor(unit-card): backup original UnitCard as legacy"
```

**Step 2: Write new simplified UnitCard**

```typescript
// src/components/cards/UnitCard.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArmyUnit, Machine, Squad, Weapon, RulesVersionID, CombatLogEntry, PilotInfo } from '@/lib/types';
import { X, Image as ImageIcon } from 'lucide-react';
import { GitHubPagesImage as Image } from '../GitHubPagesImage';
import { cn } from '@/lib/utils';
import { formatUnitNumber } from '@/lib/unit-utils';

// New components
import { UnitCardHeader } from './unit-card/UnitCardHeader';
import { SquadView } from './unit-card/SquadView';
import { MachineView } from './unit-card/MachineView';

// New hooks
import { useMachineStats } from './unit-card/hooks/useMachineStats';
import { useUnitCardState, PilotSurvivalTest } from './unit-card/hooks/useUnitCardState';

// Existing components and hooks (no changes)
import { BottomSheetCombatModal } from '../combat/BottomSheetCombatModal';
import { useCombatFlowController } from '../combat/CombatFlowController';
import { PilotAssignmentModal } from '../modals/PilotAssignmentModal';
import { PilotTestModal } from '../combat/PilotTestModal';
import { usePilotTestFlow } from '@/hooks/usePilotTestFlow';
import { EncyclopediaModal } from '../modals/EncyclopediaModal';
import { PanicTestModal } from '../modals/PanicTestModal';
import { UnitWithType } from '@/lib/encyclopedia-utils';

interface UnitCardProps {
  unit: ArmyUnit;
  updateUnit: (instanceId: string, updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => void;
  combatLog?: CombatLogEntry[];
  onCombatLogEntry?: (entry: CombatLogEntry) => void;
  allUnits?: ArmyUnit[];
  onPilotAssign?: (machineInstanceId: string, pilotInfo: PilotInfo) => void;
  onPilotRemove?: (machineInstanceId: string) => void;
  onNavigateToUnit?: (unitInstanceId: string) => void;
  strictPilotRankEnabled?: boolean;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
  autoCompleteEnabled?: boolean;
}

export default function UnitCard({
  unit,
  updateUnit,
  combatLog: _combatLog = [],
  onCombatLogEntry,
  allUnits = [],
  onPilotAssign,
  onPilotRemove,
  onNavigateToUnit: _onNavigateToUnit,
  strictPilotRankEnabled = true,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
  autoCompleteEnabled = true,
}: UnitCardProps) {
  // Custom hooks
  const cardState = useUnitCardState(unit);
  const machineStats = useMachineStats(unit, updateUnit);
  const combatController = useCombatFlowController();
  const pilotTestFlow = usePilotTestFlow();
  const lastProcessedResultRef = useRef<number | null>(null);

  const isSquad = unit.type === 'squad';
  const data = unit.data;

  // Helper to wrap updateUnit
  const updateThisUnit = (updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => {
    updateUnit(unit.instanceId, updateFn);
  };

  // Calculate unit state
  const isSquadDone = isSquad && (data as Squad).soldiers.every((_, idx) => {
    const isDead = unit.deadSoldiers?.includes(idx);
    const isDone = unit.actionsUsed?.[idx]?.done;
    return isDead || isDone;
  });

  const isAllDead = isSquad && unit.deadSoldiers?.length === (data as Squad).soldiers.length;
  const isMachineDestroyed = !isSquad && (unit.currentDurability === 0);
  const isMachineDone = !isSquad && (unit.isMachineDone || isMachineDestroyed);

  // Per-weapon ammo system
  const usePerWeaponAmmo = cardState.rulesVersion === 'community_star_system';

  // Image overlay handlers
  const getSoldierImage = useCallback((idx: number) => {
    if (!isSquad) return '/images/soldiers/empty.png';
    const soldier = (data as Squad).soldiers[idx];
    if (soldier.image) {
      return soldier.image;
    }
    return '/images/soldiers/empty.png';
  }, [isSquad, data]);

  const [showSoldierImage, setShowSoldierImage] = useState<number | null>(null);

  const getPilotImage = (): string | null => {
    if (!unit.pilotInfo) return null;
    const squad = allUnits.find(u => u.instanceId === unit.pilotInfo?.squadInstanceId);
    if (!squad || squad.type !== 'squad') return null;
    const soldier = (squad.data as Squad).soldiers[unit.pilotInfo.soldierIndex];
    return soldier.image || null;
  };

  // Combat handlers
  const handleSoldierAction = useCallback((soldierIndex: number) => {
    combatController.startCombat(unit, soldierIndex);
  }, [unit, combatController]);

  const handleVehicleAttack = useCallback((weaponIndex: number) => {
    combatController.startCombat(unit, undefined, weaponIndex, 'shot');
  }, [unit, combatController]);

  // Panic test handler
  const handlePanicTestComplete = (results: any[]) => {
    const currentTurn = 1;
    const panicStates = results
      .filter((r: any) => r.isPanic)
      .map((r: any) => ({
        soldierIndex: r.soldierIndex,
        testRoll: r.roll,
        rank: r.rank,
        triggeredAtTurn: currentTurn,
      }));

    if (panicStates.length > 0) {
      updateThisUnit((u) => ({ ...u, panicState: panicStates }));
    }
  };

  // Pilot handlers
  const handlePilotAssign = useCallback((pilotInfo: PilotInfo) => {
    if (onPilotAssign) {
      onPilotAssign(unit.instanceId, pilotInfo);
    }
  }, [onPilotAssign, unit.instanceId]);

  const handlePilotRemove = useCallback(() => {
    if (onPilotRemove) {
      onPilotRemove(unit.instanceId);
    }
  }, [onPilotRemove, unit.instanceId]);

  const handlePilotSurvivalTest = useCallback(() => {
    if (!unit.pilotInfo || !unit.pilotInfo.alive) return;

    const machineArmor = unit.currentDurability || (unit.data as Machine).durability_max;
    const pilotArmor = unit.pilotInfo.pilotArmor || 0;

    pilotTestFlow.startTest(machineArmor, pilotArmor, (armorRoll, survivalRoll, survived) => {
      cardState.setPilotSurvivalTest({
        roll: survivalRoll ?? armorRoll,
        survived,
        testedAt: Date.now()
      });

      if (!survived && unit.pilotInfo) {
        const updatedPilotInfo: PilotInfo = {
          squadInstanceId: unit.pilotInfo.squadInstanceId || '',
          soldierIndex: unit.pilotInfo.soldierIndex || 0,
          pilotArmor: unit.pilotInfo.pilotArmor || 0,
          alive: false
        };
        updateThisUnit((u) => ({ ...u, pilotInfo: updatedPilotInfo }));
      }
    });
  }, [unit, pilotTestFlow, cardState, updateThisUnit]);

  // Reset survival test when pilot changes or durability increases
  useEffect(() => {
    cardState.setPilotSurvivalTest(null);
  }, [unit.pilotInfo, unit.currentDurability]);

  // Combat completion handling
  useEffect(() => {
    if (combatController.state.phase === 'RESULTS' && combatController.state.result) {
      const result = combatController.state.result;

      if (lastProcessedResultRef.current === result.timestamp) {
        return;
      }

      if (result.actionType === 'shot' || result.actionType === 'grenade') {
        if (result.actionType === 'grenade' && result.unitType === 'squad') {
          updateThisUnit((u) => ({ ...u, grenadesUsed: true }));
        }
        if (result.unitType === 'machine') {
          const weaponIndex = result.parameters.weaponIndex || 0;
          const weapon = (unit.data as Machine).weapons[weaponIndex];
          const isMeleeWeapon = weapon?.range === 'ББ';

          const newShotsUsed = (unit.machineShotsUsed || 0) + 1;
          const newWeaponShots = {
            ...(unit.machineWeaponShots || {}),
            [weaponIndex]: (unit.machineWeaponShots?.[weaponIndex] || 0) + 1
          };

          if (usePerWeaponAmmo && !isMeleeWeapon) {
            const newWeaponAmmo = [...(unit.weaponAmmo || [])];
            newWeaponAmmo[weaponIndex] = Math.max(0, (newWeaponAmmo[weaponIndex] || 0) - 1);

            updateThisUnit((u) => ({
              ...u,
              weaponAmmo: newWeaponAmmo,
              currentAmmo: Math.max(0, (u.currentAmmo || 0) - 1),
              machineShotsUsed: newShotsUsed,
              machineWeaponShots: newWeaponShots,
              isMachineShot: true
            }));
          } else {
            const newAmmo = isMeleeWeapon
              ? (unit.currentAmmo || 0)
              : Math.max(0, (unit.currentAmmo || 0) - 1);

            updateThisUnit((u) => ({
              ...u,
              currentAmmo: newAmmo,
              machineShotsUsed: newShotsUsed,
              machineWeaponShots: newWeaponShots,
              isMachineShot: true
            }));
          }
        }
      } else if (result.actionType === 'melee') {
        if (result.unitType === 'squad' && result.soldierIndex !== undefined) {
          const newActions = [...(unit.actionsUsed || [])];
          newActions[result.soldierIndex] = {
            ...newActions[result.soldierIndex],
            melee: true
          };
          updateThisUnit((u) => ({ ...u, actionsUsed: newActions }));
        } else if (result.unitType === 'machine') {
          updateThisUnit((u) => ({ ...u, isMachineMelee: true }));
        }
      }

      lastProcessedResultRef.current = result.timestamp;
    }
  }, [combatController.state.phase, combatController.state.result, unit, usePerWeaponAmmo, updateThisUnit]);

  const handleApplyResult = useCallback((markAsDone?: boolean) => {
    const result = combatController.state.result;

    if (isSquad && result?.soldierIndex !== undefined) {
      const soldierIdx = result.soldierIndex;
      const newActions = [...(unit.actionsUsed || [])];

      if (result.actionType === 'shot') {
        newActions[soldierIdx] = {
          ...newActions[soldierIdx],
          shot: true
        };
      } else if (result.actionType === 'melee') {
        newActions[soldierIdx] = {
          ...newActions[soldierIdx],
          melee: true
        };
      }

      if (markAsDone) {
        newActions[soldierIdx] = {
          ...newActions[soldierIdx],
          done: true
        };
      }

      updateThisUnit((u) => ({ ...u, actionsUsed: newActions }));
    }

    if (combatController.state.result && onCombatLogEntry) {
      const entry: CombatLogEntry = {
        id: `${combatController.state.result.unitId}-${combatController.state.result.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: combatController.state.result.timestamp,
        result: combatController.state.result,
        applied: true,
      };
      onCombatLogEntry(entry);
    }
    combatController.closeCombat();
  }, [combatController, isSquad, unit, updateThisUnit, onCombatLogEntry]);

  const handleOpenOriginal = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isSquad) {
      cardState.setShowDetailsModal(true);
    } else if (data.originalUrl) {
      window.open(data.originalUrl, '_blank');
    } else {
      cardState.setShowImage(true);
    }
  }, [isSquad, data, cardState]);

  const handleToggleDone = useCallback(() => {
    if (isSquad) {
      const targetState = !isSquadDone;
      const newActions = (unit.actionsUsed || Array((data as Squad).soldiers.length).fill({ moved: false, shot: false, melee: false, done: false }))
        .map((action, idx) => {
          const isDead = unit.deadSoldiers?.includes(idx);
          if (isDead) return action;
          return { ...action, done: targetState };
        });
      updateThisUnit((u) => ({ ...u, actionsUsed: newActions }));
    } else {
      updateThisUnit((u) => ({ ...u, isMachineDone: !isMachineDone }));
    }
  }, [isSquad, isSquadDone, isMachineDone, unit, data, updateThisUnit]);

  const handleWeaponInfo = useCallback((weapon: Weapon, weaponIdx: number) => {
    setSelectedWeaponInfo({ weapon, weaponIdx });
  }, []);

  const [selectedWeaponInfo, setSelectedWeaponInfo] = useState<{ weapon: Weapon; weaponIdx: number } | null>(null);

  // Faction border color
  const factionBorderColor = data.faction === 'polaris'
    ? 'rgba(220, 38, 38, 0.6)'
    : data.faction === 'protectorate'
    ? 'rgba(8, 145, 178, 0.6)'
    : 'rgba(202, 138, 4, 0.6)';

  return (
    <div
      onDoubleClick={handleOpenOriginal}
      className={cn(
        "bg-slate-900/80 rounded-sm border-2 border-slate-800 transition-all shadow-lg overflow-hidden relative cursor-default select-none",
        (isSquadDone || (isMachineDone && !isMachineDestroyed)) ? "opacity-70 grayscale-[0.3]" : "",
        isAllDead || isMachineDestroyed ? "opacity-40 grayscale" : "",
        data.faction === 'polaris' ? "border-red-600/30" : data.faction === 'protectorate' ? "border-cyan-600/30" : "border-yellow-600/30"
      )}
    >
      {/* Unit number badge */}
      {unit.instanceNumber && (
        <div className={cn(
          "absolute top-0 left-0 z-20 px-1.5 py-0.5 rounded-br-sm font-mono font-bold text-xs md:text-sm border border-r-2 border-b-2 pointer-events-none",
          data.faction === 'polaris'
            ? "bg-red-950/90 text-red-400 border-red-600/40"
            : data.faction === 'protectorate'
            ? "bg-cyan-950/90 text-cyan-400 border-cyan-600/40"
            : "bg-yellow-950/90 text-yellow-400 border-yellow-600/40"
        )}>
          {formatUnitNumber(unit)}
        </div>
      )}

      {/* Tech corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 -ml-px -mt-px pointer-events-none" style={{ borderColor: factionBorderColor }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 -mr-px -mt-px pointer-events-none" style={{ borderColor: factionBorderColor }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 -ml-px -mb-px pointer-events-none" style={{ borderColor: factionBorderColor }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 -mr-px -mb-px pointer-events-none" style={{ borderColor: factionBorderColor }} />

      {/* Modals */}
      {combatController.isOpen && (
        <BottomSheetCombatModal
          state={combatController.state}
          rulesVersion={cardState.rulesVersion}
          onGoBack={combatController.goBack}
          onClose={combatController.cancelCombat}
          onSelectAction={combatController.selectAction}
          onSetParameters={combatController.setParameters}
          onExecuteAction={combatController.executeAction}
          onApplyResult={handleApplyResult}
          onGrenadeCheckTarget={combatController.checkGrenadeTarget}
          grenadesAvailable={isSquad && !unit.grenadesUsed}
          unitDisplayName={`${formatUnitNumber(unit)} - ${data.name}`}
          autoCompleteEnabled={autoCompleteEnabled}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
        />
      )}

      {!isSquad && cardState.showPilotModal && (
        <PilotAssignmentModal
          isOpen={cardState.showPilotModal}
          onClose={() => cardState.setShowPilotModal(false)}
          machine={unit as ArmyUnit & { data: Machine }}
          allUnits={allUnits}
          onAssignPilot={handlePilotAssign}
          onRemovePilot={handlePilotRemove}
          strictPilotRankEnabled={strictPilotRankEnabled}
        />
      )}

      {pilotTestFlow.isOpen && (
        <PilotTestModal
          isOpen={pilotTestFlow.isOpen}
          state={pilotTestFlow.state}
          onClose={pilotTestFlow.closeTest}
          onApply={pilotTestFlow.onApply}
        />
      )}

      {cardState.showDetailsModal && !isSquad && (
        <EncyclopediaModal
          unit={{ ...data, type: 'machine' } as UnitWithType}
          isOpen={cardState.showDetailsModal}
          onClose={() => cardState.setShowDetailsModal(false)}
          scrollTarget="machine-images"
        />
      )}

      {cardState.showPanicModal && (
        <PanicTestModal
          isOpen={cardState.showPanicModal}
          unit={unit}
          rulesVersion={cardState.rulesVersion}
          onTestComplete={handlePanicTestComplete}
          onClose={() => cardState.setShowPanicModal(false)}
        />
      )}

      {/* Weapon Info Modal */}
      {selectedWeaponInfo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedWeaponInfo(null)}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedWeaponInfo(null)} aria-hidden="true" />
          <div className="relative bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h2 className="text-xl font-semibold">Информация об оружии</h2>
              </div>
              <button onClick={() => setSelectedWeaponInfo(null)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <h3 className="font-mono font-bold text-lg text-white">{selectedWeaponInfo.weapon.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-[10px] font-mono opacity-50 uppercase mb-1">Дальность</div>
                  <div className="font-mono font-bold text-amber-400 text-lg">{selectedWeaponInfo.weapon.range}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-[10px] font-mono opacity-50 uppercase mb-1">Мощность</div>
                  <div className="text-lg font-mono font-bold text-red-400">{selectedWeaponInfo.weapon.power}</div>
                </div>
              </div>
              {selectedWeaponInfo.weapon.special && (
                <div className="bg-purple-950/20 rounded-lg p-3 border border-purple-700/30">
                  <div className="text-[10px] font-mono opacity-50 uppercase mb-1">Особые правила</div>
                  <div className="text-sm font-mono text-purple-300">
                    {typeof selectedWeaponInfo.weapon.special === 'string'
                      ? selectedWeaponInfo.weapon.special
                      : 'Особый'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Overlays */}
      {cardState.showImage && data.image && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-2 animate-in fade-in duration-200" onClick={() => cardState.setShowImage(false)}>
          <div className="flex justify-between items-center mb-1 px-2 shrink-0">
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest truncate max-w-[70%]">{data.name}</span>
            <button className="text-[10px] bg-slate-800 px-2 py-1 rounded font-mono shrink-0">X</button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden rounded border border-slate-700 flex items-center justify-center bg-slate-900">
            <Image src={data.image} alt={data.name} width={400} height={300} className="max-w-full max-h-full object-contain" unoptimized />
          </div>
          <p className="text-[9px] text-center opacity-40 mt-1 shrink-0">Нажмите, чтобы закрыть</p>
        </div>
      )}

      {showSoldierImage !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-2 animate-in fade-in duration-200" onClick={() => setShowSoldierImage(null)}>
          <div className="flex justify-between items-center mb-1 px-2 shrink-0">
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest truncate max-w-[70%]">
              {data.name} - СОЛДАТ {showSoldierImage + 1}
            </span>
            <button className="text-[10px] bg-slate-800 px-2 py-1 rounded font-mono shrink-0">X</button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden rounded border border-slate-700 flex items-center justify-center bg-slate-900">
            <Image
              src={getSoldierImage(showSoldierImage)}
              alt={`Солдат ${showSoldierImage + 1}`}
              width={300}
              height={400}
              className="max-w-full max-h-full object-contain"
              unoptimized
            />
          </div>
          <p className="text-[9px] text-center opacity-40 mt-1 shrink-0">Нажмите, чтобы закрыть</p>
        </div>
      )}

      {/* Header */}
      <UnitCardHeader
        unit={unit}
        isDone={isSquad ? isSquadDone : isMachineDone}
        isAllDead={isAllDead}
        grenadesAvailable={isSquad && !unit.grenadesUsed}
        grenadesUsed={unit.grenadesUsed}
        onToggleDone={handleToggleDone}
        onOpenDetails={handleOpenOriginal}
        showPhotoButton={!isSquad}
        onShowPhoto={() => cardState.setShowImage(true)}
      />

      {/* Content */}
      <div className="p-2 md:p-3 relative z-10">
        {isSquad ? (
          <SquadView
            unit={unit}
            updateUnit={updateUnit}
            onSoldierAction={handleSoldierAction}
            setShowSoldierImage={setShowSoldierImage}
            setShowPanicModal={cardState.setShowPanicModal}
            rulesVersion={cardState.rulesVersion}
            distanceInputUnit={distanceInputUnit}
            stepToCmFactor={stepToCmFactor}
          />
        ) : (
          <MachineView
            unit={unit}
            zone={machineStats.zone}
            speed={machineStats.speed}
            updateDurability={machineStats.updateDurability}
            updateAmmo={(delta) => {
              const max = (data as Machine).ammo_max;
              const current = unit.currentAmmo || 0;
              const newVal = Math.max(0, Math.min(max, current + delta));
              updateThisUnit((u) => ({ ...u, currentAmmo: newVal }));
            }}
            onWeaponAttack={handleVehicleAttack}
            onWeaponInfo={handleWeaponInfo}
            onPilotAssign={() => cardState.setShowPilotModal(true)}
            onPilotRemove={handlePilotRemove}
            onPilotSurvivalTest={handlePilotSurvivalTest}
            pilotSurvivalTest={cardState.pilotSurvivalTest}
            pilotImage={getPilotImage()}
            isPilotTestRunning={pilotTestFlow.isOpen}
            rulesVersion={cardState.rulesVersion}
            usePerWeaponAmmo={usePerWeaponAmmo}
            distanceInputUnit={distanceInputUnit}
            stepToCmFactor={stepToCmFactor}
          />
        )}
      </div>
    </div>
  );
}
```

**Step 3: Run tests to verify nothing broke**

```bash
npm test
```

Expected: All existing tests pass

**Step 4: Run E2E tests**

```bash
npm run test:e2e
```

Expected: All E2E tests pass

**Step 5: Manual smoke test**
- Start dev server: `npm run dev`
- Navigate to app
- Create a squad army
- Test combat flow
- Test machine durability/ammo
- Test pilot assignment
- Verify all modals work

**Step 6: Commit if all tests pass**

```bash
git add src/components/cards/UnitCard.tsx
git commit -m "refactor(unit-card): rewrite UnitCard as orchestrator using new components"
```

---

## Task 12: Verify and Finalize

**Files:**
- Check: Line count of new UnitCard.tsx
- Check: All tests passing
- Optional: Delete UnitCard.legacy.tsx

**Step 1: Verify line count reduction**

```bash
wc -l src/components/cards/UnitCard.tsx
```

Expected: ~200 lines (down from 1238)

**Step 2: Run full test suite**

```bash
npm run validate
npm run test:e2e
```

Expected: All tests pass

**Step 3: Code review checklist**

- [ ] All Jest tests pass
- [ ] All E2E tests pass
- [ ] Manual smoke test completed
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] All imports resolve correctly
- [ ] Components are properly exported
- [ ] Hooks are properly typed

**Step 4: Delete legacy backup (optional)**

```bash
# Only after confirming everything works
git rm src/components/cards/UnitCard.legacy.tsx
git commit -m "refactor(unit-card): remove legacy UnitCard backup"
```

**Step 5: Final commit with tag**

```bash
git tag -a v1.0.0-unitcard-refactor -m "UnitCard refactoring complete - 1238 lines to ~200 lines"
git push origin unit-card --tags
```

---

## Summary

**Files Created:**
- `src/components/cards/unit-card/hooks/useMachineStats.ts` (~60 lines)
- `src/components/cards/unit-card/hooks/useUnitCardState.ts` (~80 lines)
- `src/components/cards/unit-card/UnitCardHeader.tsx` (~80 lines)
- `src/components/cards/unit-card/SquadView.tsx` (~30 lines)
- `src/components/cards/unit-card/MachineView.tsx` (~40 lines)
- `src/components/cards/unit-card/machine-view/MachineStatsPanel.tsx` (~120 lines)
- `src/components/cards/unit-card/machine-view/MachineAmmoPanel.tsx` (~100 lines)
- `src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx` (~150 lines)
- `src/components/cards/unit-card/machine-view/MachinePilotPanel.tsx` (~120 lines)

**Test Files Created:**
- `src/__tests__/hooks/useMachineStats.test.ts`
- `src/__tests__/hooks/useUnitCardState.test.ts`
- `src/__tests__/components/unit-card/UnitCardHeader.test.tsx`
- `src/__tests__/components/unit-card/MachineStatsPanel.test.tsx`
- `src/__tests__/components/unit-card/MachineAmmoPanel.test.tsx`
- `src/__tests__/components/unit-card/MachineWeaponsList.test.tsx`
- `src/__tests__/components/unit-card/MachinePilotPanel.test.tsx`
- `src/__tests__/components/unit-card/MachineView.test.tsx`
- `src/__tests__/components/unit-card/SquadView.test.tsx`

**Files Modified:**
- `src/components/cards/UnitCard.tsx` (1238 → ~200 lines)

**Total Estimated Time:** 9-13 hours
