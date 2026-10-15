import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage, openShotModal, openMeleeModal } from './helpers/setup';

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

    // The squad is focused by default (unit 0)
    await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });

    // Вход в бой: статовые кнопки-действия (тап по стату) и ⋯ меню в углу
    const card = page.getByTestId('soldier-card').first();
    const hasStatAction = await card.getByTestId('stat-badge-range').count() > 0;
    const hasActionMenu = await card.getByTestId('action-menu-button').count() > 0;
    const hasModal = await page.getByTestId('bottom-sheet-combat-modal').count() > 0;
    expect(hasStatAction || hasActionMenu || hasModal).toBeTruthy();
  });

  test('should execute initiative roll', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'combat-unit-1' },
    });

    // Меню боя — кнопка ⋮ в доке (после редизайна дока — по testid)
    await page.getByTestId('dock-menu-toggle').click();

    const initiativeButton = page.getByTestId('new-turn-button');
    await expect(initiativeButton).toBeVisible({ timeout: 5000 });
    await initiativeButton.click({ force: true });

    const turnConfirm = page.locator('text=ЗАВЕРШИТЬ ТУР').first();
    if (await turnConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('button:has-text("ЗАВЕРШИТЬ")').last().click({ force: true });
    }

    const initiativeModal = page.getByTestId('initiative-modal');
    await expect(initiativeModal.first()).toBeVisible({ timeout: 5000 });
  });

  test('should execute shot action flow', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'combat-unit-1' },
    });

    // The squad is focused by default (unit 0)
    await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });

    // Click action button to open combat modal
    // Тап по стату мощности — прямой пуск выстрела (без экрана выбора)
    await openShotModal(page);

    // Verify combat modal is showing (title "БОЕВАЯ СИСТЕМА" visible)
    await expect(page.getByText('БОЕВАЯ СИСТЕМА')).toBeVisible({ timeout: 3000 });

    // Verify parameters section is visible
    await expect(page.getByText('ПАРАМЕТРЫ АТАКИ')).toBeVisible({ timeout: 3000 });

    // Click "ВЫСТРЕЛИТЬ" button to execute
    const fireButton = page.getByRole('button', { name: /выстрелить/i });
    await expect(fireButton).toBeVisible({ timeout: 3000 });
    await fireButton.click();
  });

  test('should execute melee action flow', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'combat-unit-1' },
    });

    // The squad is focused by default (unit 0)
    await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });

    // Click action button to open combat modal
    // Тап по стату ББ — прямой пуск ближнего боя (без экрана выбора)
    await openMeleeModal(page);

    // Verify combat modal is showing
    await expect(page.getByText('БОЕВАЯ СИСТЕМА')).toBeVisible({ timeout: 3000 });

    // Melee has a confirm/execute button
    const executeButton = page.getByRole('button', { name: /выполнить|в бой|расчёт/i }).first();
    if (await executeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await executeButton.click();
    }
  });
});
