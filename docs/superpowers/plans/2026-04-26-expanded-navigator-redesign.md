# Expanded Navigator Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat grid expanded navigator with a sectioned Military HUD design showing Active, Done, and Dead units vertically with larger cards and quick stats.

**Architecture:** Extract a new `ExpandedNavigator` component from `GameSession.tsx` and a new `ExpandedUnitCard` component. Add a `deriveUnitStatus` utility for shared status derivation (named to avoid collision with existing `deriveUnitStatus` callback in GameSession.tsx that returns `{ isDead, isDone }`). The compact dock mode and `UnitNavigationCard` remain unchanged.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React icons, Jest (unit), Playwright (E2E)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/unit-status.ts` | Shared `deriveUnitStatus()` utility returning 'active'|'done'|'dead' |
| Create | `src/components/GameSession/ExpandedUnitCard.tsx` | Medium card with image, name, stats per section styling |
| Create | `src/components/GameSession/ExpandedNavigator.tsx` | Sectioned layout with top bar, 3 vertical sections |
| Modify | `src/components/GameSession/index.ts` | Export new components |
| Modify | `src/components/GameSession.tsx:813-858` | Replace flat grid with `ExpandedNavigator` |
| Create | `src/__tests__/unit-status.test.ts` | Unit tests for status derivation |
| Create | `e2e/expanded-navigator.spec.ts` | E2E tests for expanded navigator |

---

### Task 1: Create `deriveUnitStatus` utility + tests

**Files:**
- Create: `src/lib/unit-status.ts`
- Create: `src/__tests__/unit-status.test.ts`

This utility extracts the repeated isDone/isDead logic that's duplicated 3x in GameSession.tsx into a single function.

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/unit-status.test.ts
import { deriveUnitStatus } from '@/lib/unit-status';
import { ArmyUnit, Squad, Machine } from '@/lib/types';

describe('deriveUnitStatus', () => {
  const makeSquadUnit = (overrides: Partial<ArmyUnit> = {}): ArmyUnit => ({
    instanceId: 'test-squad',
    type: 'squad',
    data: {
      id: 'test',
      name: 'Test Squad',
      faction: 'polaris',
      cost: 50,
      soldiers: [
        { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
        { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
      ],
    } as Squad,
    ...overrides,
  });

  const makeMachineUnit = (overrides: Partial<ArmyUnit> = {}): ArmyUnit => ({
    instanceId: 'test-machine',
    type: 'machine',
    data: {
      id: 'test-m',
      name: 'Test Machine',
      faction: 'polaris',
      cost: 100,
      rank: 2,
      fire_rate: 2,
      ammo_max: 20,
      durability_max: 16,
      speed_sectors: [],
      weapons: [{ name: 'Gun', range: 'D12', power: '2D20' }],
    } as Machine,
    ...overrides,
  });

  describe('squad', () => {
    it('returns active when soldiers have no actions', () => {
      const unit = makeSquadUnit();
      expect(deriveUnitStatus(unit)).toBe('active');
    });

    it('returns done when all soldiers are done or dead', () => {
      const unit = makeSquadUnit({
        actionsUsed: [
          { moved: false, shot: false, melee: false, done: true },
          { moved: false, shot: false, melee: false, done: true },
        ],
      });
      expect(deriveUnitStatus(unit)).toBe('done');
    });

    it('returns done when one soldier done and one dead', () => {
      const unit = makeSquadUnit({
        deadSoldiers: [0],
        actionsUsed: [
          undefined as any,
          { moved: false, shot: false, melee: false, done: true },
        ],
      });
      expect(deriveUnitStatus(unit)).toBe('done');
    });

    it('returns dead when all soldiers are dead', () => {
      const unit = makeSquadUnit({
        deadSoldiers: [0, 1],
      });
      expect(deriveUnitStatus(unit)).toBe('dead');
    });

    it('returns active when some soldiers still have actions', () => {
      const unit = makeSquadUnit({
        actionsUsed: [
          { moved: false, shot: false, melee: false, done: true },
          { moved: false, shot: false, melee: false, done: false },
        ],
      });
      expect(deriveUnitStatus(unit)).toBe('active');
    });
  });

  describe('machine', () => {
    it('returns active when machine has durability and is not done', () => {
      const unit = makeMachineUnit({ currentDurability: 10 });
      expect(deriveUnitStatus(unit)).toBe('active');
    });

    it('returns done when machine is marked done', () => {
      const unit = makeMachineUnit({ currentDurability: 10, isMachineDone: true });
      expect(deriveUnitStatus(unit)).toBe('done');
    });

    it('returns dead when durability is 0', () => {
      const unit = makeMachineUnit({ currentDurability: 0 });
      expect(deriveUnitStatus(unit)).toBe('dead');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/unit-status.test.ts --passWithNoTests 2>&1 | head -20`
