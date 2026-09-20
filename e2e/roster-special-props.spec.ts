import { test, expect } from '@playwright/test';
import { setupToArmyBuilder, clearStorage } from './helpers/setup';

/**
 * Спец-свойства взвода (Пр4, Рм — target 'custom' в каталоге) видны на всех
 * поверхностях построителя армии, не только в бою (плейтест 2026-09-20:
 * «постоянный баф — показывать его название, чтобы на отрядах было видно»).
 * Поверхности: карточка каталога (детальная и компактная) + список армии
 * на подготовке к бою. Свойства собираются из ОБОИХ механизмов данных:
 * взводные buffs (редактор) и пер-солдатские modifiers[] (основная форма).
 */
test.describe('Спец-свойства взвода в построителе армии', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('Пр4 на карточке каталога (детально и компактно) и в списке перед боем', async ({ page }) => {
    await setupToArmyBuilder(page, { faction: 'polaris', budget: 350 });

    // Штурмовая клон-пехота — Пр4 в этом срезе поиска (пер-солдатские modifiers)
    await page.getByTestId('unit-search-input').fill('штурмовая клон');

    // Детальный вид каталога (десктоп-дефолт): чип в строке статов
    const card = page.locator('[data-testid^="unit-card-"]');
    await expect(card).toHaveCount(1);
    await expect(card.getByText('Пр4')).toBeVisible();

    // Компактный вид каталога: чип рядом с quick-stats
    await page.getByTestId('display-mode-compact').click();
    const compact = page.locator('[data-testid^="compact-unit-card-"]');
    await expect(compact).toHaveCount(1);
    await expect(compact.getByText('Пр4')).toBeVisible();

    // В армию → подготовка: чип у названия отряда
    await compact.getByRole('button', { name: /добавить/i }).click();
    await page.getByTestId('to-battle-button').click();
    const prep = page.getByTestId('prep-army-list');
    await expect(prep).toBeVisible();
    await expect(prep.getByText('Пр4')).toBeVisible();
  });

  test('Рм из пер-солдатских modifiers: та же видимость без взводных buffs', async ({ page }) => {
    await setupToArmyBuilder(page, { faction: 'polaris', budget: 350 });

    // Тяжёлая клон-пехота — mechanic (Рм) у всех бойцов, взводных buffs нет:
    // раньше такие отряды не показывали чип вовсе (костыль только buffs)
    await page.getByTestId('unit-search-input').fill('тяжёлая клон');

    const card = page.locator('[data-testid^="unit-card-"]');
    await expect(card).toHaveCount(1);
    await expect(card.getByText('Рм', { exact: true })).toBeVisible();

    await page.getByTestId('display-mode-compact').click();
    const compact = page.locator('[data-testid^="compact-unit-card-"]');
    await expect(compact).toHaveCount(1);
    await expect(compact.getByText('Рм', { exact: true })).toBeVisible();

    await compact.getByRole('button', { name: /добавить/i }).click();
    await page.getByTestId('to-battle-button').click();
    const prep = page.getByTestId('prep-army-list');
    await expect(prep).toBeVisible();
    await expect(prep.getByText('Рм', { exact: true })).toBeVisible();
  });
});
