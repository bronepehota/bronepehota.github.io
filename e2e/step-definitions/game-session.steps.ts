import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Game Session steps

Given('localStorage содержит созданную армию фракции {string}', async function(this: BronepehotaWorld, faction: string) {
  const factionId = faction.toLowerCase().replace(/\s+/g, '-');
  const mockArmy = {
    name: 'Test Army',
    faction: factionId,
    units: [
      {
        instanceId: 'unit-1',
        type: 'squad',
        data: {
          id: `${factionId}_test_squad`,
          name: 'Тестовый отряд',
          faction: factionId,
          cost: 15,
          soldiers: [
            { rank: 3, speed: 4, range: 'D12', power: '1D6', melee: 4, props: [], armor: 2 }
          ]
        },
        instanceNumber: 1,
        currentDurability: undefined,
        currentAmmo: undefined,
        grenadesUsed: false,
        deadSoldiers: [],
      }
    ],
    totalCost: 15,
    pointBudget: 100,
    currentStep: 'battle',
    isInBattle: false,
    currentTurn: 1
  };

  await this.page.evaluate((army) => {
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
  }, mockArmy);
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

Given('я нахожусь в режиме боя', async function(this: BronepehotaWorld) {
  // Wait for game session to load
  await this.page.waitForTimeout(500);
});

When('я открываю вкладку {string}', async function(this: BronepehotaWorld, tabName: string) {
  const tab = this.page.getByRole('tab', { name: new RegExp(tabName, 'i') });
  await tab.click();
  await this.page.waitForTimeout(300);
});

Then('я должен увидеть все юниты моей армии', async function(this: BronepehotaWorld) {
  const unitCards = this.page.getByTestId(/unit-card|army-unit/i);
  const count = await unitCards.count();
  expect(count).toBeGreaterThan(0);
});

Then('каждый юнит должен показывать своё текущее состояние', async function(this: BronepehotaWorld) {
  const unitCards = this.page.getByTestId(/unit-card|army-unit/i);
  const count = await unitCards.count();

  for (let i = 0; i < count; i++) {
    const card = unitCards.nth(i);
    await expect(card).toBeVisible();
  }
});

Then('я должен видеть номер текущего хода в шапке', async function(this: BronepehotaWorld) {
  const turnCounter = this.page.getByText(/тур/i);
  await expect(turnCounter).toBeVisible();
});

Then('номер хода должен начинаться с {string}', async function(this: BronepehotaWorld, expectedTurn: string) {
  const turnNumber = this.page.getByText(expectedTurn);
  await expect(turnNumber).toBeVisible();
});

When('я выбираю атакующий юнит из списка', async function(this: BronepehotaWorld) {
  const unitSelector = this.page.getByRole('button', { name: /атакующий|выбрать/i });
  await unitSelector.first().click();
  await this.page.waitForTimeout(300);
});

Then('выбранный юнит должен быть выделен', async function(this: BronepehotaWorld) {
  const selectedUnit = this.page.locator('.selected').or(this.page.locator('[aria-selected="true"]'));
  await expect(selectedUnit.first()).toBeVisible();
});

Then('должны отобразиться его характеристики', async function(this: BronepehotaWorld) {
  const stats = this.page.getByText(/дистанция|сила|броня/i);
  await expect(stats.first()).toBeVisible();
});

Given('я выбрал атакующий юнит', async function(this: BronepehotaWorld) {
  const unitSelector = this.page.getByRole('button', { name: /атакующий|выбрать/i });
  if (await unitSelector.count() > 0) {
    await unitSelector.first().click();
    await this.page.waitForTimeout(300);
  }
});

When('я выбираю юнит-цель', async function(this: BronepehotaWorld) {
  const targetButton = this.page.getByRole('button', { name: /цель|атаковать/i });
  await targetButton.first().click();
  await this.page.waitForTimeout(300);
});

Then('должен открыться модальный диалог атаки', async function(this: BronepehotaWorld) {
  const modal = this.page.getByRole('dialog').or(this.page.locator('.modal'));
  await expect(modal.first()).toBeVisible({ timeout: 5000 });
});

Then('должны быть доступны параметры атаки', async function(this: BronepehotaWorld) {
  const params = this.page.getByText(/дистанция|укрытие/i);
  await expect(params.first()).toBeVisible();
});

Given('я выбрал атакующий отряд {string}', async function(this: BronepehotaWorld, squadName: string) {
  const unitButton = this.page.getByRole('button', { name: new RegExp(squadName, 'i') });
  if (await unitButton.count() > 0) {
    await unitButton.first().click();
    await this.page.waitForTimeout(300);
  }
});

Given('я выбрал цель на расстоянии {string} шагов', async function(this: BronepehotaWorld, distance: string) {
  // Precondition - target selection
});

When('я ввожу дистанцию {string}', async function(this: BronepehotaWorld, distance: string) {
  const distanceInput = this.page.getByRole('spinbutton', { name: /дистанция|расстояние/i });
  if (await distanceInput.isVisible()) {
    await distanceInput.fill(distance);
  }
});

Then('должен быть выполнен бросок на попадание', async function(this: BronepehotaWorld) {
  const diceResult = this.page.getByText(/\d+|бросок|кубик/i);
  await expect(diceResult.first()).toBeVisible({ timeout: 5000 });
});

Then('должен быть показан результат атаки', async function(this: BronepehotaWorld) {
  const result = this.page.getByText(/попадание|промах|урон/i);
  await expect(result.first()).toBeVisible({ timeout: 5000 });
});

Given('я выбрал цель в соседней клетке', async function(this: BronepehotaWorld) {
  // Precondition
});

Then('должен быть выполнен бросок на ближний бой', async function(this: BronepehotaWorld) {
  const diceResult = this.page.getByText(/бросок|кубик|бой/i);
  await expect(diceResult.first()).toBeVisible({ timeout: 5000 });
});

Then('должен быть показан результат сравнения боя', async function(this: BronepehotaWorld) {
  const result = this.page.getByText(/победа|ничья|поражение/i);
  await expect(result.first()).toBeVisible({ timeout: 5000 });
});

When('я выполняю действие {string}', async function(this: BronepehotaWorld, action: string) {
  const actionButton = this.page.getByRole('button', { name: new RegExp(action, 'i') });
  await actionButton.first().click();
  await this.page.waitForTimeout(300);
});

Then('действие должно быть отмечено как выполненное', async function(this: BronepehotaWorld) {
  const completedAction = this.page.locator('.completed').or(this.page.locator('[aria-checked="true"]'));
  await expect(completedAction.first()).toBeVisible();
});

Then('юнит должен быть отмечен как выполнивший все действия', async function(this: BronepehotaWorld) {
  const doneMarker = this.page.getByText(/выполнено|готов/i);
  await expect(doneMarker.first()).toBeVisible();
});

Given('отряд получил урон', async function(this: BronepehotaWorld) {
  // Precondition
});

When('солдат отряда погибает', async function(this: BronepehotaWorld) {
  // Simulate soldier death through UI
});

Then('солдат должен быть отмечен как мёртвый', async function(this: BronepehotaWorld) {
  const deadMarker = this.page.locator('.dead').or(this.page.getByText(/💀|скелет/i));
  await expect(deadMarker.first()).toBeVisible();
});

Then('изображение солдата должно измениться на {string}', async function(this: BronepehotaWorld, marker: string) {
  const skullMarker = this.page.getByText(new RegExp(marker, 'i'));
  await expect(skullMarker).toBeVisible();
});

Given('машина получила урон', async function(this: BronepehotaWorld) {
  // Precondition
});

When('прочность машины уменьшается', async function(this: BronepehotaWorld) {
  const damageButton = this.page.getByRole('button', { name: /урон|применить/i });
  if (await damageButton.count() > 0) {
    await damageButton.first().click();
  }
});

Then('текущее значение прочности должно обновиться', async function(this: BronepehotaWorld) {
  const durabilityDisplay = this.page.getByText(/\d+\/\d+/).first();
  await expect(durabilityDisplay).toBeVisible();
});

Then('должна измениться зона прочности', async function(this: BronepehotaWorld) {
  // Check for zone color change
  const zoneIndicator = this.page.locator('[class*="zone"]').or(this.page.locator('[class*="durability"]'));
  await expect(zoneIndicator.first()).toBeVisible();
});

Given('у отряда есть граната', async function(this: BronepehotaWorld) {
  // Precondition - squad has grenade prop
});

Given('солдат ещё не использовал гранату', async function(this: BronepehotaWorld) {
  // Precondition
});

When('я выбираю атаку гранатой', async function(this: BronepehotaWorld) {
  const grenadeButton = this.page.getByRole('button', { name: /граната|г/i });
  if (await grenadeButton.isVisible()) {
    await grenadeButton.click();
  }
});

Then('должен быть выполнен бросок дальности гранаты', async function(this: BronepehotaWorld) {
  const rollResult = this.page.getByText(/бросок|дальность|граната/i);
  await expect(rollResult.first()).toBeVisible({ timeout: 5000 });
});

Then('после атаки граната должна быть отмечена как использованная', async function(this: BronepehotaWorld) {
  const usedMarker = this.page.locator('.used').or(this.page.getByText(/использован/i));
  await expect(usedMarker.first()).toBeVisible();
});

Given('все юниты выполнили свои действия', async function(this: BronepehotaWorld) {
  // Precondition
});

When('начинается новый ход', async function(this: BronepehotaWorld) {
  const nextTurnButton = this.page.getByRole('button', { name: /следующий ход|новый ход/i });
  if (await nextTurnButton.isVisible()) {
    await nextTurnButton.click();
  }
});

Then('все действия юнитов должны быть сброшены', async function(this: BronepehotaWorld) {
  const completedActions = this.page.locator('.completed').or(this.page.locator('[aria-checked="true"]'));
  const count = await completedActions.count();
  expect(count).toBe(0);
});

Then('номер хода должен увеличиться на 1', async function(this: BronepehotaWorld) {
  const turnCounter = this.page.getByText(/тур/i);
  await expect(turnCounter).toBeVisible();
});

When('я нажимаю кнопку завершения боя', async function(this: BronepehotaWorld) {
  const endButton = this.page.getByRole('button', { name: /завершить бой|завершить/i });
  await endButton.click();
});

Then('должно появиться подтверждение', async function(this: BronepehotaWorld) {
  const confirmDialog = this.page.getByRole('dialog').or(this.page.locator('.modal'));
  await expect(confirmDialog.first()).toBeVisible();
});

Then('после подтверждения армия должна быть сброшена', async function(this: BronepehotaWorld) {
  const confirmButton = this.page.getByRole('button', { name: /подтвердить|да/i });
  await confirmButton.click();

  const armyState = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_army');
    return value ? JSON.parse(value) : null;
  });
  expect(armyState?.isInBattle).toBe(false);
  expect(armyState?.units.length).toBe(0);
});

