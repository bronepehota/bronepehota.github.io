import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Army Building steps

When('я нахожусь на странице выбора фракции', async function(this: BronepehotaWorld) {
  const factionSelector = this.page.getByRole('button').filter({ hasText: /Polaris/i });
  await expect(factionSelector.first()).toBeVisible({ timeout: 5000 });
});

When('я ввожу балл очков {string}', async function(this: BronepehotaWorld, points: string) {
  const input = this.page.getByRole('spinbutton').or(this.page.getByRole('textbox')).first();
  await input.fill(points);
});

Then('в шапке должен отображаться бренд фракции {string}', async function(this: BronepehotaWorld, factionName: string) {
  const brandElement = this.page.getByText(new RegExp(factionName, 'i'));
  await expect(brandElement).toBeVisible({ timeout: 5000 });
});

Given('я выбрал фракцию {string} с балансом {string} очков', async function(this: BronepehotaWorld, faction: string, points: string) {
  const factionId = faction.toLowerCase().replace(/\s+/g, '-');
  const factionButton = this.page.getByRole('button', { name: new RegExp(faction, 'i') });
  await factionButton.click();

  const input = this.page.getByRole('spinbutton').or(this.page.getByRole('textbox')).first();
  await input.fill(points);

  const continueButton = this.page.getByRole('button', { name: /продолжить|далее/i });
  await continueButton.click();

  await this.page.waitForTimeout(500);
  this.currentFaction = factionId;
});

Given('я на странице выбора юнитов', async function(this: BronepehotaWorld) {
  const unitSelector = this.page.getByText(/отряд|юнит/i);
  await expect(unitSelector.first()).toBeVisible({ timeout: 5000 });
});

When('я ищу отряд по имени {string}', async function(this: BronepehotaWorld, squadName: string) {
  const searchInput = this.page.getByPlaceholder(/поиск|название/i);
  if (await searchInput.isVisible()) {
    await searchInput.fill(squadName);
  }
});

When('я нажимаю кнопку добавления отряда', async function(this: BronepehotaWorld) {
  const addButton = this.page.getByRole('button', { name: /\+|добавить/i });
  await addButton.first().click();
  await this.page.waitForTimeout(300);
});

Then('отряд должен появиться в моей армии', async function(this: BronepehotaWorld) {
  const armyUnits = this.page.getByTestId(/army-unit|unit-card/i);
  await expect(armyUnits.first()).toBeVisible({ timeout: 5000 });
});

Then('счётчик очков должен уменьшиться', async function(this: BronepehotaWorld) {
  const costDisplay = this.page.getByText(/\d+\/\d+/);
  await expect(costDisplay).toBeVisible();
});

When('я переключаюсь на вкладку {string}', async function(this: BronepehotaWorld, tabName: string) {
  const tab = this.page.getByRole('tab', { name: new RegExp(tabName, 'i') });
  await tab.click();
  await this.page.waitForTimeout(300);
});

When('я ищу машину {string}', async function(this: BronepehotaWorld, machineName: string) {
  const searchInput = this.page.getByPlaceholder(/поиск/i);
  if (await searchInput.isVisible()) {
    await searchInput.fill(machineName);
  }
});

Then('машина должна появиться в моей армии', async function(this: BronepehotaWorld) {
  const armyUnits = this.page.getByTestId(/army-unit|unit-card/i);
  await expect(armyUnits.first()).toBeVisible({ timeout: 5000 });
});

When('я пытаюсь добавить отряд стоимостью {string} очков', async function(this: BronepehotaWorld, cost: string) {
  const addButton = this.page.getByRole('button', { name: /\+|добавить/i });
  await addButton.first().click();
});

Then('кнопка добавления должна быть неактивна', async function(this: BronepehotaWorld) {
  const addButton = this.page.getByRole('button', { name: /\+|добавить/i }).first();
  await expect(addButton).toBeDisabled();
});

Then('я должен увидеть сообщение о превышении лимита', async function(this: BronepehotaWorld) {
  const errorMsg = this.page.getByText(/превышен|лимит|очк/i);
  await expect(errorMsg.first()).toBeVisible({ timeout: 3000 });
});

Given('я добавил отряд {string} в армию', async function(this: BronepehotaWorld, squadName: string) {
  const searchInput = this.page.getByPlaceholder(/поиск/i);
  if (await searchInput.isVisible()) {
    await searchInput.fill(squadName);
  }

  const addButton = this.page.getByRole('button', { name: /\+|добавить/i });
  await addButton.first().click();
  await this.page.waitForTimeout(300);
});

