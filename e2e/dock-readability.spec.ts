import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock } from './helpers/setup';

/**
 * Battle dock readability (playtest fix): the current-unit info bar used to be
 * a single text-xs row — name truncated into the badges, machine durability at
 * text-[9px], done toggle an icon-only 44px square. Now it is two rows: the
 * unit name on its own line, larger stats badges, and a labeled filled
 * «ГОТОВ»/«ОТМЕНА» button.
 */
test.describe('Battle dock readability', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'dock-readability-unit-1' },
    });
    await waitForBattleDock(page);
    await expect(page.getByTestId('unit-dock')).toBeVisible();
    await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });
  });

  test('unit name sits on its own line above the stats row', async ({ page }) => {
    const name = page.getByTestId('dock-unit-name');
    const done = page.getByTestId('dock-unit-done');
    await expect(name).toBeVisible();
    await expect(name).toHaveText(/ЛИНЕЙНАЯ КЛОН-ПЕХОТА/i);

    const nameBox = await name.boundingBox();
    const doneBox = await done.boundingBox();
    expect(nameBox).toBeTruthy();
    expect(doneBox).toBeTruthy();

    // Own line proof: the name row ends strictly above the stats row
    // (the done button lives in row 2, below the full-width name row).
    expect(nameBox!.y + nameBox!.height).toBeLessThanOrEqual(doneBox!.y + 0.5);
  });

  test('alive-soldiers aggregate shows живые/все for the squad', async ({ page }) => {
    const badge = page.getByTestId('dock-soldiers-alive');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('6/6');
  });

  test('labeled filled done button toggles the squad state', async ({ page }) => {
    const done = page.getByTestId('dock-unit-done');
    await expect(done).toBeVisible();
    await expect(done).toHaveText(/ГОТОВ/i);
    await expect(done).toHaveAttribute('aria-pressed', 'false');

    await done.click();
    await expect(done).toHaveAttribute('aria-pressed', 'true');
    await expect(done).toHaveText(/ОТМЕНА/i);

    await done.click();
    await expect(done).toHaveAttribute('aria-pressed', 'false');
    await expect(done).toHaveText(/ГОТОВ/i);
  });

  test('armor badge meets the enlarged size floor', async ({ page }) => {
    // Mock squad has uniform armor=2 → badge renders
    const badge = page.getByTestId('dock-armor-badge');
    await expect(badge).toBeVisible();

    const box = await badge.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });
});

// Ревью PR #242: бейдж скорости с множителем (x2) на 320px мог переполниться —
// «5 (25см) x2» не влезало в max-w. Теперь при активном множителе скобки
// скрываются, потолок бейджа шире: ничего не обрезается.
test.describe('Battle dock speed badge with multiplier', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('«5 x2» без скобок не переполняет бейдж на 320px', async ({ page }) => {
    await page.addInitScript(() => {
      const soldiers = Array.from({ length: 2 }, (_, i) => ({
        num: i + 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '',
      }));
      localStorage.setItem('bronepehota_army', JSON.stringify({
        name: 'Speed x2', faction: 'polaris', sourceId: 'star_system', totalCost: 50,
        currentStep: 'battle', isInBattle: true, currentTurn: 1,
        units: [{
          instanceId: 'dock-speed-x2', type: 'squad', instanceNumber: 1,
          data: {
            id: 'polaris_lineynaya_klon_pehota', name: 'Линейная клон-пехота', shortName: 'ЛКП',
            faction: 'polaris', cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
            soldiers,
            buffs: [{
              id: 'dash_x2', name: 'Рывок', description: 'Скорость x2 один тур',
              applyTo: ['squad'], target: 'speed_multiply', value: 2, phase: 'always', icon: 'FastForward',
            }],
          },
          currentSoldiers: [0, 1], deadSoldiers: [], actionsUsed: [],
        }],
      }));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
      localStorage.setItem('bronepehota_battle_tutorial_done', '1');
    });
    await page.goto('/app');
    await waitForBattleDock(page);

    const badge = page.getByTestId('dock-speed-badge');
    await expect(badge).toBeVisible();
    // База + чип множителя; скобки см спрятаны
    await expect(badge.getByText('5')).toBeVisible();
    await expect(badge.getByText('x2')).toBeVisible();
    await expect(badge.getByText(/см/)).toHaveCount(0);

    // Ничего не переполняет бейдж
    const fits = await badge.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(fits).toBe(true);
  });
});
