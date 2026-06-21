import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('UnitCard Complex Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('complete flow: add squad and verify in army', async ({ page }) => {
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="source-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="faction-card-polaris"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="mission-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("350")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(500);

    expect(await page.locator('text=Соберите свою армию').isVisible()).toBe(true);

    const lightAssaultUnit = page.locator('h3:has-text("ЛЁГКАЯ ШТУРМОВАЯ КЛОН-ПЕХОТА")');
    await expect(lightAssaultUnit).toBeVisible();

    const unitCard = lightAssaultUnit.locator('..').locator('..').locator('..');
    const addButton = unitCard.locator('button:has-text("В АРМИЮ")');
    await addButton.click();
    await page.waitForTimeout(500);

    expect(await page.locator('text=ЛЁГКАЯ ШТУРМОВАЯ КЛОН-ПЕХОТА').isVisible()).toBe(true);
  });

  test('machine unit: add machine and switch to army view', async ({ page }) => {
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="source-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="faction-card-polaris"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="mission-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("350")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Машины")');
    await page.waitForTimeout(500);

    const helixUnit = page.locator('h3:has-text("Хеликс")');
    await expect(helixUnit).toBeVisible();
    await helixUnit.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const helixCard = helixUnit.locator('..').locator('..').locator('..');
    const addButton = helixCard.locator('button:has-text("В АРМИЮ")');
    await addButton.click();
    await page.waitForTimeout(500);

    expect(await page.locator('text=×1').isVisible()).toBe(true);
  });

  test('navigate through unit selector filters', async ({ page }) => {
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="source-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="faction-card-polaris"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="mission-confirm-button"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("350")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);

    expect(await page.locator('button:has-text("Отряды")').isVisible()).toBe(true);

    await page.click('button:has-text("Машины")');
    await page.waitForTimeout(300);
    expect(await page.locator('h3:has-text("Хеликс")').isVisible()).toBe(true);

    await page.click('button:has-text("Наёмники")');
    await page.waitForTimeout(300);
    expect(await page.locator('text=АБОРИГЕНЫ КРЕПОСТИ МОЛОДЫХ РОСТКОВ').isVisible()).toBe(true);
  });

  test('switching between rules versions', async ({ page }) => {
    await page.waitForTimeout(500);

    expect(await page.locator('text=Выберите версию правил').isVisible()).toBe(true);
    expect(await page.locator('h3:has-text("Технолог")').isVisible()).toBe(true);
    expect(await page.locator('h3:has-text("Правила от Сообщества Star System")').isVisible()).toBe(true);

    await page.click('h3:has-text("Правила от Сообщества Star System")');
    await page.waitForTimeout(500);

    expect(await page.locator('[data-testid="rules-confirm-button"]').isVisible()).toBe(true);
  });
});
