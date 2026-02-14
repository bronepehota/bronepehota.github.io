# E2E Тесты

End-to-end тесты для Бронепехота с использованием Playwright.

## Структура

- `landing.spec.ts` - Тесты для landing page
- `army-builder.spec.ts` - Тесты для создания армии
- `game-session.spec.ts` - Тесты для игровой сессии
- `example.spec.ts` - Примеры базовых тестов

## Запуск

```bash
# Запуск всех тестов (headless)
npm run test:e2e

# Запуск с видимым браузером
npm run test:e2e:headed

# Запуск в debug режиме
npm run test:e2e:debug
```

## Конфигурация

- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: `http://localhost:3001`
- **Auto-start**: Dev server запускается автоматически перед тестами
- **Timeout**: 120s для запуска dev server

## Написание тестов

### Простой тест

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
  });

  test('should do something', async ({ page }) => {
    const element = page.getByTestId('test-id');
    await expect(element).toBeVisible();
  });
});
```

### Best Practices

1. **Используй test-id**: `page.getByTestId('element-id')` вместо текстовых селекторов
2. **Очищай localStorage**: `await page.evaluate(() => localStorage.clear());`
3. **Жди загрузки**: `await page.waitForLoadState('networkidle');`
4. **Graceful degradation**: Проверяй `.count() > 0` перед действиями
5. **Избегай хрупких тестов**: Если UI меняется, тест не должен падать

### Добавление новых тестов

1. Создай файл `*.spec.ts` в `e2e/`
2. Используй `test.describe()` для группировки
3. Используй `test.beforeEach()` для общей подготовки
4. Запусти `npm run test:e2e` для проверки

## CI/CD

E2E тесты запускаются в CI автоматически через GitHub Actions.

См. `.github/workflows/test.yml` для деталей.
