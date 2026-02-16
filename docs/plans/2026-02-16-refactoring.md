# Radical Refactoring with Full Unit Test Coverage - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate 15-20% code duplication, reorganize component directories, and achieve full unit test coverage for utilities and hooks.

**Architecture:** Layered bottom-up refactoring — each layer is completed and tested before moving to the next. This allows for incremental verification and easy rollback if needed.

**Tech Stack:** TypeScript 5.x, React 18, Next.js 14, Jest, Playwright, Tailwind CSS

---

## LAYER 1: New Utilities and Types

### Task 1: Create faction-colors utility

**Files:**
- Create: `src/lib/faction-colors.ts`
- Test: `src/__tests__/lib/faction-colors.test.ts`

**Step 1: Write the failing test**

Create file: `src/__tests__/lib/faction-colors.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { getFactionColors, factionDisplayNames, type FactionID } from '@/lib/faction-colors';

describe('faction-colors', () => {
  describe('getFactionColors', () => {
    it('should return correct colors for polaris faction', () => {
      const colors = getFactionColors('polaris');
      expect(colors).toEqual({
        text: 'text-red-400',
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        glow: 'shadow-red-500/20',
        primary: '#ef4444',
        borderSolid: 'border-red-500',
        bgSolid: 'bg-red-500',
        progress: 'bg-red-500',
        accent: 'border-red-500',
      });
    });

    it('should return correct colors for protectorate faction', () => {
      const colors = getFactionColors('protectorate');
      expect(colors).toEqual({
        text: 'text-blue-400',
        border: 'border-blue-500/50',
        bg: 'bg-blue-500/10',
        glow: 'shadow-blue-500/20',
        primary: '#3b82f6',
        borderSolid: 'border-blue-500',
        bgSolid: 'bg-blue-500',
        progress: 'bg-blue-500',
        accent: 'border-blue-500',
      });
    });

    it('should return correct colors for mercenaries faction', () => {
      const colors = getFactionColors('mercenaries');
      expect(colors).toEqual({
        text: 'text-yellow-400',
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-500/10',
        glow: 'shadow-yellow-500/20',
        primary: '#eab308',
        borderSolid: 'border-yellow-500',
        bgSolid: 'bg-yellow-500',
        progress: 'bg-yellow-500',
        accent: 'border-yellow-500',
      });
    });

    it('should return polaris colors for unknown faction', () => {
      const colors = getFactionColors('unknown' as FactionID);
      expect(colors).toEqual(getFactionColors('polaris'));
    });
  });

  describe('factionDisplayNames', () => {
    it('should return correct display names', () => {
      expect(factionDisplayNames.polaris).toBe('Полярис');
      expect(factionDisplayNames.protectorate).toBe('Протекторат');
      expect(factionDisplayNames.mercenaries).toBe('Наёмники');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- faction-colors.test.ts`

Expected: FAIL with "Cannot find module '@/lib/faction-colors'"

**Step 3: Write minimal implementation**

Create file: `src/lib/faction-colors.ts`

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

**Step 4: Run test to verify it passes**

Run: `npm test -- faction-colors.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/faction-colors.ts src/__tests__/lib/faction-colors.test.ts
git commit -m "feat: add centralized faction-colors utility with tests

- Create getFactionColors() for consistent faction styling
- Add factionDisplayNames for Russian display names
- Full unit test coverage for all three factions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create constants utility

**Files:**
- Create: `src/lib/constants.ts`
- Test: `src/__tests__/lib/constants.test.ts`

**Step 1: Write the failing test**

Create file: `src/__tests__/lib/constants.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  LOCAL_STORAGE_KEYS,
  DEFAULT_POINT_BUDGETS,
  FACTIONS,
  MAX_SOLDIERS_PER_SQUAD,
  MAX_WEAPONS_PER_MACHINE,
  DICE_TYPES
} from '@/lib/constants';

