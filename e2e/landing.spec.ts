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

    // Should have navigation to app
    const finalCTA = page.getByTestId('final-cta-button');
    await expect(finalCTA).toBeVisible();
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
});