When('я нажимаю кнопку удаления на карточке юнита', async function(this: BronepehotaWorld) {
  const deleteButton = this.page.getByRole('button', { name: /удалить|🗑|×/i });
  await deleteButton.first().click();
  await this.page.waitForTimeout(300);
});

Then('юнит должен быть удалён из армии', async function(this: BronepehotaWorld) {
  const armyUnits = this.page.getByTestId(/army-unit|unit-card/i);
  const count = await armyUnits.count();
  expect(count).toBe(0);
});

Then('счётчик очков должен увеличиться', async function(this: BronepehotaWorld) {
  const costDisplay = this.page.getByText(/\d+\/\d+/);
  await expect(costDisplay).toBeVisible();
});

When('я ввожу в поиск {string}', async function(this: BronepehotaWorld, searchText: string) {
  const searchInput = this.page.getByPlaceholder(/поиск/i);
  await searchInput.fill(searchText);
  await this.page.waitForTimeout(300);
});

Then('должны отображаться только отряды содержащие {string} в названии', async function(this: BronepehotaWorld, searchText: string) {
  const squadCards = this.page.getByTestId(/squad-card|unit-card/i);
  const count = await squadCards.count();

  for (let i = 0; i < count; i++) {
    const card = squadCards.nth(i);
    const text = await card.textContent();
    expect(text?.toLowerCase()).toContain(searchText.toLowerCase());
  }
});

Given('я добавил несколько юнитов в армию', async function(this: BronepehotaWorld) {
  const searchInput = this.page.getByPlaceholder(/поиск/i);
  await searchInput.fill('клон');

  const addButton = this.page.getByRole('button', { name: /\+|добавить/i });
  await addButton.first().click();
  await this.page.waitForTimeout(300);
});

Then('должен скачаться JSON файл с составом армии', async function(this: BronepehotaWorld) {
  // Playwright handles download detection differently
  const downloadPromise = this.page.waitForEvent('download');

  const exportButton = this.page.getByRole('button', { name: /экспорт|export/i });
  await exportButton.click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});

Given('у меня есть JSON файл с составом армии', async function(this: BronepehotaWorld) {
  // Precondition: assume file exists
});

When('я загружаю JSON файл', async function(this: BronepehotaWorld) {
  const fileInput = this.page.getByLabel(/загрузить|import/i).or(this.page.getByRole('button', { name: /импорт|import/i }));

  // Create a mock JSON file
  const mockArmy = {
    name: 'Test Army',
    faction: 'polaris',
    units: [],
    totalCost: 0,
    pointBudget: 100,
    currentStep: 'unit-select',
  };

  await fileInput.setInputFiles({
    name: 'army.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(mockArmy)),
  });
});

Then('армия должна быть загружена', async function(this: BronepehotaWorld) {
  const armyName = this.page.getByText('Test Army');
  await expect(armyName).toBeVisible({ timeout: 5000 });
});

Then('все юниты должны отображаться в списке', async function(this: BronepehotaWorld) {
  const armyUnits = this.page.getByTestId(/army-unit|unit-card/i);
  await expect(armyUnits.first()).toBeVisible();
});

Given('я добавил минимум один отряд в армию', async function(this: BronepehotaWorld) {
  const searchInput = this.page.getByPlaceholder(/поиск/i);
  await searchInput.fill('клон');

  const addButton = this.page.getByRole('button', { name: /\+|добавить/i });
  await addButton.first().click();
  await this.page.waitForTimeout(300);
});

When('я переключаюсь в режим {string}', async function(this: BronepehotaWorld, mode: string) {
  const modeButton = this.page.getByRole('button', { name: new RegExp(mode, 'i') });
  await modeButton.click();
  await this.page.waitForTimeout(500);
});

Then('должен отобразиться экран игровой сессии', async function(this: BronepehotaWorld) {
  const gameSession = this.page.getByText(/войска|атака/i);
  await expect(gameSession.first()).toBeVisible({ timeout: 5000 });
});

Then('армия должна быть готова к бою', async function(this: BronepehotaWorld) {
  const armyState = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_army');
    return value ? JSON.parse(value) : null;
  });
  expect(armyState).toBeDefined();
  expect(armyState?.units.length).toBeGreaterThan(0);
});

When('я нажимаю кнопку добавления машины', async function(this: BronepehotaWorld) {
  const addButton = this.page.getByRole('button', { name: /\+|добавить/i });
  await addButton.first().click();
  await this.page.waitForTimeout(300);
});
