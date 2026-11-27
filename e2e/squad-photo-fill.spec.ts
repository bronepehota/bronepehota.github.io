import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, setupGameSessionWithMachine, clearStorage, waitForBattleDock, swipeSoldierCard } from './helpers/setup';

/**
 * Squad photo fill (плейтест 2026-09-18: «фото мелкие, кто есть кто не
 * различить; снизу пусто»). Контракт раскладки:
 * - (2026-09-20) док — окно В ПОТОКЕ, контент физически не может зайти
 *   под панель; (2026-11-27) оболочка /app — fixed inset-0, док всегда в
 *   видимой области любого браузера;
 * - короткий взвод → колонка растягивается (min-h-full), строки делят
 *   остаток, фото растут (кап min(224px,40vw) на обёртке; аспект 3:4);
 * - полный взвод (6) → ПОМЕЩАЕТСЯ без скролла на 667-экранах (2026-11-27:
 *   угловая стопка ✦/⋯ заменена строкой модификаций, пол фото 85.33→72 —
 *   карточка 82px, 6×82+промежутки = 520 ≤ 570);
 * - переполнение физически возможно только на низких экранах (≤617 dvh):
 *   320×568 — скролл, фото на полу 72px;
 * - граница окон: низ скролл-области = верх дока (никаких paddingBottom-резервов).
 * DOM-замеры (getBoundingClientRect/computed), не скриншоты.
 */
