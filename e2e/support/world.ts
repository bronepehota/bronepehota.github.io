import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Page, Browser, BrowserContext } from 'playwright';

export interface BronepehotaWorld {
  page: Page;
  browser: Browser;
  context: BrowserContext;
  // App-specific state
  currentFaction: string | null;
  currentRulesVersion: string | null;
  armyState: any;
  // Helper methods
  gotoHome: () => Promise<void>;
  clearLocalStorage: () => Promise<void>;
  getFromLocalStorage: (key: string) => Promise<any>;
  setInLocalStorage: (key: string, value: any) => Promise<void>;
}

class CustomWorld implements World, BronepehotaWorld {
  page!: Page;
  browser!: Browser;
  context!: BrowserContext;
  currentFaction: string | null = null;
  currentRulesVersion: string | null = null;
  armyState: any = null;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async gotoHome(): Promise<void> {
    await this.page.goto('http://localhost:3000');
    await this.page.waitForLoadState('networkidle');
  }

  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  async getFromLocalStorage(key: string): Promise<any> {
    return await this.page.evaluate((k) => {
      const value = localStorage.getItem(k);
      return value ? JSON.parse(value) : null;
    }, key);
  }

  async setInLocalStorage(key: string, value: any): Promise<void> {
    await this.page.evaluate(({ k, v }) => {
      localStorage.setItem(k, JSON.stringify(v));
    }, { k: key, v: value });
  }
}

setWorldConstructor(CustomWorld);
