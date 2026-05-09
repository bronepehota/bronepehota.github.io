# Combat Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the combat system into a standalone `/calculator` page where users manually input all combat parameters (range, power, melee, armor) via a Dice Input Popup and numeric fields, without being tied to an ArmyUnit.

**Architecture:** Introduce a `CombatantData` interface as the minimal data contract for combat. Refactor `useCombatFlow` to accept `CombatantData` instead of requiring a full `ArmyUnit`. Create adapter hooks and new UI widgets (DiceInputPopup, RulesSelector, ModifiersSelector) that feed data into the existing combat components (ActionSelector, ParameterInputs, CombatResults).

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React icons, existing combat components.

---

## File Structure

### New Files
- `src/lib/combatant-data.ts` — `CombatantData` interface and utility functions
- `src/components/calculator/DiceInputPopup.tsx` — Dice type/quantity/bonus selector popup
- `src/components/calculator/RulesSelector.tsx` — Rules version toggle (Технолог / Стар Систем)
- `src/components/calculator/ModifiersSelector.tsx` — Catalog + numeric modifier fields
- `src/components/calculator/CalculatorPage.tsx` — Main client component orchestrating everything
- `src/hooks/useStandaloneCombatFlow.ts` — Adapter hook managing CombatantData state
- `src/app/calculator/page.tsx` — Next.js page wrapper

### Modified Files
- `src/hooks/useCombatFlow.ts` — Accept `CombatantData` via adapter, no direct ArmyUnit dependency for combat logic
- `src/components/combat/ParameterInputs.tsx` — Add `onDataNeeded` callback + support for CombatantData stats display
- `src/components/combat/ActionSelector.tsx` — Accept `CombatantData` for capability checks
- `src/app/page.tsx` — Add link to `/calculator` from landing page

---

### Task 1: Create CombatantData Interface

**Files:**
- Create: `src/lib/combatant-data.ts`

- [ ] **Step 1: Create the CombatantData interface file**

```typescript
// src/lib/combatant-data.ts

import type { Weapon } from './types';

/**
 * Minimal data needed to perform combat calculations.
 * In the game, this is derived from ArmyUnit. In the calculator, entered manually.
 */
export interface CombatantData {
  type: 'squad' | 'machine';
  range?: string;          // "D6", "2D12+1" — undefined triggers Dice Input Popup
  power?: string;          // "1D20", "2D6" — undefined triggers Dice Input Popup
  melee: number;           // 0-10
  armor: number;           // 0-10
  rank: number;            // for grenade distance calculation
  weapons?: Weapon[];      // for machines (weapon selection)
  grenadesAvailable: boolean;
}

/**
 * Build a fake ArmyUnit-like object from CombatantData for use with useCombatFlow.
 * useCombatFlow reads unit.data.soldiers[i] and unit.data.weapons[i] — we mimic that shape.
 */
export function combatantToUnitLike(data: CombatantData) {
  if (data.type === 'squad') {
    return {
      instanceId: 'calculator',
      type: 'squad' as const,
      data: {
        name: 'Калькулятор',
        soldiers: [
          {
            rank: data.rank,
            range: data.range || 'D6',
            power: data.power || '1D6',
            melee: data.melee,
            armor: data.armor,
            speed: 0,
            modifiers: [],
          },
        ],
      },
      grenadesUsed: !data.grenadesAvailable,
    };
  }

  return {
    instanceId: 'calculator',
    type: 'machine' as const,
    data: {
      name: 'Калькулятор',
      weapons: data.weapons || [{ name: 'Оружие', range: data.range || 'D6', power: data.power || '1D6' }],
    },
    currentDurability: 10,
    pilotInfo: undefined,
  };
}

/**
 * Check if required combat data is filled for a given action type.
 */
export function isCombatReady(data: CombatantData, actionType: 'shot' | 'melee' | 'grenade'): boolean {
  if (actionType === 'melee') {
    return data.melee >= 0;
  }
  // shot and grenade need range + power
  return Boolean(data.range && data.power);
}

/**
 * Fields missing for a given action type.
 */
export function missingFields(data: CombatantData, actionType: 'shot' | 'melee' | 'grenade'): Array<'range' | 'power' | 'melee' | 'rank'> {
  const missing: Array<'range' | 'power' | 'melee' | 'rank'> = [];
  if (actionType !== 'melee') {
    if (!data.range) missing.push('range');
    if (!data.power) missing.push('power');
  }
  if (actionType === 'grenade' && data.rank <= 0) {
    missing.push('rank');
  }
  return missing;
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS (new file, no imports yet)

- [ ] **Step 3: Commit**

```bash
git add src/lib/combatant-data.ts
git commit -m "feat: add CombatantData interface for standalone calculator"
```

---

### Task 2: Refactor useCombatFlow — Adapter Pattern

**Files:**
- Modify: `src/hooks/useCombatFlow.ts`

The key insight: `useCombatFlow` currently reads from `state.unit` (an ArmyUnit) to get range/power/melee. We add an alternative path where combat stats come from a `CombatantData` object passed at combat start time. The existing `BottomSheetCombatModal` will create this from `ArmyUnit`, so existing game flow is unchanged.

- [ ] **Step 1: Add CombatantData support to useCombatFlow**

In `src/hooks/useCombatFlow.ts`, add a new import and modify `startCombat` to accept an optional `combatantData` parameter. When provided, use it to populate combat stats instead of reading from the unit.

Add at top:
```typescript
import type { CombatantData } from '@/lib/combatant-data';
```

Add a new field to `CombatFlowState` in `src/lib/combat-types.ts`:
```typescript
// In CombatFlowState interface, add:
combatantData?: CombatantData;  // For standalone calculator mode
```

Modify the `START_COMBAT` case in `combatFlowReducer` to store `combatantData`:
```typescript
case 'START_COMBAT':
  return {
    ...initialCombatFlowState,
    phase: action.actionType ? 'PARAMETERS' : 'ACTION_SELECT',
    actionType: action.actionType || null,
    unit: action.unit,
    unitType: action.unit.type,
    soldierIndex: action.soldierIndex ?? null,
    combatantData: action.combatantData,
    parameters: {
      ...initialCombatFlowState.parameters,
      weaponIndex: action.weaponIndex,
    },
  };
