import { Page, expect } from '@playwright/test';

/**
 * Shared E2E setup helpers.
 * Reduces duplication of the Rules → Source → Faction → Budget → Army Builder flow.
 */

const TIMEOUTS = {
  short: 200,
  medium: 300,
  long: 500,
  load: 5000,
} as const;

/** Clear all bronepehota localStorage keys via addInitScript (before page load) */
export async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith('bronepehota') ||
      k === 'AUTO_COMPLETE_ENABLED' ||
      k === 'DISTANCE_INPUT_UNIT' ||
      k === 'STEP_TO_CM_FACTOR' ||
      k === 'STRICT_PILOT_RANK_ENABLED'
    );
    keys.forEach(k => localStorage.removeItem(k));
  });
}

/**
 * Новичок видит брифинг-экран (шаг intro визарда) — пройти его, если показан.
 * Воронка всегда стартует с чистого localStorage, так что путь быстрый;
 * 3с — запас на дев-компиляцию /app.
 */
export async function dismissIntroIfShown(page: Page) {
  const start = page.getByTestId('intro-start-button');
  const shown = await start
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (shown) {
    await start.click();
  }
}

/** Navigate through Rules → Source confirmation */
export async function confirmRulesAndSource(page: Page) {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await dismissIntroIfShown(page);

  const rulesConfirm = page.getByTestId('rules-confirm-button');
  await expect(rulesConfirm).toBeVisible({ timeout: TIMEOUTS.load });
  await rulesConfirm.click();

  const sourceConfirm = page.getByTestId('source-confirm-button');
  await expect(sourceConfirm).toBeVisible();
  await sourceConfirm.click();
}

/** Select a faction and continue. Defaults to 'polaris'. */
export async function selectFaction(page: Page, factionId = 'polaris') {
  const factionCard = page.getByTestId(`faction-card-${factionId}`);
  await expect(factionCard).toBeVisible();
  await factionCard.click();

  const continueButton = page.getByTestId('faction-continue-button');
  await expect(continueButton).toBeVisible();
  await continueButton.click();
}

/** Select a budget and proceed. Defaults to 350. */
export async function selectBudget(page: Page, budget = 350) {
  const budgetButton = page.getByRole('button', { name: String(budget) });
  await expect(budgetButton).toBeVisible();
  await budgetButton.click();

  const nextButton = page.getByTestId('budget-next-button');
  await expect(nextButton).toBeVisible();
  await nextButton.click();
}

/**
 * Advance through the optional Mission step. Defaults to free play
 * (Свободная игра, pre-selected). Pass a mission id to select a specific mission.
 */
export async function selectMission(page: Page, missionId?: string) {
  const confirmButton = page.getByTestId('mission-confirm-button');
  await expect(confirmButton).toBeVisible({ timeout: TIMEOUTS.load });

  if (missionId) {
    const card = page.getByTestId(`mission-card-${missionId}`);
    await expect(card).toBeVisible();
    await card.click();
  }

  await confirmButton.click();
  if (missionId) {
    // For a specific mission: wait until it's persisted to localStorage.
    // The auto-fill (buildMissionArmy) is an async React effect that fires
    // AFTER the step transition renders — budget-next-button alone doesn't
    // guarantee the army write completed.
    await page.waitForFunction((mid: string) => {
      try {
        const raw = localStorage.getItem('bronepehota_army');
        return !!raw && JSON.parse(raw).army?.missionId === mid;
      } catch { return false; }
    }, missionId, { timeout: TIMEOUTS.load });
  } else {
    // Free play: wait for the budget step to render.
    await expect(page.getByTestId('budget-next-button')).toBeVisible({ timeout: TIMEOUTS.load });
  }
}
export async function setupToArmyBuilder(page: Page, opts?: { faction?: string; budget?: number }) {
  await clearStorage(page);
  await confirmRulesAndSource(page);
  await selectFaction(page, opts?.faction);
  await selectMission(page); // free play (default) → budget step
  await selectBudget(page, opts?.budget); // → unit selection
}

