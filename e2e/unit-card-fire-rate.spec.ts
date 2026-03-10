import { test, expect } from '@playwright/test';

test.describe('Machine Fire Rate Limit', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto('/app');
  });

  test('machine should be limited by fire rate', async ({ page }) => {
    // Navigate to army builder
    await page.click('[data-testid="faction-card-polaris"]');
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(300);
    await page.click('button:has-text("500")');
    await page.waitForTimeout(300);
    await page.click('[data-testid="budget-next-button"]');
    await page.waitForTimeout(300);
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Switch to machines tab
    await page.click('button:has-text("Машины")');
    await page.waitForTimeout(500);

    // Find and add "Демолишер" machine (has fireRate=2, cost=400)
    const demolisherUnit = page.locator('h3:has-text("ДЕМОЛИШЕР")');
    await expect(demolisherUnit).toBeVisible({ timeout: 5000 });

    // Scroll to the machine to ensure it's visible
    await demolisherUnit.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Find the "В АРМИЮ" button for this machine
    const demolisherCard = demolisherUnit.locator('..').locator('..').locator('..');
    const addButton = demolisherCard.locator('button:has-text("В АРМИЮ")');
    await addButton.click();
    await page.waitForTimeout(500);

    // Switch to "АРМИЯ" tab to see the added machine
    await page.click('[role="tab"]:has-text("АРМИЯ")');
    await page.waitForTimeout(500);

    // Verify the machine is now in the army
    expect(await page.locator('text=ДЕМОЛИШЕР').isVisible()).toBe(true);

    // Switch to game session
    await page.click('[data-testid="to-battle-button"]');
    await page.waitForTimeout(500);

    // Start the battle first (this is required to show weapons)
    const startBattleButton = page.locator('[data-testid="confirm-initiative-button"], button:has-text("НАЧАТЬ БОЙ")');
    const isStartButtonVisible = await startBattleButton.isVisible({ timeout: 2000 });
    console.log(`Start battle button visible: ${isStartButtonVisible}`);

    if (isStartButtonVisible) {
      // Use force: true to click even if something else is intercepting
      await startBattleButton.click({ force: true });
      console.log('Clicked start battle button');

      // Wait for modal to be hidden - check multiple times
      for (let i = 0; i < 10; i++) {
        const modalHidden = await page.locator('[data-testid="initiative-modal"]').isHidden().catch(() => false);
        console.log(`Attempt ${i + 1}: Modal hidden = ${modalHidden}`);
        if (modalHidden) break;
        await page.waitForTimeout(500);
      }
    }

    // Wait a bit more for UI to stabilize
    await page.waitForTimeout(500);

    // Open machine card in game session - use force click if needed
    const gameSessionCard = page.locator('text=ДЕМОЛИШЕР').first();
    await gameSessionCard.click({ force: true });
    await page.waitForTimeout(500);

    // Now fire buttons should be visible (regardless of rules version after fix)
    const fireButton = page.locator('button:has-text("ВЫСТРЕЛ")').first();
    const fireButtonCount = await fireButton.count();
    console.log(`Found ${fireButtonCount} fire buttons with text "ВЫСТРЕЛ" after opening card`);

    if (fireButtonCount === 0) {
      console.log('ERROR: No fire buttons found! Machine weapons may not be displayed.');

      // Check current rules version
      const rulesVersion = await page.evaluate(() => {
        return localStorage.getItem('bronepehota_rules_version');
      });
      console.log(`Current rules version in localStorage: ${rulesVersion}`);

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/no-fire-buttons-debug.png', fullPage: true });
      console.log('Full page screenshot saved to test-results/no-fire-buttons-debug.png');

      // This should not happen after the fix - weapons should be visible for all rules versions
      throw new Error('Fire buttons not found - fix may not be working correctly');
    }

    console.log('Starting fire rate limit test...');

    // Helper function to close combat modal by clicking ПРИНЯТЬ or similar
    async function closeCombatModal() {
      // Try to find and click accept/apply button in combat modal
      const acceptButton = page.locator('button:has-text("ПРИНЯТЬ"), button:has-text("ПРИМЕНИТЬ"), button:has-text("ЗАКРЫТЬ")').first();
      const acceptButtonCount = await acceptButton.count();

      if (acceptButtonCount > 0) {
        await acceptButton.click({ timeout: 2000 }).catch(() => {
          // If clicking fails, try Escape
          return page.keyboard.press('Escape');
        });
        await page.waitForTimeout(300);
      } else {
        // Fallback to Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      // Additional wait for modal animation
      await page.waitForTimeout(200);
    }

    // Fire weapon 4 times (exceeds fireRate=2)
    for (let i = 0; i < 4; i++) {
      console.log(`\n=== Firing shot ${i + 1} ===`);

      // Get fresh button reference for each iteration
      const currentFireButton = page.locator('button:has-text("ВЫСТРЕЛ")').first();

      // Check if button is enabled before clicking
      const isEnabled = await currentFireButton.isEnabled();
      const disabled = await currentFireButton.getAttribute('disabled');
      const opacity = await currentFireButton.evaluate(el => window.getComputedStyle(el).opacity);
      const bgClass = await currentFireButton.evaluate(el => el.className);

      console.log(`Shot ${i + 1}: Button enabled=${isEnabled}, disabled attr=${disabled}, opacity=${opacity}`);
      console.log(`Shot ${i + 1}: Button classes contain 'bg-amber-950/40'? ${bgClass.includes('bg-amber-950/40')}`);
      console.log(`Shot ${i + 1}: Button classes contain 'bg-slate-900/40'? ${bgClass.includes('bg-slate-900/40')}`);

      // If button is disabled, we've hit the limit - break early
      if (disabled === '' || !isEnabled || opacity === '0.5' || bgClass.includes('bg-slate-900/40')) {
        console.log(`Shot ${i + 1}: Button is disabled, fire rate limit reached!`);
        break;
      }

      await currentFireButton.click({ timeout: 5000 });
      await page.waitForTimeout(500);

      // Check if combat modal appeared
      const combatModal = page.locator('[data-testid="combat-modal"], [role="dialog"]');
      const modalVisible = await combatModal.isVisible().catch(() => false);

      if (modalVisible) {
        console.log(`Shot ${i + 1}: Combat modal opened ✓`);
        await closeCombatModal();
      } else {
        console.log(`Shot ${i + 1}: No combat modal - button might be disabled`);
      }
    }

    // Final check - verify fire rate limit is enforced
    const finalFireButton = page.locator('button:has-text("ВЫСТРЕЛ")').first();
    const finalEnabled = await finalFireButton.isEnabled();
    const finalDisabled = await finalFireButton.getAttribute('disabled');
    const finalOpacity = await finalFireButton.evaluate(el => window.getComputedStyle(el).opacity);

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Fire rate limit: 2 shots per turn`);
    console.log(`Button still enabled: ${finalEnabled}`);
    console.log(`Button disabled attr: ${finalDisabled}`);
    console.log(`Button opacity: ${finalOpacity}`);

    // VERIFY THE FIX: Button should be disabled after 2 shots
    expect(finalEnabled).toBe(false);

    console.log('\n✅ Fire rate limit is ENFORCED - bug is FIXED!');
  });
});
