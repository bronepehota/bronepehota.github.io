import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, expandFirstUnit, clearStorage } from './helpers/setup';

/**
 * #167 — a panicking soldier can be marked killed.
 */
test.describe('Kill in panic (#167)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await setupGameSessionWithSquad(page, {
      unitOverrides: {
        instanceId: 'panic-kill-unit-1',
        // Soldier 0 is panicking this turn
        panicState: [{ soldierIndex: 0, testRoll: 6, rank: 2, triggeredAtTurn: 1 }],
      },
    });
    await expandFirstUnit(page);
  });

  test('panicking soldier shows a working УБИТЬ button and no ГОТОВ button', async ({ page }) => {
    const panickingKill = page.locator(
      '[data-testid="soldier-kill-button"][data-soldier-index="0"]'
    );
    await expect(panickingKill).toBeVisible({ timeout: 5000 });

    // DONE stays hidden for a panicking soldier
    const panickingDone = page.locator(
      '[data-testid="soldier-done-button"][data-soldier-index="0"]'
    );
    await expect(panickingDone).toHaveCount(0);

    // Killing the panicking soldier works
    await panickingKill.click({ force: true, timeout: 5000 });
    await expect(panickingKill).toHaveAttribute('aria-pressed', 'true');
  });
});
