import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

test.describe('Focus trap', () => {
  test.beforeEach(async ({ page }) => { await clearStorage(page); });

  test('combat modal confines Tab within itself', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'ft-unit' } });

    // 2026-11-27: ⋯ на карточке нет — ACTION_SELECT открывается через
    // «назад» из фазы параметров (вход: тап по стату дальности)
    await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('soldier-card').nth(0).getByTestId('stat-badge-range').click();
    const modal = page.getByTestId('bottom-sheet-combat-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.getByRole('button', { name: 'Назад к выбору действия' }).click();
    // Экран выбора действия: строки ВЫСТРЕЛ / БЛИЖНИЙ БОЙ / ГРАНАТА
    await expect(modal.getByRole('button', { name: /граната/i })).toBeVisible({ timeout: 5000 });

    // Tab through focusables repeatedly — focus must never leave the modal.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const m = document.querySelector('[data-testid="bottom-sheet-combat-modal"]');
        return !!m && m.contains(document.activeElement);
      });
      expect(inside, `Tab #${i + 1} escaped the modal`).toBe(true);
    }
  });
});
