# Google Drive Import/Export (Revised)

## Context

Supersedes the 2026-04-17 Google Drive backup spec. That spec proposed OAuth with Picker API and required both a Client ID and an API Key. This revision uses only Google Identity Services (GIS) with a single Client ID — no API Key, no Picker API, no third-party dependencies.

**User workflow**: Desktop users save settings to Google Drive with one click (via familiar Google auth popup). Mobile users load settings from Drive with one click — the app lists saved files and the user picks one.

**Scope**: Export custom army list sources + custom modifiers as a single bundle. Does NOT export assembled armies.

## Approach: GIS OAuth + Drive API v3

### Prerequisites (developer, one-time setup)

1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Drive API
3. Create OAuth Client ID (Web application)
4. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var (public, safe for JS bundle)
5. Scope: `drive.file` — app accesses only files it creates and files user selects

### Authentication

**Library**: Google Identity Services (GIS) loaded via `<Script>` from `accounts.google.com/gsi/client`. Lazy-loaded when `GoogleDriveSync` component mounts — not in root layout.

**Flow**:
1. User clicks «Сохранить на Drive» or «Загрузить из Drive»
2. GIS popup requests `drive.file` scope
3. Access token + expiry stored in React state (memory only, never persisted)
4. Before each Drive API call, check `Date.now() > tokenExpiry - 60000` (1-minute buffer). If expired, clear token and re-auth
5. Handle 401 responses as fallback — clear token, prompt re-auth

**Graceful degradation**: If GIS script fails to load (offline, ad blocker), show "Подключение к Google Drive недоступно" and fall back to file-based import/export (file picker).

### Data Format

```typescript
interface ConfigExportEnvelope {
  version: 1;
  type: 'bronepehota_config';
  exportedAt: string; // ISO timestamp
  data: {
    sources: CustomSource[];       // Full CustomSource objects from editor/types.ts
    modifiers: CustomModifiersData; // { buffs: BuffDefinition[], debuffs: DebuffTemplate[] }
  };
}
```

File name on Drive: `bronepehota_config_YYYY-MM-DD.json` (UTC date).

### Desktop — Save to Drive

**Trigger**: Button in editor (`/editor`) labeled «Сохранить на Drive».

**UI flow**:
1. Click «Сохранить на Drive»
2. If not authenticated → Google popup → user allows
3. Serialize all settings (custom sources + modifiers) into JSON envelope
4. Ensure `Бронепехота/` folder exists in Drive root (create if missing via `files.list?q=name='Бронепехота' and mimeType='application/vnd.google-apps.folder'`)
5. Upload file via `files.create` with `parents: ['<folderId>']`
6. Toast: «Настройки сохранены на Google Drive»

