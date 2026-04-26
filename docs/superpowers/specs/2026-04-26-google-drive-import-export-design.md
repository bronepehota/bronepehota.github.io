# Google Drive Import/Export (Revised)

## Context

Supersedes the 2026-04-17 Google Drive backup spec. The original spec proposed full OAuth integration with Google Drive API and Picker API. This revision simplifies to a link-paste approach: no OAuth, no API keys, no third-party dependencies.

**User workflow**: Desktop users export all settings as a JSON file, upload it to Google Drive manually, and share a public link. Mobile users paste that link in the app to import everything.

**Scope**: Export custom army list sources + custom modifiers as a single bundle. Does NOT export assembled armies.

## Approach: Google Drive Link Paste

### Desktop — Export

**Trigger**: Button in the editor (`/editor`) labeled «Экспорт настроек».

**What gets exported**: All user configuration in one file:
- Custom army list sources (from `bronepehota_custom_sources` localStorage)
- Custom modifiers (from modifier storage)

**Format**:
```json
{
  "version": 1,
  "type": "bronepehota_config",
  "exportedAt": "2026-04-26T12:00:00Z",
  "data": {
    "sources": [],
    "modifiers": []
  }
}
```

**File name**: `bronepehota_config_<date>.json` (e.g. `bronepehota_config_2026-04-26.json`)

**Mechanism**: `Blob` + `URL.createObjectURL` + programmatic `<a>` click (standard browser download). No server involved.

**After download**: User uploads the file to Google Drive and creates a public share link. A help modal explains the steps.

### Mobile — Import via Google Drive Link

**Trigger**: Button in the app (`/app`) labeled «Импорт из Drive», visible at any step before battle starts.

**UI flow**:
1. User taps «Импорт из Drive»
2. Input field appears: «Вставьте ссылку Google Drive» + «Загрузить» button
3. App parses URL, extracts FILE_ID
4. Fetches file via `https://drive.google.com/uc?export=download&id=FILE_ID`
5. Validates JSON envelope (`type`, `version`, `data` structure)
6. Imports sources + modifiers into localStorage
7. Shows toast: «Загружено: X армлистов, Y способностей»

**Supported Google Drive URL formats**:
- `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/open?id=FILE_ID`
- `https://drive.google.com/uc?export=download&id=FILE_ID`

**Validation**:
- Check `type === "bronepehota_config"` and `version` is recognized (currently only `1`)
- Verify `data` has `sources` and `modifiers` arrays
- Reject unknown future versions with message to update the app

**Conflict resolution**: Import replaces existing data. If a custom source with the same ID exists locally, it gets overwritten. Confirmation dialog: «Будут заменены существующие армлисты и способности. Продолжить?»

**Error handling**:
- Unrecognized URL → «Неверная ссылка. Скопируйте ссылку общего доступа из Google Drive»
- Download failed → «Не удалось загрузить файл. Убедитесь, что доступ к файлу — „Все, у кого есть ссылка"»
- Invalid JSON → «Файл повреждён или имеет неверный формат»
- Unsupported version → «Обновите приложение для поддержки этого формата»

### User Instructions

**Location**: Help modal opened by «?» button next to export/import buttons. Also accessible via inline hint text.

**Content** (in Russian):

---
**Как перенести настройки с компьютера на телефон**

**Шаг 1 — На компьютере (редактор)**
1. Откройте редактор
2. Нажмите кнопку «Экспорт настроек»
3. Скачается файл `bronepehota_config_<date>.json`

**Шаг 2 — Загрузите файл на Google Drive**
1. Откройте Google Drive
2. Нажмите «+ Создать» → «Загрузить файлы»
3. Выберите скачанный файл
4. Нажмите правой кнопкой на файл → «Доступ» → «Все, у кого есть ссылка»
5. Скопируйте ссылку

**Шаг 3 — На телефоне**
1. Нажмите «Импорт из Drive»
2. Вставьте скопированную ссылку
3. Нажмите «Загрузить»
4. Готово!
---

## Components

| File | Action |
|------|--------|
| `src/lib/config-export.ts` | **new** — serialize config, parse Google Drive URLs, validate envelope |
| `src/components/ConfigExportButton.tsx` | **new** — export button for editor |
| `src/components/ConfigImportFromDrive.tsx` | **new** — link input + fetch + import for mobile |
| `src/components/ImportExportHelp.tsx` | **new** — help modal with step-by-step guide |
| `src/components/editor/EditorLayout.tsx` | modify — add export button + help button |
| `src/app/app/page.tsx` | modify — add import button + help button |

**No changes to**: existing source import/export in editor, service worker, no new npm dependencies.

## Security

- No OAuth tokens, no API keys — nothing to leak
- Google Drive direct download works for publicly shared files only
- All processing client-side, no data sent to any server
- User explicitly shares their file via Google Drive's own sharing mechanism

## Out of Scope

- Export of assembled armies (army builder state)
- Direct Google Drive API integration (OAuth)
- Real-time sync between devices
- Auto-save
- Battle session state backup

## Verification

1. Export from editor → verify JSON downloads with correct structure and all custom data
2. Import via valid Google Drive link → verify sources and modifiers restored
3. Import via invalid URL → verify error message
4. Import with wrong file format → verify error message
5. Import with version mismatch → verify rejection message
6. Conflict (existing source with same ID) → verify confirmation dialog and overwrite
7. Help modal → verify instructions are clear and complete
