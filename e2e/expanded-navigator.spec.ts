import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('Expanded Navigator', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('expanded navigator shows sections and handles clicks', async ({ page }) => {
    // Set up game session state BEFORE page loads
    await page.addInitScript(() => {
      const army = {
        name: 'Navigator Test Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [
          {
            instanceId: 'nav-active-unit',
            type: 'squad',
            data: {
              id: 'polaris_lineynaya_klon_pehota',
              name: 'Линейная клон-пехота',
              shortName: 'Линейная',
              faction: 'polaris',
              cost: 50,
              image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
              soldiers: [
                { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
                { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
              ]
            },
            instanceNumber: 1,
            currentSoldiers: [0, 1],
            deadSoldiers: [],
            actionsUsed: [
              { moved: false, shot: false, melee: false, done: false },
              { moved: false, shot: false, melee: false, done: false },
            ]
          },
          {
            instanceId: 'nav-done-unit',
            type: 'squad',
            data: {
              id: 'polaris_shturmovaya_klon_pehota',
              name: 'Штурмовая клон-пехота',
              shortName: 'Штурмовая',
              faction: 'polaris',
              cost: 60,
              image: '/images/squads/polaris/shturmovaya_klon_pehota/1.png',
              soldiers: [
                { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
                { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
              ]
            },
            instanceNumber: 2,
            currentSoldiers: [0, 1],
            deadSoldiers: [],
            actionsUsed: [
              { moved: true, shot: true, melee: false, done: true },
              { moved: true, shot: true, melee: false, done: true },
            ]
          },
          {
            instanceId: 'nav-dead-unit',
            type: 'squad',
            data: {
              id: 'polaris_tyazhelaya_klon_pehota',
              name: 'Тяжелая клон-пехота',
              shortName: 'Тяжелая',
              faction: 'polaris',
              cost: 70,
              image: '/images/squads/polaris/tyazhelaya_klon_pehota/1.png',
              soldiers: [
                { num: 1, rank: 3, speed: 4, range: 'D12', power: '2D6', melee: 4, props: [], armor: 3, image: '' },
              ]
            },
            instanceNumber: 3,
            currentSoldiers: [],
            deadSoldiers: [0],
            actionsUsed: []
          },
          {
            instanceId: 'nav-captured-unit',
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
            instanceNumber: 4,
            currentSoldiers: [],
            deadSoldiers: [],
            actionsUsed: [],
            durability: 8,
            currentDurability: 8,
            ammo: 20,
            currentAmmo: 20,
            machineShotsUsed: 0,
            isCaptured: true,
          }
        ],
        totalCost: 330,
        currentStep: 'battle',
        isInBattle: true,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Verify game session loaded
    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Dock counter before opening: done + dead + captured = 3 of 4
    await expect(page.getByTestId('dock-nav-counter')).toHaveText('3/4');

    // Open the navigator via the dock СПИСОК button
    const expandedNav = page.getByTestId('expanded-navigator');
    await expect(expandedNav).not.toBeVisible();
    await page.getByTestId('dock-open-navigator').click();
    await expect(expandedNav).toBeVisible();

    // Flat list: all four units in one list, status carried by the row
    // (stripe + glyph) and its aria-label — no section groups
    await expect(page.locator('[data-testid^="expanded-unit-"]')).toHaveCount(4);
    await expect(page.getByTestId('expanded-unit-nav-active-unit')).toBeVisible();
    await expect(page.getByTestId('expanded-unit-nav-done-unit')).toBeVisible();
    await expect(page.getByTestId('expanded-unit-nav-dead-unit')).toBeVisible();

    // Captured machines finally render (regression: they used to vanish)
    const capturedRow = page.getByTestId('expanded-unit-nav-captured-unit');
    await expect(capturedRow).toBeVisible();
    await expect(capturedRow).toHaveAttribute('aria-label', 'Лёгкий штурмовой экраноплан, захвачен');

    // Status marks: the done row carries the ✓ glyph
    await expect(page.getByTestId('expanded-unit-nav-done-unit').locator('text=✓')).toBeVisible();

    // Click a unit row to close navigator
    await page.getByTestId('expanded-unit-nav-active-unit').click();
    await expect(expandedNav).not.toBeVisible();
  });
});
