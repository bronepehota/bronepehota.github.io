import { test, expect } from '@playwright/test';
import { expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * #125 — Machine melee + ram E2E.
 *
 * Two flows:
 * 1. Melee (tehnolog default rules): seed a machine with a ББ weapon + pilot
 *    in battle → expand card → tap «Ближний бой» → combat modal opens →
 *    pick target type «Пехотинец», set Бр → «АТАКОВАТЬ» → results show a
 *    meleeOutcome banner (Цель уничтожена / Повреждений: N / Атака отбита).
 * 2. Ram (community_star_system rules): «Таран» button visible → tap →
 *    set infantry count 3 → execute → `ram-infantry-results` shows 3 rows +
 *    `ram-kill-tally` shows «X/3 убито».
 *
 * Mirrors the army-seed pattern from defender-pilot-test.spec.ts.
 */

/** A machine carrying a ББ weapon so ΣББ > 0 (melee bonus shows up). */
function seedMachineArmy(rulesVersion: 'tehnolog' | 'community_star_system') {
  return function setup(page: import('@playwright/test').Page) {
    return page.addInitScript((rv: string) => {
      const army = {
        name: 'Machine Melee Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [
          {
            instanceId: 'machine-melee-1',
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
              // One ranged weapon + one ББ (melee) weapon so ΣББ = 4.
              weapons: [
                { name: 'Пушка', range: 'D12', power: '2D20', special: '' },
                { name: 'Клешня', range: 'ББ', power: '4', special: '' },
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
            machineShotsUsed: 0,
            // Alive pilot assigned (keeps the card fully interactive).
            pilotInfo: {
              squadInstanceId: 'squad-pilot-source',
              soldierIndex: 0,
              pilotArmor: 3,
              alive: true,
            },
          },
        ],
        totalCost: 150,
        currentStep: 'battle',
        isInBattle: true,
        currentTurn: 1,
      };
      localStorage.clear();
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
      localStorage.setItem('bronepehota_rules_version', rv);
    }, rulesVersion);
  };
}

test.describe('Machine melee + ram (#125)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('machine melee — combat modal resolves a Таблица 7 outcome banner', async ({ page }) => {
    // Tehnolog default rules — «Таран» must NOT appear, «Ближний бой» must.
    await seedMachineArmy('tehnolog')(page);

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Expand the machine card.
    await expandFirstUnit(page);

    // «Таран» is community-only — confirm it is absent under tehnolog rules.
    await expect(page.getByRole('button', { name: /^Таран$/ })).toHaveCount(0);

    // Tap «Ближний бой».
    const meleeButton = page.getByRole('button', { name: /ближний бой/i }).first();
    await expect(meleeButton).toBeVisible({ timeout: 3000 });
    await meleeButton.click({ force: true });

    // Combat modal opens in PARAMETERS phase.
    const modal = page.getByTestId('bottom-sheet-combat-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Target type defaults to «Пехотинец» (infantry); make it explicit.
    const infantryButton = page.getByRole('button', { name: /^Пехотинец$/ }).first();
    await expect(infantryButton).toBeVisible({ timeout: 2000 });
    await infantryButton.click({ force: true });

    // Set target armor (Бр цели) to 3 via the NumberStepper input.
    const armorInput = modal.locator('input[type="number"]').last();
    await expect(armorInput).toBeVisible({ timeout: 2000 });
    await armorInput.click({ force: true });
    await armorInput.fill('3');

    // Execute — melee button text is «АТАКОВАТЬ».
    const executeButton = page.getByRole('button', { name: /атаковать/i }).first();
    await expect(executeButton).toBeVisible({ timeout: 2000 });
    await executeButton.click({ force: true });

    // Results: meleeOutcome banner shows one of the Таблица 7 outcomes.
    const outcomeBanner = page.getByText(/Цель уничтожена|Повреждений:|Атака отбита/);
    await expect(outcomeBanner.first()).toBeVisible({ timeout: 5000 });
  });

  test('ram (community) — per-infantry results list + kill tally', async ({ page }) => {
    // Community rules — «Таран» button is rendered.
    await seedMachineArmy('community_star_system')(page);

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Expand the machine card.
    await expandFirstUnit(page);

    // «Таран» is now visible.
    const ramButton = page.getByRole('button', { name: /^Таран$/ }).first();
    await expect(ramButton).toBeVisible({ timeout: 3000 });

    // Tap «Таран».
    await ramButton.click({ force: true });

    // Combat modal opens in PARAMETERS phase.
    const modal = page.getByTestId('bottom-sheet-combat-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // «Пехотинцев переехано» stepper — bump to 3 via the «+» button.
    // Default count is 1, so two clicks → 3.
    const plusButton = modal.getByRole('button', { name: /\+/ }).first();
    await expect(plusButton).toBeVisible({ timeout: 2000 });
    await plusButton.click({ force: true });
    await plusButton.click({ force: true });
    await expect(modal.getByText('3', { exact: true }).first()).toBeVisible({ timeout: 2000 });

    // Execute — ram uses the shared execute button whose text is «БРОСИТЬ».
    const executeButton = page.getByRole('button', { name: /бросить/i }).first();
    await expect(executeButton).toBeVisible({ timeout: 2000 });
    await executeButton.click({ force: true });

    // Results: ram-infantry-results shows 3 rows + kill tally «X/3 убито».
    const ramResults = page.getByTestId('ram-infantry-results');
    await expect(ramResults).toBeVisible({ timeout: 5000 });
    await expect(ramResults.getByTestId('ram-infantry-result')).toHaveCount(3);

    const tally = page.getByTestId('ram-kill-tally');
    await expect(tally).toBeVisible({ timeout: 2000 });
    await expect(tally).toContainText(/\/3 убито/);
  });
});
