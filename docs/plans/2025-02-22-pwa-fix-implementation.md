# PWA Install Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix PWA installability on GitHub Pages by using dynamic manifest generation with basePath-aware paths.

**Architecture:** Generate manifest dynamically in layout.tsx using Next.js metadata API, with all paths prefixed by BASE_PATH from next.config.mjs. Delete static manifest.json that uses hardcoded paths.

**Tech Stack:** Next.js 14, TypeScript, Serwist (service worker)

**Design Doc:** `docs/plans/2025-02-22-pwa-fix-design.md`

---

## Task 1: Export BASE_PATH from next.config.mjs

**Files:**
- Modify: `next.config.mjs`

**Step 1: Add BASE_PATH export to next.config.mjs**

Open `next.config.mjs` and add the export after the BASE_PATH constant definition:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // existing config...
};

// Add this export after the config
const BASE_PATH = process.env.BASE_PATH || '/';

export { BASE_PATH }; // ← ADD THIS LINE

export default nextConfig;
```

**Step 2: Verify the syntax**

Run: `node -c next.config.mjs`
Expected: No output (syntax OK)

**Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "feat(pwa): export BASE_PATH for dynamic manifest

Export BASE_PATH constant for use in components to generate
basePath-aware PWA manifest paths."
```

---

## Task 2: Re-export BASE_PATH in constants.ts

**Files:**
- Modify: `src/lib/constants.ts`

**Step 1: Add BASE_PATH re-export**

Open `src/lib/constants.ts` and add the import/re-export at the top:

```typescript
// Add at the top of the file, with other imports
export { BASE_PATH } from 'next.config.mjs';
```

**Note:** Next.js allows importing from next.config.mjs at build time.

**Step 2: Verify TypeScript compiles**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat(pwa): re-export BASE_PATH from next.config

