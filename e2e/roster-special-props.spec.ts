import { test, expect } from '@playwright/test';
import { setupToArmyBuilder, clearStorage } from './helpers/setup';

/**
 * Спец-свойства взвода (Пр4, Рм — target 'custom' в каталоге) видны на всех
 * поверхностях построителя армии, не только в бою (плейтест 2026-09-20:
 * «постоянный баф — показывать его название, чтобы на отрядах было видно»).
 * Поверхности: карточка каталога (детальная и компактная) + список армии
 * на подготовке к бою.
 */
test.describe('Спец-свойства взвода в построителе армии', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('Пр4 на карточке каталога (детально и компактно) и в списке перед боем', async ({ page }) => {
    await setupToArmyBuilder(page, { faction: 'polaris', budget: 350 });

    // Штурмовая клон-пехота — единственный отряд с Пр4 в этом срезе поиска
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

  // Правило выводит свойства из каталога по названию взвода: кибер → Пр5,
  // фелиц → Рм (данные взводов не несут копий каталога)
  test('Киберпехота → Пр5, Фелицианская гвардия → Рм', async ({ page }) => {
    await setupToArmyBuilder(page, { faction: 'protectorate', budget: 350 });

    await page.getByTestId('unit-search-input').fill('киберпехота');
    await expect(
      page.locator('[data-testid^="unit-card-"]').getByText('Пр5').first()
    ).toBeVisible();

    await page.getByTestId('unit-search-input').fill('фелицианская');
    const guardCard = page.locator('[data-testid^="unit-card-"]').first();
    await expect(guardCard.getByText('Рм').first()).toBeVisible();
  });
});
