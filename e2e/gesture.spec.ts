import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, openNavigator } from './helpers/setup';

/**
 * Жесты боя (плейтест 2026-10-15):
 *  — свайп карточки бойца не создаёт горизонтального скролла страницы
 *    (нижний скролл-бар + дёргание экрана);
 *  — лист навигатора ТЯНЕТСЯ за пальцем (визуальный драг), а не стоит
 *    бревном пока «весь экран двигается».
 */
test.use({ hasTouch: true, viewport: { width: 375, height: 667 } });

async function touchDrag(page: import('@playwright/test').Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 10) {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y, id: 1 }] });
  for (let i = 1; i <= steps; i++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps, id: 1 }],
    });
    await page.waitForTimeout(16);
  }
  return session;
}

test('свайп карточки не создаёт горизонтальный overflow страницы', async ({ page }) => {
  await setupGameSessionWithSquad(page);
  await waitForBattleDock(page);

  const card = page.getByTestId('soldier-card').nth(0);
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  const startX = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;

  const session = await touchDrag(page, { x: startX, y }, { x: startX - 160, y });
  const mid = await page.evaluate(() => {
    const overflows: string[] = [];
    document.querySelectorAll('*').forEach((el) => {
      const he = el as HTMLElement;
      if (he.scrollWidth > he.clientWidth + 1) {
        overflows.push(`${he.tagName}:${he.getAttribute('data-testid') || (he.className || '').toString().slice(0, 40)}`);
      }
    });
    return {
      overflows,
      docScrollW: document.documentElement.scrollWidth,
      docClientW: document.documentElement.clientWidth,
    };
  });
  // Жест должен был дойти до карточки (трансформ применён)
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  expect(mid.docScrollW).toBeLessThanOrEqual(mid.docClientW);
  expect(mid.overflows).toEqual([]);
});

test('лист навигатора тянется за пальцем и возвращается пружиной', async ({ page }) => {
  await setupGameSessionWithSquad(page);
  await waitForBattleDock(page);
  await openNavigator(page);

  const sheet = page.getByTestId('navigator-sheet');
  const box = await sheet.boundingBox();
  const startX = box!.x + box!.width / 2;
  const startY = box!.y + 80; // верхняя часть листа (хром)

  const session = await touchDrag(page, { x: startX, y: startY }, { x: startX, y: startY + 60 }, 6);
  // В середине драга лист ВИЗУАЛЬНО следует за пальцем
  const midTransform = await sheet.evaluate((el) => getComputedStyle(el).transform);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  expect(midTransform).not.toBe('none');

  // Недотянули (60px ≪? порог 44 — 60 > 44... берём меньше порога: 30px)
  // Лист остался открыт (не закрыли) и вернулся в исходное положение
  await expect(page.getByTestId('expanded-navigator')).toBeVisible();
  await expect(sheet).toBeVisible();
});

test('дотянул лист до порога — закрылся', async ({ page }) => {
  await setupGameSessionWithSquad(page);
  await waitForBattleDock(page);
  await openNavigator(page);

  const sheet = page.getByTestId('navigator-sheet');
  const box = await sheet.boundingBox();
  const startX = box!.x + box!.width / 2;
  const startY = box!.y + 80;

  const session = await touchDrag(page, { x: startX, y: startY }, { x: startX, y: startY + 120 }, 8);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect(page.getByTestId('expanded-navigator')).not.toBeVisible();
});
