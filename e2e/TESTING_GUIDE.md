# E2E Testing Guide

Этот документ объясняет, как писать и поддерживать E2E тесты для Бронепехота.

## Философия

**Unit First**: Мы фокусируемся на юнит тестах, а E2E тесты минимальны.
- Unit тесты: Быстрые, надёжные, покрывают бизнес-логику
- E2E тесты: Медленные, для critical user flows, простые в поддержке

## Структура тестов

### Unit Tests (`src/__tests__/`)

**Фокус**: Game logic, utilities, types, компоненты

```
src/__tests__/
├── game-logic.test.ts              ✅ Dice mechanics, hit/damage
├── unit-utils.test.ts             ✅ Helper functions
├── rules-registry-extended.test.ts ✅ Rules system
├── army-state.test.ts             ✅ Army state management
├── combat-mechanics.test.ts        ✅ Combat calculations
└── type-validation.test.ts          ✅ TypeScript types
```

**Пример хорошего unit теста**:
```typescript
test('should calculate damage correctly', () => {
  const result = calculateDamage('2D6', 3);

  expect(result).toHaveProperty('damage');
  expect(Array.isArray(result.rolls)).toBe(true);
  expect(result.damage).toBeGreaterThanOrEqual(0);
});
```

### E2E Tests (`e2e/`)

**Фокус**: Critical user flows, happy path, graceful degradation

```
e2e/
├── landing.spec.ts       ✅ Landing page loads
├── army-builder.spec.ts ✅ Army creation
├── game-session.spec.ts ✅ Combat gameplay
└── army-creation.spec.ts ✅ Critical flows
```

**Пример хорошего E2E теста**:
```typescript
test('should persist army in localStorage', async ({ page }) => {
  await page.goto('/app');
  await page.evaluate(() => {
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
  });

  await page.reload();

  const armyData = await page.evaluate(() => {
    return localStorage.getItem('bronepehota_army');
  });

  expect(armyData).toBeTruthy();
});
```

## Best Practices

### Для Unit Tests:

1. **Тестируй логику, а не UI**
   - ✅ Проверяй calculateDamage, а не рендеринг
   - ❌ Не тестируй CSS/styling

2. **Используй реальные данные**
   - Создавай моки похожие на production JSON
   - Используй реальные cost, dice notation

3. **Покрывай edge cases**
   - Граничные значения (0, max dice)
   - Пустые массивы
   - Null/undefined обрабатка

### Для E2E Тестов:

1. **Graceful degradation**
   ```typescript
   // Проверяй .count() перед действиями
   if (await button.count() > 0) {
     await button.click();
   } else {
     test.skip(); // или return
   }
   ```

2. **Используй test-id**
   ```typescript
   // Хорошо
   const button = page.getByTestId('submit-button');

   // Плохо (хрупко)
   const button = page.getByText('Отправить');
   ```

3. **Очищай состояние**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.evaluate(() => {
       localStorage.clear();
     });
   });
   ```

4. **Жди загрузки**
   ```typescript
   await page.goto('/app');
   await page.waitForLoadState('networkidle');
   // Теперь взаимодействуй с UI
   ```

## Что НЕ тестировать:

❌ **Избегай тестирования**:
- CSS стили
- Анимации
- Responsive breakpoints (если не критично)
- Текстовые строки (если не бизнес-логика)

❌ **Избегай хрупких E2E тестов**:
- Сложные цепочки действий (превращай в unit тесты)
- Точное позиционирование элементов
- Динамические данные/случайные значения

## Debugging

### Unit тесты:
```bash
# Запуск конкретного файла
npm test -- army-state.test.ts

# Watch mode
npm run test:watch
```

### E2E тесты:
```bash
# Запуск конкретного файла
npm run test:e2e -- army-creation

# С видимым браузером
npm run test:e2e:headed

# Debug mode с inspector
npm run test:e2e:debug
```

## Добавление новых тестов

1. Создай файл `*.test.ts` или `*.spec.ts`
2. Запусти `npm run test` или `npm run test:e2e`
3. Убедись, что проходит
4. Commit с осмысленным сообщением

### Примеры commit messages:
```
test: add combat mechanics tests
- Add calculateDamage edge case tests
- Add hit calculation with bonus tests
- Add rules-specific combat tests

test: add army state tests
- Add army creation tests
- Add unit addition/removal tests
- Add turn tracking tests
```

## Покрытие (Coverage)

Текущее состояние:
- ✅ Game logic (dice, hit, damage, melee)
- ✅ Rules system (tehnolog, community)
- ✅ Unit utilities (count, numbering)
- ✅ Army state (creation, turn tracking)
- ⚠️ Combat components (частично)
- ❌ UI components (минимально)

Приоритеты для улучшения:
1. **Combat calculations** (grenades, surprise attacks)
2. **Unit state transitions** (alive → dead → panic)
3. **Rules differences** (tehnolog vs community)
4. **Validation** (budget limits, unit requirements)
