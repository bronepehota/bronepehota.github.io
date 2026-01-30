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
  // View mode toggles
  viewModeBrowse: '[data-testid="view-mode-browse"]',
  viewModeArmy: '[data-testid="view-mode-army"]',
  mobileTabBrowse: '[role="tab"][aria-label*="ЮНИТЫ"]',
  mobileTabArmy: '[role="tab"][aria-label*="Армия"]',

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
   * Switch to army view (works on both mobile and desktop)
   */
  async switchToArmyView(): Promise<void> {
    const deviceType = getDeviceType(this.page);

    if (deviceType === 'mobile') {
      // Mobile: use TabBar
      const armyTab = this.page.locator(Selectors.mobileTabArmy);
      await armyTab.click({ timeout: 5000 });
    } else {
      // Desktop: use ArmyControlPanel
      const armyButton = this.page.locator(Selectors.viewModeArmy);
      await armyButton.click({ timeout: 5000 });
    }

    // Wait for view to change
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to browse view (works on both mobile and desktop)
   */
  async switchToBrowseView(): Promise<void> {
    const deviceType = getDeviceType(this.page);

    if (deviceType === 'mobile') {
      // Mobile: use TabBar
      const browseTab = this.page.locator(Selectors.mobileTabBrowse);
      await browseTab.click({ timeout: 5000 });
    } else {
      // Desktop: use ArmyControlPanel
      const browseButton = this.page.locator(Selectors.viewModeBrowse);
      await browseButton.click({ timeout: 5000 });
    }

    // Wait for view to change
    await this.page.waitForTimeout(500);
  }

  /**
   * Get current view mode by checking which button is active
   */
  async getCurrentViewMode(): Promise<ViewMode> {
    const deviceType = getDeviceType(this.page);

    if (deviceType === 'mobile') {
      const armyTab = this.page.locator(Selectors.mobileTabArmy);
      const isSelected = await armyTab.getAttribute('aria-selected');
      return isSelected === 'true' ? 'army' : 'browse';
    } else {
      // Desktop: check if army button has active styling
      const armyButton = this.page.locator(Selectors.viewModeArmy);
      const hasActiveClass = await armyButton.evaluate(el =>
        el.classList.contains('bg-red-500/10') ||
        el.classList.contains('bg-cyan-500/10') ||
        el.classList.contains('bg-yellow-500/10')
      ).catch(() => false);
      return hasActiveClass ? 'army' : 'browse';
    }
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
