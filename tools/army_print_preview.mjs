#!/usr/bin/env node
/**
 * Верификация печатного арм-листа: худший случай (6 отрядов × 6 бойцов)
 * рендерится через Chromium print-движок в PDF (A4), затем:
 *   - pdfinfo считает страницы (цель: 1 лист);
 *   - pdftoppm снимает PNG-превью для визуальной проверки владельцем.
 *
 * Запуск из КОРНЯ репозитория (Node ESM резолвит node_modules относительно
 * скрипта):  BASE_URL=http://localhost:3001 node tools/army_print_preview.mjs
 * Результаты: /tmp/army-print-a4.pdf, /tmp/army-print-page*.png
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const IMG = '/images/squads/snow_wolves/ulfhednary/1.png';

const soldier = (n) => ({
  num: n,
  rank: 4 - (n % 2),
  speed: 4,
  range: n % 2 ? 'Д12' : 'Д6',
  power: n % 2 ? '2Д6' : 'Д6+1',
  melee: 3,
  armor: 4,
  image: IMG,
});
const squad = (i) => ({
  id: `print-squad-${i}`,
  name: `Штурмовая группа «-${i}»`,
  shortName: `ШГ-${i}`,
  faction: 'polaris',
  cost: 135,
  image: IMG,
  soldiers: [1, 2, 3, 4, 5, 6].map(soldier),
});

const army = {
  name: 'Worst Case',
  faction: 'polaris',
  sourceId: 'star_system',
  units: [1, 2, 3, 4, 5, 6].map((i) => {
    // MIXED=1: последние три юнита — машины (проверка таблицы орудий)
    if (process.env.MIXED === '1' && i >= 4) {
      return {
        instanceId: `u${i}`,
        type: 'machine',
        data: {
          id: `print-machine-${i}`,
          name: i === 4 ? 'Раптор' : i === 5 ? 'Хеликс' : 'Демолишер',
          faction: 'polaris',
          cost: 190 + i * 10,
          rank: 2,
          fire_rate: 2,
          ammo_max: 12,
          durability_max: 12,
          image: IMG,
          speed_sectors: [{ min_durability: 1, max_durability: 12, speed: 4 }],
          weapons: [
            { name: 'Пусковая установка', range: 'Д12', power: 'Д20', ammo: 8 },
            { name: 'Спаренная скорострельная пушка', range: 'Д6', power: '2Д6', ammo: 12 },
          ],
        },
        instanceNumber: i,
        currentDurability: 12,
        currentAmmo: 12,
        machineShotsUsed: 0,
      };
    }
    return {
      instanceId: `u${i}`,
      type: 'squad',
      data: squad(i),
      instanceNumber: i,
    };
  }),
  totalCost: 810,
  pointBudget: 850,
  currentStep: 'preparation',
  isInBattle: false,
  currentTurn: 1,
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.addInitScript((a) => {
  localStorage.clear();
  localStorage.setItem('bronepehota_battle_tutorial_done', '1');
  localStorage.setItem('bronepehota_army', JSON.stringify({ schemaVersion: 1, army: a }));
  localStorage.setItem('bronepehota_setup_step', 'preparation');
  localStorage.setItem('bronepehota_view', 'builder');
  localStorage.setItem('bronepehota_display_mode', 'detailed');
  localStorage.setItem('bronepehota_rules_version', 'community_star_system');
  localStorage.setItem('bronepehota_army_list_source', 'star_system');
}, army);

await page.goto(`${BASE_URL}/app`);
await page.waitForSelector('[data-testid="battle-preparation-screen"]', { timeout: 60000 });

await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: '/tmp/army-print-a4.pdf',
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true, // @page size/margin из globals.css
});

execSync('pdfinfo /tmp/army-print-a4.pdf | grep -E "Pages|Page size" || true', { stdio: 'inherit' });
execSync('pdftoppm -png -r 110 /tmp/army-print-a4.pdf /tmp/army-print-page', { stdio: 'inherit' });
console.log('PNG preview: /tmp/army-print-page-1.png');

await browser.close();
