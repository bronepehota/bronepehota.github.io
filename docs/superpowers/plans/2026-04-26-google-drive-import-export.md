# Google Drive Import/Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-click save/load of custom army list sources and modifiers via Google Drive, with file-based fallback when Google is unavailable.

**Architecture:** GIS OAuth for Drive access. Single component `GoogleDriveSync` works in export (editor) or import (app) mode. Pure utility `config-export.ts` handles serialization/validation. `google-drive.ts` wraps Drive API calls. All tokens in memory only.

**Tech Stack:** Google Identity Services (GIS via `<Script>`), Drive API v3 (via `fetch`), Next.js `<Script>`, Lucide React icons, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-26-google-drive-import-export-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/config-export.ts` | **new** — Envelope creation, validation, file name generation |
| `src/lib/google-drive.ts` | **new** — GIS auth, Drive API wrapper (upload, list, download) |
| `src/components/GoogleDriveSync.tsx` | **new** — UI component: auth state, save/load, file list, fallback |
| `src/components/modals/ImportExportHelp.tsx` | **new** — Step-by-step help modal |
| `src/app/sw.ts` | **modify** — Exclude Google API domains from caching |
| `src/components/editor/EditorLayout.tsx` | **modify** — Add export button |
| `src/app/app/page.tsx` | **modify** — Add import button in header |
| `src/__tests__/lib/config-export.test.ts` | **new** — Unit tests for config-export |

---

### Task 1: Config Export Utility

**Files:**
- Create: `src/lib/config-export.ts`
- Create: `src/__tests__/lib/config-export.test.ts`

- [ ] **Step 1: Write failing tests for envelope creation and validation**

```typescript
// src/__tests__/lib/config-export.test.ts
import {
  createConfigEnvelope,
  validateConfigEnvelope,
  generateConfigFileName,
  CURRENT_CONFIG_VERSION,
} from '@/lib/config-export';
import { CustomSource } from '@/lib/editor/types';

