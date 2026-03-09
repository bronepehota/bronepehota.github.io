# UnitCard Refactoring Design

**Date:** 2026-03-09
**Status:** Approved
**Approach:** Component Decomposition

## Problem Statement

`UnitCard.tsx` is 1238 lines and handles too many responsibilities:
- Display/UI for squads and machines
- Combat system integration
- Pilot assignment & survival test systems
- Panic test modal
- Image overlays (full-screen viewers)
- Weapon info modal
- State management (combat flow, pilot test flow)
- Rules version handling
- Machine stats calculation (durability zones, speed sectors)

This makes the component:
- Difficult to understand and maintain
- Hard to test individual features
- Risky to modify (high coupling)
- Not reusable for other contexts

## Goals

1. **Improve maintainability** - Smaller, focused components
2. **Enable reuse** - Extract reusable components
3. **Prepare for new features** - Easier to extend

## Architecture

### Component Hierarchy

```
UnitCard (main orchestrator, ~200 lines)
├── UnitCardHeader (unit name, badges, done toggle)
├── SquadView (soldiers grid)
│   └── SoldierCard (already exists, no changes)
├── MachineView
│   ├── MachineStatsPanel (durability, speed controls)
│   ├── MachineAmmoPanel (ammo, shots tracking)
│   ├── MachineWeaponsList (weapons with attack buttons)
│   └── MachinePilotPanel (pilot display, assignment, survival test)
└── [Modals remain as-is] (BottomSheetCombatModal, PilotAssignmentModal, etc.)
```

### File Structure

```
src/components/cards/
├── UnitCard.tsx (main orchestrator, ~200 lines)
├── unit-card/
│   ├── UnitCardHeader.tsx (~80 lines)
│   ├── SquadView.tsx (~30 lines)
│   ├── MachineView.tsx (~40 lines)
│   ├── machine-view/
│   │   ├── MachineStatsPanel.tsx (~120 lines)
│   │   ├── MachineAmmoPanel.tsx (~100 lines)
│   │   ├── MachineWeaponsList.tsx (~150 lines)
│   │   └── MachinePilotPanel.tsx (~120 lines)
│   └── hooks/
│       ├── useMachineStats.ts (~60 lines)
│       └── useUnitCardState.ts (~80 lines)
```

### Responsibility Allocation

| Component | Responsibilities | Est. Lines |
|-----------|------------------|------------|
| `UnitCard` | Orchestration, modal state, rules version, combat flow | 200 |
| `UnitCardHeader` | Unit name, badges, done toggle button | 80 |
| `SquadView` | Soldiers grid layout | 30 |
| `MachineView` | Machine panels layout | 40 |
| `MachineStatsPanel` | Durability controls, speed display | 120 |
| `MachineAmmoPanel` | Ammo progress bar, shots counter | 100 |
| `MachineWeaponsList` | Weapons with attack buttons | 150 |
| `MachinePilotPanel` | Pilot display, assignment, survival test | 120 |
| `useMachineStats` | Machine stats logic | 60 |
| `useUnitCardState` | Shared state hooks | 80 |

## Data Flow & Interfaces

### Props Flow

```
Parent (GameSession/ArmyBuilder)
    ↓ updateUnit, allUnits, onPilotAssign/Remove, etc.
UnitCard (orchestrator)
    ├── UnitCardHeader (minimal props)
    ├── SquadView (soldiers, updateUnit, combat handlers)
    ├── MachineView (machine data, state handlers)
    │   ├── MachineStatsPanel (durability, speed, update callbacks)
    │   ├── MachineAmmoPanel (ammo, shots, update callbacks)
    │   ├── MachineWeaponsList (weapons, attack handler)
    │   └── MachinePilotPanel (pilot, assignment/test callbacks)
    └── Modals (state, handlers)
```

### Key Interfaces

```typescript
// Hook return types
interface MachineStats {
  currentDurability: number;
  maxDurability: number;
  speed: number;
  zone: DurabilityZone;
  updateDurability: (delta: number) => void;
}

interface MachineAmmo {
  currentAmmo: number;
  maxAmmo: number;
  shotsUsed: number;
  weaponAmmo?: number[];
  updateAmmo: (delta: number) => void;
}

// Component props - minimal, focused interfaces
interface UnitCardHeaderProps {
  unit: ArmyUnit;
  isDone: boolean;
  onToggleDone: () => void;
  onOpenDetails: () => void;
  showPhotoButton?: boolean;
  onShowPhoto?: () => void;
}

interface MachineStatsPanelProps {
  currentDurability: number;
  maxDurability: number;
  speed: number;
  zone: DurabilityZone;
  onUpdateDurability: (delta: number) => void;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
}

interface MachinePilotPanelProps {
  pilotInfo: PilotInfo | null;
  pilotImage: string | null;
  survivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  onAssignPilot: () => void;
  onSurvivalTest: () => void;
}
```

