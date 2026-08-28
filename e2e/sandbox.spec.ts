import { test, expect, type Page } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * Боевая песочница на странице юнита энциклопедии (замена упразднённого
 * автономного маршрута калькулятора): «ПРОВЕРИТЬ БОЕМ» → bottom-sheet →
 * выстрел/ближний бой → результат. Ключевые расчётные сценарии перенесены
 * из старого спека автономного калькулятора.
 */
const UNIT_URL = '/encyclopedia/unit/polaris_lineynaya_klon_pehota';

async function openSandbox(page: Page) {
  await page.goto(UNIT_URL);
  await page.getByTestId('unit-sandbox-open').click();
  const sheet = page.getByTestId('unit-combat-sandbox');
  await expect(sheet).toBeVisible({ timeout: 10000 });
  return sheet;
}

// Песочница «ПРОВЕРИТЬ БОЕМ» спрятана по решению владельца (2026-08-28) —
// вернуть вместе с SHOW_SANDBOX в UnitDetailPage.tsx.
test.describe.skip('Unit combat sandbox (encyclopedia)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('выстрел: выбор действия → фаза параметров (оружие + броня цели)', async ({ page }) => {
    const sheet = await openSandbox(page);

    await page.getByTestId('sandbox-action-shot').click();

    // Параметры выстрела: статы бойца (дальность D6, мощность 2D6) + ввод цели
    await expect(sheet.getByText('Ваше оружие')).toBeVisible();
    await expect(sheet.getByText('Броня цели').first()).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'ВЫСТРЕЛИТЬ' })).toBeVisible();
  });

  test('выстрел по броне=5: бросок → результат принят → новый расчёт', async ({ page }) => {
    const sheet = await openSandbox(page);
    await page.getByTestId('sandbox-action-shot').click();

    // Броня цели = 5 (статы бойца prefilled из досье)
    await sheet.getByLabel('Броня цели input').fill('5');

    await sheet.getByRole('button', { name: 'ВЫСТРЕЛИТЬ' }).click();

    // RESULTS: бросок завершён — кнопка принятия результата
    await expect(sheet.getByRole('button', { name: 'ПРИНЯТЬ' })).toBeVisible({ timeout: 10000 });

    // Принять → фаза APPLY → новый расчёт возвращает к выбору действия
    await sheet.getByRole('button', { name: 'ПРИНЯТЬ' }).click();
    await expect(sheet.getByText('Результат принят')).toBeVisible();
    await sheet.getByRole('button', { name: 'Новый расчёт' }).click();
    await expect(page.getByTestId('sandbox-action-shot')).toBeVisible({ timeout: 5000 });
  });

  test('ближний бой: броня цели (#160) → исход ПОБЕДА/КОНТРАТАКА/НИЧЬЯ', async ({ page }) => {
    const sheet = await openSandbox(page);
    await page.getByTestId('sandbox-action-melee').click();

    // Модификатор цели — броня, не ББ (#160)
    await expect(sheet.getByText('Броня цели').first()).toBeVisible();
    await expect(sheet.getByText('ББ цели')).toHaveCount(0);

    await sheet.getByRole('button', { name: 'АТАКОВАТЬ' }).click();

    const outcome = sheet.locator('text=/(ПОБЕДА|КОНТРАТАКА|НИЧЬЯ)/');
    await expect(outcome.first()).toBeVisible({ timeout: 10000 });
  });

  test('в песочнице доступен выбор правил (Технолог / Стар Систем)', async ({ page }) => {
    const sheet = await openSandbox(page);

    await expect(sheet.getByRole('button', { name: /Технолог/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Стар Систем/ })).toBeVisible();
  });
});
