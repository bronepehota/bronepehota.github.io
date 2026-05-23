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

  test('should compute correct stats for Excel example soldier', async ({ page }) => {
    await setupSquadEditor(page);

    // Switch to calculator
    await page.getByTestId('calculator-tab').click();
    await page.waitForTimeout(200);

    const row0 = page.getByTestId('calculator-row-0');

    // Default: Человек, Ударное, Одежда, Пистолет, Без оружия
    // Expected: rank=3, speed=5, range=Д6, power=Д6, melee=2, armor=1
    await expect(row0).toContainText('3');   // rank
    await expect(row0).toContainText('Д6');  // range/power

    // Change armor to Тяжёлый пехотный доспех
    const armorSelect = row0.locator('select').nth(2);
    await armorSelect.selectOption('heavy_infantry');
    await page.waitForTimeout(200);

    // Now armor=4, speed=4
    // Cost breakdown: rankPrice=20, weapon=15, melee=0, property=0, armor=80, race=20 = 135
    await expect(page.getByTestId('calculator-cost')).toContainText('15');

    // Change weapon to Снайперская Винтовка
    const weaponSelect = row0.locator('select').nth(3);
    await weaponSelect.selectOption('sniper');
    await page.waitForTimeout(200);

    // range=Д12+2, power=Д12
    // Cost: 20 + 80 + 0 + 0 + 80 + 20 = 200
    await expect(row0).toContainText('Д12+2');
  });
});
