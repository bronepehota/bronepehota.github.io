import { test, expect, Page } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * Battle dock navigation (playtest 2026-09-18):
 * the tiny-icon strip is gone; unit switching flows through the expanded
 * navigator — opened via the СПИСОК button (with an N/M finished counter)
 * or auto-opened when the focused unit finishes its turn by any path.
 *
 * Seed pattern mirrors e2e/machine-capture.spec.ts: in-battle army injected
 * via addInitScript (registered after clearStorage in beforeEach, and the
 * seed script itself clears localStorage).
 */

function seedBattleArmy(page: Page, units: unknown[], totalCost: number) {
  return page.addInitScript((payload: { units: unknown[]; totalCost: number }) => {
    const army = {
      name: 'Dock Navigator Army',
      faction: 'polaris',
      sourceId: 'star_system',
      units: payload.units,
      totalCost: payload.totalCost,
      currentStep: 'battle',
      isInBattle: true,
      currentTurn: 1,
    };
    localStorage.clear();
      localStorage.setItem('bronepehota_battle_tutorial_done', '1'); // инструктаж закрыт (см. playwright.config storageState)
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
    localStorage.setItem('bronepehota_view', 'game');
    localStorage.setItem('bronepehota_display_mode', 'detailed');
  }, { units, totalCost });
}

/** Two-soldier squad; doneFlags control per-soldier completion. */
const squad = (instanceId: string, name: string, instanceNumber: number, doneFlags: boolean[]) => ({
  instanceId,
  type: 'squad',
  data: {
    id: `polaris_${instanceId}`,
    name,
    shortName: name,
    faction: 'polaris',
    cost: 50,
    image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
    soldiers: [
      { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
    ],
  },
  instanceNumber,
  currentSoldiers: [0, 1],
  deadSoldiers: [],
  actionsUsed: doneFlags.map(done => ({ moved: done, shot: false, melee: false, done })),
});

const deadMachine = (instanceId: string, instanceNumber: number) => ({
  instanceId,
  type: 'machine',
  data: {
    id: 'polaris_legkiy_shturmovoy_ekranoplan',
    name: 'Лёгкий штурмовой экраноплан',
    shortName: 'Экраноплан',
    faction: 'polaris',
    cost: 150,
    rank: 2,
    fire_rate: 2,
    ammo_max: 20,
    durability_max: 16,
    durability: 16,
    ammo: 20,
    image: '/images/machines/polaris/legkiy_shturmovoy_ekranoplan/1.png',
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 },
    ],
    weapons: [{ name: 'Пушка', range: 'D12', power: '2D20', special: '' }],
  },
  instanceNumber,
  currentSoldiers: [],
  deadSoldiers: [],
  actionsUsed: [],
  durability: 0,
  currentDurability: 0,
  ammo: 20,
  currentAmmo: 20,
  machineShotsUsed: 0,
});

async function gotoBattle(page: Page) {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });
}

