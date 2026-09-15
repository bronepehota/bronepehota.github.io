import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('Standalone Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should load calculator page with action selector', async ({ page }) => {
    await expect(page.getByText('Калькулятор боя')).toBeVisible();
    // Action tabs should be visible
    const shotButtons = await page.getByRole('button', { name: 'ВЫСТРЕЛ' }).all();
    expect(shotButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('should enter shot parameters phase and show execute button', async ({ page }) => {
    // Click shot action card (ActionSelector card, not tab)
    const cards = await page.locator('[class*="relative w-full overflow-hidden"]').all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes('ВЫСТРЕЛ') && text.includes('Дистанция')) {
        await card.click();
        break;
      }
    }

    // Verify shot parameters visible
    await expect(page.getByRole('heading', { name: 'ВЫСТРЕЛ' })).toBeVisible();
    await expect(page.getByText('Ваше оружие')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ВЫСТРЕЛИТЬ' })).toBeVisible();
  });

  test('should switch between action types via tabs', async ({ page }) => {
    // First enter shot via action card
    const cards = await page.locator('[class*="relative w-full overflow-hidden"]').all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes('ВЫСТРЕЛ') && text.includes('Дистанция')) {
        await card.click();
        break;
      }
    }

    // Switch to melee — use nth button with this text (tab comes before card)
    await page.getByRole('button', { name: 'БЛИЖНИЙ БОЙ' }).first().click();
    await expect(page.getByRole('heading', { name: 'БЛИЖНИЙ БОЙ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'АТАКОВАТЬ' })).toBeVisible();

    // Switch to grenade
    await page.getByRole('button', { name: 'ГРАНАТА' }).first().click();
    await expect(page.getByRole('heading', { name: 'ГРАНАТА' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'БРОСИТЬ' })).toBeVisible();
  });

  test('should open and close modifiers panel with tabs', async ({ page }) => {
    // Enter shot mode
    const cards = await page.locator('[class*="relative w-full overflow-hidden"]').all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes('ВЫСТРЕЛ') && text.includes('Дистанция')) {
        await card.click();
        break;
      }
    }

    // Open modifiers
    await page.locator('button[aria-label="Модификаторы"]').click();

    // Verify panel with tabs
    await expect(page.getByRole('heading', { name: 'Модификаторы' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Баффы/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Дебаффы/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ручной' })).toBeVisible();

    // Switch to debuffs tab
    await page.getByRole('button', { name: /Дебаффы/ }).click();

    // Switch to manual tab
    await page.getByRole('button', { name: 'Ручной' }).click();

    // Close panel by clicking backdrop
    await page.locator('.fixed.inset-0.z-40 > .bg-transparent').click();

    // Panel should be gone
    await expect(page.getByRole('heading', { name: 'Модификаторы' })).not.toBeVisible();
  });

  test('should show rules selector', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Технолог/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Стар Систем/ })).toBeVisible();
  });

  // Регресс бага «Ваш бросок 0»: ручной ввод дальности не доходил до броска
  // (executeShot читал снапшот state.combatantData с маунта) — вечный промах.
  // D12 против дистанции 1 попадает ВСЕГДА (success = total >= distance).
  test('введённая вручную дальность участвует в броске: D12 против дистанции 1 — ПОПАДАНИЕ', async ({ page }) => {
    await page.getByTestId('calculator-tab-shot').click();

    // дальность D12 через кубик-попап
    await page.getByRole('button', { name: 'Нажмите для ввода' }).first().click();
    await page.getByRole('button', { name: 'D12', exact: true }).click();
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    // мощность D6
    await page.getByRole('button', { name: 'Нажмите для ввода' }).first().click();
    await page.getByRole('button', { name: 'D6', exact: true }).click();
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    // дистанция → 1 шаг
    await page.getByRole('spinbutton').first().fill('1');

    await page.getByRole('button', { name: 'ВЫСТРЕЛИТЬ' }).click();
    await expect(page.getByText('ПОПАДАНИЕ')).toBeVisible({ timeout: 15000 });
  });

  test('should show melee input placeholder', async ({ page }) => {
    // Enter melee via action card
    const cards = await page.locator('[class*="relative w-full overflow-hidden"]').all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes('БЛИЖНИЙ БОЙ') && text.includes('Кубики')) {
        await card.click();
        break;
      }
    }

    // Verify melee placeholder
    await expect(page.getByRole('heading', { name: 'БЛИЖНИЙ БОЙ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Нажмите для ввода' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'АТАКОВАТЬ' })).toBeVisible();
  });

  test('should show grenade stats with rank input', async ({ page }) => {
    // Enter grenade via action card
    const cards = await page.locator('[class*="relative w-full overflow-hidden"]').all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes('ГРАНАТА') && text.includes('площадь')) {
        await card.click();
        break;
      }
    }

    // Verify grenade view
    await expect(page.getByRole('heading', { name: 'ГРАНАТА' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('БРОСИТЬ')).toBeVisible({ timeout: 5000 });
  });
});

// Мобильный вьюпорт: подписи табов видны и на телефоне (375px) — короткие
// метки вместо иконок-загадок. Регресс на «hidden md:inline».
test.describe('Standalone Calculator — mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');
  });

  test('табы действия подписаны на 375px', async ({ page }) => {
    await expect(page.getByTestId('calculator-tab-shot')).toBeVisible();
    await expect(page.getByTestId('calculator-tab-shot')).toContainText('ВЫСТРЕЛ');
    await expect(page.getByTestId('calculator-tab-melee')).toContainText('БЛИЖНИЙ');
    await expect(page.getByTestId('calculator-tab-grenade')).toContainText('ГРАНАТА');
  });

  test('кнопка модификаторов в шапке, не плавающая по центру края', async ({ page }) => {
    const btn = page.getByTestId('calculator-modifiers-button');
    await expect(btn).toBeVisible();
    // В шапке: верхний край внутри первых ~15% высоты экрана
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeLessThan(100);
    await btn.click();
    await expect(page.getByRole('heading', { name: 'Модификаторы' })).toBeVisible();
  });
});
