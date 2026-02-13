import { When, Then, Given } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// ============================================================================
// PANIC TEST FLOW STEPS
// These steps handle panic test scenarios for Star System rules
// ============================================================================

// Step: Switch to army tab (for panic tests)
Given('panic: я переключаюсь на вкладку {string}', async function(this: BronepehotaWorld, tabName: string) {
  if (tabName === 'Армия' || tabName === 'армия') {
    // Click on second tab (АРМИЯ)
    const tabs = this.page.locator('[role="tab"]');
    const count = await tabs.count();
    if (count >= 2) {
      await tabs.nth(1).click({ timeout: 5000, force: true });
    }
    // Wait longer for view to update and army summary to be visible
    await this.page.waitForTimeout(1500);

    // Wait for army summary view to be visible
    const armySummary = this.page.getByTestId('army-summary-view');
    await armySummary.waitFor({ state: 'visible', timeout: 5000 });
  }
});

// Step: Add squad to army (for panic tests)
// Assumes we're already on unit selection page after rules confirmation
Given('panic: я добавляю в армию отряд {string}', async function(this: BronepehotaWorld, squadName: string) {
  // Wait for unit selector to be visible
  const unitSelector = this.page.getByTestId('unit-selector').or(this.page.locator('#unit-selector'));
  await unitSelector.first().waitFor({ state: 'visible', timeout: 10000 });

  // Map squad names to their IDs
  const squadIdMap: Record<string, string> = {
    'Лёгкая штурмовая': 'polaris_lyogkaya_shturmovaya_klon_pehota',
  };

  const squadId = squadIdMap[squadName] || squadName.toLowerCase().replace(/\s+/g, '_');

  // Click "Add" button for this squad
  const addButton = this.page.locator(`[data-testid="add-unit-${squadId}"]`);
  await addButton.waitFor({ state: 'visible', timeout: 5000 });
  await addButton.click({ timeout: 10000 });
  await this.page.waitForTimeout(1000);
});

// Step: Select faction specifically for panic tests (no conflict with common steps)
Given('panic: я выбираю фракцию {string}', async function(this: BronepehotaWorld, factionName: string) {
  // Wait for React to be ready
  await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await this.page.waitForTimeout(1000);

  // Map English faction names to test IDs
  const factionIdMap: Record<string, string> = {
    'Polaris': 'polaris',
    'Protectorate': 'protectorate',
    'Mercenaries': 'mercenaries',
  };

  const factionId = factionIdMap[factionName] || factionName.toLowerCase();
  const factionCard = this.page.getByTestId(`faction-card-${factionId}`);

  await factionCard.waitFor({ state: 'visible', timeout: 15000 });
  await factionCard.scrollIntoViewIfNeeded();
  await factionCard.click();

  this.currentFaction = factionName.toLowerCase();
  await this.page.waitForTimeout(500);
});

// Step: Kill a specific soldier by index (1-based from feature)
When('я убиваю {string}', async function(this: BronepehotaWorld, soldierStr: string) {
  await killSoldier.call(this, soldierStr);
});

// Step: Kill soldier (И prefix)
Given('И я убиваю {string}', async function(this: BronepehotaWorld, soldierStr: string) {
  await killSoldier.call(this, soldierStr);
});

// Helper function to kill soldier
async function killSoldier(this: BronepehotaWorld, soldierStr: string) {
  // Parse "3-го" to get 3, then convert to 0-based index
  const num = parseInt(soldierStr);
  const idx = num - 1;

  // After "Начать бой" we need to wait for game view to load
  await this.page.waitForTimeout(1000);

  // Find unit navigation button to open unit card
  const unitNav = this.page.locator('[data-testid^="unit-nav-"]').first();
  await unitNav.waitFor({ state: 'visible', timeout: 20000 });
  await unitNav.click({ timeout: 5000 });
  await this.page.waitForTimeout(1000);

  // Find KIA button by text "ЖИВ" (alive soldier shows "ЖИВ", killed shows "УБИТ")
  const buttons = this.page.getByRole('button', { name: 'ЖИВ' });
  const count = await buttons.count();

  if (count > idx) {
    await buttons.nth(idx).click({ timeout: 10000 });
  } else {
    // As a last resort, take a screenshot for debugging
    await this.page.screenshot({ path: '/tmp/panic-debug.png' });
    throw new Error(`Only ${count} KIA buttons found, need index ${idx}`);
  }
}

