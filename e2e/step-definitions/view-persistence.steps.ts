import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// View Persistence steps - test that app remembers view state (builder vs game) on page reload

Then('я должен быть в режиме сборки армии', async function(this: BronepehotaWorld) {
  // Verify we're in builder mode - check for either unit selector or army units
  const unitSelector = this.page.getByTestId('unit-selector');
  const armyUnits = this.page.locator('[data-testid^="army-unit-"]');

  const hasUnitSelector = await unitSelector.isVisible().catch(() => false);
  const hasArmyUnits = await armyUnits.count() > 0;

  expect(hasUnitSelector || hasArmyUnits).toBe(true);
});

Then('должен остаться в режиме игры', async function(this: BronepehotaWorld) {
  // Wait for React to restore state
  await this.page.waitForTimeout(1000);

  // Verify we're in game mode by checking for game session component
  const gameSession = this.page.getByTestId('game-session');
  await expect(gameSession).toBeVisible({ timeout: 5000 });

  // Also verify localStorage has the correct view value
  const savedView = await this.page.evaluate(() => {
    return localStorage.getItem('bronepehota_view');
  });
  expect(savedView).toBe('game');
});

Then('должен остаться в режиме штаба', async function(this: BronepehotaWorld) {
  // Wait for React to restore state
  await this.page.waitForTimeout(2000);

  // Check view mode via localStorage first
  const savedView = await this.page.evaluate(() => {
    return localStorage.getItem('bronepehota_view');
  });
  expect(savedView).toBe('builder');

  // Wait for page to be fully loaded
  await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
  await this.page.waitForTimeout(1000);

  // Check for different possible elements that should be visible in builder mode
  const unitSelector = this.page.getByTestId('unit-selector');
  const armyUnits = this.page.locator('[data-testid^="army-unit-"]');
  const factionSelector = this.page.getByTestId('faction-selector');

  const hasUnitSelector = await unitSelector.isVisible({ timeout: 3000 }).catch(() => false);
  const hasArmyUnits = await armyUnits.count() > 0;
  const hasFactionSelector = await factionSelector.isVisible({ timeout: 3000 }).catch(() => false);

  // At least one of these should be visible in builder mode
  expect(hasUnitSelector || hasArmyUnits || hasFactionSelector).toBe(true);
});

Then('должен быть виден счётчик хода в шапке', async function(this: BronepehotaWorld) {
  // Turn counter is visible in game mode - use test-id only to avoid ambiguity
  const turnCounter = this.page.getByTestId('turn-counter');
  await expect(turnCounter).toBeVisible({ timeout: 5000 });
});

Then('должен быть виден экран выбора юнитов', async function(this: BronepehotaWorld) {
  // Verify we're in builder mode by checking for unit selector
  const unitSelector = this.page.getByTestId('unit-selector');
  await expect(unitSelector).toBeVisible({ timeout: 5000 });
});

Given('армия готова к бою', async function(this: BronepehotaWorld) {
  // Wait for game session to be visible and ready
  const gameSession = this.page.getByTestId('game-session');
  await expect(gameSession).toBeVisible({ timeout: 5000 });
});