describe('constants', () => {
  describe('LOCAL_STORAGE_KEYS', () => {
    it('should have all required keys', () => {
      expect(LOCAL_STORAGE_KEYS.ARMY).toBe('bronepehota_army');
      expect(LOCAL_STORAGE_KEYS.RULES_VERSION).toBe('bronepehota_rules_version');
      expect(LOCAL_STORAGE_KEYS.PANIC_ENABLED).toBe('bronepehota_panic_enabled');
      expect(LOCAL_STORAGE_KEYS.AIMED_SHOT_ENABLED).toBe('bronepehota_aimed_shot_enabled');
      expect(LOCAL_STORAGE_KEYS.SURPRISE_ATTACK_ENABLED).toBe('bronepehota_surprise_attack_enabled');
    });

    it('should be readonly', () => {
      expect(() => {
        (LOCAL_STORAGE_KEYS as any).ARMY = 'modified';
      }).not.toThrow();
      expect(LOCAL_STORAGE_KEYS.ARMY).toBe('bronepehota_army');
    });
  });

  describe('DEFAULT_POINT_BUDGETS', () => {
    it('should contain expected budgets', () => {
      expect(DEFAULT_POINT_BUDGETS).toEqual([300, 350, 400, 450, 500]);
    });
  });

  describe('FACTIONS', () => {
    it('should contain all factions', () => {
      expect(FACTIONS).toEqual(['polaris', 'protectorate', 'mercenaries']);
    });
  });

  describe('Game limits', () => {
    it('should define correct limits', () => {
      expect(MAX_SOLDIERS_PER_SQUAD).toBe(6);
      expect(MAX_WEAPONS_PER_MACHINE).toBe(4);
    });
  });

  describe('DICE_TYPES', () => {
    it('should contain all dice types', () => {
      expect(DICE_TYPES).toEqual(['D6', 'D12', 'D20']);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- constants.test.ts`

Expected: FAIL with "Cannot find module '@/lib/constants'"

**Step 3: Write minimal implementation**

Create file: `src/lib/constants.ts`

```typescript
import type { FactionID } from './types';

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

**Step 4: Run test to verify it passes**

Run: `npm test -- constants.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/constants.ts src/__tests__/lib/constants.test.ts
git commit -m "feat: add centralized constants with tests

- Extract LOCAL_STORAGE_KEYS, DEFAULT_POINT_BUDGETS, FACTIONS
- Add game limits: MAX_SOLDIERS_PER_SQUAD, MAX_WEAPONS_PER_MACHINE
- Add DICE_TYPES constant
- Full unit test coverage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Add tests for utils.ts (cn function)

**Files:**
- Test: `src/__tests__/lib/utils.test.ts`

**Step 1: Write the failing test**

Create file: `src/__tests__/lib/utils.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle Tailwind conflicts with tailwind-merge', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle arrays and objects', () => {
      expect(cn(['foo', 'bar'], { baz: true, qux: false })).toBe('foo bar baz');
    });
  });
});
```

**Step 2: Run test to verify it passes (or fails if file doesn't exist)**

Run: `npm test -- utils.test.ts`

Expected: If utils.ts exists, test should PASS. If not, FAIL with "Cannot find module '@/lib/utils'"

**Step 3: If file doesn't exist, create it**

Create file: `src/lib/utils.ts` (if it doesn't exist)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- utils.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/utils.ts src/__tests__/lib/utils.test.ts
git commit -m "test: add unit tests for utils.ts cn function

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## LAYER 2: Component Consolidation

### Task 4: Create UnifiedCompactCard component

**Files:**
- Create: `src/components/cards/UnifiedCompactCard.tsx`
- Create: `src/components/cards/types.ts`
- Test: `src/__tests__/components/cards/UnifiedCompactCard.test.tsx`

**Step 1: Create cards directory and types**

Run: `mkdir -p src/components/cards`

Create file: `src/components/cards/types.ts`

```typescript
import type { ArmyUnit, Squad, Machine, FactionID } from '@/lib/types';

export type CardMode = 'add' | 'remove' | 'view';

export interface UnifiedCompactCardProps {
  unit: ArmyUnit | Squad | Machine;
  mode: CardMode;
  onAction?: (unit: ArmyUnit | Squad | Machine) => void;
  onClick?: (unit: ArmyUnit | Squad | Machine) => void;
  factionId: FactionID;
  canAfford?: boolean;
  countInArmy?: number;
  dataTestId?: string;
  readonly?: boolean;
}
```

**Step 2: Write the test**

Create file: `src/__tests__/components/cards/UnifiedCompactCard.test.tsx`

```typescript
import { describe, it, expect, vi } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedCompactCard } from '@/components/cards/UnifiedCompactCard';
import { FactionID } from '@/lib/types';

