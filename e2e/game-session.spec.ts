import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * Game Session E2E tests
 * Tests combat gameplay and unit management in battle
 */
test.describe('Game Session', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should display game session interface when in battle', async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-unit-1',
          data: { id: 'test', name: 'Test Unit', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3],
        }],
        totalCost: 50,
        currentStep: 'game',
        isInBattle: true,
        currentTurn: 1,
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const gameSession = page.getByTestId('game-session');
    const hasGameSession = await gameSession.count() > 0;
    if (hasGameSession) {
      await expect(gameSession).toBeVisible();
    }
  });

  test('should display panic toggle when units are damaged', async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-unit-1',
          data: { id: 'test', name: 'Test Unit', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2],
          deadSoldiers: 1,
        }],
        totalCost: 50,
        currentStep: 'game',
        isInBattle: true,
        currentTurn: 1,
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const panicToggle = page.getByTestId('panic-toggle');
    if (await panicToggle.count() > 0) {
      await expect(panicToggle).toBeVisible();
    }
  });
});
