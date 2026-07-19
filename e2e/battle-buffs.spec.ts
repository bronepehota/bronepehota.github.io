import { test, expect } from '@playwright/test';

/**
 * E2E tests for bonuses branch changes:
 * 1. Editor promo link always visible on source selection page
 * 2. Buffs/debuffs available in battle SoldierEffectsModal
 * 3. Unified catalog (standard + custom) accessible in effects modal
 */

// ────────────────────────────────────────────────────────────
// Test Group 1: Editor promo link on source selection page
// ────────────────────────────────────────────────────────────

test.describe('Editor promo link on source selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Step 1: Rules confirmation
    await page.getByTestId('rules-confirm-button').click();
    await page.waitForTimeout(500);
  });

  test('should show editor promo link on source selection page', async ({ page }) => {
    const editorLink = page.locator('a[href="/editor"]').first();
    await expect(editorLink).toBeVisible();
    const text = await editorLink.innerText();
    expect(text).toContain('Редактор');
  });

  test('should navigate to editor when promo link clicked', async ({ page }) => {
    const editorLink = page.locator('a[href="/editor"]').first();
    await editorLink.click();
    // Wait for client-side navigation
    await page.waitForURL('**/editor**', { timeout: 10000 });
    expect(page.url()).toContain('/editor');
  });

  test('should show editor promo even after selecting a source', async ({ page }) => {
    // Click star_system source
    await page.getByTestId('source-card-star_system').click();

    // Editor link should still be visible
    const editorLink = page.locator('a[href="/editor"]').first();
    await expect(editorLink).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// Test Group 2: Buffs available in battle (SoldierEffectsModal)
// ────────────────────────────────────────────────────────────

test.describe('Battle buffs availability', () => {
  test.beforeEach(async ({ page }) => {
    // Set up game session state directly in localStorage (like existing tests)
    await page.addInitScript(() => {
      const army = {
        name: 'Buff Test Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [{
          instanceId: 'buff-test-unit-1',
          type: 'squad',
          data: {
            id: 'polaris_lineynaya_klon_pehota',
            name: 'Линейная клон-пехота',
            shortName: 'Линейная',
            faction: 'polaris',
            cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
            soldiers: [
              { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2 },
              { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2 },
              { num: 3, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2 },
            ],
            buffs: [],
          },
          instanceNumber: 1,
          deadSoldiers: [],
          actionsUsed: [
            { moved: false, shot: false, melee: false, done: false },
            { moved: false, shot: false, melee: false, done: false },
            { moved: false, shot: false, melee: false, done: false },
          ],
          soldierModifiers: [],
          activeDebuffs: [],
          soldierAbilitiesUsed: [],
        }],
        totalCost: 50,
        currentTurn: 1,
        isInBattle: true,
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should show game session with unit cards', async ({ page }) => {
    // Game session should be visible
    const gameSession = page.getByTestId('game-session');
    if (await gameSession.count() > 0) {
      await expect(gameSession).toBeVisible();
    } else {
      // May need to click unit nav to expand
      const unitNav = page.locator('[data-testid^="unit-nav-"]').first();
      if (await unitNav.isVisible()) {
        await unitNav.click();
      }
      await expect(page.getByTestId('game-session')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show modifier indicator on soldier cards', async ({ page }) => {
    // Find modifier indicators — they have role="button" with various aria-labels
    const indicator = page.locator(
      '[role="button"][aria-label*="доступно"], ' +
      '[role="button"][aria-label="Добавить эффект"], ' +
      '[role="button"][aria-label*="баффов"]'
    ).first();

    // May need to scroll or expand unit first
    await expect(indicator).toBeVisible({ timeout: 10000 });
  });

  test('should open effects modal when modifier indicator clicked', async ({ page }) => {
    // Click any modifier indicator
    const indicator = page.locator(
      '[role="button"][aria-label*="доступно"], ' +
      '[role="button"][aria-label="Добавить эффект"], ' +
      '[role="button"][aria-label*="баффов"]'
    ).first();
    await indicator.click();
    await page.waitForTimeout(500);

    // Modal should open
    const modal = page.getByTestId('effects-modal');
    await expect(modal).toBeVisible();

    // Should have title with soldier name (e.g. "#1")
    await expect(modal.locator('#effects-modal-title')).toBeVisible();
  });

  test('should show buff and debuff action buttons in effects modal', async ({ page }) => {
    // Open modal
    const indicator = page.locator(
      '[role="button"][aria-label*="доступно"], ' +
      '[role="button"][aria-label="Добавить эффект"], ' +
      '[role="button"][aria-label*="баффов"]'
    ).first();
    await indicator.click();
    await page.waitForTimeout(500);

    const modal = page.getByTestId('effects-modal');
    await expect(modal).toBeVisible();

    // Should show two always-visible action buttons: Баф and Дебаф
    const buffsBtn = page.getByTestId('effects-tab-buffs');
    const debuffsBtn = page.getByTestId('effects-tab-debuffs');
    await expect(buffsBtn).toBeVisible();
    await expect(debuffsBtn).toBeVisible();
  });

  test('should show no buffs available for squad without assigned buffs', async ({ page }) => {
    // Open modal
    const indicator = page.locator(
      '[role="button"][aria-label*="доступно"], ' +
      '[role="button"][aria-label="Добавить эффект"], ' +
      '[role="button"][aria-label*="баффов"]'
    ).first();
    await indicator.click();
    await page.waitForTimeout(500);

    const modal = page.getByTestId('effects-modal');
    await expect(modal).toBeVisible();

    // Click Баф button to open buff catalog
    const buffsBtn = page.getByTestId('effects-tab-buffs');
    await buffsBtn.click();

    // Squad "Линейная клон-пехота" has NO buffs assigned in editor
    // So buff catalog should show "Нет доступных"
    await expect(modal.getByText('Нет доступных')).toBeVisible();
  });

  test('should open debuff catalog and show available debuffs', async ({ page }) => {
    // Open modal
    const indicator = page.locator(
      '[role="button"][aria-label*="доступно"], ' +
      '[role="button"][aria-label="Добавить эффект"], ' +
      '[role="button"][aria-label*="баффов"]'
    ).first();
    await indicator.click();
    await page.waitForTimeout(500);

    const modal = page.getByTestId('effects-modal');
    await expect(modal).toBeVisible();

    // Click Дебаф button to open debuff catalog
    const debuffsBtn = page.getByTestId('effects-tab-debuffs');
    await debuffsBtn.click();
    await page.waitForTimeout(300);

    // Debuffs from catalog should be listed (at least one debuff exists)
    const debuffItems = modal.locator('[aria-label^="Применить"]');
    await expect(debuffItems.first()).toBeVisible({ timeout: 5000 });
  });

  test('should close modal with X button', async ({ page }) => {
    // Open modal
    const indicator = page.locator(
      '[role="button"][aria-label*="доступно"], ' +
      '[role="button"][aria-label="Добавить эффект"], ' +
      '[role="button"][aria-label*="баффов"]'
    ).first();
    await indicator.click();
    await page.waitForTimeout(500);

    const modal = page.getByTestId('effects-modal');
    await expect(modal).toBeVisible();

    // Click close
    await modal.locator('[aria-label="Закрыть"]').click();

    // Modal should close
    await expect(modal).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// Test Group 3: Full flow regression
// ────────────────────────────────────────────────────────────

test.describe('Full flow regression with editor link', () => {
  test('should complete full flow to army builder with editor link visible', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Step 1: Rules
    await page.getByTestId('rules-confirm-button').click();

    // Step 2: Source — editor link visible
    await expect(page.locator('a[href="/editor"]').first()).toBeVisible();
    await page.getByTestId('source-confirm-button').click();
    await page.waitForTimeout(500);

    // Step 3: Faction
    await page.getByTestId('faction-card-polaris').click();
    await page.waitForTimeout(300);
    await page.getByTestId('faction-continue-button').click();
    await page.waitForTimeout(500);
    await page.getByTestId('mission-confirm-button').click();
    await page.waitForTimeout(500);

    // Step 4: Budget
    await page.getByRole('button', { name: '350' }).click();
    await page.waitForTimeout(300);
    await page.getByTestId('budget-next-button').click();

    // Should be on unit selection screen
    await expect(page.getByTestId('unit-selector')).toBeVisible();
  });
});
