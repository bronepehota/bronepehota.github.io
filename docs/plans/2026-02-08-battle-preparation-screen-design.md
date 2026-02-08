# Дизайн: Экран подготовки к бою

**Дата:** 2026-02-08
**Статус:** Утверждён

## Обзор

Новый экран подготовки к бою появляется после нажатия кнопки "В БОЙ" в ArmyBuilder. Это промежуточный экран между сбором армии и началом игрового сеанса, который помогает игрокам:
1. Увидеть состав своей армии
2. Получить мотивирующий военный текст
3. Бросить инициативу с возможностью переброса
4. Перейти к основному бою

## Текущий архитектурный поток

```
ArmyBuilder → [нажатие "В БОЙ"] → GameSession
```

## Новый архитектурный поток

```
ArmyBuilder → [нажатие "В БОЙ"] → BattlePreparationScreen
  → [кнопка "НАЧАТЬ БОЙ"] → InitiativeModal
  → [кнопка "НАЧАТЬ БОЙ" в модале] → GameSession
```

## Состояние приложения

**Обновление `army.currentStep`:**
```typescript
export type ArmyCurrentStep =
  | 'faction-select'
  | 'unit-select'
  | 'battle-prep'  // НОВОЕ
  | 'battle';
```

**Режимы просмотра в `page.tsx`:**
```typescript
const [view, setView] = useState<'builder' | 'preparation' | 'game'>(...)
```

## Компоненты

### 1. BattlePreparationScreen.tsx (новый)

**Расположение:** `src/components/BattlePreparationScreen.tsx`

**Пропсы:**
```typescript
interface BattlePreparationScreenProps {
  army: Army;
  setArmy: (army: Army) => void;
  onStartBattle: () => void;
  onBackToBuilder: () => void;
}
```

**Состояние:**
- `showInitiativeModal: boolean` — управление видимостью модального окна

**Структура:**
- Фон с `hero-art.jpg` и затемнением
- Иммерсивный текст (мотивирующий военный стиль)
- Список армии (compact view, переиспользуем `CompactArmyCard`)
- Фиксированная кнопка "НАЧАТЬ БОЙ" внизу

---

### 2. InitiativeModal.tsx (извлекаем из GameSession)

**Расположение:** `src/components/InitiativeModal.tsx`

**Пропсы:**
```typescript
interface InitiativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  factionId: FactionID;
  activeUnitsCount: number;
  context: 'preparation' | 'turn'; // Управляет текстом кнопки
}
```

**Функционал:**
- Анимированный бросок D6 кубика
- Кнопка "ПЕРЕБРОС"
- Кнопка "НАЧАТЬ БОЙ" (context='preparation') или "НАЧАТЬ ТУР" (context='turn')
- Отображение количества боеспособных юнитов
- Стили фракции (цвета, рамки, свечение)

---

### 3. Обновление существующих компонентов

#### GameSession.tsx
- Заменить встроенный модал инициативы на компонент `InitiativeModal`
- Передать `context="turn"`

#### app/app/page.tsx
- Добавить обработку режима `'preparation'`
- Обновить логику перехода между режимами

#### CompactArmyCard.tsx
- Добавить проп `readonly?: boolean` для отключения действий на этапе подготовки
- Скрывать кнопку удаления в readonly режиме

#### src/lib/types.ts
- Добавить `'battle-prep'` в `ArmyCurrentStep`

## UI и стили

### Фон экрана подготовки
```tsx
<div className="relative min-h-screen">
  {/* Фоновое изображение */}
  <div
    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
    style={{ backgroundImage: 'url(/images/hero-art.jpg)' }}
  />
  {/* Затемнение */}
  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
  {/* Контент */}
  <div className="relative z-10">
    {/* ... контент ... */}
  </div>
</div>
```

### Иммерсивный текст
```tsx
<h2 className="text-2xl md:text-3xl font-mono font-black uppercase tracking-wider text-white">
  Подготовка к бою
</h2>
<p className="text-base md:text-lg text-slate-200">
  Готовьте войска к бою!
</p>
<p className="text-sm md:text-base text-slate-400">
  Соберите миниатюры и расставьте их на поле.
  Бросьте кубик для определения первого хода.
</p>
```

### Кнопка "НАЧАТЬ БОЙ"
- Фиксированная внизу экрана
- Иконка меча + текст
- Технические уголки фракции
- Hover эффекты и анимация

## Тестирование

### Unit тесты (новые файлы)

**`src/__tests__/battle-preparation.test.tsx`:**
- Отображение списка армии
- Открытие модального окна инициативы
- Переход в GameSession
- Возврат в ArmyBuilder

**`src/__tests__/initiative-modal.test.tsx`:**
- Бросок кубика D6
- Переброс инициативы
- Блокировка кнопок во время анимации
- Правильный текст кнопки по контексту

### E2E тесты (обновление существующих)

**Обновляемые файлы:**
- `e2e/features/army-building.feature`
- `e2e/features/game-session.feature`
- `e2e/step-definitions/common.steps.ts`
- `e2e/step-definitions/army-building.steps.ts`

**Новые шаги:**
```gherkin
Когда я вижу экран подготовки к бою
Когда я нажимаю кнопку "Начать бой"
Когда я бросаю инициативу
Когда я нажимаю кнопку "Начать бой" в модальном окне
```

**Затрагиваемые сценарии:**
- ~5-10 сценариев требуют обновления из-за нового потока

### data-testid атрибуты

```tsx
// BattlePreparationScreen
data-testid="battle-preparation-screen"
data-testid="army-list-prep"
data-testid="start-battle-button"

// InitiativeModal
data-testid="initiative-modal"
data-testid="initiative-dice"
data-testid="reroll-button"
data-testid="confirm-initiative-button"
```

## Обработка ошибок

### Валидация
- Проверка на пустую армию перед входом в бой
- Защита от многократных кликов во время анимации
- Корректное восстановление состояния из localStorage

### Восстановление состояния
```typescript
useEffect(() => {
  if (army.currentStep === 'battle-prep') {
    setView('preparation');
  }
}, [army.currentStep]);
```

## Критерии приемки

- [ ] Экран подготовки отображается после нажатия "В БОЙ"
- [ ] Фон `hero-art.jpg` виден с правильным затемнением
- [ ] Иммерсивный текст отображается корректно
- [ ] Список армии показывает все юниты в compact view
- [ ] Кнопка "НАЧАТЬ БОЙ" открывает модальное окно инициативы
- [ ] Модальное окно позволяет бросить и перебросить инициативу
- [ ] Кнопка "НАЧАТЬ БОЙ" в модале переходит в GameSession
- [ ] Кнопка "Назад" возвращает в ArmyBuilder
- [ ] Все Unit тесты проходят
- [ ] Все E2E тесты обновлены и проходят
- [ ] Состояние корректно сохраняется/восстанавливается из localStorage

## Дальнейшие действия

1. Создать детальный план реализации (`tasks.md`)
2. Настроить git worktree для изолированной разработки
3. Реализовать компоненты в порядке зависимостей
4. Обновить тесты
5. Провести code review
