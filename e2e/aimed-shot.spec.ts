import { test, expect } from '@playwright/test';

/**
 * Aimed Shot E2E tests
 * Tests the aimed shot feature for squad shooting attacks
 */
test.describe('Aimed Shot - Combat Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app page first
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should show aimed shot toggle for squad shots', async ({ page }) => {
    // Set up game session state
    await page.evaluate(() => {
      const army = {
        name: 'Aimed Shot Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'squad-test-1',
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

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if game session is visible
    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Click the "ДЕЙСТВИЕ" button for the first soldier to open combat modal
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(500);

    // Select shot action (ВЫСТРЕЛ)
    const shotButton = page.getByRole('button', { name: /выстрел/i });
    await expect(shotButton).toBeVisible({ timeout: 3000 });
    await shotButton.click();
    await page.waitForTimeout(300);

    // Check aimed shot button is visible (uses aria-label)
    const aimedShotButton = page.locator('button[aria-label*="Прицельный"]');
    await expect(aimedShotButton).toBeVisible({ timeout: 3000 });

    // Verify initial state is off
    await expect(aimedShotButton).toHaveAttribute('aria-label', 'Прицельный выстрел выключен');

    // Toggle aimed shot on
    await aimedShotButton.click();
    await page.waitForTimeout(200);

    // Verify it's now enabled
    await expect(aimedShotButton).toHaveAttribute('aria-label', 'Прицельный выстрел включён');
  });

  test('should not show aimed shot toggle for machines', async ({ page, context }) => {
    // Create a new page for machine test
    await page.close();
    const newPage = await context.newPage();

    // Navigate first
    await newPage.goto('/app');
    await newPage.waitForLoadState('networkidle');

    // Set up machine army state
    await newPage.evaluate(() => {
      const army = {
        name: 'Machine Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'machine-test-1',
          type: 'machine',
          data: {
            id: 'polaris_legkiy_shturmovoy_ekranoplan',
            name: 'Лёгкий штурмовой экраноплан',
            shortName: 'Экраноплан',
            faction: 'polaris',
            cost: 150,
            rank: 2,
            fire_rate: 2,
            ammo_max: 20,
            durability_max: 16,
            durability: 16,
            ammo: 20,
            image: '/images/machines/polaris/legkiy_shturmovoy_ekranoplan/1.png',
            speed_sectors: [
              { min_durability: 9, max_durability: 16, speed: 2 },
              { min_durability: 1, max_durability: 8, speed: 1 }
            ],
            weapons: [
              { name: 'Пушка', range: 'D12', power: '2D20', special: '' }
            ]
          },
          instanceNumber: 1,
          currentSoldiers: [],
          deadSoldiers: [],
          actionsUsed: [],
          durability: 16,
          ammo: 20,
          currentAmmo: 20,
          machineShotsUsed: 0
        }],
        totalCost: 150,
        currentStep: 'battle',
        isInBattle: true,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    await newPage.reload();
    await newPage.waitForLoadState('networkidle');

    // Check if game session is visible
    const gameSession = newPage.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Machines have a "ВЫСТРЕЛ" button directly for each weapon
    const weaponFireButton = newPage.locator('button[title="Выстрел"]').first();
    await expect(weaponFireButton).toBeVisible({ timeout: 5000 });
    await weaponFireButton.click({ force: true });
    await newPage.waitForTimeout(500);

    // Check aimed shot button is NOT visible for machines
    const aimedShotButton = newPage.locator('button[aria-label*="Прицельный"]');
    await expect(aimedShotButton).not.toBeVisible();
  });

  test('should toggle aimed shot off after being enabled', async ({ page }) => {
    // Set up game session state
    await page.evaluate(() => {
      const army = {
        name: 'Aimed Shot Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'squad-test-1',
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

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if game session is visible
    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Click the "ДЕЙСТВИЕ" button for the first soldier
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });
    await page.waitForTimeout(500);

    // Select shot action
    const shotButton = page.getByRole('button', { name: /выстрел/i });
    await expect(shotButton).toBeVisible({ timeout: 3000 });
    await shotButton.click();
    await page.waitForTimeout(300);

    // Get aimed shot button and verify it exists
    const aimedShotButton = page.locator('button[aria-label*="Прицельный"]');
    await expect(aimedShotButton).toBeVisible({ timeout: 3000 });

    // Toggle aimed shot on
    await aimedShotButton.click();
    await page.waitForTimeout(200);
    await expect(aimedShotButton).toHaveAttribute('aria-label', 'Прицельный выстрел включён');

    // Toggle aimed shot off again
    await aimedShotButton.click();
    await page.waitForTimeout(200);
    await expect(aimedShotButton).toHaveAttribute('aria-label', 'Прицельный выстрел выключен');
  });
});

/**
 * Helper function to navigate through the setup flow to Rules screen
 * Flow: Faction → Budget → Rules
 */
async function navigateToRulesScreen(page: import('@playwright/test').Page) {
  // Step 1: Select faction
  await page.click('[data-testid="faction-card-polaris"]');
  await page.click('[data-testid="faction-continue-button"]');
  await page.waitForTimeout(300);

  // Step 2: Select budget (350 is recommended)
  await page.click('button:has-text("350")');
  await page.waitForTimeout(300);

  // Step 3: Click "НАЧАТЬ СБОР АРМИИ" to proceed to Rules
  await page.click('[data-testid="budget-next-button"]');
  await page.waitForTimeout(300);
}

/**
 * Rules Screen - Optional Rules Toggles
 */
test.describe('Optional Rules Toggles', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should show all optional rule toggles on rules screen', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to rules screen (Faction → Budget → Rules)
    await navigateToRulesScreen(page);

    // Wait for rules selector to appear
    const rulesSelector = page.locator('#rules-selector');
    await expect(rulesSelector).toBeVisible({ timeout: 5000 });

    // Check panic toggle is visible
    const panicToggle = page.getByTestId('panic-toggle');
    await expect(panicToggle).toBeVisible();

    // Check aimed shot toggle is visible
    const aimedShotToggle = page.getByTestId('aimed-shot-toggle');
    await expect(aimedShotToggle).toBeVisible();

    // Check surprise attack toggle is visible
    const surpriseAttackToggle = page.getByTestId('surprise-attack-toggle');
    await expect(surpriseAttackToggle).toBeVisible();
  });

  test('should toggle aimed shot on rules screen', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to rules screen
    await navigateToRulesScreen(page);

    // Find aimed shot toggle container
    const aimedShotContainer = page.getByTestId('aimed-shot-toggle');
    await expect(aimedShotContainer).toBeVisible({ timeout: 5000 });

    // Find the button with aria-pressed inside the toggle
    const aimedShotButton = aimedShotContainer.locator('button[aria-pressed]');

    // Check initial state - should be disabled by default
    await expect(aimedShotButton).toHaveAttribute('aria-pressed', 'false');

    // Toggle on - click the button inside
    await aimedShotButton.click();
    await page.waitForTimeout(200);
    await expect(aimedShotButton).toHaveAttribute('aria-pressed', 'true');

    // Toggle off
    await aimedShotButton.click();
    await page.waitForTimeout(200);
    await expect(aimedShotButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('should toggle surprise attack on rules screen', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to rules screen
    await navigateToRulesScreen(page);

    // Find surprise attack toggle container
    const surpriseAttackContainer = page.getByTestId('surprise-attack-toggle');
    await expect(surpriseAttackContainer).toBeVisible({ timeout: 5000 });

    // Find the button with aria-pressed inside the toggle
    const surpriseAttackButton = surpriseAttackContainer.locator('button[aria-pressed]');

    // Check initial state - should be disabled by default
    await expect(surpriseAttackButton).toHaveAttribute('aria-pressed', 'false');

    // Toggle on - click the button inside
    await surpriseAttackButton.click();
    await page.waitForTimeout(200);
    await expect(surpriseAttackButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should persist toggle states in localStorage', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to rules screen
    await navigateToRulesScreen(page);

    // Find aimed shot toggle and click the button inside
    const aimedShotContainer = page.getByTestId('aimed-shot-toggle');
    const aimedShotButton = aimedShotContainer.locator('button[aria-pressed]');
    await aimedShotButton.click();
    await page.waitForTimeout(200);

    // Find surprise attack toggle and click the button inside
    const surpriseAttackContainer = page.getByTestId('surprise-attack-toggle');
    const surpriseAttackButton = surpriseAttackContainer.locator('button[aria-pressed]');
    await surpriseAttackButton.click();
    await page.waitForTimeout(200);

    // Check localStorage
    const aimedShotEnabled = await page.evaluate(() =>
      localStorage.getItem('bronepehota_aimed_shot_enabled')
    );
    expect(aimedShotEnabled).toBe('true');

    const surpriseAttackEnabled = await page.evaluate(() =>
      localStorage.getItem('bronepehota_surprise_attack_enabled')
    );
    expect(surpriseAttackEnabled).toBe('true');
  });
});
