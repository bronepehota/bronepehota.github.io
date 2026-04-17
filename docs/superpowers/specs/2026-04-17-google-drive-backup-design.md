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

**Trigger**: Button in ArmyBuilder on `unit-select` step.

**Format**:
```json
{
  "version": 1,
  "type": "army",
  "data": { /* Army object as-is */ },
  "exportedAt": "2026-04-17T12:00:00Z",
  "appVersion": "1.0.0"
}
```

**File name**: `army_<faction>_<totalCost>pts_<date>.json` (e.g. `army_polaris_350pts_2026-04-17.json`)

**Mechanism**: `Blob` + `URL.createObjectURL` + programmatic `<a>` click (standard browser download).

### Army List Import

**Trigger**: Button next to export.

**Mechanism**: Hidden `<input type="file" accept=".json">` triggered by button click. Parse JSON, validate `version` and `type` fields, restore army state.

**Validation**:
- Check `type === "army"` and `version === 1`
- Verify `data` has required Army fields (name, units, totalCost)
- If army contains units from a source that doesn't exist locally, warn user

**Conflict**: Import replaces current army. Show confirmation dialog: "Текущая армия будет заменена. Продолжить?"

### Source Export/Import

Already exists in editor via `ExportModal`/`ImportModal`. No changes needed for Phase 1.

### UI Placement

New section in ArmyBuilder (visible on `unit-select` step):
- Row of icon buttons: Download, Upload
- Compact style matching existing action buttons
- Use Lucide icons: `Download`, `Upload`

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/army-export.ts` | **new** — export/import utility functions |
| `src/components/ArmyBuilder.tsx` | modify — add export/import buttons |
| `src/lib/types.ts` | no changes — reuse existing Army type |

---

## Phase 2: Google Drive Integration

### Prerequisites

- Google Cloud project with OAuth 2.0 client ID
- Enabled APIs: Google Drive API, Google Picker API
- OAuth consent screen configured
- Scope: `drive.file` (access only to app-created files)

### Authentication

**Library**: Google Identity Services (GIS) — loaded via `<Script>` from `accounts.google.com/gsi/client`.

**Flow**:
1. User clicks "Войти в Google"
2. GIS popup requests `drive.file` scope
3. Access token returned to callback
4. Token stored in React state (memory only — no localStorage for security)
5. Token expires after ~1 hour; user re-authenticates on next action

**No refresh tokens** — short-lived sessions align with mobile PWA usage. User re-authenticates when token expires.

### Save to Google Drive

**Trigger**: "Сохранить на Drive" button (visible only when authenticated).

**Flow**:
1. Serialize army/source to JSON (same format as Phase 1)
2. Check if file with same name exists in app folder via `files.list?q=name='...'`
3. If exists: update content via `files.update`
4. If not: create via `files.create` with `parents: ['appDataFolder']` or root Drive

**File naming**:
- Army: `Бронепехота/army_<name>.json`
- Source: `Бронепехота/source_<sourceId>.json`

**Feedback**: Toast notification on success/failure.

### Load from Google Drive

**Option A — Picker API** (recommended):
Google Picker dialog lets user browse and select files from their Drive. Familiar UX.

**Option B — List + Select**:
Fetch files from `Бронепехота/` folder, show list in-app. Simpler but less familiar.

Recommendation: **Option A** for discoverability and familiarity.

### UI

New section "Облако" in ArmyBuilder (below local export/import):
- When not authenticated: "Войти в Google" button with Google icon
- When authenticated: user avatar/name + "Сохранить на Drive" + "Загрузить из Drive"
- Separate section for sources in editor

### Components

| File | Action |
|------|--------|
| `src/components/GoogleDriveAuth.tsx` | **new** — auth button, token management |
| `src/components/GoogleDriveSave.tsx` | **new** — save/load buttons |
| `src/lib/google-drive.ts` | **new** — API wrapper (create, update, list, get) |
| `src/app/layout.tsx` | modify — load GIS script |
| `src/components/ArmyBuilder.tsx` | modify — add cloud section |
| `src/components/editor/EditorLayout.tsx` | modify — add cloud section for sources |

### Security

- `drive.file` scope — app can only access files it created
- Tokens in memory only, never persisted
- Client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var (safe to expose)
- No server-side code needed — all client-side REST API calls

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
1. Export army → verify JSON downloads with correct structure
2. Import JSON → verify army restored correctly
3. Import invalid JSON → verify error handling
4. Import army with unknown source → verify warning shown

### Phase 2
1. Click "Войти в Google" → verify OAuth popup appears
2. Save army to Drive → verify file created in Drive
3. Save again → verify file updated (not duplicated)
4. Load from Drive via Picker → verify army restored
5. Token expired → verify re-auth required
