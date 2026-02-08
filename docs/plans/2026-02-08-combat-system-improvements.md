# Combat System Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the combat system with target parameter memory, distance conversion (cm ↔ steps), increased armor limit (99), and proper action availability after unit turn completion.

**Architecture:**
- **CombatTargetContext**: React context for storing and sharing target parameters (distance, armor, melee) across all units in the army until turn completion
- **DistanceConverter**: Dual-input component with bidirectional synchronization between centimeters and steps, using rules-specific conversion factor (4cm/step for fan, 5cm/step for tehnolog)
- **Parameter modifications**: Update existing component to use new distance converter and increase armor limit
- **UnitCard logic updates**: Disable only combat actions when unit is done, keep status actions (KIA, damage) always active, remove auto-collapse behavior

**Tech Stack:**
- React Context API for state management
- TypeScript for type safety
- Tailwind CSS for styling (MOBILE FIRST)
- Lucide React icons
- Existing NumberStepper component for numeric input

---

## Task 1: Create CombatTargetContext for parameter memory

**Files:**
- Create: `src/contexts/CombatTargetContext.tsx`

**Step 1: Write the CombatTargetContext implementation**

```typescript
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Тип для памяти параметров цели
export interface TargetMemory {
  distance: number | null;
  targetArmor: number | null;
  targetMelee: number | null;
  lastUpdateTimestamp: number;
  isDirty: boolean;  // True if values were set this turn
}

// Тип контекста
interface CombatTargetContextType {
  targetMemory: TargetMemory;
  updateTargetMemory: (params: Partial<TargetMemory>) => void;
  resetTargetMemory: () => void;
  isMemoryDirty: boolean;
}

// Создание контекста с дефолтными значениями
const CombatTargetContext = createContext<CombatTargetContextType | undefined>(undefined);

// Hook для использования контекста
export function useCombatTargetContext(): CombatTargetContextContextType {
  const context = useContext(CombatTargetContext);
  if (!context) {
    throw new Error('useCombatTargetContext must be used within CombatTargetProvider');
  }
  return context;
}

// Provider компонент
interface CombatTargetProviderProps {
  children: ReactNode;
}

export function CombatTargetProvider({ children }: CombatTargetProviderProps) {
  const [targetMemory, setTargetMemory] = useState<TargetMemory>({
    distance: null,
    targetArmor: null,
    targetMelee: null,
    lastUpdateTimestamp: 0,
    isDirty: false,
  });

  // Обновление памяти параметров цели
  const updateTargetMemory = (params: Partial<TargetMemory>) => {
    setTargetMemory((prev) => ({
      ...prev,
      ...params,
      lastUpdateTimestamp: Date.now(),
      isDirty: true,
    }));
  };

  // Сброс памяти (начало нового тура)
  const resetTargetMemory = () => {
    setTargetMemory({
      distance: null,
      targetArmor: null,
      targetMelee: null,
      lastUpdateTimestamp: 0,
      isDirty: false,
    });
  };

  // Проверка, была ли память обновлена в этом ходу
  const isMemoryDirty = targetMemory.isDirty;

  const contextValue: CombatTargetContextType = {
    targetMemory,
    updateTargetMemory,
    resetTargetMemory,
    isMemoryDirty,
  };

  return (
    <CombatTargetContext.Provider value={contextValue}>
      {children}
    </CombatTargetContext.Provider>
  );
}
```

**Step 2: Commit context creation**

```bash
git add src/contexts/CombatTargetContext.tsx
git commit -m "feat: add CombatTargetContext for target parameter memory"
```

---

## Task 2: Wrap app with CombatTargetProvider

**Files:**
- Modify: `src/app/page.tsx`

**Step orten: Locate the root div in page.tsx and wrap it with provider**

Run: `head -50 src/app/page.tsx`
Expected: Output showing the component structure

**Step 2: Add CombatTargetProvider import at top of page.tsx**

Add this import line after existing imports:
```typescript
import { CombatTargetProvider } from '@/contexts/CombatTargetContext';
```

**Step 3: Wrap the root component return with provider**

Find the main return statement and wrap it with `<CombatTargetProvider>`:
```typescript
return (
  <CombatTargetProvider>
    {/* existing return content */}
  </CombatTargetProvider>
);
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 5: Commit provider integration**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate CombatTargetProvider in app"
```