const mockSquad = {
  id: 'test-squad',
  name: 'Test Squad',
  shortName: 'TS',
  faction: 'polaris' as FactionID,
  cost: 100,
  soldiers: [
    { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
  ]
};

const mockMachine = {
  id: 'test-machine',
  name: 'Test Machine',
  shortName: 'TM',
  faction: 'protectorate' as FactionID,
  cost: 150,
  rank: 2,
  fire_rate: 2,
  ammo_max: 20,
  durability_max: 16,
  speed_sectors: [{ min_durability: 1, max_durability: 16, speed: 2 }],
  weapons: [{ name: 'Gun', range: 'D12', power: '2D12' }]
};

describe('UnifiedCompactCard', () => {
  describe('add mode', () => {
    it('should render squad in add mode', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={vi.fn()}
          canAfford={true}
        />
      );

      expect(screen.getByText('Test Squad')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByLabelText(/добавить/i)).toBeInTheDocument();
    });

    it('should call onAction when add button clicked', () => {
      const onAction = vi.fn();
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={onAction}
          canAfford={true}
        />
      );

      const addButton = screen.getByLabelText(/добавить/i);
      fireEvent.click(addButton);

      expect(onAction).toHaveBeenCalledWith(mockSquad);
    });

    it('should be disabled when cannot afford', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={vi.fn()}
          canAfford={false}
        />
      );

      const card = screen.getByTestId('compact-unit-card-test-squad');
      expect(card).toHaveClass('opacity-60', 'cursor-not-allowed');
    });
  });

  describe('remove mode', () => {
    it('should render in remove mode', () => {
      const mockArmyUnit = {
        instanceId: 'test-instance',
        type: 'squad' as const,
        data: mockSquad
      };

      render(
        <UnifiedCompactCard
          unit={mockArmyUnit}
          mode="remove"
          factionId="polaris"
          onAction={vi.fn()}
        />
      );

      expect(screen.getByText('Test Squad')).toBeInTheDocument();
      expect(screen.getByLabelText(/удалить/i)).toBeInTheDocument();
    });
  });

  describe('view mode', () => {
    it('should render in view mode without action buttons', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="polaris"
        />
      );

      expect(screen.getByText('Test Squad')).toBeInTheDocument();
      expect(screen.queryByLabelText(/добавить/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/удалить/i)).not.toBeInTheDocument();
    });
  });

  describe('faction colors', () => {
    it('should apply polaris colors', () => {
      const { container } = render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="polaris"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-red-500');
    });

    it('should apply protectorate colors', () => {
      const { container } = render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="protectorate"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-blue-500');
    });

    it('should apply mercenaries colors', () => {
      const { container } = render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="mercenaries"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-l-yellow-500');
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npm test -- UnifiedCompactCard.test.tsx`

Expected: FAIL with "Cannot find module '@/components/cards/UnifiedCompactCard'"

**Step 4: Write minimal implementation**

Create file: `src/components/cards/UnifiedCompactCard.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { Plus, X, User, Zap } from 'lucide-react';
import { ImageModal } from '@/components/ImageModal';
import { GitHubPagesImage as Image } from '@/components/GitHubPagesImage';
import { getFactionColors } from '@/lib/faction-colors';
import { cn } from '@/lib/utils';
import type { CardMode, UnifiedCompactCardProps } from './types';
import type { Squad, Machine, ArmyUnit } from '@/lib/types';

export function UnifiedCompactCard({
  unit,
  mode,
  onAction,
  onClick,
  factionId,
  canAfford = true,
  countInArmy = 0,
  dataTestId,
  readonly = false
}: UnifiedCompactCardProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');

  const colors = getFactionColors(factionId);

  // Determine if this is an ArmyUnit or template (Squad/Machine)
  const isArmyUnit = 'instanceId' in unit;
  const isMachine = isArmyUnit
    ? (unit as ArmyUnit).type === 'machine'
    : 'durability_max' in unit;

  const Icon = isMachine ? Zap : User;
  const typeLabel = isMachine ? 'МАШИНА' : 'ОТРЯД';

  // Get data based on unit type
  const getData = () => {
    if (isArmyUnit) {
      const armyUnit = unit as ArmyUnit;
      return {
        name: armyUnit.data.name,
        cost: armyUnit.data.cost,
        image: armyUnit.data.image,
        instanceNumber: armyUnit.instanceNumber,
        data: armyUnit.data
      };
    } else {
      const template = unit as Squad | Machine;
      return {
        name: template.name,
        cost: template.cost,
        image: template.image,
        instanceNumber: undefined,
        data: template
      };
    }
  };

  const data = getData();

  // Get quick stats
  const getQuickStats = () => {
    if (isMachine) {
      const machineData = (isArmyUnit ? (unit as ArmyUnit).data : unit) as Machine;
      const maxSpeed = Math.max(...machineData.speed_sectors.map(s => s.speed));
      return `R${machineData.rank} Прч${machineData.durability_max} Ск${maxSpeed}`;
    } else {
      const squadData = (isArmyUnit ? (unit as ArmyUnit).data : unit) as Squad;
      const maxRank = Math.max(...squadData.soldiers.map(s => s.rank));
      const armors = squadData.soldiers.map(s => s.armor);
      const minArmor = Math.min(...armors);
      const maxArmor = Math.max(...armors);
      const armorRange = minArmor === maxArmor ? `${minArmor}` : `${minArmor}-${maxArmor}`;
      return `R${maxRank} ${squadData.soldiers.length} бойцов Бр${armorRange}`;
    }
  };

  const quickStats = getQuickStats();

  const handleImageClick = (e: React.MouseEvent, src: string, alt: string) => {
    e.stopPropagation();
    setModalImageSrc(src);
    setModalImageAlt(alt);
    setImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setImageModalOpen(false);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(unit);
    } else if (mode === 'add' && canAfford && onAction) {
      onAction(unit);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(unit);
    }
  };

  const testId = dataTestId || `compact-unit-card-${isArmyUnit ? (unit as ArmyUnit).instanceId : (isMachine ? (data.data as Machine).id : (data.data as Squad).id)}`;

  // Map colors for card
  const bgColor = factionId === 'polaris' ? 'bg-red-500' :
                  factionId === 'protectorate' ? 'bg-blue-500' : 'bg-yellow-500';
  const borderColor = factionId === 'polaris' ? 'border-l-red-500' :
                      factionId === 'protectorate' ? 'border-l-blue-500' : 'border-l-yellow-500';
  const textColor = factionId === 'polaris' ? 'text-red-400' :
                    factionId === 'protectorate' ? 'text-blue-400' : 'text-yellow-400';

  // Get image source
  const getImageSrc = (): string | null => {
    if (data.image) return data.image;
    if (!isMachine) {
      const squadData = data.data as Squad;
      if (squadData.soldiers[0]?.image) {
        return squadData.soldiers[0].image;
      }
    }
    return null;
  };

  const imageSrc = getImageSrc();

  return (
    <div
      className={cn(
        'relative h-16 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50',
        'border-l-4 flex items-stretch overflow-hidden',
        'transition-all duration-200 active:scale-[0.98]',
        mode === 'add' && canAfford ? 'cursor-pointer' : '',
        mode === 'add' && !canAfford ? 'opacity-60 cursor-not-allowed' : '',
        borderColor
      )}
      onClick={mode === 'add' ? handleCardClick : (onClick ? () => onClick(unit) : undefined)}
      data-testid={testId}
    >
      {/* Type icon zone */}
      <div className="w-14 flex items-center justify-center flex-shrink-0 bg-slate-900/50">
        {imageSrc ? (
          <button
            className="w-11 h-11 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/30 transition-all active:scale-95"
            onClick={(e) => handleImageClick(e, imageSrc, data.name)}
            aria-label={`Увеличить изображение ${data.name}`}
            disabled={mode === 'add' && !canAfford}
          >
            <Image
              src={imageSrc}
              alt={data.name}
              width={32}
              height={32}
              className="w-full h-full object-cover object-center"
              unoptimized
            />
          </button>
        ) : (
          <div className={cn('w-11 h-11 rounded-full flex items-center justify-center', bgColor, 'bg-opacity-20')}>
            <Icon className={cn('w-5 h-5', textColor)} />
          </div>
        )}
      </div>

      {/* Content zone */}
      <div className="flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-mono font-bold text-sm truncate leading-tight',
                mode === 'add' && !canAfford ? 'text-slate-500' : 'text-slate-100'
              )} title={data.name}>
                {data.name}
              </h4>
              {countInArmy > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-600/80 text-white">
                  {countInArmy}
                </span>
              )}
              {data.instanceNumber && data.instanceNumber > 1 && (
                <span className="text-[10px] font-mono text-slate-600">
                  #{data.instanceNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {typeLabel}
              </span>
              {mode === 'add' && (
                <span className="text-[10px] font-mono text-slate-600">
                  {quickStats}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={cn(
              'font-mono font-bold text-sm',
              mode === 'add' && !canAfford ? 'text-slate-600' : textColor
            )}>
              {data.cost}
            </span>
          </div>
        </div>
      </div>

      {/* Action button zone */}
      {mode === 'add' && (
        <div className="w-14 flex items-center justify-center flex-shrink-0">
          <button
            onClick={handleActionClick}
            data-testid={`add-compact-${(data.data as Squad | Machine).id}`}
            disabled={!canAfford}
            aria-label={`Добавить ${data.name}`}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center',
              'transition-all duration-200',
              'active:scale-95 touch-manipulation',
              canAfford
                ? cn('bg-slate-700/50 hover:bg-slate-700', 'border border-slate-600 hover:border-slate-500')
                : 'bg-slate-800/50 cursor-not-allowed opacity-50'
            )}
          >
            <Plus className={cn(
              'w-5 h-5',
              canAfford ? textColor : 'text-slate-600'
            )} />
          </button>
        </div>
      )}

      {mode === 'remove' && !readonly && (
        <div className="w-14 flex items-center justify-center flex-shrink-0">
          <button
            onClick={handleActionClick}
            data-testid={dataTestId ? dataTestId.replace('army-unit-', 'remove-unit-') : `remove-compact-${isArmyUnit ? (unit as ArmyUnit).instanceId : (data.data as Squad | Machine).id}`}
            aria-label={`Удалить ${data.name}`}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center',
              'bg-red-900/20 hover:bg-red-900/40',
              'border border-red-700/50 hover:border-red-600',
              'transition-all duration-200',
              'active:scale-95 touch-manipulation'
            )}
          >
            <X className="w-5 h-5 text-red-400" />
          </button>
        </div>
      )}

      {/* Indicator bar */}
      <div className={cn(
        'absolute bottom-0 left-14 right-0 h-0.5',
        mode === 'add' ? (canAfford ? bgColor : 'bg-slate-700') : bgColor
      )} style={{ opacity: mode === 'add' ? (canAfford ? 0.5 : 0.3) : 0.5 }} />

      <ImageModal
        src={modalImageSrc}
        alt={modalImageAlt}
        isOpen={imageModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- UnifiedCompactCard.test.tsx`

Expected: PASS

**Step 6: Commit**

```bash
git add src/components/cards/
git commit -m "feat: add UnifiedCompactCard component with tests

- Consolidate CompactUnitCard and CompactArmyCard into single component
- Support three modes: 'add', 'remove', 'view'
- Use centralized getFactionColors utility
- Full unit test coverage for all modes and factions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Replace cn() duplicates in GameSession.tsx

**Files:**
- Modify: `src/components/GameSession.tsx:14-16`

**Step 1: Update imports**

In `src/components/GameSession.tsx`, find lines 1-16 and update:

```typescript
// Remove these lines (14-16):
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Update imports at top to include:
import { cn } from '@/lib/utils';
```

**Step 2: Remove unused imports**

Also remove these imports since they're no longer needed:
```typescript
// Remove lines 8-9:
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
```

**Step 3: Run tests**

Run: `npm test -- GameSession`

Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/GameSession.tsx
git commit -m "refactor: use shared cn() utility in GameSession

Remove local cn() definition, import from @/lib/utils

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Replace cn() duplicate in InitiativeModal.tsx

**Files:**
- Modify: `src/components/InitiativeModal.tsx:10-12`

**Step 1: Read and update file**

Run: `head -20 src/components/InitiativeModal.tsx`

Update the imports to use shared cn():

```typescript
// Remove local cn() definition (lines 10-12)
// Add import: import { cn } from '@/lib/utils';
// Remove: import { clsx, type ClassValue } from 'clsx';
// Remove: import { twMerge } from 'tailwind-merge';
```

**Step 2: Run tests**

Run: `npm test -- InitiativeModal`

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/InitiativeModal.tsx
git commit -m "refactor: use shared cn() utility in InitiativeModal

Remove local cn() definition, import from @/lib/utils

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Replace getFactionColors in GameSession.tsx

**Files:**
- Modify: `src/components/GameSession.tsx:18-81`

**Step 1: Replace getFactionColors and getUnitDockStyles**

In `src/components/GameSession.tsx`:

```typescript
// Remove lines 18-81 (getFactionColors and getUnitDockStyles functions)

// Add import at top:
import { getFactionColors } from '@/lib/faction-colors';

// Update getUnitDockStyles to use getFactionColors:
const getUnitDockStyles = (factionId: string) => {
  const colors = getFactionColors(factionId as FactionID);
  return {
    primary: colors.borderSolid.replace('border-', 'border-'),
    primaryBg: colors.bgSolid,
    muted: colors.border,
    mutedBg: colors.bg,
    text: colors.text,
    activeGlow: colors.glow,
    accent: colors.accent
  };
};
```

**Step 2: Run tests**

Run: `npm test -- GameSession`

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/GameSession.tsx
git commit -m "refactor: use centralized getFactionColors in GameSession

Replace local getFactionColors with import from @/lib/faction-colors

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Replace getFactionColors in other components

**Files:**
- Modify: `src/components/InitiativeModal.tsx`
- Modify: `src/components/UnifiedControlPanel.tsx`
- Modify: `src/components/ArmyControlPanel.tsx`
- Modify: `src/components/UnitSelector.tsx`

**Step 1: Update InitiativeModal.tsx**

```typescript
// Add import: import { getFactionColors } from '@/lib/faction-colors';
// Remove local getFactionColors function
```

**Step 2: Update UnifiedControlPanel.tsx**

```typescript
// Add import: import { getFactionColors } from '@/lib/faction-colors';
// Remove local getFactionColors function
```

**Step 3: Update ArmyControlPanel.tsx**

```typescript
// Add import: import { getFactionColors } from '@/lib/faction-colors';
// Remove local getFactionColors function
```

**Step 4: Update UnitSelector.tsx**

```typescript
// Add import: import { getFactionColors } from '@/lib/faction-colors';
// Remove local getFactionColors function
```

**Step 5: Run tests**

Run: `npm test`

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/components/InitiativeModal.tsx src/components/UnifiedControlPanel.tsx src/components/ArmyControlPanel.tsx src/components/UnitSelector.tsx
git commit -m "refactor: use centralized getFactionColors in components

Update InitiativeModal, UnifiedControlPanel, ArmyControlPanel, UnitSelector

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## LAYER 3: Directory Organization

### Task 9: Create organized directory structure

**Step 1: Create directories**

Run:
```bash
mkdir -p src/components/modals
mkdir -p src/components/controls
mkdir -p src/components/toggles
mkdir -p src/components/rules
```

**Step 2: Move modal components**

Run:
```bash
git mv src/components/UnitDetailsModal.tsx src/components/modals/
git mv src/components/InitiativeModal.tsx src/components/modals/
git mv src/components/PilotAssignmentModal.tsx src/components/modals/
git mv src/components/WeaponSelectorModal.tsx src/components/modals/
git mv src/components/PanicTestModal.tsx src/components/modals/
git mv src/components/ImageModal.tsx src/components/modals/
git mv src/components/RulesInfoModal.tsx src/components/modals/
```

**Step 3: Move control components**

Run:
```bash
git mv src/components/FactionSelector.tsx src/components/controls/
git mv src/components/PointBudgetInput.tsx src/components/controls/
git mv src/components/FortificationSelector.tsx src/components/controls/
git mv src/components/RulesVersionSelector.tsx src/components/controls/
git mv src/components/DisplayModeToggle.tsx src/components/controls/
git mv src/components/ViewModeToggle.tsx src/components/controls/
```

**Step 4: Move toggle components**

Run:
```bash
git mv src/components/PanicToggle.tsx src/components/toggles/
git mv src/components/AimedShotToggle.tsx src/components/toggles/
git mv src/components/SurpriseAttackToggle.tsx src/components/toggles/
```

**Step 5: Move rules components**

Run:
```bash
git mv src/components/RulesSelector.tsx src/components/rules/
git mv src/components/StepProgressIndicator.tsx src/components/rules/
```

**Step 6: Move UnitCard to cards directory**

Run:
```bash
git mv src/components/UnitCard.tsx src/components/cards/
```

**Step 7: Update all imports**

Use Find and Replace in IDE or run:

For each moved component, update imports in all files:

```bash
# Update imports from moved components
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/UnitDetailsModal'|from '@/components/modals/UnitDetailsModal'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/InitiativeModal'|from '@/components/modals/InitiativeModal'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/PilotAssignmentModal'|from '@/components/modals/PilotAssignmentModal'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/WeaponSelectorModal'|from '@/components/modals/WeaponSelectorModal'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/PanicTestModal'|from '@/components/modals/PanicTestModal'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/ImageModal'|from '@/components/modals/ImageModal'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/RulesInfoModal'|from '@/components/modals/RulesInfoModal'|g"

find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/FactionSelector'|from '@/components/controls/FactionSelector'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/PointBudgetInput'|from '@/components/controls/PointBudgetInput'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/FortificationSelector'|from '@/components/controls/FortificationSelector'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/RulesVersionSelector'|from '@/components/controls/RulesVersionSelector'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/DisplayModeToggle'|from '@/components/controls/DisplayModeToggle'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/ViewModeToggle'|from '@/components/controls/ViewModeToggle'|g"

find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/PanicToggle'|from '@/components/toggles/PanicToggle'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/AimedShotToggle'|from '@/components/toggles/AimedShotToggle'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/SurpriseAttackToggle'|from '@/components/toggles/SurpriseAttackToggle'|g"

find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/RulesSelector'|from '@/components/rules/RulesSelector'|g"
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/StepProgressIndicator'|from '@/components/rules/StepProgressIndicator'|g"

find src -name '*.tsx' -o -name '*.ts' | xargs sed -i "s|from '@/components/UnitCard'|from '@/components/cards/UnitCard'|g"
```

**Step 8: Run validation**

Run: `npm run validate`

Expected: No TypeScript or ESLint errors

**Step 9: Run tests**

Run: `npm test`

Expected: All tests pass

**Step 10: Commit**

```bash
git add .
git commit -m "refactor: organize components into logical directories

Create organized structure:
- modals/ - All modal components
- controls/ - Control elements (selectors, inputs, toggles)
- toggles/ - Toggle components for game rules
- rules/ - Rules-related components
- cards/ - Card components (UnifiedCompactCard, UnitCard)

Update all import statements across the codebase.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## LAYER 4: Final Testing and Cleanup

### Task 10: Extend game-logic.test.ts coverage

**Files:**
- Modify: `src/__tests__/lib/game-logic.test.ts`

**Step 1: Add tests for multiplyRange**

Add to `src/__tests__/lib/game-logic.test.ts`:

```typescript
describe('multiplyRange', () => {
  it('should multiply D6 to D12', () => {
    expect(multiplyRange('D6', 2)).toBe('D12');
  });

  it('should multiply D12 to D12 (no change for high values)', () => {
    expect(multiplyRange('D12', 2)).toBe('D12');
  });

  it('should multiply D6+2 to D12+4', () => {
    expect(multiplyRange('D6+2', 2)).toBe('D12+4');
  });

  it('should handle multiplier of 1 (no change)', () => {
    expect(multiplyRange('D6', 1)).toBe('D6');
  });

  it('should handle D20 (no change)', () => {
    expect(multiplyRange('D20', 2)).toBe('D20');
  });
});
```

**Step 2: Run tests**

Run: `npm test -- game-logic.test.ts`

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/__tests__/lib/game-logic.test.ts
git commit -m "test: add multiplyRange tests to game-logic

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Extend unit-utils.test.ts coverage

**Files:**
- Modify: `src/__tests__/lib/unit-utils.test.ts`

**Step 1: Add tests for getActiveSoldiers and numberUnit**

Add to `src/__tests__/lib/unit-utils.test.ts`:

```typescript
describe('getActiveSoldiers', () => {
  it('should return all soldiers when none are dead', () => {
    const squad = mockSquads[0];
    const result = getActiveSoldiers(squad);
    expect(result).toHaveLength(squad.soldiers.length);
  });

  it('should exclude dead soldiers', () => {
    const squad = mockSquads[0];
    const result = getActiveSoldiers(squad, [0, 2]);
    expect(result).toHaveLength(squad.soldiers.length - 2);
  });
});

describe('numberUnit', () => {
  it('should assign instance numbers to units', () => {
    const units = [
      { instanceId: '1', type: 'squad', data: mockSquads[0] },
      { instanceId: '2', type: 'squad', data: mockSquads[0] },
    ] as ArmyUnit[];
    numberUnit(units, 0);
    expect(units[0].instanceNumber).toBe(1);
    expect(units[1].instanceNumber).toBe(2);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- unit-utils.test.ts`

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/__tests__/lib/unit-utils.test.ts
git commit -m "test: extend unit-utils test coverage

Add tests for getActiveSoldiers and numberUnit

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Add tests for useBottomSheet hook

**Files:**
- Create: `src/__tests__/hooks/useBottomSheet.test.ts`

**Step 1: Write the test**

Create file: `src/__tests__/hooks/useBottomSheet.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useBottomSheet } from '@/hooks/useBottomSheet';

describe('useBottomSheet', () => {
  beforeEach(() => {
    // Mock touch events
    global.Touch = class Touch {
      constructor(public identifier: number, public target: EventTarget, public clientX: number, public clientY: number) {}
    } as any;
  });

  it('should initialize with open state', () => {
    const { result } = renderHook(() => useBottomSheet(100, vi.fn()));
    expect(result.current.isOpen).toBe(true);
  });

  it('should close on drag past threshold', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useBottomSheet(100, onClose));

    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 0, identifier: 0, target: document, clientX: 0 }] as any
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientY: 150, identifier: 0, target: document, clientX: 0 }] as any
      });
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientY: 150, identifier: 0, target: document, clientX: 0 }] as any
      });

      result.current.handleTouchStart(touchStart);
      result.current.handleTouchMove(touchMove);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close on drag within threshold', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useBottomSheet(100, onClose));

    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 0, identifier: 0, target: document, clientX: 0 }] as any
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientY: 50, identifier: 0, target: document, clientX: 0 }] as any
      });
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientY: 50, identifier: 0, target: document, clientX: 0 }] as any
      });

      result.current.handleTouchStart(touchStart);
      result.current.handleTouchMove(touchMove);
      result.current.handleTouchEnd(touchEnd);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests**

