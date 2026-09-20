import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * #165 + blast-rework — grenade target log stays compact for many targets:
 * one-line rows, the fresh verdict banner lands at the top, and the modal
 * content snaps back to the top after every ВЗРЫВ (thumb taps at the bottom,
 * eyes read the result at the top).
 *
 * Flow: expand unit card -> "Выберите действие" -> ГРАНАТА -> PARAMETERS (БРОСИТЬ)
 *       -> RESULTS (throw block + sticky arming strip) -> click ВЗРЫВ 6x
 */
test.describe('Grenade target list (#165)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('compact log, verdict banner on top, scroll-to-top after each ВЗРЫВ', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'grenade-unit-1' },
    });

    // The squad is focused by default (unit 0) — the action button is up
    await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });

    // Open combat modal via action button
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });

    // Select grenade action
    const grenadeButton = page.getByRole('button', { name: /граната/i });
    await expect(grenadeButton).toBeVisible({ timeout: 3000 });
    await grenadeButton.click();

    // PARAMETERS phase: throw grenade (distance roll)
    const throwButton = page.getByRole('button', { name: /бросить/i });
    await expect(throwButton).toBeVisible({ timeout: 3000 });
    await throwButton.click();

    // RESULTS: single throw block; aim crosshair + no verdict banner before the first check
    await expect(page.getByTestId('grenade-blast-ruler')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('grenade-blast-aim')).toBeVisible();
    await expect(page.getByTestId('grenade-target-check-section')).toBeVisible();
    await expect(page.getByTestId('grenade-verdict-banner')).toHaveCount(0);

    // Add 6 targets via ВЗРЫВ; after each: row count, banner names the fresh
    // target, and the modal content is snapped back to the top
    const explode = page.getByTestId('grenade-explode-button');
    const scrollEl = page.getByTestId('combat-modal-scroll');
    for (let i = 1; i <= 6; i++) {
      await expect(explode).toBeVisible();
      await explode.click();
      await expect(page.getByTestId('grenade-blast-check')).toHaveCount(i);
      await expect(page.getByTestId('grenade-verdict-banner')).toContainText(`ЦЕЛЬ ${i}`);
      await expect
        .poll(() => scrollEl.evaluate((el) => el.scrollTop))
        .toBe(0);
    }

    // All six target rows present, tally counts the whole log
    await expect(page.getByTestId('grenade-blast-check')).toHaveCount(6);
    await expect(page.getByTestId('grenade-hit-tally')).toContainText('/6 пробито');

    // Sticky arming strip keeps ВЗРЫВ reachable; ПРИНЯТЬ closes the flow
    await expect(page.getByTestId('grenade-target-check-section')).toBeVisible();
    const applyButton = page.getByRole('button', { name: /принять/i });
    await applyButton.scrollIntoViewIfNeeded();
    await expect(applyButton).toBeVisible();
  });
});
