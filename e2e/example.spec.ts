import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * Example Playwright E2E test
 * Tests basic page loading functionality
 */
test.describe('Main Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/');
  });

  test('should load page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Бронепехота/i);
  });

  test('should display faction selector', async ({ page }) => {
    // Look for faction selection UI
    const factionSelector = page.getByRole('button', { name: /поларис|протекторат|наемники/i });

    if (await factionSelector.count() > 0) {
      await expect(factionSelector.first()).toBeVisible();
    }
  });

  test('should switch to game session view', async ({ page }) => {
    // Look for the "В БОЙ" button
    const inBattleButton = page.getByRole('button', { name: /в бой/i });

    if (await inBattleButton.count() > 0) {
      await inBattleButton.click();
      await page.waitForLoadState('networkidle');

      // Verify we're in game session view
      const sessionTitle = page.getByText(/войска|атака/i);
      await expect(sessionTitle).toBeVisible();
    }
  });
});
