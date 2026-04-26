import { test } from '@playwright/test';

/**
 * Army Builder E2E tests
 * Tests army creation and unit management
 */
test.describe('Army Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Set up army state for unit selection step
    await page.goto('/app');
    await page.evaluate(() => {
      // Set up army state to be on unit-select step
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [],
        totalCost: 0,
        currentStep: 'unit-select',
        isInBattle: false,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'builder');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

});
