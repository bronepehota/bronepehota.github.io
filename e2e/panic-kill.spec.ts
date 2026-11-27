import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, clearStorage, swipeSoldierCard, expectAliveInNavigator } from './helpers/setup';

/**
 * #167 — a panicking soldier can be marked killed (rules §10: можно
 * уничтожить, нельзя действовать). Кнопки «череп» нет — убивает свайп
 * вправо по карточке; статус убитого несёт череп поверх фото.
 */
test.describe('Kill in panic (#167)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, {
      unitOverrides: {
        instanceId: 'panic-kill-unit-1',
        // Soldier 0 is panicking this turn
        panicState: [{ soldierIndex: 0, testRoll: 6, rank: 2, triggeredAtTurn: 1 }],
      },
    });
    await waitForBattleDock(page);
  });

  test('panicking soldier: индикатор паники вместо ГОТОВ, свайп вправо убивает', async ({ page }) => {
    // Индикатор «Отступает» в правой колонке (кнопки «череп» больше нет);
    // panic-indicator не несёт data-soldier-index — ищем внутри карточки бойца 0
    const indicatorInCard = page.getByTestId('soldier-card').first().getByTestId('panic-indicator');
    await expect(indicatorInCard).toBeVisible({ timeout: 5000 });

    // 2026-11-27: чипа «ГОТОВ» на фото нет ни у кого; у паникующего в листе
    // действий нет строки «Готов» (паникующий не действует, §10)
    await page.getByTestId('soldier-card').first().getByTestId('soldier-photo').click({ position: { x: 8, y: 8 } });
    const sheet = page.getByTestId('soldier-action-sheet');
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet.getByTestId('sheet-action-done')).toHaveCount(0);
    // …но убить паникующего можно — строка «Убит» на месте
    await expect(sheet.getByTestId('sheet-action-kill')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();

    // Killing the panicking soldier works — right swipe (the only kill path)
    await swipeSoldierCard(page, 0, 'right');
    await expectAliveInNavigator(page, 'panic-kill-unit-1', '5/6');
    // Индикатор паники скрыт у убитого (череп на фото — статус смерти)
    await expect(indicatorInCard).toHaveCount(0);
  });
});
