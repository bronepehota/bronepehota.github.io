import { test, expect } from '@playwright/test';

test.describe('Алфавит вселенной (сущностные страницы)', () => {
  test('досье лорда Кросса открывается: гриф, заголовок и связь с главой', async ({ page }) => {
    await page.goto('/encyclopedia/world/lord-kross');
    await page.waitForLoadState('networkidle');

    const dossier = page.getByTestId('world-page');
    await expect(dossier).toBeVisible();
    // Title страницы собирается из generateMetadata
    await expect(page).toHaveTitle(/Лорд Кросс — вселенная Бронепехоты/);
    // kind-гриф и Russo-заголовок
    // Контейнер грифа несёт и era/faction-чипы (обогащения волн 4g–4k) — проверяем вхождение
    await expect(page.getByTestId('world-kind')).toContainText('// ПЕРСОНА');
    await expect(page.getByTestId('world-title')).toContainText('Кросс');
    // era-реквизит
    await expect(page.getByTestId('world-era')).toContainText('4451');

    // Блок «// СВЯЗАННОЕ»: глава истории + кампания + юнит
    const related = page.getByTestId('world-related');
    await expect(related).toBeVisible();
    const chapterLink = related.locator('a[href="/encyclopedia/history/legendarnye-imperskie-lordy"]');
    await expect(chapterLink).toContainText('Легендарные Имперские Лорды');
    await expect(
      related.locator('a[href="/encyclopedia/unit/polaris_kross"]'),
    ).toContainText('Кросс');
    await expect(
      related.locator('a[href="/campaigns/imperatorskie-voyny"]'),
    ).toContainText('Имперские войны');
  });

  test('«АЛФАВИТ ВСЕЛЕННОЙ» из оглавления Истории ведёт на индекс', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const link = page.getByTestId('world-index-link');
    await expect(link).toContainText('АЛФАВИТ ВСЕЛЕННОЙ');
    await link.click();
    await expect(page).toHaveURL(/\/encyclopedia\/world$/);

    // Индекс: шапка и записи первой партии с грифами по kind
    const index = page.getByTestId('world-index');
    await expect(index).toBeVisible();
    const kross = page.locator('[data-testid="world-index-entry"]', { hasText: 'Лорд Кросс' });
    await expect(kross).toBeVisible();
    await expect(kross).toContainText('ПЕРСОНА');
    await expect(
      page.locator('[data-testid="world-index-entry"]', { hasText: 'Гронт' }),
    ).toContainText('ЛОКАЦИЯ');

    // Из индекса — в досье Гронта
    await page.locator('[data-testid="world-index-entry"]', { hasText: 'Гронт' }).click();
    await expect(page).toHaveURL(/\/encyclopedia\/world\/gront$/);
    await expect(page.getByTestId('world-kind')).toContainText('// ЛОКАЦИЯ');
  });
});
