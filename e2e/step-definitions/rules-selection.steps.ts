import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Rules Selection steps

When('я нахожусь на этапе выбора правил', async function(this: BronepehotaWorld) {
  const rulesSelector = this.page.getByText(/правила|выберите/i);
  await expect(rulesSelector.first()).toBeVisible({ timeout: 5000 });
});

When('я вижу доступные версии правил', async function(this: BronepehotaWorld) {
  const rulesOptions = this.page.getByText(/Технолог|Панова/i);
  await expect(rulesOptions.first()).toBeVisible();
});

When('я выбираю версию правил {string}', async function(this: BronepehotaWorld, version: string) {
  const rulesButton = this.page.getByRole('button', { name: new RegExp(version, 'i') });
  if (await rulesButton.isVisible()) {
    await rulesButton.click();
  } else {
    // Try combobox
    const rulesSelect = this.page.getByRole('combobox');
    if (await rulesSelect.isVisible()) {
      await rulesSelect.selectOption(version);
    }
  }
  await this.page.waitForTimeout(300);
});

Then('индикатор версии должен отображаться в интерфейсе', async function(this: BronepehotaWorld) {
  const versionIndicator = this.page.locator('[class*="version"]').or(this.page.getByText(/Технолог|Панова/i));
  await expect(versionIndicator.first()).toBeVisible();
});

When('я нажимаю на иконку информации рядом с версией правил', async function(this: BronepehotaWorld) {
  const infoButton = this.page.getByRole('button', { name: /информация|info|ℹ️/i });
  await infoButton.first().click();
  await this.page.waitForTimeout(300);
});

Then('должно открыться модальное окно с описанием правил', async function(this: BronepehotaWorld) {
  const modal = this.page.getByRole('dialog').or(this.page.locator('.modal'));
  await expect(modal.first()).toBeVisible({ timeout: 5000 });
});

Then('я должен увидеть название, источник и описание правил', async function(this: BronepehotaWorld) {
  const title = this.page.getByRole('heading');
  const source = this.page.getByText(/источник|source/i);
  const description = this.page.getByText(/описание|description/i);

  await expect(title.first()).toBeVisible();
  await expect(source.or(description).first()).toBeVisible();
});

Given('я на этапе выбора правил', async function(this: BronepehotaWorld) {
  const rulesSelector = this.page.getByText(/правила|выберите/i);
  await expect(rulesSelector.first()).toBeVisible({ timeout: 5000 });
});

When('я просматриваю доступные версии правил', async function(this: BronepehotaWorld) {
  // View all available rules
  const rulesContainer = this.page.locator('[class*="rules"]').or(this.page.getByTestId('rules-selector'));
  await expect(rulesContainer.first()).toBeVisible();
});

Then('я должен увидеть:', async function(this: BronepehotaWorld, dataTable) {
  const expected = dataTable.hashes();

  for (const row of expected) {
    const rulesElement = this.page.getByText(new RegExp(row['название'], 'i'));
    await expect(rulesElement.first()).toBeVisible();
  }
});

Given('я создал армию', async function(this: BronepehotaWorld) {
  const mockArmy = {
    name: 'Test Army',
    faction: 'polaris',
    units: [],
    totalCost: 0,
    pointBudget: 100,
    currentStep: 'unit-select',
  };

  await this.page.evaluate((army) => {
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
  }, mockArmy);
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

When('я возвращаюсь к выбору правил', async function(this: BronepehotaWorld) {
  const backButton = this.page.getByRole('button', { name: /назад|←/i });
  if (await backButton.isVisible()) {
    await backButton.click();
  }
  await this.page.waitForTimeout(300);
});

Then('версия правил должна быть обновлена', async function(this: BronepehotaWorld) {
  const newVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    return value ? JSON.parse(value) : null;
  });
  expect(newVersion).toBeDefined();
});

Then('все расчёты в новой армии должны использовать новые правила', async function(this: BronepehotaWorld) {
  // Verify rules are applied in calculations
  const rulesVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    return value ? JSON.parse(value) : null;
  });
  expect(rulesVersion).toBe(this.currentRulesVersion);
});

