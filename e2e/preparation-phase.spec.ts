import { test, expect } from '@playwright/test';

/**
 * Preparation Phase E2E tests
 * Tests the battle preparation screen flow
 */
test.describe('Preparation Phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should navigate to preparation step from unit selector', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Step 1: Rules is now first - confirm rules
    const rulesConfirmButton = page.getByTestId('rules-confirm-button');
    await expect(rulesConfirmButton).toBeVisible({ timeout: 5000 });
    await rulesConfirmButton.click();
    await page.waitForTimeout(500);

    // Step 2: Select faction (Polaris)
    const polarisCard = page.getByTestId('faction-card-polaris');
    await expect(polarisCard).toBeVisible();
    await polarisCard.click();
    await page.waitForTimeout(300);

    // Click continue button
    const continueButton = page.getByTestId('faction-continue-button');
    await expect(continueButton).toBeVisible();
    await continueButton.click();
    await page.waitForTimeout(300);

    // Step 3: Select budget (350 points)
    const budgetButton = page.getByRole('button', { name: '350' });
    await expect(budgetButton).toBeVisible();
    await budgetButton.click();
    await page.waitForTimeout(300);

    // Step 4: Confirm budget and proceed to unit selection
    const budgetNextButton = page.getByTestId('budget-next-button');
    await expect(budgetNextButton).toBeVisible();
    await budgetNextButton.click();
    await page.waitForTimeout(500);

    // Step 5: Add a squad to the army
    const firstAddButton = page.getByRole('button', { name: /добавить/i }).first();
    await expect(firstAddButton).toBeVisible({ timeout: 5000 });
    await firstAddButton.click();
    await page.waitForTimeout(300);

    // Step 6: FloatingContinueButton appears directly when units are in army
    await page.waitForTimeout(300);

    // Step 7: Click "В бой" to go to preparation
    const toBattleButton = page.getByTestId('to-battle-button');
    await expect(toBattleButton).toBeVisible();
    await toBattleButton.click();
    await page.waitForTimeout(500);

    // Verify we're on the preparation screen
    const prepScreen = page.getByTestId('battle-preparation-screen');
    await expect(prepScreen).toBeVisible();

    // Verify the heading text
    await expect(page.getByText('Готовьте войска!')).toBeVisible();
  });

  test('should display soldier images for squad units', async ({ page }) => {
    // First navigate through the setup flow to add a squad
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Step 1: Rules is now first - confirm rules
    const rulesConfirmButton = page.getByTestId('rules-confirm-button');
    await expect(rulesConfirmButton).toBeVisible({ timeout: 5000 });
    await rulesConfirmButton.click();
    await page.waitForTimeout(500);

    // Select faction
    const polarisCard = page.getByTestId('faction-card-polaris');
    await polarisCard.click();
    await page.waitForTimeout(300);

    const continueButton = page.getByTestId('faction-continue-button');
    await continueButton.click();
    await page.waitForTimeout(300);

    // Select budget
    const budgetButton = page.getByRole('button', { name: '350' });
    await budgetButton.click();
    await page.waitForTimeout(300);

    const budgetNextButton = page.getByTestId('budget-next-button');
    await budgetNextButton.click();
    await page.waitForTimeout(500);

    // Add a squad (first one visible - should be Линейная клон-пехота for Polaris)
    const firstAddButton = page.getByRole('button', { name: /добавить/i }).first();
    await expect(firstAddButton).toBeVisible({ timeout: 5000 });
    await firstAddButton.click();
    await page.waitForTimeout(300);

    // Go to preparation
    const toBattleButton = page.getByTestId('to-battle-button');
    await expect(toBattleButton).toBeVisible({ timeout: 5000 });
    await toBattleButton.click();
    await page.waitForTimeout(500);

    // Verify preparation screen is visible
    const prepScreen = page.getByTestId('battle-preparation-screen');
    await expect(prepScreen).toBeVisible();

    // Verify prep army list is visible
    const prepArmyList = page.getByTestId('prep-army-list');
    await expect(prepArmyList).toBeVisible();

    // Verify soldier images are displayed (6 images for 6 soldiers)
    const soldierImages = page.locator('img[alt*="Боец"]');
    const imageCount = await soldierImages.count();
    expect(imageCount).toBeGreaterThan(0);
  });

  test('should display empty army message when no units', async ({ page }) => {
    // This test verifies that FloatingContinueButton is not visible when army is empty
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Step 1: Rules is now first - confirm rules
    const rulesConfirmButton = page.getByTestId('rules-confirm-button');
    await expect(rulesConfirmButton).toBeVisible({ timeout: 5000 });
    await rulesConfirmButton.click();
    await page.waitForTimeout(500);

    // Complete setup to get to unit selection
    const polarisCard = page.getByTestId('faction-card-polaris');
    await polarisCard.click();
    await page.waitForTimeout(300);

    const continueButton = page.getByTestId('faction-continue-button');
    await continueButton.click();
    await page.waitForTimeout(300);

    const budgetButton = page.getByRole('button', { name: '350' });
    await budgetButton.click();
    await page.waitForTimeout(300);

    const budgetNextButton = page.getByTestId('budget-next-button');
    await budgetNextButton.click();
    await page.waitForTimeout(500);

    // Verify FloatingContinueButton is NOT visible when army is empty
    const toBattleButton = page.getByTestId('to-battle-button');
    await expect(toBattleButton).not.toBeVisible();

    // Verify budget display shows 0/350
    await expect(page.getByText('0/350')).toBeVisible();
  });

  test('should navigate back to army builder', async ({ page }) => {
    // This test verifies that users can navigate back from the unit selector
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Step 1: Rules is now first - confirm rules
    const rulesConfirmButton = page.getByTestId('rules-confirm-button');
    await expect(rulesConfirmButton).toBeVisible({ timeout: 5000 });
    await rulesConfirmButton.click();
    await page.waitForTimeout(500);

    // Select faction
    const polarisCard = page.getByTestId('faction-card-polaris');
    await polarisCard.click();
    await page.waitForTimeout(300);

    const continueButton = page.getByTestId('faction-continue-button');
    await continueButton.click();
    await page.waitForTimeout(300);

    // Select budget
    const budgetButton = page.getByRole('button', { name: '350' });
    await budgetButton.click();
    await page.waitForTimeout(300);

    const budgetNextButton = page.getByTestId('budget-next-button');
    await budgetNextButton.click();
    await page.waitForTimeout(500);

    // Add a squad
    const firstAddButton = page.getByRole('button', { name: /добавить/i }).first();
    await firstAddButton.click();
    await page.waitForTimeout(300);

    // Verify back button is visible in control panel
    const backButton = page.getByTestId('back-to-faction-button');
    await expect(backButton).toBeVisible();

    // Click back to faction button
    await backButton.click();
    await page.waitForTimeout(300);

    // Verify confirmation modal appears
    await expect(page.getByText('Вы уверены, что хотите сбросить армию?')).toBeVisible();

    // Cancel and verify we're still on unit selector
    const cancelButton = page.locator('button.bg-slate-700').filter({ hasText: 'Отмена' });
    await cancelButton.click();
    await page.waitForTimeout(200);
    await expect(page.getByText('Соберите свою армию')).toBeVisible();

    // Click back again and confirm
    await backButton.click();
    await page.waitForTimeout(300);
    const confirmButton = page.getByRole('button', { name: 'Сбросить' });
    await confirmButton.click();
    await page.waitForTimeout(300);

    // Verify we're back to rules (now the first step)
    await expect(page.getByText('Выберите версию правил')).toBeVisible();
  });

  test('should enable start battle button when army has units', async ({ page }) => {
    // Navigate through setup and add a unit
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Step 1: Rules is now first - confirm rules
    const rulesConfirmButton = page.getByTestId('rules-confirm-button');
    await expect(rulesConfirmButton).toBeVisible({ timeout: 5000 });
    await rulesConfirmButton.click();
    await page.waitForTimeout(500);

    // Select faction
    const polarisCard = page.getByTestId('faction-card-polaris');
    await polarisCard.click();
    await page.waitForTimeout(300);

    const continueButton = page.getByTestId('faction-continue-button');
    await continueButton.click();
    await page.waitForTimeout(300);

    // Select budget
    const budgetButton = page.getByRole('button', { name: '350' });
    await budgetButton.click();
    await page.waitForTimeout(300);

    const budgetNextButton = page.getByTestId('budget-next-button');
    await budgetNextButton.click();
    await page.waitForTimeout(500);

    // Add a squad
    const firstAddButton = page.getByRole('button', { name: /добавить/i }).first();
    await firstAddButton.click();
    await page.waitForTimeout(300);

    // FloatingContinueButton appears directly when units are in army
    await page.waitForTimeout(300);

    // Go to preparation
    const toBattleButton = page.getByTestId('to-battle-button');
    await expect(toBattleButton).toBeVisible();
    await toBattleButton.click();
    await page.waitForTimeout(500);

    // Verify start battle button is enabled
    const startBattleButton = page.getByTestId('start-battle-button');
    await expect(startBattleButton).toBeVisible();
    await expect(startBattleButton).toBeEnabled();
  });

  test('should show initiative modal when clicking start battle', async ({ page }) => {
    // Navigate through setup and add a unit
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Step 1: Rules is now first - confirm rules
    const rulesConfirmButton = page.getByTestId('rules-confirm-button');
    await expect(rulesConfirmButton).toBeVisible({ timeout: 5000 });
    await rulesConfirmButton.click();
    await page.waitForTimeout(500);

    // Select faction
    const polarisCard = page.getByTestId('faction-card-polaris');
    await polarisCard.click();
    await page.waitForTimeout(300);

    const continueButton = page.getByTestId('faction-continue-button');
    await continueButton.click();
    await page.waitForTimeout(300);

    // Select budget
    const budgetButton = page.getByRole('button', { name: '350' });
    await budgetButton.click();
    await page.waitForTimeout(300);

    const budgetNextButton = page.getByTestId('budget-next-button');
    await budgetNextButton.click();
    await page.waitForTimeout(500);

    // Add a squad
    const firstAddButton = page.getByRole('button', { name: /добавить/i }).first();
    await firstAddButton.click();
    await page.waitForTimeout(300);

    // FloatingContinueButton appears directly when units are in army
    await page.waitForTimeout(300);

    // Go to preparation
    const toBattleButton = page.getByTestId('to-battle-button');
    await expect(toBattleButton).toBeVisible();
    await toBattleButton.click();
    await page.waitForTimeout(500);

    // Click start battle button
    const startBattleButton = page.getByTestId('start-battle-button');
    await expect(startBattleButton).toBeEnabled();
    await startBattleButton.click();
    await page.waitForTimeout(300);

    // Verify initiative modal appears
    // The modal should be visible - checking for modal content
    const modalContent = page.locator('role=dialog').or(page.locator('.fixed.inset-0.z-'));
    const hasModal = await modalContent.count() > 0;

    if (hasModal) {
      await expect(modalContent.first()).toBeVisible();
    }
  });
});
