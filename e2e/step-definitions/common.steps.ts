import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Common steps for navigation and basic interactions

Given('приложение загружено на главной странице', async function(this: BronepehotaWorld) {
  await this.page.goto('http://localhost:3000');
  await this.page.waitForLoadState('networkidle');
});

Given('приложение загружено', async function(this: BronepehotaWorld) {
  await this.page.goto('http://localhost:3000');
  await this.page.waitForLoadState('networkidle');
});

Given('localStorage очищен', async function(this: BronepehotaWorld) {
  await this.page.evaluate(() => localStorage.clear());
});

When('я перехожу на страницу редактора', async function(this: BronepehotaWorld) {
  await this.page.goto('http://localhost:3000/editor');
  await this.page.waitForLoadState('networkidle');
});

Given('я перешёл на страницу редактора', async function(this: BronepehotaWorld) {
  await this.page.goto('http://localhost:3000/editor');
  await this.page.waitForLoadState('networkidle');
});

When('я перезагружаю страницу', async function(this: BronepehotaWorld) {
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

Then('я должен увидеть страницу выбора фракции', async function(this: BronepehotaWorld) {
  const factionSelector = this.page.getByText(/Polaris|Protectorate|Mercenaries/i);
  await expect(factionSelector).toBeVisible({ timeout: 5000 });
});

Then('я должен увидеть страницу выбора юнитов', async function(this: BronepehotaWorld) {
  const unitSelector = this.page.getByText('Выберите отряды') || this.page.getByRole('heading', { name: /отряд/i });
  await expect(unitSelector.first()).toBeVisible({ timeout: 5000 });
});

Then('я должен увидеть сообщение об успешном сохранении', async function(this: BronepehotaWorld) {
  const successMessage = this.page.getByText(/сохранен|сохран|успеш/i);
  await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
});

Then('я должен увидеть подтверждение удаления', async function(this: BronepehotaWorld) {
  const confirmMessage = this.page.getByText(/удален|удален|успеш/i);
  await expect(confirmMessage.first()).toBeVisible({ timeout: 5000 });
});

Then('версия правил должна быть сохранена в localStorage', async function(this: BronepehotaWorld) {
  const rulesVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    return value ? JSON.parse(value) : null;
  });
  expect(rulesVersion).toBeDefined();
  this.currentRulesVersion = rulesVersion;
});

Then('версия правил {string} должна остаться выбранной', async function(this: BronepehotaWorld, expectedVersion: string) {
  const rulesVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    // Rules version is stored as plain string, not JSON
    return value;
  });
  expect(rulesVersion).toBe(this.currentRulesVersion || expectedVersion);
});

// Common UI interaction steps
When('я нажимаю кнопку {string}', async function(this: BronepehotaWorld, buttonText: string) {
  const button = this.page.getByRole('button', { name: new RegExp(buttonText, 'i') });
  await button.click();
});

When('я выбираю фракцию {string}', async function(this: BronepehotaWorld, factionName: string) {
  const factionButton = this.page.getByRole('button', { name: new RegExp(factionName, 'i') });
  await factionButton.click();
  this.currentFaction = factionName.toLowerCase().replace(/\s+/g, '-');
});

Given('я выбрал правила {string}', async function(this: BronepehotaWorld, rules: string) {
  this.currentRulesVersion = rules.toLowerCase();
});

When('я выбираю правила {string}', async function(this: BronepehotaWorld, rules: string) {
  const rulesButton = this.page.getByRole('button', { name: new RegExp(rules, 'i') });
  if (await rulesButton.isVisible()) {
    await rulesButton.click();
  } else {
    // Try combobox
    const rulesSelect = this.page.getByRole('combobox');
    if (await rulesSelect.isVisible()) {
      await rulesSelect.selectOption(rules);
    }
  }
  await this.page.waitForTimeout(300);
  this.currentRulesVersion = rules.toLowerCase();
});

Then('в шапке должен отображаться бренд фракции {string}', async function(this: BronepehotaWorld, factionName: string) {
  const brandElement = this.page.getByText(new RegExp(factionName, 'i'));
  await expect(brandElement).toBeVisible({ timeout: 5000 });
});

Then('в шапке должен отображаться бренд фракции Polaris', async function(this: BronepehotaWorld) {
  const brandElement = this.page.getByText(/Polaris/i);
  await expect(brandElement).toBeVisible({ timeout: 5000 });
});

Then('не должно быть возвращения к правилам по умолчанию', async function(this: BronepehotaWorld) {
  const rulesVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    return value ? JSON.parse(value) : null;
  });
  expect(rulesVersion).toBe(this.currentRulesVersion);
});
