import { test, expect } from '@playwright/test';

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
        units: [{
          instanceId: 'test-1',
          data: { id: 'test', name: 'Test', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3]
        }],
        totalCost: 50,
        currentStep: 'unit-select', // This shows unit selector
        isInBattle: false,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'builder');
      localStorage.setItem('bronepehota_view_mode', 'army'); // Army view mode
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should toggle display mode', async ({ page }) => {
    // Find display mode toggle buttons by aria-label
    const detailedButton = page.getByRole('button', { name: /подробный вид/i, exact: false });
    const compactButton = page.getByRole('button', { name: /компактный вид/i, exact: false });

    // At least one should be visible in army view mode
    const hasDetailed = await detailedButton.count() > 0;
    const hasCompact = await compactButton.count() > 0;
    expect(hasDetailed || hasCompact).toBeTruthy();

    // Click to toggle to compact mode
    if (hasCompact) {
      await compactButton.first().click();
      await page.waitForTimeout(500);

      // Verify mode changed - compact button should now be pressed
      const isPressed = await compactButton.first().getAttribute('aria-pressed');
      expect(isPressed).toBe('true');
    }
  });
});
