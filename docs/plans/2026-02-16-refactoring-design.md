# Design: Radical Refactoring with Full Unit Test Coverage

**Date:** 2026-02-16
**Status:** Approved
**Approach:** Layered Refactoring (Bottom-Up)

## Overview

This document outlines a comprehensive refactoring of the bronepehota application to eliminate code duplication, improve organization, and achieve full unit test coverage. The refactoring follows a layered approach where each layer is completed and tested before moving to the next.

## Current State Analysis

### Identified Issues

1. **Faction Color Mapping Duplication** — Found in 5 components with nearly identical implementations
2. **CompactUnitCard vs CompactArmyCard** — 95% similar code, could be unified
3. **Toggle Components Pattern** — 6 toggle components with repeated patterns
4. **cn() Function Duplication** — Defined identically in 2 files, already exists in utils.ts
5. **Scattered Modal Components** — 6 modals without proper organization
6. **Inconsistent Component Naming** — Similar names for different purposes

### Impact

- Approximately 15-20% code duplication
- Difficulty in maintaining consistent styling
- Poor code organization
- Missing unit tests for utilities and hooks

## Design: Layered Refactoring

### Layer 1: New Utilities and Types

#### Files to Create

```
src/lib/
├── faction-colors.ts       # Centralized faction colors
├── constants.ts            # Application constants
```

#### faction-colors.ts

```typescript
export type FactionID = 'polaris' | 'protectorate' | 'mercenaries';

export const getFactionColors = (faction: FactionID) => ({
  text: faction === 'polaris' ? 'text-red-400' :
        faction === 'protectorate' ? 'text-blue-400' : 'text-yellow-400',
  border: faction === 'polaris' ? 'border-red-500/50' :
           faction === 'protectorate' ? 'border-blue-500/50' : 'border-yellow-500/50',
  bg: faction === 'polaris' ? 'bg-red-500/10' :
       faction === 'protectorate' ? 'bg-blue-500/10' : 'bg-yellow-500/10',
  glow: faction === 'polaris' ? 'shadow-red-500/20' :
         faction === 'protectorate' ? 'shadow-blue-500/20' : 'shadow-yellow-500/20',
  primary: faction === 'polaris' ? '#ef4444' :
            faction === 'protectorate' ? '#3b82f6' : '#eab308',
  borderSolid: faction === 'polaris' ? 'border-red-500' :
                faction === 'protectorate' ? 'border-blue-500' : 'border-yellow-500',
  bgSolid: faction === 'polaris' ? 'bg-red-500' :
            faction === 'protectorate' ? 'bg-blue-500' : 'bg-yellow-500',
  progress: faction === 'polaris' ? 'bg-red-500' :
             faction === 'protectorate' ? 'bg-blue-500' : 'bg-yellow-500',
  accent: faction === 'polaris' ? 'border-red-500' :
           faction === 'protectorate' ? 'border-blue-500' : 'border-yellow-500',
});

export const factionDisplayNames: Record<FactionID, string> = {
  polaris: 'Полярис',
  protectorate: 'Протекторат',
  mercenaries: 'Наёмники',
};
```

#### constants.ts

```typescript
export const LOCAL_STORAGE_KEYS = {
  ARMY: 'bronepehota_army',
  RULES_VERSION: 'bronepehota_rules_version',
  PANIC_ENABLED: 'bronepehota_panic_enabled',
  AIMED_SHOT_ENABLED: 'bronepehota_aimed_shot_enabled',
  SURPRISE_ATTACK_ENABLED: 'bronepehota_surprise_attack_enabled',
} as const;

export const DEFAULT_POINT_BUDGETS = [300, 350, 400, 450, 500];

export const FACTIONS: FactionID[] = ['polaris', 'protectorate', 'mercenaries'];

export const MAX_SOLDIERS_PER_SQUAD = 6;
export const MAX_WEAPONS_PER_MACHINE = 4;

export const DICE_TYPES = ['D6', 'D12', 'D20'] as const;
```

#### Unit Tests for Layer 1

- `src/__tests__/lib/faction-colors.test.ts`
- `src/__tests__/lib/constants.test.ts`

---

### Layer 2: Component Consolidation

#### 2.1. Unified Compact Card

```
src/components/cards/
├── UnifiedCompactCard.tsx
└── types.ts
```

```typescript
type CardMode = 'add' | 'remove' | 'view';

interface UnifiedCompactCardProps {
  unit: ArmyUnit | Squad | Machine;
  mode: CardMode;
  onAction?: (unit: ArmyUnit) => void;
  isSelected?: boolean;
  showCost?: boolean;
}
```

**Replaces:** `CompactUnitCard.tsx`, `CompactArmyCard.tsx`

#### 2.2. Remove cn() Duplication

**Files to update:**
- `GameSession.tsx` — remove local cn(), import from utils
- `InitiativeModal.tsx` — remove local cn(), import from utils

#### 2.3. Update All Components Using Faction Colors

**Files to update:**
- `GameSession.tsx`
- `InitiativeModal.tsx`
- `UnifiedControlPanel.tsx`
- `ArmyControlPanel.tsx`
- `UnitSelector.tsx`
- `UnifiedCompactCard.tsx` (new)

