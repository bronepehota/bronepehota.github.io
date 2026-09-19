import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * Свайпы по карточке бойца (плейтест 2026-09-18):
 * влево — «готов» (done), вправо — «убит» (dead).
 * Мышь Playwright генерирует pointer-события — тот же путь, что палец.
 */
test.describe('Soldier card swipes', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'swipe-unit-1' } });
  });

  /** Горизонтальный свайп мышью по центру карточки бойца №index */
  async function swipeCard(page: Page, index: number, dir: 'left' | 'right') {
    const card = page.getByTestId('soldier-card').nth(index);
    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    const startX = box!.x + box!.width * 0.6; // центр-право: безопасно внутри карточки
    const y = box!.y + box!.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX + (dir === 'left' ? -90 : 90), y, { steps: 8 });
    await page.mouse.up();
  }

  test('свайп влево — боец готов (done)', async ({ page }) => {
    await swipeCard(page, 0, 'left');
    await expect(page.getByTestId('soldier-done-button').nth(0))
      .toHaveAttribute('aria-pressed', 'true');
  });

  test('свайп вправо — боец убит (dead)', async ({ page }) => {
    await swipeCard(page, 1, 'right');
    await expect(page.getByTestId('soldier-kill-button').nth(1))
      .toHaveAttribute('aria-pressed', 'true');
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
    await expect(page.getByTestId('soldier-kill-button').nth(0))
      .toHaveAttribute('aria-pressed', 'false');
  });
});
