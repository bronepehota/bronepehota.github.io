#!/usr/bin/env tsx
/**
 * Generate VK community logo (400x400)
 * Usage: npx tsx scripts/take-promo-logo.ts
 */
import { chromium } from 'playwright';
import * as path from 'path';

const OUTPUT = path.join(__dirname, '..', 'docs', 'promo', 'community-logo.png');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 400px; height: 400px; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }

  .logo {
    width: 400px; height: 400px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    position: relative; color: white;
  }

  .logo::before {
    content: ''; position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
    background-size: 30px 30px;
  }

  .icon {
    font-size: 120px; font-weight: 800; line-height: 1;
    margin-bottom: 8px;
    position: relative; z-index: 1;
  }

  .shield {
    width: 120px; height: 120px;
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
  }

  .shield svg { width: 100%; height: 100%; }

  .title {
    font-size: 32px; font-weight: 800; letter-spacing: 2px;
    position: relative; z-index: 1;
    background: linear-gradient(180deg, #ffffff 0%, #94a3b8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .accent {
    position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #ef4444, #06b6d4, #eab308);
  }
</style>
</head>
<body>
<div class="logo">
  <div class="shield">
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Shield shape -->
      <path d="M60 10 L105 30 L105 65 Q105 95 60 115 Q15 95 15 65 L15 30 Z"
            fill="none" stroke="url(#grad)" stroke-width="4" />
      <!-- Crosshair -->
      <circle cx="60" cy="58" r="20" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.6"/>
      <line x1="60" y1="30" x2="60" y2="86" stroke="#38bdf8" stroke-width="1.5" opacity="0.4"/>
      <line x1="32" y1="58" x2="88" y2="58" stroke="#38bdf8" stroke-width="1.5" opacity="0.4"/>
      <!-- Diamond in center -->
      <path d="M60 45 L70 58 L60 71 L50 58 Z" fill="#38bdf8" opacity="0.8"/>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ef4444"/>
          <stop offset="50%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#eab308"/>
        </linearGradient>
      </defs>
    </svg>
  </div>
  <div class="title">БРОНЕПЕХОТА</div>
  <div class="accent"></div>
</div>
</body>
</html>`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 400, height: 400 },
    deviceScaleFactor: 2, // 2x for crisp rendering
  });
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  await page.screenshot({
    path: OUTPUT,
    type: 'png',
    clip: { x: 0, y: 0, width: 400, height: 400 },
  });
  console.log(`Saved: ${OUTPUT}`);

  await browser.close();
}

main().catch(console.error);
