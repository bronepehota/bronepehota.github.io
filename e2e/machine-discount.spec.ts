import { test, expect, type Page } from '@playwright/test';
import { clearStorage, dismissIntroIfShown } from './helpers/setup';

/**
 * БЕТА-скидка на технику (Star System rules only, −30%, off by default).
 *
 * Тумблер живёт на шаге выбора правил («Опциональные правила») и виден только
 * при выбранной версии community_star_system. Скидка применяется на чтении:
 * цены машин в селекторе, проверка бюджета и чип «очков» на подготовке;
 * totalCost в хранилище остаётся канонической Σ базовых цен — потому набор
 * армии «уже со скидкой» и её отключение не требуют пересчёта.
 *
 * Поларис, источник star_system: helix = 220 (орудия 26 + шасси 194) →
 * со скидкой ceil10(26 + 194×0.7 = 161.8) = 170.
 */

const HELIX_BASE = 220;
const HELIX_DISCOUNTED = 170; // ceil10(weapons 26 + chassis 194×0.7)

/** Пройти визард до конструктора армии: rules → source → faction → mission → budget. */
async function walkWizardToBuilder(page: Page) {
  // Детальный вид карточек (unit-card-*): детерминированно, независимо от вьюпорта
  await page.addInitScript(() => {
    localStorage.setItem('bronepehota_display_mode', 'detailed');
  });
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await dismissIntroIfShown(page);

  // Правила Star System + скидка, затем подтвердить шаг правил
  await page.getByTestId('rules-card-community_star_system').click();
  const discountToggle = page.getByTestId('machine-discount-toggle');
  await expect(discountToggle).toBeVisible();
  await discountToggle.getByRole('button', { name: /включить скидку/i }).click();
  await expect(discountToggle.getByRole('button', { name: /скидка на технику:/i })).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('rules-confirm-button').click();

  await page.getByTestId('source-confirm-button').click();
  await page.getByTestId('faction-card-polaris').click();
  await page.getByTestId('faction-continue-button').click();
  await page.getByTestId('mission-confirm-button').click();
  await page.getByRole('button', { name: '350' }).click();
  await page.getByTestId('budget-next-button').click();

  await expect(page.getByTestId('unit-selector')).toBeVisible({ timeout: 10000 });
}

test.describe('Machine discount (БЕТА, Star System)', () => {
  test('тумблер скрыт для Технолога, появляется для Star System, выключен по умолчанию', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await dismissIntroIfShown(page);

    // Версия по умолчанию — tehnolog: тумблера нет
    await expect(page.getByTestId('machine-discount-toggle')).toHaveCount(0);

    // Выбор Star System показывает тумблер, по умолчанию выключен
    await page.getByTestId('rules-card-community_star_system').click();
    const toggle = page.getByTestId('machine-discount-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle.getByText('БЕТА')).toBeVisible();
    await expect(toggle.getByRole('button', { name: /скидка на технику:/i })).toHaveAttribute('aria-pressed', 'false');
  });

  test('скидка: карточка −30%, хранилище — канон, бюджет отсекает по скидочной цене', async ({ page }) => {
    await clearStorage(page);
    await walkWizardToBuilder(page);

    // Карточка helix показывает скидочную цену 154 (база 220)
    const card = page.getByTestId('unit-card-helix');
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText(String(HELIX_DISCOUNTED));

    // Добавление машины: в хранилище каноническая Σ базовых цен (220),
    // скидка живёт на чтении — «пересчёт уже набранной армии» получается сам.
    await page.getByTestId('add-unit-helix').click();
    await page.waitForFunction(() => {
      try {
        const parsed = JSON.parse(localStorage.getItem('bronepehota_army') ?? 'null');
        const army = parsed?.army ?? parsed;
        return army?.units?.length > 0;
      } catch { return false; }
    }, undefined, { timeout: 10000 });

    const totalCost = await page.evaluate(() => {
      const parsed = JSON.parse(localStorage.getItem('bronepehota_army') ?? 'null');
      const army = parsed?.army ?? parsed;
      return army.totalCost as number;
    });
    expect(totalCost).toBe(HELIX_BASE);

    // Бюджет 350: потрачено 154 (скидочно), осталось 196 < 280 (demolisher со
    // скидкой) → клик по дорогой машине даёт «НЕДОСТАТОЧНО ОЧКОВ», армия не меняется
    await page.getByTestId('add-unit-demolisher').click();
    await expect(page.getByText('НЕДОСТАТОЧНО ОЧКОВ')).toBeVisible({ timeout: 5000 });
    const unitCount = await page.evaluate(() => {
      const parsed = JSON.parse(localStorage.getItem('bronepehota_army') ?? 'null');
      const army = parsed?.army ?? parsed;
      return army.units.length as number;
    });
    expect(unitCount).toBe(1);
  });

  test('подготовка к бою показывает очки со скидкой', async ({ page }) => {
    await clearStorage(page);
    await walkWizardToBuilder(page);

    await page.getByTestId('add-unit-helix').click();
    await page.waitForFunction(() => {
      try {
        const parsed = JSON.parse(localStorage.getItem('bronepehota_army') ?? 'null');
        const army = parsed?.army ?? parsed;
        return army?.units?.length > 0;
      } catch { return false; }
    }, undefined, { timeout: 10000 });

    await page.getByTestId('to-battle-button').click();
    const prep = page.getByTestId('battle-preparation-screen');
    await expect(prep).toBeVisible({ timeout: 10000 });

    // Чип «очков» — скидочная Σ (154), не каноническая 220
    await expect(prep).toContainText(`${HELIX_DISCOUNTED}`);
  });
});
