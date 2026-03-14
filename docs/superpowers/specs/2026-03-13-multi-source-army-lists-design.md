# Multi-Source Army List System - Design Spec

**Date:** 2026-03-13
**Status:** Draft
**Author:** Design Discussion with User

## Overview

This document describes the design for supporting multiple army list sources in the Bronepehota wargame app. Different communities (Star System, Tehnolog, homebrew) have their own unit databases with varying stats, factions, and unit names.

## Problem Statement

Currently, the app has only one army list source (Star System community). Players need:

1. **Tehnolog official lists** — Original game units from the manufacturer
2. **Star System lists** — Fan community balances and variants
3. **Custom lists** — User-created homebrew (future: editor feature)

Additional requirements:
- Same unit can have different stats/names/faction across sources
- Selection happens during battle configuration
- Data must be persisted

## Requirements

### Functional Requirements

1. **FR-1:** Support multiple army list sources with independent unit databases
2. **FR-2:** Each source contains its own complete set of factions and units
3. **FR-3:** Source selection is independent from rules version selection
4. **FR-4:** Switching sources clears the current army
5. **FR-5:** Source selection persists globally in localStorage
6. **FR-6:** Fail gracefully with fallback to default source

### Non-Functional Requirements

1. **NFR-1:** Follow existing patterns (mirrors rules-registry.ts)
2. **NFR-2:** MOBILE FIRST design approach
3. **NFR-3:** Minimal UI with external links
4. **NFR-4:** TypeScript type safety where possible

## Architecture

### Design Pattern: Source Registry

The system introduces a new **Source** concept that parallels the existing **Rules** system:

```
Current: Rules Version (game mechanics)
New:      Army List Source (unit database)
```

Both selections are **independent** — players can mix any rules with any source.

### Flow

```
Rules → Source → Faction → Budget → Units → Battle
```

## Data Structure

### Directory Layout

```
src/data/
├── sources/
│   ├── star_system/
│   │   ├── factions.json
│   │   ├── polaris/
│   │   │   ├── squads.json
│   │   │   └── machines.json
│   │   ├── protectorate/
│   │   │   ├── squads.json
│   │   │   └── machines.json
│   │   └── mercenaries/
│   │       ├── squads.json
│   │       └── machines.json
│   └── tehnolog/
│       ├── factions.json
│       └── ... (faction folders)
```

### Source Metadata

Each source has a `source.json` (or embedded in registry):

```typescript
interface ArmyListSource {
  id: SourceID;
  name: string;
  description: string;
  link?: string;
  version: string;
}
```

## Type Definitions

```typescript
// src/lib/types.ts

// Army List Source types
export type SourceID = string; // 'star_system', 'tehnolog', or custom IDs
export type FactionID = string; // Dynamic per source (was union type)

export interface ArmyListSource {
  id: SourceID;
  name: string;
  description: string;
  link?: string;
  version: string;
}

export interface SourceData {
  source: ArmyListSource;
  factions: Faction[];
  squads: Squad[];
  machines: Machine[];
}

// Army state extension
export interface Army {
  // ... existing fields
  sourceId?: SourceID; // Track which source created this army
}
```

## Components

### New Component: `SourceSelector`

**Location:** `src/components/rules/SourceSelector.tsx`

**Responsibilities:**
- Display available sources in minimal accordion cards
- Handle source selection
- Persist to localStorage
- Show disabled state for unavailable sources
- Display external links

**Props:**
```typescript
interface SourceSelectorProps {
  sources: ArmyListSource[];
  selectedSource: SourceID;
  onSourceChange: (id: SourceID) => void;
  onConfirm?: () => void;
}
```

**UI Style:** Mirrors `RulesSelector` with minimal cards

### Modified: `ArmyBuilder`

**Changes:**
1. Add `selectedSource: SourceID` state
2. Add `'source'` to flow steps
3. Load factions/units dynamically based on source
4. Clear army when source changes
5. Update `StepProgressIndicator` to show new step

**New Flow State:**
```typescript
type SetupStep = 'rules' | 'source' | 'faction' | 'budget' | 'units' | 'preparation';
```

### Modified: `FactionSelector`

**Changes:**
- Receive factions as prop (from loaded source)
- Remove hardcoded factions import

### Modified: `StepProgressIndicator`

**Changes:**
- Add "Source" step between "Rules" and "Faction"

## State Management

### localStorage Keys

```typescript
// src/lib/constants.ts
export const LOCAL_STORAGE_KEYS = {
  // ... existing keys
  ARMY_LIST_SOURCE: 'bronepehota_army_list_source',
} as const;
```

### State Flow

