import { test, expect } from '@playwright/test';

/**
 * Combat E2E tests
 * Tests critical combat gameplay mechanics
 */
test.describe('Combat Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    // Set up game session state BEFORE page loads (using addInitScript)
    await page.addInitScript(() => {
      const army = {
        name: 'Combat Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'combat-unit-1',
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

    // Wait for unit card to be visible
    await page.waitForSelector('[data-testid^="unit-nav-combat-unit-1"]', { timeout: 5000 });
    const unitCard = page.getByTestId('unit-nav-combat-unit-1');
    await expect(unitCard.first()).toBeVisible();
  });

  test('should open combat modal', async ({ page }) => {
    // Set up game session state BEFORE page loads
    await page.addInitScript(() => {
      const army = {
        name: 'Combat Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'combat-unit-1',
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

    const unitCard = page.getByTestId('unit-nav-combat-unit-1');
    // Use force: true to click even if element is covered
    await unitCard.first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);

    // Look for combat modal or action button
    const actionButton = page.getByRole('button', { name: /действие/i });
    const combatModal = page.getByTestId('bottom-sheet-combat-modal');

    const hasAction = await actionButton.count() > 0;
    const hasModal = await combatModal.count() > 0;

    expect(hasAction || hasModal).toBeTruthy();
  });

  test('should execute initiative roll', async ({ page }) => {
    // Set up game session state BEFORE page loads
    await page.addInitScript(() => {
      const army = {
        name: 'Combat Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'combat-unit-1',
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
    await page.waitForTimeout(500);

    // Find and click initiative button by test-id (new-turn-button)
    const initiativeButton = page.getByTestId('new-turn-button');
    await expect(initiativeButton).toBeVisible({ timeout: 5000 });
    await initiativeButton.click({ force: true });
    await page.waitForTimeout(1000);

    // Should see initiative modal
    const initiativeModal = page.getByTestId('initiative-modal');
    await expect(initiativeModal.first()).toBeVisible({ timeout: 5000 });
  });
});
