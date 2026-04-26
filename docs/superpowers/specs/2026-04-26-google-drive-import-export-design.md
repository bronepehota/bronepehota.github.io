# Google Drive Import/Export (Revised)

## Context

Supersedes the 2026-04-17 Google Drive backup spec. The original spec proposed full OAuth integration with Google Drive API and Picker API. This revision uses a file-based approach: no OAuth, no API keys, no third-party dependencies, no CORS issues.

**User workflow**: Desktop users export all settings as a JSON file, upload it to Google Drive (or any cloud). Mobile users download the file from Drive and import it via file picker.

**Scope**: Export custom army list sources + custom modifiers as a single bundle. Does NOT export assembled armies.

**Why not link-paste**: Google Drive's direct download endpoint (`drive.google.com/uc?export=download`) does not serve CORS headers. Client-side `fetch()` is blocked by browsers. Since the app is a static site on GitHub Pages (no server), a proxy route is not available. File picker import is the only technically viable approach.

## Approach: File Download + File Upload via Google Drive

### Desktop — Export

**Trigger**: Button in the editor (`/editor`) labeled «Экспорт настроек».

**What gets exported**: All user configuration in one file:
- Custom army list sources (from `bronepehota_custom_sources` localStorage)
- Custom modifiers (from `bronepehota_custom_modifiers` localStorage)

**Format**:
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

**File name**: `bronepehota_config_YYYY-MM-DD.json` using UTC date from `new Date().toISOString()`.

**Mechanism**: `Blob` + `URL.createObjectURL` + programmatic `<a>` click (standard browser download).

**After download**: User uploads the file to Google Drive (or any cloud storage). A help modal explains the steps.

### Mobile — Import from File

**Trigger**: Button in the app (`/app`) labeled «Импорт настроек», visible in the header when `army.currentStep !== 'battle'`. Small icon button using the Upload icon from Lucide, matching existing header button style.

**UI flow**:
1. User taps «Импорт настроек»
2. System file picker opens (`<input type="file" accept=".json">`)
3. User selects the downloaded `bronepehota_config_*.json` file
4. App reads file via `FileReader`, parses JSON
5. Validates envelope (`type === "bronepehota_config"`, `version` recognized, `data` has `sources` and `modifiers`)
6. Confirmation dialog: «Будут заменены существующие армлисты и способности. Продолжить?»
7. Saves each source via `CustomSourcesStorage.save()` (existing upsert logic)
8. Saves modifiers via `importCustomModifiers()` (existing merge logic)
9. Shows toast: «Загружено: X армлистов, Y способностей»

**Validation**:
- Check `type === "bronepehota_config"` and `version` is recognized (currently only `1`)
- Verify `data.sources` is an array and `data.modifiers` is an object with `buffs`/`debuffs` arrays
- Reject unknown future versions with message: «Обновите приложение для поддержки этого формата»

**Conflict resolution**: Uses existing merge logic — `CustomSourcesStorage.save()` upserts by ID (overwrites matching, preserves others). `importCustomModifiers()` merges buffs/debuffs by ID. The confirmation dialog warns about potential overwrites before starting.

**Error handling**:
- Invalid JSON → «Файл повреждён или имеет неверный формат»
- Wrong `type` field → «Это не файл настроек Бронепехоты»
- Unsupported version → «Обновите приложение для поддержки этого формата»
- File read error → «Не удалось прочитать файл»

### User Instructions

**Location**: Help modal (`ImportExportHelp.tsx`) opened by «?» button next to export/import buttons. Also accessible from the mobile import screen.

**Content** (in Russian):

---
**Как перенести настройки с компьютера на телефон**

**Шаг 1 — На компьютере (редактор)**
1. Откройте редактор
2. Нажмите кнопку «Экспорт настроек»
3. Скачается файл `bronepehota_config_<date>.json`

**Шаг 2 — Загрузите файл на Google Drive**
1. Откройте [Google Drive](https://drive.google.com)
2. Нажмите «+» → «Загрузить файлы»
3. Выберите скачанный файл

**Шаг 3 — На телефоне**
1. Откройте Google Drive и скачайте файл на устройство
2. Откройте Бронепехоту
3. Нажмите «Импорт настроек»
4. Выберите скачанный файл
5. Готово!
---

## Components

| File | Action |
|------|--------|
| `src/lib/config-export.ts` | **new** — serialize config to JSON, validate envelope, parse uploaded file |
| `src/components/editor/ConfigExportButton.tsx` | **new** — export button for editor |
| `src/components/ConfigImportButton.tsx` | **new** — file picker + import for mobile |
| `src/components/modals/ImportExportHelp.tsx` | **new** — help modal with step-by-step guide |
| `src/components/editor/EditorLayout.tsx` | modify — add export button + help button |
| `src/app/app/page.tsx` | modify — add import button in header (visible when not in battle) |

**No changes to**: existing source import/export in editor, service worker, no new npm dependencies.

## Security

- No OAuth tokens, no API keys — nothing to leak
- All processing client-side, no data sent to any server
- File never leaves the user's device during import

## Out of Scope

- Export of assembled armies (army builder state)
- Direct Google Drive API integration (OAuth)
- Link-paste import (blocked by CORS on static site)
- Real-time sync between devices
- Auto-save
- Battle session state backup

## Testing

**Unit tests**: `src/__tests__/lib/config-export.test.ts` covering:
- Envelope creation (correct structure, version, type)
- Envelope validation (valid, missing fields, wrong type, wrong version)
- File name generation (UTC date format)

**Manual verification**:
1. Export from editor → verify JSON downloads with correct structure and all custom data
2. Import valid config file → verify sources and modifiers restored via existing storage methods
3. Import invalid JSON → verify error message
4. Import file with wrong `type` → verify «не файл настроек» message
5. Import with version mismatch → verify rejection message
6. Conflict (existing source with same ID) → verify confirmation dialog and upsert behavior
7. Help modal → verify instructions are clear and complete
