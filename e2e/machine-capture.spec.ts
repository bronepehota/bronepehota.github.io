import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * #168 — Machine capture E2E.
 *
 * Side A (capture): a squad soldier taps «ЗАХВАТ» in the combat action
 * selector → CaptureModal opens → pick a machine → set durability/ammo →
 * confirm → a new machine unit appears in the navigator and the capturing
 * soldier is marked as its pilot («ПИЛОТ» badge).
 *
 * Side B (mark captured): an existing machine card → «Отметить захваченной»
 * → «ЗАХВАЧЕНА ПРОТИВНИКОМ» banner + locked combat buttons → «Вернуть (перезахват)»
 * → banner gone, buttons re-enabled.
 *
 * The seed pattern mirrors `e2e/defender-pilot-test.spec.ts` — an in-battle
 * army is injected via `addInitScript` (wrapped in the army shape), then
 * `clearStorage` runs in `beforeEach` so the seed `addInitScript` (registered
 * inside each test, after the beforeEach) wins. `localStorage.clear()` is
 * called inside the seed script itself to remove any stale keys.
 */

/** Seed a squad + machine, both in battle, for Side A (capture) tests. */
function setupSquadAndMachineForCapture(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    const soldiers = [
      { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 3, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 4, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
    ];
    const army = {
      name: 'Capture Test Army',
      faction: 'polaris',
      sourceId: 'star_system',
      units: [
        {
          instanceId: 'capture-squad-1',
          type: 'squad',
          data: {
            id: 'polaris_lineynaya_klon_pehota',
            name: 'Линейная клон-пехота',
            shortName: 'Линейная',
            faction: 'polaris',
            cost: 50,
            image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
            soldiers,
          },
          instanceNumber: 1,
          currentSoldiers: [0, 1, 2, 3],
          deadSoldiers: [],
          actionsUsed: [],
        },
        {
          instanceId: 'capture-machine-1',
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
              { min_durability: 1, max_durability: 8, speed: 1 },
            ],
            weapons: [{ name: 'Пушка', range: 'D12', power: '2D20', special: '' }],
          },
          instanceNumber: 1,
          currentSoldiers: [],
          deadSoldiers: [],
          actionsUsed: [],
          durability: 16,
          currentDurability: 16,
          ammo: 20,
          currentAmmo: 20,
          machineShotsUsed: 0,
        },
      ],
      totalCost: 200,
      currentStep: 'battle',
      isInBattle: true,
      currentTurn: 1,
    };
    localStorage.clear();
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
    localStorage.setItem('bronepehota_view', 'game');
    localStorage.setItem('bronepehota_display_mode', 'detailed');
    // strict pilot rank default is `true`; the seeded soldier rank (2) ≥ any
    // catalog machine rank (encyclopedia machines expose no rank → 0), so the
    // capture candidates list is non-empty under the default.
  });
}

/** Seed a single machine for Side B (mark captured) test. */
function setupMachineForCaptureMark(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    const army = {
      name: 'Capture Mark Army',
      faction: 'polaris',
      sourceId: 'star_system',
      units: [
        {
          instanceId: 'mark-machine-1',
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
              { min_durability: 1, max_durability: 8, speed: 1 },
            ],
            weapons: [{ name: 'Пушка', range: 'D12', power: '2D20', special: '' }],
          },
          instanceNumber: 1,
          currentSoldiers: [],
          deadSoldiers: [],
          actionsUsed: [],
          durability: 16,
          currentDurability: 16,
          ammo: 20,
          currentAmmo: 20,
          machineShotsUsed: 0,
        },
      ],
      totalCost: 150,
      currentStep: 'battle',
      isInBattle: true,
      currentTurn: 1,
    };
    localStorage.clear();
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
    localStorage.setItem('bronepehota_view', 'game');
    localStorage.setItem('bronepehota_display_mode', 'detailed');
  });
}

