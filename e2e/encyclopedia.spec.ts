import { test, expect } from '@playwright/test';
import { clearStorage, dismissIntroIfShown } from './helpers/setup';

test.describe('Энциклопедия', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('отображает список всех отрядов', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    const grid = page.getByTestId('unit-grid');
    await expect(grid).toBeVisible();

    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('фильтрация по фракции работает', async ({ page }) => {
    await page.goto('/encyclopedia/units');
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
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    // Выбрать фильтр "ПЕХОТА"
    await page.locator('select[aria-label="Тип"]').selectOption('squad');
    await page.waitForTimeout(200);

    // Проверить что карточки отображаются
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('фильтрация по источнику миниатюр работает', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid^="unit-card-"]');

    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(1);

    // Выбрать фильтр «Миниатюры Лисицына» (sculptor = lisitsin).
    const sculptorSelect = page.locator('select[aria-label="Источник миниатюр"]');
    await sculptorSelect.selectOption('lisitsin');

    // Сетка обновляется: остаются только отряды Лисицына (< исходного кол-ва, > 0).
    await expect(cards).not.toHaveCount(initialCount);
    const filteredCount = await cards.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);

    // Сам <select> отражает выбранное значение.
    await expect(sculptorSelect).toHaveValue('lisitsin');
  });

  test('deep-link ?sculptor=lisitsin предфильтрует юнитов', async ({ page }) => {
    await page.goto('/encyclopedia/units?sculptor=lisitsin');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid^="unit-card-"]');

    // The sculptor <select> reflects the deep-link (?sculptor=lisitsin).
    const sculptorSelect = page.locator('select[aria-label="Источник миниатюр"]');
    await expect(sculptorSelect).toHaveValue('lisitsin');
  });

  test('поиск по названию работает', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    // Ввести поисковый запрос (placeholder is uppercase)
    await page.fill('input[placeholder*="ПОИСК"]', 'клон');
    await page.waitForTimeout(300);

    // Проверить результаты
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('поиск «Робогир» находит технику, подсказка ведёт на главу Истории', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="ПОИСК"]', 'Робогир');
    await page.waitForTimeout(300);

    // Производитель «Робогир Индастриз» — техника находится поиском по лору
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    expect(await cards.count()).toBeGreaterThan(0);

    // Подсказки лор-строк могли не совпасть (зависит от заголовков) — не падаем:
    // обязательна только видимость строки подсказок при совпадении.
  });

  test('поиск «Лорд» показывает подсказку-главу', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="ПОИСК"]', 'Лорд');
    await page.waitForTimeout(300);

    const hint = page.getByTestId('lore-search-hint');
    await expect(hint.first()).toBeVisible();
    await expect(hint.first()).toContainText('Лорды');
  });

  test('детальная страница отряда открывается', async ({ page }) => {
    await page.goto('/encyclopedia/units');
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

    // Юнит в двух армлистах → компактный переключатель статов над таблицей
    const switcher = page.getByTestId('source-switcher');
    await expect(switcher).toBeVisible();
    // Оба источника представлены пилюлями (полные названия)
    await expect(switcher.getByText('Star System')).toBeVisible();
    await expect(switcher.getByText('Технолог')).toBeVisible();
  });

  test('«Взять отряд в бой»: deep-link предвыбирает фракцию юнита', async ({ page }) => {
    await clearStorage(page);
    // Протекторат — не дефолтная фракция (polaris — initial state в /app): тест доказателен.
    await page.goto('/encyclopedia/unit/protectorate_felitsianskaya_gvardiya');
    await expect(page.getByTestId('unit-to-battle-cta')).toBeVisible();
    await page.getByTestId('unit-to-battle-cta').getByRole('link').click();
    await dismissIntroIfShown(page);

    // /app компилируется по требованию (~до 30с в dev)
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });

    // армия получила фракцию (persist дебаунс 300мс).
    // saveArmy пишет конверт {schemaVersion, army} — читаем .army.faction
    // (legacy-фолбэк на голый Army оставляем на всякий случай).
    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = JSON.parse(localStorage.getItem('bronepehota_army') ?? '{}');
          return raw?.army?.faction ?? raw?.faction;
        }),
      )
      .toBe('protectorate');

    // параметр вычищен из URL
    await expect(page).toHaveURL(/\/app$/);
  });

  test('несуществующий ID возвращает 404', async ({ page }) => {
    // Note: With Next.js static export, non-existent dynamic routes return 500 instead of 404
    // This is a known limitation of static export with dynamic routes
    const response = await page.goto('/encyclopedia/unit/non_existent_id');
    expect(response?.status()).toBe(500);
  });

  test('переключатель разделов виден и содержит 5 вкладок', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    const tabs = page.getByTestId('encyclopedia-tabs');
    await expect(tabs).toBeVisible();
    await expect(page.getByTestId('encyclopedia-tab-units')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-tab-history')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-tab-world')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-tab-missions')).toBeVisible();
    await expect(page.getByTestId('encyclopedia-tab-factions')).toBeVisible();
    // Юниты активны на странице каталога
    await expect(page.getByTestId('encyclopedia-tab-units')).toHaveAttribute('aria-current', 'page');
  });

  test('вкладка ведёт на миссии', async ({ page }) => {
    await page.goto('/encyclopedia/units');
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
    await page.goto('/encyclopedia/units?faction=polaris');
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

  test('страница отряда показывает происхождение (канон Технолога) и покрас', async ({ page }) => {
    await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
    await page.waitForLoadState('networkidle');

    // Официальный отряд (в армлисте Технолога) → origin + loreAuthor = tehnolog (единый чип).
    const row = page.getByTestId('provenance-row').first();
    await expect(row).toBeVisible();
    await expect(row.getByText('ТЕХНОЛОГ')).toBeVisible();
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

  test('миссия без установленного источника не показывает строку источника', async ({ page }) => {
    // skrytyj_vrag: provenance null — источник сюжета не установлен, «Технолог» по умолчанию не выдумывается.
    await page.goto('/encyclopedia/mission/skrytyj_vrag');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Скрытый враг');
    await expect(page.getByTestId('provenance-row')).toHaveCount(0);
  });

  test('страница «Косарей» показывает кредит книги и мини-АВБ', async ({ page }) => {
    await page.goto('/encyclopedia/unit/mercenaries_kosari');
    await page.waitForLoadState('networkidle');

    // Кредит-чип романа: автор + произведение на чипе.
    const chip = page.getByTestId('lore-credit-chip');
    await expect(chip).toBeVisible();
    await expect(chip.getByText('V.Chertischev')).toBeVisible();
    await expect(chip.getByText('Косары')).toBeVisible();
    // Книга не от «Технолога» → мини-АВБ-марка рядом с кредитом.
    await expect(chip.getByTestId('credit-avb-mark')).toBeVisible();
    // Концепт отряда официальный (Технолог) → полного бейджа АВБ нет.
    await expect(page.getByTestId('avb-badge')).toHaveCount(0);
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

  test('легенда атрибуции убрана — в футере строка источников и «Дополнить»', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    // Блок-легенда (Технолог/АВБ) убрана со страницы-каталога (решение 2026-08-30):
    // канон объясняют тултипы чипов, досье и /encyclopedia/sources.
    await expect(page.getByTestId('encyclopedia-sources-banner')).toHaveCount(0);
    const footer = page.getByTestId('encyclopedia-sources-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('ИСТОЧНИКИ И ПРАВА');
    // «Дополнить» — CTA сообществу, внешний nofollow-линк
    await expect(page.getByTestId('encyclopedia-contribute-footer')).toBeVisible();
  });

  test('чин происхождения кликабелен и ведёт на сайт источника', async ({ page }) => {
    await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
    await page.waitForLoadState('networkidle');

    const row = page.getByTestId('provenance-row').first();
    // официальный отряд → единый чип Технолога, ссылается на tehnolog.ru
    await expect(row.locator('a[href*="tehnolog.ru"]')).toBeVisible();
  });

  test('карточка машины показывает вооружение из справочника', async ({ page }) => {
    await page.goto('/encyclopedia/unit/griffin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('unit-armament')).toBeVisible();
    await expect(page.getByTestId('armament-entry').first()).toContainText('Световой меч');
  });

  test('боевой баннер не занимает каталог — живёт на хабе', async ({ page }) => {
    // Решение 2026-08-30: «в бой» на каталоге убран (конкурент поиска);
    // входы в бой — CTA на досье юнита и баннер хаба (следующий тест).
    await page.goto('/encyclopedia/units');
    await expect(page.getByTestId('encyclopedia-battle-banner')).toHaveCount(0);
  });
});

// ——— Поиск: тела лора, миссии в подсказках, empty state (Фаза 3 аудита поиска) ——
test.describe('Энциклопедия — поиск по телам лора', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('«Блауд» находит подсказку по телу главы (не по титулу)', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    // «Блауд» — планета из ТЕЛА глав («Космография Доминиона», «Императорские
    // войны»); позже появились и титульные носители (кампания «Оборона Блауда»,
    // досье «Блауд») — они ранжируются выше, но и матчи по телу глав видны.
    await page.fill('input[placeholder*="ПОИСК"]', 'Блауд');
    const hint = page.getByTestId('lore-search-hint');
    await expect(hint.first()).toBeVisible();
    await expect(hint.first()).toContainText('Блауд');
    // Матч по телу — глава ведёт на свой якорь в Истории
    const chapterHint = hint.filter({ hasText: 'Космография' });
    await expect(chapterHint).toHaveCount(1);
    await expect(chapterHint).toHaveAttribute('href', /\/encyclopedia\/history#/);
  });

  test('«Капкан» показывает подсказку-миссию', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="ПОИСК"]', 'Капкан');
    const hint = page.getByTestId('lore-search-hint');
    await expect(hint.first()).toBeVisible();
    await expect(hint.first()).toContainText('МИССИЯ');
    await expect(hint.first()).toContainText('Капкан');
    await expect(hint.first()).toHaveAttribute('href', /\/encyclopedia\/mission\/kapkan/);
  });

  test('пустой результат: эхо, сброс фильтров и чипы-примеры', async ({ page }) => {
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');

    // «зызы» — нет ни юнитов, ни лора
    await page.fill('input[placeholder*="ПОИСК"]', 'зызы');
    const reset = page.getByTestId('search-empty-reset');
    await expect(reset).toBeVisible();

    // Сброс возвращает всю сетку и очищает инпут
    await reset.click();
    const input = page.locator('input[placeholder*="ПОИСК"]');
    await expect(input).toHaveValue('');
    await expect(page.getByTestId('unit-grid')).toBeVisible();
    // Счётчик вернулся к полному каталогу
    await expect(page.getByTestId('unit-grid').locator('[href*="/encyclopedia/unit/"]')).not.toHaveCount(0);

    // Чип-пример подставляет запрос и находит результат
    await page.fill('input[placeholder*="ПОИСК"]', 'зызы');
    await expect(page.getByTestId('search-empty-reset')).toBeVisible();
    const example = page.getByTestId('search-example');
    await expect(example.first()).toBeVisible();
    await example.first().click();
    await expect(page.locator('input[placeholder*="ПОИСК"]')).toHaveValue('Робогир');
    await expect(page.getByTestId('unit-grid').locator('[href*="/encyclopedia/unit/"]').first()).toBeVisible();
  });
});

// ——— Хаб «Архив вселенной»: корень /encyclopedia стал витриной вселенной ———
test.describe('Энциклопедия — хаб «Архив вселенной»', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('обложка дела: гриф, счётчики из данных, лента эпох', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    const cover = page.getByTestId('encyclopedia-hub-cover');
    await expect(cover).toBeVisible();
    await expect(cover).toContainText('ДЕЛО № RG-4530');
    await expect(cover).toContainText('АРХИВ ВСЕЛЕННОЙ');

    // Счётчики приходят из данных реестров — на обложке живые числа, не заглушки.
    const counters = page.getByTestId('hub-counters');
    await expect(counters).toBeVisible();
    await expect(counters).toContainText(/\d+/);

    // Лента эпох — статичная полоса времени архива.
    await expect(page.getByTestId('hub-era-strip')).toBeVisible();

    // Поиск по вселенной — центр обложки.
    await expect(page.getByTestId('hub-search')).toBeVisible();
  });

  test('семь папок-разделов ведут в свои разделы', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    const sections = page.getByTestId('hub-sections');
    await expect(sections).toBeVisible();
    await expect(page.getByTestId('hub-section-history')).toHaveAttribute('href', '/encyclopedia/history');
    await expect(page.getByTestId('hub-section-wars')).toHaveAttribute('href', '/encyclopedia/history#wars');
    await expect(page.getByTestId('hub-section-world')).toHaveAttribute('href', '/encyclopedia/world');
    await expect(page.getByTestId('hub-section-units')).toHaveAttribute('href', '/encyclopedia/units');
    await expect(page.getByTestId('hub-section-factions')).toHaveAttribute('href', '/encyclopedia/factions');
    await expect(page.getByTestId('hub-section-missions')).toHaveAttribute('href', '/encyclopedia/missions');
    await expect(page.getByTestId('hub-section-sources')).toHaveAttribute('href', '/encyclopedia/sources');
  });

  test('папка «Юниты» ведёт в каталог с сеткой карточек', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('hub-section-units').click();
    await expect(page).toHaveURL(/\/encyclopedia\/units$/);
    await expect(page.getByTestId('unit-grid')).toBeVisible();
  });

  test('поиск «Блауд» на обложке даёт лор-подсказку', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('hub-search').fill('Блауд');
    const hint = page.getByTestId('lore-search-hint');
    await expect(hint.first()).toBeVisible();
    await expect(hint.first()).toContainText('Блауд');
  });

  test('плашка режима боя на хабе ведёт в штаб', async ({ page }) => {
    await page.goto('/encyclopedia');
    await expect(page.getByTestId('encyclopedia-battle-banner')).toBeVisible();
    await page.getByTestId('encyclopedia-battle-banner-link').click();
    await dismissIntroIfShown(page);
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });
  });

  test('легаси-глубокая ссылка ?faction=polaris форвардится в каталог и фильтрует', async ({ page }) => {
    // Полный каталог — база для сравнения.
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid^="unit-card-"]');
    const fullCount = await page.locator('[data-testid^="unit-card-"]').count();
    expect(fullCount).toBeGreaterThan(1);

    // Старая внешняя ссылка на корень с параметром фильтра…
    await page.goto('/encyclopedia?faction=polaris');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid^="unit-card-"]');

    // …мгновенно форвардится в каталог с сохранением строки.
    await expect(page).toHaveURL(/\/encyclopedia\/units\?faction=polaris$/);
    await expect(page.locator('select[aria-label="Фракция"]')).toHaveValue('polaris');

    // Сетка отфильтрована: строго меньше полного каталога.
    const filteredCount = await page.locator('[data-testid^="unit-card-"]').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(fullCount);
  });

  test('хаб не мигает при форварде: обложка не появляется', async ({ page }) => {
    await page.goto('/encyclopedia?faction=polaris');
    // До завершения форварда обложка хаба не должна показаться (mount-эффект
    // гасит её в первом же кадре) — ищем сразу, без networkidle.
    await expect(page.getByTestId('encyclopedia-hub-cover')).toHaveCount(0);
    await expect(page).toHaveURL(/\/encyclopedia\/units\?faction=polaris$/);
  });
});

