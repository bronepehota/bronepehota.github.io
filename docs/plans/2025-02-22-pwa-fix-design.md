# PWA Install Fix Design Document

**Date:** 2025-02-22
**Author:** Claude
**Status:** Draft

## Problem

PWA is not installable on GitHub Pages (https://luxor.github.io/bronepehota/). Users report no "Install" button appears on desktop or Android.

### Root Cause

The `public/manifest.json` uses static paths that don't account for GitHub Pages basePath `/bronepehota`:

```json
{
  "start_url": "./",
  "icons": [
    { "src": "/icons/icon-192x192.png", ... }  // ← Wrong: loads from github.io/icons/ instead of github.io/bronepehota/icons/
  ]
}
```

Chrome's PWA installability criteria require:
- Valid manifest file
- Service worker registered
- Icons load successfully (no 404s)
- `start_url` within `scope`

## Solution: Dynamic Manifest Generation

Use Next.js metadata API to generate manifest dynamically with correct basePath-aware paths.

### Architecture

```
next.config.mjs → BASE_PATH = "/bronepehota"
                          ↓
                layout.tsx metadata
                          ↓
          dynamic manifest with correct paths
```

### Implementation

**1. next.config.mjs** - Export BASE_PATH for use in components:

```javascript
const BASE_PATH = process.env.BASE_PATH || '/';

export { BASE_PATH };
```

**2. src/lib/constants.ts** - Re-export BASE_PATH:

```typescript
export { BASE_PATH } from 'next.config.mjs';
```

**3. src/app/layout.tsx** - Generate manifest dynamically:

```typescript
import { BASE_PATH } from '@/lib/constants';

const getManifest = () => ({
  name: 'Бронепехота - Помощник',
  short_name: 'Бронепехота',
  description: 'Приложение для варгейма Бронепехота',
  start_url: BASE_PATH + '/',
  scope: BASE_PATH + '/',
  display: 'standalone',
  theme_color: '#0f172a',
  background_color: '#0f172a',
  lang: 'ru',
  orientation: 'portrait',
  icons: [
    {
      src: BASE_PATH + '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: BASE_PATH + '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: BASE_PATH + '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: BASE_PATH + '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: BASE_PATH + '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: BASE_PATH + '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: BASE_PATH + '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: BASE_PATH + '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: BASE_PATH + '/icons/icon-maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: BASE_PATH + '/icons/icon-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ]
});

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

**4. Delete** `public/manifest.json` (no longer needed).

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD TIME                               │
│  next.config.mjs → BASE_PATH = "/bronepehota"              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME                                  │
│                                                              │
│  1. browser loads: https://luxor.github.io/bronepehota/    │
│                                                              │
│  2. layout.tsx renders with metadata:                       │
│     ┌─────────────────────────────────────────────────┐     │
│     │ manifest = {                                     │     │
│     │   start_url: "/bronepehota/",                    │     │
│     │   icons: ["/bronepehota/icons/icon-192x192.png"]│     │
│     │ }                                                │     │
│     └─────────────────────────────────────────────────┘     │
│                        ↓                                     │
│  3. Next.js generates <link rel="manifest" href="...">      │
│                        ↓                                     │
│  4. Browser downloads manifest → checks installable        │
│     ✓ manifest valid                                         │
│     ✓ icons load (correct paths!)                           │
│     ✓ service worker registered                             │
│                        ↓                                     │
│  5. Chrome shows "Install" button                          │
└─────────────────────────────────────────────────────────────┘
```

### Testing

**Local (no basePath):**
```bash
npm run build
npm run start
# Open http://localhost:3000
# DevTools → Application → Manifest → verify paths
```

**GitHub Pages (with basePath):**
```bash
npm run build
# Deploy
# Open https://luxor.github.io/bronepehota/
# DevTools → Application → Manifest
# Verify: start_url = /bronepehota/, icons load correctly
```

**Installable Check:**
1. Open https://luxor.github.io/bronepehota/
2. Chrome DevTools → Lighthouse → Progressive Web App
3. Should pass: Installable, PWA Optimized
4. "Install" button appears in address bar

### Edge Cases

| Environment | BASE_PATH | Manifest Paths |
|-------------|-----------|----------------|
| Localhost | `/` | `/icons/...` |
| GitHub Pages | `/bronepehota` | `/bronepehota/icons/...` |
| Custom domain | `/` | `/icons/...` |

### Error Handling

- `BASE_PATH` undefined → fallback to `/`
- Missing icon files → build should warn/error
- Invalid manifest → TypeScript type checking

### Files Changed

1. `next.config.mjs` - Export BASE_PATH
2. `src/lib/constants.ts` - Re-export BASE_PATH
3. `src/app/layout.tsx` - Dynamic manifest generation
4. `public/manifest.json` - DELETE

### Success Criteria

- [ ] Manifest loads without 404s on GitHub Pages
- [ ] All icons load successfully
- [ ] Lighthouse PWA audit passes
- [ ] "Install" button appears on Chrome desktop
- [ ] "Install" button appears on Chrome Android
- [ ] App installs and opens in standalone mode
