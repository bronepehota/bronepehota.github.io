import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, clearStorage, swipeSoldierCard } from './helpers/setup';

/**
 * Soldier State Management E2E tests
 *
 * Tests for the fix of the soldier state management bug where marking soldiers
 * as killed or done would cause states to get chaotically toggled.
 *
 * Root cause: Using array index as React key caused React to confuse which
 * component instance corresponds to which soldier when state changes.
 *
 * Fix: Changed from key={idx} to key={`${unit.instanceId}-${idx}`}
 *
 * Kill path: кнопки «череп» нет — убить/оживить можно свайпом вправо
 * (swipeSoldierCard). Мёртвое состояние читается по чипу на фото:
 * soldier-done-button aria-label «Боец убит» + текст «УБИТ».
 */
test.describe('Soldier State Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'soldier-state-unit-1' },
    });
    await waitForBattleDock(page);
    await page.waitForSelector('[data-testid="soldier-done-button"]', { timeout: 5000 });
  });

  /** Чип бойца №index (nth по DOM — выровнен с карточками, пока все обычные) */
  const doneChip = (page: Page, index: number) =>
    page.getByTestId('soldier-done-button').nth(index);

  test('should maintain soldier state when marking multiple soldiers as killed', async ({ page }) => {
    const doneButtons = page.getByTestId('soldier-done-button');
    const count = await doneButtons.count();
    expect(count).toBeGreaterThan(0);

    await swipeSoldierCard(page, 0, 'right');
    await expect(doneChip(page, 0)).toHaveAttribute('aria-label', 'Боец убит');
    await expect(doneChip(page, 0)).toContainText('УБИТ');

    await swipeSoldierCard(page, 1, 'right');
    await expect(doneChip(page, 1)).toHaveAttribute('aria-label', 'Боец убит');

    // First soldier stays dead (the React-key regression flipped it back)
    await expect(doneChip(page, 0)).toHaveAttribute('aria-label', 'Боец убит');

    await swipeSoldierCard(page, 2, 'right');
    await expect(doneChip(page, 2)).toHaveAttribute('aria-label', 'Боец убит');

    await expect(doneChip(page, 0)).toHaveAttribute('aria-label', 'Боец убит');
    await expect(doneChip(page, 1)).toHaveAttribute('aria-label', 'Боец убит');
    await expect(page.getByTestId('dock-soldiers-alive')).toContainText('3/6');
  });

  test('should maintain soldier state when marking multiple soldiers as done', async ({ page }) => {
    const doneButtons = page.getByTestId('soldier-done-button');
    const count = await doneButtons.count();
    expect(count).toBeGreaterThan(0);

    const firstButton = doneButtons.nth(0);
    await firstButton.click({ force: true, timeout: 5000 });
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    const secondButton = doneButtons.nth(1);
    await secondButton.click({ force: true, timeout: 5000 });
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true');

    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    const thirdButton = doneButtons.nth(2);
    await thirdButton.click({ force: true, timeout: 5000 });
    await expect(thirdButton).toHaveAttribute('aria-pressed', 'true');

    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should maintain mixed soldier states (killed and done)', async ({ page }) => {
    await swipeSoldierCard(page, 0, 'right');
    await expect(doneChip(page, 0)).toHaveAttribute('aria-label', 'Боец убит');

    const secondDoneButton = doneChip(page, 1);
    await secondDoneButton.click({ force: true, timeout: 5000 });
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');

    await swipeSoldierCard(page, 2, 'right');
    await expect(doneChip(page, 2)).toHaveAttribute('aria-label', 'Боец убит');

    await expect(doneChip(page, 0)).toHaveAttribute('aria-label', 'Боец убит');
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');
    await expect(doneChip(page, 2)).toHaveAttribute('aria-label', 'Боец убит');

    const firstDoneButton = doneChip(page, 0);
    await expect(firstDoneButton).toHaveAttribute('disabled');
  });

  test('should maintain state across multiple squad units', async ({ page }) => {
    await page.addInitScript(() => {
      const army = JSON.parse(localStorage.getItem('bronepehota_army') || '{}');
      army.units.push({
        instanceId: 'soldier-state-unit-2',
        type: 'squad',
        data: {
          id: 'polaris_lineynaya_klon_pehota',
          name: 'Линейная клон-пехота',
          shortName: 'Линейная',
          faction: 'polaris',
          cost: 50,
          image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
          soldiers: [
            { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
            { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
            { num: 3, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
          ],
        },
        instanceNumber: 2,
        currentSoldiers: [0, 1, 2],
        deadSoldiers: [],
        actionsUsed: [],
      });
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await waitForBattleDock(page);
    await page.waitForTimeout(500);

    const doneButtons = page.getByTestId('soldier-done-button');
    const count = await doneButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);

    await swipeSoldierCard(page, 0, 'right');
    await swipeSoldierCard(page, 3, 'right');

    await expect(doneChip(page, 0)).toHaveAttribute('aria-label', 'Боец убит');
    await expect(doneChip(page, 3)).toHaveAttribute('aria-label', 'Боец убит');
  });

  test('should handle kill toggling correctly (swipe right resurrects)', async ({ page }) => {
    await swipeSoldierCard(page, 0, 'right');
    await expect(doneChip(page, 0)).toHaveAttribute('aria-label', 'Боец убит');

    await swipeSoldierCard(page, 1, 'right');
    await expect(doneChip(page, 1)).toHaveAttribute('aria-label', 'Боец убит');

    // Повторный свайп вправо оживляет (toggle) — только первый боец
    await swipeSoldierCard(page, 0, 'right');
    await expect(doneChip(page, 0)).toHaveAttribute('aria-label', 'Завершить ход бойца');
    await expect(doneChip(page, 1)).toHaveAttribute('aria-label', 'Боец убит');
    await expect(page.getByTestId('dock-soldiers-alive')).toContainText('5/6');
  });

  test('should handle done state toggling correctly', async ({ page }) => {
    const doneButtons = page.getByTestId('soldier-done-button');

    const firstDoneButton = doneButtons.nth(0);
    await firstDoneButton.click({ force: true, timeout: 5000 });
    await expect(firstDoneButton).toHaveAttribute('aria-pressed', 'true');

    const secondDoneButton = doneButtons.nth(1);
    await secondDoneButton.click({ force: true, timeout: 5000 });
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');

    await firstDoneButton.click({ force: true, timeout: 5000 });

    await expect(firstDoneButton).toHaveAttribute('aria-pressed', 'false');
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');
  });

  // Playtest fix: «Готов» moved onto the soldier image (bottom-right corner) —
  // the right-edge action column was removed with the skull button (its
  // ~44px went to the stats). Guards the geometry and the removal itself.
  test('done button sits inside the soldier image; no kill column remains', async ({ page }) => {
    // The kill button is gone entirely — the right swipe is the only kill path
    await expect(page.getByTestId('soldier-kill-button')).toHaveCount(0);

    const doneButton = page.getByTestId('soldier-done-button').nth(0);
    const doneBox = await doneButton.boundingBox();
    expect(doneBox).toBeTruthy();

    // The done button is overlaid on the soldier image: its box lies within
    // the image block (image = the done button's positioned parent).
    const imageBox = await doneButton.evaluate((el) => {
      const overlayParent = el.parentElement!;            // relative shrink-0 wrapper
      const imageBlock = overlayParent.firstElementChild!; // SoldierImage root
      const r = imageBlock.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    expect(doneBox!.x).toBeGreaterThanOrEqual(imageBox.x - 0.5);
    expect(doneBox!.y).toBeGreaterThanOrEqual(imageBox.y - 0.5);
    expect(doneBox!.x + doneBox!.width).toBeLessThanOrEqual(imageBox.x + imageBox.width + 0.5);
    expect(doneBox!.y + doneBox!.height).toBeLessThanOrEqual(imageBox.y + imageBox.height + 0.5);

    // The card row does not overflow horizontally (min-content fits)
    const card = await doneButton.evaluate((el) => {
      const row = el.closest('[class*="flex"][class*="items-center"]') as HTMLElement | null;
      return row ? { scrollWidth: row.scrollWidth, clientWidth: row.clientWidth } : null;
    });
    expect(card).toBeTruthy();
    expect(card!.scrollWidth).toBeLessThanOrEqual(card!.clientWidth + 1);
  });
});
