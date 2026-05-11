import { test, expect } from '@playwright/test';

test.describe('Standalone Calculator', () => {
  test.beforeEach(async ({ page }) => {
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
    await page.waitForTimeout(500);

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
    await page.waitForTimeout(500);

    // Switch to melee — use nth button with this text (tab comes before card)
    await page.getByRole('button', { name: 'БЛИЖНИЙ БОЙ' }).first().click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'БЛИЖНИЙ БОЙ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'АТАКОВАТЬ' })).toBeVisible();

    // Switch to grenade
    await page.getByRole('button', { name: 'ГРАНАТА' }).first().click();
    await page.waitForTimeout(500);
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
    await page.waitForTimeout(500);

    // Open modifiers
    await page.locator('button[aria-label="Модификаторы"]').click();
    await page.waitForTimeout(300);

    // Verify panel with tabs
    await expect(page.getByRole('heading', { name: 'Модификаторы' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Баффы/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Дебаффы/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ручной' })).toBeVisible();

    // Switch to debuffs tab
    await page.getByRole('button', { name: /Дебаффы/ }).click();
    await page.waitForTimeout(200);

    // Switch to manual tab
    await page.getByRole('button', { name: 'Ручной' }).click();
    await page.waitForTimeout(200);

    // Close panel by clicking backdrop
    await page.locator('.fixed.inset-0.z-40 > .bg-transparent').click();
    await page.waitForTimeout(300);

    // Panel should be gone
    await expect(page.getByRole('heading', { name: 'Модификаторы' })).not.toBeVisible();
  });

  test('should show rules selector', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Технолог/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Стар Систем/ })).toBeVisible();
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
    await page.waitForTimeout(500);

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
    await page.waitForTimeout(800);

    // Verify grenade view
    await expect(page.getByRole('heading', { name: 'ГРАНАТА' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('БРОСИТЬ')).toBeVisible({ timeout: 5000 });
  });
});
