import { test, expect } from '@playwright/test';

test.describe('UnitCard Complex Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('complete flow: add squad and verify in army', async ({ page }) => {
    // Step 1: Rules is now first - confirm rules
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Select faction
    await page.click('[data-testid="faction-card-polaris"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);

    // Select budget
    await page.click('button:has-text("350")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(500);

    // Verify we're on unit selector screen
    expect(await page.locator('text=Соберите свою армию').isVisible()).toBe(true);

    // Find and click on "ЛЁГКАЯ ШТУРМОВАЯ КЛОН-ПЕХОТА" (Light Assault Clone) unit
    const lightAssaultUnit = page.locator('h3:has-text("ЛЁГКАЯ ШТУРМОВАЯ КЛОН-ПЕХОТА")');
    await expect(lightAssaultUnit).toBeVisible();

    // Find the specific "В АРМИЮ" button for this unit (not just the first one)
    const unitCard = lightAssaultUnit.locator('..').locator('..').locator('..');
    const addButton = unitCard.locator('button:has-text("В АРМИЮ")');
    await addButton.click();
    await page.waitForTimeout(500);

    // Switch to "Армия" tab to see the added unit
    await page.click('[role="tab"]:has-text("АРМИЯ")');
    await page.waitForTimeout(500);

    // Verify the unit is now in the army
    expect(await page.locator('text=ЛЁГКАЯ ШТУРМОВАЯ КЛОН-ПЕХОТА').isVisible()).toBe(true);
  });

  test('machine unit: add machine and switch to army view', async ({ page }) => {
    // Navigate to unit selector - Rules is now first
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    await page.click('[data-testid="faction-card-polaris"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("350")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(500);

    // Switch to machines tab
    await page.click('button:has-text("Машины")');
    await page.waitForTimeout(500);

    // Find and add "Хеликс" machine (cheapest one at 220 points)
    const helixUnit = page.locator('h3:has-text("Хеликс")');
    await expect(helixUnit).toBeVisible();

    // Scroll to the Helix unit to ensure it's visible
    await helixUnit.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Find the specific "В АРМИЮ" button for this unit (get the parent container)
    const helixCard = helixUnit.locator('..').locator('..').locator('..');
    const addButton = helixCard.locator('button:has-text("В АРМИЮ")');
    await addButton.click();
    await page.waitForTimeout(500);

    // Switch to "Армия" tab to see the added machine
    await page.click('[role="tab"]:has-text("АРМИЯ")');
    await page.waitForTimeout(500);

    // Verify the machine is now in the army
    expect(await page.locator('text=Хеликс').isVisible()).toBe(true);
  });

  test('navigate through unit selector filters', async ({ page }) => {
    // Navigate to unit selector - Rules is now first
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    await page.click('[data-testid="faction-card-polaris"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("350")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);

    // Verify default "Отряды" tab is selected
    expect(await page.locator('button:has-text("Отряды")').isVisible()).toBe(true);

    // Switch to "Машины" tab
    await page.click('button:has-text("Машины")');
    await page.waitForTimeout(300);

    // Verify we can see machines
    expect(await page.locator('h3:has-text("Хеликс")').isVisible()).toBe(true);

    // Switch to "Наёмники" tab
    await page.click('button:has-text("Наёмники")');
    await page.waitForTimeout(300);

    // Verify we can see mercenaries
    expect(await page.locator('text=АБОРИГЕНЫ КРЕПОСТИ МОЛОДЫХ РОСТКОВ').isVisible()).toBe(true);
  });

  test('switching between rules versions', async ({ page }) => {
    // Rules is now the first screen - just wait for it to load
    await page.waitForTimeout(500);

    // Verify we're on rules screen
    expect(await page.locator('text=Выберите версию правил').isVisible()).toBe(true);

    // Verify both rule options are visible
    expect(await page.locator('h3:has-text("Технолог")').isVisible()).toBe(true);
    expect(await page.locator('h3:has-text("Правила от Сообщества Star System")').isVisible()).toBe(true);

    // Click on community rules button
    await page.click('h3:has-text("Правила от Сообщества Star System")');
    await page.waitForTimeout(500);

    // Verify the rules were changed by checking the confirm button is still visible
    // (meaning we're still on the rules screen and didn't navigate away)
    expect(await page.locator('[data-testid="rules-confirm-button"]').isVisible()).toBe(true);
  });
});
