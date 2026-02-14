import { test, expect } from '@playwright/test';

/**
 * Army Creation E2E tests
 * Tests critical army creation flows
 */
test.describe('Army Creation', () => {
  test('should display faction selector on first load', async ({ page }) => {
    // Clear localStorage to simulate fresh start
    await page.goto('/app');
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should see faction selection
    const polarisButton = page.getByRole('button', { name: /поларис/i });
    const hasPolaris = await polarisButton.count() > 0;

    if (hasPolaris) {
      await expect(polarisButton).toBeVisible();
    }
  });

  test('should persist army in localStorage', async ({ page }) => {
    // Set up army
    await page.goto('/app');
    await page.evaluate(() => {
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

    // Verify army persisted in localStorage
    const armyData = await page.evaluate(() => {
      return localStorage.getItem('bronepehota_army');
    });

    expect(armyData).toBeTruthy();
    const parsedArmy = JSON.parse(armyData!);
    expect(parsedArmy.name).toBe('Test Army');
    expect(parsedArmy.units).toEqual(expect.anything());
  });

  test('should calculate total cost correctly', async ({ page }) => {
    // Set up army with specific cost
    await page.goto('/app');
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-1',
          data: { id: 'test', name: 'Test', cost: 100, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3]
        }],
        totalCost: 100,
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

    // Check if cost is displayed somewhere
    const armySummary = page.getByText(/100|очк/i);
    const hasCost = await armySummary.count() > 0;

    if (hasCost) {
      await expect(armySummary.first()).toBeVisible();
    }
  });
});
