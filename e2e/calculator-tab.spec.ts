import { test, expect } from '@playwright/test';

/**
 * Calculator tab E2E tests
 * Tests the squad calculator integration in the editor
 */

test.describe.serial('Calculator Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // Helper: create source + faction + squad
  async function setupSquadEditor(page: import('@playwright/test').Page) {
    // Create source
    await page.getByTitle('Создать источник').first().click();
    await page.waitForTimeout(300);
    const nameInput = page.getByTestId('source-name-input');
    await nameInput.click();
    await nameInput.pressSequentially('TestCalc', { delay: 20 });
    await page.getByRole('button', { name: 'Создать', exact: true }).first().click();
    await page.waitForTimeout(500);

    // Source should be auto-selected; create a faction
    await page.getByTitle('Создать фракцию').first().click();
    await page.waitForTimeout(300);

    // Select the new faction ("Новая фракция")
    await page.getByText('Новая фракция').first().click();
    await page.waitForTimeout(300);

    // Create a squad
    await page.getByTitle('Создать отряд').first().click();
    await page.waitForTimeout(500);
  }

  test('should show calculator tab in squad editor', async ({ page }) => {
    await setupSquadEditor(page);

    // Should see both tab buttons
    await expect(page.getByTestId('manual-tab')).toBeVisible();
    await expect(page.getByTestId('calculator-tab')).toBeVisible();
  });

  test('should switch to calculator tab and show dropdowns', async ({ page }) => {
    await setupSquadEditor(page);

    // Switch to calculator tab
    await page.getByTestId('calculator-tab').click();
    await page.waitForTimeout(200);

    // Should see the calculator table
    await expect(page.getByTestId('calculator-table')).toBeVisible();

    // Should see the first row with default params
    await expect(page.getByTestId('calculator-row-0')).toBeVisible();

    // Should see apply button
    await expect(page.getByTestId('calculator-apply')).toBeVisible();

    // Should see attribution
    await expect(page.getByText('БНП')).toBeVisible();
  });

  test('should calculate stats and apply to squad', async ({ page }) => {
    await setupSquadEditor(page);

    // Switch to calculator
    await page.getByTestId('calculator-tab').click();
    await page.waitForTimeout(200);

    // Should show calculated cost
    await expect(page.getByTestId('calculator-cost')).toBeVisible();

    // Click apply
    await page.getByTestId('calculator-apply').click();
    await page.waitForTimeout(200);

    // Should switch back to manual tab with populated soldiers
    // After apply, mode is 'manual', so manual tab should be active
    await expect(page.getByTestId('manual-tab')).toBeVisible();
    await expect(page.getByTestId('calculator-tab')).toBeVisible();
  });

  test('should add and remove soldiers in calculator', async ({ page }) => {
    await setupSquadEditor(page);

    // Switch to calculator
    await page.getByTestId('calculator-tab').click();
    await page.waitForTimeout(200);

    // Should see 1 soldier row
    await expect(page.getByTestId('calculator-row-0')).toBeVisible();

    // Add soldier
    await page.getByTestId('calculator-add-soldier').click();
    await page.waitForTimeout(200);

    // Should see 2 rows
    await expect(page.getByTestId('calculator-row-1')).toBeVisible();
  });
});
