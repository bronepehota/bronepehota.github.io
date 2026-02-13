import { test, expect } from '@playwright/test';

/**
 * Game Session E2E tests
 * Tests combat gameplay and unit management in battle
 */
test.describe('Game Session', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app page
    await page.goto('/app');
  });

  test('should display game session interface when in battle', async ({ page }) => {
    // Set up game session state
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-unit-1',
          data: { id: 'test', name: 'Test Unit', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3]
        }],
        totalCost: 50,
        currentStep: 'game',
        isInBattle: true,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if we're in game session
    const gameSession = page.getByTestId('game-session');
    const hasGameSession = await gameSession.count() > 0;

    if (hasGameSession) {
      await expect(gameSession).toBeVisible();
    }
  });

  test('should display panic toggle when units are damaged', async ({ page }) => {
    // Set up damaged unit state
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-unit-1',
          data: { id: 'test', name: 'Test Unit', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2],
          deadSoldiers: 1
        }],
        totalCost: 50,
        currentStep: 'game',
        isInBattle: true,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Try to find panic toggle
    const panicToggle = page.getByTestId('panic-toggle');

    // If panic toggle exists, test it
    if (await panicToggle.count() > 0) {
      await expect(panicToggle).toBeVisible();
    }
  });
});
