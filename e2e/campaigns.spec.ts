import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('Хроники войн', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('секция «Хроники войн» на странице истории ведёт на страницу кампании', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    // Wars section is the closing block of the history page
    await expect(page.getByTestId('campaigns-title')).toHaveText('ХРОНИКИ ВОЙН');
    const card = page
      .locator('[data-testid="campaign-card"]', { hasText: 'Корпоративные войны' })
      .first();
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

  test('старый адрес /campaigns редиректит на историю вселенной', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    // Meta-refresh redirect (static export) lands on the history page
    await expect(page).toHaveURL(/\/encyclopedia\/history/);
    await expect(page.getByTestId('campaigns-title')).toBeVisible();
  });

  test('футер лендинга ведёт в Хроники (секция истории)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('campaigns-link').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/encyclopedia\/history$/);
  });

  test('в Хрониках видна операция «Скрытый враг»', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Скрытый враг' }).first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Операция «Скрытый враг»' })).toBeVisible();
  });

  test('в Хрониках видна «Имперские войны»', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Имперские войны' }).first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Имперские войны' })).toBeVisible();
  });

  test('волна 4d: «Оборона Блауда» — карточка, досье, миссии и кредит Летописи', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Оборона Блауда' }).first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/campaigns\/oborona-blauda/);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Оборона Блауда' })).toBeVisible();
    // Missions appendix of the new wave renders. Фраза «Оборона святыни» встречается
    // и в тексте кампании (лид-абзац), и в заголовке миссии — берём точное совпадение.
    await expect(page.getByText('Миссии')).toBeVisible();
    await expect(page.getByText('Оборона святыни', { exact: true })).toBeVisible();
    // «Летопись: Звёздные герои» — official Технолог source row, no АВБ mark.
    const source = page.getByTestId('lore-source-row');
    await expect(source).toBeVisible();
    await expect(source).toContainText('Летопись: Звёздные герои');
  });

  test('«Имперские войны» — виден источник (роман V.Chertischev) с АВБ-маркой', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Имперские войны' }).first();
    await card.click();
    // Client-side <Link> navigation: networkidle resolves instantly on SPA
    // transitions — wait for the URL state instead, or lore-source-row would
    // multi-match the still-mounted history chapters (strict mode violation).
    await expect(page).toHaveURL(/\/campaigns\/imperatorskie-voyny/);
    await page.waitForLoadState('networkidle');

    const source = page.getByTestId('lore-source-row');
    await expect(source).toBeVisible();
    await expect(source).toContainText('V.Chertischev');
    await expect(source).toContainText('Имперские войны');
    // The novel is non-Технолог → its credit chip carries the mini АВБ mark.
    await expect(page.getByTestId('credit-avb-mark')).toBeVisible();
  });

  test('волна 4e: «Операции ЦСО» — карточка, детальная и кредит повести V.Chertischev', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Операции ЦСО' }).first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/campaigns\/operatsii-tso/);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Операции ЦСО' })).toBeVisible();
    // Missions appendix of the storm battalions campaign renders.
    await expect(page.getByText('Миссии')).toBeVisible();
    await expect(page.getByText('Восстание Сигмы-6')).toBeVisible();
    // Повесть V.Chertischev — независимый автор → мини-АВБ на чипе кредита.
    const source = page.getByTestId('lore-source-row');
    await expect(source).toBeVisible();
    await expect(source).toContainText('V.Chertischev');
    await expect(source).toContainText('Штурмовики Протектората');
    await expect(page.getByTestId('credit-avb-mark')).toBeVisible();
  });
});
