import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

test.describe('Focus trap', () => {
  test.beforeEach(async ({ page }) => { await clearStorage(page); });

  test('combat modal confines Tab within itself', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'ft-unit' } });

    // Open the unit + combat modal (ACTION_SELECT).
    await page.getByTestId('unit-nav-ft-unit').first().click({ force: true });
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });

    const modal = page.getByTestId('bottom-sheet-combat-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

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
