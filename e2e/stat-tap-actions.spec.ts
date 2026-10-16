import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, openActionMenu } from './helpers/setup';

/**
 * Редизайн карточки бойца в бою (плейтест 2026-10-15):
 *  — тап по дальности/мощности = сразу ПАРАМЕТРЫ ВЫСТРЕЛА (мимо экрана
 *    выбора действия), тап по ББ = сразу ПАРАМЕТРЫ БЛИЖНЕГО БОЯ;
 *  — ⋯ в углу = прежнее меню всех действий (граната, захват);
 *  — кнопки выбора действия крупные (мобильная эргономика).
 */
test.describe('Карточка бойца: тап по стату = прямое действие', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameSessionWithSquad(page);
    await waitForBattleDock(page);
  });

  test('тап по дальности открывает модал сразу в параметрах выстрела', async ({ page }) => {
    await page.getByTestId('soldier-card').nth(0).getByTestId('stat-badge-range').click();

    await expect(page.getByTestId('bottom-sheet-combat-modal')).toBeVisible();
    // Параметры выстрела без экрана выбора действия (кнопка пуска — маркер фазы)
    await expect(page.getByRole('button', { name: 'ВЫСТРЕЛИТЬ' })).toBeVisible({ timeout: 3000 });
  });

  test('тап по стату ББ открывает модал сразу в параметрах ближнего боя', async ({ page }) => {
    await page.getByTestId('soldier-card').nth(0).getByTestId('stat-badge-melee').click();

    await expect(page.getByTestId('bottom-sheet-combat-modal')).toBeVisible();
    await expect(page.getByRole('button', { name: 'АТАКОВАТЬ' })).toBeVisible({ timeout: 3000 });
  });

  test('⋯ в углу открывает меню всех действий (выстрел/ББ/граната)', async ({ page }) => {
    await openActionMenu(page, 0);

    const modal = page.getByTestId('bottom-sheet-combat-modal');
    await expect(modal.getByRole('button', { name: /выстрел/i })).toBeVisible({ timeout: 3000 });
    await expect(modal.getByRole('button', { name: /ближний бой/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /граната/i })).toBeVisible();
  });

  test('кнопки выбора действия высокие (≥56px) — удобно попадать с телефона', async ({ page }) => {
    await openActionMenu(page, 0);

    const shot = page.getByTestId('bottom-sheet-combat-modal').getByRole('button', { name: /ближний бой/i });
    await expect(shot).toBeVisible({ timeout: 3000 });
    const box = await shot.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(56);
  });

  test('кнопка пуска (ВЫСТРЕЛИТЬ) крупная — под мобильник', async ({ page }) => {
    await page.getByTestId('soldier-card').nth(0).getByTestId('stat-badge-power').click();
    const fire = page.getByRole('button', { name: 'ВЫСТРЕЛИТЬ' });
    await expect(fire).toBeVisible({ timeout: 3000 });
    const box = await fire.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(56);
  });
});
