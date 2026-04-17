# Google Drive Backup for Army Lists and Sources

## Context

Army lists are stored only in `localStorage`. Users lose data when clearing browser data or switching devices. The editor has import/export for sources, but army lists have no export mechanism at all. We need a backup/sync solution that works on mobile-first PWA.

**Goal**: Users can save army lists and custom sources as JSON files, with optional Google Drive integration for cloud backup.

## Approach: Hybrid (two phases)

### Phase 1: Local JSON Export/Import
Simple download/upload of JSON files — works everywhere, no dependencies.

### Phase 2: Google Drive Integration (optional)
OAuth-based save/load from Google Drive — convenience layer on top of Phase 1.

---

## Phase 1: Local JSON Export/Import

### Army List Export

**Trigger**: Button inside `UnitSelector.tsx` on the `unit-select` step. (UnitSelector directly owns the army data and renders the UI — adding buttons there avoids extra prop drilling.)

**Format**:
```json
{
  "version": 1,
  "type": "army",
  "data": { /* Army object */ },
  "exportedAt": "2026-04-17T12:00:00Z"
}
```

Note: `appVersion` field omitted — there is no version constant in the codebase and a hardcoded string would rot. The `version` field handles forward compatibility.

**File name**: `army_<faction>_<totalCost>pts_<date>.json` (e.g. `army_polaris_350pts_2026-04-17.json`). Uses raw `FactionID` string (not display name) for consistency and filesystem safety.

**Mechanism**: `Blob` + `URL.createObjectURL` + programmatic `<a>` click (standard browser download).

### Army List Import

**Trigger**: Button next to export, inside `UnitSelector.tsx`.

**Mechanism**: Hidden `<input type="file" accept=".json">` triggered by button click. Parse JSON, validate envelope, restore army state.

**Validation**:
- Check `type === "army"` and `version` is a recognized version (currently only `1`)
- Verify `data` has required Army fields (name, units, totalCost)
- Import accepts `version <= CURRENT_VERSION`. Unknown future versions are rejected with a message to update the app.

**Runtime state reset**: Import always strips battle state. After import:
- `isInBattle` → `false`
- `currentTurn` → `1`
- All per-unit runtime fields reset: `deadSoldiers`, `actionsUsed`, `activeDebuffs`, `activeBuffs`, `soldierModifiers`, `machineShotsUsed`, `machineWeaponShots`, `isMachineShot/Moved/Melee/Done`, `durability` → max, `ammo` → max
- Only army composition preserved: units (template data), faction, sourceId, pointBudget, name

**Unknown source warning**: If army references a source not present locally (built-in or custom), show warning. For custom sources, suggest: "Импортируйте источник через Редактор → Импорт перед загрузкой армии."

**Conflict**: Import replaces current army. Confirmation dialog: "Текущая армия будет заменена. Продолжить?"

### Source Export/Import

Already exists in editor via `ExportModal`/`ImportModal`. No changes needed for Phase 1.

### UI Placement

