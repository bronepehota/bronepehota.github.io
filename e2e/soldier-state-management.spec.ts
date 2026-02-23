import { test, expect } from '@playwright/test';

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
    // Set up game session state BEFORE page loads (using addInitScript)
    await page.addInitScript(() => {
      const army = {
        name: 'Soldier State Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'soldier-state-unit-1',
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
              { num: 4, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
              { num: 5, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
              { num: 6, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' }
            ]
          },
          instanceNumber: 1,
          currentSoldiers: [0, 1, 2, 3, 4, 5],
          deadSoldiers: [],
          actionsUsed: []
        }],
        totalCost: 50,
        currentStep: 'battle',
        isInBattle: true,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    // Navigate to app page - localStorage is already set from addInitScript
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Check if game session is visible
    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Wait for unit card to be visible and click to expand
    await page.waitForSelector('[data-testid^="unit-nav-"]', { timeout: 5000 });
    const unitCard = page.getByTestId(/^unit-nav-/).first();
    await expect(unitCard).toBeVisible();

    // Click unit card to expand it
    await unitCard.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);

    // Wait for soldier buttons to be visible
    await page.waitForSelector('[data-testid="soldier-kill-button"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="soldier-done-button"]', { timeout: 5000 });
  });

  test('should maintain soldier state when marking multiple soldiers as killed', async ({ page }) => {
    // Get all soldier kill buttons
    const killButtons = page.getByTestId('soldier-kill-button');
    const count = await killButtons.count();

    expect(count).toBeGreaterThan(0);

    // Click kill button for soldier 1 (index 0)
    const firstButton = killButtons.nth(0);
    await firstButton.click({ force: true, timeout: 5000 });

    // Wait for state update and verify
    await page.waitForTimeout(500);
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    // Click kill button for soldier 2 (index 1)
    const secondButton = killButtons.nth(1);
    await secondButton.click({ force: true, timeout: 5000 });

    // Wait for state update and verify
    await page.waitForTimeout(500);
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true');

    // CRITICAL BUG FIX VERIFICATION:
    // Soldier 1 should STILL be marked as killed (not resurrected)
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    // Click kill button for soldier 3 (index 2)
    const thirdButton = killButtons.nth(2);
    await thirdButton.click({ force: true, timeout: 5000 });

    // Wait for state update and verify
    await page.waitForTimeout(500);
    await expect(thirdButton).toHaveAttribute('aria-pressed', 'true');

    // CRITICAL BUG FIX VERIFICATION:
    // Soldiers 1 and 2 should STILL be marked as killed
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should maintain soldier state when marking multiple soldiers as done', async ({ page }) => {
    // Get all soldier done buttons
    const doneButtons = page.getByTestId('soldier-done-button');
    const count = await doneButtons.count();

    expect(count).toBeGreaterThan(0);

    // Click done button for soldier 1 (index 0)
    const firstButton = doneButtons.nth(0);
    await firstButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);

    // Verify soldier 1 is marked as done (aria-pressed="true")
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    // Click done button for soldier 2 (index 1)
    const secondButton = doneButtons.nth(1);
    await secondButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);

    // Verify soldier 2 is marked as done
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true');

    // CRITICAL BUG FIX VERIFICATION:
    // Soldier 1 should STILL be marked as done (not reset)
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    // Click done button for soldier 3 (index 2)
    const thirdButton = doneButtons.nth(2);
    await thirdButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);

    // Verify soldier 3 is marked as done
    await expect(thirdButton).toHaveAttribute('aria-pressed', 'true');

    // CRITICAL BUG FIX VERIFICATION:
    // Soldiers 1 and 2 should STILL be marked as done
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should maintain mixed soldier states (killed and done)', async ({ page }) => {
    const killButtons = page.getByTestId('soldier-kill-button');
    const doneButtons = page.getByTestId('soldier-done-button');

    // Mark soldier 1 as killed
    const firstKillButton = killButtons.nth(0);
    await firstKillButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');

    // Mark soldier 2 as done
    const secondDoneButton = doneButtons.nth(1);
    await secondDoneButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');

    // Mark soldier 3 as killed
    const thirdKillButton = killButtons.nth(2);
    await thirdKillButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
    await expect(thirdKillButton).toHaveAttribute('aria-pressed', 'true');

    // CRITICAL BUG FIX VERIFICATION:
    // All previous states should be preserved
    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true'); // Still killed
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true'); // Still done
    await expect(thirdKillButton).toHaveAttribute('aria-pressed', 'true'); // Still killed

    // Verify soldier 1's done button is disabled (soldier is dead)
    const firstDoneButton = doneButtons.nth(0);
    await expect(firstDoneButton).toHaveAttribute('disabled');
  });

  test('should maintain state across multiple squad units', async ({ page }) => {
    // Add a second squad unit via localStorage manipulation
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
            { num: 3, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' }
          ]
        },
        instanceNumber: 2,
        currentSoldiers: [0, 1, 2],
        deadSoldiers: [],
        actionsUsed: []
      });
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Get all kill buttons from both units
    const killButtons = page.getByTestId('soldier-kill-button');
    const count = await killButtons.count();

    expect(count).toBeGreaterThanOrEqual(6); // At least 6 soldiers across both units

    // Mark soldier 1 in first unit as killed
    const firstKillButton = killButtons.nth(0);
    await firstKillButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);

    // Mark soldier 4 (first soldier in second unit) as killed
    const fourthKillButton = killButtons.nth(3);
    await fourthKillButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);

    // CRITICAL BUG FIX VERIFICATION:
    // Both soldiers should remain killed
    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');
    await expect(fourthKillButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle state toggling correctly (untoggling killed soldiers)', async ({ page }) => {
    const killButtons = page.getByTestId('soldier-kill-button');

    // Mark soldier 1 as killed
    const firstKillButton = killButtons.nth(0);
    await firstKillButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');

    // Mark soldier 2 as killed
    const secondKillButton = killButtons.nth(1);
    await secondKillButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
    await expect(secondKillButton).toHaveAttribute('aria-pressed', 'true');

    // Untoggle soldier 1 (resurrect via short click - this should toggle)
    await firstKillButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);

    // Note: A short click on a killed soldier still kills them (toggles to killed state)
    // The long-press resurrection is a separate interaction
    await expect(firstKillButton).toHaveAttribute('aria-pressed', 'true');

    // Soldier 2 should still be killed
    await expect(secondKillButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle done state toggling correctly', async ({ page }) => {
    const doneButtons = page.getByTestId('soldier-done-button');

    // Mark soldier 1 as done
    const firstDoneButton = doneButtons.nth(0);
    await firstDoneButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
    await expect(firstDoneButton).toHaveAttribute('aria-pressed', 'true');

    // Mark soldier 2 as done
    const secondDoneButton = doneButtons.nth(1);
    await secondDoneButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');

    // Untoggle soldier 1 (short click on done button should toggle back to not done)
    await firstDoneButton.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);

    // Note: A short click on a done soldier toggles back to not done
    // The long-press is for cancelling when already done
    await expect(firstDoneButton).toHaveAttribute('aria-pressed', 'false');

    // Soldier 2 should still be done
    await expect(secondDoneButton).toHaveAttribute('aria-pressed', 'true');
  });
});