/** Add the first available unit to the army */
export async function addFirstUnit(page: Page) {
  const addButton = page.getByRole('button', { name: /добавить/i }).first();
  await expect(addButton).toBeVisible({ timeout: TIMEOUTS.load });
  await addButton.click();
}

/** Navigate to battle preparation screen */
export async function goToPreparation(page: Page) {
  const toBattleButton = page.getByTestId('to-battle-button');
  await expect(toBattleButton).toBeVisible();
  await toBattleButton.click();
}

/** Full setup: army builder → add unit → preparation screen */
export async function setupToPreparation(page: Page, opts?: { faction?: string; budget?: number }) {
  await setupToArmyBuilder(page, opts);
  await addFirstUnit(page);
  await goToPreparation(page);
}

/**
 * Set up a game session with a squad via addInitScript.
 * Returns after navigating to /app with the game session visible.
 */
export async function setupGameSessionWithSquad(
  page: Page,
  opts?: { unitOverrides?: Record<string, unknown>; extraUnits?: Record<string, unknown>[]; missionId?: string; currentTurn?: number }
) {
  const config = {
    unitOverrides: opts?.unitOverrides || {},
    extraUnits: opts?.extraUnits || [],
    missionId: opts?.missionId,
    currentTurn: opts?.currentTurn ?? 1,
  };
  await page.addInitScript((cfg: { unitOverrides: Record<string, unknown>; extraUnits: Record<string, unknown>[]; missionId?: string; currentTurn?: number }) => {
    const soldiers = [
      { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 3, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 4, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 5, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
      { num: 6, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
    ];
    const baseUnit = {
      instanceId: 'squad-test-1',
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
      currentSoldiers: [0, 1, 2, 3, 4, 5],
      deadSoldiers: [],
      actionsUsed: [],
    };
    const unit = { ...baseUnit, ...cfg.unitOverrides };
    const army = {
      name: 'Test Army',
      faction: 'polaris',
      sourceId: 'star_system',
      units: [unit, ...cfg.extraUnits],
      totalCost: 50,
      currentStep: 'battle',
      isInBattle: true,
      currentTurn: cfg.currentTurn,
      ...(cfg.missionId ? { missionId: cfg.missionId } : {}),
    };
    localStorage.clear();
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
    localStorage.setItem('bronepehota_view', 'game');
    localStorage.setItem('bronepehota_display_mode', 'detailed');
  }, config);

  await page.goto('/app');
  await page.waitForLoadState('networkidle');

  const gameSession = page.getByTestId('game-session');
  await expect(gameSession.first()).toBeVisible({ timeout: TIMEOUTS.load * 2 });
}

/**
 * Set up a game session with a machine via addInitScript.
 */
export async function setupGameSessionWithMachine(page: Page) {
  await page.addInitScript(() => {
    const army = {
      name: 'Machine Test Army',
      faction: 'polaris',
      sourceId: 'star_system',
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
            { min_durability: 1, max_durability: 8, speed: 1 },
          ],
          weapons: [{ name: 'Пушка', range: 'D12', power: '2D20', special: '' }],
        },
        instanceNumber: 1,
        currentSoldiers: [],
        deadSoldiers: [],
        actionsUsed: [],
        durability: 16,
        ammo: 20,
        currentAmmo: 20,
        machineShotsUsed: 0,
      }],
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

  await page.goto('/app');
  await page.waitForLoadState('networkidle');

  const gameSession = page.getByTestId('game-session');
  await expect(gameSession.first()).toBeVisible({ timeout: TIMEOUTS.load * 2 });
}

/** Expand the first unit card in game session */
export async function expandFirstUnit(page: Page) {
  await page.waitForSelector('[data-testid^="unit-nav-"]', { timeout: TIMEOUTS.load });
  const unitCard = page.getByTestId(/^unit-nav-/).first();
  await expect(unitCard).toBeVisible();
  await unitCard.click({ force: true, timeout: TIMEOUTS.load });
}
