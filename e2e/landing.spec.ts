import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * Landing page E2E tests
 * Tests the main marketing/landing page
 */
test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    // Check main CTA button
    const ctaButton = page.getByTestId('landing-cta-button');
    await expect(ctaButton).toBeVisible();
  });

  test('should navigate to app when clicking CTA', async ({ page }) => {
    const ctaButton = page.getByTestId('landing-cta-button');
    await ctaButton.click();
    await page.waitForLoadState('networkidle');

    // Wait for URL to update to /app (client-side routing might be delayed)
    await page.waitForURL(/\/app/, { timeout: 3000 });

    // Should be on app page now
    const url = page.url();
    expect(url).toContain('/app'); // Should be on /app route
  });

  test('модульная строка: ЭНЦИКЛОПЕДИЯ ведёт в энциклопедию', async ({ page }) => {
    await page.getByTestId('landing-encyclopedia-button').click();
    await page.waitForURL(/\/encyclopedia/);
  });

  test('карточка фракции ведёт в энциклопедию фракций', async ({ page }) => {
    await page.getByTestId('landing-faction-card').first().click();
    await page.waitForURL(/\/encyclopedia\/factions/);
  });

  test('брифинг новичка: интро → «Начать» → выбор правил; повторный вход без интро', async ({ page }) => {
    await page.getByTestId('landing-cta-button').click();
    await expect(page.getByTestId('intro-briefing')).toBeVisible({ timeout: 30000 });
    await page.getByTestId('intro-start-button').click();
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 10000 });

    // setup_step сохранён → интро больше не показывается
    await page.reload();
    await expect(page.getByTestId('intro-briefing')).toBeHidden({ timeout: 30000 });
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 10000 });
  });
});
