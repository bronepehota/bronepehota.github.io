// Regenerate the OG social card (public/og-image.png) from the landing hero.
// Usage (from repo root, with dev server running on http://localhost:3000):
//   node tools/regen-og-image.mjs && python3 tools/regen-og-crop.py
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
// Hero text/CTA animate in at 200/500ms — wait for the CTA, then settle.
await page.waitForSelector('[data-testid="landing-cta-button"]', { state: 'visible', timeout: 30000 });
await page.waitForTimeout(900);
await page.locator('main section').first().screenshot({ path: '/tmp/hero-raw.png' });
await browser.close();
console.log('saved /tmp/hero-raw.png  -> run tools/regen-og-crop.py');