test.describe('Dock navigator (СПИСОК button + auto-open)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('СПИСОК counter reflects finished units; open via button, close by row select', async ({ page }) => {
    await seedBattleArmy(page, [
      squad('dn-active', 'Линейная клон-пехота', 1, [false, false]),
      squad('dn-done', 'Штурмовая клон-пехота', 2, [true, true]),
      deadMachine('dn-dead-machine', 3),
    ], 250);
    await gotoBattle(page);

    // done + dead = 2 of 3
    await expect(page.getByTestId('dock-nav-counter')).toHaveText('2/3');

    // The tiny-icon strip is gone for good
    await expect(page.locator('[data-testid^="unit-nav-"]')).toHaveCount(0);

    // Open the navigator
    const expandedNav = page.getByTestId('expanded-navigator');
    await expect(expandedNav).not.toBeVisible();
    await page.getByTestId('dock-open-navigator').click();
    await expect(expandedNav).toBeVisible();

    // Selecting a row closes the navigator and keeps the dock showing the unit
    await page.getByTestId('expanded-unit-dn-active').click();
    await expect(expandedNav).not.toBeVisible();
    await expect(page.getByTestId('dock-unit-name')).toHaveText('Линейная клон-пехота');
  });

  test('auto-opens after the dock «Готов» marks the focused unit done', async ({ page }) => {
    await seedBattleArmy(page, [
      squad('dn-a', 'Линейная клон-пехота', 1, [false, false]),
      squad('dn-b', 'Штурмовая клон-пехота', 2, [false, false]),
    ], 100);
    await gotoBattle(page);

    // Finishing unit A's turn opens the navigator automatically
    await page.getByTestId('dock-unit-done').click();
    await expect(page.getByTestId('expanded-navigator')).toBeVisible({ timeout: 3000 });

    // The counter advanced while we were away (info bar hidden when expanded,
    // so re-check after closing via row select of unit B)
    await page.getByTestId('expanded-unit-dn-b').click();
    await expect(page.getByTestId('expanded-navigator')).not.toBeVisible();
    await expect(page.getByTestId('dock-unit-name')).toHaveText('Штурмовая клон-пехота');
    await expect(page.getByTestId('dock-nav-counter')).toHaveText('1/2');
  });

  test('auto-opens after combat auto-complete finishes the last alive soldier', async ({ page }) => {
    await seedBattleArmy(page, [
      // soldier 0 active, soldier 1 done — one shot away from a finished unit
      squad('dn-shooter', 'Линейная клон-пехота', 1, [false, true]),
      squad('dn-other', 'Штурмовая клон-пехота', 2, [false, false]),
    ], 100);
    await gotoBattle(page);

    // Full shot flow with auto-complete (default on): the acting soldier
    // gets done on ПРИНЯТЬ → the squad completes → navigator auto-opens.
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });

    const shotButton = page.getByRole('button', { name: /выстрел/i });
    await expect(shotButton).toBeVisible({ timeout: 3000 });
    await shotButton.click();

    const fireButton = page.getByRole('button', { name: /выстрелить/i });
    await expect(fireButton).toBeVisible({ timeout: 3000 });
    await fireButton.click();

    const applyButton = page.getByRole('button', { name: /принять/i });
    await expect(applyButton).toBeVisible({ timeout: 3000 });
    await applyButton.click();

    await expect(page.getByTestId('expanded-navigator')).toBeVisible({ timeout: 3000 });
  });

  test('does NOT auto-open when every unit is done — floating end-turn shows instead', async ({ page }) => {
    await seedBattleArmy(page, [
      squad('dn-last', 'Линейная клон-пехота', 1, [false, false]),
      squad('dn-already', 'Штурмовая клон-пехота', 2, [true, true]),
    ], 100);
    await gotoBattle(page);

    await page.getByTestId('dock-unit-done').click();

    // No active units remain: the floating «Завершить тур» takes over,
    // the navigator must not cover it.
    await expect(page.getByTestId('floating-new-turn-button')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('expanded-navigator')).not.toBeVisible();
  });

  // Плейтест 2026-09-20: «на навигатор должно легко переключаться — свайп
  // вверх на всей нижней панели, сейчас паршиво работало». Старый порог
  // читался из устаревшего замыкания и жест почти не срабатывал.
  test('свайп вверх по панели (от кнопки «Готов») открывает навигатор, кнопка не срабатывает', async ({ page }) => {
    await seedBattleArmy(page, [
      squad('dn-swipe', 'Линейная клон-пехота', 1, [false, false]),
      squad('dn-other', 'Штурмовая клон-пехота', 2, [false, false]),
    ], 100);
    await gotoBattle(page);

    // Тянем вверх с 96px, начиная прямо на кнопке «Готов»: жест открывает
    // навигатор, а клик по кнопке гасится — юнит не отмечается походившим
    const box = await page.getByTestId('dock-unit-done').boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(cx, cy - i * 12, { steps: 2 });
    }
    await page.mouse.up();

    await expect(page.getByTestId('expanded-navigator')).toBeVisible({ timeout: 3000 });

    // Свайп не задел управление: счётчик походивших не двинулся
    await page.getByTestId('expanded-unit-dn-swipe').click();
    await expect(page.getByTestId('expanded-navigator')).not.toBeVisible();
    await expect(page.getByTestId('dock-nav-counter')).toHaveText('0/2');
  });

  // Якорь меню ⋮ — absolute над доком (док в потоке): никаких вычисленных
  // bottom-смещений, меню прижато к верхней кромке панели
  test('меню ⋮ открывается над панелью дока', async ({ page }) => {
    await seedBattleArmy(page, [
      squad('dn-menu', 'Линейная клон-пехота', 1, [false, false]),
    ], 50);
    await gotoBattle(page);

    await page.getByTestId('dock-menu-toggle').click();
    const menu = page.locator('[data-dock-menu-root]');
    await expect(menu).toBeVisible();

    const m = await page.evaluate(() => ({
      menuBottom: document.querySelector('[data-dock-menu-root]')!.getBoundingClientRect().bottom,
      dockTop: document.querySelector('[data-testid="unit-dock"]')!.getBoundingClientRect().top,
    }));
    expect(m.menuBottom).toBeLessThanOrEqual(m.dockTop + 1);
  });
});
