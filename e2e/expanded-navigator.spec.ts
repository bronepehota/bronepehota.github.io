import { test, expect } from '@playwright/test';

/**
 * Expanded Navigator E2E tests
 *
 * Tests the expanded navigator feature in the game session dock bar.
 * The dock bar at the bottom can be expanded to show all units grouped
 * by status: active, done, dead.
 */
test.describe('Expanded Navigator', () => {
  test.beforeEach(async ({ page }) => {
    // Set up game session state BEFORE page loads (using addInitScript)
    await page.addInitScript(() => {
      const army = {
        name: 'Navigator Test Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [
          // Active unit - no soldiers done, no soldiers dead
          {
            instanceId: 'nav-active-unit',
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
              ]
            },
            instanceNumber: 1,
            deadSoldiers: [],
            actionsUsed: [
              { moved: false, shot: false, melee: false, done: false },
              { moved: false, shot: false, melee: false, done: false },
            ]
          },
          // Done unit - all soldiers done
          {
            instanceId: 'nav-done-unit',
            type: 'squad',
            data: {
              id: 'polaris_shturmovaya_klon_pehota',
              name: 'Штурмовая клон-пехота',
              shortName: 'Штурмовая',
              faction: 'polaris',
              cost: 60,
              image: '/images/squads/polaris/shturmovaya_klon_pehota/1.png',
              soldiers: [
                { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
                { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
              ]
            },
            instanceNumber: 2,
            deadSoldiers: [],
            actionsUsed: [
              { moved: true, shot: true, melee: false, done: true },
              { moved: true, shot: true, melee: false, done: true },
            ]
          },
          // Dead unit - all soldiers dead
          {
            instanceId: 'nav-dead-unit',
            type: 'squad',
            data: {
              id: 'polaris_tyazhelaya_klon_pehota',
              name: 'Тяжелая клон-пехота',
              shortName: 'Тяжелая',
              faction: 'polaris',
              cost: 70,
              image: '/images/squads/polaris/tyazhelaya_klon_pehota/1.png',
              soldiers: [
                { num: 1, rank: 3, speed: 4, range: 'D12', power: '2D6', melee: 4, props: [], armor: 3, image: '' },
              ]
            },
            instanceNumber: 3,
            deadSoldiers: [0],
            actionsUsed: []
          }
        ],
        totalCost: 180,
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

    // Wait for game session to render
    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });
  });

  test('should render expanded navigator when dock handle is clicked', async ({ page }) => {
    // Initially, the expanded navigator should NOT be visible
    const expandedNav = page.getByTestId('expanded-navigator');
    await expect(expandedNav).not.toBeVisible();

    // Find the dock handle (cursor-pointer div at top of dock bar)
    const dockHandle = page.locator('.fixed.left-0.right-0.z-50 .cursor-pointer');
    await expect(dockHandle).toBeVisible();

    // Click the dock handle to expand
    await dockHandle.click();
    await page.waitForTimeout(300);

    // Now the expanded navigator should be visible
    await expect(expandedNav).toBeVisible();
  });

  test('should display all three status sections in expanded navigator', async ({ page }) => {
    // Expand the dock
    const dockHandle = page.locator('.fixed.left-0.right-0.z-50 .cursor-pointer');
    await dockHandle.click();
    await page.waitForTimeout(300);

    // Verify all three sections are visible with correct aria-labels
    const activeSection = page.locator('[role="region"][aria-label="Активные юниты"]');
    const doneSection = page.locator('[role="region"][aria-label="Походили юниты"]');
    const deadSection = page.locator('[role="region"][aria-label="Убитые юниты"]');

    await expect(activeSection).toBeVisible();
    await expect(doneSection).toBeVisible();
    await expect(deadSection).toBeVisible();
  });

  test('should show unit cards in correct sections', async ({ page }) => {
    // Expand the dock
    const dockHandle = page.locator('.fixed.left-0.right-0.z-50 .cursor-pointer');
    await dockHandle.click();
    await page.waitForTimeout(300);

    // Active section should contain the active unit card
    const activeSection = page.locator('[role="region"][aria-label="Активные юниты"]');
    const activeUnitCard = activeSection.getByTestId('expanded-unit-nav-active-unit');
    await expect(activeUnitCard).toBeVisible();

    // Done section should contain the done unit card
    const doneSection = page.locator('[role="region"][aria-label="Походили юниты"]');
    const doneUnitCard = doneSection.getByTestId('expanded-unit-nav-done-unit');
    await expect(doneUnitCard).toBeVisible();

    // Dead section should contain the dead unit card
    const deadSection = page.locator('[role="region"][aria-label="Убитые юниты"]');
    const deadUnitCard = deadSection.getByTestId('expanded-unit-nav-dead-unit');
    await expect(deadUnitCard).toBeVisible();
  });

  test('should close navigator when a unit card is clicked', async ({ page }) => {
    // Expand the dock
    const dockHandle = page.locator('.fixed.left-0.right-0.z-50 .cursor-pointer');
    await dockHandle.click();
    await page.waitForTimeout(300);

    // Verify expanded navigator is visible
    const expandedNav = page.getByTestId('expanded-navigator');
    await expect(expandedNav).toBeVisible();

    // Click on a unit card in the active section
    const activeUnitCard = page.getByTestId('expanded-unit-nav-active-unit');
    await expect(activeUnitCard).toBeVisible();
    await activeUnitCard.click();
    await page.waitForTimeout(300);

    // Expanded navigator should close
    await expect(expandedNav).not.toBeVisible();
  });

  test('should collapse dock when clicking handle via JavaScript', async ({ page }) => {
    const expandedNav = page.getByTestId('expanded-navigator');

    // Initially collapsed
    await expect(expandedNav).not.toBeVisible();

    // Expand by dispatching click on handle (bypasses parent mouseDown)
    const dockHandle = page.locator('.fixed.left-0.right-0.z-50 .cursor-pointer');
    await dockHandle.dispatchEvent('click');
    await page.waitForTimeout(300);
    await expect(expandedNav).toBeVisible();

    // Collapse by dispatching click again
    await dockHandle.dispatchEvent('click');
    await page.waitForTimeout(300);
    await expect(expandedNav).not.toBeVisible();
  });
});
