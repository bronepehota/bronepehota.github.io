# Squad Detail Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the army-build squad detail view with a lean, stats-first bottom sheet that shows a per-soldier stat table up top, a source badge reflecting the selected source, optional one-line lore, and an add-to-army action.

**Architecture:** Two new components — `UnitStatTable` (reusable stat plate, squad + machine variants) and `UnitDetailSheet` (the bottom sheet that hosts it). `UnitSelector` stops using `EncyclopediaModal` (which stays untouched for the game session) and renders `UnitDetailSheet` instead, passing the real selected `sourceId`. `ArmyBuilder` threads its existing `selectedSource` down. Visual direction is the existing military dossier theme, applied with restraint (one-shot animations only, no infinite effects).

**Tech Stack:** Next.js 14 (App Router, `"use client"`), React 18, TypeScript, Tailwind, lucide-react icons, Jest + Testing Library (unit), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-06-15-squad-detail-sheet-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/components/encyclopedia/UnitDetail/UnitStatTable.tsx` (NEW) | Reusable stat plate. Squad → 8-column table (№/А/Ск/Дальн/Мощн/ББ/Св/Бр). Machine → spec tiles + weapons. Holds the canonical `STAT_TEXT` color map. |
| `src/components/encyclopedia/UnitDetailSheet.tsx` (NEW) | Lean bottom sheet: header (faction + name + source stamp + cost + close), `UnitStatTable`, optional 1-line lore, footer (encyclopedia link + Add). Uses `useBottomSheet`. |
| `src/components/UnitSelector.tsx` (MODIFY) | Render `UnitDetailSheet` instead of `EncyclopediaModal`; accept `sourceId`; pass `onAdd`; remove hardcoded `sources`/`scrollTarget`. |
| `src/components/ArmyBuilder.tsx` (MODIFY) | Pass `sourceId={selectedSource}` to `<UnitSelector>`. |
| `src/__tests__/unit-stat-table.test.tsx` (NEW) | Unit tests for squad + machine variants. |
| `src/__tests__/unit-detail-sheet.test.tsx` (NEW) | Unit tests for the sheet (source badge, add, close, closed state). |
| `e2e/army-creation.spec.ts` (MODIFY) | E2E: tap squad → sheet with stat table + source badge → add closes it. |

**Unchanged:** `src/components/modals/EncyclopediaModal.tsx`, `src/components/cards/UnitCard.tsx`, `UnitCard.legacy.tsx` (game session keeps its current modal).

**Data facts (verified):**
- `Soldier`: `{ num?, rank, speed, range, power, melee, modifiers?: string[], armor, image? }`.
- `Machine`: `{ ..., rank, fire_rate, ammo_max, durability_max, speed_sectors: SpeedSector[], weapons: Weapon[] }`.
- `Weapon`: `{ name, range, power, special?, ... }`; `SpeedSector`: `{ min_durability, max_durability, speed }`.
- `getSource(id: SourceID): SourceData | null` → `.source.name` is the display name (e.g. `'Технолог Классик'`, `'Star System'`).
- `getStandardBuffs(): BuffDefinition[]` → each `{ id, name, icon? }` (e.g. `jump_boost_4` → name `'Пр4'`, icon `'ArrowUp'`).
- `ModifierIcon` (`src/components/editor/ModifierIcons.tsx`): props `{ name?, className?, size? }`, renders a Lucide icon by name.
- `getFactionColors(factionId)` → `{ bg, text, border, ... }` where `bg`/`text` are hex (use in `style`) and `border` is a Tailwind class.
- `useBottomSheet({ onClose, closeThreshold, isEnabled })` → `{ sheetRef, touchHandlers }`.

---

## Task 1: UnitStatTable — squad variant

**Files:**
- Create: `src/components/encyclopedia/UnitDetail/UnitStatTable.tsx`
- Test: `src/__tests__/unit-stat-table.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/unit-stat-table.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { UnitStatTable } from '@/components/encyclopedia/UnitDetail/UnitStatTable';
import type { Squad } from '@/lib/types';

