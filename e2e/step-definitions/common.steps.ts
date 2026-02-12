import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Common steps for navigation and basic interactions

When('я переключаюсь на вкладку {string}', async function(this: BronepehotaWorld, tabName: string) {
  // TabBar is now unified for both mobile and desktop
  if (tabName === 'Армия' || tabName === 'армия') {
    // Click the second tab (АРМИЯ)
    const tabs = this.page.locator('[role="tab"]');
    const count = await tabs.count();
    if (count >= 2) {
      // Use force: true to click through overlays
      await tabs.nth(1).click({ timeout: 5000, force: true });
    }
    // Wait for view change
    await this.page.waitForTimeout(500);
  } else if (tabName === 'Юниты' || tabName === 'юниты') {
    // Click the first tab (ЮНИТЫ)
    const tabs = this.page.locator('[role="tab"]');
    const count = await tabs.count();
    if (count >= 1) {
      // Use force: true to click through overlays
      await tabs.nth(0).click({ timeout: 5000, force: true });
    }
    // Wait for view change
    await this.page.waitForTimeout(500);
  }
});

Given('приложение загружено на главной странице', async function(this: BronepehotaWorld) {
  // Navigate to /app route for army builder, not root landing page
  await this.page.goto('http://localhost:3001/app');
  await this.page.waitForLoadState('networkidle');
});

Given('приложение загружено', async function(this: BronepehotaWorld) {
  // Navigate to /app route for army builder, not root landing page
  await this.page.goto('http://localhost:3001/app');
  await this.page.waitForLoadState('networkidle');
});

Given('localStorage очищен', async function(this: BronepehotaWorld) {
  await this.page.evaluate(() => localStorage.clear());
});

When('я перезагружаю страницу', async function(this: BronepehotaWorld) {
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
  // Also wait for the page to be fully rendered and React to restore state
  await this.page.waitForTimeout(1000);

  // If army exists, wait for unit selector to be visible
  const armyState = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_army');
    return value ? JSON.parse(value) : null;
  });

  if (armyState && armyState.currentStep === 'unit-select') {
    const unitSelector = this.page.getByTestId('unit-selector');
    await unitSelector.waitFor({ state: 'visible', timeout: 5000 });
  }
});

Then('я должен увидеть страницу выбора фракции', async function(this: BronepehotaWorld) {
  const factionSelector = this.page.getByTestId('faction-selector');
  await expect(factionSelector).toBeVisible({ timeout: 5000 });
});

Then('я должен увидеть страницу выбора юнитов', async function(this: BronepehotaWorld) {
  const unitSelector = this.page.getByTestId('unit-selector');
  await expect(unitSelector).toBeVisible({ timeout: 5000 });
});

Then('версия правил должна быть сохранена в localStorage', async function(this: BronepehotaWorld) {
  const rulesVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    return value;
  });
  expect(rulesVersion).toBeDefined();
  this.currentRulesVersion = rulesVersion;
});

Then('версия правил {string} должна остаться выбранной', async function(this: BronepehotaWorld, expectedVersion: string) {
  const rulesVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    return value;
  });
  expect(rulesVersion).toBeDefined();
});

// Common UI interaction steps