**Mechanism**: Drive API v3 multipart upload — metadata + JSON body in single POST to `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.

### Mobile — Load from Drive

**Trigger**: Button in app (`/app`) labeled «Загрузить из Drive», visible in header when `army.currentStep !== 'battle'`. Small icon button using CloudDownload icon from Lucide, matching existing header style.

**UI flow**:
1. Click «Загрузить из Drive»
2. If not authenticated → Google popup → user allows
3. List files in `Бронепехота/` folder: `files.list?q="'<folderId>' in parents and name contains 'bronepehota_config'"&orderBy=modifiedTime desc`
4. Show file list (name + modified date): `bronepehota_config_2026-04-26.json — 26 апр`
5. User taps file → download content via `files.get?alt=media&id=<fileId>`
6. Validate envelope (`type`, `version`, `data` structure)
7. Confirmation dialog: «Будут заменены существующие армлисты и способности. Продолжить?»
8. Save each source via `CustomSourcesStorage.save()` (existing upsert logic)
9. Save modifiers via `importCustomModifiers()` (existing merge logic)
10. Toast: «Загружено: X армлистов, Y способностей»

**Empty state**: «На Google Drive нет сохранённых настроек. Сначала экспортируйте настройки с компьютера.»

**Validation**:
- Check `type === "bronepehota_config"` and `version` is recognized (currently only `1`)
- Verify `data.sources` is an array and `data.modifiers` has `buffs`/`debuffs` arrays
- Reject unknown future versions: «Обновите приложение для поддержки этого формата»

**Conflict resolution**: Uses existing merge logic — `CustomSourcesStorage.save()` upserts by ID, `importCustomModifiers()` merges by ID.

**Error handling**:
- Drive API error → «Нет доступа к Google Drive. Проверьте подключение.»
- Expired token → automatic re-auth prompt
- GIS unavailable → fallback to file picker import
- Invalid JSON → «Файл повреждён или имеет неверный формат»
- Wrong `type` → «Это не файл настроек Бронепехоты»
- Unsupported version → «Обновите приложение для поддержки этого формата»

### Fallback: File-Based Import/Export

When GIS is unavailable (ad blocker, restricted network), both desktop and mobile show file-based alternatives:
- Desktop: «Скачать настройки» → downloads JSON file
- Mobile: «Импорт из файла» → system file picker (`<input type="file" accept=".json">`)

These use the same envelope format and validation logic.

### User Instructions

**Location**: Modal opened by «?» button next to Drive buttons.

**Content** (in Russian):

---
**Как перенести настройки с компьютера на телефон**

**На компьютере (редактор)**
1. Откройте редактор
2. Нажмите «Сохранить на Drive»
3. Войдите в Google, если потребуется
4. Готово — настройки сохранены на Google Drive

**На телефоне**
1. Нажмите «Загрузить из Drive»
2. Войдите в Google, если потребуется
3. Выберите файл из списка
4. Готово!
---

## Components

| File | Action |
|------|--------|
| `src/lib/config-export.ts` | **new** — serialize config, validate envelope, file name generation |
| `src/lib/google-drive.ts` | **new** — GIS auth, Drive API wrapper (auth, create folder, upload, list files, download) |
| `src/components/GoogleDriveSync.tsx` | **new** — unified component with auth state, save/load UI, fallback to file picker |
| `src/components/modals/ImportExportHelp.tsx` | **new** — help modal with step-by-step guide |
| `src/components/editor/EditorLayout.tsx` | modify — add GoogleDriveSync (export mode) + help button |
| `src/app/app/page.tsx` | modify — add GoogleDriveSync (import mode) in header |
| `src/app/sw.ts` | modify — exclude `accounts.google.com`, `www.googleapis.com`, `content.googleapis.com` from caching |

**No new npm dependencies.** GIS and Drive API accessed via standard `<Script>` and `fetch()`.

## Service Worker Consideration

The existing service worker (`src/app/sw.ts`) uses `NetworkFirst` for HTTPS URLs. Google API domains must be excluded from caching:
- `accounts.google.com`
- `www.googleapis.com`
- `content.googleapis.com`

## Security

- `drive.file` scope — app accesses only files it created
- Tokens in memory only, never persisted to localStorage
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is public (restrict to Drive API in Google Console)
- All processing client-side, no server-side code

## Out of Scope

- Export of assembled armies (army builder state)
- Real-time sync between devices
- Collaborative editing
- Auto-save
- Battle session state backup
- Google Picker API (not needed — we list files via API)

## Testing

**Unit tests**: `src/__tests__/lib/config-export.test.ts` covering:
- Envelope creation (correct structure, version, type)
- Envelope validation (valid, missing fields, wrong type, wrong version)
- File name generation (UTC date format)

**Manual verification**:
1. Click «Сохранить на Drive» → verify OAuth popup with `drive.file` scope
2. Save settings → verify file created in `Бронепехота/` folder in Drive
3. Click «Загрузить из Drive» on mobile → verify file list appears
4. Select file → verify sources and modifiers imported correctly
5. Expired token → verify re-auth prompt
6. GIS blocked → verify fallback to file picker
7. Help modal → verify instructions clear and complete
