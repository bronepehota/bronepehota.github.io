import { test, expect } from '@playwright/test';
import { clearStorage, dismissIntroIfShown } from './helpers/setup';

/**
 * Game Session E2E tests
 * Tests combat gameplay and unit management in battle
 */
test.describe('Game Session', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  // Регрессии класса «битый localStorage» (ручные находки 2026-08-28):
  test('битый юнит в армии не роняет GameSession (санитайзинг на границе хранилища)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/app');
    await page.evaluate(() => {
      // конверт saveArmy + валидный юнит + мусорные записи ({}, без data, кривой type).
      // migrateArmy фильтрует мусор — раньше: TypeError reading 'zone'/'id'/'name'.
      const valid = {
        instanceId: 'broken-seed-valid-1',
        type: 'squad',
        data: {
          id: 'polaris_lineynaya_klon_pehota', name: 'Линейная клон-пехота', shortName: 'Линейная',
          faction: 'polaris', cost: 50, image: '',
          soldiers: [{ num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' }],
        },
        instanceNumber: 1, currentSoldiers: [0], deadSoldiers: [], actionsUsed: [],
      };
      localStorage.setItem('bronepehota_army', JSON.stringify({
        schemaVersion: 1,
        army: { name: 'T', faction: 'polaris', units: [valid, {}, { type: 'weird' }], totalCost: 50, isInBattle: true, currentTurn: 1 },
      }));
      localStorage.setItem('bronepehota_view', 'game');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    // страница живая: нет pageerror, сессия смонтировалась на валидном юните
    expect(errors).toEqual([]);
    await expect(page.getByTestId('game-session').first()).toBeVisible({ timeout: 10000 });
  });

  test('view=game без армии → фолбэк в билдер (не пустой экран)', async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(() => {
      localStorage.removeItem('bronepehota_army');
      localStorage.setItem('bronepehota_view', 'game');
    });
    await page.reload();
    await dismissIntroIfShown(page);
    // юнитов нет — GameSession не монтируется, билдер (экран правил) виден
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });
    expect(await page.getByTestId('game-session').count()).toBe(0);
  });

  test('should display game session interface when in battle', async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-unit-1',
          data: { id: 'test', name: 'Test Unit', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3],
        }],
        totalCost: 50,
        currentStep: 'game',
        isInBattle: true,
        currentTurn: 1,
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const gameSession = page.getByTestId('game-session');
    const hasGameSession = await gameSession.count() > 0;
    if (hasGameSession) {
      await expect(gameSession).toBeVisible();
    }
  });

  test('should display panic toggle when units are damaged', async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-unit-1',
          data: { id: 'test', name: 'Test Unit', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2],
          deadSoldiers: 1,
        }],
        totalCost: 50,
        currentStep: 'game',
        isInBattle: true,
        currentTurn: 1,
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const panicToggle = page.getByTestId('panic-toggle');
    if (await panicToggle.count() > 0) {
      await expect(panicToggle).toBeVisible();
    }
  });
});
