import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, setupGameSessionWithMachine, clearStorage, waitForBattleDock } from './helpers/setup';

/**
 * Squad photo fill (плейтест 2026-09-18: «фото мелкие, кто есть кто не
 * различить; снизу пусто»). Контракт раскладки:
 * - короткий взвод → колонка растягивается (min-h-full), строки делят
 *   остаток, фото растут (кап min(224px,40vw) на обёртке, аспект 3:4;
 *   на узких <375px кап ниже — 34vw, чтобы длинные кубы влезали);
 * - полный взвод (6) → остатка нет, фото на полу (~85px), скролл работает.
 * DOM-замеры (getBoundingClientRect/computed), не скриншоты.
 */
test.describe('Squad photo fill in battle view', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('short squad (2): photos grow past the floor and fill the space above the dock', async ({ page }) => {
    await setupGameSessionWithSquad(page, { soldierCount: 2 });
    await waitForBattleDock(page); // док смонтирован → bottomInset применён

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

    // Низ последней строки — над док-инсетом (paddingBottom скролла = высота дока)
    const m = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="squad-scroll"]')!;
      const photos = Array.from(c.querySelectorAll('[data-testid="soldier-photo"]'));
      const last = photos[photos.length - 1] as HTMLElement;
      const pb = parseFloat(getComputedStyle(c).paddingBottom);
      return { lastBottom: last.getBoundingClientRect().bottom, limit: c.getBoundingClientRect().bottom - pb };
    });
    expect(m.lastBottom).toBeLessThanOrEqual(m.limit + 1.5);
  });

  test('full squad (6): photos stay at the floor and the area scrolls', async ({ page }) => {
    await setupGameSessionWithSquad(page, {});
    await waitForBattleDock(page);

    const scroll = page.getByTestId('squad-scroll');
    expect(await scroll.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    // Пол не уменьшился: ~85.33px (допуск на паддинги карточки/округление)
    const h = await page.getByTestId('soldier-photo').first()
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(84);
    expect(h).toBeLessThanOrEqual(100);
  });

  // Полноэкранный просмотр фото (плейтест 2026-09-19: «изображения занимают
  // пространство, однако не учитывают нижнюю панель»). Оверлей должен
  // резервировать снизу высоту дока (bottomInset), как squad-scroll.
  test('fullscreen фото бойца не заходит под нижний док', async ({ page }) => {
    await setupGameSessionWithSquad(page, {});
    await waitForBattleDock(page);

    // Тап в верхний левый угол фото: центр перекрыт хитом-зоной чипа «ГОТОВ»
    // (after:-left-4 after:-top-6 расширяет кнопку за её видимый угол)
    await page.getByTestId('soldier-photo').first().click({ position: { x: 8, y: 8 } });
    const overlay = page.getByTestId('soldier-image-overlay');
    await expect(overlay).toBeVisible();

    const m = await page.evaluate(() => {
      const dock = document.querySelector('[data-testid="unit-dock"]')!;
      const box = document.querySelector('[data-testid="soldier-image-overlay"] div.flex-1')!;
      return { boxBottom: box.getBoundingClientRect().bottom, dockTop: dock.getBoundingClientRect().top };
    });
    // Низ контейнера фото — над верхом дока ( paddingBottom = высота дока)
    expect(m.boxBottom).toBeLessThanOrEqual(m.dockTop + 1.5);
  });

  test('fullscreen фото техники не заходит под нижний док', async ({ page }) => {
    await setupGameSessionWithMachine(page);
    await waitForBattleDock(page);

    await page.getByRole('button', { name: /Показать фото/ }).click();
    const overlay = page.getByTestId('machine-image-overlay');
    await expect(overlay).toBeVisible();

    const m = await page.evaluate(() => {
      const dock = document.querySelector('[data-testid="unit-dock"]')!;
      const box = document.querySelector('[data-testid="machine-image-overlay"] div.flex-1')!;
      return { boxBottom: box.getBoundingClientRect().bottom, dockTop: dock.getBoundingClientRect().top };
    });
    expect(m.boxBottom).toBeLessThanOrEqual(m.dockTop + 1.5);
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