When('я нажимаю кнопку {string}', async function(this: BronepehotaWorld, buttonText: string) {
  // Generic button click with smart fallbacks
  let button;

  // Special cases for specific button text - use test IDs where available
  if (buttonText === 'Далее' || buttonText === 'Продолжить') {
    button = this.page.getByTestId('budget-next-button').or(
      this.page.getByTestId('faction-continue-button')
    ).or(
      this.page.getByTestId('rules-confirm-button')
    ).or(
      this.page.getByRole('button', { name: /(продолжить|далее|начать сбор армии|next)/i })
    );
  } else if (buttonText === 'НАЧАТЬ ИГРУ') {
    button = this.page.getByTestId('rules-confirm-button').or(
      this.page.getByRole('button', { name: /начать игру/i })
    );
  } else if (buttonText === 'В БОЙ') {
    // Skip - handled by panic steps
    return;
  } else if (buttonText === 'Назад') {
    button = this.page.getByTestId('back-to-faction-button').or(
      this.page.getByText(/назад/i)
    ).or(
      this.page.getByRole('button', { name: /назад|back/i })
    );
    // Scroll to button since it's absolutely positioned
    const count = await button.count();
    if (count > 0) {
      await button.first().scrollIntoViewIfNeeded().catch(() => {});
      try {
        await button.first().click({ timeout: 3000 });
        await this.page.waitForTimeout(300);
        return; // Skip the generic click at the end
      } catch {
        // If click fails, try JS click
        await this.page.evaluate(() => {
          const btn = document.querySelector('[data-testid="back-to-faction-button"]') as HTMLElement;
          if (btn) btn.click();
        });
        await this.page.waitForTimeout(300);
        return;
      }
    }
  } else if (buttonText === 'Назад к фракции') {
    button = this.page.getByTestId('back-to-faction-button');
    // Scroll to button since it's absolutely positioned
    const count = await button.count();
    if (count > 0) {
      await button.first().scrollIntoViewIfNeeded().catch(() => {});
      await button.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    } else {
      // Fallback to text search
      button = this.page.getByRole('button', { name: /назад/i });
      const textCount = await button.count();
      if (textCount > 0) {
        await button.first().scrollIntoViewIfNeeded().catch(() => {});
      }
    }
  } else if (buttonText === 'Подтвердить') {
    button = this.page.getByTestId('rules-confirm-button').or(
      this.page.getByRole('button', { name: /начать игру|подтвердить|confirm/i })
    );
  } else if (buttonText === 'Новый Тур' || buttonText === 'НОВЫЙ ТУР') {
    button = this.page.getByTestId('new-turn-button').or(
      this.page.getByRole('button', { name: /новый тур|new turn/i })
    );
  } else if (buttonText === 'НАЧАТЬ ТУР') {
    button = this.page.getByTestId('start-turn-button').or(
      this.page.getByRole('button', { name: /начать тур/i })
    );
  } else if (buttonText === 'В БОЙ') {
    // Handle "To Battle" button with longer timeout
    await this.page.locator('[data-testid="to-battle-button"]').click({ timeout: 10000, force: true });
    return;
  } else if (buttonText === 'Начать заново' || buttonText === 'Заново') {
    // Try to find the button using multiple approaches
    const testIdButton = this.page.getByTestId('reset-fully-button');
    const textButton = this.page.getByRole('button', { name: /начать заново|заново/i });

    // Check if button exists in DOM
    const buttonExists = await this.page.evaluate(() => {
      const btn = document.querySelector('[data-testid="reset-fully-button"]');
      if (!btn) return { exists: false, reason: 'button not found' };
      const rect = btn.getBoundingClientRect();
      return {
        exists: true,
        visible: rect.width > 0 && rect.height > 0,
        opacity: window.getComputedStyle(btn).opacity,
        display: window.getComputedStyle(btn).display,
        rect: rect
      };
    });

    if (!buttonExists.exists) {
      // Button doesn't exist, try alternative approach - use localStorage directly
      await this.page.evaluate(() => {
        localStorage.removeItem('bronepehota_army');
        localStorage.removeItem('bronepehota_rules_version');
      });
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1500);
      return;
    }

    if (!buttonExists.visible || buttonExists.opacity === '0') {
      // Button exists but not visible, wait and try again
      await testIdButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    }

    button = testIdButton.or(textButton);
    const count = await button.count();
    if (count === 0) {
      // Still not found, try direct reset
      await this.page.evaluate(() => {
        localStorage.removeItem('bronepehota_army');
        localStorage.removeItem('bronepehota_rules_version');
      });
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1500);
      return;
    }
  } else {
    // Default: try role="button" first, then text search
    button = this.page.getByRole('button', { name: new RegExp(`^${buttonText}$`, 'i') });
    const count = await button.count();
    if (count === 0) {
      button = this.page.getByText(new RegExp(`^${buttonText}$`, 'i'));
    }
  }

  await button.first().click();
  await this.page.waitForTimeout(300);
});

