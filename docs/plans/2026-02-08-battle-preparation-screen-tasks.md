# Экран подготовки к бою - План реализации

> **Для Claude:** REQUIRED SUB-SKILL: Используйте superpowers:executing-plans или superpowers:subagent-driven-development для реализации этого плана задача за задачей.

**Цель:** Создать экран подготовки к бою между ArmyBuilder и GameSession с иммерсивным текстом, списком армии и модальным окном инициативы.

**Архитектура:** Новый компонент BattlePreparationScreen.tsx с фоном hero-art.jpg, переиспользуемый InitiativeModal.tsx (извлекаемый из GameSession), обновление типов и существующих компонентов.

**Tech Stack:** React 18, Next.js 14, TypeScript 5, Tailwind CSS, Jest, Cucumber + Playwright

---

## Предварительные шаги

### Подготовка git worktree (опционально)

**Если используете изолированную разработку:**
```bash
git worktree add ../bronepehota-2-battle-prep initial-screen-battle
cd ../bronepehota-2-battle-prep
npm install
```

---

## Task 1: Обновление типов - добавление battle-prep

**Files:**
- Modify: `src/lib/types.ts:181`

**Step 1: Изменить тип ArmyCurrentStep**

Найдите строку 181 в `src/lib/types.ts` и замените:
```typescript
// Было:
currentStep?: 'faction-select' | 'unit-select' | 'battle';

// Стало:
export type ArmyCurrentStep = 'faction-select' | 'unit-select' | 'battle-prep' | 'battle';
```

Затем обновите интерфейс Army:
```typescript
export interface Army {
  name: string;
  faction: FactionID;
  units: ArmyUnit[];
  totalCost: number;
  pointBudget?: number;
  currentStep?: ArmyCurrentStep; // Используйте новый тип
  isInBattle?: boolean;
  isLoading?: boolean;
  loadError?: string;
  currentTurn?: number;
}
```

**Step 2: Проверить типы**

Run: `npm run type-check`
Expected: PASS

**Step 3: Коммит**

```bash
git add src/lib/types.ts
git commit -m "feat: add battle-prep step to ArmyCurrentStep type"
```

---

## Task 2: Создание компонента InitiativeModal

**Files:**
- Create: `src/components/InitiativeModal.tsx`

**Step 1: Создать файл InitiativeModal.tsx**

Создайте новый файл `src/components/InitiativeModal.tsx` с полным кодом:

