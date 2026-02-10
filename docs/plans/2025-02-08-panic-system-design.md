# Система паники

**Дата:** 2025-02-08
**Правила:** Панова (fan) и Tehnolog
**Статус:** Одобрено к реализации

## Обзор

Система паники реализует механику бегства пехотинцев при критических условиях боя согласно двум версиям правил:

- **Правила Панова:** Автоматическая паника при потере 50% отряда с броском D6 против ранга
- **Правила Tehnolog:** Паника при равенстве Бр и кубика в тесте выживания (опционально)

Общий эффект для обоих правил: солдат пропускает следующий ход.

## Архитектура

### Типы данных

```typescript
// src/lib/types.ts
export interface PanicState {
  soldierIndex: number;
  testRoll: number;
  rank: number;
  triggeredAtTurn: number;
}

// Добавить в ArmyUnit
export interface ArmyUnit {
  // ... существующие поля
  panicState?: PanicState[]; // Список паникующих солдат
}
```

### Игровая логика

Новый файл `src/lib/panic-logic.ts`:

```typescript
export interface PanicTestResult {
  soldierIndex: number;
  isPanic: boolean;
  roll: number;
  rank: number;
}

export function checkPanicTrigger(unit: ArmyUnit, rulesVersion: RulesVersionID): boolean

export function executePanicTest(unit: ArmyUnit, soldierIndex: number, rulesVersion: RulesVersionID): PanicTestResult

export function resolvePanic(unit: ArmyUnit, currentTurn: number): ArmyUnit
```

## Поток выполнения

### Правила Панова

1. **Триггер:** При достижении 50% потерь отряда:
   ```
   deadSoldiers.length >= Math.floor(soldiers.length / 2)
   ```
2. **Автоматический тест:** Открывается `PanicTestModal` для всех живых солдат
3. **Бросок:** D6 за каждого солдата, сравнение с армейским рангом (`rank`)
4. **Результат:** Если `roll > rank` — солдат в панике
5. **Эффект:** Солдат помечается как паникующий, действия заблокированы на текущий ход

### Правила Tehnolog

1. **Триггер:** В `PilotTestModal` при `armor === roll`
2. **Опционально:** Показывать кнопку "В панику?"
3. **Эффект:** Та же метка паники

### Снятие паники

В начале нового хода автоматически снимается статус паники у всех солдат.

## Компоненты UI

**Важно:** При реализации UI компонентов использовать skill `/frontend-design` для обеспечения production-grade визуально полированных интерфейсов, которые избегают типичных AI-шаблонов.

### PanicTestModal

Модальное окно для проведения тестов паники с анимированными бросками кубиков.

```typescript
interface PanicTestModalProps {
  unit: ArmyUnit;
  rulesVersion: RulesVersionID;
  onTestComplete: (results: PanicTestResult[]) => void;
  onClose: () => void;
}
```

**Функционал:**
- Показывает список живых солдат (кроме уже в панике)
- Кнопка "Провести тест" запускает анимацию кубиков D6
- Результаты по каждому солдату:
  - ✅ Успех (roll ≤ rank) — "Справился"
  - 😱 Паника (roll > rank) — "В паника!" с иконкой бега
- Кнопка "Применить" сохраняет результаты

### Модификация UnitCard

В карточке солдата показать индикатор паники с иконкой `Footprints`:

```tsx
{isInPanic && (
  <div className="flex items-center gap-1 text-orange-400">
    <Footprints className="w-4 h-4" />
    <span className="text-xs">ПАНИКА</span>
  </div>
)}
```

Кнопки действий заблокированы для паникующих солдат (`disabled`).

## Интеграция

### В UnitCard.tsx

При убийстве солдата:
```typescript
const toggleDead = (idx: number) => {
  const dead = unit.deadSoldiers || [];
  const newDead = dead.includes(idx)
    ? dead.filter(i => i !== idx)
    : [...dead, idx];

  const updatedUnit = { ...unit, deadSoldiers: newDead };

  if (rulesVersion === 'fan' && newDead.length > 0) {
    const shouldTestPanic = checkPanicTrigger(updatedUnit, 'fan');
    if (shouldTestPanic) {
      setShowPanicModal(true);
    }
  }

  updateUnit(updatedUnit);
};
```

### В GameSession.tsx / page.tsx

В начале нового хода:
```typescript
const nextTurn = () => {
  setArmy(prev => {
    const newUnits = prev.units.map(unit => resolvePanic(unit));
    return { ...prev, units: newUnits, currentTurn: (prev.currentTurn || 1) + 1 };
  });
};
```

## Тестирование

### Юнит-тесты

`src/__tests__/panic-logic.test.ts`:

- `checkPanicTrigger` возвращает правильные значения для разных уровней потерь
- `executePanicTest` корректно определяет панику на основе roll vs rank
- `resolvePanic` снимает панику в новом ходу

### E2E-тесты

```gherkin
Функционал: Система паники
  Правила: Панова

  Сценарий: Паника при гибели половины отряда
    Дано я выбираю фракцию "Polaris"
    И я добавляю отряд "Легкие штурмовики" в армию
    И я переключаюсь на вкладку "Армия"
    И я выбираю правила "Панова"
    Когда я убиваю 3-го бойца из 6
    То модалка "Тест на панику" открывается автоматически
    И я провожу тест на панику
    Тогда паникующие бойцы помечены иконкой бега
```

## Ограничения и исключения

1. **Герои и отряды с героями** (правила Панова) — бесстрашны, тест не проводится
2. **Пилоты машин** — не подвержены панике в этом приложении
3. **Дезертиры** — солдаты, сбежавшие за пределы поля, не возвращаются (опциональная механика для будущего)

## Обработка ошибок

- Если тест паники уже проводился в этом ходу — не предлагать повторно
- Если все солдаты мертвы — не предлагать тест
- При закрытии модалки без применения — изменения не сохраняются