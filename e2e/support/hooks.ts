import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BronepehotaWorld } from './world';

// Share browser instance between scenarios
let browser: Browser;
let context: BrowserContext;
let page: Page;

BeforeAll(async () => {
  // Launch browser once for all tests - always headless for E2E tests
  browser = await chromium.launch({
    headless: true,
    slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
  });
});

AfterAll(async () => {
  // Close browser after all tests
  await browser.close();
});

Before(async function(this: BronepehotaWorld) {
  // Create new context and page for each scenario
  context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // Mobile first - iPhone X dimensions
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  });

  page = await context.newPage();
  this.page = page;
  this.browser = browser;
  this.context = context;
  this.currentFaction = null;
  this.currentRulesVersion = null;
  this.armyState = null;

  // Go to home page first to enable localStorage access
  await page.goto('http://localhost:3000').catch(() => {});
  // Clear localStorage at the start of each scenario
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore if localStorage is not available
    }
  });
});

After(async function(this: BronepehotaWorld, scenario) {
  // Take screenshot on failure
  if (scenario.result?.status === 'FAILED') {
    const screenshotName = `${scenario.pickle.name.replace(/[^a-z0-9]/gi, '_')}.png`;
    await this.page.screenshot({
      path: `e2e/screenshots/${screenshotName}`,
      fullPage: true,
    });
  }

  // Close context and page after each scenario
  await context.close();
});
