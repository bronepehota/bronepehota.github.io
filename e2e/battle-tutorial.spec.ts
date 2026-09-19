import { test, expect, type Page } from '@playwright/test';
import { clearStorage, setupGameSessionWithSquad } from './helpers/setup';

/**
 * «Боевой инструктаж» — интерактивный туториал при первом заходе в бой:
 * свайпы на ДЕМО-карточке (реальный взвод не трогается) + шаг про СПИСОК.
 * Сидим вручную (не через setupGameSessionWithSquad — тот закрывает туториал).
 */
test.describe('Battle tutorial', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.addInitScript(() => {
      // clearStorage сеет флаг «туториал пройден» — этой спеке он нужен живым
      localStorage.removeItem('bronepehota_battle_tutorial_done');
      const soldiers = Array.from({ length: 3 }, (_, i) => ({
        num: i + 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '',
      }));
      localStorage.setItem('bronepehota_army', JSON.stringify({
        name: 'T', faction: 'polaris', sourceId: 'star_system', totalCost: 50,
        currentStep: 'battle', isInBattle: true, currentTurn: 1,
        units: [{
          instanceId: 'tu-1', type: 'squad', instanceNumber: 1,
          data: {
            id: 'polaris_lineynaya_klon_pehota', name: 'Линейная клон-пехота', shortName: 'Линейная',
            faction: 'polaris', cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png', soldiers,
          },
          currentSoldiers: [0, 1, 2], deadSoldiers: [], actionsUsed: [],
        }],
      }));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });
  });

  async function dragDemo(page: Page, dir: 'left' | 'right') {
    const card = page.getByTestId('battle-tutorial-demo-card');
    // После смены шага карточка ещё возвращается transform-ом (transition-all)
    // — ждём, пока bbox перестанет плыть, иначе стартовая точка смещена
    await card.waitFor({ state: 'visible' });
    let box = await card.boundingBox();
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(120);
      const next = await card.boundingBox();
      if (box && next && Math.abs(next.x - box.x) < 1 && Math.abs(next.width - box.width) < 1) break;
      box = next;
    }
    expect(box).toBeTruthy();
    const startX = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    // 16 мелких шагов на 120px: под нагрузкой фулл-рана события крупными
    // шагами слипались и жест не дотягивал до порога 56px
    await page.mouse.move(startX + (dir === 'left' ? -120 : 120), y, { steps: 16 });
    await page.mouse.up();
  }

  test('полный проход: свайпы на демо-карточке, реальный взвод нетронут', async ({ page }) => {
    await page.goto('/app');
    const tutorial = page.getByTestId('battle-tutorial');
    await expect(tutorial).toBeVisible({ timeout: 15000 });
    await expect(tutorial).toContainText('СВАЙП ВЛЕВО — ГОТОВ');

    // Демо-карточка на месте, реальный боец ещё ничего не сделал
    await expect(page.getByTestId('battle-tutorial-demo-card')).toBeVisible();

    await dragDemo(page, 'left');
    await expect(tutorial).toContainText('СВАЙП ВПРАВО — УБИТ');

    await dragDemo(page, 'right');
    await expect(tutorial).toContainText('ШПАРГАЛКА БОЯ');
    await expect(tutorial).toContainText('Статы бойца');

    await page.getByTestId('battle-tutorial-finish').click();
    await expect(tutorial).not.toBeVisible();

    // Флаг выставлен — повторного показа не будет
    const flag = await page.evaluate(() => localStorage.getItem('bronepehota_battle_tutorial_done'));
    expect(flag).toBe('1');

    // Реальный взвод не затронут жестами туториала
    await expect(page.getByTestId('soldier-done-button').nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('soldier-kill-button').nth(0)).toHaveAttribute('aria-pressed', 'false');

    // Скорость в доке: шаги + сантиметры (сид: speed 5 × factor 5)
    await expect(page.getByTestId('dock-speed-badge')).toContainText('(25см)');
  });

  test('«Пропустить» закрывает и выставляет флаг', async ({ page }) => {
    await page.goto('/app');
    const tutorial = page.getByTestId('battle-tutorial');
    await expect(tutorial).toBeVisible({ timeout: 15000 });

    await page.getByTestId('battle-tutorial-skip').click();
    await expect(tutorial).not.toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('bronepehota_battle_tutorial_done'))).toBe('1');
  });

  test('из меню ⋮ инструктаж можно пройти заново', async ({ page }) => {
    await page.goto('/app');
    const tutorial = page.getByTestId('battle-tutorial');
    await expect(tutorial).toBeVisible({ timeout: 15000 });
    await page.getByTestId('battle-tutorial-skip').click();
    await expect(tutorial).not.toBeVisible();

    await page.getByTestId('dock-menu-toggle').click();
    await page.getByTestId('battle-tutorial-replay').click();
    await expect(tutorial).toBeVisible();
    await expect(tutorial).toContainText('СВАЙП ВЛЕВО — ГОТОВ');
  });
});

// «Не гаснуть» (wake lock): тумблер в ⋮ — переключение, персист флага,
// меню остаётся открытым (внутренние клики его не закрывают)
test.describe('Wake lock toggle', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('переключается, флаг персистится, меню не закрывается', async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'wake-unit-1' } });

    await page.getByTestId('dock-menu-toggle').click();
    const toggle = page.getByTestId('wake-lock-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toBeVisible(); // меню не закрылось
    expect(await page.evaluate(() => localStorage.getItem('bronepehota_wake_lock_enabled'))).toBe('1');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => localStorage.getItem('bronepehota_wake_lock_enabled'))).toBe('0');
  });
});
