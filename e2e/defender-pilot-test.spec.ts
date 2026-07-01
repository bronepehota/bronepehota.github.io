import { test, expect } from '@playwright/test';
import { expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * #163 — Defender pilot test: damaging a machine (reducing durability)
 * makes the full-width amber pilot-test alert bar appear; tapping it
 * runs the D12/D6 pilot survival test flow.
 *
 * Prerequisite: the machine must have an alive assigned pilot (pilotInfo).
 * The alert bar is HIDDEN before damage and VISIBLE (amber, pulsing) after.
 */

function setupMachineWithPilot(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    const army = {
      name: 'Pilot Test Army',
      faction: 'polaris',
      sourceId: 'star_system',
      units: [
        {
          instanceId: 'machine-pilot-1',
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
          instanceNumber: 1,
          currentSoldiers: [],
          deadSoldiers: [],
          actionsUsed: [],
          durability: 16,
          currentDurability: 16,
          ammo: 20,
          currentAmmo: 20,
          machineShotsUsed: 0,
          // Alive pilot assigned — required for the alert bar to show after damage
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
  });
}

test.describe('Defender pilot test (#163)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('damage machine -> pilot-test alert bar appears -> tap opens pilot test modal', async ({ page }) => {
    // Seed a machine with an alive assigned pilot
    await setupMachineWithPilot(page);

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Expand the machine card
    await expandFirstUnit(page);

    // BEFORE damage: pilot-survival-test-button must NOT be present (hidden)
    await expect(page.getByTestId('pilot-survival-test-button')).toHaveCount(0);

    // Apply damage — click the "Урон" (damage) button
    // On mobile the label is hidden; match by accessible name or icon.
    const damageButton = page.getByRole('button', { name: /урон/i }).first();
    if (!(await damageButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      // Fallback: match by Flame icon (lucide-flame class) inside a button
      const flameButton = page.locator('button').filter({ has: page.locator('svg.lucide-flame') }).first();
      await expect(flameButton).toBeVisible({ timeout: 3000 });
      await flameButton.click({ force: true });
    } else {
      await damageButton.click({ force: true });
    }
    await page.waitForTimeout(300);

    // AFTER damage: alert bar appears (amber, urgent)
    const alertBar = page.getByTestId('pilot-survival-test-button');
    await expect(alertBar).toBeVisible({ timeout: 3000 });

    // Verify the urgent label text is present
    await expect(alertBar).toContainText('Тест пилота');

    // Tap the alert bar -> pilot test modal opens
    await alertBar.click({ force: true });

    // The pilot test modal renders — one of its phase headers appears
    const modalText = page.getByText(/Тест брони пилота|Тест выживаемости|Результат/);
    await expect(modalText.first()).toBeVisible({ timeout: 5000 });
  });
});