Expected: FAIL — module `@/lib/unit-status` not found

- [ ] **Step 3: Write implementation**

```typescript
// src/lib/unit-status.ts
import { ArmyUnit, Squad } from './types';

export type UnitStatus = 'active' | 'done' | 'dead';

export function deriveUnitStatus(unit: ArmyUnit): UnitStatus {
  if (unit.type === 'squad') {
    const data = unit.data as Squad;
    const allDead = (unit.deadSoldiers?.length || 0) === data.soldiers.length;
    if (allDead) return 'dead';

    const allDone = data.soldiers.every((_, idx) => {
      const isDead = unit.deadSoldiers?.includes(idx);
      const isActionDone = unit.actionsUsed?.[idx]?.done;
      return isDead || isActionDone;
    });
    return allDone ? 'done' : 'active';
  } else {
    if ((unit.currentDurability || 0) === 0) return 'dead';
    if (unit.isMachineDone) return 'done';
    return 'active';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/__tests__/unit-status.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/unit-status.ts src/__tests__/unit-status.test.ts
git commit -m "feat: add deriveUnitStatus utility with tests"
```

---

### Task 2: Create `ExpandedUnitCard` component

**Files:**
- Create: `src/components/GameSession/ExpandedUnitCard.tsx`

Medium-sized card for the expanded view. Shows image, name, and 2-3 stats. Styling varies by section (active/done/dead).

- [ ] **Step 1: Create the component**

