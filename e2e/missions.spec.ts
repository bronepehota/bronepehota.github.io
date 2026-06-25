import { test, expect } from '@playwright/test';
import {
  clearStorage,
  confirmRulesAndSource,
  selectFaction,
  selectBudget,
  selectMission,
  addFirstUnit,
  goToPreparation,
  setupGameSessionWithSquad,
} from './helpers/setup';

test.describe('Миссии', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('энциклопедия: список миссий отображается', async ({ page }) => {
    await page.goto('/encyclopedia/missions');
    await page.waitForLoadState('networkidle');

    const grid = page.getByTestId('mission-grid').first();
    await expect(grid).toBeVisible();

    const cards = page.locator('[data-testid^="mission-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('энциклопедия: страница миссии открывается', async ({ page }) => {
    await page.goto('/encyclopedia/mission/osvobozhdenie');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Освобождение');
    await expect(page.getByText('Условия победы')).toBeVisible();
    await expect(page.getByText('Особые правила')).toBeVisible();
  });

  test('мастер: шаг миссии появляется после фракции (до бюджета)', async ({ page }) => {
    await confirmRulesAndSource(page);
    await selectFaction(page, 'polaris');

    // Mission step is visible right after faction (budget comes only for free play)
    const missionConfirm = page.getByTestId('mission-confirm-button');
    await expect(missionConfirm).toBeVisible();
    await expect(page.getByTestId('mission-card-__free_play__')).toBeVisible();
    await expect(page.getByTestId('mission-card-osvobozhdenie')).toBeVisible();
    // Budget step not reached yet
    await expect(page.getByTestId('budget-next-button')).toHaveCount(0);
  });

  test('мастер: свободная игра ведёт к бюджету и сбору армии', async ({ page }) => {
    await confirmRulesAndSource(page);
    await selectFaction(page, 'polaris');
    await selectMission(page); // free play → budget step
    await selectBudget(page, 350); // → unit selection

    await expect(page.getByRole('button', { name: /добавить/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('мастер: выбор миссии сохраняется в army.missionId', async ({ page }) => {
    await confirmRulesAndSource(page);
    await selectFaction(page, 'polaris');
    await selectMission(page, 'osvobozhdenie'); // auto-fills, skips budget

    const armyRaw = await page.evaluate(() => localStorage.getItem('bronepehota_army'));
    expect(armyRaw).toBeTruthy();
    const army = JSON.parse(armyRaw!);
    expect(army.missionId).toBe('osvobozhdenie');
  });

  test('мастер: выбор миссии авто-заполняет армию участниками фракции', async ({ page }) => {
    await confirmRulesAndSource(page);
    await selectFaction(page, 'polaris');
    await selectMission(page, 'osvobozhdenie');

    const armyRaw = await page.evaluate(() => localStorage.getItem('bronepehota_army'));
    const army = JSON.parse(armyRaw!);
    // Polaris side of Освобождение: Тяжёлый штурмовой десант + Раптор + 2× миномёт
    expect(army.units.length).toBeGreaterThanOrEqual(3);
    expect(army.totalCost).toBeGreaterThan(0);
    // Budget was skipped (mission dictates the forces)
    const ids = army.units.map((u: any) => u.data.id);
    expect(ids).toContain('polaris_tyazhyolyy_shturmovoy_desant');
    expect(ids).toContain('raptor');
  });

  test('подготовка: баннер выбранной миссии отображается', async ({ page }) => {
    await confirmRulesAndSource(page);
    await selectFaction(page, 'polaris');
    await selectMission(page, 'osvobozhdenie'); // army auto-filled
    await goToPreparation(page);

    const banner = page.getByTestId('mission-reference-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Освобождение');
    await expect(banner).toContainText('Удержать захваченного полковника');
  });

  test('подготовка: свободная игра не показывает баннер', async ({ page }) => {
    await confirmRulesAndSource(page);
    await selectFaction(page, 'polaris');
    await selectMission(page); // free play
    await selectBudget(page, 350);
    await addFirstUnit(page);
    await goToPreparation(page);

    await expect(page.getByTestId('mission-reference-banner')).toHaveCount(0);
  });

  test('мастер: миссия без участников ведёт к бюджету (своя армия)', async ({ page }) => {
    await confirmRulesAndSource(page);
    await selectFaction(page, 'polaris');
    await selectMission(page, 'zahvat_tochek');

    // Lands on the budget step (not auto-filled unit-select)
    await expect(page.getByTestId('budget-next-button')).toBeVisible({ timeout: 5000 });

    // missionId stored, army NOT auto-filled
    const armyRaw = await page.evaluate(() => localStorage.getItem('bronepehota_army'));
    const army = JSON.parse(armyRaw!);
    expect(army.missionId).toBe('zahvat_tochek');
    expect(army.units.length).toBe(0);
  });

  test('мастер: миссия без участников — в кластере свободной игры (без делителя)', async ({ page }) => {
    await confirmRulesAndSource(page);
    await selectFaction(page, 'polaris');

    await expect(page.getByTestId('mission-confirm-button')).toBeVisible();
    // The capture-hold card is visible next to free play
    await expect(page.getByTestId('mission-card-zahvat_tochek')).toBeVisible();
    // No campaign header for classic (it is not grouped in the wizard)
    await expect(page.getByText('Кампания «Классические сценарии»')).toHaveCount(0);
    // Цербер campaign header still present (grouping intact)
    await expect(page.getByText('Кампания «Цербер»')).toBeVisible();
  });

  test('бой: попап завершения тура показывает лимит ходов миссии', async ({ page }) => {
    await setupGameSessionWithSquad(page, { missionId: 'zahvat_tochek', currentTurn: 1 });

    await expect(page.getByTestId('game-session')).toBeVisible({ timeout: 5000 });

    // Open dock menu, then click "Новый тур" to trigger the confirmation popup
    await page.getByTestId('dock-menu-toggle').click();
    await page.waitForTimeout(200);
    await page.getByTestId('new-turn-button').click();
    await page.waitForTimeout(200);

    // Popup should show "ИЗ 6" (zahvat_tochek has turnCount=6)
    const popup = page.locator('.fixed.inset-0.z-\\[100\\]');
    await expect(popup).toBeVisible();
    await expect(popup).toContainText('ИЗ 6');
  });

  test('энциклопедия: список миссий включает захват точек под «Классические сценарии»', async ({ page }) => {
    await page.goto('/encyclopedia/missions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Кампания «Классические сценарии»')).toBeVisible();
    await expect(page.getByTestId('mission-group-classic')).toBeVisible();
    await expect(page.getByTestId('mission-card-zahvat_tochek')).toBeVisible();
  });

  test('энциклопедия: страница захвата точек показывает цели, правила и диаграмму', async ({ page }) => {
    await page.goto('/encyclopedia/mission/zahvat_tochek');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Захват и удержание точек');
    await expect(page.getByRole('heading', { name: 'Условия победы' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Особые правила' })).toBeVisible();
    const diagram = page.locator('img[src*="/images/missions/zahvat_tochek/diagram"]');
    await expect(diagram.first()).toBeVisible();
  });

  test('энциклопедия: миссия «Скрытый враг» (наёмники vs протекторат) открывается', async ({ page }) => {
    await page.goto('/encyclopedia/mission/skrytyj_vrag');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Скрытый враг');
    await expect(page.getByText('Условия победы')).toBeVisible();
    await expect(page.getByText('Особые правила')).toBeVisible();
    // participant roster present (protectorate side links rendered)
    await expect(page.getByRole('link', { name: 'Войска Рутении' })).toBeVisible();
  });
});