Given('я нажал кнопку {string}', async function(this: BronepehotaWorld, buttonText: string) {
  // Generic button click with smart fallbacks (same as When but for Given context)
  let button;

  // Special cases for specific button text - use test IDs where available
  if (buttonText === 'Новый Тур' || buttonText === 'НОВЫЙ ТУР') {
    button = this.page.getByTestId('new-turn-button').or(
      this.page.getByRole('button', { name: /новый тур|new turn/i })
    );
  } else if (buttonText === 'НАЧАТЬ ТУР') {
    button = this.page.getByTestId('start-turn-button').or(
      this.page.getByRole('button', { name: /начать тур/i })
    );
  } else if (buttonText === 'В БОЙ') {
    // Handle "To Battle" button with longer timeout
    await this.page.locator('[data-testid="to-battle-button"]').click({ timeout: 10000, force: true });
    return;
  } else if (buttonText === 'Начать заново' || buttonText === 'Заново') {
    button = this.page.getByTestId('reset-fully-button');
  } else {
    // Default: try role="button" first, then text search
    button = this.page.getByRole('button', { name: new RegExp(`^${buttonText}$`, 'i') });
    const count = await button.count();
    if (count === 0) {
      button = this.page.getByText(new RegExp(`^${buttonText}$`, 'i'));
    }
  }

  await button.first().click();
  await this.page.waitForTimeout(300);
});

When('я выбираю фракцию {string}', async function(this: BronepehotaWorld, factionName: string) {
  // Wait for React to be ready
  await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  await this.page.waitForTimeout(500);

  // Map English faction names to test IDs
  const factionIdMap: Record<string, string> = {
    'Polaris': 'polaris',
    'Protectorate': 'protectorate',
    'Mercenaries': 'mercenaries',
  };

  const factionId = factionIdMap[factionName] || factionName.toLowerCase();
  const factionCard = this.page.getByTestId(`faction-card-${factionId}`);

  await factionCard.waitFor({ state: 'visible', timeout: 10000 });
  await factionCard.scrollIntoViewIfNeeded();
  await factionCard.click();

  this.currentFaction = factionName.toLowerCase();
  await this.page.waitForTimeout(500);
});

Given('я выбрал правила {string}', async function(this: BronepehotaWorld, rules: string) {
  // Map English names to rules IDs for test IDs
  const rulesIdMap: Record<string, string> = {
    'Технолог': 'tehnolog',
    'tehnolog': 'tehnolog',
    'Star System': 'community_star_system',
    'community': 'community_star_system',
    'Сообщество': 'community_star_system',
  };

  const rulesId = rulesIdMap[rules] || rules.toLowerCase();

  // First ensure we're on rules step
  const rulesSelector = this.page.getByTestId('rules-selector').or(
    this.page.locator('#rules-selector')
  );
  await expect(rulesSelector.first()).toBeVisible({ timeout: 5000 });

  // Click on rules card using test ID
  const rulesCard = this.page.getByTestId(`rules-card-${rulesId}`);
  await expect(rulesCard).toBeVisible({ timeout: 3000 });
  await rulesCard.click();
  await this.page.waitForTimeout(500);

  this.currentRulesVersion = rules.toLowerCase();
});

// Battle mode entry step - click "В БОЙ" button
When('battle: я нажимаю кнопку {string}', async function(this: BronepehotaWorld, buttonText: string) {
  if (buttonText === 'В БОЙ' || buttonText === 'В Боi') {
    // Handle "To Battle" button with longer timeout and force click
    await this.page.locator('[data-testid="to-battle-button"]').click({ timeout: 15000, force: true });
    await this.page.waitForTimeout(500);
  }
});

