import { test, expect, type Page } from '@playwright/test';
import { clearStorage, dismissIntroIfShown } from './helpers/setup';

/**
 * БЕТА «лёгкие 2 выстрела» (Star System rules only, off by default):
 * машины с fire_rate 1 стреляют дважды за ход.
 *
 * Правило применяется НА ЧТЕНИИ (getMachineFireRate в MachineView): гейт
 * стрельбы (MachineWeaponsList) и пипсы патронов (MachineAmmoPanel,
 * текст «shotsUsed/fireRate») получают эффективное значение; хранилище
 * и справочники остаются каноничными.
 */

/** Засеять армию с машиной на 1 выстрел и открыть бой. */
async function openBattleWithFr1Machine(page: Page, lightShots: boolean) {
  await page.addInitScript((shotsOn: boolean) => {
    const army = {
      name: 'Light Shots Army',
      faction: 'polaris',
      sourceId: 'star_system',
      units: [{
        instanceId: 'fr1-test-1',
        type: 'machine',
        data: {
          id: 'fr1-test-machine',
          name: 'Тестовая лёгкая',
          faction: 'polaris',
          cost: 190,
          rank: 2,
          fire_rate: 1,
          ammo_max: 10,
          durability_max: 8,
          speed_sectors: [{ min_durability: 1, max_durability: 8, speed: 5 }],
          weapons: [{ name: 'Пусковая установка', range: 'Д12', power: 'Д20', ammo: 10 }],
        },
        instanceNumber: 1,
        currentDurability: 8,
        currentAmmo: 10,
        machineShotsUsed: 0,
      }],
      totalCost: 190,
      currentStep: 'battle',
      isInBattle: true,
      currentTurn: 1,
    };
    localStorage.clear();
    localStorage.setItem('bronepehota_battle_tutorial_done', '1');
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
    localStorage.setItem('bronepehota_view', 'game');
    localStorage.setItem('bronepehota_display_mode', 'detailed');
    localStorage.setItem('bronepehota_rules_version', 'community_star_system');
    localStorage.setItem('bronepehota_light_shots_enabled', String(shotsOn));
  }, lightShots);

  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 15000 });
}

test.describe('Light shots ×2 (БЕТА, Star System)', () => {
  test('тумблер скрыт для Технолога, виден для Star System, выключен по умолчанию', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await dismissIntroIfShown(page);

    await expect(page.getByTestId('light-shots-toggle')).toHaveCount(0);

    await page.getByTestId('rules-card-community_star_system').click();
    const toggle = page.getByTestId('light-shots-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle.getByText('БЕТА')).toBeVisible();
    await expect(toggle.getByRole('button', { name: /техника с 1 выстрелом:/i })).toHaveAttribute('aria-pressed', 'false');
  });

  test('в бою машина с 1 выстрелом получает 2 при включённом тумблере', async ({ page }) => {
    await openBattleWithFr1Machine(page, true);

    // Пипсы выстрелов: эффективная скорострельность 2 → «0/2»
    // (счётчик рендерится в двух вьюхах карточки — берём .first())
    await expect(page.getByText('0/2').first()).toBeVisible({ timeout: 10000 });
    // Оружие доступно для выстрела
    await expect(page.getByRole('button', { name: /Выстрел: Пусковая установка/i })).toBeVisible();
  });

  test('при выключенном тумблере — базовый 1 выстрел', async ({ page }) => {
    await openBattleWithFr1Machine(page, false);

    await expect(page.getByText('0/1').first()).toBeVisible({ timeout: 10000 });
    // И отключённая строка «0/2» нигде не появляется
    await expect(page.getByText('0/2')).toHaveCount(0);
  });
});
