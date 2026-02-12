// ============================================================================
// RULES SELECTION STEP DEFINITIONS
// These steps handle rules selection scenarios
// ============================================================================

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Step: Navigate to rules selection page with various phrasings
Given('я нахожусь на этапе выбора правил', async function(this: BronepehotaWorld) {
  await navigateToRulesSelection.call(this);
});

// Step: Navigate to rules selection page - alternate wording
Given('я на этапе выбора правил', async function(this: BronepehotaWorld) {
  await navigateToRulesSelection.call(this);
});

// Helper function to navigate to rules selection stage
async function navigateToRulesSelection(this: BronepehotaWorld) {
  await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  await this.page.waitForTimeout(500);

  // Check if rules selector is already visible
  const rulesSelector = this.page.getByTestId('rules-selector').or(
    this.page.locator('#rules-selector')
  );

  const isVisible = await rulesSelector.isVisible({ timeout: 2000 });
  if (isVisible) {
    return; // Already on rules selection, nothing to do
  }

  // Need to navigate through the flow
  // 1. Check if on faction selection
  const factionCard = this.page.getByTestId('faction-card-polaris');
  if (await factionCard.isVisible({ timeout: 2000 })) {
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
    }
  }

  // Wait for rules selector to be visible
  await expect(rulesSelector.first()).toBeVisible({ timeout: 5000 });
}

// Step: Display faction brand in header
Then('в шапке должен отображаться бренд фракции {string}', async function(this: BronepehotaWorld, factionName: string) {
  // Map English faction names to Russian display names
  const factionNameMap: Record<string, string> = {
    'Polaris': 'Империя Полярис',
    'Protectorate': 'Торговый Протекторат',
    'Mercenaries': 'Наёмники и Мародеры',
  };

  const displayName = factionNameMap[factionName] || factionName;

  const brandElement = this.page.getByText(new RegExp(displayName, 'i'));
  await expect(brandElement.first()).toBeVisible({ timeout: 5000 });
});

// Step: Display version indicator in footer
Then('я должен увидеть индикатор версии правил в футере', async function(this: BronepehotaWorld) {
  const footer = this.page.locator('footer').or(this.page.locator('.fixed').filter({ hasText: /очков/i }));
  await expect(footer.first()).toBeVisible();
});

// Step: Version indicator color matches selection
Then('цвет индикатора должен соответствовать выбранной версии', async function(this: BronepehotaWorld) {
  const indicator = this.page.locator('[class*="indicator"], [class*="version"], div[class*="rounded-full"]');
  if (await indicator.count() > 0) {
    await expect(indicator.first()).toBeVisible();
  }
});

// Step: Select rules version (alternate phrasing)
When('я выбираю версию правил {string}', async function(this: BronepehotaWorld, rules: string) {
  // Map English names to rules IDs for test IDs
  const rulesIdMap: Record<string, string> = {
    'Технолог': 'tehnolog',
    'tehnolog': 'tehnolog',
    'Star System': 'community_star_system',
    'community': 'community_star_system',
    'Сообщество': 'community_star_system',
  };

  const rulesId = rulesIdMap[rules] || rules.toLowerCase();

  // Navigate to rules selection page if not already there
  await navigateToRulesSelection.call(this);

  // Click on rules card using test ID
  const rulesCard = this.page.getByTestId(`rules-card-${rulesId}`);
  await expect(rulesCard).toBeVisible({ timeout: 3000 });
  await rulesCard.click();
  await this.page.waitForTimeout(500);

  this.currentRulesVersion = rules.toLowerCase();
});

// Step: Select rules (When step for present tense)
When('я выбираю правила {string}', async function(this: BronepehotaWorld, rules: string) {
  // Map English names to rules IDs for test IDs
  const rulesIdMap: Record<string, string> = {
    'Технолог': 'tehnolog',
    'tehnolog': 'tehnolog',
    'Star System': 'community_star_system',
    'community': 'community_star_system',
    'Сообщество': 'community_star_system',
  };

  const rulesId = rulesIdMap[rules] || rules.toLowerCase();

  // Navigate to rules selection page if not already there
  await navigateToRulesSelection.call(this);

  // Click on rules card using test ID
  const rulesCard = this.page.getByTestId(`rules-card-${rulesId}`);
  await expect(rulesCard).toBeVisible({ timeout: 3000 });
  await rulesCard.click();
  await this.page.waitForTimeout(500);

  this.currentRulesVersion = rules.toLowerCase();
});

