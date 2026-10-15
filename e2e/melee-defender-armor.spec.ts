import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, clearStorage, openMeleeModal } from './helpers/setup';

/**
 * #160 — melee defender uses armor (Бр): the parameters show «Броня цели»
 * (not «ББ цели»), and the melee resolves.
 */
test.describe('Melee defender armor (#160)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('melee shows «Броня цели» and resolves', async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'melee-armor-unit-1' },
    });

    // Open combat modal (same path as combat.spec.ts) — squad focused by default
    await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });

    // Тап по стату ББ — прямой пуск ближнего боя
    await openMeleeModal(page);
    await page.waitForTimeout(300);

    // Parameters: «Броня цели» present, «ББ цели» absent
    await expect(page.getByText('Броня цели').first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('ББ цели')).toHaveCount(0);

    // Execute (АТАКОВАТЬ) → results render
    const attackButton = page.getByRole('button', { name: /атаковать/i });
    await expect(attackButton).toBeVisible({ timeout: 3000 });
    await attackButton.click();

    // Results: melee outcome label present (ПОБЕДА / КОНТРАТАКА / НИЧЬЯ)
    const meleeOutcome = page.locator('text=/(ПОБЕДА|КОНТРАТАКА|НИЧЬЯ)/');
    await expect(meleeOutcome.first()).toBeVisible({ timeout: 3000 });
  });
});
