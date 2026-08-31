import { test, expect, Page } from '@playwright/test';
import { clearStorage, dismissIntroIfShown, setupToPreparation, setupGameSessionWithSquad } from './helpers/setup';

// Перехват аналитики ДО загрузки страниц:
// - ym: геттер/сеттер на window.ym — реальный tag.js не может перезаписать рекордер;
// - gtag: настоящий gtag пишет в dataLayer — подменяем dataLayer.push.
// Без env- id (см. playwright.config) фасад бы молчал — потому G-TEST/111302711 в webServer.
test.beforeEach(async ({ page }) => {
  await clearStorage(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __ymLog: unknown[][]; __gaLog: unknown[][] };
    w.__ymLog = [];
    w.__gaLog = [];
    let ymRecorder: ((...args: unknown[]) => void) | undefined;
    Object.defineProperty(window, 'ym', {
      configurable: true,
      get: () => ymRecorder,
      set: () => {
        ymRecorder = (...args: unknown[]) => {
          w.__ymLog.push(args);
        };
      },
    });
    // Настоящий gtag делает dataLayer.push(arguments) — ОДИН аргумент-объект;
    // разворачиваем его в плоский [cmd, id, opts], как читают ассерты.
    window.dataLayer = {
      push: (...args: unknown[]) => {
        const first = args[0] as ArrayLike<unknown> | null | undefined;
        w.__gaLog.push(first && typeof first === 'object' && 'length' in first ? Array.from(first) : args);
        return 0;
      },
    } as unknown as unknown[];
  });
});

async function ymCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => (window as unknown as { __ymLog: unknown[][] }).__ymLog);
}

async function gaCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => (window as unknown as { __gaLog: unknown[][] }).__gaLog);
}

test('SPA-переход лендинг→/app даёт pageview в обеих системах', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-cta-button').first().click();
  await dismissIntroIfShown(page);
  // /app загружен: виден первый шаг визарда (дев-компиляция ~до 30с)
  await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });

  const ym = await ymCalls(page);
  const ga = await gaCalls(page);
  expect(ym.some((c) => c[1] === 'hit' && c[2] === '/app')).toBeTruthy();
  expect(
    ga.some((c) => c[0] === 'config' && (c[2] as { page_path?: string } | undefined)?.page_path === '/app'),
  ).toBeTruthy();
  expect(ym.some((c) => c[1] === 'reachGoal' && c[2] === 'app_open')).toBeTruthy();
  expect(ga.some((c) => c[0] === 'event' && c[1] === 'app_open')).toBeTruthy();
});

test('воронка: wizard_step на каждом confirm-клике', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-cta-button').first().click();
  await dismissIntroIfShown(page);
  await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });
  await page.getByTestId('rules-confirm-button').click();
  await expect(page.getByTestId('source-confirm-button')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('source-confirm-button').click();
  await expect(page.getByTestId('faction-continue-button')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('faction-continue-button').click();

  const ym = await ymCalls(page);
  const steps = ym
    .filter((c) => c[1] === 'reachGoal' && c[2] === 'wizard_step')
    .map((c) => (c[3] as { step?: string }).step);
  expect(steps).toEqual(expect.arrayContaining(['rules', 'source', 'faction']));
});

test('battle_start после «Начать бой» через модалку инициативы', async ({ page }) => {
  await setupToPreparation(page);
  await page.getByTestId('start-battle-button').click();
  await expect(page.getByTestId('initiative-modal').first()).toBeVisible({ timeout: 10000 });
  // авто-бросок кости ~600мс — кнопка игнорирует клики во время анимации
  await page.waitForTimeout(800);
  await page.getByTestId('confirm-initiative-button').click({ force: true });

  const ym = await ymCalls(page);
  expect(ym.some((c) => c[1] === 'reachGoal' && c[2] === 'battle_start')).toBeTruthy();
});

test('первая смена хода: battle_turn(2) и battle_engaged', async ({ page }) => {
  await setupGameSessionWithSquad(page, {
    unitOverrides: { instanceId: 'analytics-unit-1' },
  });
  await page.waitForTimeout(500);

  // Паттерн из e2e/combat.spec.ts:39-50 — меню юнита → new-turn-button
  const menuButton = page.locator('.ml-auto button:has(svg.lucide-more-vertical)').last();
  await menuButton.click({ force: true });
  await page.getByTestId('new-turn-button').click({ force: true });

  const turnConfirm = page.locator('text=ЗАВЕРШИТЬ ТУР').first();
  if (await turnConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.locator('button:has-text("ЗАВЕРШИТЬ")').last().click({ force: true });
  }

  await expect(page.getByTestId('initiative-modal').first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(800);
  await page.getByTestId('confirm-initiative-button').click({ force: true });

  const ym = await ymCalls(page);
  expect(
    ym.some(
      (c) =>
        c[1] === 'reachGoal' && c[2] === 'battle_turn' && (c[3] as { turn?: number }).turn === 2,
    ),
  ).toBeTruthy();
  expect(ym.some((c) => c[1] === 'reachGoal' && c[2] === 'battle_engaged')).toBeTruthy();
});

test('battle_entry(from=encyclopedia_unit) при клике на странице юнита', async ({ page }) => {
  await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
  await page.getByTestId('unit-to-battle-cta').getByRole('link').click();
  await dismissIntroIfShown(page);
  await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });

  const ym = await ymCalls(page);
  const ga = await gaCalls(page);
  expect(
    ym.some(
      (c) =>
        c[1] === 'reachGoal' && c[2] === 'battle_entry' &&
        (c[3] as { from?: string }).from === 'encyclopedia_unit',
    ),
  ).toBeTruthy();
  expect(ga.some((c) => c[0] === 'event' && c[1] === 'battle_entry')).toBeTruthy();
});

// ——— Поиск по энциклопедии: событие с поверхностью (закрытие e2e-пробела) ——
test('encyclopedia_search несёт surface=units при поиске в каталоге', async ({ page }) => {
  await page.goto('/encyclopedia/units');
  await page.waitForLoadState('networkidle');

  await page.fill('input[placeholder*="ПОИСК"]', 'Велиан');
  // debounce 1200ms — событие уходит один раз, после того как ввод устоялся
  await page.waitForTimeout(2200);

  const ga = await gaCalls(page);
  const search = ga.filter((e) => String(e[0]).includes('encyclopedia_search'));
  expect(search.length).toBeGreaterThanOrEqual(1);
  const params = (search[0][1] ?? {}) as Record<string, unknown>;
  expect(params.surface).toBe('units');
});