Inside `UnitSelector.tsx` — row of icon buttons alongside existing army management actions:
- Icons: `Download` (export), `Upload` (import)
- Compact style matching existing action buttons
- Visible only on `unit-select` step

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/army-export.ts` | **new** — export/import utility functions, runtime state stripping |
| `src/components/UnitSelector.tsx` | modify — add export/import buttons |

---

## Phase 2: Google Drive Integration

### Prerequisites

- Google Cloud project with OAuth 2.0 client ID
- Enabled APIs: Google Drive API, Google Picker API
- OAuth consent screen configured
- Scope: `drive.file` (app can access files it creates and files user selects via Picker)
- **Two env vars needed**:
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — OAuth client ID (safe to expose in JS bundle)
  - `NEXT_PUBLIC_GOOGLE_API_KEY` — API key for Picker API (distinct from OAuth client ID; restrict to Drive API in Google Console)
- Add both to `.env.example` and `.github/workflows/deploy.yml` as secrets

### Authentication

**Library**: Google Identity Services (GIS) — loaded via `<Script>` from `accounts.google.com/gsi/client` in `GoogleDriveIntegration.tsx` (not in root layout — lazy load only when component mounts).

**Flow**:
1. User clicks "Войти в Google"
2. GIS popup requests `drive.file` scope
3. Access token + expiry timestamp stored in React state (memory only)
4. Before each Drive API call, check `Date.now() > tokenExpiry - 60000` (1-minute buffer). If expired, clear token and prompt re-auth.
5. Handle 401 responses as fallback — clear token, prompt re-auth

**Graceful degradation**: If GIS script fails to load (offline, ad blocker, restricted network), show "Подключение к Google Drive недоступно" and hide auth buttons. Local export/import (Phase 1) remains fully functional.

### Save to Google Drive

**Trigger**: "Сохранить на Drive" button (visible only when authenticated).

**Flow**:
1. Serialize army to JSON (same format as Phase 1, with runtime state stripped)
2. Ensure `Бронепехота/` folder exists in root Drive (create if missing via `files.list?q=name='Бронепехота' and mimeType='application/vnd.google-apps.folder'`)
3. Check if file exists in folder: `files.list?q=name='<filename>' and '<folderId>' in parents`
4. If exists: update via `files.update`
5. If not: create via `files.create` with `parents: ['<folderId>']`

**File naming**:
- Army: `army_<name>.json`
- Source: `source_<sourceId>.json`

All files placed in visible `Бронепехота/` folder — user can browse files in Drive directly.

**Feedback**: Toast notification on success/failure.

### Load from Google Drive

**Picker API**: Google Picker dialog lets user browse and select files from `Бронепехота/` folder. Familiar UX, requires `NEXT_PUBLIC_GOOGLE_API_KEY` (developer key).

**`drive.file` scope clarification**: With this scope, the app can access: (a) files it created, and (b) files the user explicitly selects via Picker. It cannot browse all Drive files.

### UI

Single component `GoogleDriveIntegration.tsx` in ArmyBuilder (below local export/import buttons):
- When not authenticated: "Войти в Google" button
- When authenticated: user email + "Сохранить на Drive" + "Загрузить из Drive"
- When GIS unavailable: message only, no auth buttons

### Service Worker Consideration

The existing service worker (`src/app/sw.ts`) uses `NetworkFirst` for all HTTPS URLs. Google API domains (`accounts.google.com`, `www.googleapis.com`) must be excluded from caching. Add route exclusions in the service worker config for:
- `accounts.google.com`
- `www.googleapis.com`
- `content.googleapis.com` (Picker)

### Components

| File | Action |
|------|--------|
| `src/components/GoogleDriveIntegration.tsx` | **new** — auth, save, load in single component |
| `src/lib/google-drive.ts` | **new** — API wrapper (auth, create, update, list, picker) |
| `src/components/UnitSelector.tsx` | modify — add cloud section |
| `src/components/editor/EditorLayout.tsx` | modify — add cloud section for sources |

### Security

- `drive.file` scope — app accesses files it created + user-selected files via Picker
- Tokens in memory only, never persisted to localStorage
- Client ID and API key are public (restrict API key to Drive API only in Google Console)
- No server-side code — all client-side REST API calls

---

## Out of Scope

- Real-time sync between devices
- Collaborative editing
- Sharing army lists with other users via link
- Auto-save to Drive on every change
- Backup of game session state (battle progress)

---

## Verification

### Phase 1
1. Export army → verify JSON downloads with correct structure and `version: 1`
2. Import JSON → verify army restored with runtime state stripped (no battle data)
3. Import invalid JSON → verify error message
4. Import army with unknown source → verify warning with suggestion to import source first
5. Import army with version > current → verify rejection with "update app" message

### Phase 2
1. Click "Войти в Google" → verify OAuth popup appears with `drive.file` scope
2. Save army to Drive → verify file created in `Бронепехота/` folder in Drive
3. Save again → verify file updated (not duplicated)
4. Load from Drive via Picker → verify army restored correctly
5. Token expired → verify re-auth prompt before API call
6. GIS script blocked (ad blocker) → verify graceful degradation message
7. Service worker → verify Google API calls are not cached