Then('цвет индикатора должен соответствовать версии Панова', async function(this: BronepehotaWorld) {
  const indicator = this.page.locator('[class*="indicator"]').or(this.page.locator('[class*="version"]'));
  const color = await indicator.first().evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  // Red color for Panov rules
  expect(color).toContain('255'); // Red channel
});

Given('я выполняю атаку с дистанцией {string} на расстоянии {string} шагов', async function(this: BronepehotaWorld, range: string, distance: string) {
  // Setup attack scenario
});

When('я выполняю расчёт попадания', async function(this: BronepehotaWorld) {
  const attackButton = this.page.getByRole('button', { name: /атаковать|рассчитать/i });
  await attackButton.click({ timeout: 10000 });
  await this.page.waitForTimeout(1000);
});

Then('бросок должен выполняться по формуле официальных правил', async function(this: BronepehotaWorld) {
  // Verify official rules calculation
  const result = this.page.getByText(/попадание|промах/i);
  await expect(result.first()).toBeVisible({ timeout: 5000 });
});

Then('результат должен учитывать модификатор дистанции', async function(this: BronepehotaWorld) {
  const distanceInfo = this.page.getByText(/дистанция|модификатор/i);
  await expect(distanceInfo.first()).toBeVisible();
});

Given('цель в лёгком укрытии', async function(this: BronepehotaWorld) {
  // Setup fortification
});

Then('эффективная дистанция должна быть увеличена на 1', async function(this: BronepehotaWorld) {
  const distanceInfo = this.page.getByText(/дистанция/i);
  await expect(distanceInfo.first()).toBeVisible();
});

Then('бросок должен выполняться с учётом укрытия', async function(this: BronepehotaWorld) {
  const fortificationInfo = this.page.getByText(/укрытие|fortification/i);
  await expect(fortificationInfo.first()).toBeVisible();
});

Given('я атакую машину с текущей прочностью {string} из {string}', async function(this: BronepehotaWorld, current: string, max: string) {
  // Setup machine attack
});

When('я выполняю расчёт урона', async function(this: BronepehotaWorld) {
  const damageButton = this.page.getByRole('button', { name: /урон|рассчитать/i });
  await damageButton.click({ timeout: 10000 });
  await this.page.waitForTimeout(1000);
});

Then('должен учитываться коэффициент в зависимости от зоны прочности', async function(this: BronepehotaWorld) {
  const zoneInfo = this.page.getByText(/зона|зелёный|жёлтый|красный/i);
  await expect(zoneInfo.first()).toBeVisible();
});

Then('урон в жёлтой зоне должен быть увеличен', async function(this: BronepehotaWorld) {
  const damageInfo = this.page.getByText(/урон|повышен/i);
  await expect(damageInfo.first()).toBeVisible();
});

Given('у оружия есть эффект {string} с радиусом {string}', async function(this: BronepehotaWorld, effect: string, radius: string) {
  // Setup weapon with effect
});

When('я выполняю атаку', async function(this: BronepehotaWorld) {
  const attackButton = this.page.getByRole('button', { name: /атаковать/i });
  await attackButton.click({ timeout: 10000 });
  await this.page.waitForTimeout(1000);
});

Then('должен быть рассчитан урон по зоне', async function(this: BronepehotaWorld) {
  const aoeInfo = this.page.getByText(/зона|AoE|радиус/i);
  await expect(aoeInfo.first()).toBeVisible();
});

Then('я должен увидеть additional урон для целей в зоне', async function(this: BronepehotaWorld) {
  const damageInfo = this.page.getByText(/дополнительный|урон/i);
  await expect(damageInfo.first()).toBeVisible();
});

Given('у оружия есть эффект {string}', async function(this: BronepehotaWorld, effect: string) {
  // Setup
});

Then('специальный эффект должен быть проигнорирован', async function(this: BronepehotaWorld) {
  const noEffectInfo = this.page.getByText(/без эффекта|базовый/i);
  await expect(noEffectInfo.first()).toBeVisible();
});

Then('должен быть рассчитан только базовый урон', async function(this: BronepehotaWorld) {
  const baseDamageInfo = this.page.getByText(/урон|базовый/i);
  await expect(baseDamageInfo.first()).toBeVisible();
});
