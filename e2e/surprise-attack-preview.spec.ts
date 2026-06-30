import { test, expect, type Page } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage } from './helpers/setup';

/**
 * #174 — surprise attack («с тыла») preview:
 * hit probability is NOT inflated; penetration reflects the double power roll (макс).
 */
test.describe('Surprise-attack preview (#174)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  async function openShotModal(page: Page) {
    const unitCard = page.getByTestId('unit-nav-surprise-unit-1');
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(400);
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(400);
    const shotButton = page.getByRole('button', { name: /выстрел/i }).first();
    await expect(shotButton).toBeVisible({ timeout: 3000 });
    await shotButton.click();
    await page.waitForTimeout(300);
  }

  test('«с тыла» does not inflate hit; raises penetration; shows макс', async ({ page }) => {
    await setupGameSessionWithSquad(page, { unitOverrides: { instanceId: 'surprise-unit-1' } });
    await openShotModal(page);

    const hitEl = page.getByTestId('hit-probability');
    const penEl = page.getByTestId('penetration-probability');

    await expect(hitEl).toBeVisible({ timeout: 3000 });
    const hitBefore = (await hitEl.textContent())!.trim();
    const penBefore = Number((await penEl.textContent())!.replace('%', '').trim());

    // No макс marker before toggling
    await expect(page.getByTestId('power-max-marker')).toHaveCount(0);

    // Toggle «с тыла» on
    const surpriseChip = page.locator('button[aria-label*="Внезапная атака"]');
    await surpriseChip.click();
    await page.waitForTimeout(200);

    // Hit probability UNCHANGED (not inflated)
    const hitAfter = (await hitEl.textContent())!.trim();
    expect(hitAfter).toBe(hitBefore);

    // Penetration probability INCREASED (best-of-2)
    const penAfter = Number((await penEl.textContent())!.replace('%', '').trim());
    expect(penAfter).toBeGreaterThan(penBefore);

    // макс marker now present (power notation)
    await expect(page.getByTestId('power-max-marker').first()).toBeVisible({ timeout: 2000 });
  });
});
