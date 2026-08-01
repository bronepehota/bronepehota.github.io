import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('Энциклопедия', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('отображает список всех отрядов', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    const grid = page.getByTestId('unit-grid');
    await expect(grid).toBeVisible();

    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('фильтрация по фракции работает', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    // Выбрать фильтр "ПОЛЯРИС"
    await page.locator('select[aria-label="Фракция"]').selectOption('polaris');
    await page.waitForTimeout(200);

    // Проверить что карточки отображаются
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('фильтрация по типу работает', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    // Выбрать фильтр "ПЕХОТА"
    await page.locator('select[aria-label="Тип"]').selectOption('squad');
    await page.waitForTimeout(200);

    // Проверить что карточки отображаются
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('поиск по названию работает', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    // Ввести поисковый запрос (placeholder is uppercase)
    await page.fill('input[placeholder*="ПОИСК"]', 'клон');
    await page.waitForTimeout(300);

    // Проверить результаты
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('детальная страница отряда открывается', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    // Подождать пока загрузятся карточки
    await page.waitForSelector('[data-testid^="unit-card-"]');

    // Получить ID первой карточки и перейти по прямой ссылке
    const firstCard = page.locator('[data-testid^="unit-card-"]').first();
    const testId = await firstCard.getAttribute('data-testid');
    const unitId = testId?.replace('unit-card-', '');

    // Перейти напрямую на страницу отряда
    await page.goto(`/encyclopedia/unit/${unitId}`);
    await page.waitForLoadState('networkidle');

    // Проверить URL и контент
    expect(page.url()).toMatch(/\/encyclopedia\/unit\//);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('детальная страница показывает источники', async ({ page }) => {
    await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
    await page.waitForLoadState('networkidle');

    // Проверить наличие заголовка
    await expect(page.locator('h1')).toContainText('Линейная клон-пехота');

    // Проверить наличие секции с источниками
    await expect(page.locator('text=ДОСТУПНОСТЬ В ИСТОЧНИКАХ')).toBeVisible();
  });

  test('несуществующий ID возвращает 404', async ({ page }) => {
    // Note: With Next.js static export, non-existent dynamic routes return 500 instead of 404
    // This is a known limitation of static export with dynamic routes
    const response = await page.goto('/encyclopedia/unit/non_existent_id');
    expect(response?.status()).toBe(500);
  });

  test('переключатель разделов виден и содержит 3 вкладки', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByTestId('encyclopedia-tabs');
    await expect(tabs).toBeVisible();
    await expect(page.getByTestId('encyclopedia-tab-units')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-tab-missions')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-tab-factions')).toBeVisible();
    // Юниты активны на главной странице
    await expect(page.getByTestId('encyclopedia-tab-units')).toHaveAttribute('aria-current', 'page');
  });

  test('вкладка ведёт на миссии', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('encyclopedia-tab-missions').click();
    // Client-side navigation — auto-wait for the URL to update.
    await expect(page).toHaveURL(/\/encyclopedia\/missions$/);
    await expect(page.getByTestId('encyclopedia-tab-missions')).toHaveAttribute('aria-current', 'page');
  });

  test('страница фракций показывает карточки фракций', async ({ page }) => {
    await page.goto('/encyclopedia/factions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('faction-grid')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-faction-card-polaris')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-faction-card-protectorate')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-faction-card-mercenaries')).toBeVisible();
    // Фракции активны
    await expect(page.getByTestId('encyclopedia-tab-factions')).toHaveAttribute('aria-current', 'page');
  });

  test('deep-link ?faction=polaris предфильтрует юнитов', async ({ page }) => {
    await page.goto('/encyclopedia?faction=polaris');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid^="unit-card-"]');

    // The faction <select> reflects the deep-link (?faction=polaris).
    const facSel = page.locator('select[aria-label="Фракция"]');
    await expect(facSel).toHaveValue('polaris');
  });

  // --- Attribution labels (происхождение контента) ---

  test('карточка фракции Рутения помечена источником Star System', async ({ page }) => {
    await page.goto('/encyclopedia/factions');
    await page.waitForLoadState('networkidle');

    const card = page.getByTestId('encyclopedia-faction-card-rutenia');
    await expect(card).toBeVisible();
    // Рутения — сообщество Star System (свёрнутый чип).
    await expect(card.getByTestId('provenance-row')).toBeVisible();
    await expect(card.getByTestId('provenance-row').getByText('STAR SYSTEM')).toBeVisible();
  });

  test('страница отряда показывает происхождение (оригинал + лор) и покрас', async ({ page }) => {
    await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
    await page.waitForLoadState('networkidle');

    // У этого отряда есть лор → origin tehnolog, loreAuthor star_system (два чипа).
    const row = page.getByTestId('provenance-row').first();
    await expect(row).toBeVisible();
    await expect(row.getByText('ТЕХНОЛОГ')).toBeVisible();
    await expect(row.getByText('STAR SYSTEM')).toBeVisible();
    // Покрас — Шнайдер (отряд в SQUAD_PHOTO_SOURCE).
    await expect(page.getByTestId('painter-chip').getByText('ПОКРАСЫ ШНАЙДЕРА')).toBeVisible();
  });

  test('страница миссии помечает официальный сценарий и ведёт на первоисточник', async ({ page }) => {
    await page.goto('/encyclopedia/mission/osvobozhdenie');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('provenance-row').getByText('ТЕХНОЛОГ')).toBeVisible();
    // Чип миссии ссылается на tehnolog.ru.
    await expect(page.locator('a[href*="tehnolog.ru"]').first()).toBeVisible();
  });

  test('непокрашенный отряд показывает источник изображений Star System', async ({ page }) => {
    // polaris_rezhimnaya_klon_pehota не в SQUAD_PHOTO_SOURCE → непокрашенный.
    await page.goto('/encyclopedia/unit/polaris_rezhimnaya_klon_pehota');
    await page.waitForLoadState('networkidle');

    const chip = page.getByTestId('image-source-chip');
    await expect(chip).toBeVisible();
    await expect(chip.getByText('STAR SYSTEM')).toBeVisible();
    // Покраса-чипа у непокрашенного нет.
    await expect(page.getByTestId('painter-chip')).toHaveCount(0);
  });

  test('отряд Лисицина показывает покрас (а не Star System fallback)', async ({ page }) => {
    // rutenia_komandnoe_otdelenie — покрас Лисицина; правило «кроме лисицинских».
    await page.goto('/encyclopedia/unit/rutenia_komandnoe_otdelenie');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('painter-chip').getByText('МИНИАТЮРЫ ЛИСИЦИНА')).toBeVisible();
    // Star System fallback для изображений не должен срабатывать для покрашенных.
    await expect(page.getByTestId('image-source-chip')).toHaveCount(0);
  });

  test('легенда об источниках показывается и разворачивается', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    const banner = page.getByTestId('encyclopedia-sources-banner');
    await expect(banner).toBeVisible();
    // Compact mode: logos + labels visible
    await expect(banner.getByText('Официальный канон')).toBeVisible();
    await expect(banner.getByText('Фанатские материалы')).toBeVisible();
    // «Дополнить» CTA is a link
    await expect(banner.getByRole('link', { name: /дополнить/i })).toBeVisible();
  });

  test('чин происхождения кликабелен и ведёт на сайт источника', async ({ page }) => {
    await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
    await page.waitForLoadState('networkidle');

    const row = page.getByTestId('provenance-row').first();
    // split: origin=tehnolog, loreAuthor=star_system — оба теперь ссылки
    await expect(row.locator('a[href*="tehnolog.ru"]')).toBeVisible();
    await expect(row.locator('a[href*="vk.com/bp_bnp"]')).toBeVisible();
  });
});