Re-export BASE_PATH for easy access in components."
```

---

## Task 3: Update metadata in layout.tsx with dynamic manifest

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Import BASE_PATH**

Add to existing imports at the top:

```typescript
import { BASE_PATH } from '@/lib/constants';
```

**Step 2: Create manifest generator function**

Add before the `metadata` export:

```typescript
const getManifest = () => ({
  name: 'Бронепехота - Помощник',
  short_name: 'Бронепехота',
  description: 'Приложение для варгейма Бронепехота',
  start_url: BASE_PATH + '/',
  scope: BASE_PATH + '/',
  display: 'standalone' as const,
  theme_color: '#0f172a',
  background_color: '#0f172a',
  lang: 'ru',
  orientation: 'portrait' as const,
  icons: [
    {
      src: BASE_PATH + '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
      purpose: 'any' as const
    },
    {
      src: BASE_PATH + '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
      purpose: 'any' as const
    },
    {
      src: BASE_PATH + '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
      purpose: 'any' as const
    },
    {
      src: BASE_PATH + '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
      purpose: 'any' as const
    },
    {
      src: BASE_PATH + '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
      purpose: 'any' as const
    },
    {
      src: BASE_PATH + '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any' as const
    },
    {
      src: BASE_PATH + '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'any' as const
    },
    {
      src: BASE_PATH + '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any' as const
    },
    {
      src: BASE_PATH + '/icons/icon-maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable' as const
    },
    {
      src: BASE_PATH + '/icons/icon-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable' as const
    }
  ]
});
```

**Step 3: Update metadata export**

Replace the existing `metadata` export:

```typescript
export const metadata: Metadata = {
  title: 'Бронепехота - Помощник',
  description: 'Приложение для игры в варгейм Бронепехота',
  manifest: getManifest(),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Бронепехота",
  },
  icons: {
    icon: [
      { url: BASE_PATH + "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: BASE_PATH + "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: BASE_PATH + "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};
```

**Step 4: Verify TypeScript compiles**

Run: `npm run type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(pwa): use dynamic manifest with basePath-aware paths

Replace static manifest.json reference with dynamic manifest
generation using BASE_PATH from next.config.mjs. This ensures
icons and start_url work correctly on GitHub Pages with basePath."
```

---

## Task 4: Delete static manifest.json

**Files:**
- Delete: `public/manifest.json`

**Step 1: Remove static manifest file**

Run: `rm public/manifest.json`

**Step 2: Verify file was deleted**

Run: `ls public/manifest.json 2>&1`
Expected: "No such file or directory"

**Step 3: Commit**

```bash
git add public/manifest.json
git commit -m "feat(pwa): remove static manifest.json

Static manifest replaced by dynamic manifest generation
in layout.tsx with basePath-aware paths."
```

---

## Task 5: Test locally (no basePath)

**Files:**
- None (testing only)

**Step 1: Build the application**

Run: `npm run build`
Expected: Build completes successfully

**Step 2: Start production server**

Run: `npm run start &`
Expected: Server starts on http://localhost:3000

**Step 3: Check manifest in browser**

1. Open http://localhost:3000 in Chrome
2. Open DevTools → Application → Manifest
3. Verify:
   - `name`: "Бронепехота - Помощник"
   - `start_url`: "/"
   - `icons`: All paths start with "/" (no "/bronepehota" prefix)
   - No 404 errors for icons

**Step 4: Stop server**

Run: `pkill -f "npm run start" || pkill -f "next start"`

**Step 6: Test installability locally**

Run: `npx lighthouse http://localhost:3000 --view --only-categories=pwa`
Expected: PWA score should be high (installable criteria met)

**Step 7: Document results**

Create a note in the PR description about local test results.

---

## Task 6: Deploy and test on GitHub Pages

**Files:**
- None (testing only)

**Step 1: Deploy to GitHub Pages**

Run: `npm run deploy` (or your deployment command)

**Step 2: Navigate to deployed site**

Open: https://luxor.github.io/bronepehota/

**Step 3: Check manifest in DevTools**

1. Open DevTools → Application → Manifest
2. Verify:
   - `start_url`: "/bronepehota/"
   - `icons`: All paths start with "/bronepehota/icons/"
   - No 404 errors for icons

**Step 4: Test PWA installability**

1. Run Lighthouse audit: DevTools → Lighthouse → Progressive Web App
2. Verify "Installable" criteria passes
3. Check that "Install" button appears in address bar (Chrome desktop)

**Step 5: Test on Android (if available)**

1. Open https://luxor.github.io/bronepehota/ in Chrome Android
2. Tap menu → "Add to Home Screen" or look for install banner
3. Install and verify app opens in standalone mode

**Step 6: Document test results**

Update the PR or issue with:
- ✅ Manifest loads correctly
- ✅ Icons load without 404s
- ✅ Lighthouse PWA audit passes
- ✅ Install button appears on desktop
- ✅ Install button appears on Android (tested)

---

## Task 7: Update documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add PWA configuration note**

Find the GitHub Pages Deployment section in CLAUDE.md and add:

```markdown
### PWA Configuration

The app uses dynamic manifest generation to support GitHub Pages basePath:

- `next.config.mjs` exports `BASE_PATH` for manifest generation
- `layout.tsx` generates manifest with basePath-aware icon paths
- Static `public/manifest.json` is NOT used (deleted)

To test PWA locally: `npm run build && npm run start`
To verify on GitHub Pages: Check DevTools → Application → Manifest
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add PWA configuration notes

Document dynamic manifest generation approach for GitHub Pages."
```

---

## Task 8: Create final verification

**Files:**
- None (verification only)

**Step 1: Run full test suite**

Run: `npm run validate`
Expected: All tests pass

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 3: Final verification checklist**

- [ ] Build succeeds: `npm run build`
- [ ] TypeScript valid: `npm run type-check`
- [ ] Unit tests pass: `npm run test`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Local manifest correct: Checked in DevTools
- [ ] GitHub Pages manifest correct: All icons load
- [ ] Lighthouse PWA audit passes: 90+ score
- [ ] Install button appears on desktop Chrome
- [ ] Install button appears on Android Chrome

**Step 4: Create PR**

```bash
git push origin battle-redesign
```

Create PR with:
- Title: "fix(pwa): make app installable on GitHub Pages"
- Description: References design doc `docs/plans/2025-02-22-pwa-fix-design.md`
- Include test results from Tasks 5 and 6

---

## Success Criteria

After implementation, the following should be true:

1. **Manifest loads correctly** on both localhost and GitHub Pages
2. **All icons load** without 404 errors (paths include BASE_PATH)
3. **Lighthouse PWA audit** passes with 90+ score
4. **Install button appears** on Chrome desktop and Android
5. **App installs and opens** in standalone mode
6. **No regressions** in existing functionality
