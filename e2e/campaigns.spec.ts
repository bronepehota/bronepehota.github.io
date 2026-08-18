import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('Хроники войн', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('список кампаний открывается и ведёт на страницу кампании', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('campaigns-title')).toHaveText('ХРОНИКИ ВОЙН');
    const card = page.getByTestId('campaign-card').first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForLoadState('networkidle');

    // detail page renders the title and rendered body
    await expect(page.getByRole('heading', { name: 'Корпоративные войны' })).toBeVisible();
    // cross-link to an encyclopedia unit is present
    await expect(page.locator('[href*="/encyclopedia/unit/"]').first()).toBeVisible();
    // missions block rendered
    await expect(page.getByText('Миссии')).toBeVisible();
  });

  test('футер лендинга ведёт в Хроники', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('campaigns-link').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/campaigns$/);
  });

  test('в Хрониках видна операция «Скрытый враг»', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Скрытый враг' }).first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Операция «Скрытый враг»' })).toBeVisible();
  });

  test('в Хрониках видна «Имперские войны»', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Имперские войны' }).first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Имперские войны' })).toBeVisible();
  });
});
