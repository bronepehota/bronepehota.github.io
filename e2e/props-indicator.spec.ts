import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * Классические спец-свойства взвода (Пр4 у Лёгкой штурмовой клон-пехоты —
 * каталог standard-modifiers) видны на кнопке модификаторов бойца
 * (плейтест: «на кнопке модификаторов показывать классические спец свойства»).
 */
test.describe('Squad special props on modifier button', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Пр4 отображается на индикаторе модификаторов', async ({ page }) => {
    await clearStorage(page);
    await page.addInitScript(() => {
      const soldiers = Array.from({ length: 3 }, (_, i) => ({
        num: i + 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '',
      }));
      localStorage.setItem('bronepehota_army', JSON.stringify({
        name: 'P', faction: 'polaris', sourceId: 'star_system', totalCost: 60,
        currentStep: 'battle', isInBattle: true, currentTurn: 1,
        units: [{
          instanceId: 'props-1', type: 'squad', instanceNumber: 1,
          data: {
            id: 'polaris_lyogkaya_shturmovaya_klon_pehota',
            name: 'Лёгкая штурмовая клон-пехота', shortName: 'Штурмовая',
            faction: 'polaris', cost: 60,
            image: '/images/squads/polaris/lyogkaya_shturmovaya_klon_pehota/1.png',
            soldiers,
            buffs: [{
              id: 'jump_boost_4', name: 'Пр4',
              description: 'Прыжковой ускоритель на расстояние 4е, используется один раз за бой',
              applyTo: ['soldier'], target: 'custom', value: 4, phase: 'always',
              icon: 'ArrowUp', oneTimeUse: true,
            }],
          },
          currentSoldiers: [0, 1, 2], deadSoldiers: [], actionsUsed: [],
        }],
      }));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });
    await page.goto('/app');
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });

    // На кнопке модификаторов первого бойца — доступное имя со Пр4 и иконка
    const indicator = page.locator('[aria-label^="Спец-свойства"]').first();
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute('aria-label', 'Спец-свойства: Пр4');
    expect(await indicator.locator('svg').count()).toBeGreaterThanOrEqual(1);
  });
});