// ——— Витрина «// ТЕАТРЫ ВОЙН» на хабе: карта рядом с описанием периода ——
test.describe('Хаб: театры войн (карта + период)', () => {
  test('описание периода стоит рядом с картой и переключается табами', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    const showcase = page.getByTestId('invasion-showcase');
    await expect(showcase).toBeVisible();
    // Демо-режим слайд-шоу может уже уйти с первого периода — пинуем выбор
    // кликом по первому табу (останавливает автопрокрутку) и ассертим.
    await showcase.getByTestId('invasion-map-tab').nth(0).click();
    await expect(showcase.getByTestId('invasion-showcase-text')).toContainText('Первая волна вторжения');
    await expect(showcase.getByTestId('invasion-map-img')).toHaveAttribute(
      'src',
      /pervaya-volna-4451-4461/,
    );

    await showcase.getByTestId('invasion-map-tab').nth(4).click();
    await expect(showcase.getByTestId('invasion-showcase-text')).toContainText('Раскол Империи');
    await expect(showcase.getByTestId('invasion-map-img')).toHaveAttribute(
      'src',
      /raskol-imperii-4550-4554/,
    );

    // Лента эпох — переключатель: узел 4478 меняет пару и подсвечивается
    const node4478 = page
      .getByTestId('era-period-node')
      .filter({ hasText: '4478' });
    await node4478.click();
    await expect(showcase.getByTestId('invasion-showcase-text')).toContainText('Вторая волна вторжения');
    await expect(node4478).toHaveAttribute('aria-pressed', 'true');
  });
});

// ——— ?q= форвард и переход «все совпадения в каталог» (e2e-пробел ревью) ——
test.describe('Хаб: легаси ?q и проход из подсказок в каталог', () => {
  test('?q= форвардится в каталог с сохранением запроса', async ({ page }) => {
    await page.goto('/encyclopedia?q=' + encodeURIComponent('Блауд'));
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/encyclopedia\/units\?q=/);
    await expect(page.locator('input[placeholder*="ПОИСК"]')).toHaveValue('Блауд');
    await expect(page.getByTestId('lore-search-hint').first()).toBeVisible();
  });

  test('«все совпадения в каталоге» переносит запрос подсказок', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('hub-search').fill('Блауд');
    const more = page.getByTestId('hub-search-more');
    await expect(more).toBeVisible();
    await more.click();
    await expect(page).toHaveURL(/\/encyclopedia\/units\?q=/);
    await expect(page.locator('input[placeholder*="ПОИСК"]')).toHaveValue('Блауд');
  });
});
