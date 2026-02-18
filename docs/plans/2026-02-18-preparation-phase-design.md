# Design: Фаза "Готовьте войска!"

**Дата:** 2026-02-18
**Статус:** Approved
**Автор:** Claude + User

## Обзор

Интегрируем существующий `BattlePreparationScreen` в основной flow как 5-й этап с полным редизайном в минималистичном стиле.

## Flow изменений

**Текущий flow:**
```
Фракция → Бюджет → Правила → Армия → [кнопка "В Бой"] → Игра
```

**Новый flow (5 шагов):**
```
Фракция → Бюджет → Правила → Армия → Готовьте войска! → Игра
```

## Архитектура

### Структура компонентов

```
src/components/
├── preparation/
│   ├── BattlePreparationScreen.tsx  [РЕДАКТИРУЕТСЯ]
│   └── PrepArmyList.tsx             [НОВЫЙ]
├── rules/
│   └── StepProgressIndicator.tsx    [РЕДАКТИРУЕТСЯ]
└── ArmyBuilder.tsx                   [РЕДАКТИРУЕТСЯ]
```

### Новые зависимости

```
BattlePreparationScreen
    ├── PrepArmyList (новый компонент)
    │   ├── SafeImage (существующий)
    │   └── getFactionColors (существующий)
    └── InitiativeModal (существующий)
```

### Data Flow

```
UnitSelector (шаг "Армия")
    │
    │ onToBattle → setSetupStep('preparation')
    ↓
ArmyBuilder (setupStep === 'preparation')
    │
    │ Рендерит BattlePreparationScreen встроенно
    ↓
BattlePreparationScreen
    │
    │ Показывает список армии через PrepArmyList
    │
    │ onStartBattle → setView('game')
    ↓
GameSession
```

### State Management

Изменения в `army.currentStep`:
```typescript
type CurrentStep =
  | 'faction-select'   // Начало
  | 'unit-select'      // После правил
  | 'preparation'      // Новое: Готовьте войска!
  | 'battle';          // В бою
```

## Компоненты

### 1. PrepArmyList (НОВЫЙ)

**Расположение:** `src/components/preparation/PrepArmyList.tsx`

**Пропсы:**
```typescript
interface PrepArmyListProps {
  army: Army;
  factionId: FactionID;
}
```

**Отображение:**
- Для каждого `army.units`:
  - **Squad:**
    - Заголовок: `{unit.data.name} #{unit.instanceNumber}` (если instanceNumber > 1)
    - Row с фото всех солдат из `squad.soldiers`
    - Использовать `soldier.image` или первое доступное
  - **Machine:**
    - Заголовок: `{unit.data.name} #{unit.instanceNumber}`
    - Одно фото машины (`machine.image`)

**Размер фото:** 80px высота, aspect-ratio 3:4

**Стиль:** Минималистичный, без рамок/бордеров, просто фото в ряд

**Формат:**
```
┌─────────────────────────────────────┐
│  ШТУРМОВИКИ                         │
│  [👤] [👤] [👤] [👤] [👤]            │
└─────────────────────────────────────┘
```

### 2. BattlePreparationScreen (РЕДАКТИРОВАНИЕ)

**Убрать:**
- Весь `<header>` блок (строки 78-102)
- Кнопку "Назад" (встроена в общий хедер)

**Сохранить:**
- Фоновое изображение с затемнением
- Иммersive текст "ГОТОВЬТЕ ВОЙСКА!"
- `InitiativeModal`

**Изменить:**
- Заменить `CompactArmyCard` на новый `PrepArmyList`
- Убрать заголовок "Состав армии" и счётчик юнитов
- Упростить контент

**Новая структура:**
```tsx
<div className="relative min-h-screen">
  {/* Фон */}
  <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
       style={{ backgroundImage: 'url(/images/hero-art.jpg)' }} />
  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

  <div className="relative z-10">
    {/* Текст инструкций */}
    <div className="text-center space-y-3 px-2 pt-8">
      <h2>ГОТОВЬТЕ ВОЙСКА!</h2>
      <p>Соберите миниатюры и расставьте их на поле.</p>
      <p>Бросьте кубик для определения первого хода.</p>
    </div>

    {/* Список армии */}
    <PrepArmyList army={army} factionId={army.faction} />

    {/* Кнопка "Начать бой" - фиксированная внизу */}
  </div>
</div>
```

### 3. StepProgressIndicator (РЕДАКТИРОВАНИЕ)

**Изменения:**

```typescript
import { Sword } from 'lucide-react';

const steps: Step[] = [
  { id: 1, label: 'Фракция', description: 'Выберите сторону конфликта', icon: Shield },
  { id: 2, label: 'Бюджет', description: 'Установите лимит очков армии', icon: Coins },
  { id: 3, label: 'Правила', description: 'Выберите версию правил', icon: Book },
  { id: 4, label: 'Армия', description: 'Соберите свою армию', icon: Users },
  { id: 5, label: 'Расстановка', description: 'Подготовьтесь к бою', icon: Sword },
];

interface StepProgressIndicatorProps {
  currentStep: 'faction' | 'budget' | 'rules' | 'units' | 'preparation' | 'complete';
  // ...
}

const getStepIndex = (): number => {
  switch (currentStep) {
    case 'faction': return 0;
    case 'budget': return 1;
    case 'rules': return 2;
    case 'units': return 3;
    case 'preparation': return 4;
    case 'complete': return 4;
    default: return 0;
  }
};
```