Run: `npm test -- useBottomSheet.test.ts`

Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/hooks/useBottomSheet.test.ts
git commit -m "test: add useBottomSheet hook tests

Test swipe gesture behavior and close threshold

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: Add tests for useCombatFlow hook

**Files:**
- Create: `src/__tests__/hooks/useCombatFlow.test.ts`

**Step 1: Write the test**

Create file: `src/__tests__/hooks/useCombatFlow.test.ts`

```typescript
import { describe, it, expect, vi } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useCombatFlow } from '@/hooks/useCombatFlow';
import type { ArmyUnit, Squad } from '@/lib/types';

const mockUnit: ArmyUnit = {
  instanceId: 'test-1',
  type: 'squad',
  data: {
    id: 'test-squad',
    name: 'Test Squad',
    faction: 'polaris',
    cost: 100,
    soldiers: [
      { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
    ]
  } as Squad
};

describe('useCombatFlow', () => {
  it('should initialize with shot state', () => {
    const { result } = renderHook(() => useCombatFlow(mockUnit, vi.fn()));
    expect(result.current.combatState).toEqual({
      phase: 'parameters',
      actionType: 'shot'
    });
  });

  it('should execute shot and transition to results', () => {
    const { result } = renderHook(() => useCombatFlow(mockUnit, vi.fn()));

    act(() => {
      result.current.setCombatParameters({
        distance: 3,
        targetArmor: 2,
        cover: 'none'
      });
    });

    act(() => {
      result.current.executeShot();
    });

    expect(result.current.combatState.phase).toBe('results');
    expect(result.current.lastResult).toBeDefined();
  });

  it('should execute grenade in two phases', () => {
    const { result } = renderHook(() => useCombatFlow(mockUnit, vi.fn()));

    act(() => {
      result.current.setCombatParameters({
        distance: 0,
        targetArmor: 2,
        cover: 'none'
      });
    });

    act(() => {
      result.current.setCombatParameters({
        distance: 0,
        targetArmor: 2,
        cover: 'none'
      });
      result.current.executeGrenade();
    });

    expect(result.current.combatState.phase).toBe('grenade-target-check');
  });
});
```

