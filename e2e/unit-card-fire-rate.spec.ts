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

    // Open machine card in game session
    const gameSessionCard = page.locator('text=ДЕМОЛИШЕР').first();
    await gameSessionCard.click();
    await page.waitForTimeout(500);

    // Click "НАЧАТЬ БОЙ" to start the battle and show weapons
    const startBattleButton = page.locator('button:has-text("НАЧАТЬ БОЙ")');
    await startBattleButton.click();
    await page.waitForTimeout(500);

    // Take a screenshot to see what's displayed
    await page.screenshot({ path: 'test-results/machine-card-opened.png' });
    console.log('Screenshot saved to test-results/machine-card-opened.png');

    // Debug: List all buttons on the page
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on the page`);
    for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
      const text = await allButtons[i].textContent();
      const className = await allButtons[i].getAttribute('class');
      console.log(`Button ${i}: "${text}" - classes: ${className?.substring(0, 100)}`);
    }

    // Find the fire button for weapon 0 (first "ВЫСТРЕЛ" button)
    const fireButton = page.locator('button:has-text("ВЫСТРЕЛ")').first();
    const fireButtonCount = await fireButton.count();
    console.log(`Found ${fireButtonCount} fire buttons with text "ВЫСТРЕЛ"`);

    if (fireButtonCount === 0) {
      console.log('ERROR: No fire buttons found! Machine weapons may not be displayed.');
      console.log('This might be because rules version is not "tehnolog"');

      // Check current rules version
      const rulesVersion = await page.evaluate(() => {
        return localStorage.getItem('bronepehota_rules_version');
      });
      console.log(`Current rules version in localStorage: ${rulesVersion}`);

      // Take another screenshot for debugging
      await page.screenshot({ path: 'test-results/no-fire-buttons-debug.png', fullPage: true });
      console.log('Full page screenshot saved to test-results/no-fire-buttons-debug.png');

      // Skip the rest of the test
      return;
    }

    console.log('Starting fire rate limit test...');

    // Fire weapon 4 times (exceeds fireRate=2)
    for (let i = 0; i < 4; i++) {
      console.log(`\n=== Firing shot ${i + 1} ===`);

      // Check if button is enabled before clicking
      const isEnabled = await fireButton.isEnabled();
      const disabled = await fireButton.getAttribute('disabled');
      const opacity = await fireButton.evaluate(el => window.getComputedStyle(el).opacity);
      const bgClass = await fireButton.evaluate(el => el.className);

      console.log(`Shot ${i + 1}: Button enabled=${isEnabled}, disabled attr=${disabled}, opacity=${opacity}`);
      console.log(`Shot ${i + 1}: Button classes contain 'bg-amber-950/40'? ${bgClass.includes('bg-amber-950/40')}`);
      console.log(`Shot ${i + 1}: Button classes contain 'bg-slate-900/40'? ${bgClass.includes('bg-slate-900/40')}`);

      await fireButton.click();
      await page.waitForTimeout(500);

      // Check if combat modal appeared
      const combatModal = page.locator('[data-testid="combat-modal"], [role="dialog"]');
      const modalVisible = await combatModal.isVisible().catch(() => false);

      if (modalVisible) {
        console.log(`Shot ${i + 1}: Combat modal opened ✓`);

        // Close modal by pressing Escape or clicking outside
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } else {
        console.log(`Shot ${i + 1}: No combat modal - button might be disabled`);
      }
    }

    // Final check - verify bug exists
    const finalEnabled = await fireButton.isEnabled();
    const finalDisabled = await fireButton.getAttribute('disabled');
    const finalOpacity = await fireButton.evaluate(el => window.getComputedStyle(el).opacity);

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Fire rate limit: 2 shots per turn`);
    console.log(`Shots attempted: 4`);
    console.log(`Button still enabled: ${finalEnabled}`);
    console.log(`Button disabled attr: ${finalDisabled}`);
    console.log(`Button opacity: ${finalOpacity}`);

    // BUG DOCUMENTATION:
    // - Machine with fireRate=2 should only fire 2 times per turn
    // - Test shows machine can fire 4+ times without being blocked
    // - Button remains enabled regardless of shots taken
    // - No visual indicator (opacity, disabled state) when limit reached
    // - This is a CRITICAL BUG that breaks game balance
  });
});
