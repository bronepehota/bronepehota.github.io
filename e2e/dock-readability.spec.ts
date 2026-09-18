import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock } from './helpers/setup';

/**
 * Battle dock readability (playtest fix): the current-unit info bar used to be
 * a single text-xs row — name truncated into the badges, machine durability at
 * text-[9px], done toggle an icon-only 44px square. Now it is two rows: the
 * unit name on its own line, larger stats badges, and a labeled filled
 * «ГОТОВ»/«ОТМЕНА» button.
 */
test.describe('Battle dock readability', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameSessionWithSquad(page, {
      unitOverrides: { instanceId: 'dock-readability-unit-1' },
    });
    await waitForBattleDock(page);
    await expect(page.getByTestId('unit-dock')).toBeVisible();
    await expect(page.getByTestId('dock-info-bar')).toBeVisible({ timeout: 5000 });
  });

  test('unit name sits on its own line above the stats row', async ({ page }) => {
    const name = page.getByTestId('dock-unit-name');
    const done = page.getByTestId('dock-unit-done');
    await expect(name).toBeVisible();
    await expect(name).toHaveText(/ЛИНЕЙНАЯ КЛОН-ПЕХОТА/i);

    const nameBox = await name.boundingBox();
    const doneBox = await done.boundingBox();
    expect(nameBox).toBeTruthy();
    expect(doneBox).toBeTruthy();

    // Own line proof: the name row ends strictly above the stats row
    // (the done button lives in row 2, below the full-width name row).
    expect(nameBox!.y + nameBox!.height).toBeLessThanOrEqual(doneBox!.y + 0.5);
  });

  test('alive-soldiers aggregate shows живые/все for the squad', async ({ page }) => {
    const badge = page.getByTestId('dock-soldiers-alive');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('6/6');
  });

  test('labeled filled done button toggles the squad state', async ({ page }) => {
    const done = page.getByTestId('dock-unit-done');
    await expect(done).toBeVisible();
    await expect(done).toHaveText(/ГОТОВ/i);
    await expect(done).toHaveAttribute('aria-pressed', 'false');

    await done.click();
    await expect(done).toHaveAttribute('aria-pressed', 'true');
    await expect(done).toHaveText(/ОТМЕНА/i);

    await done.click();
    await expect(done).toHaveAttribute('aria-pressed', 'false');
    await expect(done).toHaveText(/ГОТОВ/i);
  });

  test('armor badge meets the enlarged size floor', async ({ page }) => {
    // Mock squad has uniform armor=2 → badge renders
    const badge = page.getByTestId('dock-armor-badge');
    await expect(badge).toBeVisible();

    const box = await badge.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });
});
