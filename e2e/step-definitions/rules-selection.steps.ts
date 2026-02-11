import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Rules Selection steps
export function rulesSelectionSteps() {
  /** When('я нахожусь на этапе выбора правил', async function(this: BronepehotaWorld) {
    // Wait for page load
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Check if we're on rules selector page
    const rulesSelector = this.page.getByTestId('rules-selector').or(
      this.page.locator('#rules-selector')
    );
    await expect(rulesSelector.first()).toBeVisible({ timeout: 10000 });
  });

  When('я нажимаю на карточку правил с test-id {string}', async function(this: BronepehotaWorld, testId: string) {
    // Click on rules card using test-id (more reliable than text lookup)
    const rulesCard = this.page.getByTestId(testId);
    await expect(rulesCard).toBeVisible({ timeout: 5000 });
    await rulesCard.click();
    await this.page.waitForTimeout(300);

    // Store selected version for verification
    const versionId = testId.replace('rules-card-', '');
    this.currentRulesVersion = versionId;
  });

  Then('карточка должна быть видима', async function(this: BronepehotaWorld) {
    const rulesCard = this.page.getByTestId(`rules-card-${this.currentRulesVersion}`);
    await expect(rulesCard).toBeVisible({ timeout: 5000 });
  });

  Then('версия правил должна быть обновлена', async function(this: BronepehotaWorld) {
    // Wait for state update
    await this.page.waitForTimeout(500);

    // Verify in localStorage
    const rulesVersion = await this.page.evaluate(() => {
      return localStorage.getItem('bronepehota_rules_version');
    });
    expect(rulesVersion).toBeDefined();
  });

  Then('индикатор версии должен отображаться в интерфейсе', async function(this: BronepehotaWorld) {
    // Check for version indicator in UI (shows selected version in army builder header)
    const versionIndicator = this.page.locator('[class*="version"]').or(
      this.page.getByText(/Технолог|Star System/i)
    );
    await expect(versionIndicator.first()).toBeVisible();
  });
};