const squad: Squad = {
  id: 'test_squad',
  name: 'Тест',
  faction: 'polaris',
  cost: 40,
  soldiers: [
    { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 4, armor: 3 },
    { num: 2, rank: 3, speed: 5, range: '', power: '2D6', melee: 4, armor: 3, modifiers: ['jump_boost_4'] },
  ],
};

describe('UnitStatTable (squad)', () => {
  it('renders the section and stat values', () => {
    render(<UnitStatTable unit={squad} type="squad" />);
    expect(screen.getByTestId('unit-stat-table')).toBeInTheDocument();
    expect(screen.getByText('D6')).toBeInTheDocument();
    expect(screen.getAllByText('2D6').length).toBe(2); // both soldiers' power
  });

  it('shows — for empty range', () => {
    render(<UnitStatTable unit={squad} type="squad" />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1); // soldier 2 empty range
  });

  it('resolves and shows the modifier label (Пр4) for jump_boost_4', () => {
    render(<UnitStatTable unit={squad} type="squad" />);
    expect(screen.getByText('Пр4')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/unit-stat-table.test.tsx`
Expected: FAIL — `Cannot find module '@/components/encyclopedia/UnitDetail/UnitStatTable'`.

- [ ] **Step 3: Implement UnitStatTable (squad branch only)**

Create `src/components/encyclopedia/UnitDetail/UnitStatTable.tsx`:

```tsx
'use client';

import React from 'react';
import type { Squad, Machine, Soldier } from '@/lib/types';
import { getStandardBuffs } from '@/lib/modifier-utils';
import { ModifierIcon } from '@/components/editor/ModifierIcons';

// Canonical semantic stat colors (mirrors SoldierImages palette).
// When propagating across the app, lift this into src/lib/stat-colors.ts.
const STAT_TEXT: Record<string, string> = {
  rank: 'text-amber-400',
  speed: 'text-military-sand',
  range: 'text-cyan-400',
  power: 'text-red-400',
  melee: 'text-orange-400',
  armor: 'text-blue-400',
};

function modifierMeta(id: string): { name: string; icon?: string } | undefined {
  const found = getStandardBuffs().find((b) => b.id === id);
  return found ? { name: found.name, icon: found.icon } : undefined;
}

interface UnitStatTableProps {
  unit: Squad | Machine;
  type: 'squad' | 'machine';
}

export function UnitStatTable({ unit, type }: UnitStatTableProps) {
  if (type === 'machine') {
    return <MachineStats machine={unit as Machine} />;
  }
  return <SquadStats squad={unit as Squad} />;
}

function isSpecial(s: Soldier): boolean {
  return Boolean(s.modifiers?.length) || s.rank >= 3;
}

function SquadStats({ squad }: { squad: Squad }) {
  return (
    <section className="folded-paper military-corners p-3" data-testid="unit-stat-table" aria-label="Боевой расчёт">
      <div className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
        // БОЕВОЙ РАСЧЁТ
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm font-ibm-mono">
          <thead>
            <tr className="text-military-steel text-[10px] uppercase">
              <th className="px-1 py-1 text-left font-medium">№</th>
              <th className="px-1 py-1 font-medium">А</th>
              <th className="px-1 py-1 font-medium">Ск</th>
              <th className="px-1 py-1 font-medium">Дальн</th>
              <th className="px-1 py-1 font-medium">Мощн</th>
              <th className="px-1 py-1 font-medium">ББ</th>
              <th className="px-1 py-1 font-medium">Св</th>
              <th className="px-1 py-1 font-medium">Бр</th>
            </tr>
          </thead>
          <tbody>
            {squad.soldiers.map((s, i) => {
              const mod = s.modifiers?.[0] ? modifierMeta(s.modifiers[0]) : undefined;
              const special = isSpecial(s);
              return (
                <tr
                  key={s.num ?? i}
                  className={`border-t border-military-steel/20 ${special ? 'bg-military-amber/5' : ''}`}
                >
                  <td className="px-1 py-1.5 text-military-taupe">{s.num ?? i + 1}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.rank}`}>{s.rank}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.speed}`}>{s.speed}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.range}`}>{s.range || '—'}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.power}`}>{s.power || '—'}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.melee}`}>{s.melee}</td>
                  <td className="px-1 py-1.5 text-center">
                    {mod ? (
                      <span className="inline-flex items-center gap-1 px-1 rounded-sm bg-military-steel/30 text-military-sand text-[10px]">
                        {mod.icon && <ModifierIcon name={mod.icon} size={10} className="text-military-amber" />}
                        {mod.name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.armor}`}>{s.armor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Placeholder — implemented in Task 2.
function MachineStats({ machine: _machine }: { machine: Machine }) {
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/unit-stat-table.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/encyclopedia/UnitDetail/UnitStatTable.tsx src/__tests__/unit-stat-table.test.tsx
git commit -m "$(cat <<'EOF'
feat(stat-table): add UnitStatTable squad variant

Reusable stat plate rendering one row per soldier (№/А/Ск/Дальн/Мощн/ББ/Св/Бр)
with canonical semantic stat colors and a modifier chip resolved from the
standard buffs catalog.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: UnitStatTable — machine variant

**Files:**
- Modify: `src/components/encyclopedia/UnitDetail/UnitStatTable.tsx` (replace the placeholder `MachineStats`)
- Test: append to `src/__tests__/unit-stat-table.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/unit-stat-table.test.tsx`:

```tsx
import type { Machine } from '@/lib/types';

const machine: Machine = {
  id: 'test_machine',
  name: 'Тестовая машина',
  faction: 'polaris',
  cost: 150,
  rank: 2,
  fire_rate: 2,
  ammo_max: 20,
  durability_max: 16,
  speed_sectors: [
    { min_durability: 9, max_durability: 16, speed: 2 },
    { min_durability: 1, max_durability: 8, speed: 1 },
  ],
  weapons: [{ name: 'Пушка', range: 'D12', power: '2D12' }],
};

describe('UnitStatTable (machine)', () => {
  it('renders spec tiles and the weapons list', () => {
    render(<UnitStatTable unit={machine} type="machine" />);
    expect(screen.getByTestId('unit-stat-table')).toBeInTheDocument();
    expect(screen.getByText('Пушка')).toBeInTheDocument();
    expect(screen.getByText('D12')).toBeInTheDocument();
    expect(screen.getByText('2D12')).toBeInTheDocument();
    expect(screen.getByText('Б/с')).toBeInTheDocument();
    expect(screen.getByText('Прочн.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/unit-stat-table.test.tsx`
Expected: FAIL — machine test fails (current `MachineStats` returns null, so `Пушка`/`Б/с` not found).

- [ ] **Step 3: Implement MachineStats**

Replace the placeholder `MachineStats` function in `UnitStatTable.tsx` with:

```tsx
function MachineStats({ machine }: { machine: Machine }) {
  const speeds = Array.from(new Set(machine.speed_sectors.map((s) => s.speed))).join(' / ');
  const tiles = [
    { label: 'Ранг', value: String(machine.rank), cls: STAT_TEXT.rank },
    { label: 'Прочн.', value: String(machine.durability_max), cls: 'text-military-sand' },
    { label: 'Б/с', value: String(machine.fire_rate), cls: 'text-amber-400' },
    { label: 'Боезапас', value: String(machine.ammo_max), cls: 'text-military-sand' },
    { label: 'Скорость', value: speeds, cls: STAT_TEXT.speed },
  ];
  return (
    <section className="folded-paper military-corners p-3" data-testid="unit-stat-table" aria-label="Боевой расчёт">
      <div className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
        // БОЕВОЙ РАСЧЁТ
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
        {tiles.map((t) => (
          <div key={t.label} className="text-center p-2 bg-military-charcoal/50 rounded">
            <div className={`font-russo text-base font-bold ${t.cls}`}>{t.value}</div>
            <div className="font-ibm-mono text-[10px] text-military-steel uppercase">{t.label}</div>
          </div>
        ))}
      </div>
      <ul className="space-y-1">
        {machine.weapons.map((w, i) => (
          <li key={i} className="flex items-center justify-between gap-2 font-ibm-mono text-xs">
            <span className="text-military-sand truncate">{w.name}</span>
            <span className="flex items-center gap-2 shrink-0">
              <span className={STAT_TEXT.range}>{w.range}</span>
              <span className={STAT_TEXT.power}>{w.power}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/unit-stat-table.test.tsx`
Expected: PASS (all squad + machine tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/encyclopedia/UnitDetail/UnitStatTable.tsx src/__tests__/unit-stat-table.test.tsx
git commit -m "$(cat <<'EOF'
feat(stat-table): add UnitStatTable machine variant

Compact spec tiles (rank/durability/fire-rate/ammo/speed) plus a weapons
list with range/power using the canonical stat colors.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: UnitDetailSheet

**Files:**
- Create: `src/components/encyclopedia/UnitDetailSheet.tsx`
- Test: `src/__tests__/unit-detail-sheet.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/unit-detail-sheet.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitDetailSheet } from '@/components/encyclopedia/UnitDetailSheet';
import type { Squad } from '@/lib/types';

const squad: Squad = {
  id: 'test_squad',
  name: 'Тестовый отряд',
  faction: 'polaris',
  cost: 40,
  soldiers: [{ num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 4, armor: 3 }],
};

describe('UnitDetailSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <UnitDetailSheet unit={squad} type="squad" sourceId="tehnolog" isOpen={false} onClose={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the name, source stamp, and stat table when open', () => {
    render(<UnitDetailSheet unit={squad} type="squad" sourceId="tehnolog" isOpen onClose={() => {}} />);
    expect(screen.getByTestId('unit-detail-sheet')).toBeInTheDocument();
    expect(screen.getByText('Тестовый отряд')).toBeInTheDocument();
    expect(screen.getByText(/Технолог/)).toBeInTheDocument(); // source stamp
    expect(screen.getByText('D6')).toBeInTheDocument(); // stat table rendered
  });

  it('calls onAdd when the Добавить button is clicked', async () => {
    const onAdd = jest.fn();
    render(
      <UnitDetailSheet unit={squad} type="squad" sourceId="tehnolog" isOpen onClose={() => {}} onAdd={onAdd} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /добавить/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = jest.fn();
    render(<UnitDetailSheet unit={squad} type="squad" sourceId="tehnolog" isOpen onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /закрыть/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/unit-detail-sheet.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement UnitDetailSheet**

Create `src/components/encyclopedia/UnitDetailSheet.tsx`:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { X, Plus, BookOpen, Shield, Zap, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Squad, Machine, SourceID, FactionID } from '@/lib/types';
import { getSource } from '@/lib/sources-registry';
import { getFactionColors } from '@/lib/faction-colors';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { UnitStatTable } from './UnitDetail/UnitStatTable';

interface UnitDetailSheetProps {
  unit: Squad | Machine;
  type: 'squad' | 'machine';
  sourceId: SourceID;
  isOpen: boolean;
  onClose: () => void;
  onAdd?: () => void;
}

const factionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  polaris: Shield,
  protectorate: Zap,
  mercenaries: Skull,
};

function loreLine(unit: Squad | Machine): string | undefined {
  const enc = unit.encyclopedia as { shortDescription?: string; lore?: string } | undefined;
  return enc?.shortDescription || enc?.lore || ('description' in unit ? (unit as Machine).description : undefined);
}

export function UnitDetailSheet({ unit, type, sourceId, isOpen, onClose, onAdd }: UnitDetailSheetProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({ onClose, closeThreshold: 100, isEnabled: isOpen });
  if (!isOpen) return null;

  const colors = getFactionColors(unit.faction as FactionID);
  const sourceName = getSource(sourceId)?.source.name ?? sourceId;
  const FactionIcon = factionIcons[unit.faction as string] ?? Shield;
  const lore = loreLine(unit);

  return (
    <div
      className="fixed inset-0 z-[60] bg-military-dark/90 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        data-testid="unit-detail-sheet"
        className={cn(
          'w-full sm:max-w-3xl bg-military-dark border-2 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col',
          colors.border,
        )}
        onClick={(e) => e.stopPropagation()}
        {...touchHandlers}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-military-rust/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg" style={{ backgroundColor: colors.bg }}>
              <FactionIcon className="w-4 h-4" style={{ color: colors.text }} />
            </div>
            <div className="min-w-0">
              <h2 className={cn('font-russo font-bold text-sm uppercase tracking-wider truncate', colors.text)}>
                {unit.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="inline-block px-1.5 py-0.5 -rotate-2 border border-military-rust/60 text-military-rust font-ibm-mono text-[9px] uppercase tracking-wider rounded-sm bg-military-rust/5"
                  title="Источник статов"
                >
                  ИСТ: {sourceName}
                </span>
                <span className="font-ibm-mono text-[10px] text-military-amber">{unit.cost} ОЧК</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-military-rust/30 rounded-sm"
          >
            <X className="w-4 h-4 text-military-steel" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
          <UnitStatTable unit={unit} type={type} />
          {lore && (
            <p className="font-oswald text-military-sand text-sm italic border-l-4 border-military-rust/60 pl-3">
              {lore}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-military-rust/30 flex items-center gap-2">
          <Link
            href="/encyclopedia"
            className="font-ibm-mono text-[11px] text-military-steel hover:text-military-sand inline-flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" /> Энциклопедия
          </Link>
          <div className="flex-1" />
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-4 py-2 min-h-[44px] rounded-sm bg-military-rust text-military-dark font-russo text-sm uppercase tracking-wider inline-flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" /> Добавить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/unit-detail-sheet.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/encyclopedia/UnitDetailSheet.tsx src/__tests__/unit-detail-sheet.test.tsx
git commit -m "$(cat <<'EOF'
feat(detail-sheet): add lean UnitDetailSheet for army build

Stats-first bottom sheet: header with faction + source stamp + cost,
UnitStatTable, optional one-line lore, footer with encyclopedia link and
Add-to-army action. Uses the existing military theme with one-shot motion
only (no infinite animations).

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Wire UnitDetailSheet into UnitSelector + ArmyBuilder

**Files:**
- Modify: `src/components/UnitSelector.tsx` (imports, props, modal block at ~528-540)
- Modify: `src/components/ArmyBuilder.tsx` (UnitSelector render at ~313)

- [ ] **Step 1: Add `sourceId` to UnitSelector props and pass the sheet**

In `src/components/UnitSelector.tsx`:

(a) Update the type import (line 5) to include `SourceID`:
```tsx
import type { Faction, Squad, Machine, ArmyUnit, FactionID, FilterType, SourceID } from '@/lib/types';
```

(b) Replace the `EncyclopediaModal` import (line 7) with `UnitDetailSheet`, and remove the now-unused `EnrichedUnit` import (line 14):
```tsx
import { UnitDetailSheet } from './encyclopedia/UnitDetailSheet';
```
(Delete the line `import { EnrichedUnit } from '@/lib/encyclopedia-utils';` if it is no longer referenced anywhere in the file — grep first: `grep -n "EnrichedUnit" src/components/UnitSelector.tsx`.)

(c) Add `sourceId: SourceID;` to the `UnitSelectorProps` interface (after the `displayMode`/`onDisplayModeChange` props).

(d) Add `sourceId,` to the destructured props in the function signature.

(e) Replace the modal block (currently lines ~528-540) with:
```tsx
      {/* Unit details sheet (lean, stats-first) */}
      {selectedUnit && (
        <UnitDetailSheet
          unit={selectedUnit.data}
          type={selectedUnit.type}
          sourceId={sourceId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={() => {
            handleAddUnit(selectedUnit);
            setIsModalOpen(false);
          }}
        />
      )}
```
This removes the hardcoded `sources: [{ id: 'star_system', ... }]` and the `scrollTarget` auto-scroll. `handleAddUnit` is the existing add handler already used by the unit cards (e.g. `onAdd={() => handleAddUnit(unit)}`).

- [ ] **Step 2: Pass sourceId from ArmyBuilder**

In `src/components/ArmyBuilder.tsx`, find the `<UnitSelector ... />` render (around line 313) and add the `sourceId` prop:
```tsx
            <UnitSelector
              // ...existing props...
              sourceId={selectedSource}
            />
```
`selectedSource` is the existing `SourceID` state in ArmyBuilder (declared ~line 82).

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors. If `EnrichedUnit` or `EncyclopediaModal` imports are flagged as unused, remove them (ESLint/TS).

- [ ] **Step 4: Commit**

```bash
git add src/components/UnitSelector.tsx src/components/ArmyBuilder.tsx
git commit -m "$(cat <<'EOF'
feat(army-builder): open UnitDetailSheet on squad tap, pass real source

UnitSelector renders UnitDetailSheet instead of EncyclopediaModal: drops the
hardcoded star_system source and the auto-scroll to images, and passes the
actually-selected sourceId (from ArmyBuilder) plus an Add-to-army callback.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: E2E — stats-first sheet on squad tap

**Files:**
- Modify: `e2e/army-creation.spec.ts` (append a test)

- [ ] **Step 1: Add the E2E test**

Append to `e2e/army-creation.spec.ts`, inside the `test.describe('Army Creation', ...)` block (before its closing `});`):

```tsx
  test('opens a stats-first detail sheet on squad tap and reflects the source', async ({ page }) => {
    // Desktop viewport defaults to 'detailed' → unit cards have data-testid `unit-card-<id>`
    await setupToArmyBuilder(page, { faction: 'polaris', budget: 350 });

    // Tap the first squad card (corner click avoids the add/remove buttons)
    const firstCard = page.locator('[data-testid^="unit-card-"]').first();
    await firstCard.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(250);

    const sheet = page.getByTestId('unit-detail-sheet');
    await expect(sheet).toBeVisible();

    // Stat table is present at the top (no auto-scroll to images anymore)
    await expect(sheet.getByTestId('unit-stat-table')).toBeVisible();

    // Source stamp reflects the selected source (default star_system)
    await expect(sheet.getByText(/Star System/)).toBeVisible();

    // Add-to-army from the sheet, then the sheet closes
    await sheet.getByRole('button', { name: /добавить/i }).click();
    await page.waitForTimeout(250);
    await expect(page.getByTestId('unit-detail-sheet')).toHaveCount(0);
  });
```

- [ ] **Step 2: Run the E2E spec**

Run: `npx playwright test e2e/army-creation.spec.ts --reporter=list`
Expected: PASS (all tests incl. the new one). If the card click opens add instead of the sheet, change the click target to the card title element and re-run.

- [ ] **Step 3: Commit**

```bash
git add e2e/army-creation.spec.ts
git commit -m "$(cat <<'EOF'
test(army-builder): squad tap opens stats-first detail sheet

E2E: tapping a squad card opens UnitDetailSheet with the stat table visible
at the top and a source stamp matching the selected source; Add-to-army
closes the sheet.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Final verification

- [ ] **Step 1: Full unit + type-check**

Run: `npm run type-check && npm run test`
Expected: type-check clean; all unit tests pass (existing + new `unit-stat-table` and `unit-detail-sheet`).

- [ ] **Step 2: Full E2E**

Run: `npm run test:e2e`
Expected: all E2E pass, including the new army-builder detail-sheet test and the existing game-session specs (EncyclopediaModal untouched).

- [ ] **Step 3: Manual perf sanity (optional but recommended)**

Run `npm run dev`, open the app on a 360×640 viewport with CPU throttling in DevTools, tap a squad, and confirm the sheet opens smoothly (one-shot animations only).

---

## Self-Review (completed during planning)

- **Spec coverage:** stat table on top (Tasks 1–2), source badge (Task 3 `ИСТ: {sourceName}`), 1-line lore (Task 3 `loreLine`), Add-to-army (Task 3 + Task 4 wiring), no auto-scroll / no hardcoded source (Task 4 removes both), scoped to army-build / game session untouched (Task 4 leaves `EncyclopediaModal` alone), reusable primitives (`UnitStatTable`, `STAT_TEXT` map), testing (Tasks 1–3 unit, Task 5 E2E, Task 6 full). ✓
- **Placeholders:** none — every code step contains real code; no TBD/TODO. ✓
- **Type consistency:** `UnitStatTableProps { unit: Squad | Machine; type }`, `UnitDetailSheetProps { unit; type; sourceId: SourceID; isOpen; onClose; onAdd? }` — consistent across Tasks 1–4. `handleAddUnit(selectedUnit)` matches existing usage. `selectedSource` is `SourceID` in ArmyBuilder. ✓
