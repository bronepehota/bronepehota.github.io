---
name: promo
description: Use when making a VK promo post or carousel screenshots for a shipped Bronepehota feature/update — e.g. the user asks for a "vk пост", "промо", or release screenshots.
---

# Promo (VK post + carousel screenshots)

## What a promo is

One folder under `docs/promo/<feature>/` containing:

- `post.md` — the VK post text (full + a short variant) + a numbered caption list.
- `NN-*.png` — the carousel screenshots, **max 5**, numbered in narrative order (`01-`, `02-`, …).

Existing examples to mirror: `docs/promo/vk-chronicles/`, `docs/promo/vk-rutenia/`, `docs/promo/vk-attribution/`.

## Hard rules

- **Carousel ≤ 5 screenshots.** VK carousel max is 10, but this project caps at **5**. Pick the 5 most telling frames; if you need more, the post is trying to cover too much.
- Promo assets go in `docs/promo/<feature>/` — **not** the repo root, not `docs/vk-shots/`.
- `post.md` is the source of truth for the text; screenshots are numbered to match its caption list.

## Step 1 — Draft `post.md`

Russian, VK-community tone (warm, a little informal, a few emojis). Structure:

1. Header line with a thematic emoji (🪖 for Бронепехота, 📖 for encyclopedia, 🎨 for paint, …).
2. What changed — 2–4 bulleted dimensions (🔹/🎨/🏷), concrete but not technical.
3. The "why / honesty" beat — e.g. «с миру по нитке», official lore is scarce / lots of fan work. Avoid pitting «Star System vs Технолог»; frame as «сообщество».
4. CTA: open the app + the corrections channel.
5. Links + hashtags.

Fixed facts:
- App / encyclopedia: `https://luxor.github.io/bronepehota/encyclopedia`
- Corrections channel («Дополнить» target): `https://vk.ru/lastbpcoder`
- Community: `https://vk.com/bp_bnp`
- Hashtags: `#бронепехота #настольныеигры #варгейм #wargame #звёздныесистемы`

Include a **short variant** (3–4 lines) for the running feed.

## Step 2 — Capture ≤5 screenshots

### Start a clean dev server (two separate commands!)

```bash
# 1) cleanup — FOREGROUND, ALONE (chaining pkill behind rm exits 1 empty)
pkill -9 -f next 2>/dev/null; rm -rf .next   # if pkill finds nothing it returns 1; run rm in its own call if so
# 2) dev server — its OWN background command
npm run dev   # port 3000
```

Poll until ready: `curl -sf -o /dev/null http://localhost:3000/ && echo ready`.

### Screenshot script — write it IN THE REPO, not /tmp

A script in `/tmp` can't `require('playwright')` (no node_modules there). Write the script into the repo root (e.g. `_shots.cjs`), run, then delete it.

```js
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = 'docs/promo/<feature>';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  await page.goto('http://localhost:3000/encyclopedia', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);                   // let first-compile + images settle
  await page.screenshot({ path: `${OUT}/01-<name>.png` });
  // scroll a section into frame, then back off a little for context:
  await page.getByText('ДОСТУПНОСТЬ В ИСТОЧНИКАХ').first().scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/02-<name>.png` });
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
```

Run: `node _shots.cjs && rm _shots.cjs`.

Notes:
- `deviceScaleFactor: 2` → crisp 2560×1800 PNGs for the carousel.
- `waitUntil: 'networkidle'` + `waitForTimeout(1200)` — first-access compile takes a few seconds.
- A **fresh** browser context has empty localStorage → first-open banners (e.g. the sources banner) show up. Good for screenshots.
- Frame a section: `scrollIntoViewIfNeeded()` then `window.scrollBy(0, -120)` to pull context above it.

## Common mistakes

- **>5 screenshots** — trim to the 5 most telling; split the topic into two promos rather than overstuffing.
- **Script in `/tmp`** → `Cannot find module 'playwright'`. Write it in the repo.
- **`pkill … ; npm run dev` as one backgrounded command** → empty output, exit 1. Cleanup in its own foreground call.
- **Screenshots at repo root / `docs/vk-shots/`** — move them into `docs/promo/<feature>/`.
- **Half-rendered shot** — you didn't wait for compile/images. Add the `waitForTimeout`.
- **Can't "see" the result** — vision on this app's dark UI is unreliable; capture by scrolling to known elements/text, then ask the human to eyeball the PNGs.

## Verify

- `ls docs/promo/<feature>/` → `post.md` + `01..0N` PNGs, N ≤ 5.
- Open a PNG or eyeball framing; re-shoot with adjusted scroll if off.