// Step: Verify panic test modal opens automatically
Then('модалка {string} открывается автоматически', async function(this: BronepehotaWorld, modalTitle: string) {
  const modal = this.page.getByText(new RegExp(modalTitle, 'i'));
  await expect(modal).toBeVisible({ timeout: 5000 });
});

// Step: Conduct panic test (click test button, wait for dice, apply result)
When('я провожу тест на панику', async function(this: BronepehotaWorld) {
  await conductPanicTest.call(this);
});

// Step: Conduct panic test (Given variant)
Given('panic: я провожу тест на панику', async function(this: BronepehotaWorld) {
  await conductPanicTest.call(this);
});

// Helper function to conduct panic test
async function conductPanicTest(this: BronepehotaWorld) {
  // Wait for modal to be visible
  await this.page.waitForTimeout(500);

  // Click test button
  const testButton = this.page.getByText(/ПРОВЕСТИ ТЕСТ/i);
  await testButton.click({ timeout: 10000 });

  // Wait for dice animation
  await this.page.waitForTimeout(1500);

  // Click apply button
  const applyButton = this.page.getByText(/ПРИМЕНИТЬ/i);
  await applyButton.click({ timeout: 10000 });
}

// Step: Verify panic icons are visible on panicking soldiers
Then('паникующие бойцы помечены иконкой бега', async function(this: BronepehotaWorld) {
  // Look for Footprints icon (panic indicator) by class name
  const panicIcons = this.page.locator('svg.lucide-footprints, svg[class*="footprints"]');
  await expect(panicIcons.first()).toBeVisible({ timeout: 5000 });
});

// Step: Verify panicking soldiers' actions are blocked
Then('действия паникующих бойцов заблокированы', async function(this: BronepehotaWorld) {
  // Check for "В ПАНИКЕ" label on panicking soldiers
  const panicLabels = this.page.getByText('В ПАНИКЕ');
  await expect(panicLabels.first()).toBeVisible();
});

// Step: Start a new turn
When('я начинаю новый ход', async function(this: BronepehotaWorld) {
  // Click new turn button
  const newTurnButton = this.page.getByText(/Новый ход/i).or(this.page.getByText(/Начать ход/i));
  if (await newTurnButton.isVisible()) {
    await newTurnButton.click({ timeout: 10000 });
  }
});

// Step: Click "В БОЙ" button
When('И я нажимаю кнопку {string}', async function(this: BronepehotaWorld, buttonText: string) {
  if (buttonText === 'В БОЙ') {
    const battleButton = this.page.locator('[data-testid="to-battle-button"]');
    // Wait for button to become available
    await battleButton.waitFor({ state: 'visible', timeout: 10000 });
    await battleButton.click({ timeout: 15000, force: true });
  }

  if (buttonText === 'Начать бой') {
    // Wait for start battle button after clicking "В БОЙ"
    await this.page.waitForTimeout(2000);

    const startBattleButton = this.page.locator('[data-testid="start-battle-button"]');
    // Check if button is visible using OR with fallback
    const startBattleButtonVisible = await startBattleButton.isVisible().catch(() => true);

    if (!startBattleButtonVisible) {
      // Take screenshot if button not available
      await this.page.screenshot({ path: '/tmp/panic-debug.png' });
      throw new Error('Start battle button not visible - game mode not loaded');
    }

    await startBattleButton.waitFor({ state: 'visible', timeout: 10000 });
    await startBattleButton.click({ timeout: 10000 });

    // Wait for initiative modal to appear and roll to complete
    await this.page.waitForTimeout(1500);

    // Click "НАЧАТЬ БОЙ" button in initiative modal
    const confirmButton = this.page.getByText('НАЧАТЬ БОЙ');
    if (await confirmButton.isVisible({ timeout: 3000 })) {
      await confirmButton.click({ timeout: 10000 });
    }

    // Wait for battle screen to be ready
    await this.page.waitForTimeout(1000);
  }
});