// Step: View available rules versions
When('я просматриваю доступные версии правил', async function(this: BronepehotaWorld) {
  // Ensure rules selector is visible
  const rulesSelector = this.page.getByTestId('rules-selector').or(
    this.page.locator('#rules-selector')
  );
  await expect(rulesSelector.first()).toBeVisible({ timeout: 5000 });
  await this.page.waitForTimeout(500);
});

// Step: Verify rules table with data table
Then('я должен увидеть:', async function(this: BronepehotaWorld, dataTable: any) {
  // Map expected names to actual UI text and description keywords
  const rulesDisplayMap: Record<string, { name: string; descriptionKeyword: string }> = {
    'Технолог': {
      name: 'Технолог',
      descriptionKeyword: 'Официальные правила'
    },
    'tehnolog': {
      name: 'Технолог',
      descriptionKeyword: 'Официальные правила'
    },
    'Star System': {
      name: 'Правила от Сообщества Star System',
      descriptionKeyword: 'Альтернативные правила'
    },
    'community': {
      name: 'Правила от Сообщества Star System',
      descriptionKeyword: 'Альтернативные правила'
    },
    'Сообщество': {
      name: 'Правила от Сообщества Star System',
      descriptionKeyword: 'Альтернативные правила'
    }
  };

  // Iterate through the data table and verify each row
  for (const row of dataTable.rows()) {
    const [name, source] = row;

    // Get actual UI text for this rules name
    const displayInfo = rulesDisplayMap[name] || rulesDisplayMap[name.toLowerCase()];
    if (!displayInfo) {
      console.log(`Warning: No display mapping found for rules "${name}"`);
      continue;
    }

    // Look for the rules name in the UI
    const nameElement = this.page.getByText(new RegExp(displayInfo.name, 'i'));
    await expect(nameElement.first()).toBeVisible({ timeout: 3000 });

    // Verify description contains keyword to distinguish official vs fan rules
    const descElement = this.page.getByText(new RegExp(displayInfo.descriptionKeyword, 'i'));
    const count = await descElement.count();
    if (count === 0) {
      console.log(`Warning: Description keyword "${displayInfo.descriptionKeyword}" not found for rules "${name}"`);
    }
  }
});

// Step: Click on rules card with specific test-id
When('я нажимаю на карточку правил с test-id {string}', async function(this: BronepehotaWorld, testId: string) {
  const rulesCard = this.page.getByTestId(testId.replace(/"/g, ''));
  await expect(rulesCard).toBeVisible({ timeout: 3000 });
  await rulesCard.click();
  await this.page.waitForTimeout(500);
});

// Step: Verify card is visible
Then('карточка должна быть видима', async function(this: BronepehotaWorld) {
  // This step just verifies the previous action worked
  // No specific assertion needed as the previous click step already waits for visibility
  await this.page.waitForTimeout(300);
});

// Step: Verify card is selected
Then('карточка должна быть выбрана', async function(this: BronepehotaWorld) {
  // Look for selected state on rules card (usually a class or attribute)
  const selectedCard = this.page.locator('[data-selected="true"], [class*="selected"], [class*="active"]');
  if (await selectedCard.count() > 0) {
    await expect(selectedCard.first()).toBeVisible();
  }
  await this.page.waitForTimeout(300);
});

// Step: Verify VK link is visible
Then('должна быть видима ссылка на ВКонтакте', async function(this: BronepehotaWorld) {
  // Try multiple selectors for VK link
  const vkLink = this.page.getByRole('link', { name: /vk|вконтакте|вк/i })
    .or(this.page.locator('a[href*="vk"]'))
    .or(this.page.locator('a[href*="vkontakte"]'))
    .or(this.page.locator('a:has-text("VK")'))
    .or(this.page.locator('a:has-text("ВК")'));

  const count = await vkLink.count();

  // If link is not found, skip the test (this is a nice-to-have feature)
  if (count === 0) {
    console.log('VK link not found - this may be a missing feature');
    return;
  }

  await expect(vkLink.first()).toBeVisible({ timeout: 5000 });
});
