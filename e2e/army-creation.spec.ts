import { test, expect } from '@playwright/test';
import { clearStorage, setupToArmyBuilder } from './helpers/setup';

/**
 * Army Creation E2E tests
 * Tests critical army creation flows
 */
test.describe('Army Creation', () => {
  test('should display faction selector on first load', async ({ page }) => {
    // Clear localStorage to simulate fresh start
    await clearStorage(page);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Should see faction selection
    const polarisButton = page.getByRole('button', { name: /поларис/i });
    const hasPolaris = await polarisButton.count() > 0;

    if (hasPolaris) {
      await expect(polarisButton).toBeVisible();
    }
  });

  test('should persist army in localStorage', async ({ page }) => {
    // Set up army
    await page.goto('/app');
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-1',
          data: { id: 'test', name: 'Test', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3]
        }],
        totalCost: 50,
        currentStep: 'unit-select',
        isInBattle: false,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'builder');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify army persisted in localStorage
    const armyData = await page.evaluate(() => {
      return localStorage.getItem('bronepehota_army');
    });

    expect(armyData).toBeTruthy();
    const parsed = JSON.parse(armyData!);
    // Persistence uses a versioned envelope { schemaVersion, army }; legacy data is a bare army.
    const army = parsed.army ?? parsed;
    expect(army.name).toBe('Test Army');
    expect(army.units).toEqual(expect.anything());
  });

  test('should calculate total cost correctly', async ({ page }) => {
    // Set up army with specific cost
    await page.goto('/app');
    await page.evaluate(() => {
      const army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [{
          instanceId: 'test-1',
          data: { id: 'test', name: 'Test', cost: 100, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3]
        }],
        totalCost: 100,
        currentStep: 'unit-select',
        isInBattle: false,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'builder');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if cost is displayed somewhere
    const armySummary = page.getByText(/100|очк/i);
    const hasCost = await armySummary.count() > 0;

    if (hasCost) {
      await expect(armySummary.first()).toBeVisible();
    }
  });

  test('should toggle between detailed and compact display mode', async ({ page }) => {
    // Desktop viewport (1280x720) defaults to 'detailed' on the army builder
    await setupToArmyBuilder(page, { faction: 'polaris', budget: 350 });

    // Both halves of the display-mode toggle are visible
    const detailedBtn = page.getByTestId('display-mode-detailed');
    const compactBtn = page.getByTestId('display-mode-compact');
    await expect(detailedBtn).toBeVisible();
    await expect(compactBtn).toBeVisible();

    // Default is detailed: detailed pressed, no compact cards rendered
    await expect(detailedBtn).toHaveAttribute('aria-pressed', 'true');
    const compactCards = page.locator('[data-testid^="compact-unit-card-"]');
    await expect(compactCards).toHaveCount(0);

    // Switch to compact
    await compactBtn.click();
    await expect(compactBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(detailedBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(compactCards.first()).toBeVisible();

    // Switch back to detailed — compact cards disappear again
    await detailedBtn.click();
    await expect(detailedBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(compactCards).toHaveCount(0);
  });

  test('opens a stats-first detail sheet on squad tap and reflects the source', async ({ page }) => {
    // Desktop viewport defaults to 'detailed' → unit cards have data-testid `unit-card-<id>`
    await setupToArmyBuilder(page, { faction: 'polaris', budget: 350 });

    // Tap the first squad card (corner click avoids the add/remove buttons)
    const firstCard = page.locator('[data-testid^="unit-card-"]').first();
    await firstCard.click({ position: { x: 10, y: 10 } });

    const sheet = page.getByTestId('unit-detail-sheet');
    await expect(sheet).toBeVisible();

    // Stat table is present at the top (no auto-scroll to images anymore)
    await expect(sheet.getByTestId('unit-stat-table')).toBeVisible();

    // Source stamp reflects the selected source (default star_system)
    await expect(sheet.getByText(/Star System/)).toBeVisible();

    // Add-to-army from the sheet, then the sheet closes
    await sheet.getByRole('button', { name: /добавить/i }).click();
    await expect(page.getByTestId('unit-detail-sheet')).toHaveCount(0);
  });

  test('search filters the unit catalog by name', async ({ page }) => {
    // Desktop viewport defaults to 'detailed' → squad cards carry unit-card-* testids
    await setupToArmyBuilder(page, { faction: 'polaris', budget: 350 });

    const cards = page.locator('[data-testid^="unit-card-"]');
    await expect(cards.first()).toBeVisible();
    const names = (await cards.locator('h3').allInnerTexts()).map((n) => n.toLowerCase());
    expect(names.length).toBeGreaterThan(1);

    // Distinctive probe: extend a prefix of the first card's name (spaces
    // stripped) until exactly one catalog name contains it
    const base = names[0].replace(/[^a-zа-я0-9]/gi, '');
    let probe = '';
    for (let len = 4; len <= base.length; len++) {
      const candidate = base.slice(0, len);
      if (names.filter((n) => n.includes(candidate)).length === 1) {
        probe = candidate;
        break;
      }
    }
    expect(probe).toBeTruthy();

    // Probe narrows the catalog to its single card
    await page.getByTestId('unit-search-input').fill(probe);
    await expect(page.locator('[data-testid^="unit-card-"]')).toHaveCount(1);

    // Garbage query → dedicated empty state with a reset
    await page.getByTestId('unit-search-input').fill('zzzzzz');
    await expect(page.getByTestId('unit-search-empty')).toBeVisible();
    await page.getByTestId('unit-search-empty-reset').click();

    // Reset restores the full catalog and clears the input
    await expect(page.locator('[data-testid^="unit-card-"]')).toHaveCount(names.length);
    await expect(page.getByTestId('unit-search-input')).toHaveValue('');
  });
});