```

Update `CombatFlowAction` type:
```typescript
| { type: 'START_COMBAT'; unit: any; soldierIndex?: number; weaponIndex?: number; actionType?: CombatActionType; combatantData?: CombatantData }
```

In `executeShot`, change how range/power are resolved — check for `combatantData` first:
```typescript
// Replace the range/power resolution block in executeShot (lines 232-244):
let range = '';
let power = '';

if (state.combatantData) {
  // Standalone calculator mode
  range = state.combatantData.range || '';
  power = state.combatantData.power || '';
} else if (state.unitType === 'squad' && soldierIndex !== null) {
  const soldier = (unit.data as any).soldiers[soldierIndex];
  range = soldier.range;
  power = soldier.power;
} else if (state.unitType === 'machine' && state.parameters.weaponIndex !== undefined) {
  const weapon = (unit.data as any).weapons[state.parameters.weaponIndex];
  range = weapon.range;
  power = weapon.power;
}
```

In `executeGrenade`, resolve soldier rank from combatantData:
```typescript
// Replace the rank resolution block in executeGrenade (lines 396-399):
let soldierRank = 0;
if (state.combatantData) {
  soldierRank = state.combatantData.rank;
} else if (state.unitType === 'squad' && state.soldierIndex !== null) {
  const soldiers = (state.unit.data as any).soldiers;
  if (soldiers && soldiers[state.soldierIndex]) {
    soldierRank = soldiers[state.soldierIndex].rank || 0;
  }
}
```

In `executeMelee`, resolve melee from combatantData:
```typescript
// Replace the melee resolution block in executeMelee (lines 523-525):
let attackerMelee = 0;
if (state.combatantData) {
  attackerMelee = state.combatantData.melee;
} else if (state.unitType === 'squad' && state.soldierIndex !== null) {
  attackerMelee = (state.unit.data as any).soldiers[state.soldierIndex].melee;
}
```

In the result objects, handle `unitName` and `unitId` when in standalone mode:
```typescript
// In executeShot result (replace lines 367-368):
unitName: state.combatantData ? 'Калькулятор' : unit.data.name,
unitId: state.combatantData ? 'calculator' : unit.instanceId,

// In executeGrenade result (replace lines 460-461):
unitName: state.combatantData ? 'Калькулятор' : state.unit.data.name,
unitId: state.combatantData ? 'calculator' : state.unit.instanceId,

// In executeMelee result (replace lines 568-569):
unitName: state.combatantData ? 'Калькулятор' : state.unit.data.name,
unitId: state.combatantData ? 'calculator' : state.unit.instanceId,
```

Update `startCombat` callback to accept and pass `combatantData`:
```typescript
const startCombat = useCallback((unit: any, soldierIndex?: number, weaponIndex?: number, actionType?: CombatActionType, combatantData?: CombatantData) => {
  dispatch({ type: 'START_COMBAT', unit, soldierIndex, weaponIndex, actionType, combatantData });
}, []);
```

- [ ] **Step 2: Update CombatFlowState in combat-types.ts**

Add `combatantData` field to `CombatFlowState`:
```typescript
combatantData?: any;       // CombatantData for standalone calculator
```

- [ ] **Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Run existing tests**

Run: `npm run test`
Expected: All tests pass (no test changes, existing behavior unchanged)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCombatFlow.ts src/lib/combat-types.ts
git commit -m "refactor: add CombatantData support to useCombatFlow for standalone calculator"
```

---

### Task 3: DiceInputPopup Component

**Files:**
- Create: `src/components/calculator/DiceInputPopup.tsx`

- [ ] **Step 1: Create the DiceInputPopup component**

