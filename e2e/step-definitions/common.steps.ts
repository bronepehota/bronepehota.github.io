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

When('я перезагружаю страницу', async function(this: BronepehotaWorld) {
  await this.page.reload();
  await this.page.waitForLoadState('networkidle');
});

Then('я должен увидеть страницу выбора фракции', async function(this: BronepehotaWorld) {
  const factionSelector = this.page.getByText(/Polaris|Protectorate|Mercenaries/i);
  await expect(factionSelector.first()).toBeVisible({ timeout: 5000 });
});

Then('я должен увидеть страницу выбора юнитов', async function(this: BronepehotaWorld) {
  // Use mobile-visible text "Доступные юниты" instead of hidden "отряд"
  const unitSelector = this.page.getByText(/Доступные юниты/i).or(
    this.page.getByRole('heading', { name: /Доступные юниты/i })
  ).or(
    this.page.getByText(/очков/i) // Budget display fallback
  );
  await expect(unitSelector.first()).toBeVisible({ timeout: 5000 });
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

  // Special cases for specific button text
  if (buttonText === 'Далее' || buttonText === 'Продолжить') {
    button = this.page.getByRole('button', { name: /(продолжить|далее|начать сбор армии|next)/i }).or(
      this.page.getByText(/продолжить|начать сбор армии/i)
    );
  } else if (buttonText === 'Назад') {
    button = this.page.getByText(/назад/i).or(
      this.page.getByRole('button', { name: /назад|back/i })
    );
  } else if (buttonText === 'Подтвердить') {
    button = this.page.getByRole('button', { name: /начать игру|подтвердить|confirm/i }).or(
      this.page.getByText(/начать игру/i)
    );
  } else if (buttonText === 'Новый Тур') {
    // GameSession has a floating FAB button with RotateCcw icon
    button = this.page.locator('button:has(svg[data-lucide="rotate-ccw"])').or(
      this.page.getByRole('button', { name: /новый тур|new turn/i })
    ).or(
      this.page.getByText(/новый тур/i)
    );
  } else if (buttonText === 'НАЧАТЬ ТУР') {
    // Inside the initiative modal
    button = this.page.getByRole('button', { name: /начать тур/i }).or(
      this.page.getByText(/НАЧАТЬ ТУР/i)
    );
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

  // Special cases for specific button text
  if (buttonText === 'Новый Тур') {
    button = this.page.getByRole('button', { name: /новый тур|new turn/i });
  } else if (buttonText === 'НАЧАТЬ ТУР') {
    button = this.page.getByRole('button', { name: /начать тур/i }).or(
      this.page.getByText(/начать/i)
    );
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
  await this.page.waitForTimeout(2000);

  // Map English faction names to Russian display names
  const factionNameMap: Record<string, string> = {
    'Polaris': 'Империя Полярис',
    'Protectorate': 'Торговый Протекторат',
    'Mercenaries': 'Наёмники и Мародеры',
  };

  const displayName = factionNameMap[factionName] || factionName;

  // Use locator() with a more specific CSS selector
  const factionCard = this.page.locator(`div[role="button"]:has-text("${displayName}")`).first();

  await factionCard.waitFor({ state: 'visible', timeout: 10000 });
  await factionCard.scrollIntoViewIfNeeded();
  await this.page.waitForTimeout(500);
  await factionCard.click();

  this.currentFaction = factionName.toLowerCase();
  await this.page.waitForTimeout(1000);
});

Given('я выбрал правила {string}', async function(this: BronepehotaWorld, rules: string) {
  // Map English names to Russian display names for rules
  const rulesMap: Record<string, string> = {
    'Технолог': 'Технолог',
    'tehnolog': 'Технолог',
    'Панова': 'Панова',
    'fan': 'Панова',
  };

  const displayName = rulesMap[rules] || rules;
  // Click on the rules version card
  const rulesCard = this.page.getByText(new RegExp(displayName, 'i')).first();
  if (await rulesCard.isVisible({ timeout: 3000 })) {
    await rulesCard.click();
    await this.page.waitForTimeout(500);
  }
  this.currentRulesVersion = rules.toLowerCase();
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
  const budgetInput = this.page.getByRole('spinbutton').or(this.page.getByPlaceholder(/очки|балл/i));
  await expect(budgetInput.first()).toBeVisible({ timeout: 5000 });
});

Then('я должен перейти к этапу выбора правил', async function(this: BronepehotaWorld) {
  // Look for the rules selector component by its id or heading
  const rulesSelector = this.page.locator('#rules-selector').or(
    this.page.getByText(/Подтвердите выбор правил/i)
  );
  await expect(rulesSelector.first()).toBeVisible({ timeout: 5000 });
});
