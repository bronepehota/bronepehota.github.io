import { test, expect } from '@playwright/test';
import { clearStorage, dismissIntroIfShown } from './helpers/setup';

/**
 * Пункт «смена правил подтягивает масштаб»: правила Сообщества Star System
 * меряют шаг = 4см, Технолог = 5см. Выбор правил в визарде выставляет
 * фактор шаг/см (и persists его); ручной тумблер после этого остаётся при себе.
 */
test.describe('Шаг/см при выборе правил', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/app');
    await dismissIntroIfShown(page);
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 15000 });
  });

  test('правила Сообщества SS → 1 шаг = 4см (и в localStorage)', async ({ page }) => {
    await page.getByTestId('rules-card-community_star_system').click();

    await expect(page.getByRole('button', { name: '1 шаг = 4см' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('bronepehota_step_to_cm_factor'))).toBe('4');
  });

  test('обратный выбор Технолога возвращает 5см', async ({ page }) => {
    await page.getByTestId('rules-card-community_star_system').click();
    await expect(page.getByRole('button', { name: '1 шаг = 4см' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('rules-card-tehnolog').click();
    await expect(page.getByRole('button', { name: '1 шаг = 5см' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('bronepehota_step_to_cm_factor'))).toBe('5');
  });

  test('ручной тумблер после смены правил не перебивается', async ({ page }) => {
    await page.getByTestId('rules-card-community_star_system').click(); // → 4
    await page.getByRole('button', { name: '1 шаг = 5см' }).click(); // вручную → 5

    await expect(page.getByRole('button', { name: '1 шаг = 5см' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('bronepehota_step_to_cm_factor'))).toBe('5');
  });
});