---

## Task 3: Create DistanceConverter component

**Files:**
- Create: `src/components/combat/DistanceConverter.tsx`

**Step 1: Write the DistanceConverter component**

```typescript
'use client';

import { useState } from 'react';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { RulesVersionID } from '@/lib/types';
import { ArrowLeftRight, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistanceConverterProps {
  steps: number;
  onChange: (steps: number) => void;
  rulesVersion: RulesVersionID;
  className?: string;
  disabled?: boolean;
}

// Получить коэффициент конвертации на основе версии правил
function getConversionFactor(rulesVersion: RulesVersionID): number {
  return rulesVersion === 'fan' ? 4 : 5;  // fan: 4cm/step, tehnolog: 5cm/step
}

// Конвертировать шаги в сантиметры
function stepsToCm(steps: number, rulesVersion: RulesVersionID): number {
  return steps * getConversionFactor(rulesVersion);
}

// Конвертировать сантиметры в шаги
function cmToSteps(cm: number, rulesVersion: RulesVersionID): number {
  return Math.round(cm / getConversionFactor(rulesVersion));
}

export function DistanceConverter({
  steps,
  onChange,
  rulesVersion,
  className,
  disabled = false,
}: DistanceConverterPropsProps) {
  const [cmValue, setCmValue] = useState(stepsToCm(steps, rulesVersion));
  const [focusedField, setFocusedField] = useState<'steps' | 'cm'>('steps');

  const conversionFactor = getConversionFactor(rules从一开始(rulesVersion);

  // Обработка изменения шагов
  const whiskHandleStepsChange = (newSteps: number) => {
    onChange(newSteps);
    setCmValue(stepsToCm(newSteps, rulesVersion));
  };

  // Обработка изменения сантиметров
  const whiskHandleCmChange = (newCm: number) => {
    const newSteps = cmToSteps(newCm, rulesVersion);
    onChange(newSteps);
    setCmValue(newCm);
  };

  // Сброс см значения при изменении steps из вне
  useState(() => {
    setCmValue(stepsToCm(steps, rulesVersion));
  }, [steps, rulesVersion]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Steps Input */}
      <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
        <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap">
          Дистанция
        </label>
        <div className="flex items-center gap-2">
          <NumberStepper
            value={steps}
            onChange={handleStepsChange}
            min={1}
            max={99}
            step={1}
            size="lg"
            disabled={disabled}
            className={cn(
              "flex-1",
              focusedField === 'steps' && "border-2 border-amber-500"
            )}
            label=""
          />
          <span className="text-xs opacity-50 font-mono whitespace-nowrap">
            шагов
          </span>
          <button
            onClick={() => setFocusedField('steps')}
            className={cn(
              "p-1.5 rounded-lg border border-slate-600 transition-all",
              "min-w-[44px] min-h-[44px] flex items-center justify-center",
              focusedField === 'steps'
                ? "bg-amber-950/30 text-amber-400"
                : "bg-slate-800 text-slate-500 hover:bg-slate-700"
            )}
            aria-label="Выбрать поле шагов"
          >
            <Ruler className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Centimeters Input */}
      <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
        <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap">
          Расстояние
        </label>
        <div className="flex items-center gap-2">
          <NumberStepper
            value={cmValue}
            onChange={handleCmChange}
            min={4}
            max={495}  // 99 steps * 5cm max
            step={1}
            size="lg"
            disabled={disabled}
            className={cn(
              "flex-1",
              focusedField === 'cm' && "border-2 border-amber-500"
            )}
            label=""
          />
          <span className="text-xs opacity-50 font-mono whitespace-nowrap">
            см
          </span>
          <button
            onClick={() => setFocusedField('cm')}
            className={cn(
              "p-1.5 rounded-lg border border-slate-600 transition-all",
              "min-w-[44px] min-h-[44px] flex items-center justify-center",
              focusedField === 'cm'
                ? "bg-amber-950/30 text-amber-400"
                : "bg-slate-800 text-slate-500 hover:bg-slate-700"
            )}
            aria-label="Выбрать поле сантиметров"
          >
            <Ruler className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversion indicator */}
      <div className="flex items-center justify-center gap-2 text-[10px] opacity-40 font-mono">
        <span>1 шаг = {conversionFactor} см</span>
      </div>
    </div>
  );
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 3: Commit DistanceConverter component**

```bash
git add src/components/combat/DistanceConverter.tsx
git commit -m "feat: add DistanceConverter with bidirectional cm↔steps sync"
```

---

## Task 4: Update ParameterInputs to use DistanceConverter and combat target context

**Files:**
- Modify: `src/components/combat/ParameterInputs.tsx`

**Step 1: Add imports to ParameterInputs.tsx**

Add after line 11:
```typescript
import { useCombatTargetContext, TargetMemory } from '@/contexts/CombatTargetContext';
import { DistanceConverter } from './DistanceConverter';
import { RotateCcw } from 'lucide-react';
```

**Step 2: Modify function signature to accept target memory**

Replace the function definition (around line 23) with:
```typescript
export function ParameterInputs({
  actionType,
  parameters,
  onChange,
  rulesVersion,
  className,
  unit,
  soldierIndex,
  targetMemory,  // Add this new prop
  onMemoryUpdate,  // Add this new prop
}: ParameterInputsProps) {
```

**Step 3: Update ParameterInputsProps interface**

Add the new props to the interface (around line 13):
```typescript
interface ParameterInputsProps {
  actionType: CombatActionType;
  parameters: CombatParameters;
  onChange: (params: Partial<CombatParameters>) => void;
  rulesVersion: RulesVersionID;
  className?: string;
  unit?: any;
  soldierIndex?: number | null;
  targetMemory?: TargetMemory;  // Add this line
  onMemoryUpdate?: (params: Partial<TargetMemory>) => void;  // Add this line
}
```

**Step 4: Add hook to load memory values**

Add after line 31:
```typescript
// Check if we should load values from memory (only if not manually changed)
const useMemoryValue = (
  currentValue: number | null,
  memoryValue: number | null,
  isDirty: boolean
): number => {
  // Use memory value if available and memory is dirty (was set this turn)
  if (memoryValue !== null && isDirty && currentValue === 1) {
    return memoryValue;
  }
  return currentValue ?? 1;  // Default to 1
};

const effectiveDistance = useMemoryValue(
  parameters.distance,
  targetMemory?.distance ?? null,
  targetMemory?.isDirty ?? false
);
const effectiveTargetArmor = useMemoryValue(
  parameters.targetArmor,
  targetMemory?.targetArmor ?? null,
  targetMemory?.isDirty ?? false
);
const effectiveTargetMelee = useMemoryValue(
  parameters.targetMelee,
  targetMemory?.targetMelee ?? null,
  targetMemory?.isDirty ?? false
);
```

**Step 5: Replace distance input with DistanceConverter**

Replace the distance input section (lines 142-158) with:
```typescript
{/* Distance Input with Converter */}
{(actionType === 'shot' || actionType === 'grenade') && (
  <div className="space-y-2">
    {/* Memory indicator */}
    {targetMemory?.isDirty && targetMemory?.distance === parameters.distance && (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-900/20 border border-green-700/30 rounded text-[10px] text-green-400">
        <RotateCcw className="w-3 h-3" />
        <span>Загружено из памяти</span>
      </div>
    )}

    <DistanceConverter
      steps={effectiveDistance}
      onChange={(steps) => {
        onChange({ distance: steps });
        onMemoryUpdate?.({ distance: steps });
      }}
      rulesVersion={rulesVersion}
    />
  </div>
)}
```

**Step 6: Update armor input with memory and new limit**

Replace the armor input section (lines 160-176) with:
```typescript
{/* Target Armor Input */}
{(actionType === 'shot' ||  === 'grenade') && (
  <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
    <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap">
      Броня цели
    </label>
    <div className="flex items-center gap-2">
      {targetMemory?.isDirty && targetMemory?.targetArmor === parameters.targetArmor && (
        <div className="px-2 py-1 bg-green-900/20 border border-green-700/30 rounded text-[10px] text-green-400">
          <RotateCcw className="w-3 h-3 inline mr-1" />
          <span>Память</span>
        </div>
      )}
      <NumberStepper
        value={effectiveTargetArmor}
        onChange={(value) => {
          onChange({ targetArmor: value });
          onMemoryUpdate?.({ targetArmor: value });
        }}
        min={0}
        max={99}  // Changed from 10
        step={1}
        size="lg"
        className="flex-1 justify-start"
      />
    </div>
  </div>
)}
```

**Step 7: Update melee input with memory and new limit**

Replace the melee input section (lines 178-194) with:
```typescript
{/* Target Melee Input (for melee attacks) */}
{actionType === 'melee' && (
  <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
    <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap">
      ББ цели
    </label>
    <div className="flex items-center gap-2">
      {targetMemory?.isDirty && targetMemory?.targetMelee === parameters.targetMelee && (
        <div className="px-2 py-1 bg-green-900/20 border border-green-700/30 rounded text-[10px] text-green-400">
          <RotateCcw className="w-3 h-3 inline mr-1" />
          <span>Память</span>
        </div>
      )}
      <NumberStepper
        value={effectiveTargetMelee}
        onChange={(value) => {
          onChange({ targetMelee: value });
          onMemoryUpdate?.({ targetMelee: value });
        }}
        min={0}
        max={99}  // Changed from 10
        step={1}
        size="lg"
        className="flex-1 justify-start"
      />
    </div>
  </div>
)}
```

**Step 8: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 9: Commit ParameterInputs updates**

```bash
git add src/components/combat/ParameterInputs.tsx
git commit -m "feat: integrate DistanceConverter and target memory in ParameterInputs"
```

---

## Task 5: Update BottomSheetCombatModal to pass context props

**Files:**
- Modify: `src/components/combat/BottomSheetCombatModal.tsx`

**Step 1: Add combat target context import**

Add after line 12:
```typescript
import { useCombatTargetContext } from '@/contexts/CombatTargetContext';
```

**Step 2: Add context hooks inside component**

Add after line 78:
```typescript
  const { targetMemory, updateTargetMemory } = useCombatTargetContext();
```

**Step 3: Pass context props to ParameterInputs**

Replace the ParameterInputs call (around line 174) with:
```typescript
<ParameterInputs
  actionType={state.actionType!}
  parameters={state.parameters}
  onChange={onSetParameters}
  rulesVersion={rulesVersion}
  unit={state.unit}
  soldierIndex={state.soldierIndex}
  targetMemory={targetMemory}
  onMemoryUpdate={updateTargetMemory}
/>
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 5: Commit BottomSheetCombatModal updates**

```bash
git add src/components/combat/BottomSheetCombatModal.tsx
git commit -m "feat: pass target context props to ParameterInputs"
```

---

## Task 6: Update UnitCard to disable DONE buttons when done and remove auto-collapse

**Files:**
- Modify: `src/components/UnitCard.tsx`

**Step 1: Disable DONE button when soldier is done**

Find the DONE button for soldier (around line 731) and add `disabled` prop:
```typescript
<button
  onClick={() => !isDead && toggleAction(idx, 'done')}
  disabled={isDone || isDead}  // Add isDone check
  className={cn(
    "relative p-1.5 md:p-2 rounded-sm transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border-2 overflow-hidden",
    isDone ? "bg-emerald-950/30 border-emerald-700/50 text-emerald-400" : "bg-slate-900/60 border-slate-700 text-slate-500 hover:bg-slate-800/60"
  )}
  title="Завершить ход бойца"
>
```

**Step 2: Remove disabled from KIA button**

Find the KIA button for soldier (around line 749) and ensure it's only disabled for `isDead`:
```typescript
<button
  onClick={() => toggleDead(idx)}
  disabled={isDead}  // Only disable if already dead
  className={cn(...)}
>
```

**Step 3: Remove auto-collapse logic for done units**

Find the `isCollapsed` variable definition (around line 86) and replace with:
```typescript
// Only manual collapse, no auto-collapse for done units
const isCollapsed = isManualCollapsed;
```

**Step 4: Disable machine DONE button when done**

Find the machine DONE button (around line 1262) and add `disabled` prop:
```typescript
<button
  onClick={() => {
    if (isMachineDestroyed) return;
    if (unit.isMachineDone) {
      // Untoggling done - reset all actions to return to active state
      updateUnit({
        ...unit,
        isMachineMoved: false,
        isMachineShot: false,
        isMachineMelee: false,
        isMachineDone: false
      });
    } else {
      updateUnit({ ...unit, isMachineDone: true });
    }
  }}
  disabled={isMachineDestroyed || isMachineDone}  // Add isMachineDone check
  className={cn(
    ...
  )}
>
```

**Step 5: Remove disabled from damage/repair buttons**

Find the durability damage button (around line 856) and repair button (around line 875) and ensure they are only disabled by their logical conditions (not by `isMachineDone`):
```typescript
// Damage button - only disabled if durability is 0
<button
  onClick={() => updateMachineStat('durability', -1)}
  disabled={unit.currentDurability === 0}
  ...
/>

// Repair button - only disabled if at max durability
<button
  onClick={() => updateMachineStat('durability', 1)}
  disabled={unit.currentDurability === (data as Machine).durability_max}
  ...
/>
```

**Step 6: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 7: Commit UnitCard button logic changes**

```bash
git add src/components/UnitCard.tsx
git commit -m "feat: disable DONE when done, remove auto-collapse, keep status actions active"
```

---

## Task 7: Add turn reset logic to GameSession component

**Files:**
- Modify: `src/components/GameSession.tsx`

**Step 1: Locate GameSession component**

Run: `head -100 src/components/GameSession.tsx`
Expected: Output showing component structure

**Step 2: Add context import**

Add at top of file:
```typescript
import { useCombatTargetContext } from '@/contexts/CombatTargetContext';
```

**Step 3: Find component function and add reset logic**

Find the component function and add context reset logic. Look for where you manage army state.

Add reset function at component level:
```typescript
  const { resetTargetMemory } = useCombatTargetContext();

  // Reset target memory when all units are marked as done (new turn)
  useEffect(() => {
    const allUnitsDone = army.units.every(unit => {
      if (unit.type === 'squad') {
        const squad = unit.data as Squad;
        return squad.soldiers.every((_, idx) => {
          const isDead = unit.deadSoldiers?.includes(idx);
          const isDone = unit.actionsUsed?.[idx]?.done;
          return isDead || isDone;
        });
      } else {
        return unit.isMachineDone || unit.currentDurability === 0;
      }
    });

    if (allUnitsDone && army.units.length > 0) {
      resetTargetMemory();
    }
  }, [army.units, resetTargetMemory]);
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 5: Commit turn reset logic**

```bash
git add src/components/GameSession.tsx
git commit -m "feat: reset target memory on turn completion"
```

---

## Task 8: Manual testing

**Files:**
- None (manual testing)

**Step 1: Start dev server**

注**
Run: `npm run dev:e2e`
Expected: Dev server starts on port 3001

**Step 2: Open app in browser and test each feature**

Test in browser:
1. Open http://localhost:3001
2. Add units to army
3. Switch to "В БОЙ" view
4. Test distance converter:
   - Open combat modal
   - Enter value in cm field → steps field updates automatically
   - Enter value in steps field → cm field updates automatically
   - Verify conversion factor (4 for fan, 5 for tehnolog)
5. Test target memory:
   - Set distance to 10 steps
   - Close modal
   - Open modal for another unit → distance should be 10 (with green highlight)
   - Change distance to 5
   - Close modal
   - Open modal for third unit → distance should be 5
6. Test armor limit:
   - Try entering armor value 15 → should work
   - Try entering armor value 99 → should work
7. Test done unit behavior:
   - Mark soldier as done
   - Verify DONE button is disabled
   - Verify KIA button is still active
   - Verify DEЙСТВИЕ button is disabled
   - Mark machine as done
   - Verify DONE button is disabled
   - Verify damage buttons are still active

**Step 3: Run unit tests**

Run: `npm run test`
Expected: All tests pass

**Step: No commit for manual testing**

---

## Task 9: Final verification

**Files:**
- None (verification)

**Step 1: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: No ESLint errors

**Step 3: Build project**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final verification - all checks passing"
```

---

## Summary

This plan implements:
1. **CombatTargetContext** - Manages target parameter memory across all units in a turn
2. **DistanceConverter** - Bidirectional conversion between cm and steps with rules-specific factor
3. **ParameterInputs updates** - Uses new converter, increases armor limit to 99, shows memory indicator
4. **UnitCard button logic** - Disables DONE when done, keeps KIA/damage active, removes auto-collapse
5. **Turn reset** - Resets target memory when all units complete their turn

All changes follow MOBILE FIRST design principles and maintain existing UI patterns.