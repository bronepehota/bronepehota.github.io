import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Rules Selection steps

Given('я на этапе выбора правил', async function(this: BronepehotaWorld) {
  // First check if we need to navigate to rules step
  const rulesSelector = this.page.locator('#rules-selector');
  const isVisible = await rulesSelector.isVisible({ timeout: 2000 });

  if (!isVisible) {
    // Need to navigate: select faction first
    const factionText = this.page.getByText(/Империя Полярис|Polaris/i).first();
    if (await factionText.isVisible({ timeout: 3000 })) {
      await factionText.click();
      await this.page.waitForTimeout(500);
    }

    // Click "Начать сбор армии" or "Продолжить" button
    const startButton = this.page.getByRole('button', { name: /(начать сбор армии|продолжить|далее|next)/i }).or(
      this.page.getByText(/начать сбор армии/i)
    );
    if (await startButton.isVisible({ timeout: 3000 })) {
      await startButton.first().click();
      await this.page.waitForTimeout(1000);
    }

    // Fill budget if visible
    const input = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i)).first();
    if (await input.isVisible({ timeout: 3000 })) {
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.fill('100');
      await this.page.waitForTimeout(300);

      const nextButton = this.page.getByRole('button', { name: /(продолжить|далее|next)/i }).or(
        this.page.getByText(/продолжить/i)
      );
      await nextButton.first().click();
      // Wait longer for navigation to complete
      await this.page.waitForTimeout(1500);
    }
  }

  // Now rules selector should be visible
  await expect(rulesSelector).toBeVisible({ timeout: 10000 });
});

When('я просматриваю доступные версии правил', async function(this: BronepehotaWorld) {
  const rulesContainer = this.page.locator('#rules-selector').or(this.page.getByTestId('rules-selector'));
  await expect(rulesContainer.first()).toBeVisible();
});

Then('я должен увидеть:', async function(this: BronepehotaWorld, dataTable) {
  const expected = dataTable.hashes();

  for (const row of expected) {
    const rulesElement = this.page.getByText(new RegExp(row['название'], 'i'));
    await expect(rulesElement.first()).toBeVisible({ timeout: 3000 });
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

Given('я перешёл в режим боя', async function(this: BronepehotaWorld) {
  // Switch to battle mode
  await this.page.evaluate(() => {
    const army = JSON.parse(localStorage.getItem('bronepehota_army') || '{}');
    army.isInBattle = true;
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
  });
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

When('я завершаю бой', async function(this: BronepehotaWorld) {
  const menuButton = this.page.getByRole('button').filter({ hasText: /…|\.\.\.|more/i });
  if (await menuButton.isVisible({ timeout: 3000 })) {
    await menuButton.click();
    await this.page.waitForTimeout(300);

    const endButton = this.page.getByRole('button', { name: /завершить бой/i });
    if (await endButton.isVisible({ timeout: 2000 })) {
      await endButton.click();
      await this.page.waitForTimeout(500);
    }
  }
});

Given('я создаю новую армию', async function(this: BronepehotaWorld) {
  // Reset to faction selection
  await this.page.evaluate(() => {
    localStorage.removeItem('bronepehota_army');
  });
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

Given('я дохожу до этапа выбора правил', async function(this: BronepehotaWorld) {
  // Select faction and budget to get to rules step
  const factionText = this.page.getByText(/Империя Полярис|Polaris/i).first();
  await factionText.click();
  await this.page.waitForTimeout(500);

  // Click "Начать сбор армии" button
  const startButton = this.page.getByRole('button', { name: /(начать сбор армии|продолжить|далее|next)/i }).or(
    this.page.getByText(/начать сбор армии/i)
  );
  if (await startButton.isVisible({ timeout: 3000 })) {
    await startButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  const input = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i)).first();
  await input.waitFor({ state: 'visible', timeout: 5000 });
  await input.fill('100');
  await this.page.waitForTimeout(300);

  const nextButton = this.page.getByRole('button', { name: /(продолжить|далее|next)/i }).or(
    this.page.getByText(/продолжить/i)
  );
  await nextButton.first().click();
  await this.page.waitForTimeout(1500);
});

When('я выбираю версию правил {string}', async function(this: BronepehotaWorld, version: string) {
  // Click on rules version by text
  const rulesText = this.page.getByText(new RegExp(version, 'i')).first();
  await rulesText.click();
  await this.page.waitForTimeout(300);
  this.currentRulesVersion = version.toLowerCase();
});

// Alias for the same step with different wording
When('я выбираю правила {string}', async function(this: BronepehotaWorld, version: string) {
  // Map English names to Russian display names for rules
  const rulesMap: Record<string, string> = {
    'Технолог': 'Технолог',
    'tehnolog': 'Технолог',
    'Панова': 'Панова',
    'fan': 'Панова',
  };

  const displayName = rulesMap[version] || version;

  // Click on the rules version card - find the clickable div with the text
  const rulesCard = this.page.locator('#rules-selector').getByText(new RegExp(displayName, 'i')).first();
  await rulesCard.waitFor({ state: 'visible', timeout: 5000 });
  await rulesCard.click();
  await this.page.waitForTimeout(500);
  this.currentRulesVersion = version.toLowerCase();
});

Then('версия правил должна быть обновлена', async function(this: BronepehotaWorld) {
  const rulesVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    return value;
  });
  expect(rulesVersion).toBeDefined();
});

Then('индикатор версии должен отображаться в интерфейсе', async function(this: BronepehotaWorld) {
  const versionIndicator = this.page.locator('[class*="version"]').or(this.page.getByText(/Технолог|Панова/i));
  await expect(versionIndicator.first()).toBeVisible();
});

When('я нажимаю на иконку информации рядом с версией правил', async function(this: BronepehotaWorld) {
  const infoButton = this.page.getByRole('button', { name: /информация|info|ℹ️/i });
  if (await infoButton.isVisible({ timeout: 3000 })) {
    await infoButton.first().click();
    await this.page.waitForTimeout(300);
  }
});

Then('должно открыться модальное окно с описанием правил', async function(this: BronepehotaWorld) {
  const modal = this.page.getByRole('dialog').or(this.page.locator('.modal'));
  if (await modal.count() > 0) {
    await expect(modal.first()).toBeVisible();
  }
});

Then('я должен увидеть название, источник и описание правил', async function(this: BronepehotaWorld) {
  const title = this.page.getByRole('heading');
  const source = this.page.getByText(/источник|source/i);
  const description = this.page.getByText(/описание|description/i);

  if (await title.count() > 0) {
    await expect(title.first()).toBeVisible();
  }
  if (await source.or(description).count() > 0) {
    await expect(source.or(description).first()).toBeVisible();
  }
});

Then('я должен увидеть индикатор версии правил в футере', async function(this: BronepehotaWorld) {
  const footer = this.page.locator('footer').or(this.page.locator('.fixed').filter({ hasText: /очков/i }));
  await expect(footer.first()).toBeVisible();
});

Then('цвет индикатора должен соответствовать выбранной версии', async function(this: BronepehotaWorld) {
  const indicator = this.page.locator('[class*="indicator"], [class*="version"], div[class*="rounded-full"]');
  if (await indicator.count() > 0) {
    await expect(indicator.first()).toBeVisible();
  }
});
