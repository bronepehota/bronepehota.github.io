import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('Турниры: хаб', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('рейтинг отсортирован по проценту побед, у победителя золотой кубок', async ({ page }) => {
    await page.goto('/tournaments');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('tournaments-title')).toBeVisible();
    const rows = page.getByTestId(/^rating-row-/);
    await expect(rows.first()).toContainText('Семён');
    await expect(rows.first()).toContainText('100');
    // четвёрка 66,7% отсортирована по никам (тайбрейк «больше игр» тут равный)
    const texts = await rows.allTextContents();
    const idx = (n: string) => texts.findIndex((t) => t.includes(n));
    expect(idx('Валера')).toBeLessThan(idx('Костя'));
    expect(idx('Костя')).toBeLessThan(idx('Павел'));
    expect(idx('Павел')).toBeLessThan(idx('Шнайдер'));
    await expect(
      page.getByTestId('rating-row-semen_kashapov').getByTestId('cup-gold'),
    ).toBeVisible();
  });

  test('карточка турнира показывает победителя и ведёт на протокол', async ({ page }) => {
    await page.goto('/tournaments');
    await page.waitForLoadState('networkidle');

    const card = page.getByTestId('tournament-card').first();
    await expect(card).toContainText('Открытый турнир Южного Урала');
    await expect(page.getByTestId('tournament-winner').first()).toContainText('Семён');
    await card.click();
    await expect(page).toHaveURL(/\/tournaments\/2026-10-yuzhnyy-ural-open$/);
  });
});

test.describe('Турниры: протокол', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('места с кубками, туры и ростеры рендерятся', async ({ page }) => {
    await page.goto('/tournaments/2026-10-yuzhnyy-ural-open');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: 'Открытый турнир Южного Урала' }),
    ).toBeVisible();
    const places = page.getByTestId('place-row');
    await expect(places).toHaveCount(8);
    await expect(places.first()).toContainText('Семён');
    await expect(places.first().getByTestId('cup-gold')).toBeVisible();
    await expect(page.getByTestId('round-card')).toHaveCount(3);
    await expect(page.getByTestId('game-row').first()).toBeVisible();
    await expect(page.getByTestId('roster-item').first()).toBeVisible();
  });

  test('неизвестный id — 404', async ({ page }) => {
    const resp = await page.goto('/tournaments/nope');
    expect(resp?.status()).toBe(404);
  });
});