```tsx
// src/components/calculator/DiceInputPopup.tsx
'use client';

import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiceInputPopupProps {
  title: string;           // "ДАЛЬНОСТЬ" or "МОЩНОСТЬ"
  value?: string;          // Current value like "2D12+2", undefined = empty
  color: 'blue' | 'orange';
  onSubmit: (value: string) => void;
  onClose: () => void;
}

const DICE_TYPES = [
  { sides: 6, label: 'D6' },
  { sides: 12, label: 'D12' },
  { sides: 20, label: 'D20' },
] as const;

const colorConfig = {
  blue: {
    selected: 'border-blue-500 bg-blue-950/60 text-blue-400 shadow-lg shadow-blue-500/20',
    unselected: 'border-slate-600 bg-slate-800/60 text-slate-400 hover:border-blue-500/40',
    preview: 'text-blue-400',
    accent: 'border-blue-500/50',
  },
  orange: {
    selected: 'border-orange-500 bg-orange-950/60 text-orange-400 shadow-lg shadow-orange-500/20',
    unselected: 'border-slate-600 bg-slate-800/60 text-slate-400 hover:border-orange-500/40',
    preview: 'text-orange-400',
    accent: 'border-orange-500/50',
  },
};

export function DiceInputPopup({ title, value, color, onSubmit, onClose }: DiceInputPopupProps) {
  const colors = colorConfig[color];

  // Parse existing value or set defaults
  const parseInitial = () => {
    if (!value) return { sides: 6, count: 1, bonus: 0 };
    const match = value.match(/(?:(\d+))?D(\d+)(?:\+(-?\d+))?/);
    if (!match) return { sides: 6, count: 1, bonus: 0 };
    return {
      sides: parseInt(match[2]),
      count: parseInt(match[1] || '1'),
      bonus: parseInt(match[3] || '0'),
    };
  };

  const initial = parseInitial();
  const [sides, setSides] = useState(initial.sides);
  const [count, setCount] = useState(initial.count);
  const [bonus, setBonus] = useState(initial.bonus);

  const buildNotation = () => {
    const dicePart = count === 1 ? `D${sides}` : `${count}D${sides}`;
    if (bonus > 0) return `${dicePart}+${bonus}`;
    if (bonus < 0) return `${dicePart}${bonus}`;
    return dicePart;
  };

  const handleSubmit = () => {
    onSubmit(buildNotation());
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className={cn(
        "w-full max-w-[400px] bg-slate-900 border-2 rounded-t-xl md:rounded-xl",
        colors.accent,
        "p-4 space-y-4"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={cn("font-mono font-black text-lg uppercase tracking-wider", colors.preview)}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg border border-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Dice Type Selector */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">Тип кубика</div>
          <div className="flex gap-2">
            {DICE_TYPES.map((dt) => (
              <button
                key={dt.sides}
                onClick={() => setSides(dt.sides)}
                className={cn(
                  "flex-1 p-3 rounded-lg border-2 font-mono font-black text-xl text-center transition-all active:scale-95 min-h-[52px]",
                  sides === dt.sides ? colors.selected : colors.unselected
                )}
              >
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count Stepper */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Количество</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount(Math.max(1, count - 1))}
              disabled={count <= 1}
              className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono font-black text-2xl text-white w-8 text-center">{count}</span>
            <button
              onClick={() => setCount(Math.min(5, count + 1))}
              disabled={count >= 5}
              className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bonus Stepper */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Бонус</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBonus(Math.max(-10, bonus - 1))}
              disabled={bonus <= -10}
              className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className={cn(
              "font-mono font-black text-2xl w-12 text-center",
              bonus > 0 ? "text-emerald-400" : bonus < 0 ? "text-red-400" : "text-white"
            )}>
              {bonus > 0 ? `+${bonus}` : bonus}
            </span>
            <button
              onClick={() => setBonus(Math.min(10, bonus + 1))}
              disabled={bonus >= 10}
              className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="text-center py-2">
          <span className={cn("font-mono font-black text-2xl", colors.preview)}>
            {buildNotation()}
          </span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className={cn(
            "w-full py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 transition-all min-h-[48px] active:scale-95",
            colors.selected
          )}
        >
          Подтвердить
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/calculator/DiceInputPopup.tsx
git commit -m "feat: add DiceInputPopup component for standalone calculator"
```

---

### Task 4: RulesSelector Widget

**Files:**
- Create: `src/components/calculator/RulesSelector.tsx`

- [ ] **Step 1: Create the RulesSelector component**

```tsx
// src/components/calculator/RulesSelector.tsx
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { RulesVersionID } from '@/lib/types';

interface RulesSelectorProps {
  value: RulesVersionID;
  onChange: (version: RulesVersionID) => void;
  className?: string;
}

const RULES_OPTIONS: Array<{ id: RulesVersionID; label: string; description: string }> = [
  { id: 'tehnolog', label: 'Технолог', description: 'Официальные правила' },
  { id: 'community_star_system', label: 'Стар Систем', description: 'Фан-правила' },
];

export function RulesSelector({ value, onChange, className }: RulesSelectorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {RULES_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex-1 p-2.5 rounded-lg border-2 text-center transition-all active:scale-95 min-h-[44px]",
            value === opt.id
              ? "border-amber-500 bg-amber-950/40 text-amber-400 shadow-lg shadow-amber-900/20"
              : "border-slate-600 bg-slate-800/60 text-slate-400 hover:border-slate-500"
          )}
        >
          <div className="font-mono font-bold text-xs uppercase tracking-wider">{opt.label}</div>
          <div className="text-[9px] opacity-60 mt-0.5">{opt.description}</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/calculator/RulesSelector.tsx
git commit -m "feat: add RulesSelector widget for calculator"
```

