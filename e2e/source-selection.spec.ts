import { test, expect } from '@playwright/test';

/**
 * Source Selection E2E tests
 * Tests the army list source selection flow
 */
test.describe('Source Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/app');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should display source selector after rules confirmation', async ({ page }) => {
    // Step 1: Click rules confirm button
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Should see source selection screen - check for header or step indicator
    const hasSourceHeader = await page.getByText('АРМ.ТЕХ ЛИСТЫ').count() > 0;
    const hasSourceCard = await page.getByTestId('source-card-star_system').count() > 0;

    // At least one should be visible
    expect(hasSourceHeader || hasSourceCard).toBeTruthy();
  });

  test('should select star_system source and continue to faction', async ({ page }) => {
    // Navigate to source selection
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Star System should be selected by default
    const starSystemCard = page.getByTestId('source-card-star_system');
    await expect(starSystemCard).toBeVisible();

    // Should have green border/checkmark for selected state
    await expect(starSystemCard).toHaveAttribute('aria-pressed', 'true');

    // Click confirm button
    await page.click('[data-testid="source-confirm-button"]');

    // Should be on faction selection screen
    await expect(page.getByTestId('faction-card-polaris')).toBeVisible();
  });

  test('should persist source selection in localStorage', async ({ page }) => {
    // Navigate to source selection
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Click on star_system source (should already be selected)
    await page.click('[data-testid="source-card-star_system"]');
    await page.waitForTimeout(300);

    // Verify localStorage has the source saved
    const savedSource = await page.evaluate(() => {
      return localStorage.getItem('bronepehota_army_list_source');
    });

    expect(savedSource).toBe('star_system');
  });

  test('should have tehnolog source enabled and selectable', async ({ page }) => {
    // Navigate to source selection
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Tehnolog source card is visible
    const tehnologCard = page.getByTestId('source-card-tehnolog');
    await expect(tehnologCard).toBeVisible();

    // Tehnolog is now enabled (imported with 33 verified squads) — select it
    await tehnologCard.click();

    // No longer shows the "needs community help" disabled marker
    await expect(tehnologCard.getByText(/Требуется помощь сообщества/)).toHaveCount(0);

    // The source album link is shown in the expanded card
    await expect(
      tehnologCard.locator('a[href*="album-122813310_260326962"]')
    ).toBeVisible();

    // Confirming with tehnolog proceeds to faction selection
    await page.click('[data-testid="source-confirm-button"]');
    await expect(page.getByTestId('faction-card-polaris')).toBeVisible();
  });

  test('should show 7 steps in progress indicator', async ({ page }) => {
    // Navigate to source selection
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Should have 7 step buttons: rules, source, faction, budget, mission, army, preparation
    const stepButtons = await page.locator('button[aria-label*="Шаг"]').count();
    expect(stepButtons).toBe(7);

    // Step 2 (Source) should be active
    const activeStep = page.locator('button[aria-current="step"]');
    await expect(activeStep).toBeVisible();
    await expect(activeStep).toHaveAttribute('aria-label', /Шаг 2.*Арм\.Тех/);
  });

  test('should allow going back to rules from source selection', async ({ page }) => {
    // Navigate to source selection
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Click on Step 1 (Правила) in the progress indicator to go back
    await page.click('button[aria-label*="Шаг 1"]');

    // Should be back on rules screen
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible();
  });

  test('should load default source on first visit', async ({ page }) => {
    // On first visit (after rules), should display star_system as default option
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Star system card should be visible and selected by default
    const starSystemCard = page.getByTestId('source-card-star_system');
    await expect(starSystemCard).toBeVisible();
    await expect(starSystemCard).toHaveAttribute('aria-pressed', 'true');

    // Click on the card to trigger localStorage save
    await starSystemCard.click();
    await page.waitForTimeout(300);

    // Now verify it's saved to localStorage
    const savedSource = await page.evaluate(() => {
      return localStorage.getItem('bronepehota_army_list_source');
    });

    expect(savedSource).toBe('star_system');
  });

  test('should expand source card details on click', async ({ page }) => {
    // Navigate to source selection
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Click on star_system card
    await page.click('[data-testid="source-card-star_system"]');

    // Should see description
    await expect(page.getByText(/Армейские листы от сообщества Star System/i)).toBeVisible();

    // Should see external link
    const externalLink = page.getByRole('link', { name: /Подробнее →/i });
    await expect(externalLink).toBeVisible();
    await expect(externalLink).toHaveAttribute('href', 'https://vk.com/bp_bnp');
  });

  test('should complete full flow: rules → source → faction → budget', async ({ page }) => {
    // Step 1: Rules confirmation
    await page.click('[data-testid="rules-confirm-button"]');

    // Step 2: Source selection (star_system should be pre-selected)
    await expect(page.getByTestId('source-card-star_system')).toBeVisible();
    await page.click('[data-testid="source-confirm-button"]');
    await page.waitForTimeout(500);

    // Step 3: Faction selection
    await page.click('[data-testid="faction-card-polaris"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="mission-confirm-button"]');

    // Step 4: Budget selection
    await expect(page.getByText('350')).toBeVisible();
    await page.click('button:has-text("350")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');

    // Should be on unit selection screen
    await expect(page.getByTestId('unit-selector')).toBeVisible();
  });
});
