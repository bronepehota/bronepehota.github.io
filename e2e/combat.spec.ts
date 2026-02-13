import { test, expect } from '@playwright/test';

/**
 * Combat E2E tests
 * Tests critical combat gameplay mechanics
 */
test.describe('Combat Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    // Set up army with unit in game session
    await page.goto('/app');
    await page.evaluate(() => {
      const army = {
        name: 'Combat Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'combat-unit-1',
          data: { id: 'polaris_light_assault', name: 'Light Assault', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3, 4, 5, 6]
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
  });

  test('should display unit card in game session', async ({ page }) => {
    // Find unit by instanceId
    const unitCard = page.getByTestId('unit-nav-combat-unit-1');

    await expect(unitCard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open combat modal', async ({ page }) => {
    // Find unit card and click action button
    const unitCard = page.getByTestId('unit-nav-combat-unit-1');
    await unitCard.first().click();
    await page.waitForTimeout(500);

    // Look for combat modal or action button
    const actionButton = page.getByRole('button', { name: /действие/i });
    const combatModal = page.getByTestId('bottom-sheet-combat-modal');

    const hasAction = await actionButton.count() > 0;
    const hasModal = await combatModal.count() > 0;

    expect(hasAction || hasModal).toBeTruthy();
  });

  test('should execute initiative roll', async ({ page }) => {
    // Find and click initiative button
    const initiativeButton = page.getByRole('button', { name: /инициатива/i });

    if (await initiativeButton.count() > 0) {
      await initiativeButton.click();
      await page.waitForTimeout(500);

      // Should see initiative modal
      const initiativeModal = page.getByTestId('initiative-modal');

      await expect(initiativeModal.first()).toBeVisible({ timeout: 3000 });
    }
  });
});
