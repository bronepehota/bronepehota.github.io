import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, expandFirstUnit, clearStorage } from './helpers/setup';

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
 */
test.describe('Soldier State Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'soldier-state-unit-1' },
    });
    await expandFirstUnit(page);
    await page.waitForSelector('[data-testid="soldier-kill-button"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="soldier-done-button"]', { timeout: 5000 });
  });

  test('should maintain soldier state when marking multiple soldiers as killed', async ({ page }) => {
    const killButtons = page.getByTestId('soldier-kill-button');
    const count = await killButtons.count();
    expect(count).toBeGreaterThan(0);

    const firstButton = killButtons.nth(0);
    await firstButton.click({ force: true, timeout: 5000 });
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    const secondButton = killButtons.nth(1);
    await secondButton.click({ force: true, timeout: 5000 });
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true');

    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    const thirdButton = killButtons.nth(2);
    await thirdButton.click({ force: true, timeout: 5000 });
    await expect(thirdButton).toHaveAttribute('aria-pressed', 'true');

    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true');
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
    const killButtons = page.getByTestId('soldier-kill-button');
    const doneButtons = page.getByTestId('soldier-done-button');

    const firstKillButton = killButtons.nth(0);
    await firstKillButton.click({ force: true, timeout: 5000 });
    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');

    const secondDoneButton = doneButtons.nth(1);
    await secondDoneButton.click({ force: true, timeout: 5000 });
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');

    const thirdKillButton = killButtons.nth(2);
    await thirdKillButton.click({ force: true, timeout: 5000 });
    await expect(thirdKillButton).toHaveAttribute('aria-pressed', 'true');

    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');
    await expect(thirdKillButton).toHaveAttribute('aria-pressed', 'true');

    const firstDoneButton = doneButtons.nth(0);
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
    await page.waitForTimeout(500);

    const killButtons = page.getByTestId('soldier-kill-button');
    const count = await killButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);

    const firstKillButton = killButtons.nth(0);
    await firstKillButton.click({ force: true, timeout: 5000 });

    const fourthKillButton = killButtons.nth(3);
    await fourthKillButton.click({ force: true, timeout: 5000 });

    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');
    await expect(fourthKillButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle state toggling correctly (untoggling killed soldiers)', async ({ page }) => {
    const killButtons = page.getByTestId('soldier-kill-button');

    const firstKillButton = killButtons.nth(0);
    await firstKillButton.click({ force: true, timeout: 5000 });
    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');

    const secondKillButton = killButtons.nth(1);
    await secondKillButton.click({ force: true, timeout: 5000 });
    await expect(secondKillButton).toHaveAttribute('aria-pressed', 'true');

    await firstKillButton.click({ force: true, timeout: 5000 });

    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');
    await expect(secondKillButton).toHaveAttribute('aria-pressed', 'true');
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
});