describe('config-export', () => {
  describe('createConfigEnvelope', () => {
    it('should create envelope with correct structure', () => {
      const sources: CustomSource[] = [];
      const modifiers = { buffs: [], debuffs: [] };

      const envelope = createConfigEnvelope(sources, modifiers);

      expect(envelope.version).toBe(CURRENT_CONFIG_VERSION);
      expect(envelope.type).toBe('bronepehota_config');
      expect(envelope.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(envelope.data.sources).toEqual(sources);
      expect(envelope.data.modifiers).toEqual(modifiers);
    });
  });

  describe('validateConfigEnvelope', () => {
    it('should return valid for correct envelope', () => {
      const envelope = createConfigEnvelope([], { buffs: [], debuffs: [] });
      const result = validateConfigEnvelope(JSON.stringify(envelope));
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid JSON', () => {
      const result = validateConfigEnvelope('not json');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Файл повреждён или имеет неверный формат');
    });

    it('should reject wrong type', () => {
      const envelope = createConfigEnvelope([], { buffs: [], debuffs: [] });
      envelope.type = 'wrong';
      const result = validateConfigEnvelope(JSON.stringify(envelope));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Это не файл настроек Бронепехоты');
    });

    it('should reject future version', () => {
      const envelope = createConfigEnvelope([], { buffs: [], debuffs: [] });
      envelope.version = 999;
      const result = validateConfigEnvelope(JSON.stringify(envelope));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Обновите приложение для поддержки этого формата');
    });

    it('should reject missing data.sources', () => {
      const raw = JSON.stringify({ version: 1, type: 'bronepehota_config', exportedAt: '2026-01-01', data: { modifiers: { buffs: [], debuffs: [] } } });
      const result = validateConfigEnvelope(raw);
      expect(result.valid).toBe(false);
    });

    it('should accept current version', () => {
      const envelope = createConfigEnvelope([], { buffs: [], debuffs: [] });
      const raw = JSON.stringify(envelope);
      const result = validateConfigEnvelope(raw);
      expect(result.valid).toBe(true);
    });
  });

  describe('generateConfigFileName', () => {
    it('should generate filename with UTC date', () => {
      const name = generateConfigFileName();
      expect(name).toMatch(/^bronepehota_config_\d{4}-\d{2}-\d{2}\.json$/);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/__tests__/lib/config-export.test.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Implement config-export.ts**

```typescript
// src/lib/config-export.ts
import { CustomSource } from '@/lib/editor/types';
import { CustomModifiersData } from '@/lib/editor/modifier-storage';

export const CURRENT_CONFIG_VERSION = 1;

export interface ConfigExportEnvelope {
  version: number;
  type: 'bronepehota_config';
  exportedAt: string;
  data: {
    sources: CustomSource[];
    modifiers: CustomModifiersData;
  };
}

export function createConfigEnvelope(
  sources: CustomSource[],
  modifiers: CustomModifiersData
): ConfigExportEnvelope {
  return {
    version: CURRENT_CONFIG_VERSION,
    type: 'bronepehota_config',
    exportedAt: new Date().toISOString(),
    data: { sources, modifiers },
  };
}

export function generateConfigFileName(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `bronepehota_config_${date}.json`;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: ConfigExportEnvelope['data'];
}

export function validateConfigEnvelope(jsonString: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.type !== 'bronepehota_config') {
    return { valid: false, error: 'Это не файл настроек Бронепехоты' };
  }

  if (typeof obj.version !== 'number' || obj.version > CURRENT_CONFIG_VERSION) {
    return { valid: false, error: 'Обновите приложение для поддержки этого формата' };
  }

  if (!obj.data || typeof obj.data !== 'object') {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  const data = obj.data as Record<string, unknown>;
  if (!Array.isArray(data.sources)) {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  const mods = data.modifiers as Record<string, unknown>;
  if (!mods || typeof mods !== 'object') {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  if (!Array.isArray(mods.buffs) || !Array.isArray(mods.debuffs)) {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  return {
    valid: true,
    data: data as ConfigExportEnvelope['data'],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/__tests__/lib/config-export.test.ts --no-coverage`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/config-export.ts src/__tests__/lib/config-export.test.ts
git commit -m "feat: add config export utility with envelope creation and validation"
```

---

### Task 2: Google Drive API Wrapper

**Files:**
- Create: `src/lib/google-drive.ts`

- [ ] **Step 1: Implement google-drive.ts**

This module wraps GIS authentication and Drive API v3 calls. It does NOT manage React state — it provides pure async functions that the component calls.

```typescript
// src/lib/google-drive.ts

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

let gisLoaded = false;

export function isGisAvailable(): boolean {
  return typeof window !== 'undefined' && typeof google !== 'undefined' && !!google.accounts?.oauth2;
}

export function loadGisScript(): Promise<void> {
  if (gisLoaded && isGisAvailable()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      const check = setInterval(() => {
        if (isGisAvailable()) { clearInterval(check); gisLoaded = true; resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('GIS load timeout')); }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (isGisAvailable()) { clearInterval(check); gisLoaded = true; resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('GIS load timeout')); }, 10000);
    };
    script.onerror = () => reject(new Error('GIS script failed to load'));
    document.head.appendChild(script);
  });
}

export function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isGisAvailable()) {
      reject(new Error('GIS not available'));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.access_token);
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

export async function listConfigFiles(token: string): Promise<DriveFile[]> {
  const query = encodeURIComponent("name contains 'bronepehota_config'");
  const url = `${DRIVE_API_BASE}/files?q=${query}&orderBy=modifiedTime desc&spaces=drive&fields=files(id,name,modifiedTime)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json();
  return data.files || [];
}

export async function downloadFile(token: string, fileId: string): Promise<string> {
  const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  return await res.text();
}

export async function uploadConfigFile(
  token: string,
  fileName: string,
  content: string
): Promise<DriveFile> {
  // Check if file with same name exists
  const existing = await listConfigFiles(token);
  const match = existing.find((f) => f.name === fileName);

  const metadata = { name: fileName, mimeType: 'application/json' };
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const body =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    content +
    closeDelim;

  if (match) {
    // Update existing file
    const url = `${DRIVE_UPLOAD_BASE}/files/${match.id}?uploadType=multipart`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    });
    if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
    return await res.json();
  }

  // Create new file
  const url = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  return await res.json();
}
```

- [ ] **Step 2: Add Google types declaration**

Create a minimal type declaration so TypeScript knows about the `google` global:

```typescript
// src/types/google.d.ts
interface GoogleAccountsOAuth2TokenClient {
  requestAccessToken(config: { prompt: string }): void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: { error?: string; access_token: string }) => void;
  }): GoogleAccountsOAuth2TokenClient;
}

interface GoogleAccounts {
  oauth2: GoogleAccountsOAuth2;
}

interface Google {
  accounts: GoogleAccounts;
}

declare var google: Google;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/google-drive.ts src/types/google.d.ts
git commit -m "feat: add Google Drive API wrapper with GIS auth and file operations"
```

---

### Task 3: Help Modal

**Files:**
- Create: `src/components/modals/ImportExportHelp.tsx`

- [ ] **Step 1: Implement ImportExportHelp.tsx**

Simple modal with step-by-step instructions. Uses the same modal pattern as existing modals (e.g., `PanicTestModal.tsx`).

```tsx
// src/components/modals/ImportExportHelp.tsx
'use client';

import { X } from 'lucide-react';

interface ImportExportHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportExportHelp({ isOpen, onClose }: ImportExportHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100">
            Как перенести настройки
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4 text-sm text-slate-300">
          <div>
            <h4 className="font-semibold text-slate-100 mb-2">На компьютере (редактор)</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Откройте редактор</li>
              <li>Нажмите «Сохранить на Drive»</li>
              <li>Войдите в Google, если потребуется</li>
              <li>Готово — настройки сохранены на Google Drive</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 mb-2">На телефоне</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Нажмите «Загрузить из Drive»</li>
              <li>Войдите в Google, если потребуется</li>
              <li>Выберите файл из списка</li>
              <li>Готово!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/modals/ImportExportHelp.tsx
git commit -m "feat: add import/export help modal with step-by-step instructions"
```

---

### Task 4: GoogleDriveSync Component

**Files:**
- Create: `src/components/GoogleDriveSync.tsx`

This is the main component. It handles:
- Auth state (token, loading, errors)
- Save to Drive (export mode)
- Load from Drive (import mode) with file list
- Fallback to file picker when GIS unavailable

- [ ] **Step 1: Implement GoogleDriveSync.tsx**

**NOTE**: This is the most complex file (~300 lines). The implementing agent must write the full component based on the detailed spec below. Unlike Tasks 1-3, complete code is not provided inline — the behavioral spec is detailed enough for implementation.

The component accepts a `mode` prop: `'export'` for editor (desktop) or `'import'` for app (mobile).

**Props:**
```typescript
interface GoogleDriveSyncProps {
  mode: 'export' | 'import';
  onImportComplete?: () => void;
  compact?: boolean;
}
```

**State:**
- `token: string | null` — access token in memory only
- `gisAvailable: boolean | null` — null while loading, true/false after check
- `files: DriveFile[]` — listed files for import mode
- `loading: boolean` — operation in progress
- `error: string | null` — current error message
- `showHelp: boolean` — help modal toggle
- `showConfirm: boolean` — overwrite confirmation (import mode)
- `pendingImportData: ConfigExportEnvelope['data'] | null` — data awaiting confirmation
- `successMessage: string | null` — auto-dismiss after 3s

**Key behaviors:**
- On mount: check `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set AND `isGisAvailable()`. If client ID empty, set `gisAvailable = false` immediately (proactive fallback without attempting GIS load)
- If `gisAvailable === null` (first check), try `loadGisScript()` → set true/false
- If `gisAvailable === false`, show file-based fallback buttons
- Export mode: button «Сохранить на Drive» → auth if needed → upload → success toast
- Import mode: button «Загрузить из Drive» → auth if needed → list files → user selects → download → validate → confirm dialog → import → success toast

**Imports:**
- `@/lib/config-export` — `createConfigEnvelope`, `validateConfigEnvelope`, `generateConfigFileName`, `ConfigExportEnvelope`
- `@/lib/google-drive` — `isGisAvailable`, `loadGisScript`, `requestAccessToken`, `listConfigFiles`, `downloadFile`, `uploadConfigFile`, `DriveFile`
- `@/lib/editor/storage` — `getCustomSourcesStorage`
- `@/lib/editor/modifier-storage` — `getCustomModifiers`, `importCustomModifiers`
- `@/components/modals/ImportExportHelp` — `ImportExportHelp`
- `lucide-react` — icons: `CloudUpload`, `CloudDownload`, `Upload`, `Download`, `HelpCircle`, `Loader2`

**Export flow implementation:**
```
1. Button click → set loading=true, clear error
2. If !token → requestAccessToken(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!)
3. On auth success → store token in state
4. Read sources: getCustomSourcesStorage().getAll()
5. Read modifiers: getCustomModifiers()
6. Create envelope: createConfigEnvelope(sources, modifiers)
7. Upload: uploadConfigFile(token, generateConfigFileName(), JSON.stringify(envelope))
8. Set successMessage = «Настройки сохранены на Google Drive»
9. Auto-dismiss success after 3s via setTimeout
10. On error → set error message
```

**Import flow implementation:**
```
1. Button click → set loading=true, clear error
2. If !token → requestAccessToken(clientId)
3. List files: listConfigFiles(token)
4. If empty → set error = «На Google Drive нет сохранённых настроек...»
5. Set files state → show file list UI
6. User taps file → downloadFile(token, file.id)
7. Validate: validateConfigEnvelope(content)
8. If invalid → set error
9. If valid → set pendingImportData, showConfirm=true
10. User confirms → for each source: getCustomSourcesStorage().save(source)
11. importCustomModifiers(JSON.stringify(pendingImportData.modifiers))
12. Set successMessage = «Загружено: X армлистов, Y способностей»
13. Call onImportComplete?.()
```

**File-based fallback (GIS unavailable):**
- Export: `<Download /> Скачать настройки` → create Blob → download via programmatic `<a>` click (same as existing export modals)
- Import: `<Upload /> Импорт из файла` → hidden `<input type="file" accept=".json">` → FileReader → validateConfigEnvelope → same import flow as steps 9-13

**UI structure (compact mode, GIS available):**
```tsx
// Compact icon button for header
<div className="flex items-center gap-1">
  <button className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 ...">
    {mode === 'export' ? <CloudUpload /> : <CloudDownload />}
  </button>
  <button onClick={() => setShowHelp(true)} className="p-1 ...">
    <HelpCircle className="w-3 h-3" />
  </button>
</div>
```

**UI structure (full mode, GIS available):**
```tsx
<div className="flex flex-col gap-2">
  <div className="flex items-center gap-2">
    <button className="flex items-center gap-2 px-4 py-2 ...">
      {mode === 'export' ? <CloudUpload /> : <CloudDownload />}
      {mode === 'export' ? 'Сохранить на Drive' : 'Загрузить из Drive'}
    </button>
    <button onClick={() => setShowHelp(true)}>
      <HelpCircle />
    </button>
  </div>
  {/* File list for import mode */}
  {/* Error/success messages */}
</div>
```

**Confirmation dialog (import):**
```
«Будут заменены существующие армлисты и способности. Продолжить?»
[Отмена] [Загрузить]
```

**Success message (inline, auto-dismiss 3s):**
```
green-tinted inline div: «Загружено: X армлистов, Y способностей»
```

**Error display (inline):**
```
amber/red-tinted inline div with error text
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/GoogleDriveSync.tsx
git commit -m "feat: add GoogleDriveSync component with auth, save/load, and fallback"
```

---

### Task 5: Service Worker Google API Exclusions

**Files:**
- Modify: `src/app/sw.ts`

- [ ] **Step 1: Add Google API domain exclusions**

The existing service worker at `src/app/sw.ts` has a catch-all `NetworkFirst` entry with a regex `matcher` at the end of `runtimeCaching`. Replace the regex `matcher` with a callback function that excludes Google API domains:

```typescript
// Before (existing catch-all, last entry in runtimeCaching):
{
  matcher: /^https?.*/i,
  handler: new NetworkFirst({
    cacheName: 'offline-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 24, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
},

// After (replace matcher regex with callback):
{
  matcher: ({ url }: { url: URL }) => {
    const excludedHosts = ['accounts.google.com', 'www.googleapis.com', 'content.googleapis.com'];
    if (excludedHosts.includes(url.hostname)) return false;
    return /^https?/i.test(url.href);
  },
  handler: new NetworkFirst({
    cacheName: 'offline-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 24, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
},
```

Important: Read `src/app/sw.ts` first to get the exact existing structure. The `matcher` field in serwist accepts either a RegExp or a `RouteMatchCallback` function `({ url, request, event }) => boolean`. Only change the `matcher` value — keep the `handler` and its plugins exactly as they are.

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds without errors

- [ ] **Step 3: Commit**

```bash
git add src/app/sw.ts
git commit -m "fix: exclude Google API domains from service worker caching"
```

---

### Task 6: Integrate Export into Editor

**Files:**
- Modify: `src/components/editor/EditorLayout.tsx`

- [ ] **Step 1: Add GoogleDriveSync to EditorLayout**

In `EditorLayout.tsx`:

1. Add import at top (around line 21-22, with other component imports):
```typescript
import { GoogleDriveSync } from '@/components/GoogleDriveSync';
import { ImportExportHelp } from '@/components/modals/ImportExportHelp';
```

2. In the **desktop layout** (around line 530-657), find the SourcesList section and add the GoogleDriveSync component nearby. Place it in the header area or as a floating action near the sources list.

Look for where `SourcesList` is rendered and add above or beside it:
```tsx
<GoogleDriveSync mode="export" />
```

3. In the **mobile layout** (around line 660-689), add the GoogleDriveSync component alongside existing import/export buttons:
```tsx
<GoogleDriveSync mode="export" />
```

4. Add the `?` help button next to the GoogleDriveSync component (this is handled inside GoogleDriveSync itself).

- [ ] **Step 2: Verify TypeScript compiles and dev server works**

Run: `npx tsc --noEmit`
Expected: No errors

Run: `npm run dev`
Expected: Editor page loads, export button visible

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/EditorLayout.tsx
git commit -m "feat: add Google Drive export button to editor"
```

---

### Task 7: Integrate Import into App Page

**Files:**
- Modify: `src/app/app/page.tsx`

- [ ] **Step 1: Add GoogleDriveSync to app page header**

In `src/app/app/page.tsx`:

1. Add import at top (around line 10-13):
```typescript
import { GoogleDriveSync } from '@/components/GoogleDriveSync';
```

2. Find the header section (around line 293-482) which renders when `army.currentStep === 'unit-select' || army.currentStep === 'preparation'`.

3. Add the import button in the header actions area (around line 480, before the closing `</header>` tag or alongside existing header buttons):
```tsx
<GoogleDriveSync
  mode="import"
  onImportComplete={() => {
    // Refresh page state after import
    window.location.reload();
  }}
  compact
/>
```

The `compact` prop renders a small icon button matching the existing header style. The `onImportComplete` callback reloads the page to pick up newly imported sources/modifiers from localStorage.

- [ ] **Step 2: Verify TypeScript compiles and dev server works**

Run: `npx tsc --noEmit`
Expected: No errors

Run: `npm run dev`
Expected: App header shows import button, clicking opens auth/file list flow

- [ ] **Step 3: Commit**

```bash
git add src/app/app/page.tsx
git commit -m "feat: add Google Drive import button to app header"
```

---

### Task 8: Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to Build Config

**Files:**
- Modify: `.env.example`
- Modify: `.github/workflows/deploy.yml` (add secret reference)

- [ ] **Step 1: Add env var to .env.example**

```
# Google Drive integration (optional — enables cloud sync)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

- [ ] **Step 2: Add to deploy workflow**

In `.github/workflows/deploy.yml`, add `NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${{ secrets.NEXT_PUBLIC_GOOGLE_CLIENT_ID }}` to the build step env section.

- [ ] **Step 3: Commit**

```bash
git add .env.example .github/workflows/deploy.yml
git commit -m "chore: add NEXT_PUBLIC_GOOGLE_CLIENT_ID to build config"
```

---

### Task 9: Manual Integration Test

- [ ] **Step 1: Test export flow on desktop**

1. Open `http://localhost:3000/editor`
2. Create a custom source with at least one squad
3. Click «Сохранить на Drive»
4. Verify Google OAuth popup appears
5. Authorize
6. Verify success message
7. Check Google Drive — file should exist

- [ ] **Step 2: Test import flow on mobile viewport**

1. Switch browser to mobile viewport (375px)
2. Open `http://localhost:3000/app`
3. Navigate through setup to army builder
4. Click «Загрузить из Drive» in header
5. Verify auth popup or file list appears
6. Select the previously exported file
7. Verify import confirmation dialog
8. Confirm import
9. Verify custom source appears in source selector

- [ ] **Step 3: Test fallback (GIS unavailable)**

1. Block `accounts.google.com` in browser DevTools (Network → Block request URL)
2. Reload editor page
3. Verify fallback «Скачать настройки» button appears
4. Click it → verify JSON file downloads
5. In app, verify «Импорт из файла» button appears
6. Click it → select downloaded file → verify import works

- [ ] **Step 4: Test error cases**

1. Import a non-JSON file → verify error message
2. Import JSON with wrong type → verify «не файл настроек» message
3. Cancel OAuth popup → verify no crash, button returns to idle state
