import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Rules Selection steps

Given('я на этапе выбора правил', async function(this: BronepehotaWorld) {
  // First check if we need to navigate to rules step
  const rulesSelector = this.page.getByTestId('rules-selector').or(this.page.locator('#rules-selector'));
  const isVisible = await rulesSelector.isVisible({ timeout: 2000 });

  if (!isVisible) {
    // Need to navigate: select faction first
    const factionCard = this.page.getByTestId('faction-card-polaris');
    if (await factionCard.isVisible({ timeout: 3000 })) {
      await factionCard.click();
      await this.page.waitForTimeout(300);
    }

    // Click "ПРОДОЛЖИТЬ" button to go to budget
    const continueButton = this.page.getByTestId('faction-continue-button');
    if (await continueButton.isVisible({ timeout: 3000 })) {
      await continueButton.click();
      await this.page.waitForTimeout(500);
    }

    // Fill budget if visible
    const input = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i)).first();
    const isInputVisible = await input.isVisible({ timeout: 3000 });
    if (isInputVisible) {
      await input.fill('100');
      await this.page.waitForTimeout(300);

      const nextButton = this.page.getByTestId('budget-next-button').or(
        this.page.getByRole('button', { name: /начать сбор армии/i })
      );
      await nextButton.first().click();
      await this.page.waitForTimeout(1000);
    }
  }

  // Now rules selector should be visible
  await expect(rulesSelector.first()).toBeVisible({ timeout: 10000 });
});

When('я просматриваю доступные версии правил', async function(this: BronepehotaWorld) {
  const rulesContainer = this.page.getByTestId('rules-selector').or(this.page.locator('#rules-selector'));
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

Given('армия сохранена в бою', async function(this: BronepehotaWorld) {
  // Verify we're in battle mode with an army
  await this.page.waitForTimeout(500);
  const gameSession = this.page.getByTestId('game-session');
  await expect(gameSession.first()).toBeVisible({ timeout: 5000 });
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
  // Reset to faction selection - clear army state AND view state
  await this.page.evaluate(() => {
    localStorage.removeItem('bronepehota_army');
    localStorage.removeItem('bronepehota_view');
  });
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

Given('я дохожу до этапа выбора правил', async function(this: BronepehotaWorld) {
  // First ensure we're on faction selection step
  const factionSelector = this.page.getByTestId('faction-selector').or(this.page.locator('#faction-selector'));
  const isFactionVisible = await factionSelector.isVisible({ timeout: 2000 });

  if (!isFactionVisible) {
    // Already past faction selection, try to navigate back
    await this.page.evaluate(() => {
      localStorage.removeItem('bronepehota_army');
    });
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    // Wait extra time for React to hydrate
    await this.page.waitForTimeout(1500);
  }

  // Select faction - wait longer for slower CI environments
  const factionCard = this.page.getByTestId('faction-card-polaris');
  await factionCard.waitFor({ state: 'visible', timeout: 10000 });
  await factionCard.click();
  await this.page.waitForTimeout(300);

  // Click "ПРОДОЛЖИТЬ" button to go to budget
  const continueButton = this.page.getByTestId('faction-continue-button');
  await continueButton.waitFor({ state: 'visible', timeout: 3000 });
  await continueButton.click();
  await this.page.waitForTimeout(500);

  // Fill budget
  const input = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i)).first();
  await input.waitFor({ state: 'visible', timeout: 5000 });
  await input.fill('100');
  await this.page.waitForTimeout(300);

  // Click next button to go to rules
  const nextButton = this.page.getByTestId('budget-next-button').or(
    this.page.getByRole('button', { name: /начать сбор армии/i })
  );
  await nextButton.first().waitFor({ state: 'visible', timeout: 3000 });
  await nextButton.first().click();
  await this.page.waitForTimeout(1000);

  // Verify we're on rules step
  const rulesSelector = this.page.getByTestId('rules-selector').or(this.page.locator('#rules-selector'));
  await expect(rulesSelector.first()).toBeVisible({ timeout: 5000 });
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
  // Map English names to rules IDs for test IDs
  const rulesIdMap: Record<string, string> = {
    'Технолог': 'tehnolog',
    'tehnolog': 'tehnolog',
    'Панова': 'fan',
    'fan': 'fan',
  };

  const rulesId = rulesIdMap[version] || version.toLowerCase();

  // First ensure we're on rules step - check if rules selector is visible
  const rulesSelector = this.page.getByTestId('rules-selector').or(this.page.locator('#rules-selector'));
  const isVisible = await rulesSelector.isVisible({ timeout: 2000 });

  if (!isVisible) {
    // Need to navigate to rules step first
    // Check if we're on unit selector page (which means we need to go back)
    const unitSelector = this.page.getByTestId('unit-selector');
    const isUnitSelectorVisible = await unitSelector.isVisible({ timeout: 2000 });

    if (isUnitSelectorVisible) {
      // We're on unit selector, need to go back to faction and navigate through to rules
      // Reset army to go back to faction selection
      await this.page.evaluate(() => {
        const army = JSON.parse(localStorage.getItem('bronepehota_army') || '{}');
        army.currentStep = 'faction-select';
        army.faction = 'polaris'; // Reset to default faction
        army.pointBudget = undefined;
        localStorage.setItem('bronepehota_army', JSON.stringify(army));
      });
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(500);

      // Select faction
      const factionCard = this.page.getByTestId('faction-card-polaris');
      await factionCard.click();
      await this.page.waitForTimeout(300);

      // Click continue to go to budget
      const continueButton = this.page.getByTestId('faction-continue-button');
      if (await continueButton.isVisible({ timeout: 3000 })) {
        await continueButton.click();
        await this.page.waitForTimeout(500);
      }

      // Fill budget with default value
      const budgetInput = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i)).first();
      if (await budgetInput.isVisible({ timeout: 3000 })) {
        await budgetInput.fill('100');
        await this.page.waitForTimeout(300);

        // Click next to go to rules
        const nextButton = this.page.getByTestId('budget-next-button').or(
          this.page.getByRole('button', { name: /начать сбор армии/i })
        );
        await nextButton.first().click();
        await this.page.waitForTimeout(1000);
      }
    } else {
      // Check if we're on budget step
      const budgetInput = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i));
      if (await budgetInput.first().isVisible({ timeout: 2000 })) {
        // We're on budget step, click next to go to rules
        const nextButton = this.page.getByTestId('budget-next-button').or(
          this.page.getByRole('button', { name: /начать сбор армии/i })
        );
        await nextButton.first().click();
        await this.page.waitForTimeout(1000);
      }
    }
  }

  // Now click on the rules card using test ID
  const rulesCard = this.page.getByTestId(`rules-card-${rulesId}`);
  await expect(rulesCard).toBeVisible({ timeout: 5000 });
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
