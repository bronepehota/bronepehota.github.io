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
});