test.describe('Squad photo fill in battle view', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('short squad (2): photos grow past the floor and fill the space above the dock', async ({ page }) => {
    await setupGameSessionWithSquad(page, { soldierCount: 2 });
    await waitForBattleDock(page);

    // Заполняет ровно: внутреннего скролла нет
    const scroll = page.getByTestId('squad-scroll');
    expect(await scroll.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);

    // Фото выросло далеко выше пола 85.33px. Кап height min(224px,40vw):
    // при 375 это 150px — согласованный потолок, чтобы крупные статы
    // (19px, дистанционная читаемость) не выдавливались из строки
    const photo = page.getByTestId('soldier-photo').first();
    const h = await photo.evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThan(140);
    expect(h).toBeLessThanOrEqual(224.5);

    // Аспект 3:4 держится — ширина не вылезает за 0.75×h (нет гор. переполнения)
    const w = await photo.evaluate((el) => el.getBoundingClientRect().width);
    expect(w).toBeLessThanOrEqual(h * 0.75 + 1.5);

    // ГЛАВНЫЙ инвариант «фиксированных окон»: окно карточки кончается на
    // верхней границе дока — ничего не заходит под панель
    const m = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="squad-scroll"]')!;
      const photos = Array.from(c.querySelectorAll('[data-testid="soldier-photo"]'));
      const last = photos[photos.length - 1] as HTMLElement;
      const dock = document.querySelector('[data-testid="unit-dock"]')!;
      return { lastBottom: last.getBoundingClientRect().bottom, dockTop: dock.getBoundingClientRect().top };
    });
    expect(m.lastBottom).toBeLessThanOrEqual(m.dockTop + 1.5);
  });

  // Репорт 2026-11-27 («видно только название юнита снизу, под ним — под
  // скроллом»): на WebView без dvh фолбэк h-screen(100vh) делал оболочку
  // выше видимой области на высоту панели браузера — нижняя строка дока
  // (бейджи/кнопки) уходила под край, требовался скролл СТРАНИЦЫ.
  // Механизм-инвариант: оболочка position:fixed, прибита top+bottom к
  // видимой области — высота не зависит от vh/dvh ни в одном браузере.
  // Headless vh==dvh, поэтому проверяем механизм (computed position + пин),
  // а не визуальный дефект — он воспроизводится только на реальных WebView.
  test('окно боя прибито к видимой области (fixed inset-0) — док целиком на экране', async ({ page }) => {
    await setupGameSessionWithSquad(page, { soldierCount: 2 });
    await waitForBattleDock(page);

    const m = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      const cs = getComputedStyle(main);
      const r = main.getBoundingClientRect();
      const dock = document.querySelector('[data-testid="unit-dock"]')!.getBoundingClientRect();
      return {
        position: cs.position,
        heightDecl: cs.height,
        top: r.top,
        bottom: r.bottom,
        vh: window.innerHeight,
        dockTop: dock.top,
        dockBottom: dock.bottom,
      };
    });
    expect(m.position).toBe('fixed');
    expect(m.top).toBe(0);
    // прибит и к низу: высота оболочки = видимой области, а не константе vh
    expect(m.bottom).toBeCloseTo(m.vh, 0);
    // док целиком в пределах экрана — «нижняя линия» доступна без скролла
    expect(m.dockTop).toBeGreaterThanOrEqual(0);
    expect(m.dockBottom).toBeLessThanOrEqual(m.vh);
  });

  test('full squad (6): fits without scroll at 667 — photos above the 72px floor', async ({ page }) => {
    await setupGameSessionWithSquad(page, {});
    await waitForBattleDock(page);

    // 6 бойцов влезают: внутреннего скролла нет (2026-11-27: карточка 82px,
    // 6×82+промежутки = 520 ≤ 570 окна)
    const scroll = page.getByTestId('squad-scroll');
    expect(await scroll.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);

    // Строки делят остаток: фото ~80px — выше пола 72px, но ниже старого пола
    const h = await page.getByTestId('soldier-photo').first()
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(71);
    expect(h).toBeLessThanOrEqual(100);
  });

  test('full squad (6) on a 320x568 phone: physically overflows — scrolls, photos at the floor', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await setupGameSessionWithSquad(page, {});
    await waitForBattleDock(page);

    const scroll = page.getByTestId('squad-scroll');
    expect(await scroll.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    // Пол: 72px (допуск на паддинги карточки/округление)
    const h = await page.getByTestId('soldier-photo').first()
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(70);
    expect(h).toBeLessThanOrEqual(76);
  });

  // 2026-11-27: убитые — компактная «строка потерь» 48px; их место отдаётся
  // живым рядам (fill-фича растягивает фото живых сильнее)
  test('dead rows collapse to 48px — live photos grow', async ({ page }) => {
    await setupGameSessionWithSquad(page, {});
    await waitForBattleDock(page);

    // убить бойцов 1 и 2 (свайп вправо — toggle)
    await swipeSoldierCard(page, 1, 'right');
    await swipeSoldierCard(page, 2, 'right');

    const m = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[data-testid^="squad-row-"]'));
      const photos = Array.from(document.querySelectorAll('[data-testid="soldier-photo"]'));
      const cards = Array.from(document.querySelectorAll('[data-testid="soldier-card"]'));
      return {
        deadRowHeights: rows
          .map((r, i) => ({ i, h: r.getBoundingClientRect().height, dead: cards[i]?.getAttribute('data-soldier-dead') }))
          .filter(x => x.dead === 'true').map(x => x.h),
        alivePhotoH: +photos[0].getBoundingClientRect().height.toFixed(1),
        deadCardH: +cards[1].getBoundingClientRect().height.toFixed(1),
      };
    });
    // мёртвый ряд ≈ 48px (допуск на border/rounding)
    for (const h of m.deadRowHeights) expect(h).toBeGreaterThanOrEqual(46);
    for (const h of m.deadRowHeights) expect(h).toBeLessThanOrEqual(52);
    // живые выросли против равномерного ~80px
    expect(m.alivePhotoH).toBeGreaterThan(85);
  });

  // Полноэкранный просмотр фото (плейтест 2026-09-19). С 2026-11-27 тап по
  // фото живого бойца открывает лист действий — фуллскрин из его строки
  // «Во весь экран». С 2026-09-20 док — окно в потоке, оверлей z-100
  // накрывает его целиком: фото использует всю высоту экрана, тап в область
  // дока закрывает просмотр.
  test('fullscreen фото бойца накрывает док и использует всю высоту', async ({ page }) => {
    await setupGameSessionWithSquad(page, {});
    await waitForBattleDock(page);

    // Тап в верхний левый угол фото → лист действий
    await page.getByTestId('soldier-photo').first().click({ position: { x: 8, y: 8 } });
    await page.getByTestId('soldier-action-sheet').waitFor({ state: 'visible' });
    await page.getByTestId('sheet-action-fullscreen').click();
    const overlay = page.getByTestId('soldier-image-overlay');
    await expect(overlay).toBeVisible();

    const m = await page.evaluate(() => {
      const dock = document.querySelector('[data-testid="unit-dock"]')!;
      const dockRect = dock.getBoundingClientRect();
      const hit = document.elementFromPoint(dockRect.left + dockRect.width / 2, dockRect.top + dockRect.height / 2);
      const box = document.querySelector('[data-testid="soldier-image-overlay"] div.flex-1')!;
      return {
        dockCovered: !!hit?.closest('[data-testid="soldier-image-overlay"]'),
        boxBottom: box.getBoundingClientRect().bottom,
        dockTop: dockRect.top,
      };
    });
    expect(m.dockCovered, 'оверлей накрывает док — клики по панели закрывают фото').toBe(true);
    // Контейнер фото занимает место, где раньше был резерв под док
    expect(m.boxBottom).toBeGreaterThan(m.dockTop);
  });

  test('fullscreen фото техники накрывает док и использует всю высоту', async ({ page }) => {
    await setupGameSessionWithMachine(page);
    await waitForBattleDock(page);

    await page.getByRole('button', { name: /Показать фото/ }).click();
    const overlay = page.getByTestId('machine-image-overlay');
    await expect(overlay).toBeVisible();

    const m = await page.evaluate(() => {
      const dock = document.querySelector('[data-testid="unit-dock"]')!;
      const dockRect = dock.getBoundingClientRect();
      const hit = document.elementFromPoint(dockRect.left + dockRect.width / 2, dockRect.top + dockRect.height / 2);
      const box = document.querySelector('[data-testid="machine-image-overlay"] div.flex-1')!;
      return {
        dockCovered: !!hit?.closest('[data-testid="machine-image-overlay"]'),
        boxBottom: box.getBoundingClientRect().bottom,
        dockTop: dockRect.top,
      };
    });
    expect(m.dockCovered).toBe(true);
    expect(m.boxBottom).toBeGreaterThan(m.dockTop);
  });
});

