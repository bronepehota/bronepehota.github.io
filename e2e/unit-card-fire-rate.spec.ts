import { test, expect, Page } from '@playwright/test';
import { expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * Machine fire-rate — real coverage (replaces a former false-pass spec).
 *
 * Background: issue #187 alleged machine fire buttons were missing in battle.
 * Investigation showed the app is fine — ranged weapons render as
 * `<div role="button" aria-label="Выстрел: <weapon>">` rows (not `<button>ВЫСТРЕЛ</button>`),
 * and the fire_rate limit disables them once shots are exhausted. The old spec
 * never reached battle and used a wrong selector plus a no-assert fallback.
 *
 * These tests seed a machine directly into battle and assert the real behavior:
 *   1. weapon fire rows render, are enabled, and open the combat modal on tap;
 *   2. fire_rate limit disables every ranged row once shotsUsed >= fire_rate.
 */

interface SeedOpts {
  /** shots already used this turn (to test the fire_rate limit). */
  machineShotsUsed?: number;
}

function seedMachineArmy(machineShotsUsed = 0) {
  return function setup(page: Page, opts: SeedOpts = {}) {
    const shotsUsed = opts.machineShotsUsed ?? machineShotsUsed;
    return page.addInitScript((used: number) => {
      const army = {
        name: 'Machine Fire-Rate Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [
          {
            instanceId: 'machine-fire-1',
            type: 'machine',
            data: {
              id: 'polaris_demolisher',
              name: 'Демолишер',
              shortName: 'Демолишер',
              faction: 'polaris',
              cost: 200,
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
              // Two ranged weapons (the fire rows) + one ББ (melee).
              weapons: [
                { name: 'Шестиствольная пушка', range: 'D12', power: '3D20', special: '' },
                { name: 'Спаренная установка', range: 'D12', power: '2D20', special: '' },
                { name: 'Кулак-манипулятор', range: 'ББ', power: '2', special: '' },
              ],
            },
            instanceNumber: 1,
            currentSoldiers: [],
            deadSoldiers: [],
            actionsUsed: [],
            durability: 16,
            currentDurability: 16,
            ammo: 20,
            currentAmmo: 20,
            machineShotsUsed: used,
            // Alive pilot keeps the card fully interactive (mirrors machine-melee-ram spec).
            pilotInfo: {
              squadInstanceId: 'squad-pilot-source',
              soldierIndex: 0,
              pilotArmor: 3,
              alive: true,
            },
          },
        ],
        totalCost: 200,
        currentStep: 'battle',
        isInBattle: true,
        currentTurn: 1,
      };
      localStorage.clear();
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    }, shotsUsed);
  };
}

const FIRE_ROWS = '[role="button"][aria-label^="Выстрел:"]';
const DISABLED_ROWS = '[role="button"][aria-label="Оружие недоступно"]';

test.describe('Machine fire-rate (#187 follow-up)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('ranged weapon fire rows render, are enabled, and open combat on tap', async ({ page }) => {
    await seedMachineArmy(0)(page);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });

    await expandFirstUnit(page);

    // Two ranged weapons render as tappable fire rows.
    const fireRows = page.locator(FIRE_ROWS);
    await expect(fireRows).toHaveCount(2, { timeout: 3000 });
    const labels = await fireRows.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(labels).toEqual(['Выстрел: Шестиствольная пушка', 'Выстрел: Спаренная установка']);

    // Under the fire_rate limit (0/2 used) → none are disabled.
    await expect(page.locator(DISABLED_ROWS)).toHaveCount(0);

    // Tapping a fire row opens the combat modal (real fire entry point).
    await fireRows.first().click({ force: true });
    await expect(page.getByTestId('bottom-sheet-combat-modal')).toBeVisible({ timeout: 3000 });
  });

  test('fire_rate limit disables ranged rows once shots are exhausted', async ({ page }) => {
    // fire_rate is 2; seed with 2 shots already used → all ranged rows disabled.
    await seedMachineArmy(2)(page);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });

    await expandFirstUnit(page);

    // Both ranged weapons are now locked (shotsUsed 2 >= fire_rate 2).
    await expect(page.locator(FIRE_ROWS)).toHaveCount(0, { timeout: 3000 });
    await expect(page.locator(DISABLED_ROWS)).toHaveCount(2);
  });
});