test.describe('Machine capture (#168)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('Side A: soldier captures a machine -> new machine unit + soldier becomes pilot', async ({ page }) => {
    await setupSquadAndMachineForCapture(page);

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Expand the squad card (first unit in the navigator).
    const squadNav = page.getByTestId('unit-nav-capture-squad-1').first();
    await expect(squadNav).toBeVisible({ timeout: 5000 });
    await squadNav.click({ force: true, timeout: 5000 });

    // Open the combat modal via the first soldier's action button.
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    await expect(actionButton).toBeVisible({ timeout: 5000 });
    await actionButton.click({ force: true });

    // Select the «ЗАХВАТ» action.
    const captureAction = page.getByRole('button', { name: /захват/i }).first();
    await expect(captureAction).toBeVisible({ timeout: 3000 });
    await captureAction.click();

    // CaptureModal opens. Header is visible.
    const captureModal = page.locator('h2:has-text("Захват техники")');
    await expect(captureModal).toBeVisible({ timeout: 3000 });

    // Pick the first machine candidate (role=option). This advances to the
    // durability/ammo step.
    const firstOption = page.getByRole('option').first();
    await expect(firstOption).toBeVisible({ timeout: 3000 });
    await firstOption.click();

    // Confirm — defaults durability/ammo are seeded to the candidate max.
    const confirmButton = page.getByTestId('confirm-capture');
    await expect(confirmButton).toBeVisible({ timeout: 3000 });
    await confirmButton.click();

    // A new machine unit appears in the navigator (squad + existing machine +
    // the captured machine = 3 units). The captured machine instanceId is
    // timestamp-based, so assert by navigator count growth and the pilot badge.
    const navCards = page.locator('[data-testid^="unit-nav-"]');
    await expect(navCards).toHaveCount(3, { timeout: 5000 });

    // Re-open the squad card and verify the first soldier now carries the
    // «ПИЛОТ» pilot badge.
    await squadNav.click({ force: true, timeout: 5000 });
    await expect(page.getByText('ПИЛОТ').first()).toBeVisible({ timeout: 3000 });
  });

  test('Side B: mark machine captured -> banner + locked buttons -> recapture restores', async ({ page }) => {
    await setupMachineForCaptureMark(page);

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Expand the machine card.
    const machineNav = page.getByTestId('unit-nav-mark-machine-1').first();
    await expect(machineNav).toBeVisible({ timeout: 5000 });
    await machineNav.click({ force: true, timeout: 5000 });

    // BEFORE capture: the banner is absent.
    await expect(page.getByText('ЗАХВАЧЕНА ПРОТИВНИКОМ')).toHaveCount(0);

    // The mark-captured toggle button is present.
    const markButton = page.getByRole('button', { name: /отметить захваченной/i }).first();
    await expect(markButton).toBeVisible({ timeout: 3000 });

    // A close-combat control exists and is enabled before capture.
    const meleeButton = page.getByRole('button', { name: /ближний бой/i }).first();
    await expect(meleeButton).toBeVisible({ timeout: 3000 });
    await expect(meleeButton).toBeEnabled();

    // Tap «Отметить захваченной».
    await markButton.click({ force: true });

    // The captured banner appears.
    await expect(page.getByText('ЗАХВАЧЕНА ПРОТИВНИКОМ')).toBeVisible({ timeout: 3000 });

    // Combat buttons are now disabled (locked). The melee button should be
    // disabled — verify via the disabled attribute.
    await expect(meleeButton).toBeDisabled({ timeout: 3000 });

    // The toggle now reads «Вернуть (перезахват)».
    const recaptureButton = page.getByRole('button', { name: /вернуть \(перезахват\)/i }).first();
    await expect(recaptureButton).toBeVisible({ timeout: 3000 });

    // Tap recapture.
    await recaptureButton.click({ force: true });

    // Banner gone, combat re-enabled.
    await expect(page.getByText('ЗАХВАЧЕНА ПРОТИВНИКОМ')).toHaveCount(0);
    await expect(meleeButton).toBeEnabled({ timeout: 3000 });
  });
});
