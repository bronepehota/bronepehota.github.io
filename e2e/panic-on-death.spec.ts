import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * #166 — panic triggers when a squad's losses cross 50% via the centralized UnitCard effect.
 * Covers the manual-kill path (the pilot-death path shares the same mechanism).
 * 6-soldier squad → threshold = floor(6/2) = 3. Seed 2 dead → killing 1 more crosses it.
 */
test.describe('Panic on death (#166)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  // Register AFTER setupGameSessionWithSquad so on reload this runs AFTER the helper's
  // localStorage.clear() (addInitScripts run in registration order) — keeps the gate values.
  async function enableCommunityPanic(page: Page) {
    await page.addInitScript(() => {
      localStorage.setItem('bronepehota_rules_version', 'community_star_system');
      localStorage.setItem('bronepehota_panic_enabled', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });
    await expandFirstUnit(page);
  }

  test('NOT-done squad: kill to threshold → panic modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'panic-a', deadSoldiers: [0, 1] },
    });
    await expandFirstUnit(page);
    await enableCommunityPanic(page);

    await page.locator('[data-testid="soldier-kill-button"][data-soldier-index="2"]').click({ force: true });
    await expect(page.getByTestId('panic-modal-title')).toBeVisible({ timeout: 3000 });
  });

  test('DONE squad: kill to threshold → panic modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: {
        instanceId: 'panic-b',
        deadSoldiers: [0, 1],
        actionsUsed: [0, 1, 2, 3, 4, 5].map(() => ({ moved: false, shot: false, melee: false, done: true })),
      },
    });
    await expandFirstUnit(page);
    await enableCommunityPanic(page);

    await page.locator('[data-testid="soldier-kill-button"][data-soldier-index="2"]').click({ force: true });
    await expect(page.getByTestId('panic-modal-title')).toBeVisible({ timeout: 3000 });
  });

  test('below threshold: no panic modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'panic-c', deadSoldiers: [0] }, // 1 dead < threshold 3
    });
    await expandFirstUnit(page);
    await enableCommunityPanic(page);

    await page.locator('[data-testid="soldier-kill-button"][data-soldier-index="1"]').click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.getByTestId('panic-modal-title')).toHaveCount(0); // 2 dead, still < 3
  });
});