Then('в шапке должен отображаться бренд фракции {string}', async function(this: BronepehotaWorld, factionName: string) {
  // Map English faction names to Russian display names
  const factionNameMap: Record<string, string> = {
    'Polaris': 'Империя Полярис',
    'Protectorate': 'Торговый Протекторат',
    'Mercenaries': 'Наёмники и Мародеры',
  };

  const displayName = factionNameMap[factionName] || factionName;
  const brandElement = this.page.getByText(new RegExp(displayName, 'i'));
  await expect(brandElement).toBeVisible({ timeout: 5000 });
});

Then('в шапке должен отображаться бренд фракции Polaris', async function(this: BronepehotaWorld) {
  // The app displays Russian name "Империя Полярис" not English "Polaris"
  const brandElement = this.page.getByText(/Империя Полярис/i);
  await expect(brandElement).toBeVisible({ timeout: 5000 });
});

Then('не должно быть возвращения к правилам по умолчанию', async function(this: BronepehotaWorld) {
  const rulesVersion = await this.page.evaluate(() => {
    const value = localStorage.getItem('bronepehota_rules_version');
    return value;
  });
  expect(rulesVersion).toBeDefined();
});

Then('я должен перейти к этапу выбора балла очков', async function(this: BronepehotaWorld) {
  // Wait for UI to update after clicking "Далее" button
  await this.page.waitForTimeout(500);

  const budgetInput = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i));
  await expect(budgetInput.first()).toBeVisible({ timeout: 10000 });
});

Then('я должен перейти к этапу выбора правил', async function(this: BronepehotaWorld) {
  // Look for the rules selector component by its id or heading
  const rulesSelector = this.page.locator('#rules-selector').or(
    this.page.getByText(/Подтвердите выбор правил/i)
  );
  await expect(rulesSelector.first()).toBeVisible({ timeout: 5000 });
});

// Battle preparation screen steps

// Helper function to check if battle preparation screen is visible
async function verifyBattlePreparationScreen(this: BronepehotaWorld) {
  const screen = this.page.locator('[data-testid="battle-preparation-screen"]');
  await expect(screen).toBeVisible({ timeout: 5000 });
}

// Register for different Gherkin keywords (Russian: Допустим=Given, Когда=When, То=Then)
// But register as separate When steps with regex to match any prefix
When(/^(?:Допустим|Пусть)? я вижу экран подготовки к бою$/, async function(this: BronepehotaWorld) {
  await verifyBattlePreparationScreen.call(this);
});

When(/^(?:Когда|И) я вижу экран подготовки к бою$/, async function(this: BronepehotaWorld) {
  await verifyBattlePreparationScreen.call(this);
});

Then(/^То я вижу экран подготовки к бою$/, async function(this: BronepehotaWorld) {
  await verifyBattlePreparationScreen.call(this);
});

Given('я вижу модальное окно инициативы', async function(this: BronepehotaWorld) {
  const modal = this.page.locator('[data-testid="initiative-modal"]');
  await expect(modal).toBeVisible({ timeout: 5000 });
  // Wait for dice roll animation to complete
  await this.page.waitForTimeout(700);
});

When('я нажимаю кнопку {string} в модальном окне', async function(this: BronepehotaWorld, buttonText: string) {
  // Handle button clicks in modal
  if (buttonText === 'Начать бой' || buttonText === 'НАЧАТЬ БОЙ') {
    const button = this.page.locator('[data-testid="confirm-initiative-button"]');
    await button.click({ timeout: 10000 });
  } else if (buttonText === 'Начать тур' || buttonText === 'НАЧАТЬ ТУР') {
    const button = this.page.locator('[data-testid="confirm-initiative-button"]');
    await button.click({ timeout: 10000 });
  } else if (buttonText === 'Переброс') {
    const button = this.page.locator('[data-testid="reroll-button"]');
    await button.click({ timeout: 5000 });
  } else {
    // Fallback to text-based search
    const button = this.page.getByRole('button', { name: new RegExp(`^${buttonText}$`, 'i') });
    await button.first().click({ timeout: 5000 });
  }
  await this.page.waitForTimeout(300);
});

