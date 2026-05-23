#!/usr/bin/env tsx
/**
 * Generate VK community logo (400x400) with dice element
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

  .scene {
    position: relative; z-index: 1;
    width: 180px; height: 160px;
    margin-bottom: 20px;
  }

  /* Shield behind */
  .shield-svg {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 120px; height: 120px; opacity: 0.3;
  }

  /* Dice D20 in center */
  .dice-wrap {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
  }

  .dice-svg {
    width: 100px; height: 100px;
    filter: drop-shadow(0 4px 20px rgba(56, 189, 248, 0.3));
  }

  /* D6 to the left */
  .d6-wrap {
    position: absolute;
    bottom: 10px; left: 10px;
  }
  .d6-svg {
    width: 52px; height: 52px;
    filter: drop-shadow(0 2px 8px rgba(239, 68, 68, 0.3));
    transform: rotate(-12deg);
  }

  /* D12 to the right */
  .d12-wrap {
    position: absolute;
    bottom: 15px; right: 5px;
  }
  .d12-svg {
    width: 56px; height: 56px;
    filter: drop-shadow(0 2px 8px rgba(234, 179, 8, 0.3));
    transform: rotate(8deg);
  }

  .title {
    font-size: 30px; font-weight: 800; letter-spacing: 2px;
    position: relative; z-index: 1;
    background: linear-gradient(180deg, #ffffff 0%, #94a3b8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 6px;
  }

  .subtitle {
    font-size: 11px; color: #64748b; letter-spacing: 4px; text-transform: uppercase;
    position: relative; z-index: 1;
  }

  .accent {
    position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #ef4444, #06b6d4, #eab308);
  }
</style>
</head>
<body>
<div class="logo">
  <div class="scene">
    <!-- Shield silhouette behind -->
    <svg class="shield-svg" viewBox="0 0 120 130" fill="none">
      <path d="M60 5 L112 28 L112 70 Q112 105 60 128 Q8 105 8 70 L8 28 Z"
            fill="none" stroke="#334155" stroke-width="3"/>
    </svg>

    <!-- D20 icosahedron in center -->
    <div class="dice-wrap">
      <svg class="dice-svg" viewBox="0 0 100 100" fill="none">
        <!-- Icosahedron top face -->
        <polygon points="50,8 85,30 70,55 30,55 15,30" fill="#1e3a5f" stroke="#38bdf8" stroke-width="1.5"/>
        <!-- Icosahedron bottom-left face -->
        <polygon points="15,30 30,55 25,80 50,92 30,55" fill="#162d4a" stroke="#38bdf8" stroke-width="1"/>
        <!-- Icosahedron bottom-right face -->
        <polygon points="85,30 70,55 75,80 50,92 70,55" fill="#162d4a" stroke="#38bdf8" stroke-width="1"/>
        <!-- Icosahedron left face -->
        <polygon points="15,30 30,55 50,42" fill="#1a3352" stroke="#38bdf8" stroke-width="0.8" opacity="0.5"/>
        <!-- Icosahedron right face -->
        <polygon points="85,30 70,55 50,42" fill="#1a3352" stroke="#38bdf8" stroke-width="0.8" opacity="0.5"/>
        <!-- Center number -->
        <text x="50" y="48" text-anchor="middle" fill="#38bdf8" font-size="18" font-weight="bold" font-family="monospace">20</text>
        <!-- Glow -->
        <circle cx="50" cy="45" r="30" fill="url(#glow)" opacity="0.15"/>
        <defs>
          <radialGradient id="glow"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="transparent"/></radialGradient>
        </defs>
      </svg>
    </div>

    <!-- D6 cube to the left -->
    <div class="d6-wrap">
      <svg class="d6-svg" viewBox="0 0 60 60" fill="none">
        <!-- Top face -->
        <polygon points="30,8 52,20 30,32 8,20" fill="#3b1520" stroke="#ef4444" stroke-width="1.2"/>
        <!-- Front face -->
        <polygon points="8,20 30,32 30,55 8,43" fill="#2a0f18" stroke="#ef4444" stroke-width="1"/>
        <!-- Right face -->
        <polygon points="30,32 52,20 52,43 30,55" fill="#1f0a12" stroke="#ef4444" stroke-width="0.8"/>
        <!-- Dots -->
        <circle cx="19" cy="36" r="2" fill="#ef4444" opacity="0.7"/>
        <circle cx="30" cy="42" r="2" fill="#ef4444" opacity="0.7"/>
        <circle cx="41" cy="30" r="2" fill="#ef4444" opacity="0.7"/>
        <text x="30" y="25" text-anchor="middle" fill="#ef4444" font-size="9" font-weight="bold" font-family="monospace" opacity="0.8">6</text>
      </svg>
    </div>

    <!-- D12 dodecahedron to the right -->
    <div class="d12-wrap">
      <svg class="d12-svg" viewBox="0 0 60 60" fill="none">
        <!-- Pentagon top -->
        <polygon points="30,5 48,15 45,35 15,35 12,15" fill="#2a2505" stroke="#eab308" stroke-width="1.2"/>
        <!-- Pentagon bottom-left -->
        <polygon points="12,15 15,35 10,50 30,55 15,35" fill="#1f1c04" stroke="#eab308" stroke-width="1"/>
        <!-- Pentagon bottom-right -->
        <polygon points="48,15 45,35 50,50 30,55 45,35" fill="#1a1704" stroke="#eab308" stroke-width="0.8"/>
        <text x="30" y="25" text-anchor="middle" fill="#eab308" font-size="11" font-weight="bold" font-family="monospace">12</text>
        <text x="30" y="46" text-anchor="middle" fill="#eab308" font-size="7" font-family="monospace" opacity="0.5">D</text>
      </svg>
    </div>
  </div>

  <div class="title">БРОНЕПЕХОТА</div>
  <div class="subtitle">цифровой ассистент</div>
  <div class="accent"></div>
</div>
</body>
</html>`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 400, height: 400 },
    deviceScaleFactor: 2,
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
