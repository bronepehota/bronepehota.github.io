import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, openSoldierSheet } from './helpers/setup';

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

  test('тап по фото открывает лист действий (граната/эффекты/фуллскрин)', async ({ page }) => {
    await openSoldierSheet(page, 0);

    const sheet = page.getByTestId('soldier-action-sheet');
    await expect(sheet.getByTestId('sheet-action-grenade')).toBeVisible({ timeout: 3000 });
    await expect(sheet.getByTestId('sheet-action-effects')).toBeVisible();
    await expect(sheet.getByTestId('sheet-action-fullscreen')).toBeVisible();
    // ⋯ на карточке больше нет
    await expect(page.getByTestId('action-menu-button')).toHaveCount(0);
  });

  test('строки листа действий высокие (≥48px) — удобно попадать с телефона', async ({ page }) => {
    await openSoldierSheet(page, 0);

    const grenade = page.getByTestId('sheet-action-grenade');
    await expect(grenade).toBeVisible({ timeout: 3000 });
    const box = await grenade.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(48);
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