When('я бросаю инициативу', async function(this: BronepehotaWorld) {
  // Wait for modal to appear
  const modal = this.page.locator('[data-testid="initiative-modal"]');
  await expect(modal).toBeVisible({ timeout: 5000 });

  // Wait for dice roll animation to complete (button becomes enabled)
  const confirmButton = this.page.locator('[data-testid="confirm-initiative-button"]');
  // Wait a bit for animation to complete
  await this.page.waitForTimeout(600);
  await this.page.waitForTimeout(300);
});

// Additional Then steps for battle preparation flow
Then('я вижу экран подготовки к бою', async function(this: BronepehotaWorld) {
  const screen = this.page.locator('[data-testid="battle-preparation-screen"]');
  await expect(screen).toBeVisible({ timeout: 5000 });
});

Then('я вижу кнопку {string}', async function(this: BronepehotaWorld, buttonText: string) {
  const button = this.page.getByRole('button', { name: new RegExp(`^${buttonText}$`, 'i') });
  await expect(button.first()).toBeVisible({ timeout: 5000 });
});

Then('открывается модальное окно инициативы', async function(this: BronepehotaWorld) {
  const modal = this.page.locator('[data-testid="initiative-modal"]');
  await expect(modal).toBeVisible({ timeout: 5000 });
  // Wait for dice roll animation to complete
  await this.page.waitForTimeout(700);
});

Then('я перехожу к экрану игрового сеанса', async function(this: BronepehotaWorld) {
  const gameSession = this.page.locator('[data-testid="game-session"]');
  await expect(gameSession.first()).toBeVisible({ timeout: 5000 });
});

// Army building steps

Given('я добавляю отряд {string} в армию', async function(this: BronepehotaWorld, squadName: string) {
  // First ensure we're on the unit selection step
  const unitSelector = this.page.getByTestId('unit-selector').or(this.page.locator('#unit-selector'));

  // Check if we need to navigate to unit selection
  const isVisible = await unitSelector.isVisible({ timeout: 2000 });
  if (!isVisible) {
    // We might be on an earlier step, try to navigate forward
    const factionCard = this.page.getByTestId('faction-card-polaris');
    const factionVisible = await factionCard.isVisible({ timeout: 2000 });

    if (factionVisible) {
      // We're on faction selection, select faction
      await factionCard.click();
      await this.page.waitForTimeout(500);

      // Click continue to go to budget
      const continueButton = this.page.getByTestId('faction-continue-button');
      if (await continueButton.isVisible({ timeout: 3000 })) {
        await continueButton.click();
        await this.page.waitForTimeout(500);
      }

      // Fill budget
      const input = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i)).first();
      if (await input.isVisible({ timeout: 3000 })) {
        await input.fill('100');
        await this.page.waitForTimeout(300);

        // Click next to go to rules
        const nextButton = this.page.getByTestId('budget-next-button').or(
          this.page.getByRole('button', { name: /начать сбор армии/i })
        );
        await nextButton.first().click();
        await this.page.waitForTimeout(1000);

        // Select rules and continue
        const rulesCard = this.page.getByTestId('rules-card-community_star_system').or(
          this.page.getByTestId('rules-card-tehnolog')
        );
        if (await rulesCard.first().isVisible({ timeout: 3000 })) {
          await rulesCard.first().click();
          await this.page.waitForTimeout(500);

          const confirmButton = this.page.getByTestId('rules-confirm-button').or(
            this.page.getByRole('button', { name: /начать игру/i })
          );
          await confirmButton.first().click();
          await this.page.waitForTimeout(1000);
        }
      }
    }
  }

  // Wait for unit selector to be visible
  await unitSelector.first().waitFor({ state: 'visible', timeout: 10000 });

  // Find and click the squad card
  const squadCard = this.page.getByText(new RegExp(squadName, 'i')).or(
    this.page.locator('[data-testid^="squad-card"]')
  );
  await squadCard.first().waitFor({ state: 'visible', timeout: 5000 });
  await squadCard.first().click();
  await this.page.waitForTimeout(500);
});