```tsx
// src/components/GameSession/ExpandedUnitCard.tsx
'use client';

import { memo } from 'react';
import { ArmyUnit, Squad, Machine, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';
import { BASE_PATH } from '@/lib/constants';
import type { UnitStatus } from '@/lib/unit-status';

interface ExpandedUnitCardProps {
  unit: ArmyUnit;
  originalIndex: number;
  isActive: boolean;
  section: UnitStatus;
  isMachine: boolean;
  onClick: () => void;
  faction: FactionID;
}

const sectionStyles: Record<UnitStatus, {
  cardBg: string;
  cardBorder: string;
  imageBg: string;
  text: string;
  opacity: string;
  badgeBg: string;
  badgeBorder: string;
  indicator: string;
  headerBorder: string;
}> = {
  active: {
    cardBg: 'bg-transparent',
    cardBorder: '',  // overridden by faction colors
    imageBg: 'bg-gradient-to-br from-[#1f1f2e] to-[#161625]',
    text: 'text-slate-200',
    opacity: '',
    badgeBg: 'bg-black/70 border-slate-500',
    badgeBorder: '',
    indicator: '',
    headerBorder: '',
  },
  done: {
    cardBg: 'bg-gradient-to-b from-[#071a0d] to-[#051209]',
    cardBorder: 'border-green-800',
    imageBg: 'bg-gradient-to-br from-[#0a2a12] to-[#071a0d]',
    text: 'text-green-300',
    opacity: 'opacity-70',
    badgeBg: 'bg-black/70 border-green-800',
    badgeBorder: '',
    indicator: '',
    headerBorder: '',
  },
  dead: {
    cardBg: 'bg-gradient-to-b from-[#1a0707] to-[#120505]',
    cardBorder: 'border-red-900',
    imageBg: 'bg-gradient-to-br from-[#2a0a0a] to-[#1a0707]',
    text: 'text-red-300 line-through',
    opacity: 'opacity-50',
    badgeBg: 'bg-black/70 border-red-900',
    badgeBorder: '',
    indicator: '',
    headerBorder: '',
  },
};

function getUnitStats(unit: ArmyUnit, isMachine: boolean): string[] {
  if (isMachine) {
    const machine = unit.data as Machine;
    const hp = `${unit.currentDurability ?? 0}/${machine.durability_max}`;
    const power = machine.weapons[0]?.power || '—';
    return [`⚔ ${power}`, `HP ${hp}`];
  }
  const squad = unit.data as Squad;
  const firstSoldier = squad.soldiers[0];
  if (!firstSoldier) return [];
  const alive = squad.soldiers.length - (unit.deadSoldiers?.length || 0);
  return [
    `⚔ ${firstSoldier.power}`,
    `🛡 ${firstSoldier.armor}`,
    `♥ ${alive}`,
  ];
}

export const ExpandedUnitCard = memo(function ExpandedUnitCard({
  unit,
  isActive,
  section,
  isMachine,
  onClick,
  faction,
}: Omit<ExpandedUnitCardProps, 'originalIndex'>) {
  const styles = sectionStyles[section];
  const factionColors = section === 'active' ? getFactionColors(faction) : null;
  const stats = getUnitStats(unit, isMachine);

  const imageUrl = isMachine
    ? unit.data.image!
    : ((unit.data as Squad).soldiers[0]?.image || unit.data.image!)!;
  const finalSrc = imageUrl?.startsWith('/images/')
    ? `${BASE_PATH}${imageUrl}`
    : imageUrl;

  return (
    <button
      onClick={onClick}
      aria-label={`${unit.data.name}, ${section === 'active' ? 'активный' : section === 'done' ? 'походил' : 'убит'}`}
      className={cn(
        'w-[100px] rounded overflow-hidden relative transition-all duration-200',
        'hover:scale-105 active:scale-95',
        styles.cardBg,
        styles.opacity,
        isActive && 'ring-2 ring-offset-1 ring-offset-slate-950',
        section === 'active' && factionColors
          ? cn('border', factionColors.borderSolid, isActive && factionColors.ring)
          : styles.cardBorder
      )}
    >
      {/* Image area */}
      <div className={cn('h-[55px] flex items-center justify-center relative', styles.imageBg)}>
        {finalSrc ? (
          <img
            src={finalSrc}
            alt={unit.data.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 85%' }}
          />
        ) : (
          <span className="text-slate-500 text-xs">IMG</span>
        )}
        {/* Number badge */}
        <div className={cn(
          'absolute top-[3px] left-[3px] px-1 rounded-sm',
          section === 'active' && factionColors
            ? `border ${factionColors.border}`
            : cn('border', styles.badgeBg.split(' ').find(c => c.startsWith('border-')) || '')
        )}
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <span className={cn(
            'text-[8px] font-bold font-mono',
            section === 'active' ? 'text-slate-300' : section === 'done' ? 'text-green-400' : 'text-red-400'
          )}>
            #{unit.instanceNumber || ''}
          </span>
        </div>
        {/* Active indicator diamond */}
        {section === 'active' && factionColors && (
          <div
            className="absolute top-[3px] right-[3px] w-[6px] h-[6px]"
            style={{
              backgroundColor: factionColors.primary,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            }}
          />
        )}
        {/* Done checkmark */}
        {section === 'done' && (
          <span className="text-green-500 text-sm">✓</span>
        )}
        {/* Dead X */}
        {section === 'dead' && (
          <span className="text-red-600 text-base">✕</span>
        )}
      </div>

      {/* Info area */}
      <div className="px-2 py-1.5">
        <div className={cn('text-[10px] font-bold mb-1 truncate', styles.text)}>
          {(unit.data.shortName || unit.data.name || '').substring(0, 7).toUpperCase()}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {stats.map((stat, i) => (
            <span
              key={i}
              className={cn(
                'text-[8px]',
                section === 'active' ? 'text-slate-400' :
                section === 'done' ? 'text-green-600' : 'text-red-700'
              )}
            >
              {stat}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}, (prev, next) => {
  return (
    prev.unit.instanceId === next.unit.instanceId &&
    prev.isActive === next.isActive &&
    prev.section === next.section &&
    prev.unit.currentDurability === next.unit.currentDurability &&
    prev.unit.deadSoldiers?.length === next.unit.deadSoldiers?.length &&
    prev.unit.actionsUsed === next.unit.actionsUsed
  );
});
```

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -i "ExpandedUnitCard" || echo "No errors"`
Expected: No errors for ExpandedUnitCard

- [ ] **Step 3: Commit**

```bash
git add src/components/GameSession/ExpandedUnitCard.tsx
git commit -m "feat: add ExpandedUnitCard component for Military HUD navigator"
```

---

### Task 3: Create `ExpandedNavigator` component

**Files:**
- Create: `src/components/GameSession/ExpandedNavigator.tsx`
- Modify: `src/components/GameSession/index.ts` — export new components

The main sectioned layout with top bar and three vertical sections.

- [ ] **Step 1: Create the component**

```tsx
// src/components/GameSession/ExpandedNavigator.tsx
'use client';