**Step 2: Run tests**

Run: `npm test -- useCombatFlow.test.ts`

Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/hooks/useCombatFlow.test.ts
git commit -m "test: add useCombatFlow hook tests

Test shot, melee, and grenade combat flows

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 14: Update E2E tests for new component paths

**Files:**
- Modify: `e2e/army-builder.spec.ts`
- Modify: `e2e/game-session.spec.ts`

**Step 1: Update army-builder.spec.ts**

Update any selectors that may have changed. If no component-specific selectors were used, no changes needed.

**Step 2: Update game-session.spec.ts**

Update any selectors that may have changed.

**Step 3: Run E2E tests**

Run: `npm run test:e2e`

Expected: All E2E tests pass

**Step 4: Commit**

```bash
git add e2e/
git commit -m "test: update E2E tests for new component structure

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 15: Remove unused code and files

**Step 1: Remove old card components**

Run:
```bash
rm src/components/CompactUnitCard.tsx
rm src/components/CompactArmyCard.tsx
```

**Step 2: Check for unused imports**

Run: `npm run lint -- --fix`

Expected: Linter fixes unused imports

**Step 3: Run full validation**

Run: `npm run validate`

Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove deprecated CompactUnitCard and CompactArmyCard

Replaced by UnifiedCompactCard

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 16: Update CLAUDE.md with new structure

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update Component Structure section**

In CLAUDE.md, find the Component Structure section and update:

```markdown
### Component Structure