### 4. UnitSelector (РЕДАКТИРОВАНИЕ)

**Изменить кнопку "В БОЙ":**

```typescript
// Было:
onToBattle={() => {
  setArmy({ ...army, isInBattle: true, currentStep: 'battle' });
}}

// Стало:
onToBattle={() => {
  setArmy({ ...army, currentStep: 'preparation' });
}}
```

Убрать `isInBattle: true` - теперь это происходит после этапа подготовки.

### 5. ArmyBuilder (РЕДАКТИРОВАНИЕ)

**Добавить обработку шага `preparation`:**

```typescript
const [setupStep, setSetupStep] = useState<'faction' | 'budget' | 'rules' | 'units' | 'preparation'>(() => {
  if (army.currentStep === 'unit-select') return 'units';
  if (army.currentStep === 'preparation') return 'preparation';
  return 'faction';
});

// Добавить условие рендеринга:
{setupStep === 'preparation' && (
  <BattlePreparationScreen
    army={army}
    setArmy={setArmy}
    onStartBattle={() => {
      setArmy({ ...army, isInBattle: true, currentStep: 'battle' });
      setView('game');
    }}
    onBackToBuilder={() => {
      setSetupStep('units');
      setArmy({ ...army, currentStep: 'unit-select' });
    }}
  />
)}
```

## Визуальный дизайн

```
┌─────────────────────────────────────┐
│         [Общий хедер из page.tsx]   │
│  БП | Полярис | [Энциклопедия]     │
├─────────────────────────────────────┤
│                                     │
│    [Стрелка прогресса - шаг 5/5]    │
│                                     │
│     ГОТОВЬТЕ ВОЙСКА!                │
│   Соберите миниатюры и расставьте   │
│   их на поле. Бросьте кубик для     │
│   определения первого хода.         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ШТУРМОВИКИ                 │   │
│  │  [👤] [👤] [👤] [👤] [👤]    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ШТУРМОВИКИ 2               │   │
│  │  [👤] [👤] [👤]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ТАНК "ГРОМ"               │   │
│  │  [🤖]                        │   │
│  └─────────────────────────────┘   │
│                                     │
│          (пустое пространство)      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   ⚔️ НАЧАТЬ БОЙ            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Обработка ошибок и Edge Cases

### 1. Пустая армия

```tsx
// PrepArmyList
{army.units.length === 0 ? (
  <div className="text-center py-12">
    <p className="text-slate-400">Армия пуста. Вернитесь к сбору армии.</p>
  </div>
) : (
  // Render list
)}

// BattlePreparationScreen - кнопка "Начать бой" disabled
<button
  disabled={army.units.length === 0}
>
  Начать бой
</button>
```

### 2. Отсутствующие изображения

Использовать `SafeImage` с fallback:
```tsx
<SafeImage
  src={soldier.image || squad.image || '/images/placeholder.png'}
  alt={`Боец ${soldier.num}`}
  width={80}
  height={107}
  className="object-cover"
/>
```

### 3. Навигация "Назад"

Кнопка в основном хедере `page.tsx` обрабатывает возврат к `unit-select`.

### 4. Persistence состояния

`army.currentStep = 'preparation'` сохраняется в localStorage.

### 5. Mobile responsiveness

Flex wrap для фото солдат:
```tsx
<div className="flex flex-wrap gap-2">
  {soldiers.map(soldier => (
    <SafeImage ... />
  ))}
</div>
```

### 6. Синхронизация view state

Убрать `view === 'preparation'` из `page.tsx` - использовать только `view === 'builder'` с различием по `army.currentStep`.

## Типы обновлений

```typescript
// StepProgressIndicator
type CurrentStep = 'faction' | 'budget' | 'rules' | 'units' | 'preparation' | 'complete';

// Army.currentStep
type CurrentStep = 'faction-select' | 'unit-select' | 'preparation' | 'battle';

// ArmyBuilder setupStep
type SetupStep = 'faction' | 'budget' | 'rules' | 'units' | 'preparation';
```

## Тестирование

### Unit Tests

- `PrepArmyList` рендерит всех солдат отряда
- `PrepArmyList` рендерит одно фото для машины
- `StepProgressIndicator` показывает 5 шагов
- `StepProgressIndicator` выделяет 5-й шаг как active

### E2E Tests

- Flow от фракции до этапа подготовки
- Отображение всех солдат для отрядов
- Кнопка "Начать бой" disabled при пустой армии
- Открытие модала инициативы
- Навигация назад к юнитам

## Файлы для изменения

1. `src/components/BattlePreparationScreen.tsx` - редизайн
2. `src/components/preparation/PrepArmyList.tsx` - новый
3. `src/components/rules/StepProgressIndicator.tsx` - добавить 5-й шаг
4. `src/components/UnitSelector.tsx` - изменить onToBattle
5. `src/components/ArmyBuilder.tsx` - добавить обработку preparation
6. `src/app/app/page.tsx` - убрать view === 'preparation'
7. `e2e/preparation-phase.spec.ts` - новый E2E тест
