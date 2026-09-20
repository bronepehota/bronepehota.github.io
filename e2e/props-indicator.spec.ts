import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * Классические спец-свойства бойца (Пр4, Рм — каталог standard-modifiers)
 * видны на кнопке модификаторов без открытия модала (плейтест 2026-09-20:
 * «на кнопке модификаторов показывать классические спец свойства»).
 * Оба механизма: взводные buffs И пер-солдатские modifiers[].
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

  test('Рм из пер-солдатских modifiers — без взводных buffs', async ({ page }) => {
    await clearStorage(page);
    await page.addInitScript(() => {
      // Основная форма в данных: свойство у бойцов (modifiers), взводных
      // buffs нет — как у Тяжёлой клон-пехоты или Спецназа планеты Фелиция
      const soldiers = Array.from({ length: 3 }, (_, i) => ({
        num: i + 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2,
        modifiers: ['mechanic'], image: '',
      }));
      localStorage.setItem('bronepehota_army', JSON.stringify({
        name: 'P', faction: 'polaris', sourceId: 'star_system', totalCost: 60,
        currentStep: 'battle', isInBattle: true, currentTurn: 1,
        units: [{
          instanceId: 'props-rm-1', type: 'squad', instanceNumber: 1,
          data: {
            id: 'polaris_mech_test_squad',
            name: 'Тест механиков', shortName: 'Механики',
            faction: 'polaris', cost: 60, soldiers,
          },
          currentSoldiers: [0, 1, 2], deadSoldiers: [], actionsUsed: [],
        }],
      }));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });
    await page.goto('/app');
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });

    const indicator = page.locator('[aria-label^="Спец-свойства"]').first();
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute('aria-label', 'Спец-свойства: Рм');
    expect(await indicator.locator('svg').count()).toBeGreaterThanOrEqual(1);
  });
});

// Отдельный describe: узкий телефонный вьюпорт для проверки переполнения
test.describe('Squad special props + счётчик на 320px', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('счётчик баффов не прячет имена свойств, без переполнения', async ({ page }) => {
    await clearStorage(page);
    await page.addInitScript(() => {
      const soldiers = Array.from({ length: 3 }, (_, i) => ({
        num: i + 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2,
        modifiers: ['mechanic', 'jump_boost_4'], image: '',
      }));
      localStorage.setItem('bronepehota_army', JSON.stringify({
        name: 'P', faction: 'polaris', sourceId: 'star_system', totalCost: 60,
        currentStep: 'battle', isInBattle: true, currentTurn: 1,
        units: [{
          instanceId: 'props-mix-1', type: 'squad', instanceNumber: 1,
          data: {
            id: 'polaris_mix_test_squad',
            name: 'Тест смешанный', shortName: 'Смешанный',
            faction: 'polaris', cost: 60, soldiers,
            // не-custom баф: попадает в счётчик, но НЕ в спец-свойства
            buffs: [{
              id: 'armor_plus', name: 'Бронеплиты', description: '+1 брони',
              applyTo: ['soldier'], target: 'armor_bonus', value: 1, phase: 'always',
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

    // Счётчик И имена на одной кнопке; обычный баф — только в счётчике
    const indicator = page.locator('[aria-label*="спец-свойства"]').first();
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute(
      'aria-label',
      '1 баффов, 0 дебаффов, спец-свойства: Рм, Пр4'
    );

    // Тесная ячейка статов: имена переносятся, страница не скроллится вбок
    const scrollWidth = await indicator.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });
});
