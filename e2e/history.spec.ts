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

  test('справочные секции идут под заголовком группы «Справочник»', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('history-group-Справочник')).toBeVisible();
    const kosmo = page.locator('[data-testid="history-chapter"]', { hasText: 'Космография Доминиона' });
    await expect(kosmo).toBeVisible();
    await expect(kosmo.getByTestId('lore-source-row')).toContainText('Летопись');
  });

  test('рассказ «Красная ярость» — кредит автора с мини-АВБ', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const story = page.locator('[data-testid="history-chapter"]', { hasText: 'Красная ярость' });
    await expect(story).toBeVisible();
    await expect(story.getByTestId('lore-source-row')).toContainText('Rasher');
    await expect(story.getByTestId('credit-avb-mark')).toBeVisible();
  });

  test('отдельная страница главы: пермалинк с хаба и prev/next', async ({ page }) => {
    // Хаб → пермалинк «Двух сил»
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');
    const dveSily = page.locator('[data-testid="history-chapter"]', { hasText: 'Две силы' });
    await dveSily.getByTestId('chapter-permalink').click();
    await expect(page).toHaveURL(/\/encyclopedia\/history\/dve-sily$/);
    await expect(page.getByTestId('history-chapter-full')).toBeVisible();
    await expect(page.getByTestId('history-chapter-full')).toContainText('Две силы');
    // Title страницы собирается из generateMetadata — содержит название главы
    await expect(page).toHaveTitle(/Две силы/);

    // prev/next идут по order (frontmatter): у «Двух сил» (order 7) сосед слева —
    // «Лига и Доминион» (order 6), справа — «Пехота Доминиона» (order 8)
    await page.getByTestId('history-chapter-next').click();
    await expect(page).toHaveURL(/\/encyclopedia\/history\/ekipirovka-pehoty-dominiona$/);
    await expect(page.getByTestId('history-chapter-full')).toContainText('Пехота Доминиона');

    await page.goBack();
    await expect(page).toHaveURL(/\/encyclopedia\/history\/dve-sily$/);

    await page.getByTestId('history-chapter-prev').click();
    await expect(page).toHaveURL(/\/encyclopedia\/history\/liga-i-dominion$/);
    await expect(page.getByTestId('history-chapter-full')).toContainText('Лига и Доминион');
  });
});
