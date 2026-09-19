import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage, swipeSoldierCard } from './helpers/setup';

/**
 * Свайпы по карточке бойца (плейтест 2026-09-18):
 * влево — «готов» (done), вправо — «убит» (dead).
 * Мышь Playwright генерирует pointer-события — тот же путь, что палец.
 * Мёртвый боец: чип «УБИТ» на фото (soldier-done-button aria-label
 * «Боец убит») — кнопки «череп» больше нет, свайп вправо единственный
 * путь убить/оживить.
 */
test.describe('Soldier card swipes', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'swipe-unit-1' } });
  });

  test('свайп влево — боец готов (done)', async ({ page }) => {
    await swipeSoldierCard(page, 0, 'left');
    await expect(page.getByTestId('soldier-done-button').nth(0))
      .toHaveAttribute('aria-pressed', 'true');
  });

  test('свайп вправо — боец убит (dead)', async ({ page }) => {
    await swipeSoldierCard(page, 1, 'right');
    const doneChip = page.getByTestId('soldier-done-button').nth(1);
    await expect(doneChip).toHaveAttribute('aria-label', 'Боец убит');
    await expect(doneChip).toContainText('УБИТ');
    // Живых в доке стало меньше
    await expect(page.getByTestId('dock-soldiers-alive')).toContainText('5/6');
  });

  test('повторный свайп вправо оживляет (toggle)', async ({ page }) => {
    await swipeSoldierCard(page, 1, 'right');
    await expect(page.getByTestId('soldier-done-button').nth(1))
      .toHaveAttribute('aria-label', 'Боец убит');
    await swipeSoldierCard(page, 1, 'right');
    await expect(page.getByTestId('soldier-done-button').nth(1))
      .toHaveAttribute('aria-label', 'Завершить ход бойца');
    await expect(page.getByTestId('dock-soldiers-alive')).toContainText('6/6');
  });

  test('недотянутый свайп ничего не меняет', async ({ page }) => {
    const card = page.getByTestId('soldier-card').nth(0);
    const box = await card.boundingBox();
    const startX = box!.x + box!.width * 0.6;
    const y = box!.y + box!.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - 25, y, { steps: 4 }); // < порога 56px
    await page.mouse.up();

    await expect(page.getByTestId('soldier-done-button').nth(0))
      .toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('soldier-done-button').nth(0))
      .toHaveAttribute('aria-label', 'Завершить ход бойца');
  });
});

/**
 * Тач-репродукция (плейтест на реальном телефоне: «свайп не работает —
 * кнопки статов перекрывают свайп»). Мышь Playwright не проходит через
 * браузерный жестовый конвейер — тач эмулируем через CDP
 * Input.dispatchTouchEvent: настоящие pointer-события с pointerType "touch"
 * + имплицитный pointer capture цели касания (именно на нём ломался жест).
 */
test.describe('Soldier card swipes — touch (CDP)', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'swipe-unit-1' } });
  });

  /**
   * Тач-свайп, стартующий по сетке статов (та зона, на которую жалуется
   * владелец): touchStart → touchMove ×N → touchEnd через CDP.
   */
  async function touchSwipeOnStats(page: Page, index: number, dir: 'left' | 'right') {
    const card = page.getByTestId('soldier-card').nth(index);
    const stats = card.getByRole('button', { name: 'Выберите действие бойца' });
    const box = await stats.boundingBox();
    expect(box).toBeTruthy();
    const startX = box!.x + box!.width * 0.5;
    const y = box!.y + box!.height * 0.5;
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y, id: 1 }],
    });
    await page.waitForTimeout(30);
    const total = dir === 'left' ? -120 : 120;
    for (let i = 1; i <= 10; i++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + (total * i) / 10, y, id: 1 }],
      });
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(30);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(60);
    await session.detach();
  }

  /** Тап по бейджу стата без движения (touchStart → touchEnd, без touchMove).
   *  Цель — конкретный бейдж, не центр сетки: при скрытых броне/скорости
   *  в центре сетки лежит панель эффектов, открывающая свою модалку. */
  async function touchTapOnStats(page: Page, index: number) {
    const badge = page.getByTestId('soldier-card').nth(index).getByTestId('stat-badge-melee');
    const box = await badge.boundingBox();
    expect(box).toBeTruthy();
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box!.x + box!.width * 0.5, y: box!.y + box!.height * 0.5, id: 1 }],
    });
    await page.waitForTimeout(60);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(60);
    await session.detach();
  }

  test('свайп влево по статам (тач) — боец готов, модалка боя не открылась', async ({ page }) => {
    await touchSwipeOnStats(page, 0, 'left');
    const doneChip = page.getByTestId('soldier-done-button').nth(0);
    await expect(doneChip).toHaveAttribute('aria-pressed', 'true');
    // Чип в состоянии done: подпись меняется на «завершён»
    await expect(doneChip)
      .toHaveAttribute('aria-label', 'Боевых действий завершён. Долгое нажатие для отмены.');
    // Хвостовой клик после жеста гасится — модалку боя он не открывает
    await expect(page.getByTestId('bottom-sheet-combat-modal')).not.toBeVisible();
  });

  test('свайп вправо по статам (тач) — боец убит', async ({ page }) => {
    await touchSwipeOnStats(page, 1, 'right');
    await expect(page.getByTestId('soldier-done-button').nth(1))
      .toHaveAttribute('aria-label', 'Боец убит');
    await expect(page.getByTestId('dock-soldiers-alive')).toContainText('5/6');
  });

  test('тап по статам (тач) по-прежнему открывает модалку боя', async ({ page }) => {
    await touchTapOnStats(page, 0);
    await expect(page.getByTestId('bottom-sheet-combat-modal')).toBeVisible();
  });
});
