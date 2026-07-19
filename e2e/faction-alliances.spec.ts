import { test, expect } from '@playwright/test';
import { setupToArmyBuilder, clearStorage } from './helpers/setup';

/**
 * Faction alliances — allied factions' units appear in the army builder.
 * Mercenaries (`allies:["*"]`) are allied with everyone; Рутения ↔ Protectorate.
 * Source: star_system (has all 4 factions incl. Рутения).
 */
test.describe('Faction alliances', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  const cards = (page: import('@playwright/test').Page, faction: string) =>
    page.locator(`[data-testid*="unit-card-${faction}_"]`);

  test('Protectorate sees own + Рутения + Наёмники, not Polaris', async ({ page }) => {
    await setupToArmyBuilder(page, { faction: 'protectorate' });
    await expect(cards(page, 'protectorate')).not.toHaveCount(0); // own (wait for list)
    await expect(cards(page, 'rutenia')).not.toHaveCount(0);      // ally
    await expect(cards(page, 'mercenaries')).not.toHaveCount(0);  // ally (wildcard)
    await expect(cards(page, 'polaris')).toHaveCount(0);          // not allied
  });

  test('Рутения sees own + Протекторат + Наёмники, not Polaris', async ({ page }) => {
    await setupToArmyBuilder(page, { faction: 'rutenia' });
    await expect(cards(page, 'rutenia')).not.toHaveCount(0);
    await expect(cards(page, 'protectorate')).not.toHaveCount(0);
    await expect(cards(page, 'mercenaries')).not.toHaveCount(0);
    await expect(cards(page, 'polaris')).toHaveCount(0);
  });

  test('Polaris sees own + Наёмники only (no Рутения/Протекторат)', async ({ page }) => {
    await setupToArmyBuilder(page, { faction: 'polaris' });
    await expect(cards(page, 'polaris')).not.toHaveCount(0);
    await expect(cards(page, 'mercenaries')).not.toHaveCount(0);
    await expect(cards(page, 'rutenia')).toHaveCount(0);
    await expect(cards(page, 'protectorate')).toHaveCount(0);
  });

  test('Наёмники (wildcard) see every faction', async ({ page }) => {
    await setupToArmyBuilder(page, { faction: 'mercenaries' });
    await expect(cards(page, 'mercenaries')).not.toHaveCount(0);
    await expect(cards(page, 'polaris')).not.toHaveCount(0);
    await expect(cards(page, 'protectorate')).not.toHaveCount(0);
    await expect(cards(page, 'rutenia')).not.toHaveCount(0);
  });
});
