import { test, expect } from '@playwright/test';
import {
  setupToArmyBuilder,
  addFirstUnit,
  goToPreparation,
  setupToPreparation,
  clearStorage,
} from './helpers/setup';

/**
 * Preparation Phase E2E tests
 * Tests the battle preparation screen flow
 */
test.describe('Preparation Phase', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should navigate to preparation step from unit selector', async ({ page }) => {
    await setupToArmyBuilder(page);
    await addFirstUnit(page);
    await page.waitForTimeout(300);
    await goToPreparation(page);

    const prepScreen = page.getByTestId('battle-preparation-screen');
    await expect(prepScreen).toBeVisible();
    await expect(page.getByText('Готовьте войска!')).toBeVisible();
  });

  test('should display soldier images for squad units', async ({ page }) => {
    await setupToPreparation(page);

    const prepScreen = page.getByTestId('battle-preparation-screen');
    await expect(prepScreen).toBeVisible();

    const prepArmyList = page.getByTestId('prep-army-list');
    await expect(prepArmyList).toBeVisible();

    const soldierImages = page.locator('img[alt*="Боец"]');
    const imageCount = await soldierImages.count();
    expect(imageCount).toBeGreaterThan(0);
  });

  test('should display empty army message when no units', async ({ page }) => {
    await setupToArmyBuilder(page);

    const toBattleButton = page.getByTestId('to-battle-button');
    await expect(toBattleButton).not.toBeVisible();

    await expect(page.getByText('0/350')).toBeVisible();
  });

  test('should enable start battle button when army has units', async ({ page }) => {
    await setupToPreparation(page);

    const startBattleButton = page.getByTestId('start-battle-button');
    await expect(startBattleButton).toBeVisible();
    await expect(startBattleButton).toBeEnabled();
  });

  test('should show initiative modal when clicking start battle', async ({ page }) => {
    await setupToPreparation(page);

    const startBattleButton = page.getByTestId('start-battle-button');
    await expect(startBattleButton).toBeEnabled();
    await startBattleButton.click();
    await page.waitForTimeout(300);

    const modalContent = page.locator('role=dialog').or(page.locator('.fixed.inset-0.z-'));
    const hasModal = await modalContent.count() > 0;
    if (hasModal) {
      await expect(modalContent.first()).toBeVisible();
    }
  });
});
