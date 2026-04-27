import { test, expect } from '@playwright/test';

test.describe('Standalone Calculator', () => {
  test('should have calculator link on landing page', async ({ page }) => {
    await page.goto('/');
    const calculatorLink = page.getByTestId('landing-calculator-button');
    await expect(calculatorLink).toBeVisible();
  });

  test('should navigate to calculator from landing', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('landing-calculator-button').click();
    await page.waitForURL(/\/calculator/, { timeout: 3000 });
    expect(page.url()).toContain('/calculator');
  });

  test('should show action type tabs', async ({ page }) => {
    await page.goto('/calculator');
    await expect(page.getByTestId('calculator-action-shot')).toBeVisible();
    await expect(page.getByTestId('calculator-action-melee')).toBeVisible();
    await expect(page.getByTestId('calculator-action-grenade')).toBeVisible();
  });

  test('should show parameter inputs for shot', async ({ page }) => {
    await page.goto('/calculator');
    await expect(page.getByTestId('calculator-range')).toBeVisible();
    await expect(page.getByTestId('calculator-power')).toBeVisible();
    await expect(page.getByTestId('calculator-distance')).toBeVisible();
    await expect(page.getByTestId('calculator-armor')).toBeVisible();
  });

  test('should execute shot and show result', async ({ page }) => {
    await page.goto('/calculator');
    await page.getByTestId('calculator-execute-button').click();
    await page.waitForTimeout(300);
    const resultCard = page.locator('.bg-slate-800\\/60');
    await expect(resultCard.first()).toBeVisible();
  });

  test('should switch to melee parameters', async ({ page }) => {
    await page.goto('/calculator');
    await page.getByTestId('calculator-action-melee').click();
    await expect(page.getByTestId('calculator-attacker-melee')).toBeVisible();
    await expect(page.getByTestId('calculator-defender-melee')).toBeVisible();
  });

  test('should switch to grenade parameters', async ({ page }) => {
    await page.goto('/calculator');
    await page.getByTestId('calculator-action-grenade').click();
    await expect(page.getByTestId('calculator-soldier-rank')).toBeVisible();
  });

  test('should navigate back to landing', async ({ page }) => {
    await page.goto('/calculator');
    await page.getByTestId('calculator-back-link').click();
    await page.waitForURL(/\//, { timeout: 3000 });
    expect(page.url()).toContain('/');
  });

  test('should change rules version', async ({ page }) => {
    await page.goto('/calculator');
    const select = page.getByTestId('calculator-rules-select');
    await select.selectOption('tehnolog');
    await expect(select).toHaveValue('tehnolog');
  });
});