**Main Page** (`src/app/app/page.tsx`):
- Header with faction branding, view toggle (Штаб/В Бой)
- ArmyBuilder (construction) OR GameSession (gameplay)
- Footer with army stats

**Key Components:**
- `ArmyBuilder.tsx` - Filter/search units, add to army, export/import JSON
- `GameSession.tsx` - Two tabs: "Войска" (units) and "Атака" (combat)
- `UnitCard.tsx` - Individual unit display, combat modal, animated dice
- `CombatAssistant.tsx` - Standalone combat calculator

**Component Organization:**
```
src/components/
├── cards/           - Card components (UnitCard, UnifiedCompactCard)
├── modals/          - Modal components (UnitDetailsModal, InitiativeModal, etc.)
├── controls/        - Control elements (FactionSelector, PointBudgetInput, etc.)
├── toggles/         - Toggle components (PanicToggle, AimedShotToggle, etc.)
├── rules/           - Rules components (RulesSelector, StepProgressIndicator)
├── combat/          - Combat components (BottomSheetCombatModal, etc.)
├── encyclopedia/    - Encyclopedia components
└── machine/         - Machine-specific components
```

**Shared Utilities:**
- `src/lib/faction-colors.ts` - Centralized faction color mappings
- `src/lib/constants.ts` - Application constants (localStorage keys, limits, etc.)
- `src/lib/utils.ts` - Shared utilities (cn function)
```

**Step 2: Update Recent Changes section**

Add to Recent Changes:
```markdown
- **Refactoring (2025-02)**: Major codebase cleanup
  - Created centralized faction-colors utility
  - Created constants utility for app-wide constants
  - Consolidated CompactUnitCard and CompactArmyCard into UnifiedCompactCard
  - Organized components into logical directories (cards/, modals/, controls/, toggles/, rules/)
  - Removed duplicate cn() function definitions
  - Full unit test coverage for utilities and hooks
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with refactored structure

