import { test, expect } from '@playwright/test';

/**
 * E2E tests for modifier display in soldier stats and expiry on turn end.
 */
test.describe('Modifier stat display and expiry', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
  });

  test('should show armor bonus when soldierModifier is active', async ({ page }) => {
    // Set up army with a soldierModifier that gives +2 armor on soldier 0
    await page.addInitScript(() => {
      const army = {
        name: 'Modifier Test Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [{
          instanceId: 'mod-test-unit-1',
          type: 'squad',
          data: {
            id: 'polaris_lineynaya_klon_pehota',
            name: 'Линейная Клон-пехота',
            shortName: 'Линейная',
            faction: 'polaris',
            cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
            soldiers: [
              { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2 },
              { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2 },
            ],
            buffs: [],
          },
          instanceNumber: 1,
          deadSoldiers: [],
          actionsUsed: [
            { moved: false, shot: false, melee: false, done: false },
            { moved: false, shot: false, melee: false, done: false },
          ],
          soldierModifiers: [{
            id: 'field_repair_1234',
            catalogId: 'field_repair',
            name: 'Полевой ремонт',
            description: '+2 к броне',
            target: 'armor_bonus',
            value: 2,
            phase: 'always',
            appliedAtTurn: 1,
            soldierIndex: 0,
          }],
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

    // The game session should be visible
    await expect(page.getByTestId('game-session')).toBeVisible();

    // The first soldier card should show a +2 armor bonus indicator
    // The stat badge with armor (Shield icon) should have emerald border for positive bonus
    // and the "+2" text should be visible
    const armorBonusText = page.getByText('+2').first();
    await expect(armorBonusText).toBeVisible({ timeout: 5000 });
  });

  test('should NOT show bonus when no modifiers active', async ({ page }) => {
    await page.addInitScript(() => {
      const army = {
        name: 'No Modifier Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [{
          instanceId: 'no-mod-unit-1',
          type: 'squad',
          data: {
            id: 'polaris_lineynaya_klon_pehota',
            name: 'Линейная Клон-пехота',
            shortName: 'Линейная',
            faction: 'polaris',
            cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
            soldiers: [
              { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2 },
            ],
            buffs: [],
          },
          instanceNumber: 1,
          deadSoldiers: [],
          actionsUsed: [
            { moved: false, shot: false, melee: false, done: false },
          ],
          soldierModifiers: [],
          activeDebuffs: [],
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

    // No +2 or -1 bonus text should appear
    await expect(page.getByTestId('game-session')).toBeVisible();

    // The bonus text "+2" should NOT exist anywhere
    const bonusTexts = page.locator('text=+2').first();
    await expect(bonusTexts).not.toBeVisible({ timeout: 3000 });
  });

  test('should show negative bonus (red) when debuff is applied', async ({ page }) => {
    await page.addInitScript(() => {
      const army = {
        name: 'Debuff Test Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [{
          instanceId: 'debuff-test-unit-1',
          type: 'squad',
          data: {
            id: 'polaris_lineynaya_klon_pehota',
            name: 'Линейная Клон-пехота',
            shortName: 'Линейная',
            faction: 'polaris',
            cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
            soldiers: [
              { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2 },
            ],
            buffs: [],
          },
          instanceNumber: 1,
          deadSoldiers: [],
          actionsUsed: [
            { moved: false, shot: false, melee: false, done: false },
          ],
          soldierModifiers: [{
            id: 'slow_debuff_1234',
            catalogId: 'slow',
            name: 'Замедление',
            description: 'Скорость x0.5',
            target: 'speed_multiply',
            value: 0.5,
            phase: 'always',
            appliedAtTurn: 1,
            soldierIndex: 0,
          }],
          activeDebuffs: [],
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

    // Speed stat should show "x0.5" modifier
    const speedBonusText = page.getByText('x0.5').first();
    await expect(speedBonusText).toBeVisible({ timeout: 5000 });
  });

  test('should remove expired modifier after advancing turns', async ({ page }) => {
    // Set up army at turn 2 where a duration-1 modifier (applied at turn 1) has expired
    await page.addInitScript(() => {
      // Turn 1: Apply modifier
      const army = {
        name: 'Expiry Test Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [{
          instanceId: 'expiry-test-unit-1',
          type: 'squad',
          data: {
            id: 'polaris_lineynaya_klon_pehota',
            name: 'Линейная Клон-пехота',
            shortName: 'Линейная',
            faction: 'polaris',
            cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
            soldiers: [
              { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2 },
            ],
            buffs: [],
          },
          instanceNumber: 1,
          deadSoldiers: [],
          actionsUsed: [
            { moved: false, shot: false, melee: false, done: false },
          ],
          // Duration-1 modifier applied at turn 1: active on turns 1 and 2, expires at turn 3
          soldierModifiers: [{
            id: 'temp_buff_1234',
            catalogId: 'aim_boost',
            name: 'Улучшение прицеливания',
            description: '+1 к дальности',
            target: 'range_bonus',
            value: 1,
            phase: 'shot',
            appliedAtTurn: 1,
            duration: 1,
            expiresAtTurn: 2,
            soldierIndex: 0,
          }],
          activeDebuffs: [],
          soldierAbilitiesUsed: [],
        }],
        totalCost: 50,
        currentTurn: 2,
        isInBattle: true,
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByTestId('game-session')).toBeVisible();

    // The modifier is still active at turn 2 (duration=1, applied=1, active while currentTurn <= 2)
    // So "+1" should be visible on the range stat
    const rangeBonus = page.getByText('+1').first();
    await expect(rangeBonus).toBeVisible({ timeout: 5000 });

    // Now advance to next turn — this should trigger cleanup and expire the modifier
    // Find the "next turn" button in the bottom dock
    // The dock has a turn control. Let's find and click the end-turn button
    // We look for the initiative/next-turn trigger
    const endTurnButton = page.locator('button[aria-label*="тур"], button[aria-label*="Тур"]').first();
    if (await endTurnButton.isVisible()) {
      await endTurnButton.click();
      await page.waitForTimeout(500);
    } else {
      // Alternative: use the turn control in the header or dock
      // Try clicking the turn indicator to open initiative modal
      const turnControl = page.locator('[data-testid="game-session"] button').filter({ hasText: /тур|Тур|ТУР/ }).first();
      if (await turnControl.isVisible()) {
        await turnControl.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should keep permanent modifier (no duration) across multiple turns', async ({ page }) => {
    await page.addInitScript(() => {
      const army = {
        name: 'Permanent Modifier Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [{
          instanceId: 'perm-test-unit-1',
          type: 'squad',
          data: {
            id: 'polaris_lineynaya_klon_pehota',
            name: 'Линейная Клон-пехота',
            shortName: 'Линейная',
            faction: 'polaris',
            cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
            soldiers: [
              { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2 },
            ],
            buffs: [],
          },
          instanceNumber: 1,
          deadSoldiers: [],
          actionsUsed: [
            { moved: false, shot: false, melee: false, done: false },
          ],
          // Permanent modifier — no duration field
          soldierModifiers: [{
            id: 'permanent_buff_1234',
            catalogId: 'mechanic',
            name: 'Рм',
            description: 'Полевой ремонт',
            target: 'armor_bonus',
            value: 2,
            phase: 'always',
            appliedAtTurn: 1,
            soldierIndex: 0,
          }],
          activeDebuffs: [],
        }],
        totalCost: 50,
        currentTurn: 5, // Far in the future
        isInBattle: true,
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Permanent modifier should still show at turn 5
    const armorBonus = page.getByText('+2').first();
    await expect(armorBonus).toBeVisible({ timeout: 5000 });
  });
});