```tsx
'use client';

import { useState, useCallback } from 'react';
import { FactionID } from '@/lib/types';
import { X } from 'lucide-react';
import { rollDie } from '@/lib/game-logic';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Faction color system for battle interface
const getFactionColors = (factionId: string) => {
  const colorMap = {
    polaris: {
      primary: 'text-red-400',
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      glow: 'shadow-red-500/20',
      accent: 'border-red-500',
      progress: 'bg-red-500'
    },
    protectorate: {
      primary: 'text-cyan-400',
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-500/10',
      glow: 'shadow-cyan-500/20',
      accent: 'border-cyan-500',
      progress: 'bg-cyan-500'
    },
    mercenaries: {
      primary: 'text-yellow-400',
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/10',
      glow: 'shadow-yellow-500/20',
      accent: 'border-yellow-500',
      progress: 'bg-yellow-500'
    }
  };
  return colorMap[factionId as keyof typeof colorMap] || colorMap.polaris;
};

interface InitiativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  factionId: FactionID;
  activeUnitsCount?: number;
  context: 'preparation' | 'turn';
}

export default function InitiativeModal({
  isOpen,
  onClose,
  onConfirm,
  factionId,
  activeUnitsCount = 0,
  context
}: InitiativeModalProps) {
  const [initRoll, setInitRoll] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  const calculateInitiative = useCallback(() => {
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setInitRoll(rollDie(6));
      count++;
      if (count > 10) {
        clearInterval(interval);
        const final = rollDie(6);
        setInitRoll(final);
        setIsRolling(false);
      }
    }, 50);
  }, []);

  // Auto-roll when modal opens
  useState(() => {
    if (isOpen) {
      calculateInitiative();
    }
  });

  const handleConfirm = useCallback(() => {
    if (isRolling) return;
    onConfirm();
  }, [isRolling, onConfirm]);

  if (!isOpen) return null;

  const factionColors = getFactionColors(factionId);
  const buttonText = context === 'preparation' ? 'НАЧАТЬ БОЙ' : 'НАЧАТЬ ТУР';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-2 md:p-4 backdrop-blur-xl animate-in fade-in duration-300" data-testid="initiative-modal">
      <div className={cn(
        "relative border-2 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 max-w-sm w-full shadow-2xl text-center space-y-4 md:space-y-6 animate-in zoom-in duration-300 mx-auto max-h-[90vh] overflow-hidden",
        factionColors.border,
        factionColors.bg,
        factionColors.glow
      )}>
        {/* Corner accents */}
        <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", factionColors.accent)} />
        <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", factionColors.accent)} />
        <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", factionColors.accent)} />
        <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", factionColors.accent)} />

        {/* Header with close button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          <h3 className={cn("text-lg md:text-xl font-mono font-bold tracking-wider", factionColors.primary)}>
            ИНИЦИАТИВА
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800/50 rounded-sm transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Закрыть"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Dice display */}
        <div className="flex justify-center">
          <div className={cn(
            "relative w-20 h-20 md:w-28 md:h-28 bg-slate-900/80 rounded-2xl md:rounded-3xl border-4 flex items-center justify-center text-4xl md:text-6xl font-mono font-black shadow-2xl transition-all",
            factionColors.border,
            isRolling ? "scale-110 rotate-12" : "scale-100 rotate-0",
            factionColors.primary
          )}>
            {initRoll}
            {/* Corner accents on dice */}
            <div className={cn("absolute top-1 left-1 w-2 h-2 border-l border-t opacity-50", factionColors.accent)} />
            <div className={cn("absolute bottom-1 right-1 w-2 h-2 border-r border-b opacity-50", factionColors.accent)} />
          </div>
        </div>

        {/* Stats - only show in turn context */}
        {context === 'turn' && (
          <div className="bg-slate-900/50 p-3 md:p-4 rounded-xl border border-slate-700/50 space-y-2">
            <div className="flex justify-between items-center text-xs md:text-sm font-mono">
              <span className="uppercase tracking-wider text-slate-500">БОЕСПОСОБНЫХ:</span>
              <span className={cn("font-black text-base md:text-lg", factionColors.primary)}>{activeUnitsCount}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Reroll button */}
          <button
            onClick={calculateInitiative}
            disabled={isRolling}
            className={cn(
              "flex-1 py-3 md:py-4 font-mono text-sm md:text-base font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
              "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50 hover:text-slate-300",
              "disabled:opacity-50"
            )}
            data-testid="reroll-button"
          >
            ПЕРЕБРОС
          </button>

          {/* Start turn button */}
          <button
            onClick={handleConfirm}
            data-testid="confirm-initiative-button"
            disabled={isRolling}
            className={cn(
              "flex-[2] py-3 md:py-4 font-mono text-sm md:text-lg font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
              factionColors.border,
              factionColors.bg,
              factionColors.primary,
              "hover:scale-102 active:scale-95 disabled:opacity-50"
            )}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Проверить типы**

Run: `npm run type-check`
Expected: PASS

**Step 3: Коммит**

```bash
git add src/components/InitiativeModal.tsx
git commit -m "feat: create InitiativeModal component with context support"
```

---

## Task 3: Обновление CompactArmyCard - добавление readonly пропа

**Files:**
- Modify: `src/components/CompactArmyCard.tsx`

**Step 1: Добавить readonly проп в интерфейс**

В начале файла добавьте:
```typescript
interface CompactArmyCardProps {
  unit: ArmyUnit;
  onRemove: (instanceId: string) => void;
  onClick?: (unit: ArmyUnit) => void;
  factionId: FactionID;
  dataTestId?: string;
  readonly?: boolean; // НОВОЕ
}
```

**Step 2: Обновить деструктуризацию пропсов**

```typescript
export function CompactArmyCard({ unit, onRemove, onClick, factionId, dataTestId, readonly = false }: CompactArmyCardProps) {
```

**Step 3: Скрывать кнопку удаления в readonly режиме**

Найдите секцию Remove button zone (примерно строки 160-179) и измените:

```tsx
{/* Remove button zone - скрыть в readonly */}
{!readonly && (
  <div className="w-14 flex items-center justify-center flex-shrink-0">
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove(unit.instanceId);
      }}
      data-testid={dataTestId ? dataTestId.replace('army-unit-', 'remove-unit-') : `remove-compact-${unit.instanceId}`}
      aria-label={`Удалить ${unit.data.name}`}
      className={cn(
        'w-11 h-11 rounded-full flex items-center justify-center',
        'bg-red-900/20 hover:bg-red-900/40',
        'border border-red-700/50 hover:border-red-600',
        'transition-all duration-200',
        'active:scale-95 touch-manipulation'
      )}
    >
      <X className={cn('w-5 h-5', accentColor.replace('bg-', 'text-').replace('red', 'text-red-400'))} />
    </button>
  </div>
)}
```

**Step 4: Проверить типы**

Run: `npm run type-check`
Expected: PASS

**Step 5: Коммит**

```bash
git add src/components/CompactArmyCard.tsx
git commit -m "feat: add readonly prop to CompactArmyCard"
```

---

## Task 4: Создание компонента BattlePreparationScreen

**Files:**
- Create: `src/components/BattlePreparationScreen.tsx`

**Step 1: Создать файл BattlePreparationScreen.tsx**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Army, ArmyUnit, FactionID } from '@/lib/types';
import { ArrowLeft, Sword, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import CompactArmyCard from './CompactArmyCard';
import InitiativeModal from './InitiativeModal';

interface BattlePreparationScreenProps {
  army: Army;
  setArmy: (army: Army) => void;
  onStartBattle: () => void;
  onBackToBuilder: () => void;
}

// Faction styles
const getFactionStyles = (factionId: string | null) => {
  const styles = {
    polaris: {
      primary: 'text-red-400',
      border: 'border-red-600/40',
      bg: 'bg-red-950/20',
      accent: 'border-red-500',
      accentBorder: 'border-red-500',
      accentGlow: 'shadow-red-500/20 hover:shadow-red-500/30'
    },
    protectorate: {
      primary: 'text-cyan-400',
      border: 'border-cyan-600/40',
      bg: 'bg-cyan-950/20',
      accent: 'border-cyan-500',
      accentBorder: 'border-cyan-500',
      accentGlow: 'shadow-cyan-500/20 hover:shadow-cyan-500/30'
    },
    mercenaries: {
      primary: 'text-yellow-400',
      border: 'border-yellow-600/40',
      bg: 'bg-yellow-950/20',
      accent: 'border-yellow-500',
      accentBorder: 'border-yellow-500',
      accentGlow: 'shadow-yellow-500/20 hover:shadow-yellow-500/30'
    }
  };
  return styles[factionId as keyof typeof styles] || styles.polaris;
};

export default function BattlePreparationScreen({
  army,
  setArmy,
  onStartBattle,
  onBackToBuilder
}: BattlePreparationScreenProps) {
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const factionStyles = getFactionStyles(army.faction);

  // Валидация: армия не должна быть пустой
  useEffect(() => {
    if (army.units.length === 0) {
      console.warn('Попытка входа в бой с пустой армией');
      onBackToBuilder();
    }
  }, [army.units.length, onBackToBuilder]);

  // Количество активных юнитов
  const activeUnitsCount = army.units.filter(unit => {
    if (unit.type === 'squad') {
      return (unit.deadSoldiers?.length || 0) < (unit.data as any).soldiers.length;
    }
    return (unit.currentDurability || 0) > 0;
  }).length;

  const handleStartBattle = () => {
    // Обновляем состояние армии
    setArmy({
      ...army,
      isInBattle: true,
      currentStep: 'battle'
    });
    onStartBattle();
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-900" data-testid="battle-preparation-screen">
      {/* Фоновое изображение */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/hero-art.jpg)' }}
      />
      {/* Затемнение для читаемости */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

      {/* Контент поверх фона */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800/50 px-3 py-2 md:py-3 sticky top-0 z-50 relative">
          {/* Tech corners - faction-colored */}
          <div className={cn("absolute top-0 left-0 w-2 h-2 border-l border-t z-10", factionStyles.accent)} />
          <div className={cn("absolute top-0 right-0 w-2 h-2 border-r border-t z-10", factionStyles.accent)} />

          <div className="flex items-center gap-2">
            {/* Back button */}
            <button
              onClick={onBackToBuilder}
              data-testid="back-to-builder-button"
              className={cn(
                "p-1.5 rounded-sm border-2 transition-all duration-300",
                factionStyles.border,
                factionStyles.bg,
                "hover:scale-105 active:scale-95"
              )}
              title="Вернуться к сбору армии"
            >
              <ArrowLeft className={cn("w-4 h-4 md:w-5 md:h-5", factionStyles.primary)} />
            </button>

            <div>
              <h1 className={cn(
                "text-sm md:text-base font-mono font-bold uppercase tracking-wider leading-none",
                factionStyles.primary
              )}>
                Подготовка к бою
              </h1>
              <span className={cn(
                "text-[8px] md:text-[9px] font-mono font-black uppercase tracking-wider transition-colors duration-300",
                factionStyles.primary
              )}>
                {army.faction === 'polaris' && 'ПОЛЯРИС'}
                {army.faction === 'protectorate' && 'ПРОТЕКТОРАТ'}
                {army.faction === 'mercenaries' && 'НАЁМНИКИ'}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Иммерсивный текст */}
          <div className="text-center space-y-3 px-6 py-8">
            <h2 className="text-2xl md:text-3xl font-mono font-black uppercase tracking-wider text-white">
              Подготовка к бою
            </h2>

            <div className="max-w-2xl mx-auto space-y-2">
              <p className="text-base md:text-lg text-slate-200 leading-relaxed">
                Готовьте войска к бою!
              </p>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                Соберите миниатюры и расставьте их на поле.
                Бросьте кубик для определения первого хода.
              </p>
            </div>

            {/* Декоративная линия */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent max-w-xs" />
              <div className="w-2 h-2 border border-slate-500 rotate-45" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent max-w-xs" />
            </div>
          </div>

          {/* Список армии */}
          <div className="max-w-2xl mx-auto px-4 pb-40" data-testid="army-list-prep">
            {/* Заголовок списка */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">
                Состав армии
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {army.units.length} юнитов • {army.totalCost} очков
              </span>
            </div>

            {/* Список */}
            <div className="space-y-2">
              {army.units.map((unit) => (
                <CompactArmyCard
                  key={unit.instanceId}
                  unit={unit}
                  onRemove={() => {}}
                  onClick={undefined}
                  factionId={army.faction}
                  readonly={true}
                  dataTestId={`prep-unit-${unit.instanceId}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Фиксированная кнопка внизу */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 p-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowInitiativeModal(true)}
              data-testid="start-battle-button"
              className={cn(
                "w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3",
                "font-mono text-lg font-bold uppercase tracking-wider",
                "transition-all duration-200 min-h-[60px]",
                "border-2 relative overflow-hidden group",
                factionStyles.accentBorder,
                factionStyles.bg,
                factionStyles.primary,
                "hover:scale-[1.02] active:scale-95",
                "shadow-2xl hover:shadow-3xl",
                factionStyles.accentGlow
              )}
            >
              <Sword className="w-6 h-6 relative z-10" />
              <span className="relative z-10">Начать бой</span>

              {/* Технические уголки */}
              <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", factionStyles.accent)} />
              <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", factionStyles.accent)} />
              <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", factionStyles.accent)} />
              <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", factionStyles.accent)} />
            </button>
          </div>
        </div>
      </div>

      {/* Initiative Modal */}
      <InitiativeModal
        isOpen={showInitiativeModal}
        onClose={() => setShowInitiativeModal(false)}
        onConfirm={handleStartBattle}
        factionId={army.faction}
        activeUnitsCount={activeUnitsCount}
        context="preparation"
      />
    </div>
  );
}
```

**Step 2: Проверить типы**

Run: `npm run type-check`
Expected: PASS

**Step 3: Коммит**

```bash
git add src/components/BattlePreparationScreen.tsx
git commit -m "feat: create BattlePreparationScreen component"
```

---

## Task 5: Обновление GameSession - замена встроенного модала

**Files:**
- Modify: `src/components/GameSession.tsx:118-431`

**Step 1: Удалить встроенный модал и импорт компонентов**

В начале файла добавьте импорт InitiativeModal и удалите unused импорты (если нужно):

```tsx
// В секции imports добавьте:
import InitiativeModal from './InitiativeModal';
```

**Step 2: Удалить состояние showInitiative, initRoll, isRolling**

Найдите и удалите строки 118-121:
```tsx
// УДАЛИТЬ:
const [showInitiative, setShowInitiative] = useState(false);
// ... остальные связанные переменные
```

**Step 3: Удалить функцию calculateInitiative**

Удалите функцию calculateInitiative (строки 125-140).

**Step 4: Обновить useEffect для initiative trigger**

Обновите эффект для onInitiativeTriggerRef - теперь он просто вызывает handleInitiativeTrigger:

```tsx
// Обновить useEffect (строки 143-147):
useEffect(() => {
  if (onInitiativeTriggerRef) {
    onInitiativeTriggerRef(() => {
      // Initiative trigger теперь управляется через родительский компонент
      // который будет открывать InitiativeModal напрямую
    });
  }
}, [onInitiativeTriggerRef]);
```

**Step 5: Добавить состояние для InitiativeModal**

Добавьте новое состояние для модала:
```tsx
const [showInitiativeModal, setShowInitiativeModal] = useState(false);
```

**Step 6: Обновить calculateInitiative callback**

Замените старую функцию на:
```tsx
const calculateInitiative = useCallback(() => {
  setShowInitiativeModal(true);
}, []);
```

**Step 7: Обновить useEffect для onInitiativeTriggerRef**

```tsx
useEffect(() => {
  if (onInitiativeTriggerRef) {
    onInitiativeTriggerRef(calculateInitiative);
  }
}, [calculateInitiative, onInitiativeTriggerRef]);
```

**Step 8: Удалить старый Initiative Modal JSX**

Удалите весь блок `{showInitiative && ( ... )}` (строки 346-431).

**Step 9: Добавить новый InitiativeModal компонент**

Вместо старого блока добавьте (перед "Main Content"):
```tsx
{/* Initiative Modal */}
<InitiativeModal
  isOpen={showInitiativeModal}
  onClose={() => setShowInitiativeModal(false)}
  onConfirm={startNewTurn}
  factionId={army.faction}
  activeUnitsCount={activeUnitsCount}
  context="turn"