**Change:** Replace local `getFactionColors` with `import { getFactionColors } from '@/lib/faction-colors'`

#### Unit Tests for Layer 2

- `src/__tests__/components/cards/UnifiedCompactCard.test.tsx`

---

### Layer 3: Directory Organization

#### New Directory Structure

```
src/components/
├── cards/                    # All card components
│   ├── UnifiedCompactCard.tsx
│   ├── UnitCard.tsx          # moved from root
│   └── types.ts
│
├── modals/                   # All modal components
│   ├── UnitDetailsModal.tsx  # moved from root
│   ├── InitiativeModal.tsx   # moved from root
│   ├── RulesInfoModal.tsx    # moved from root
│   ├── PilotAssignmentModal.tsx  # moved from root
│   ├── WeaponSelectorModal.tsx   # moved from root
│   ├── PanicTestModal.tsx    # moved from root
│   └── ImageModal.tsx        # moved from root
│
├── controls/                 # Control elements
│   ├── FactionSelector.tsx   # moved from root
│   ├── PointBudgetInput.tsx  # moved from root
│   ├── FortificationSelector.tsx  # moved from root
│   ├── RulesVersionSelector.tsx   # moved from root
│   ├── DisplayModeToggle.tsx # moved from root
│   └── ViewModeToggle.tsx    # moved from root
│
├── toggles/                  # Toggle components
│   ├── GenericToggle.tsx     # new
│   ├── PanicToggle.tsx       # moved from root
│   ├── AimedShotToggle.tsx   # moved from root
│   └── SurpriseAttackToggle.tsx  # moved from root
│
├── rules/                    # Rules components
│   ├── RulesSelector.tsx     # moved from root
│   ├── StepProgressIndicator.tsx  # moved from root
│   └── RulesInfoModal.tsx    # symlink from modals/
│
├── combat/                   # (existing, no changes)
├── encyclopedia/             # (existing, no changes)
└── machine/                  # (existing, no changes)
```

#### Import Updates

All files importing moved components must update their imports:

```typescript
// Before
import UnitCard from '@/components/UnitCard'

// After
import UnitCard from '@/components/cards/UnitCard'
```

#### Unit Tests for Layer 3

- Import validation tests
- Build verification tests

---

### Layer 4: Final Testing and Cleanup

#### 4.1. Complete Unit Test Coverage

```
src/__tests__/
├── lib/
│   ├── game-logic.test.ts           # extend existing
│   ├── unit-utils.test.ts           # extend existing
│   ├── faction-colors.test.ts       # new
│   ├── constants.test.ts            # new
│   └── utils.test.ts                # new
│
├── components/
│   ├── cards/
│   │   └── UnifiedCompactCard.test.tsx
│   ├── toggles/
│   │   ├── GenericToggle.test.tsx
│   │   ├── PanicToggle.test.tsx
│   │   ├── AimedShotToggle.test.tsx
│   │   └── SurpriseAttackToggle.test.tsx
│   └── controls/
│       └── (as needed)
│
└── hooks/
    ├── useBottomSheet.test.ts       # new
    └── useCombatFlow.test.ts        # new
```

#### Test Coverage Requirements

| Component/Utility | Tests |
|-------------------|-------|
| `game-logic.ts` | parseRoll, executeRoll, calculateHit, calculateDamage, calculateMelee, multiplyRange |
| `unit-utils.ts` | getAllUnits, getUnitsByFaction, validateArmy, numberUnit, getActiveSoldiers |
| `faction-colors.ts` | getFactionColors for all factions, edge cases |
| `constants.ts` | Constant values validation |
| `UnifiedCompactCard` | Render for each mode, click handlers, faction colors |
| `GenericToggle` | Switching, activeColor, disabled state |
| `useBottomSheet` | Swipe gestures, close threshold, snap-back |
| `useCombatFlow` | executeShot, executeMelee, executeGrenade, checkGrenadeTarget |

#### 4.2. E2E Test Updates

Update selectors in:
- `e2e/army-builder.spec.ts`
- `e2e/game-session.spec.ts`

#### 4.3. Cleanup Tasks

- Remove unused imports
- Delete old components after replacement
- Remove duplicate files
- Update CLAUDE.md with new structure

#### 4.4. Verification

```bash
npm run validate        # type-check + lint + unit tests
npm run test:e2e        # E2E tests
npm run build           # Production build
```

---

## Breaking Changes

This refactoring includes breaking changes:

1. **Component paths changed** — imports must be updated
2. **Component props changed** — UnifiedCompactCard replaces two components
3. **Toggle component internals** — may affect external consumers

**Mitigation:** All changes are internal to the application. No external API changes.

---

## Success Criteria

1. ✅ No code duplication in faction colors
2. ✅ No duplicate cn() functions
3. ✅ Unified compact card component
4. ✅ Organized directory structure
5. ✅ Full unit test coverage for utilities and hooks
6. ✅ All tests passing (unit + E2E)
7. ✅ Production build successful
8. ✅ No ESLint or TypeScript errors

---

## Next Steps

After this design is approved:
1. Invoke `writing-plans` skill to create detailed implementation plan
2. Execute implementation layer by layer
3. Verify each layer before proceeding to next
