// Одноразовый: превью-скриншоты «до/после» пилота абзацного лора (Task 7).
// Запускается при работающем dev-сервере: BASE=http://localhost:3001 (или :3002 для «до»).
//   TAG=before node tools/preview_lore_shots.mjs   -> preview-before-*.png (корень репо)
//   TAG=after  DOM=1 node tools/preview_lore_shots.mjs  -> + DOM-проверка абзацев в stderr
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3001';
const TAG = process.env.TAG ?? 'after';
const SHOTS = [
  ['unit-bronekhod', `/encyclopedia/unit/bronekhod`],
  ['unit-klon-pehota', `/encyclopedia/unit/polaris_lineynaya_klon_pehota`],
  ['units-catalog', `/encyclopedia/units`],
  ['mission', `/encyclopedia/mission/${process.env.MISSION_ID ?? 'osvobozhdenie'}`],
  ['factions', `/encyclopedia/factions`],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
for (const [name, path] of SHOTS) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `preview-${TAG}-${name}-375.png`, fullPage: true });
  console.error(`shot: preview-${TAG}-${name}-375.png`);
}

// DOM-проверка абзацев (не vision): #lore p / #tactics p + типографика лор-абзаца.
if (process.env.DOM) {
  for (const [name, path] of SHOTS.filter(([n]) => n.startsWith('unit-'))) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const loreCount = await page.locator('#lore p').count();
    const tacticsCount = await page.locator('#tactics p').count();
    // Первый абзац блока «// ИСТОРИЯ СОЗДАНИЯ» — типографика ведётся с ним.
    const p = page.locator('#lore p').nth(1);
    const style = await p.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { lineHeight: cs.lineHeight, fontSize: cs.fontSize, maxWidth: cs.maxWidth };
    });
    console.error(
      `dom ${name}: #lore p=${loreCount} #tactics p=${tacticsCount} ` +
        `p[1] font-size=${style.fontSize} line-height=${style.lineHeight} max-width=${style.maxWidth}`
    );
  }
}
await browser.close();