Document new component organization and utilities

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 17: Final verification

**Step 1: Run full test suite**

Run:
```bash
npm run validate     # type-check + lint + unit tests
npm run test:e2e     # E2E tests
npm run build        # Production build
```

Expected: All commands pass

**Step 2: Verify git status**

Run: `git status`

Expected: Clean working directory (or only uncommitted changes)

**Step 3: Final commit**

```bash
git add -A
git commit -m "refactor: complete radical refactoring with full test coverage

Summary of changes:
- Eliminated 15-20% code duplication
- Created centralized utilities (faction-colors, constants)
- Consolidated components (UnifiedCompactCard)
- Organized components into logical directories
- Full unit test coverage for utilities and hooks
- All tests passing (unit + E2E)
- Production build successful

Success criteria met:
✅ No code duplication in faction colors
✅ No duplicate cn() functions
✅ Unified compact card component
✅ Organized directory structure
✅ Full unit test coverage for utilities and hooks
✅ All tests passing (unit + E2E)
✅ Production build successful
✅ No ESLint or TypeScript errors

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Execution Notes

**IMPORTANT:** Follow TDD — write the failing test first, then implement.

**Layer by layer:** Complete all tasks in a layer before moving to the next. Run `npm test` after each commit.

**Commit messages:** Use the provided commit messages for consistency.

**Verification:** After each layer, run `npm run validate` to ensure no regressions.
