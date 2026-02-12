import { When, Then, Given } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// ============================================================================
// PANIC TEST FLOW STEPS
// These steps handle the panic test scenarios for Star System rules
// ============================================================================

// Step: Switch to army tab (for panic tests)
Given('panic: я переключаюсь на вкладку {string}', async function(this: BronepehotaWorld, tabName: string) {
  if (tabName === 'Армия' || tabName === 'армия') {
    // Click the second tab (АРМИЯ)
    const tabs = this.page.locator('[role="tab"]');
    const count = await tabs.count();
    if (count >= 2) {
      await tabs.nth(1).click({ timeout: 5000, force: true });
    }
    await this.page.waitForTimeout(500);
  }
});

// Step: Add squad to army (for panic tests)
// Assumes we're already on unit selection page after rules confirmation
Given('panic: я добавляю в армию отряд {string}', async function(this: BronepehotaWorld, squadName: string) {
  // Wait for unit selector to be visible
  const unitSelector = this.page.getByTestId('unit-selector').or(this.page.locator('#unit-selector'));
  await unitSelector.first().waitFor({ state: 'visible', timeout: 10000 });

  // Find and click squad card
  const squadCard = this.page.getByText(new RegExp(squadName, 'i')).or(
    this.page.locator('[data-testid^="squad-card"]')
  );
  await squadCard.first().waitFor({ state: 'visible', timeout: 5000 });
  await squadCard.first().click();
  await this.page.waitForTimeout(500);
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

  // Find all KIA buttons - they contain Skull icon from lucide-react
  // The button shows "УБИТ" (killed) text when soldier is alive
  const buttons = this.page.locator('button[title*="УБИТ"]')
    .or(this.page.locator('button[title*="УБИ"]'))
    .or(this.page.locator('button:has(svg[class*="skull"])'))
    .or(this.page.locator('button[aria-label*="Убит"]'))
    .or(this.page.locator('text="УБИТ"'))
    .or(this.page.locator('text=УБИ"'));

  // Try to find KIA buttons - if not found, we may not be in battle mode
  let count = await buttons.count();

  if (count === 0) {
    // Check if we need to click "В БОЙ" button to enter battle mode
    const toBattleButton = this.page.locator('[data-testid="to-battle-button"]').or(
      this.page.getByRole('button', { name: /в бой/i })
    );

    const battleButtonVisible = await toBattleButton.isVisible({ timeout: 3000 });
    if (battleButtonVisible) {
      await toBattleButton.click({ timeout: 10000, force: true });
      await this.page.waitForTimeout(1000);
      count = await buttons.count();
    } else {
      // Try opening unit card to see KIA buttons
      const unitCard = this.page.locator('[data-testid^="unit-card"], div[class*="unit"], div[class*="UnitCard"]').first();
      const cardVisible = await unitCard.isVisible({ timeout: 3000 });
      if (cardVisible) {
        await unitCard.click({ timeout: 5000 });
        await this.page.waitForTimeout(1000);
        count = await buttons.count();
      }
    }
  }

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
    await battleButton.waitFor({ state: 'visible', timeout: 5000 });
    await battleButton.click({ timeout: 15000, force: true });
  } else if (buttonText === 'Начать бой') {
    // Click "Начать бой" button in preparation screen
    const startBattleButton = this.page.locator('[data-testid="start-battle-button"]');
    await startBattleButton.waitFor({ state: 'visible', timeout: 5000 });
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

// Step: Verify panic status is removed from soldiers
Then('статус паники снят с бойцов', async function(this: BronepehotaWorld) {
  // Look for Footprints icons - should be gone after new turn
  const panicIcons = this.page.locator('svg.lucide-footprints, svg[class*="footprints"]');
  const count = await panicIcons.count();
  expect(count).toBe(0);
});
