import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, clearStorage, swipeSoldierCard, expectAliveInNavigator } from './helpers/setup';

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
 * (swipeSoldierCard). Состояние читается data-атрибутами карточки
 * (2026-11-27: чип «ГОТОВ» на фото убран — готов/убит живут в свайпах
 * и листе действий по фото).
 */
test.describe('Soldier State Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'soldier-state-unit-1' },
    });
    await waitForBattleDock(page);
    await page.waitForSelector('[data-testid="soldier-card"]', { timeout: 5000 });
  });

  /** Карточка бойца №index — состояние в data-атрибутах */
  const card = (page: Page, index: number) =>
    page.getByTestId('soldier-card').nth(index);

  const expectDead = (page: Page, index: number) =>
    expect(card(page, index)).toHaveAttribute('data-soldier-dead', 'true');

  const expectDone = (page: Page, index: number) =>
    expect(card(page, index)).toHaveAttribute('data-soldier-done', 'true');

  test('should maintain soldier state when marking multiple soldiers as killed', async ({ page }) => {
    const count = await page.getByTestId('soldier-card').count();
    expect(count).toBeGreaterThan(0);

    await swipeSoldierCard(page, 0, 'right');
    await expectDead(page, 0);

    await swipeSoldierCard(page, 1, 'right');
    await expectDead(page, 1);

    // First soldier stays dead (the React-key regression flipped it back)
    await expectDead(page, 0);

    await swipeSoldierCard(page, 2, 'right');
    await expectDead(page, 2);

    await expectDead(page, 0);
    await expectDead(page, 1);
    await expectAliveInNavigator(page, 'soldier-state-unit-1', '3/6');
  });

  test('should maintain soldier state when marking multiple soldiers as done', async ({ page }) => {
    const count = await page.getByTestId('soldier-card').count();
    expect(count).toBeGreaterThan(0);

    await swipeSoldierCard(page, 0, 'left');
    await expectDone(page, 0);

    await swipeSoldierCard(page, 1, 'left');
    await expectDone(page, 1);

    await expectDone(page, 0);

    await swipeSoldierCard(page, 2, 'left');
    await expectDone(page, 2);

    await expectDone(page, 0);
    await expectDone(page, 1);
  });

  test('should maintain mixed soldier states (killed and done)', async ({ page }) => {
    await swipeSoldierCard(page, 0, 'right');
    await expectDead(page, 0);

    await swipeSoldierCard(page, 1, 'left');
    await expectDone(page, 1);

    await swipeSoldierCard(page, 2, 'right');
    await expectDead(page, 2);

    await expectDead(page, 0);
    await expectDone(page, 1);
    await expectDead(page, 2);
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

    const count = await page.getByTestId('soldier-card').count();
    expect(count).toBeGreaterThanOrEqual(6);

    await swipeSoldierCard(page, 0, 'right');
    await swipeSoldierCard(page, 3, 'right');

    await expectDead(page, 0);
    await expectDead(page, 3);
  });

  test('should handle kill toggling correctly (swipe right resurrects)', async ({ page }) => {
    await swipeSoldierCard(page, 0, 'right');
    await expectDead(page, 0);

    await swipeSoldierCard(page, 1, 'right');
    await expectDead(page, 1);

    // Повторный свайп вправо оживляет (toggle) — только первый боец
    await swipeSoldierCard(page, 0, 'right');
    await expect(card(page, 0)).toHaveAttribute('data-soldier-dead', 'false');
    await expectDead(page, 1);
    await expectAliveInNavigator(page, 'soldier-state-unit-1', '5/6');
  });

  test('should handle done state toggling correctly', async ({ page }) => {
    await swipeSoldierCard(page, 0, 'left');
    await expectDone(page, 0);

    await swipeSoldierCard(page, 1, 'left');
    await expectDone(page, 1);

    await swipeSoldierCard(page, 0, 'left');

    await expect(card(page, 0)).toHaveAttribute('data-soldier-done', 'false');
    await expectDone(page, 1);
  });

  // Guard of the 2026-11-27 redesign: чип «ГОТОВ» с фото убран (кнопки
  // готов/убит — свайпы и лист действий по тапу на фото), кнопки «череп»
  // и «kill-колонки» тоже нет. Карточный ряд не переполняется по ширине.
  test('no done/kill buttons remain; card row does not overflow', async ({ page }) => {
    await expect(page.getByTestId('soldier-done-button')).toHaveCount(0);
    await expect(page.getByTestId('soldier-kill-button')).toHaveCount(0);

    const row = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="soldier-card"]') as HTMLElement | null;
      return card ? { scrollWidth: card.scrollWidth, clientWidth: card.clientWidth } : null;
    });
    expect(row).toBeTruthy();
    expect(row!.scrollWidth).toBeLessThanOrEqual(row!.clientWidth + 1);
  });
});
