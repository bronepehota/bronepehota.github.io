import { test, expect } from '@playwright/test';

test.describe('История вселенной', () => {
  test('страница открывается: оглавление и главы видны', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('history-title')).toBeVisible();
    await expect(page.getByTestId('history-toc')).toBeVisible();
    const first = page.getByTestId('history-chapter').first();
    await expect(first).toBeVisible();
    await expect(first).toContainText('Тунгусский артефакт');
  });

  test('таб «История» ведёт на страницу из энциклопедии', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'История' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/encyclopedia\/history$/);
  });

  test('глава «Пехота Доминиона» несёт источник («Косары») с АВБ-маркой', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const chapter = page.locator('[data-testid="history-chapter"]', {
      hasText: 'Пехота Доминиона',
    });
    await expect(chapter).toBeVisible();

    const source = chapter.getByTestId('lore-source-row');
    await expect(source).toBeVisible();
    await expect(source).toContainText('V.Chertischev');
    await expect(source).toContainText('Косары');
    // The novel is non-Технолог → the credit chip carries the mini АВБ mark.
    await expect(chapter.getByTestId('credit-avb-mark')).toBeVisible();
  });

  test('главы «Летописи» указывают издание «Летопись: Звёздные герои» — без АВБ-марки', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const first = page.getByTestId('history-chapter').first();
    await expect(first.getByTestId('lore-source-row')).toContainText('Летопись');
    await expect(first.getByTestId('credit-avb-mark')).toHaveCount(0);
  });

  test('глава «Конверсия, Раскол, Регентство» отображается с источником «Новейшая история Империи»', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const chapter = page.locator('[data-testid="history-chapter"]', {
      hasText: 'Конверсия, Раскол, Регентство',
    });
    await expect(chapter).toBeVisible();
    await expect(chapter.getByTestId('lore-source-row')).toContainText('Новейшая история Империи');
    await expect(chapter.getByTestId('credit-avb-mark')).toHaveCount(0);
  });
});