### Custom Hooks

```typescript
// hooks/useMachineStats.ts
export function useMachineStats(
  unit: ArmyUnit,
  updateUnit: (updateFn: (u: ArmyUnit) => ArmyUnit) => void
): MachineStats {
  // Handles getMachineSpeed, getDurabilityZone, updateMachineStat
}

// hooks/useUnitCardState.ts
export function useUnitCardState(unit: ArmyUnit) {
  // Handles modal states, image overlays, pilot test result
}
```

## Error Handling & Edge Cases

### Validation Guards

```typescript
// useMachineStats hook
export function useMachineStats(unit: ArmyUnit, updateUnit: ...) {
  // Guard: only works for machines
  if (unit.type === 'squad') {
    throw new Error('useMachineStats is for machines only');
  }

  // Guard: durability bounds checking
  const updateDurability = (delta: number) => {
    const newValue = Math.max(0, Math.min(maxDurability, current + delta));
    if (newValue === current) return; // No change needed
    updateUnit(u => ({ ...u, currentDurability: newValue }));
  };
}
```

### Modal State Coordination

Only one modal active at a time:
```typescript
const openModal = (modalName: string) => {
  setShowImage(false);
  setShowDetailsModal(false);
  setShowPilotModal(false);
  // ...then set the requested modal
};
```

### Edge Cases

| Case | Behavior |
|------|----------|
| Pilot assigned but squad deleted | Show fallback image, disable survival test |
| Durability at 0/0% | Disable damage button, enable repair only |
| Ammo at 0/0% | Disable ammo decrement, show "empty" state |
| Combat during pilot test | Disable pilot test button while combat open |
| Rules version change | Re-render all panels with new rules |

## Testing Strategy

### Unit Tests for Hooks

```typescript
// useMachineStats.test.ts
describe('useMachineStats', () => {
  it('calculates correct speed for durability sector', () => {
    // Test speed_sectors logic
  });

  it('returns correct durability zone', () => {
    // Test green/yellow/red zones
  });

  it('prevents durability from going below 0', () => {
    // Test boundary conditions
  });
});
```

### Component Tests

```typescript
// MachineStatsPanel.test.tsx
describe('MachineStatsPanel', () => {
  it('displays correct durability value', () => {
    // Render and check display
  });

  it('calls onUpdateDurability when buttons clicked', () => {
    // Test user interactions
  });

  it('disables damage button at durability 0', () => {
    // Test disabled states
  });
});
```

### Testing Checklist

- [ ] All existing Jest unit tests pass
- [ ] All existing E2E tests pass
- [ ] New hook unit tests added
- [ ] New component snapshot tests added
- [ ] Manual testing of combat flow
- [ ] Manual testing of pilot assignment/test
- [ ] Manual testing of modal interactions

### Refactoring Safety

- Git commit after each phase
- Keep old UnitCard as `UnitCard.legacy.tsx` initially
- Feature flag: `const USE_NEW_UNIT_CARD = false;`

## Implementation Phases

### Phase 1: Foundation (Low Risk)
- Create `unit-card/` directory structure
- Extract `useMachineStats` hook
- Extract `useUnitCardState` hook
- Add unit tests for new hooks
- **Estimated time:** 2-3 hours

### Phase 2: Machine Components (Medium Risk)
- Create `MachineStatsPanel` component
- Create `MachineAmmoPanel` component
- Create `MachineWeaponsList` component
- Create `MachinePilotPanel` component
- Integrate into `MachineView`
- **Estimated time:** 4-5 hours

### Phase 3: Shared Components (Low Risk)
- Create `UnitCardHeader` component
- Create `SquadView` component
- **Estimated time:** 1-2 hours

### Phase 4: Main Refactor (Final Integration)
- Rewrite `UnitCard.tsx` as orchestrator
- Remove old code, verify all functionality works
- Clean up imports
- **Estimated time:** 2-3 hours

### Total Estimated Time

9-13 hours

### Rollback Plan

- Git commit after each phase
- Revert to `UnitCard.legacy.tsx` if critical bug found
- Feature flag for switching between implementations

## Success Criteria

1. UnitCard reduced from 1238 to ~200 lines
2. All existing tests pass (Jest + E2E)
3. New hook and component tests added
4. No functional regressions
5. Code is easier to understand and modify
6. Components are reusable in other contexts
