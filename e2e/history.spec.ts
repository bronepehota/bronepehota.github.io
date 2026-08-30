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
    // Табы живут на страницах разделов (хаб /encyclopedia вместо них показывает
    // папки-разделы — вход в Историю оттуда проверяет encyclopedia.spec.ts).
    await page.goto('/encyclopedia/units');
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

  test('stories-catalog-link ведёт на /encyclopedia/sources, карточка «Красная ярость» видна', async ({
    page,
  }) => {
    // Рассказы игроков убраны из хроники (2026-08-30) — лор-сводки живут
    // каталогом первоисточников; вход — mono-строка после блока войн.
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const link = page.getByTestId('stories-catalog-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText('ТВОРЧЕСТВО ИГРОКОВ');
    await link.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/encyclopedia\/sources$/);

    const card = page.locator('[data-testid="source-card"]', { hasText: 'Красная ярость' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Rasher');
    await expect(card.locator('a[href*="robogear.ru"]')).toHaveCount(1);
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

  // ——— Phase 2: витрина «ДЕЛО RG-4530» ———

  test('обложка дела: реквизиты, цифры вселенной из данных и CTA «Читать с начала»', async ({
    page,
  }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const cover = page.getByTestId('history-cover');
    await expect(cover).toBeVisible();
    await expect(cover).toContainText('ДЕЛО № RG-4530');
    // Цифры считаются на билде: век 45 (год последней эры), 15 досье
    // (рассказы игроков ушли в каталог /encyclopedia/sources, 2026-08-30)
    await expect(page.getByTestId('history-stat-ВЕК')).toContainText('45');
    await expect(page.getByTestId('history-stat-ДОСЬЕ')).toContainText('15');
    await expect(page.getByTestId('history-reading-meta')).toContainText('ДОСЬЕ');

    await page.getByTestId('history-read-cta').click();
    await expect(page).toHaveURL(/#tungusskiy-artefakt$/);
  });

  test('лента эпох: тики-годы ведут к главам, «ВОЙНЫ» — к хроникам войн', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const ribbon = page.getByTestId('history-era-ribbon');
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toContainText('1908');
    await ribbon.getByRole('link', { name: '4451' }).click();
    await expect(page).toHaveURL(/#dve-sily$/);
    await ribbon.getByRole('link', { name: 'ВОЙНЫ' }).click();
    await expect(page).toHaveURL(/#wars$/);
  });

  test('кнопка ⧉ в оглавлении копирует ссылку-якорь главы', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const row = page.getByTestId('history-toc').locator('li', { hasText: 'Тунгусский артефакт' });
    await row.getByTestId('toc-copy-link').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toMatch(/\/encyclopedia\/history#tungusskiy-artefakt$/);
  });

  test('плавающая «▲ ОГЛАВЛЕНИЕ» появляется в глубине страницы и возвращает к индексу', async ({
    page,
  }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    // Вверху страницы кнопки нет — оглавление на экране
    await expect(page.getByTestId('back-to-toc')).toHaveCount(0);

    // Прыжок в глубину хроники — оглавление уходит вверх, кнопка появляется
    await page.evaluate(() => document.getElementById('dve-sily')?.scrollIntoView());
    await expect(page.getByTestId('back-to-toc')).toBeVisible();

    await page.getByTestId('back-to-toc').click();
    // Плавный скролл возвращает к оглавлению (scrollY меньше высоты обложки+TOC)
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBeLessThan(2400);
  });
});
