import { test, expect } from '@playwright/test';

/**
 * E2E tests for pilot functionality
 *
 * Tests the complete flow of:
 * 1. Assigning a pilot to a machine
 * 2. Seeing pilot badge and navigation button on soldier card
 * 3. Navigating from pilot soldier to machine
 */

test.describe('Pilot Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // Navigate to app and wait for load
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Helper to navigate through setup flow to game session
   * Flow: Rules → Faction → Budget → Army Builder → Game Session
   */
  async function navigateToGameSession(page: any) {
    // First: Rules confirmation (rules is now the first screen)
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Second: Select faction
    await page.click('[data-testid="faction-card-polaris"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);

    // Third: Select budget
    await page.click('button:has-text("350")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(500);

    // Verify we're on unit selector screen (Army Builder)
    await page.waitForSelector('text=Соберите свою армию', { timeout: 5000 });
  }

  test('should show pilot badge and navigation button after assignment', async ({ page }) => {
    await navigateToGameSession(page);

    // Add a squad (clone squad has soldiers)
    const lightAssaultUnit = page.locator('h3:has-text("ЛЁГКАЯ ШТУРМОВАЯ КЛОН-ПЕХОТА")');
    const lightAssaultCard = lightAssaultUnit.locator('..').locator('..').locator('..');
    await lightAssaultCard.locator('button:has-text("В АРМИЮ")').click();
    await page.waitForTimeout(500);

    // Add a machine
    const machineUnit = page.locator('h3:has-text("Хеликс")');
    await machineUnit.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const machineCardForAdd = machineUnit.locator('..').locator('..').locator('..');
    await machineCardForAdd.locator('button:has-text("В АРМИЮ")').click();
    await page.waitForTimeout(1000);

    // Switch to army tab to see "НА БОЙ" button
    await page.click('[role="tab"]:has-text("АРМИЯ")');
    await page.waitForTimeout(500);

    // Click "НА БОЙ" to go to battle preparation
    await page.click('[data-testid="to-battle-button"]');
    await page.waitForTimeout(500);

    // Start battle
    await page.click('[data-testid="start-battle-button"]');
    await page.waitForTimeout(500);

    // Wait for initiative modal, then confirm
    const confirmButton = page.locator('[data-testid="confirm-initiative-button"]');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await page.waitForTimeout(1000);
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify we're in game session
    await expect(page.locator('button[data-testid^="unit-nav-"]')).toHaveCount(2, { timeout: 5000 });

    // Click machine navigation card
    await page.locator('button[data-testid^="unit-nav-"]').nth(1).click();
    await page.waitForTimeout(1500);

    // Verify machine view is visible (Урон button)
    await expect(page.locator('button:has-text("Урон")')).toBeVisible({ timeout: 3000 });

    // Click pilot assignment button
    await page.locator('[data-testid="assign-pilot-button"]').click();
    await page.waitForTimeout(500);

    // Select squad from modal (Линейная клон-пехота)
    const squadOption = page.locator('text=/клон.*пехота/i').first();
    await expect(squadOption).toBeVisible({ timeout: 3000 });
    await squadOption.click();
    await page.waitForTimeout(300);

    // Select first soldier - modal shows "Боец #1", "Боец #2", etc.
    const soldierOption = page.locator('text=/Боец.*#1/i').first();
    await expect(soldierOption).toBeVisible({ timeout: 3000 });
    await soldierOption.click();
    await page.waitForTimeout(300);

    // Confirm assignment
    await page.click('[data-testid="confirm-pilot-assignment"]');
    await page.waitForTimeout(500);

    // Navigate back to squad to see pilot indicators
    await page.locator('button[data-testid^="unit-nav-"]').nth(0).click();
    await page.waitForTimeout(500);

    // Check for pilot badge on first soldier
    const pilotBadge = page.locator('.relative.w-16.md\\:w-20').first()
      .locator('text=/ПИЛОТ/i');
    await expect(pilotBadge).toBeVisible();

    // Check for "К МАШИНЕ →" button instead of "ДЕЙСТВИЕ"
    const navigateButton = page.locator('text=/К МАШИНЕ/i');
    await expect(navigateButton).toBeVisible();

    // Should NOT have regular action button
    const actionButton = page.locator('.relative.p-1').first().locator('text=/ДЕЙСТВИЕ/i');
    await expect(actionButton).not.toBeVisible();
  });
});