/**
 * Ревью PR #242: длинные кубы (D12+2, 1D20+2 — 168+2 бойцов в данных)
 * при 19px вылезали из бейджей; на 320px даже 2D6. Регресс: адаптивный
 * кегль + узкий фото-кап держат значения внутри бейджей на обоих вьюпортах.
 */
test.describe('long dice values fit', () => {
  const longSquad = {
    instanceId: 'long-dice-1', type: 'squad', instanceNumber: 1,
    data: {
      id: 'polaris_lineynaya_klon_pehota', name: 'Отряд с длинными кубами', shortName: 'Кубы',
      faction: 'polaris', cost: 50,
      image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
      soldiers: [
        { num: 1, rank: 2, speed: 5, range: 'D12+2', power: 'D12+2', melee: 3, props: [], armor: 2, image: '' },
        { num: 2, rank: 2, speed: 5, range: '1D20+2', power: 'D12+2', melee: 3, props: [], armor: 2, image: '' },
        { num: 3, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      ],
    },
    currentSoldiers: [0, 1, 2], deadSoldiers: [], actionsUsed: [],
  };

  for (const width of [375, 320]) {
    test.describe(`viewport ${width}`, () => {
      test.use({ viewport: { width, height: width === 375 ? 667 : 568 } });

      test('значения D12+2 / 1D20+2 не вылезают из бейджей', async ({ page }) => {
        await clearStorage(page);
        await page.addInitScript((unit) => {
          localStorage.setItem('bronepehota_army', JSON.stringify({
            name: 'L', faction: 'polaris', sourceId: 'star_system', units: [unit],
            totalCost: 50, currentStep: 'battle', isInBattle: true, currentTurn: 1,
          }));
          localStorage.setItem('bronepehota_view', 'game');
          localStorage.setItem('bronepehota_display_mode', 'detailed');
        }, longSquad);
        await page.goto('/app');
        await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });

        const overflowing = await page.evaluate(() =>
          Array.from(document.querySelectorAll('[data-testid^="stat-badge-"]'))
            .filter(b => b.scrollWidth > b.clientWidth + 1)
            .map(b => `${b.getAttribute('data-testid')}:${b.textContent} ${b.scrollWidth}>${b.clientWidth}`)
        );
        expect(overflowing).toEqual([]);
      });
    });
  }
});
