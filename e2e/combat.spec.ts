import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * Combat E2E tests
 * Tests critical combat gameplay mechanics
 */
test.describe('Combat Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should open combat modal', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'combat-unit-1' },
    });

    const unitCard = page.getByTestId('unit-nav-combat-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);

    const actionButton = page.getByRole('button', { name: /действие/i });
    const combatModal = page.getByTestId('bottom-sheet-combat-modal');
    const hasAction = await actionButton.count() > 0;
    const hasModal = await combatModal.count() > 0;
    expect(hasAction || hasModal).toBeTruthy();
  });

  test('should execute initiative roll', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'combat-unit-1' },
    });

    await page.waitForTimeout(500);

    const menuButton = page.locator('.ml-auto button:has(svg.lucide-more-vertical)').last();
    await menuButton.click({ force: true });
    await page.waitForTimeout(300);

    const initiativeButton = page.getByTestId('new-turn-button');
    await expect(initiativeButton).toBeVisible({ timeout: 5000 });
    await initiativeButton.click({ force: true });
    await page.waitForTimeout(500);

    const turnConfirm = page.locator('text=ЗАВЕРШИТЬ ТУР').first();
    if (await turnConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('button:has-text("ЗАВЕРШИТЬ")').last().click({ force: true });
      await page.waitForTimeout(500);
    }

    const initiativeModal = page.getByTestId('initiative-modal');
    await expect(initiativeModal.first()).toBeVisible({ timeout: 5000 });
  });

  test('should execute shot action flow', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'combat-unit-1' },
    });

    // Expand unit card
    const unitCard = page.getByTestId('unit-nav-combat-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);

    // Click action button to open combat modal
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(500);

    // Select shot action
    const shotButton = page.getByRole('button', { name: /выстрел/i });
    await expect(shotButton).toBeVisible({ timeout: 3000 });
    await shotButton.click();

    // Verify combat modal is showing (title "БОЕВАЯ СИСТЕМА" visible)
    await expect(page.getByText('БОЕВАЯ СИСТЕМА')).toBeVisible({ timeout: 3000 });

    // Verify parameters section is visible
    await expect(page.getByText('ПАРАМЕТРЫ АТАКИ')).toBeVisible({ timeout: 3000 });

    // Click "ВЫСТРЕЛИТЬ" button to execute
    const fireButton = page.getByRole('button', { name: /выстрелить/i });
    await expect(fireButton).toBeVisible({ timeout: 3000 });
    await fireButton.click();
    await page.waitForTimeout(500);
  });

  test('should execute melee action flow', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'combat-unit-1' },
    });

    // Expand unit card
    const unitCard = page.getByTestId('unit-nav-combat-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);

    // Click action button to open combat modal
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(500);

    // Select melee action (БЛИЖНИЙ БОЙ)
    const meleeButton = page.getByRole('button', { name: /ближний бой|бб/i });
    await expect(meleeButton).toBeVisible({ timeout: 3000 });
    await meleeButton.click();

    // Verify combat modal is showing
    await expect(page.getByText('БОЕВАЯ СИСТЕМА')).toBeVisible({ timeout: 3000 });

    // Melee has a confirm/execute button
    const executeButton = page.getByRole('button', { name: /выполнить|в бой|расчёт/i }).first();
    if (await executeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await executeButton.click();
      await page.waitForTimeout(500);
    }
  });
});