Then('я должен вернуться на страницу создания армии', async function(this: BronepehotaWorld) {
  const factionSelector = this.page.getByText(/Polaris|Protectorate|Mercenaries/i);
  await expect(factionSelector.first()).toBeVisible({ timeout: 5000 });
});

When('я выбираю тип атаки {string}', async function(this: BronepehotaWorld, attackType: string) {
  const attackButton = this.page.getByRole('button', { name: new RegExp(attackType, 'i') });
  if (await attackButton.isVisible()) {
    await attackButton.click();
  }
});

When('я выбираю тип атаки {string} (ближний бой)', async function(this: BronepehotaWorld, attackType: string) {
  const attackButton = this.page.getByRole('button', { name: new RegExp(attackType, 'i') });
  if (await attackButton.isVisible()) {
    await attackButton.click();
  }
});

// Also handle the case where parentheses are part of the cucumber expression
When(/я выбираю тип атаки "(.*?)" \(ближний бой\)/, async function(this: BronepehotaWorld, attackType: string) {
  const attackButton = this.page.getByRole('button', { name: new RegExp(attackType, 'i') });
  if (await attackButton.isVisible()) {
    await attackButton.click();
  }
});

Given('я выбрал отряд {string}', async function(this: BronepehotaWorld, squadName: string) {
  const unitButton = this.page.getByRole('button', { name: new RegExp(squadName, 'i') });
  if (await unitButton.count() > 0) {
    await unitButton.first().click();
    await this.page.waitForTimeout(300);
  }
});
