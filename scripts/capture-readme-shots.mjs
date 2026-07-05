// scripts/capture-readme-shots.mjs
// Снимает 6 скриншотов для README на дев-сервере http://localhost:3001.
// Запуск: сначала поднять `npm run dev:e2e`, дождаться порта 3001, затем `node scripts/capture-readme-shots.mjs`.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3001';
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 390, height: 844 }; // mobile portrait
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

const newMobilePage = async (browser) => {
  const ctx = await browser.newContext({ viewport: VIEWPORT, userAgent: UA });
  return ctx.newPage();
};
const shot = async (page, name) => {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log('captured', path);
};

// --- game-session seed (зеркало e2e/helpers/setup.ts) ---
const squad = (instanceId, num = 1) => ({
  instanceId, type: 'squad', instanceNumber: num,
  currentSoldiers: [0, 1, 2, 3, 4, 5], deadSoldiers: [], actionsUsed: [],
  data: {
    id: 'polaris_lineynaya_klon_pehota', name: 'Линейная клон-пехота', shortName: 'Линейная',
    faction: 'polaris', cost: 50, image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
    soldiers: Array.from({ length: 6 }, (_, i) => ({ num: i + 1, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' })),
  },
});
const machine = (instanceId, num = 1) => ({
  instanceId, type: 'machine', instanceNumber: num,
  currentSoldiers: [], deadSoldiers: [], actionsUsed: [],
  durability: 16, ammo: 20, currentAmmo: 20, machineShotsUsed: 0,
  data: {
    id: 'polaris_legkiy_shturmovoy_ekranoplan', name: 'Лёгкий штурмовой экраноплан', shortName: 'Экраноплан',
    faction: 'polaris', cost: 150, rank: 2, fire_rate: 2, ammo_max: 20, durability_max: 16,
    image: '/images/machines/polaris/legkiy_shturmovoy_ekranoplan/1.png',
    speed_sectors: [{ min_durability: 9, max_durability: 16, speed: 2 }, { min_durability: 1, max_durability: 8, speed: 1 }],
    weapons: [{ name: 'Пушка', range: 'D12', power: '2D20', special: '' }],
  },
});
const seedGameSession = (page, units) => page.addInitScript((u) => {
  const army = { name: 'Фото', faction: 'polaris', sourceId: 'star_system', units: u, totalCost: 200, currentStep: 'battle', isInBattle: true, currentTurn: 1 };
  localStorage.clear();
  localStorage.setItem('bronepehota_army', JSON.stringify(army));
  localStorage.setItem('bronepehota_view', 'game');
  localStorage.setItem('bronepehota_display_mode', 'detailed');
}, units);
const clearStorage = (page) => page.addInitScript(() => {
  Object.keys(localStorage).filter((k) => k.startsWith('bronepehota')).forEach((k) => localStorage.removeItem(k));
});

(async () => {
  const browser = await chromium.launch();
  try {
    // 1. Лендинг
    {
      const page = await newMobilePage(browser);
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      await shot(page, '01-landing');
      await page.close();
    }
    // 2. Сбор армии (провести визард + добавить пару отрядов)
    {
      const page = await newMobilePage(browser);
      await clearStorage(page);
      await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
      await page.getByTestId('rules-confirm-button').click();
      await page.waitForTimeout(700);
      await page.getByTestId('source-confirm-button').click();
      await page.waitForTimeout(700);
      await page.getByTestId('faction-card-polaris').click();
      await page.waitForTimeout(400);
      await page.getByTestId('faction-continue-button').click();
      await page.waitForTimeout(500);
      await page.getByTestId('mission-confirm-button').click();
      await page.waitForTimeout(700);
      await page.getByRole('button', { name: '350' }).click();
      await page.waitForTimeout(400);
      await page.getByTestId('budget-next-button').click();
      await page.waitForTimeout(1200);
      for (let i = 0; i < 3; i++) {
        try { await page.getByRole('button', { name: /добавить/i }).first().click({ timeout: 1500 }); await page.waitForTimeout(350); } catch {}
      }
      await page.waitForTimeout(800);
      await shot(page, '02-army');
      await page.close();
    }
    // 3. Навигатор (игровая сессия с несколькими юнитами)
    {
      const page = await newMobilePage(browser);
      await seedGameSession(page, [squad('nav-squad-1', 1), squad('nav-squad-2', 2), machine('nav-machine-1', 1)]);
      await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
      await page.getByTestId('game-session').first().waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(1200);
      await shot(page, '03-navigator');
      await page.close();
    }
    // 4. Боевой калькулятор (фаза параметров выстрела)
    {
      const page = await newMobilePage(browser);
      await seedGameSession(page, [squad('combat-squad-1', 1)]);
      await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
      await page.getByTestId('game-session').first().waitFor({ state: 'visible', timeout: 15000 });
      await page.getByTestId('unit-nav-combat-squad-1').first().click({ force: true });
      await page.waitForTimeout(800);
      try {
        await page.getByRole('button', { name: 'Выберите действие' }).first().click({ timeout: 3000 });
        await page.waitForTimeout(600);
        await page.getByRole('button', { name: /выстрел/i }).first().click({ timeout: 3000 });
        await page.waitForTimeout(900);
      } catch (e) { console.log('combat flow partial:', e.message); }
      await shot(page, '04-combat');
      await page.close();
    }
    // 5. Отдельный калькулятор
    {
      const page = await newMobilePage(browser);
      await page.goto(BASE + '/calculator', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      await shot(page, '05-calculator');
      await page.close();
    }
    // 6. Энциклопедия
    {
      const page = await newMobilePage(browser);
      await page.goto(BASE + '/encyclopedia', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      await shot(page, '06-encyclopedia');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})();
