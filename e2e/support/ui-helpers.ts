/**
 * UI Helper functions for E2E tests
 * Provides unified selectors and actions for mobile/desktop views
 */

import { Page } from 'playwright';

/**
 * View Mode - which tab/view is currently active
 */
export type ViewMode = 'browse' | 'army';

/**
 * Device type based on viewport
 */
export type DeviceType = 'mobile' | 'desktop';

/**
 * Detect device type from viewport width
 */
export function getDeviceType(page: Page): DeviceType {
  const viewport = page.viewportSize();
  if (!viewport) return 'desktop';
  return viewport.width < 768 ? 'mobile' : 'desktop';
}

/**
 * UI Selectors - centralized selector definitions
 */
export const Selectors = {
  // View mode tabs (unified TabBar for mobile and desktop)
  tabBrowse: '[role="tab"][aria-label*="ЮНИТЫ"]',
  tabArmy: '[role="tab"][aria-label*="Армия"]',

  // Battle button
  toBattleButton: '[data-testid="to-battle-button"]',

  // Army units
  armyUnit: (id: string) => `[data-testid="army-unit-${id}"]`,
  armyUnits: '[data-testid^="army-unit-"]',

  // Add unit buttons
  addUnitButton: '[data-testid^="add-unit-"]',
} as const;

/**
 * UI Helper class for common interactions
 */
export class UIHelper {
  constructor(private page: Page) {}

  /**
   * Switch to army view (unified TabBar for mobile and desktop)
   */
  async switchToArmyView(): Promise<void> {
    const armyTab = this.page.locator(Selectors.tabArmy);
    await armyTab.click({ timeout: 5000 });
    // Wait for view to change
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to browse view (unified TabBar for mobile and desktop)
   */
  async switchToBrowseView(): Promise<void> {
    const browseTab = this.page.locator(Selectors.tabBrowse);
    await browseTab.click({ timeout: 5000 });
    // Wait for view to change
    await this.page.waitForTimeout(500);
  }

  /**
   * Get current view mode by checking which tab is active
   */
  async getCurrentViewMode(): Promise<ViewMode> {
    const armyTab = this.page.locator(Selectors.tabArmy);
    const isSelected = await armyTab.getAttribute('aria-selected');
    return isSelected === 'true' ? 'army' : 'browse';
  }

  /**
   * Wait for army units to be visible
   */
  async waitForArmyUnits(minCount = 1): Promise<void> {
    await this.page.waitForSelector(Selectors.armyUnits, {
      state: 'visible',
      timeout: 5000,
    });

    // Verify minimum count
    const count = await this.page.locator(Selectors.armyUnits).count();
    if (count < minCount) {
      throw new Error(`Expected at least ${minCount} army units, but found ${count}`);
    }
  }

  /**
   * Click "To Battle" button (handles view switching automatically)
   */
  async clickToBattle(): Promise<void> {
    // First ensure we're in army view
    const currentMode = await this.getCurrentViewMode();
    if (currentMode !== 'army') {
      await this.switchToArmyView();
    }

    // Wait for army units to be visible
    await this.waitForArmyUnits(1);

    // Click the battle button
    const battleButton = this.page.locator(Selectors.toBattleButton);
    await battleButton.waitFor({ state: 'visible', timeout: 5000 });
    await battleButton.click({ timeout: 5000 });
  }
}
