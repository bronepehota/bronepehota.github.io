import { test, expect } from '@playwright/test';
import { clearStorage, setupToArmyBuilder } from './helpers/setup';

test.describe('Sub-faction hierarchy', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('encyclopedia nests sub-factions under their parent with a tag', async ({ page }) => {
    await page.goto('/encyclopedia/factions');

    // Sub-faction cards carry the «Подфракция» tag.
    await expect(page.getByTestId('encyclopedia-faction-card-rutenia')).toContainText('Подфракция');
    await expect(page.getByTestId('encyclopedia-faction-card-dead_fleet')).toContainText('Подфракция');

    // Each sub-faction is ordered directly after its parent.
    const ids = await page
      .locator('[data-testid^="encyclopedia-faction-card-"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
    const prot = ids.findIndex((t) => t?.includes('protectorate'));
    const rut = ids.findIndex((t) => t?.includes('rutenia'));
    const pol = ids.findIndex((t) => t?.includes('polaris'));
    const df = ids.findIndex((t) => t?.includes('dead_fleet'));
    expect(prot).toBeGreaterThanOrEqual(0);
    expect(rut).toBe(prot + 1);
    expect(pol).toBeGreaterThanOrEqual(0);
    expect(df).toBe(pol + 1);
  });

  test('unit selector labels a sub-faction unit as «Подфракция»', async ({ page }) => {
    // Pick Протекторат (parent of Рутения) and reach the army builder.
    await setupToArmyBuilder(page, { faction: 'protectorate' });
    // An allied Рутения unit shows the sub-faction relationship. The badge is
    // icon-only (logo), so the relationship lives in its tooltip (title).
    await expect(page.locator('[title*="Подфракция"]').first()).toBeVisible({ timeout: 20000 });
  });
});
