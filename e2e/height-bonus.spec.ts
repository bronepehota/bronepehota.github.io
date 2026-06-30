import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad } from './helpers/setup';

/**
 * #164 — height bonus: a config toggle gates whether the per-shot "с высоты" chip
 * appears in the shot modal. The gate value persists across reloads.
 *
 * Open sequence mirrors e2e/combat.spec.ts (which uses the same helper):
 * click the unit-nav card → "Выберите действие" → "выстрел".
 *
 * NOTE: setupGameSessionWithSquad calls localStorage.clear() in its initScript,
 * so we cannot set bronepehota_height_bonus_enabled via addInitScript BEFORE the
 * helper — it gets wiped. Instead, we set it via page.evaluate after the helper
 * finishes loading, then reload so the app picks it up. For persistence tests,
 * we register a second addInitScript (after the helper) so it survives reloads.
 */
test.describe('Height bonus (#164)', () => {
  async function openShotModal(page: Page) {
    const unitCard = page.getByTestId('unit-nav-height-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(400);
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(400);
    const shotButton = page.getByRole('button', { name: /выстрел/i }).first();
    await expect(shotButton).toBeVisible({ timeout: 3000 });
    await shotButton.click();
    await page.waitForTimeout(300);
  }

  /**
   * Enable the height bonus gate and reload the page so the app reads it on mount.
   * Registers an addInitScript so the value survives subsequent reloads.
   */
  async function enableHeightGate(page: Page) {
    await page.evaluate(() => {
      localStorage.setItem('bronepehota_height_bonus_enabled', 'true');
    });
    // Register an initScript so the value persists across reloads
    await page.addInitScript(() => {
      localStorage.setItem('bronepehota_height_bonus_enabled', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });
  }

  test('gate off → height chip absent in shot modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'height-unit-1' } });
    await openShotModal(page);
    // Gate default OFF → height chip must NOT be present
    await expect(page.locator('button[aria-label*="Бонус за высоту"]')).toHaveCount(0);
  });

  test('gate on → height chip appears and toggles', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'height-unit-1' } });
    await enableHeightGate(page);
    await openShotModal(page);

    // Gate ON → chip present, starts off
    const heightChip = page.locator('button[aria-label*="Бонус за высоту"]');
    await expect(heightChip).toBeVisible({ timeout: 3000 });
    await expect(heightChip).toHaveAttribute('aria-label', 'Бонус за высоту выключен');

    // Toggle on → aria-label flips
    await heightChip.click();
    await expect(heightChip).toHaveAttribute('aria-label', 'Бонус за высоту включён');

    // Execute button subtitle now lists the active modifier
    const fireButton = page.getByRole('button', { name: /выстрелить/i });
    await expect(fireButton).toBeVisible({ timeout: 3000 });
    await expect(fireButton).toContainText('с высоты');

    // Execute → combat resolves
    await fireButton.click();
    await page.waitForTimeout(500);
  });

  test('gate persists across reload', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'height-unit-1' } });
    await enableHeightGate(page);
    // Reload — the registered initScript keeps the gate on
    await page.reload();
    await page.waitForLoadState('networkidle');
    await openShotModal(page);
    await expect(page.locator('button[aria-label*="Бонус за высоту"]')).toBeVisible({ timeout: 3000 });
  });
});
