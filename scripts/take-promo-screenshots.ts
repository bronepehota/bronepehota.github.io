#!/usr/bin/env tsx
/**
 * Promo Screenshot Capture Script
 *
 * Takes 6 promotional screenshots at mobile viewport size (Pixel 5)
 * for use in app store listings, social media, and documentation.
 *
 * Prerequisites:
 *   - Dev server running on http://localhost:3001 (npm run dev:e2e)
 *   - tsx installed (npm install -D tsx)
 *
 * Usage:
 *   npx tsx scripts/take-promo-screenshots.ts
 */

import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, '../docs/promo/screenshots');

// Army data for game session screenshots (3 & 4)
const ARMY_DATA = {
  name: 'Гвардия Поларис',
  faction: 'polaris',
  sourceId: 'star_system',
  units: [
    {
      instanceId: 'nav-squad-1',
      type: 'squad',
      data: {
        id: 'polaris_tyazhyolaya_klon_pehota',
        name: 'Тяжёлая клон-пехота',
        shortName: 'Тяжёлая',
        faction: 'polaris',
        cost: 80,
        image: '/images/squads/polaris/tyazhyolaya_klon_pehota/1.png',
        soldiers: [
          { num: 1, rank: 2, speed: 5, range: 'D6', power: '1D12', melee: 3, modifiers: ['mechanic'], props: [], armor: 2, image: '/images/squads/polaris/tyazhyolaya_klon_pehota/1.png' },
          { num: 2, rank: 2, speed: 5, range: 'D12+2', power: '1D12', melee: 3, modifiers: ['mechanic'], props: [], armor: 2, image: '/images/squads/polaris/tyazhyolaya_klon_pehota/2.png' },
          { num: 3, rank: 2, speed: 5, range: 'D12', power: '2D12', melee: 0, modifiers: ['mechanic'], props: [], armor: 2, image: '/images/squads/polaris/tyazhyolaya_klon_pehota/3.png' },
          { num: 4, rank: 2, speed: 5, range: 'D12', power: '1D20', melee: 0, modifiers: ['mechanic'], props: [], armor: 2, image: '/images/squads/polaris/tyazhyolaya_klon_pehota/4.png' },
          { num: 5, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, modifiers: ['mechanic'], props: [], armor: 2, image: '/images/squads/polaris/tyazhyolaya_klon_pehota/5.png' },
          { num: 6, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 7, modifiers: ['mechanic'], props: [], armor: 2, image: '/images/squads/polaris/tyazhyolaya_klon_pehota/6.png' },
        ],
      },
      instanceNumber: 1,
      currentSoldiers: [0, 1, 2, 3, 4, 5],
      deadSoldiers: [],
      actionsUsed: Array(6).fill({ moved: false, shot: false, melee: false, done: false }),
      activeBuffs: [
        {
          id: 'buff_cover_1',
          catalogId: 'cover',
          name: 'Укрытие',
          description: '+1 к броне',
          target: 'armor_bonus',
          value: 1,
          phase: 'shot',
          appliedAtTurn: 1,
        },
      ],
      activeDebuffs: [
        {
          id: 'debuff_suppression_1',
          catalogId: 'suppression',
          name: 'Подавление',
          description: '-1 к дистанции',
          target: 'range_penalty',
          value: 1,
          phase: 'shot',
          duration: 2,
          appliedAtTurn: 1,
        },
      ],
      soldierModifiers: [],
      soldierAbilitiesUsed: [],
    },
    {
      instanceId: 'nav-squad-2',
      type: 'squad',
      data: {
        id: 'polaris_lyogkaya_shturmovaya_klon_pehota',
        name: 'Лёгкая штурмовая клон-пехота',
        shortName: 'Лёгкая штурмовая',
        faction: 'polaris',
        cost: 70,
        image: '/images/squads/polaris/lyogkaya_shturmovaya_klon_pehota/1.png',
        soldiers: [
          { num: 1, rank: 2, speed: 5, range: 'D6', power: '1D6+3', melee: 5, modifiers: ['jump_boost_4'], props: [], armor: 2, image: '/images/squads/polaris/lyogkaya_shturmovaya_klon_pehota/1.png' },
          { num: 2, rank: 2, speed: 5, range: 'D6', power: '3D6', melee: 6, modifiers: ['jump_boost_4'], props: [], armor: 2, image: '/images/squads/polaris/lyogkaya_shturmovaya_klon_pehota/2.png' },
          { num: 3, rank: 2, speed: 5, range: '', power: '', melee: 6, modifiers: ['jump_boost_4'], props: [], armor: 2, image: '/images/squads/polaris/lyogkaya_shturmovaya_klon_pehota/3.png' },
          { num: 4, rank: 2, speed: 5, range: 'D6', power: '1D6+3', melee: 5, modifiers: ['jump_boost_4'], props: [], armor: 2, image: '/images/squads/polaris/lyogkaya_shturmovaya_klon_pehota/4.png' },
        ],
      },
      instanceNumber: 2,
      currentSoldiers: [0, 1, 2, 3],
      deadSoldiers: [],
      actionsUsed: Array(4).fill({ moved: true, shot: true, melee: false, done: true }),
      activeBuffs: [],
      activeDebuffs: [],
      soldierModifiers: [],
      soldierAbilitiesUsed: [],
    },
    {
      instanceId: 'nav-machine-1',
      type: 'machine',
      data: {
        id: 'demolisher',
        name: 'Демолишер',
        shortName: 'Демолишер',
        faction: 'polaris',
        cost: 400,
        image: '/images/machines/demolisher.jpg',
        weapons: [
          { name: 'Шестиствольная автоматическая пушка ARC-20X6', range: 'D12', power: '3D20', ammo: 5 },
          { name: 'Спаренная пусковая установка Шторм для ракет R-9', range: 'D12', power: '2D20', ammo: 2 },
        ],
        speed_sectors: [
          { min_durability: 9, max_durability: 16, speed: 2 },
          { min_durability: 1, max_durability: 8, speed: 1 },
        ],
        rank: 3,
        fire_rate: 2,
        ammo_max: 5,
        durability_max: 16,
      },
      instanceNumber: 1,
      currentDurability: 14,
      currentAmmo: 4,
      isMachineMoved: false,
      isMachineShot: false,
      machineShotsUsed: 0,
      machineWeaponShots: {},
    },
  ],
  totalCost: 550,
  currentStep: 'battle',
  isInBattle: true,
  currentTurn: 2,
};

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  const onlyScreenshot = process.argv[2]; // e.g. "4" to only take screenshot 4
  console.log('Starting promo screenshot capture...');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Base URL: ${BASE_URL}`);
  if (onlyScreenshot) console.log(`Only capturing screenshot ${onlyScreenshot}`);

  const browser = await chromium.launch({ headless: true });
  const pixel5 = devices['Pixel 5'];

  // Helper: create a fresh context with Pixel 5 viewport
  async function newContext() {
    return browser.newContext({
      ...pixel5,
      locale: 'ru-RU',
    });
  }

  // Helper: take a screenshot with logging
  async function takeScreenshot(
    num: string,
    name: string,
    setup: (context: import('playwright').BrowserContext) => Promise<void>,
  ) {
    if (onlyScreenshot && onlyScreenshot !== num) return;
    console.log(`\nCapturing ${name}...`);
    const context = await newContext();
    const page = await context.newPage();

    try {
      await setup(context);
      const filePath = path.join(OUTPUT_DIR, name);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`  Saved: ${filePath}`);
    } catch (err) {
      console.error(`  Failed: ${name}`, err);
    } finally {
      await context.close();
    }
  }

  // ── Screenshot 1: Landing page ──────────────────────────────
  await takeScreenshot('1', '01-landing.png', async (context) => {
    const page = context.pages()[0];
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // ── Screenshot 2: Army builder with a unit added ────────────
  await takeScreenshot('2', '02-army.png', async (context) => {
    const page = context.pages()[0];
    await page.goto(`${BASE_URL}/app`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Step 1: Rules confirmation
    const rulesBtn = page.getByTestId('rules-confirm-button');
    if ((await rulesBtn.count()) > 0) {
      await rulesBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Source confirmation (star_system is default)
    const sourceBtn = page.getByTestId('source-confirm-button');
    if ((await sourceBtn.count()) > 0) {
      await sourceBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Select Polaris faction
    const polarisCard = page.getByTestId('faction-card-polaris');
    if ((await polarisCard.count()) > 0) {
      await polarisCard.click();
      await page.waitForTimeout(300);
    }

    const factionContinue = page.getByTestId('faction-continue-button');
    if ((await factionContinue.count()) > 0) {
      await factionContinue.click();
      await page.waitForTimeout(500);
    }

    // Step 4: Select budget 500
    const budget500 = page.getByTestId('budget-500');
    if ((await budget500.count()) > 0) {
      await budget500.click();
      await page.waitForTimeout(300);
    } else {
      // Fallback: find button by text
      const budgetBtn = page.getByRole('button', { name: '500' });
      if ((await budgetBtn.count()) > 0) {
        await budgetBtn.click();
        await page.waitForTimeout(300);
      }
    }

    const budgetNext = page.getByTestId('budget-next-button');
    if ((await budgetNext.count()) > 0) {
      await budgetNext.click();
      await page.waitForTimeout(500);
    }

    // Step 5: Add first unit
    const addBtn = page.getByRole('button', { name: /добавить/i }).first();
    if ((await addBtn.count()) > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }

    // Wait for UI to settle
    await page.waitForTimeout(500);
  });

  // ── Screenshot 3: Game session with expanded navigator ──────
  await takeScreenshot('3', '03-navigator.png', async (context) => {
    // Set localStorage via addInitScript before page loads
    await context.addInitScript((armyJson) => {
      localStorage.setItem('bronepehota_army', armyJson);
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    }, JSON.stringify(ARMY_DATA));

    const page = context.pages()[0];
    await page.goto(`${BASE_URL}/app`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify game session loaded
    const gameSession = page.getByTestId('game-session');
    if ((await gameSession.count()) > 0) {
      await gameSession.first().waitFor({ state: 'visible', timeout: 10000 });
    }

    // Expand the navigator dock via JS dispatch (same pattern as E2E test)
    await page.evaluate(() => {
      const handle = document.querySelector('.fixed.left-0.right-0.z-50 > .flex.justify-center');
      if (handle) handle.dispatchEvent(new Event('click', { bubbles: true }));
    });
    await page.waitForTimeout(800);

    // Verify expanded navigator is visible
    const expandedNav = page.getByTestId('expanded-navigator');
    if ((await expandedNav.count()) > 0) {
      await expandedNav.waitFor({ state: 'visible', timeout: 5000 });
    }

    await page.waitForTimeout(500);
  });

  // ── Screenshot 4: Combat modal with modifiers ──────────────
  await takeScreenshot('4', '04-combat-modifiers.png', async (context) => {
    await context.addInitScript((armyJson) => {
      localStorage.setItem('bronepehota_army', armyJson);
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    }, JSON.stringify(ARMY_DATA));

    const page = context.pages()[0];
    await page.goto(`${BASE_URL}/app`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify game session loaded
    const gameSession = page.getByTestId('game-session');
    if ((await gameSession.count()) > 0) {
      await gameSession.first().waitFor({ state: 'visible', timeout: 10000 });
    }
    await page.waitForTimeout(500);

    // Click the "Выберите действие" button for the first soldier to open combat modal
    const actionButton = page.getByRole('button', { name: 'Выберите действие' }).first();
    if ((await actionButton.count()) > 0) {
      await actionButton.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Select shot action (ВЫСТРЕЛ)
    const shotButton = page.getByRole('button', { name: /выстрел/i });
    if ((await shotButton.count()) > 0) {
      await shotButton.click();
      await page.waitForTimeout(800);
    }

    // Wait for combat modal with parameters to render
    await page.waitForTimeout(500);
  });

  // ── Screenshot 5: Squad unit card in battle ──────────────────
  await takeScreenshot('5', '05-squad-card-battle.png', async (context) => {
    await context.addInitScript((armyJson) => {
      localStorage.setItem('bronepehota_army', armyJson);
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    }, JSON.stringify(ARMY_DATA));

    const page = context.pages()[0];
    await page.goto(`${BASE_URL}/app`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const gameSession = page.getByTestId('game-session');
    if ((await gameSession.count()) > 0) {
      await gameSession.first().waitFor({ state: 'visible', timeout: 10000 });
    }
    await page.waitForTimeout(500);

    // Click on squad unit to show its detailed card
    const unitCard = page.getByTestId('unit-nav-nav-squad-1');
    if ((await unitCard.count()) > 0) {
      await unitCard.first().click({ force: true });
      await page.waitForTimeout(1000);
    }
  });

  // ── Screenshot 6: Machine unit card in battle ────────────────
  await takeScreenshot('6', '06-machine-card-battle.png', async (context) => {
    await context.addInitScript((armyJson) => {
      localStorage.setItem('bronepehota_army', armyJson);
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    }, JSON.stringify(ARMY_DATA));

    const page = context.pages()[0];
    await page.goto(`${BASE_URL}/app`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const gameSession = page.getByTestId('game-session');
    if ((await gameSession.count()) > 0) {
      await gameSession.first().waitFor({ state: 'visible', timeout: 10000 });
    }
    await page.waitForTimeout(500);

    // Click on machine unit to show its detailed card
    const machineCard = page.getByTestId('unit-nav-nav-machine-1');
    if ((await machineCard.count()) > 0) {
      await machineCard.first().click({ force: true });
      await page.waitForTimeout(1000);
    }
  });

  // ── Screenshot 7: Standalone calculator ─────────────────────
  await takeScreenshot('7', '07-calculator.png', async (context) => {
    const page = context.pages()[0];
    await page.goto(`${BASE_URL}/calculator`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Find and click the shot action card (contains both "ВЫСТРЕЛ" and "Дистанция")
    const cards = await page.locator('[class*="relative w-full overflow-hidden"]').all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes('ВЫСТРЕЛ') && text.includes('Дистанция')) {
        await card.click();
        break;
      }
    }
    await page.waitForTimeout(800);
  });

  // ── Screenshot 8: Encyclopedia with Polaris filter ─────────
  await takeScreenshot('8', '08-encyclopedia.png', async (context) => {
    const page = context.pages()[0];
    await page.goto(`${BASE_URL}/encyclopedia`);
    await page.waitForLoadState('networkidle');

    // Wait for unit cards to render
    await page.waitForSelector('[href*="/encyclopedia/unit/"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click the "ПОЛЯРИС" faction filter button
    const polarisFilter = page.locator('button:has-text("ПОЛЯРИС")');
    if ((await polarisFilter.count()) > 0) {
      await polarisFilter.first().click();
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(500);
  });

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
  console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
