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
        units: [],
        totalCost: 0,
        currentStep: 'unit-select',
        isInBattle: false,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'builder');
      localStorage.setItem('bronepehota_view_mode', 'army');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should display display mode toggle', async ({ page }) => {
    // Find display mode toggle buttons by aria-label (more reliable than role)
    const compactButton = page.getByLabel('Компактный вид').first();
    const detailedButton = page.getByLabel('Подробный вид').first();

    // At least one should be visible in army view mode
    const hasCompact = await compactButton.count() > 0;
    const hasDetailed = await detailedButton.count() > 0;
    expect(hasCompact || hasDetailed).toBeTruthy();

    // Click to toggle to compact mode
    if (hasCompact) {
      await compactButton.click();
      await page.waitForTimeout(500);

      // Verify mode changed - compact button should now be pressed
      const isPressed = await compactButton.getAttribute('aria-pressed');
      expect(isPressed).toBe('true');
    }
  });
});