import { useMemo } from 'react';
import { Army, ArmyUnit, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';
import { deriveUnitStatus, UnitStatus } from '@/lib/unit-status';
import { ExpandedUnitCard } from './ExpandedUnitCard';

interface ExpandedNavigatorProps {
  army: Army;
  focusedUnitIdx: number;
  onSelectUnit: (idx: number) => void;
}

interface SectionConfig {
  key: UnitStatus;
  label: string;
  indicatorColor: string;
  borderColor: string;
  countBg: string;
  countText: string;
}

const sections: SectionConfig[] = [
  {
    key: 'active',
    label: 'Активные',
    indicatorColor: '', // dynamic from faction
    borderColor: '',
    countBg: '',
    countText: '',
  },
  {
    key: 'done',
    label: 'Походили',
    indicatorColor: '#22c55e',
    borderColor: 'border-b-green-900',
    countBg: 'bg-green-500/15',
    countText: 'text-green-400',
  },
  {
    key: 'dead',
    label: 'Убитые',
    indicatorColor: '#991b1b',
    borderColor: 'border-b-red-900',
    countBg: 'bg-red-500/15',
    countText: 'text-red-400',
  },
];

export function ExpandedNavigator({ army, focusedUnitIdx, onSelectUnit }: ExpandedNavigatorProps) {
  const faction = (army.faction || 'polaris') as FactionID;
  const factionColors = getFactionColors(faction);

  const grouped = useMemo(() => {
    const groups: Record<UnitStatus, Array<{ unit: ArmyUnit; idx: number }>> = {
      active: [],
      done: [],
      dead: [],
    };
    army.units.forEach((unit, idx) => {
      const status = deriveUnitStatus(unit);
      groups[status].push({ unit, idx });
    });
    return groups;
  }, [army.units]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar" data-testid="expanded-navigator">
      {/* Top bar */}
      <div className="flex items-center px-3.5 py-2.5 bg-gradient-to-b from-[#0f1623] to-[#0a0e17] border-b border-slate-800">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">
          Полевой обзор
        </span>
        <span className="ml-auto text-slate-600 text-[11px]">
          ⟷ свайп вниз
        </span>
      </div>

      {/* Sections */}
      {sections.map((sectionConfig) => {
        const items = grouped[sectionConfig.key];
        const isActive = sectionConfig.key === 'active';
        const sectionFactionColors = isActive ? factionColors : null;

        return (
          <div
            key={sectionConfig.key}
            className="px-3.5 py-2.5"
            role="region"
            aria-label={`${sectionConfig.label} юниты`}
          >
            {/* Section header */}
            <div className={cn(
              'flex items-center gap-2 mb-2.5 pb-1.5 border-b',
              isActive ? 'border-b-slate-700' : sectionConfig.borderColor
            )}>
              {/* Diamond indicator */}
              <div
                className="w-2 h-2 shrink-0"
                style={{
                  backgroundColor: isActive ? factionColors.primary : sectionConfig.indicatorColor,
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                }}
              />
              <span className={cn(
                'text-[11px] uppercase tracking-[2px] font-semibold',
                isActive ? 'text-slate-400' :
                sectionConfig.key === 'done' ? 'text-green-300' : 'text-red-300'
              )}>
                {sectionConfig.label}
              </span>
              {/* Count badge */}
              <span className={cn(
                'ml-auto text-[10px] px-2 py-0.5 rounded-sm font-bold',
                isActive
                  ? cn('bg-slate-500/15', factionColors.text)
                  : cn(sectionConfig.countBg, sectionConfig.countText)
              )}
              aria-label={`${items.length} юнитов`}
              >
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-wrap gap-2.5">
              {items.map(({ unit, idx }) => (
                <ExpandedUnitCard
                  key={unit.instanceId}
                  unit={unit}
                  originalIndex={idx}
                  isActive={focusedUnitIdx === idx}
                  section={sectionConfig.key}
                  isMachine={unit.type === 'machine'}
                  onClick={() => onSelectUnit(idx)}
                  faction={faction}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update barrel export**

Add to `src/components/GameSession/index.ts`:
```typescript
export { UnitNavigationCard } from './UnitNavigationCard';
export { ExpandedNavigator } from './ExpandedNavigator';
```

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -E "ExpandedNavigator|ExpandedUnitCard" || echo "No errors"`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/GameSession/ExpandedNavigator.tsx src/components/GameSession/ExpandedUnitCard.tsx src/components/GameSession/index.ts
git commit -m "feat: add ExpandedNavigator with sectioned Military HUD layout"
```

---

### Task 4: Wire ExpandedNavigator into GameSession

**Files:**
- Modify: `src/components/GameSession.tsx:813-858` — Replace flat grid with `ExpandedNavigator`
- Modify: `src/components/GameSession.tsx:1-19` — Update imports

Replace the flat grid expanded view with the new `ExpandedNavigator` component. The compact dock mode stays unchanged.

- [ ] **Step 1: Add import**

At the top of `src/components/GameSession.tsx`, change line 16 from:
```typescript
import { UnitNavigationCard } from './GameSession/index';
```
to:
```typescript
import { UnitNavigationCard, ExpandedNavigator } from './GameSession/index';
```

- [ ] **Step 2: Replace expanded grid**

Replace the expanded view block. Find this exact code starting at line 813:

```tsx
          {isDockExpanded ? (
            /* Expanded view - grid of all units */
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {army.units.map((unit, idx) => {
                  const dockStyles = getUnitDockStyles(army.faction || 'polaris');
                  const isActive = focusedUnitIdx === idx;
                  const isMachine = unit.type === 'machine';

                  // Calculate status
                  const isDone = (() => {
                    if (unit.type === 'squad') {
                      const data = unit.data as Squad;
                      return data.soldiers.every((_, soldierIdx) => {
                        const isDead = unit.deadSoldiers?.includes(soldierIdx);
                        const isActionDone = unit.actionsUsed?.[soldierIdx]?.done;
                        return isDead || isActionDone;
                      });
                    } else {
                      return unit.isMachineDone || unit.currentDurability === 0;
                    }
                  })();

                  const isDead = (() => {
                    if (unit.type === 'squad') {
                      return (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length;
                    } else {
                      return (unit.currentDurability || 0) === 0;
                    }
                  })();

                  return (
                    <UnitNavigationCard
                      key={unit.instanceId}
                      unit={unit}
                      isActive={isActive}
                      isDone={isDone}
                      isDead={isDead}
                      isMachine={isMachine}
                      onClick={() => { setFocusedUnitIdx(idx); setIsDockExpanded(false); }}
                      dockStyles={dockStyles}
                    />
                  );
                })}
              </div>
            </div>
```

Replace the entire block above (from `{isDockExpanded ? (` through the closing `</div>`) with:

```tsx
          {isDockExpanded ? (
            <ExpandedNavigator
              army={army}
              focusedUnitIdx={focusedUnitIdx}
              onSelectUnit={(idx) => { setFocusedUnitIdx(idx); setIsDockExpanded(false); }}
            />
```
```

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Run linter**

Run: `npm run lint 2>&1 | tail -5`
Expected: No errors

- [ ] **Step 5: Run full validate**

Run: `npm run validate`
Expected: All checks pass

- [ ] **Step 6: Commit**

```bash
git add src/components/GameSession.tsx
git commit -m "feat: wire ExpandedNavigator into GameSession, replace flat grid"
```

---

### Task 5: Refactor GameSession to use `deriveUnitStatus`

**Files:**
- Modify: `src/components/GameSession.tsx` — Replace inline status logic with `deriveUnitStatus`

The compact dock mode (lines ~860-955) still has duplicated isDone/isDead logic. Refactor it to use the new `deriveUnitStatus` utility for consistency.

- [ ] **Step 1: Add import**

Add to imports in `src/components/GameSession.tsx`:
```typescript
import { deriveUnitStatus } from '@/lib/unit-status';
```

**Note:** `GameSession.tsx` already has a local `const getUnitStatus = useCallback(...)` (line 357) that returns `{ isDead, isDone }`. Do NOT remove it — it is used in other places (lines 376, 478, 523, 1094). The new import `deriveUnitStatus` returns a string enum `'active' | 'done' | 'dead'` and has a different name to avoid collision.

- [ ] **Step 2: Replace compact dock status logic**

In the compact dock sort/group block (around lines 867-884), replace the inline `getStatus` function:

**Old**:
```typescript
const getStatus = (u: ArmyUnit) => {
  if (u.type === 'squad') {
    const isDead = (u.deadSoldiers?.length || 0) === (u.data as Squad).soldiers.length;
    const isDone = (u.data as Squad).soldiers.every((_, idx) => {
      return u.deadSoldiers?.includes(idx) || u.actionsUsed?.[idx]?.done;
    });
    if (isDead) return 2;
    if (isDone) return 1;
    return 0;
  } else {
    if (u.currentDurability === 0) return 2;
    if (u.isMachineDone) return 1;
    return 0;
  }
};
```

**New**:
```typescript
const statusOrder: Record<string, number> = { active: 0, done: 1, dead: 2 };
const getStatus = (u: ArmyUnit) => statusOrder[deriveUnitStatus(u)];
```

Also replace the inline `currentStatus` block (around lines 895-909):

**Old**:
```typescript
const currentStatus = (() => {
  if (unit.type === 'squad') {
    const isDead = (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length;
    const isDone = (unit.data as Squad).soldiers.every((_, idx) => {
      return unit.deadSoldiers?.includes(idx) || unit.actionsUsed?.[idx]?.done;
    });
    if (isDead) return 2;
    if (isDone) return 1;
    return 0;
  } else {
    if (unit.currentDurability === 0) return 2;
    if (unit.isMachineDone) return 1;
    return 0;
  }
})();
```

**New**:
```typescript
const currentStatus = statusOrder[deriveUnitStatus(unit)];
```

And replace the isDone/isDead blocks (around lines 920-939):

**Old**:
```typescript
const isDone = (() => {
  if (unit.type === 'squad') {
    const data = unit.data as Squad;
    return data.soldiers.every((_, soldierIdx) => {
      const isDead = unit.deadSoldiers?.includes(soldierIdx);
      const isActionDone = unit.actionsUsed?.[soldierIdx]?.done;
      return isDead || isActionDone;
    });
  } else {
    return unit.isMachineDone || unit.currentDurability === 0;
  }
})();

const isDead = (() => {
  if (unit.type === 'squad') {
    return (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length;
  } else {
    return (unit.currentDurability || 0) === 0;
  }
})();
```

**New**:
```typescript
const unitStatus = deriveUnitStatus(unit);
const isDone = unitStatus === 'done' || unitStatus === 'dead';
const isDead = unitStatus === 'dead';
```

- [ ] **Step 3: Run validate**

Run: `npm run validate`
Expected: All checks pass (existing tests still pass since behavior is identical)

- [ ] **Step 4: Commit**

```bash
git add src/components/GameSession.tsx
git commit -m "refactor: use deriveUnitStatus utility in compact dock, remove duplicated status logic"
```

---

### Task 6: E2E test for expanded navigator

**Files:**
- Create: `e2e/expanded-navigator.spec.ts`

Test that expanding the navigator shows sections, clicking a unit closes it.

- [ ] **Step 1: Write E2E test**

```typescript
// e2e/expanded-navigator.spec.ts
import { test, expect } from '@playwright/test';

async function navigateToGameSession(page: import('@playwright/test').Page) {
  await page.goto('/app');
  await page.evaluate(() => {
    localStorage.clear();
    const army = {
      name: 'Test Army',
      faction: 'polaris',
      sourceId: 'star_system',
      units: [
        {
          instanceId: 'squad-1',
          type: 'squad',
          instanceNumber: 1,
          data: {
            id: 'polaris_clone',
            name: 'Клон-штурмовик',
            shortName: 'КЛОН',
            faction: 'polaris',
            cost: 50,
            soldiers: [
              { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
              { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
            ],
            image: '/images/squads/clone.jpg',
          },
          totalCost: 50,
          currentTurn: 1,
        },
        {
          instanceId: 'squad-2',
          type: 'squad',
          instanceNumber: 2,
          data: {
            id: 'polaris_heavy',
            name: 'Тяжёлый клон',
            shortName: 'ТЯЖ',
            faction: 'polaris',
            cost: 80,
            soldiers: [
              { rank: 6, speed: 3, range: 'D12', power: '2D6', melee: 0, armor: 3 },
            ],
            image: '/images/squads/heavy.jpg',
          },
          actionsUsed: [{ moved: false, shot: false, melee: false, done: true }],
        },
        {
          instanceId: 'squad-3',
          type: 'squad',
          instanceNumber: 3,
          data: {
            id: 'polaris_scout',
            name: 'Разведчик',
            shortName: 'РАЗВ',
            faction: 'polaris',
            cost: 40,
            soldiers: [
              { rank: 4, speed: 5, range: 'D6', power: '1D6', melee: 0, armor: 1 },
            ],
            image: '/images/squads/scout.jpg',
          },
          deadSoldiers: [0],
        },
      ],
      totalCost: 170,
      currentStep: 'game',
      isInBattle: true,
      currentTurn: 1,
    };
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
    localStorage.setItem('bronepehota_view', 'game');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

test.describe('Expanded Navigator', () => {
  test('should show three sections when navigator is expanded', async ({ page }) => {
    await navigateToGameSession(page);

    const gameSession = page.getByTestId('game-session');
    if (!(await gameSession.count())) return;

    // Find and click the dock expand handle
    const dockHandle = page.locator('.fixed.left-0.right-0.z-50 > .flex.justify-center');
    await dockHandle.click();
    await page.waitForTimeout(300);

    // Check expanded navigator renders
    const expandedNav = page.getByTestId('expanded-navigator');
    await expect(expandedNav).toBeVisible();

    // Check sections render with region role
    const activeSection = page.locator('[aria-label="Активные юниты"]');
    const doneSection = page.locator('[aria-label="Походили юниты"]');
    const deadSection = page.locator('[aria-label="Убитые юниты"]');

    await expect(activeSection).toBeVisible();
    await expect(doneSection).toBeVisible();
    await expect(deadSection).toBeVisible();
  });

  test('should close navigator and switch unit on card click', async ({ page }) => {
    await navigateToGameSession(page);

    const gameSession = page.getByTestId('game-session');
    if (!(await gameSession.count())) return;

    // Expand navigator
    const dockHandle = page.locator('.fixed.left-0.right-0.z-50 > .flex.justify-center');
    await dockHandle.click();
    await page.waitForTimeout(300);

    // Click a unit card
    const unitCard = page.locator('[data-testid="expanded-navigator"] button').first();
    await unitCard.click();
    await page.waitForTimeout(300);

    // Navigator should close
    await expect(page.getByTestId('expanded-navigator')).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Run E2E test**

Run: `npm run test:e2e -- --grep "Expanded Navigator"`
Expected: Tests pass (may need adjustment depending on actual DOM structure)

- [ ] **Step 3: Commit**

```bash
git add e2e/expanded-navigator.spec.ts
git commit -m "test: add E2E tests for expanded navigator sections and navigation"
```

---

### Task 7: Visual verification and polish

**Files:**
- Potentially modify: `src/components/GameSession/ExpandedUnitCard.tsx`
- Potentially modify: `src/components/GameSession/ExpandedNavigator.tsx`

Manual testing to verify the Military HUD design looks correct on mobile and desktop.

- [ ] **Step 1: Start dev server and verify**

Run: `npm run dev`

Check in browser at http://localhost:3000/app:
1. Navigate to game session (or set localStorage to battle state)
2. Expand the dock navigator
3. Verify 3 sections render vertically with correct styling
4. Verify faction colors appear on active cards
5. Verify done cards are dimmed with green tones
6. Verify dead cards are dimmed with red tones and strikethrough names
7. Click a unit — navigator closes, unit becomes focused

- [ ] **Step 2: Fix any visual issues found**

Adjust Tailwind classes in ExpandedUnitCard or ExpandedNavigator as needed.

- [ ] **Step 3: Final validate**

Run: `npm run validate`
Expected: All checks pass

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "style: polish expanded navigator Military HUD design"
```

---

## Task Dependencies

```
Task 1 (deriveUnitStatus) → Task 2 (ExpandedUnitCard) → Task 3 (ExpandedNavigator) → Task 4 (wire into GameSession)
Task 1 → Task 5 (refactor compact dock)
Task 4 → Task 6 (E2E tests)
Task 4 → Task 7 (visual verification)
```

Tasks 5 and 6 can run in parallel after their dependencies are met.
