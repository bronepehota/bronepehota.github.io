import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('IA лора: перекрёстные ссылки, путеводитель, источники и права', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('досье raptor: блок «// УЧАСТИЕ В ВОЙНАХ» ведёт в хроники', async ({ page }) => {
    await page.goto('/encyclopedia/unit/raptor');
    await page.waitForLoadState('networkidle');

    const block = page.getByTestId('unit-campaigns');
    await expect(block).toBeVisible();
    await expect(block).toContainText('УЧАСТИЕ В ВОЙНАХ');
    // 8 хроник с «Раптором»: Имперские войны, Штурм Велиана, Первая волна, Блауд,
    // Мидгаард + Либератор, Пыльная Зона, Вторая волна (волны 4e–4j пополняли ростеры).
    await expect(block.locator('[data-testid="unit-campaign-link"]')).toHaveCount(8);
    await expect(block.getByText('Штурм Велиана')).toBeVisible();

    // Cross-link actually navigates to the chronicle.
    await block
      .locator('[data-testid="unit-campaign-link"]', { hasText: 'Штурм Велиана' })
      .click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/campaigns\/shturm-velyana$/);
  });

  test('досье юнита вне хроник: блок участия не рендерится, крошка на месте', async ({ page }) => {
    // hunter с волны 4g участвует в «Либераторе»; вне хроник — «Спрут» (octopus).
    await page.goto('/encyclopedia/unit/octopus');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('unit-campaigns')).toHaveCount(0);
    // Mini mono breadcrumb: ЭНЦИКЛОПЕДИЯ / ЮНИТЫ / <имя>.
    await expect(page.getByTestId('unit-breadcrumb')).toContainText('ЭНЦИКЛОПЕДИЯ / ЮНИТЫ /');
  });

  test('энциклопедия: путеводитель «// С ЧЕГО НАЧАТЬ» — футер хаба', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    const guide = page.getByTestId('lore-guide');
    await expect(guide).toBeVisible();
    await expect(guide).toContainText('С ЧЕГО НАЧАТЬ');
    await expect(guide.getByTestId('lore-guide-chapter')).toHaveAttribute(
      'href',
      '/encyclopedia/history#tungusskiy-artefakt',
    );
    await expect(guide.getByTestId('lore-guide-history')).toHaveAttribute(
      'href',
      '/encyclopedia/history',
    );
    await expect(guide.getByTestId('lore-guide-wars')).toHaveAttribute(
      'href',
      '/encyclopedia/history#wars',
    );
    await expect(guide.getByTestId('lore-guide-factions')).toHaveAttribute(
      'href',
      '/encyclopedia/factions',
    );
    // На хабе гид целиком из ссылок: последний шаг «юниты» — переход в каталог
    // (со страницы каталога он был меткой «вы здесь»).
    await expect(guide.getByTestId('lore-guide-units')).toHaveAttribute(
      'href',
      '/encyclopedia/units',
    );

    // А сам каталог (/encyclopedia/units) гида больше не дублирует.
    await page.goto('/encyclopedia/units');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('lore-guide')).toHaveCount(0);
  });

  test('страница «Источники и права»: положение, реестр изданий, контакт', async ({ page }) => {
    await page.goto('/encyclopedia/sources');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('sources-header')).toContainText('ИСТОЧНИКИ И ПРАВА');
    // Правовое положение: вселенная © «Технолог», адаптации, атрибуция.
    const statement = page.getByTestId('sources-statement');
    await expect(statement).toContainText('ООО «Технолог»');
    await expect(statement).toContainText('не воспроизводятся');
    // Реестр ключевых изданий.
    const editions = page.getByTestId('sources-editions');
    await expect(editions).toContainText('Летопись: Звёздные герои');
    await expect(editions).toContainText('V.Chertischev');
    await expect(editions).toContainText('Схватка на Гронте');
    // Контакт для правообладателей — nofollow.
    const contact = page.getByTestId('sources-contact').locator('a[href*="vk.ru"]');
    await expect(contact).toHaveCount(1);
    await expect(contact).toHaveAttribute('rel', /nofollow/);
  });

  test('футер лендинга ведёт на «Источники и права»', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('sources-link').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/encyclopedia\/sources$/);
  });

  test('история: сноска «// ИСТОЧНИКИ И ПРАВА» в оглавлении рядом с алфавитом', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const footnote = page.locator('nav#history-toc a[href="/encyclopedia/sources"]');
    await expect(footnote).toBeVisible();
    await expect(footnote).toContainText('ИСТОЧНИКИ И ПРАВА');
  });
});
