import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, openNavigator } from './helpers/setup';

/**
 * Навигатор отрядов (плейтест): скорость дублируется в сантиметрах
 * (👣 5 (25см)), а ✓ на строке отмечает ВЕСЬ юнит походившим одним тапом
 * (повторный тап снимает) — без захода в карточку и ручной отметки бойцов.
 */
test.describe('Навигатор: сантиметры и «весь юнит походил»', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameSessionWithSquad(page);
    await waitForBattleDock(page);
  });

  test('в строке юнита скорость показана в шагах и сантиметрах', async ({ page }) => {
    await openNavigator(page);

    const row = page.getByTestId('expanded-unit-squad-test-1');
    await expect(row).toBeVisible();
    await expect(row).toContainText('👣 5 (25см)');
  });

  test('✓ на строке отмечает весь отряд походившим, повторный тап снимает', async ({ page }) => {
    await openNavigator(page);

    const header = page.locator('[data-testid="expanded-navigator"]').getByText(/активн\./);
    await expect(header).toHaveText(/активн\. 1/);

    const toggle = page.getByTestId('unit-done-toggle-squad-test-1');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();

    // Отряд ушёл из активных, кнопка залита (pressed)
    await expect(header).toHaveText(/активн\. 0/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // Повторный тап возвращает
    await toggle.click();
    await expect(header).toHaveText(/активн\. 1/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('тап по строке (не по ✓) по-прежнему выбирает юнита и закрывает список', async ({ page }) => {
    await openNavigator(page);

    await page.getByTestId('expanded-unit-squad-test-1').click();
    // Док схлопнулся — сфокусированная карточка юнита осталась в контенте
    await expect(page.getByTestId('expanded-navigator')).not.toBeVisible();
    await expect(page.getByTestId('soldier-card').first()).toBeVisible();
  });

  test('в строке видно, есть граната или потрачена', async ({ page }) => {
    await openNavigator(page);
    await expect(page.getByTestId('nav-grenade-squad-test-1')).toHaveAttribute('aria-label', 'Граната доступна');
  });

  test('потраченная граната помечена как потраченная', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'squad-test-1', grenadesUsed: true } });
    await waitForBattleDock(page);
    await openNavigator(page);

    await expect(page.getByTestId('nav-grenade-squad-test-1')).toHaveAttribute('aria-label', 'Граната потрачена');
  });

  test('прогресс хода в навигаторе: шапка ✓ X/Y и строка отряда ✓ x/y', async ({ page }) => {
    // 2 из 6 бойцов походили
    await setupGameSessionWithSquad(page, {
      unitOverrides: {
        instanceId: 'squad-test-1',
        actionsUsed: [
          { moved: false, shot: false, melee: false, done: true },
          { moved: false, shot: false, melee: false, done: true },
        ],
      },
    });
    await waitForBattleDock(page);

    // Кнопка «Завершить тур» НЕ висит постоянно (плейтест: как попап)
    await expect(page.getByTestId('floating-new-turn-button')).toHaveCount(0);

    await openNavigator(page);
    // Шапка: 2 походили из 6 живых; строка отряда: ✓ 2/6 бойцов
    await expect(page.getByTestId('nav-turn-progress')).toHaveText(/2\/6/);
    await expect(page.getByTestId('nav-turn-squad-test-1')).toHaveText(/2\/6/);

    // Весь отряд походил одним тапом ✓ → шапка зелёная, кнопка появилась
    await page.getByTestId('unit-done-toggle-squad-test-1').click();
    await expect(page.getByTestId('nav-turn-progress')).toHaveText(/6\/6/);
    // Лист перекрывает док — закрываем за ручку (сама кнопка под листом)
    await page.getByTestId('navigator-sheet').locator('div').first().click();
    await expect(page.getByTestId('floating-new-turn-button')).toBeVisible();
  });

  test('статы разбиты на короткие строки: живучесть и движение', async ({ page }) => {
    await openNavigator(page);

    const row = page.getByTestId('expanded-unit-squad-test-1');
    await expect(row).toContainText('♥ 6/6');
    await expect(row).toContainText('🛡 2');
    await expect(row).toContainText('👣 5 (25см)');
  });

  test('убитая плитка в сетке того же размера, что и живая', async ({ page }) => {
    // 5 живых + 1 убитый юнит → плиточная сетка
    const mkSquad = (n: number) => ({
      instanceId: `extra-${n}`, type: 'squad', instanceNumber: n + 1,
      data: { id: 'polaris_lineynaya_klon_pehota', name: `Отряд ${n}`, shortName: `О${n}`, faction: 'polaris', cost: 50, image: '', soldiers: [{ num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' }] },
      currentSoldiers: [0], deadSoldiers: [], actionsUsed: [],
    });
    const deadSquad = {
      instanceId: 'dead-1', type: 'squad', instanceNumber: 9,
      data: { id: 'polaris_lineynaya_klon_pehota', name: 'Погибший отряд', shortName: 'Погибшие', faction: 'polaris', cost: 50, image: '', soldiers: [{ num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' }] },
      currentSoldiers: [], deadSoldiers: [0], actionsUsed: [],
    };
    await setupGameSessionWithSquad(page, {
      extraUnits: [mkSquad(1), mkSquad(2), mkSquad(3), mkSquad(4), deadSquad],
    });
    await waitForBattleDock(page);
    await openNavigator(page);

    // Сетка; убитая плитка — то же фото h-24 (96px), что у живой
    const aliveTile = page.getByTestId('expanded-unit-squad-test-1');
    const deadTile = page.getByTestId('expanded-unit-dead-1');
    const aliveBox = await aliveTile.locator('.h-24').first().boundingBox();
    const deadBox = await deadTile.locator('.h-24').first().boundingBox();
    expect(aliveBox).toBeTruthy();
    expect(deadBox).toBeTruthy();
    expect(Math.round(deadBox!.height)).toBe(Math.round(aliveBox!.height));
  });
});
