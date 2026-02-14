import { test, expect } from '@playwright/test';

/**
 * Aimed Shot E2E tests
 * Tests the aimed shot feature for squad shooting attacks
 */
test.describe('Aimed Shot', () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage BEFORE page loads using addInitScript
    await page.addInitScript(() => {
      // Set up army with squad in game session for aimed shot testing
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
        currentStep: 'unit-select',
        isInBattle: true,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    // Navigate to app - localStorage already set
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should show aimed shot toggle for squad shots', async ({ page }) => {
    // Check if game session is visible
    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Click the "ДЕЙСТВИЕ" button for the first soldier to open combat modal
    // The button has aria-label="Выберите действие"
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
    // Create a new page with machine army state set BEFORE navigation
    await page.close();

    // Set up machine army state using addInitScript on context
    const newPage = await context.newPage();
    await newPage.addInitScript(() => {
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
        currentStep: 'unit-select',
        isInBattle: true,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    await newPage.goto('/app');
    await newPage.waitForLoadState('networkidle');

    // Check if game session is visible
    const gameSession = newPage.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Machines have a "ВЫСТРЕЛ" button directly for each weapon (no action selector needed)
    // Look for the weapon fire button with title "Выстрел"
    const weaponFireButton = newPage.locator('button[title="Выстрел"]').first();
    await expect(weaponFireButton).toBeVisible({ timeout: 5000 });
    await weaponFireButton.click({ force: true });
    await newPage.waitForTimeout(500);

    // Check aimed shot button is NOT visible for machines
    // (Machines skip the action selector and go directly to parameters)
    const aimedShotButton = newPage.locator('button[aria-label*="Прицельный"]');
    await expect(aimedShotButton).not.toBeVisible();
  });

  test('should toggle aimed shot off after being enabled', async ({ page }) => {
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
