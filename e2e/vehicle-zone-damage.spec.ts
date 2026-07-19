import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * #162 — vehicle zone damage: «цель — техника» toggle → zone-based damage;
 * toggle + zone-max remembered per attacker across close/reopen.
 */
test.describe('Vehicle zone damage (#162)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  // Register AFTER setupGameSessionWithSquad so on reload this runs AFTER the
  // helper's localStorage.clear() (addInitScripts execute in registration order).
  async function enableCommunity(page: Page) {
    await page.addInitScript(() => {
      localStorage.setItem('bronepehota_rules_version', 'community_star_system');
      localStorage.setItem('bronepehota_panic_enabled', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });
    await expandFirstUnit(page);
  }

  // Open the shot modal: click action button → select "выстрел"
  async function openShotModal(page: Page) {
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.getByRole('button', { name: /выстрел/i }).first().click();
    // Wait for parameters phase to render (distance label is always present for shots)
    await expect(page.getByText('Дистанция').first()).toBeVisible({ timeout: 3000 });
  }

  test('«цель — техника» toggle shows «макс зоны» and yields vehicle damage', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'vz-unit-1' } });
    await expandFirstUnit(page);
    await enableCommunity(page);

    // Open shot modal
    await openShotModal(page);

    // Toggle «цель — техника» on
    const vehicleToggle = page.getByRole('button', { name: 'Техника' });
    await expect(vehicleToggle).toBeVisible({ timeout: 3000 });
    await vehicleToggle.click();

    // Label flipped to «макс зоны»
    await expect(page.getByText('макс зоны')).toBeVisible({ timeout: 2000 });

    // Set distance to minimum (1) so the first soldier (range D6) always hits
    // NumberStepper now exposes label="Дистанция", so its decrease button has a
    // unique accessible name ("Decrease Дистанция") distinguishing it from other steppers.
    const distDecrease = page.getByRole('button', { name: 'Decrease Дистанция' });
    for (let i = 0; i < 4; i++) {
      if (await distDecrease.isEnabled({ timeout: 500 })) {
        await distDecrease.click();
      }
    }
    // targetArmor defaults to 0 — every damage die penetrates

    const fireButton = page.getByRole('button', { name: /выстрелить/i });
    await expect(fireButton).toBeVisible({ timeout: 3000 });
    await fireButton.click();

    // Results phase — damage section visible (hit succeeded → damage vs armor)
    await expect(page.getByText(/Урон vs Броня/)).toBeVisible({ timeout: 3000 });
  });

  test('toggle remembers vehicle target for the same attacker on re-open', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'vz-unit-2' } });
    await expandFirstUnit(page);
    await enableCommunity(page);

    // Open shot modal, toggle on
    await openShotModal(page);
    const vehicleToggle = page.getByRole('button', { name: 'Техника' });
    await expect(vehicleToggle).toBeVisible({ timeout: 3000 });
    await vehicleToggle.click();

    // Confirm «макс зоны» label
    await expect(page.getByText('макс зоны')).toBeVisible({ timeout: 2000 });

    // Close the modal via X button
    const closeButton = page.locator('[data-testid="bottom-sheet-combat-modal"] button').filter({ has: page.locator('svg.lucide-x') });
    await closeButton.click({ force: true });
    await page.waitForTimeout(300);

    // Re-open shot modal for the same unit
    await openShotModal(page);

    // Toggle should still be on (memory persisted)
    await expect(vehicleToggle).toHaveAttribute('aria-pressed', 'true', { timeout: 3000 });
    await expect(page.getByText('макс зоны')).toBeVisible({ timeout: 2000 });
  });
});