---

### Task 5: ModifiersSelector Widget

**Files:**
- Create: `src/components/calculator/ModifiersSelector.tsx`

- [ ] **Step 1: Create the ModifiersSelector component**

```tsx
// src/components/calculator/ModifiersSelector.tsx
'use client';

import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { getStandardBuffs, getStandardDebuffs } from '@/lib/modifier-utils';
import type { ModifierSummary, ModifierTarget, BuffDefinition, DebuffTemplate } from '@/lib/modifier-types';
import { EMPTY_MODIFIER_SUMMARY } from '@/lib/modifier-types';

interface ModifiersSelectorProps {
  value: ModifierSummary;
  onChange: (summary: ModifierSummary) => void;
  className?: string;
}

const NUMERIC_FIELDS: Array<{ target: ModifierTarget; label: string; key: keyof ModifierSummary }> = [
  { target: 'range_bonus', label: '+Дальность', key: 'rangeBonus' },
  { target: 'power_bonus', label: '+Мощность', key: 'powerBonus' },
  { target: 'melee_bonus', label: '+Ближний бой', key: 'meleeBonus' },
  { target: 'armor_bonus', label: '+Броня', key: 'armorBonus' },
  { target: 'distance_penalty', label: '−Дистанция', key: 'distancePenalty' },
];

export function ModifiersSelector({ value, onChange, className }: ModifiersSelectorProps) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(new Set());

  const allModifiers = useMemo(() => {
    const buffs = getStandardBuffs().filter(b => b.target !== 'speed_multiply' && b.target !== 'custom');
    const debuffs = getStandardDebuffs().filter(d => d.target !== 'speed_multiply' && d.target !== 'custom');
    return [...buffs.map(b => ({ ...b, isBuff: true })), ...debuffs.map(d => ({ ...d, isBuff: false }))];
  }, []);

  const handleNumericChange = (key: keyof ModifierSummary, val: number) => {
    onChange({ ...value, [key]: val });
  };

  const toggleCatalogItem = (id: string, modifier: { target: ModifierTarget; value: number; name: string; isBuff?: boolean }) => {
    const next = new Set(selectedCatalogIds);
    const nextDescs = [...value.descriptions];

    if (next.has(id)) {
      next.delete(id);
      // Remove description
      const idx = nextDescs.findIndex(d => d.includes(modifier.name));
      if (idx >= 0) nextDescs.splice(idx, 1);
      // Reverse the modifier value
      const field = targetToField(modifier.target);
      if (field === 'rangeMultiplier') {
        onChange({ ...value, rangeMultiplier: (value.rangeMultiplier || 1) / (modifier.value || 1), descriptions: nextDescs });
      } else {
        onChange({ ...value, [field]: ((value[field] as number) || 0) - modifier.value, descriptions: nextDescs });
      }
    } else {
      next.add(id);
      nextDescs.push(`${modifier.name}: ${modifier.value > 0 ? '+' : ''}${modifier.value}`);
      const field = targetToField(modifier.target);
      if (field === 'rangeMultiplier') {
        onChange({ ...value, rangeMultiplier: (value.rangeMultiplier || 1) * (modifier.value || 1), descriptions: nextDescs });
      } else {
        onChange({ ...value, [field]: ((value[field] as number) || 0) + modifier.value, descriptions: nextDescs });
      }
    }
    setSelectedCatalogIds(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Модификаторы</div>
        <button
          onClick={() => setShowCatalog(!showCatalog)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all",
            showCatalog
              ? "border-purple-500 bg-purple-950/30 text-purple-400"
              : "border-slate-600 bg-slate-800 text-slate-400"
          )}
        >
          <Plus className="w-3 h-3" />
          Каталог
        </button>
      </div>

      {/* Selected catalog items as chips */}
      {selectedCatalogIds.size > 0 && (
        <div className="flex flex-wrap gap-1">
          {allModifiers
            .filter(m => selectedCatalogIds.has(m.id))
            .map(m => (
              <button
                key={m.id}
                onClick={() => toggleCatalogItem(m.id, m)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border",
                  m.isBuff
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-400"
                    : "border-red-500/40 bg-red-950/30 text-red-400"
                )}
              >
                {m.name}
                <X className="w-3 h-3" />
              </button>
            ))}
        </div>
      )}

      {/* Catalog dropdown */}
      {showCatalog && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg max-h-40 overflow-y-auto custom-scrollbar">
          {allModifiers.map(m => (
            <button
              key={m.id}
              onClick={() => toggleCatalogItem(m.id, m)}
              className={cn(
                "w-full text-left px-3 py-2 text-xs border-b border-slate-700/50 transition-colors",
                selectedCatalogIds.has(m.id)
                  ? "bg-slate-700/50"
                  : "hover:bg-slate-700/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "font-mono font-bold",
                  m.isBuff ? "text-emerald-400" : "text-red-400"
                )}>{m.name}</span>
                <span className="text-slate-500 text-[10px]">{m.value > 0 ? '+' : ''}{m.value}</span>
              </div>
              <div className="text-slate-500 text-[10px] mt-0.5">{m.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Numeric fields */}
      <div className="grid grid-cols-2 gap-2">
        {NUMERIC_FIELDS.map(({ target, label, key }) => (
          <div key={target} className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap min-w-[60px]">{label}</span>
            <NumberStepper
              value={(value[key] as number) || 0}
              onChange={(val) => handleNumericChange(key, val)}
              min={target === 'distance_penalty' ? 0 : -10}
              max={10}
              step={1}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function targetToField(target: ModifierTarget): keyof ModifierSummary {
  switch (target) {
    case 'range_bonus': return 'rangeBonus';
    case 'range_multiply': return 'rangeMultiplier';
    case 'power_bonus': return 'powerBonus';
    case 'melee_bonus': return 'meleeBonus';
    case 'armor_bonus': return 'armorBonus';
    case 'distance_penalty': return 'distancePenalty';
    default: return 'descriptions';
  }
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS (may need minor type fixes)

- [ ] **Step 3: Commit**

```bash
git add src/components/calculator/ModifiersSelector.tsx
git commit -m "feat: add ModifiersSelector widget for calculator"
```

---

### Task 6: useStandaloneCombatFlow Adapter Hook

**Files:**
- Create: `src/hooks/useStandaloneCombatFlow.ts`

- [ ] **Step 1: Create the adapter hook**

```typescript
// src/hooks/useStandaloneCombatFlow.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCombatFlow } from './useCombatFlow';
import type { CombatantData } from '@/lib/combatant-data';
import { combatantToUnitLike } from '@/lib/combatant-data';
import type { RulesVersionID } from '@/lib/types';
import type { ModifierSummary } from '@/lib/modifier-types';
import type { CombatActionType, CombatParameters } from '@/lib/combat-types';

