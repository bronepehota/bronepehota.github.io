import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, clearStorage, swipeSoldierCard } from './helpers/setup';

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

    // DONE stays hidden for a panicking soldier
    const panickingDone = page.locator(
      '[data-testid="soldier-done-button"][data-soldier-index="0"]'
    );
    await expect(panickingDone).toHaveCount(0);

    // Killing the panicking soldier works — right swipe (the only kill path)
    await swipeSoldierCard(page, 0, 'right');
    await expect(page.getByTestId('dock-soldiers-alive')).toContainText('5/6');
    // Индикатор паники скрыт у убитого (череп на фото — статус смерти)
    await expect(indicatorInCard).toHaveCount(0);
  });
});