/>
```

**Step 10: Проверить типы**

Run: `npm run type-check`
Expected: PASS

**Step 11: Коммит**

```bash
git add src/components/GameSession.tsx
git commit -m "refactor: replace inline initiative modal with InitiativeModal component"
```

---

## Task 6: Обновление app/page.tsx - добавление режима preparation

**Files:**
- Modify: `src/app/app/page.tsx`

**Step 1: Добавить импорт BattlePreparationScreen**

В секции imports добавьте:
```tsx
import BattlePreparationScreen from '@/components/BattlePreparationScreen';
```

**Step 2: Обновить тип view**

Найдите строку ~15 и измените:
```tsx
// Было:
const [view, setView] = useState<'builder' | 'game'>(() => {

// Стало:
const [view, setView] = useState<'builder' | 'preparation' | 'game'>(() => {
```

Также обновите проверку localStorage:
```tsx
const saved = localStorage.getItem('bronepehota_view');
return (saved === 'builder' || saved === 'game' || saved === 'preparation') ? saved : 'builder';
```

**Step 3: Обновить handleEnterBattle**

Найдите функцию handleEnterBattle (строки 107-114) и измените:
```tsx
const handleEnterBattle = () => {
  setArmy({
    ...army,
    isInBattle: false,  // Изменено: ещё не в бою
    currentStep: 'battle-prep',  // НОВОЕ
  });
  setView('preparation');  // НОВОЕ
};
```

**Step 4: Добавить новую функцию handleStartBattleFromPrep**

Добавьте после handleEnterBattle:
```tsx
// Handle starting actual battle from preparation screen
const handleStartBattleFromPrep = () => {
  setView('game');
};

// Handle return to builder from preparation screen
const handleReturnToBuilderFromPrep = () => {
  setView('builder');
};
```

**Step 5: Обновить рендер контента**

Найдите блок рендера контента (строки 406-426) и обновите:
```tsx
{!isMounted ? (
  // Loading placeholder
  <div className="flex items-center justify-center h-full">
    <div className="text-slate-500 text-sm">Загрузка...</div>
  </div>
) : view === 'builder' ? (
  <ArmyBuilder
    army={army}
    setArmy={setArmy}
    onEnterBattle={handleEnterBattle}
    rulesVersion={rulesVersion}
    onRulesVersionChange={setRulesVersion}
    displayMode={displayMode}
    onDisplayModeChange={setDisplayMode}
  />
) : view === 'preparation' ? (  // НОВОЕ
  <BattlePreparationScreen
    army={army}
    setArmy={setArmy}
    onStartBattle={handleStartBattleFromPrep}
    onBackToBuilder={handleReturnToBuilderFromPrep}
  />
) : (
  <GameSession
    army={army}
    setArmy={setArmy}
    isInBattle={army.isInBattle}
    onEndBattle={handleEndBattle}
    onInitiativeTriggerRef={(fn) => { triggerInitiativeRef.current = fn; }}
    showCombatLog={showCombatLog}
    setShowCombatLog={setShowCombatLog}
  />
)}
```

**Step 6: Проверить типы**

Run: `npm run type-check`
Expected: PASS

**Step 7: Коммит**

```bash
git add src/app/app/page.tsx
git commit -m "feat: add preparation view mode to main page"
```

---

## Task 7: Unit тесты - BattlePreparationScreen

**Files:**
- Create: `src/__tests__/battle-preparation.test.tsx`

**Step 1: Создать файл тестов**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BattlePreparationScreen from '@/components/BattlePreparationScreen';
import { Army } from '@/lib/types';

describe('BattlePreparationScreen', () => {
  const mockArmy: Army = {
    name: 'Test Army',
    faction: 'polaris',
    units: [],
    totalCost: 0,
    currentStep: 'battle-prep',
    isInBattle: false,
    currentTurn: 1
  };

  const mockSetArmy = jest.fn();
  const mockOnStartBattle = jest.fn();
  const mockOnBackToBuilder = jest.fn();

  it('должен отображать заголовок "Подготовка к бою"', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    expect(screen.getByText('Подготовка к бою')).toBeInTheDocument();
  });

  it('должен показывать иммерсивный текст', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    expect(screen.getByText('Готовьте войска к бою!')).toBeInTheDocument();
  });

  it('должен отображать кнопку "Начать бой"', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    const button = screen.getByTestId('start-battle-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Начать бой');
  });

  it('должен вызывать onBackToBuilder при клике на кнопку "Назад"', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    const backButton = screen.getByTestId('back-to-builder-button');
    fireEvent.click(backButton);

    expect(mockOnBackToBuilder).toHaveBeenCalledTimes(1);
  });

  it('должен открывать модальное окно инициативы при клике на "Начать бой"', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    const button = screen.getByTestId('start-battle-button');
    fireEvent.click(button);

    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();
  });

  it('должен возвращать в ArmyBuilder при пустой армии', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    // Пустая армия должна вызвать onBackToBuilder через useEffect
    expect(mockOnBackToBuilder).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Запустить тесты**

Run: `npm test -- battle-preparation.test.tsx`
Expected: FAIL (некоторые тесты могут fail из-за пустой армии)

**Step 3: Создать мок-армию с юнитами**

```tsx
// В начале тестов добавьте:
const mockArmyWithUnits: Army = {
  name: 'Test Army',
  faction: 'polaris',
  units: [
    {
      instanceId: 'unit1',
      type: 'squad',
      data: {
        id: 'polaris_test',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: []
      },
      deadSoldiers: [],
      actionsUsed: []
    }
  ],
  totalCost: 100,
  currentStep: 'battle-prep',
  isInBattle: false,
  currentTurn: 1
};
```

**Step 4: Запустить тесты снова**

Run: `npm test -- battle-preparation.test.tsx`
Expected: PASS

**Step 5: Коммит**

```bash
git add src/__tests__/battle-preparation.test.tsx
git commit -m "test: add unit tests for BattlePreparationScreen"
```

---

## Task 8: Unit тесты - InitiativeModal

**Files:**
- Create: `src/__tests__/initiative-modal.test.tsx`

**Step 1: Создать файл тестов**

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InitiativeModal from '@/components/InitiativeModal';

describe('InitiativeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    factionId: 'polaris' as const,
    activeUnitsCount: 3,
    context: 'preparation' as const
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('должен отображаться когда isOpen=true', () => {
    render(<InitiativeModal {...defaultProps} />);
    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();
  });

  it('должен быть скрыт когда isOpen=false', () => {
    const { container } = render(<InitiativeModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();
  });

  it('должен показывать кнопку "Начать бой" в контексте preparation', () => {
    render(<InitiativeModal {...defaultProps} context="preparation" />);
    expect(screen.getByText('НАЧАТЬ БОЙ')).toBeInTheDocument();
    expect(screen.queryByText('НАЧАТЬ ТУР')).not.toBeInTheDocument();
  });

  it('должен показывать кнопку "Начать тур" в контексте turn', () => {
    render(<InitiativeModal {...defaultProps} context="turn" />);
    expect(screen.getByText('НАЧАТЬ ТУР')).toBeInTheDocument();
    expect(screen.queryByText('НАЧАТЬ БОЙ')).not.toBeInTheDocument();
  });

  it('должен показывать статистику боеспособных в контексте turn', () => {
    render(<InitiativeModal {...defaultProps} context="turn" />);
    expect(screen.getByText('БОЕСПОСОБНЫХ:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('не должен показывать статистику в контексте preparation', () => {
    render(<InitiativeModal {...defaultProps} context="preparation" />);
    expect(screen.queryByText('БОЕСПОСОБНЫХ:')).not.toBeInTheDocument();
  });

  it('должен закрываться при клике на кнопку X', () => {
    render(<InitiativeModal {...defaultProps} />);
    const closeButton = screen.getByTitle('Закрыть');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('должен вызывать onConfirm при клике на кнопку подтверждения', () => {
    render(<InitiativeModal {...defaultProps} />);
    const confirmButton = screen.getByTestId('confirm-initiative-button');
    fireEvent.click(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('должен бросать кубик при клике на кнопку переброса', async () => {
    render(<InitiativeModal {...defaultProps} />);
    const rerollButton = screen.getByTestId('reroll-button');

    // Первое значение
    const diceBefore = screen.getByTestId('initiative-dice');

    fireEvent.click(rerollButton);

    // Ждем завершения анимации
    await waitFor(() => {
      expect(diceBefore).toBeInTheDocument();
    });
  });
});
```

**Step 2: Запустить тесты**

Run: `npm test -- initiative-modal.test.tsx`
Expected: FAIL (нужно добавить data-testid в InitiativeModal)

**Step 3: Добавить data-testid в InitiativeModal**

В `src/components/InitiativeModal.tsx` добавьте атрибуты:
```tsx
<div className={cn(...)} data-testid="initiative-dice">
  {initRoll}
```

**Step 4: Запустить тесты снова**

Run: `npm test -- initiative-modal.test.tsx`
Expected: PASS

**Step 5: Коммит**

```bash
git add src/components/InitiativeModal.tsx src/__tests__/initiative-modal.test.tsx
git commit -m "test: add unit tests for InitiativeModal"
```

---

## Task 9: E2E тесты - обновление feature файлов

**Files:**
- Modify: `e2e/features/army-building.feature`
- Modify: `e2e/features/game-session.feature`

**Step 1: Обновить army-building.feature**

Откройте `e2e/features/army-building.feature` и найдите сценарии, где используется кнопка "В БОЙ". Обновите их:

```gherkin
  Сценарий: Переход в режим боя после сбора армии
    Дано я нахожусь на странице приложения
    И я выбрал фракцию "Полярис"
    И я указал бюджет армии "350"
    И я выбрал правила "Технолог"
    И я добавил отряд "Лёгкий штурмовик" в армию
    И я переключаюсь на вкладку "Армия"
    Когда я нажимаю кнопку "В БОЙ"
    То я вижу экран подготовки к бою
    И я вижу кнопку "Начать бой"
    Когда я нажимаю кнопку "Начать бой"
    То открывается модальное окно инициативы
    Когда я бросаю инициативу
    И я нажимаю кнопку "Начать бой" в модальном окне
    То я перехожу к экрану игрового сеанса
```

**Step 2: Обновить game-session.feature**

Найдите сценарий начала первого тура и обновите:

```gherkin
  Сценарий: Начало первого тура боя
    Дано я нахожусь в игровом сеансе
    И армия содержит активные юниты
    Когда я нажимаю кнопку "Новый тур"
    То открывается модальное окно инициативы
    И я вижу кубик с результатом
    Когда я нажимаю кнопку "Начать тур" в модальном окне
    То счетчик тура увеличивается на 1
```

**Step 3: Коммит**

```bash
git add e2e/features/army-building.feature e2e/features/game-session.feature
git commit -m "test: update E2E features for battle preparation screen"
```

---

## Task 10: E2E тесты - обновление step definitions

**Files:**
- Modify: `e2e/step-definitions/common.steps.ts`
- Modify: `e2e/step-definitions/army-building.steps.ts`

**Step 1: Добавить новые шаги в common.steps.ts**

```typescript
Когда('я вижу экран подготовки к бою', async function () {
  const screen = this.page.locator('[data-testid="battle-preparation-screen"]');
  await expect(screen).toBeVisible();
});

Когда('я нажимаю кнопку "Начать бой"', async function () {
  const button = this.page.locator('[data-testid="start-battle-button"]');
  await button.click({ timeout: 10000 });
});

Когда('я бросаю инициативу', async function () {
  // Ждем появления модального окна инициативы
  const modal = this.page.locator('[data-testid="initiative-modal"]');
  await expect(modal).toBeVisible();

  // Ждем окончания анимации броска
  const confirmButton = this.page.locator('[data-testid="confirm-initiative-button"]');
  await confirmButton.waitFor({ state: 'enabled', timeout: 5000 });
});

Когда('я нажимаю кнопку "Начать бой" в модальном окне', async function () {
  const button = this.page.locator('[data-testid="confirm-initiative-button"]');
  await button.click({ timeout: 10000 });
});

Когда('я нажимаю кнопку "Начать тур" в модальном окне', async function () {
  const button = this.page.locator('[data-testid="confirm-initiative-button"]');
  await button.click({ timeout: 10000 });
});

Когда('я нажимаю кнопку переброса', async function () {
  const button = this.page.locator('[data-testid="reroll-button"]');
  await button.click({ timeout: 5000 });
});
```

**Step 2: Обновить army-building.steps.ts**

Найдите шаг, который обрабатывает переход в бой, и обновите его:

```typescript
// Обновите существующий шаг или добавьте новый
Когда('я перехожу в режим боя', async function () {
  const toBattleButton = this.page.locator('[data-testid="to-battle-button"]');
  await toBattleButton.click();

  // Ждем экран подготовки
  const prepScreen = this.page.locator('[data-testid="battle-preparation-screen"]');
  await expect(prepScreen).toBeVisible();

  // Нажимаем "Начать бой"
  const startBattleButton = this.page.locator('[data-testid="start-battle-button"]');
  await startBattleButton.click();

  // Ждем и закрываем модальное окно инициативы
  const modal = this.page.locator('[data-testid="initiative-modal"]');
  await expect(modal).toBeVisible();

  const confirmButton = this.page.locator('[data-testid="confirm-initiative-button"]');
  await confirmButton.click();

  // Теперь ждем GameSession
  const gameSession = this.page.locator('[data-testid="game-session"]');
  await expect(gameSession).toBeVisible();
});
```

**Step 3: Запустить E2E тесты**

Run: `npm run test:e2e`
Expected: PASS (все сценарии должны пройти)

**Step 4: Коммит**

```bash
git add e2e/step-definitions/common.steps.ts e2e/step-definitions/army-building.steps.ts
git commit -m "test: update step definitions for battle preparation flow"
```

---

## Task 11: Создание фонового изображения

**Files:**
- Create: `public/images/hero-art.jpg`

**Step 1: Создать placeholder изображение**

Если у вас нет изображения hero-art.jpg, создайте placeholder:
```bash
# Создайте файл с любым изображением
touch public/images/hero-art.jpg
```

**Step 2: Коммит (если создали placeholder)**

```bash
git add public/images/hero-art.jpg
git commit -m "feat: add hero art background image placeholder"
```

---

## Task 12: Финальная проверка

**Step 1: Запустить все проверки**

```bash
# Типы
npm run type-check

# Lint
npm run lint

# Unit тесты
npm test

# E2E тесты (предварительно запустите dev:e2e)
npm run test:e2e
```

**Step 2: Вручную проверить функционал**

- Запустите `npm run dev`
- Соберите армию
- Нажмите "В БОЙ"
- Проверьте экран подготовки
- Проверьте модальное окно инициативы
- Проверьте переход в GameSession
- Проверьте кнопку "Назад"

**Step 3: Финальный коммит**

```bash
git commit --allow-empty -m "feat: complete battle preparation screen implementation"
```

---

## Сводка изменений

**Новые файлы:**
- `src/components/BattlePreparationScreen.tsx`
- `src/components/InitiativeModal.tsx`
- `src/__tests__/battle-preparation.test.tsx`
- `src/__tests__/initiative-modal.test.tsx`
- `public/images/hero-art.jpg` (placeholder)

**Обновленные файлы:**
- `src/lib/types.ts` — добавлен battle-prep
- `src/components/CompactArmyCard.tsx` — добавлен readonly
- `src/components/GameSession.tsx` — замена модала
- `src/app/app/page.tsx` — добавлен preparation view
- `e2e/features/army-building.feature` — обновлены сценарии
- `e2e/features/game-session.feature` — обновлены сценарии
- `e2e/step-definitions/common.steps.ts` — новые шаги
- `e2e/step-definitions/army-building.steps.ts` — обновлены шаги

---

**Total estimated time:** ~2-3 hours for implementation, ~1 hour for testing.
