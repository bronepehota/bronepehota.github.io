import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * #165 — grenade target list must scroll and keep ВЗРЫВ reachable for many targets.
 *
 * Flow: expand unit card -> "Выберите действие" -> ГРАНАТА -> PARAMETERS (БРОСИТЬ)
 *       -> RESULTS phase with sticky arming panel -> click ВЗРЫВ 6x -> verify scroll/labels/ПРИНЯТЬ
 */
test.describe('Grenade target list (#165)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('scrolls and keeps ВЗРЫВ reachable for 6+ targets', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'grenade-unit-1' },
    });

    // Expand unit card to see action button
    const unitCard = page.getByTestId('unit-nav-grenade-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);

    // Open combat modal via action button
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(500);

    // Select grenade action
    const grenadeButton = page.getByRole('button', { name: /граната/i });
    await expect(grenadeButton).toBeVisible({ timeout: 3000 });
    await grenadeButton.click();
    await page.waitForTimeout(300);

    // PARAMETERS phase: throw grenade (distance roll)
    const throwButton = page.getByRole('button', { name: /бросить/i });
    await expect(throwButton).toBeVisible({ timeout: 3000 });
    await throwButton.click();
    await page.waitForTimeout(500);

    // Arming panel (sticky target-check section) visible
    const section = page.getByTestId('grenade-target-check-section');
    await expect(section).toBeVisible({ timeout: 3000 });

    // Add 6 targets via ВЗРЫВ button; verify sticky panel stays reachable after each
    const explode = page.getByTestId('grenade-explode-button');
    for (let i = 1; i <= 6; i++) {
      await expect(explode).toBeVisible();
      await explode.click();
      await expect(page.getByTestId('grenade-blast-check')).toHaveCount(i);
    }

    // All six target checks present
    await expect(page.getByTestId('grenade-blast-check')).toHaveCount(6);

    // "ЦЕЛЬ 6" label renders and is reachable via scroll
    const target6 = page.getByText('ЦЕЛЬ 6');
    await target6.scrollIntoViewIfNeeded();
    await expect(target6).toBeVisible();

    // ПРИНЯТЬ button reachable at the bottom
    const applyButton = page.getByRole('button', { name: /принять/i });
    await applyButton.scrollIntoViewIfNeeded();
    await expect(applyButton).toBeVisible();
  });
});