```typescript
// In ArmyBuilder
const [selectedSource, setSelectedSource] = useState<SourceID>(() => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ARMY_LIST_SOURCE);
  return saved && isValidSource(saved) ? saved : getDefaultSource();
});

const handleSourceChange = (sourceId: SourceID) => {
  setSelectedSource(sourceId);
  localStorage.setItem(LOCAL_STORAGE_KEYS.ARMY_LIST_SOURCE, sourceId);

  // Clear army - start fresh with new source
  setArmy({
    ...emptyArmy,
    faction: '',
    sourceId,
  });
};
```

## Registry

### `sources-registry.ts`

**Location:** `src/lib/sources-registry.ts`

```typescript
export const sourcesRegistry: Record<SourceID, SourceData> = {
  star_system: { /* loaded from data */ },
  tehnolog: { /* loaded from data */ },
};

export function getDefaultSource(): SourceID {
  return 'star_system';
}

export function getSource(id: SourceID): SourceData | null {
  const source = sourcesRegistry[id];

  // Validate structure
  if (!source?.factions || !Array.isArray(source.factions)) {
    console.error(`Invalid source data for ${id}`);
    return sourcesRegistry[getDefaultSource()] || null;
  }

  return source;
}

export function getAllSources(): ArmyListSource[] {
  return Object.values(sourcesRegistry).map(s => s.source);
}

export function isValidSource(id: string): boolean {
  return Object.keys(sourcesRegistry).includes(id);
}
```

## Initial Release Configuration

### Available Sources

| Source | Status | Notes |
|--------|--------|-------|
| Star System | ✅ Fully functional | Default source |
| Tehnolog | 🔒 Disabled | "Coming Soon - Community help needed" |
| Custom | 📋 Reserved | Future editor feature |

### Disabled State UI

For Tehnolog source:
```tsx
{isDisabled && (
  <div className="text-xs text-amber-400 mt-2">
    🔒 Скоро. Требуется помощь сообщества.
  </div>
)}
```

## Error Handling

### Fallback Behavior

1. **Invalid/missing source ID** → Fall back to `star_system`
2. **Corrupted source data** → Console error, skip source in UI
3. **No valid sources** → Show error message, block progression

### Validation

```typescript
export function getSource(id: SourceID): SourceData | null {
  const source = sourcesRegistry[id];

  if (!source) {
    console.warn(`Source ${id} not found, falling back to default`);
    return sourcesRegistry[getDefaultSource()] || null;
  }

  // Structure validation
  if (!source.factions || !Array.isArray(source.factions)) {
    console.error(`Invalid source data for ${id}`);
    return sourcesRegistry[getDefaultSource()] || null;
  }

  return source;
}
```

## Migration Strategy

### Phase 1: Preparation
1. Create `src/data/sources/star_system/` structure
2. Move existing data to new location
3. Create `sources-registry.ts`
4. Update types (`FactionID = string`)

### Phase 2: Implementation
1. Add `SourceSelector` component
2. Update `ArmyBuilder` flow
3. Update `FactionSelector` to use dynamic factions
4. Add localStorage persistence

### Phase 3: Testing
1. Test source switching
2. Test army clearing on source change
3. Test fallback behavior
4. E2E tests for new flow

## Testing

### Unit Tests

```typescript
// src/__tests__/sources-registry.test.ts
describe('sources-registry', () => {
  test('getDefaultSource returns star_system');
  test('getSource returns valid data for existing source');
  test('getSource returns fallback for invalid source');
  test('isValidSource validates source IDs');
  test('getAllSources returns all registered sources');
});
```

### E2E Tests

```typescript
// e2e/source-selection.spec.ts
test.describe('Source Selection Flow', () => {
  test('selects default source on first visit');
  test('switches source and army is cleared');
  test('shows disabled state for Tehnolog source');
  test('persists source selection across sessions');
  test('shows error when source data is corrupted');
});
```

## Future: Custom Sources (Reserved)

### Storage

User-created sources stored in localStorage:

```typescript
// localStorage key
bronepehota_custom_sources: [
  {
    "id": "custom_my_homebrew",
    "name": "Мой дом. лист",
    "factions": [...],
    "squads": [...],
    "machines": [...]
  }
]
```

### Reserved Features

- Source editor UI (create/edit/delete)
- Import/export JSON
- Validation of custom source structure
- Merge built-in + custom in source registry

## Summary

| Aspect | Implementation |
|--------|----------------|
| Pattern | Source Registry (mirrors Rules) |
| Storage | Built-in: files, Custom: localStorage (future) |
| Selection | New step: Rules → Source → Faction |
| Persistence | `bronepehota_army_list_source` (global) |
| Fallback | Star System (default) |
| Initial sources | Star System ✅, Tehnolog 🔒 |
| Types | `FactionID = string` (dynamic) |

## Open Questions

None at this time.