const DEFAULT_COMBATANT: CombatantData = {
  type: 'squad',
  melee: 0,
  armor: 0,
  rank: 0,
  grenadesAvailable: true,
};

export function useStandaloneCombatFlow() {
  const combatFlow = useCombatFlow();
  const [combatantData, setCombatantData] = useState<CombatantData>(DEFAULT_COMBATANT);
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>('tehnolog');
  const [modifierSummary, setModifierSummary] = useState<ModifierSummary>({
    rangeBonus: 0,
    rangeMultiplier: 1,
    powerBonus: 0,
    meleeBonus: 0,
    speedMultiplier: 1,
    armorBonus: 0,
    distancePenalty: 0,
    descriptions: [],
  });

  // Load rules version from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_calculator_rules');
    if (saved === 'community_star_system' || saved === 'tehnolog') {
      setRulesVersion(saved);
    }
  }, []);

  // Save rules version to localStorage
  const updateRulesVersion = useCallback((version: RulesVersionID) => {
    setRulesVersion(version);
    localStorage.setItem('bronepehota_calculator_rules', version);
  }, []);

  const startStandaloneCombat = useCallback((actionType?: CombatActionType) => {
    const unitLike = combatantToUnitLike(combatantData);
    combatFlow.startCombat(unitLike, 0, undefined, actionType, combatantData);
  }, [combatantData, combatFlow]);

  const setParameters = useCallback((params: Partial<CombatParameters>) => {
    // Inject modifier summary when setting parameters
    if (Object.keys(params).length === 0 || !params.activeModifiers) {
      combatFlow.setParameters({ ...params, activeModifiers: modifierSummary });
    } else {
      combatFlow.setParameters(params);
    }
  }, [combatFlow, modifierSummary]);

  // Update combatant data field
  const updateCombatantField = useCallback(<K extends keyof CombatantData>(field: K, value: CombatantData[K]) => {
    setCombatantData(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    // Combat flow (passthrough)
    combatState: combatFlow.state,
    selectAction: combatFlow.selectAction,
    setParameters,
    executeAction: combatFlow.executeAction,
    applyResult: combatFlow.applyResult,
    closeCombat: combatFlow.closeCombat,
    goBack: combatFlow.goBack,
    checkGrenadeTarget: combatFlow.checkGrenadeTarget,
    isOpen: combatFlow.isOpen,

    // Standalone state
    combatantData,
    updateCombatantField,
    setCombatantData,
    rulesVersion,
    updateRulesVersion,
    modifierSummary,
    setModifierSummary,
    startStandaloneCombat,
  };
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useStandaloneCombatFlow.ts
git commit -m "feat: add useStandaloneCombatFlow adapter hook"
```

---

### Task 7: Refactor ParameterInputs for Calculator Mode

**Files:**
- Modify: `src/components/combat/ParameterInputs.tsx`

Add optional `onDataNeeded` callback and support for displaying combat stats when no `unit` is provided but `combatantData` is available.

- [ ] **Step 1: Add onDataNeeded prop and combatantData support to ParameterInputs**

In `src/components/combat/ParameterInputs.tsx`, add to the interface:
```typescript
import type { CombatantData } from '@/lib/combatant-data';

// Add to ParameterInputsProps:
onDataNeeded?: (field: 'range' | 'power') => void;
combatantData?: CombatantData;
```

Update the function signature to destructure new props:
```typescript
export function ParameterInputs({
  // ... existing props
  onDataNeeded,
  combatantData,
}: ParameterInputsProps) {
```

Replace the `getUnitStats` call to also check combatantData:
```typescript
// Replace: const unitStats = unit ? getUnitStats(unit, soldierIndex, parameters.weaponIndex) : null;
const unitStats = unit
  ? getUnitStats(unit, soldierIndex, parameters.weaponIndex)
  : combatantData
    ? { range: combatantData.range || '', power: combatantData.power || '', melee: combatantData.melee, displayName: 'Боец' }
    : null;
```

In `renderShotGrenadeStats`, when `unitStats` exists but range/power are empty, show tappable placeholders:
```typescript
// Inside the Range Card div, after "Дальность" label, add:
{!unitStats?.range && onDataNeeded ? (
  <button
    onClick={() => onDataNeeded('range')}
    className="px-3 py-1 rounded border-2 border-dashed border-blue-500/40 text-blue-400/60 text-xs font-mono hover:border-blue-500/70 hover:text-blue-400 transition-all min-h-[44px] flex items-center justify-center"
  >
    Нажмите для ввода
  </button>
) : (
  <DiceNotationDisplay rollStr={effectiveRange} color="blue" />
)}

// Inside the Power Card div, after "Мощность" label, add:
{!unitStats?.power && onDataNeeded ? (
  <button
    onClick={() => onDataNeeded('power')}
    className="px-3 py-1 rounded border-2 border-dashed border-orange-500/40 text-orange-400/60 text-xs font-mono hover:border-orange-500/70 hover:text-orange-400 transition-all min-h-[44px] flex items-center justify-center"
  >
    Нажмите для ввода
  </button>
) : (
  <DiceNotationDisplay rollStr={unitStats.power} color="orange" />
)}
```

In `renderMeleeStats`, when `unitStats` is null but `combatantData` exists, use combatantData.melee:
```typescript
// Replace: if (!unitStats) return null;
if (!unitStats && !combatantData) return null;
const meleeValue = unitStats?.melee ?? combatantData?.melee ?? 0;
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/combat/ParameterInputs.tsx
git commit -m "refactor: add onDataNeeded callback and combatantData support to ParameterInputs"
```

---

### Task 8: Refactor ActionSelector for Calculator Mode

**Files:**
- Modify: `src/components/combat/ActionSelector.tsx`

The `ActionSelector` currently checks `canSoldierShoot(unit, soldierIndex)` which requires an `ArmyUnit`. Add a `combatantData` prop as alternative.

- [ ] **Step 1: Add combatantData prop to ActionSelector**

In `src/components/combat/ActionSelector.tsx`, update the interface:
```typescript
import type { CombatantData } from '@/lib/combatant-data';

interface ActionSelectorProps {
  onSelect: (action: CombatActionType) => void;
  grenadesAvailable?: boolean;
  className?: string;
  unit?: ArmyUnit;
  soldierIndex?: number | null;
  combatantData?: CombatantData;
}
```

Update the component to use combatantData when unit is not available:
```typescript
export function ActionSelector({
  onSelect,
  grenadesAvailable = true,
  className,
  unit,
  soldierIndex,
  combatantData,
}: ActionSelectorProps) {
  // Use unit-based checks OR combatantData-based checks
  const canShoot = unit
    ? canSoldierShoot(unit, soldierIndex)
    : combatantData
      ? Boolean(combatantData.range && combatantData.range !== '0' && combatantData.range !== 'ББ')
      : true;
  const canMelee = unit
    ? canSoldierMelee(unit, soldierIndex)
    : true; // Everyone can melee in calculator
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/combat/ActionSelector.tsx
git commit -m "refactor: add combatantData support to ActionSelector"
```

---

### Task 9: CalculatorPage Component

**Files:**
- Create: `src/components/calculator/CalculatorPage.tsx`

This is the main orchestrator. It composes RulesSelector + ModifiersSelector + existing combat components.

- [ ] **Step 1: Create the CalculatorPage component**

```tsx
// src/components/calculator/CalculatorPage.tsx
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStandaloneCombatFlow } from '@/hooks/useStandaloneCombatFlow';
import { ActionSelector } from '@/components/combat/ActionSelector';
import { ParameterInputs } from '@/components/combat/ParameterInputs';
import { CombatResults } from '@/components/combat/CombatResults';
import { RulesSelector } from './RulesSelector';
import { ModifiersSelector } from './ModifiersSelector';
import { DiceInputPopup } from './DiceInputPopup';
import { NumberStepper } from '@/components/ui/NumberStepper';
import type { CombatantData } from '@/lib/combatant-data';

export function CalculatorPage() {
  const {
    combatState,
    selectAction,
    setParameters,
    executeAction,
    applyResult,
    goBack,
    checkGrenadeTarget,
    combatantData,
    updateCombatantField,
    rulesVersion,
    updateRulesVersion,
    modifierSummary,
    setModifierSummary,
    startStandaloneCombat,
  } = useStandaloneCombatFlow();

  const [dicePopupField, setDicePopupField] = useState<'range' | 'power' | null>(null);

  const handleDataNeeded = useCallback((field: 'range' | 'power') => {
    setDicePopupField(field);
  }, []);

  const handleDiceSubmit = useCallback((value: string) => {
    if (dicePopupField === 'range') {
      updateCombatantField('range', value);
    } else if (dicePopupField === 'power') {
      updateCombatantField('power', value);
    }
    setDicePopupField(null);
  }, [dicePopupField, updateCombatantField]);

  // Start combat on mount
  const handleStart = useCallback(() => {
    startStandaloneCombat();
  }, [startStandaloneCombat]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <Link
          href="/"
          className="p-2 hover:bg-slate-800 rounded-lg border border-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <h1 className="font-mono font-black text-lg uppercase tracking-wider text-slate-300">
          Калькулятор боя
        </h1>
      </div>

      <div className="max-w-[600px] mx-auto p-4 space-y-4">
        {/* Rules Selector */}
        <RulesSelector value={rulesVersion} onChange={updateRulesVersion} />

        {/* Modifiers Selector */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50">
          <ModifiersSelector value={modifierSummary} onChange={setModifierSummary} />
        </div>

        {/* Combat Flow */}
        {!combatState.isOpen ? (
          <div className="space-y-4">
            {/* Unit type selector */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Тип юнита</div>
              <div className="flex gap-2">
                {(['squad', 'machine'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => updateCombatantField('type', t)}
                    className={cn(
                      "flex-1 p-2.5 rounded-lg border-2 text-center font-mono text-xs uppercase tracking-wider transition-all min-h-[44px]",
                      combatantData.type === t
                        ? "border-cyan-500 bg-cyan-950/40 text-cyan-400"
                        : "border-slate-600 bg-slate-800/60 text-slate-400"
                    )}
                  >
                    {t === 'squad' ? 'Пехота' : 'Техника'}
                  </button>
                ))}
              </div>
            </div>

            {/* Combat stats inputs */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Параметры бойца</div>

              {/* Range - tappable for Dice Input */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Дальность</span>
                <button
                  onClick={() => setDicePopupField('range')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border-2 font-mono font-bold transition-all min-h-[44px] flex items-center",
                    combatantData.range
                      ? "border-blue-500/50 bg-blue-950/30 text-blue-400"
                      : "border-dashed border-slate-600 text-slate-500 hover:border-blue-500/40"
                  )}
                >
                  {combatantData.range || 'Нажмите'}
                </button>
              </div>

              {/* Power - tappable for Dice Input */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Мощность</span>
                <button
                  onClick={() => setDicePopupField('power')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border-2 font-mono font-bold transition-all min-h-[44px] flex items-center",
                    combatantData.power
                      ? "border-orange-500/50 bg-orange-950/30 text-orange-400"
                      : "border-dashed border-slate-600 text-slate-500 hover:border-orange-500/40"
                  )}
                >
                  {combatantData.power || 'Нажмите'}
                </button>
              </div>

              {/* Melee */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Ближний бой</span>
                <NumberStepper
                  value={combatantData.melee}
                  onChange={(v) => updateCombatantField('melee', v)}
                  min={0}
                  max={10}
                  step={1}
                  size="sm"
                />
              </div>

              {/* Armor */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Броня</span>
                <NumberStepper
                  value={combatantData.armor}
                  onChange={(v) => updateCombatantField('armor', v)}
                  min={0}
                  max={10}
                  step={1}
                  size="sm"
                />
              </div>

              {/* Rank (for grenades) */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Ранг</span>
                <NumberStepper
                  value={combatantData.rank}
                  onChange={(v) => updateCombatantField('rank', v)}
                  min={0}
                  max={10}
                  step={1}
                  size="sm"
                />
              </div>

              {/* Grenades toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Гранаты</span>
                <button
                  onClick={() => updateCombatantField('grenadesAvailable', !combatantData.grenadesAvailable)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border-2 font-mono text-xs transition-all min-h-[44px]",
                    combatantData.grenadesAvailable
                      ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-400"
                      : "border-slate-600 bg-slate-800/60 text-slate-500"
                  )}
                >
                  {combatantData.grenadesAvailable ? 'Да' : 'Нет'}
                </button>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              className="w-full py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 transition-all min-h-[48px] active:scale-95"
            >
              Начать расчёт
            </button>
          </div>
        ) : (
          /* Combat flow phases */
          <div className="space-y-3">
            {combatState.phase === 'ACTION_SELECT' && (
              <ActionSelector
                onSelect={selectAction}
                grenadesAvailable={combatantData.grenadesAvailable}
                combatantData={combatantData}
              />
            )}

            {combatState.phase === 'PARAMETERS' && (
              <div className="space-y-3">
                <ParameterInputs
                  actionType={combatState.actionType!}
                  parameters={combatState.parameters}
                  onChange={setParameters}
                  rulesVersion={rulesVersion}
                  combatantData={combatantData}
                  onDataNeeded={handleDataNeeded}
                  isAimedShot={combatState.parameters.isAimedShot}
                  modifierSummary={modifierSummary}
                />

                {/* Execute button */}
                <div className="flex gap-2">
                  <button
                    onClick={goBack}
                    className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 font-mono text-xs min-h-[44px]"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => executeAction()}
                    className="flex-1 py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 transition-all min-h-[48px] active:scale-95"
                  >
                    {combatState.actionType === 'shot' ? 'ВЫСТРЕЛИТЬ' :
                     combatState.actionType === 'melee' ? 'АТАКОВАТЬ' : 'БРОСИТЬ'}
                  </button>
                </div>
              </div>
            )}

            {combatState.phase === 'RESULTS' && combatState.result && (
              <CombatResults
                result={combatState.result}
                parameters={combatState.parameters}
                rulesVersion={rulesVersion}
                onApply={() => applyResult()}
                onGoBack={goBack}
                unitType={combatState.unitType}
                onGrenadeCheckTarget={checkGrenadeTarget}
              />
            )}

            {combatState.phase === 'APPLY' && (
              <div className="text-center py-8 space-y-4">
                <div className="text-slate-400 font-mono text-sm">Результат принят</div>
                <button
                  onClick={handleStart}
                  className="px-6 py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 transition-all min-h-[48px] active:scale-95"
                >
                  Новый расчёт
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dice Input Popup */}
      {dicePopupField && (
        <DiceInputPopup
          title={dicePopupField === 'range' ? 'ДАЛЬНОСТЬ' : 'МОЩНОСТЬ'}
          value={dicePopupField === 'range' ? combatantData.range : combatantData.power}
          color={dicePopupField === 'range' ? 'blue' : 'orange'}
          onSubmit={handleDiceSubmit}
          onClose={() => setDicePopupField(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS (may need minor type fixes for unused imports)

- [ ] **Step 3: Commit**

```bash
git add src/components/calculator/CalculatorPage.tsx
git commit -m "feat: add CalculatorPage component orchestrating combat flow"
```

---

### Task 10: Next.js Page Route

**Files:**
- Create: `src/app/calculator/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create the calculator page route**

```tsx
// src/app/calculator/page.tsx
import { CalculatorPage } from '@/components/calculator/CalculatorPage';

export const metadata = {
  title: 'Калькулятор боя — Бронепехота',
  description: 'Рассчитайте исход боя: выстрел, ближний бой, граната',
};

export default function Calculator() {
  return <CalculatorPage />;
}
```

- [ ] **Step 2: Add link to calculator from landing page**

In `src/app/page.tsx`, add a link to `/calculator` in the "ПОМОЧЬ ПРОЕКТУ" section (after the GitHub/VK links), or add it as a new CTA. Add after the existing GitHub/VK buttons in the help section:

```tsx
{/* After the VK link button, add: */}
<Link
  href="/calculator"
  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-amber-400/40 hover:border-amber-400 text-amber-400 font-russo text-xs uppercase tracking-wider transition-all hover:bg-amber-400/10"
>
  Калькулятор боя
</Link>
```

Add the Link import if not present:
```typescript
import Link from 'next/link';
```

- [ ] **Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/calculator/page.tsx src/app/page.tsx
git commit -m "feat: add /calculator route and landing page link"
```

---

### Task 11: Verification & Polish

- [ ] **Step 1: Run full validation**

Run: `npm run validate`
Expected: type-check + lint + tests all pass

- [ ] **Step 2: Run dev server and test manually**

Run: `npm run dev`

Test flow:
1. Navigate to `/calculator`
2. Verify rules selector shows Технолог / Стар Систем
3. Set range via Dice Input Popup (tap "Нажмите" → select D12 → confirm)
4. Set power via Dice Input Popup
5. Set melee, armor, rank
6. Click "Начать расчёт"
7. Select action (shot/melee/grenade)
8. Verify ParameterInputs shows correct stats from manual input
9. Click execute — verify dice results display
10. Verify "Новый расчёт" resets to input form

- [ ] **Step 3: Test game session regression**

Navigate to `/app`, go through setup flow, start battle, trigger combat modal. Verify existing combat flow still works correctly (no regression from CombatantData changes).

- [ ] **Step 4: Run E2E tests**

Run: `npm run test:e2e`
Expected: All existing E2E tests pass

- [ ] **Step 5: Run production build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: verification and polish for calculator feature"
```
