#!/usr/bin/env tsx
/**
 * Generate VK community cover image (1920x768)
 * Usage: npx tsx scripts/take-promo-cover.ts
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'promo', 'screenshots');
const OUTPUT = path.join(__dirname, '..', 'docs', 'promo', 'community-cover.png');

function imgB64(name: string) {
  const data = fs.readFileSync(path.join(SCREENSHOTS_DIR, name));
  return `data:image/png;base64,${data.toString('base64')}`;
}

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1920px; height: 768px; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }

  .cover {
    width: 1920px; height: 768px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 100px;
    position: relative;
    color: white;
  }

  .cover::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .cover::after {
    content: '';
    position: absolute;
    left: 100px; right: 100px; bottom: 0;
    height: 3px;
    background: linear-gradient(90deg, #ef4444, #06b6d4, #eab308);
  }

  .left { position: relative; z-index: 1; max-width: 850px; }

  .tagline {
    font-size: 20px; color: #64748b;
    text-transform: uppercase; letter-spacing: 8px; margin-bottom: 24px;
  }

  .title {
    font-size: 88px; font-weight: 800; letter-spacing: -1px; line-height: 1;
    margin-bottom: 28px;
    background: linear-gradient(180deg, #ffffff 0%, #94a3b8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 26px; color: #94a3b8; line-height: 1.5;
    margin-bottom: 44px; max-width: 680px;
  }

  .features { display: flex; gap: 36px; list-style: none; flex-wrap: wrap; }
  .features li {
    font-size: 17px; color: #cbd5e1;
    display: flex; align-items: center; gap: 8px;
  }
  .features li::before { content: ''; width: 6px; height: 6px; background: #38bdf8; border-radius: 50%; flex-shrink: 0; }

  .right {
    position: relative; z-index: 1;
    display: flex; gap: 24px; align-items: flex-end;
  }

  .phone {
    width: 190px; height: 400px;
    border-radius: 20px; overflow: hidden;
    border: 2px solid #334155;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  }
  .phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

  .phone.p2 { margin-bottom: 50px; }
  .phone.p3 { margin-bottom: -10px; }

  .url {
    position: absolute; bottom: 20px; left: 100px;
    font-size: 18px; color: #475569; letter-spacing: 1px;
  }

  .badge {
    position: absolute; top: 30px; right: 100px;
    font-size: 14px; color: #64748b; letter-spacing: 2px;
    text-transform: uppercase;
  }
</style>
</head>
<body>
<div class="cover">
  <div class="left">
    <div class="tagline">Цифровой ассистент для настольного варгейма</div>
    <div class="title">БРОНЕПЕХОТА</div>
    <div class="subtitle">Собирайте армию. Отслеживайте состояние отрядов в бою. Рассчитывайте попадания и урон. Создавайте собственные фракции и отряды.</div>
    <ul class="features">
      <li>Конструктор армии</li>
      <li>Навигатор по карточкам</li>
      <li>Боевой калькулятор</li>
      <li>Энциклопедия</li>
      <li>Редактор отрядов</li>
    </ul>
  </div>
  <div class="right">
    <div class="phone p1"><img src="${imgB64('02-army.png')}" /></div>
    <div class="phone p2"><img src="${imgB64('05-squad-card-battle.png')}" /></div>
    <div class="phone p3"><img src="${imgB64('07-calculator.png')}" /></div>
  </div>
  <div class="url">luxor.github.io/bronepehota</div>
  <div class="badge">Бесплатно · PWA · Open Source</div>
</div>
</body>
</html>`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 768 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: OUTPUT,
    type: 'png',
    clip: { x: 0, y: 0, width: 1920, height: 768 },
  });
  console.log(`Saved: ${OUTPUT}`);

  await browser.close();
}

main().catch(console.error);
