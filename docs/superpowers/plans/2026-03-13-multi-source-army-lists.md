# Multi-Source Army List System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for multiple army list sources (Star System, Tehnolog, custom) with independent unit databases and dynamic faction loading.

**Architecture:** Source Registry pattern mirroring the existing Rules Registry. Each source contains its own factions and units. Selection happens in a new step between Rules and Faction in the battle configuration flow.

**Tech Stack:** TypeScript, Next.js 14, React 18, Tailwind CSS, Jest, Playwright

---

## File Structure Overview

### New Files
- `src/lib/sources-registry.ts` — Source data registry and utility functions
- `src/components/rules/SourceSelector.tsx` — Source selection UI component
- `src/data/sources/star_system/factions.json` — Star System factions (moved)
- `src/data/sources/star_system/polaris/squads.json` — Star System Polaris squads (moved)
- `src/data/sources/star_system/polaris/machines.json` — Star System Polaris machines (moved)
- `src/data/sources/star_system/protectorate/squads.json` — Star System Protectorate squads (moved)
- `src/data/sources/star_system/protectorate/machines.json` — Star System Protectorate machines (moved)
- `src/data/sources/star_system/mercenaries/squads.json` — Star System Mercenaries squads (moved)
- `src/data/sources/star_system/mercenaries/machines.json` — Star System Mercenaries machines (moved)
- `src/data/sources/tehnolog/factions.json` — Tehnolog factions (placeholder)
- `src/__tests__/sources-registry.test.ts` — Unit tests for source registry

### Modified Files
- `src/lib/types.ts` — Add SourceID, ArmyListSource, SourceData types; change FactionID to string
- `src/lib/constants.ts` — Add ARMY_LIST_SOURCE localStorage key
- `src/components/rules/RulesSelector.tsx` — No changes (for reference)
- `src/components/ArmyBuilder.tsx` — Add source selection step and state
- `src/components/rules/StepProgressIndicator.tsx` — Add "Source" step to progress
- `src/components/controls/FactionSelector.tsx` — Accept factions as prop instead of importing
- `src/lib/encyclopedia-utils.ts` — Update imports for new data paths
- `e2e/source-selection.spec.ts` — E2E tests for source selection flow

---

## Chunk 1: Type Definitions and Constants

### Task 1.1: Update Type Definitions

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add source-related types after line 3 (after FactionID type)**

```typescript
// Army List Source types
export type SourceID = string; // 'star_system', 'tehnolog', or custom IDs
export type FactionID = string; // Dynamic per source (was union type)
```

- [ ] **Step 2: Add ArmyListSource and SourceData interfaces after EncyclopediaData interface (around line 45)**

```typescript
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
```

- [ ] **Step 3: Add sourceId to Army interface (find Army interface, add sourceId field)**

The Army interface is around line 207. Add `sourceId?: SourceID;` field.

- [ ] **Step 4: Run type check**

```bash
npm run type-check
```

Expected: Should show errors in files that use FactionID as union type. This is expected — we'll fix those in later tasks.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add source-related types to types.ts

- Add SourceID, ArmyListSource, SourceData types
- Change FactionID from union to string for dynamic sources
- Add sourceId field to Army interface

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 1.2: Update Constants

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add ARMY_LIST_SOURCE key to LOCAL_STORAGE_KEYS**

Find the LOCAL_STORAGE_KEYS object and add:

```typescript
ARMY_LIST_SOURCE: 'bronepehota_army_list_source',
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: PASS (constants should compile)

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add ARMY_LIST_SOURCE localStorage key

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: Source Registry

### Task 2.1: Create Source Data Files

**Files:**
- Create: `src/data/sources/star_system/factions.json`
- Create: `src/data/sources/star_system/polaris/squads.json`
- Create: `src/data/sources/star_system/polaris/machines.json`
- Create: `src/data/sources/star_system/protectorate/squads.json`
- Create: `src/data/sources/star_system/protectorate/machines.json`
- Create: `src/data/sources/star_system/mercenaries/squads.json`
- Create: `src/data/sources/star_system/mercenaries/machines.json`
- Create: `src/data/sources/tehnolog/factions.json`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p src/data/sources/star_system/polaris
mkdir -p src/data/sources/star_system/protectorate
mkdir -p src/data/sources/star_system/mercenaries
mkdir -p src/data/sources/tehnolog
```

- [ ] **Step 2: Copy existing factions.json to new location**

```bash
cp src/data/factions.json src/data/sources/star_system/factions.json
```

- [ ] **Step 3: Copy existing squad/machine files to new location**

```bash
cp src/data/polaris/squads.json src/data/sources/star_system/polaris/squads.json
cp src/data/polaris/machines.json src/data/sources/star_system/polaris/machines.json
cp src/data/protectorate/squads.json src/data/sources/star_system/protectorate/squads.json
cp src/data/protectorate/machines.json src/data/sources/star_system/protectorate/machines.json
cp src/data/mercenaries/squads.json src/data/sources/star_system/mercenaries/squads.json
cp src/data/mercenaries/machines.json src/data/sources/star_system/mercenaries/machines.json
```

- [ ] **Step 4: Validate all JSON files are well-formed**

```bash
# Validate all copied JSON files
for file in src/data/sources/star_system/**/*.json; do
  echo "Validating $file..."
  python3 -m json.tool "$file" > /dev/null && echo "✓ Valid" || echo "✗ Invalid"
done

# Validate Tehnolog file
python3 -m json.tool src/data/sources/tehnolog/factions.json > /dev/null && echo "✓ Tehnolog factions.json valid"
```

Expected: All files show "✓ Valid"

If any file shows "✗ Invalid", fix the JSON syntax before proceeding.

- [ ] **Step 5: Create placeholder Tehnolog factions.json**

```bash
cat > src/data/sources/tehnolog/factions.json << 'EOF'
[
  {
    "id": "polis",
    "name": "Полис",
    "color": "#ef4444",
    "symbol": "Temple",
    "description": "Скоро. Требуется помощь сообщества.",
    "homeWorld": "Полис-Прайм",
    "motto": "TBD"
  }
]
EOF
```

- [ ] **Step 6: Verify files exist**

```bash
ls -la src/data/sources/star_system/
ls -la src/data/sources/tehnolog/
```

Expected: All files listed

- [ ] **Step 7: Commit**

```bash
git add src/data/sources/
git commit -m "feat: create source data directory structure

- Create star_system source with existing factions and units
- Create tehnolog source placeholder

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2.2: Create Source Registry

**Files:**
- Create: `src/lib/sources-registry.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/sources-registry.test.ts`:

```typescript
import { getDefaultSource, getSource, getAllSources, isValidSource } from '../lib/sources-registry';

describe('sources-registry', () => {
  test('getDefaultSource returns star_system', () => {
    const result = getDefaultSource();
    expect(result).toBe('star_system');
  });

  test('getSource returns valid data for existing source', () => {
    const result = getSource('star_system');
    expect(result).not.toBeNull();
    expect(result?.source.id).toBe('star_system');
    expect(result?.factions).toBeDefined();
    expect(result?.squads).toBeDefined();
    expect(result?.machines).toBeDefined();
  });

  test('getSource returns fallback for invalid source', () => {
    const result = getSource('nonexistent');
    expect(result).not.toBeNull();
    expect(result?.source.id).toBe('star_system');
  });

  test('isValidSource validates source IDs', () => {
    expect(isValidSource('star_system')).toBe(true);
    expect(isValidSource('tehnolog')).toBe(true);
    expect(isValidSource('nonexistent')).toBe(false);
  });

  test('getAllSources returns all registered sources', () => {
    const result = getAllSources();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].name).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- sources-registry.test.ts
```

Expected: FAIL with "Cannot find module '../lib/sources-registry'"

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/sources-registry.ts`:

```typescript
import { SourceID, SourceData, ArmyListSource, Faction, Squad, Machine } from './types';
import starSystemFactions from '@/data/sources/star_system/factions.json';
import starSystemPolarisSquads from '@/data/sources/star_system/polaris/squads.json';
import starSystemPolarisMachines from '@/data/sources/star_system/polaris/machines.json';
import starSystemProtectorateSquads from '@/data/sources/star_system/protectorate/squads.json';
import starSystemProtectorateMachines from '@/data/sources/star_system/protectorate/machines.json';
import starSystemMercenariesSquads from '@/data/sources/star_system/mercenaries/squads.json';
import starSystemMercenariesMachines from '@/data/sources/star_system/mercenaries/machines.json';
import tehnologFactions from '@/data/sources/tehnolog/factions.json';

// Type assertions
const typedStarSystemFactions = starSystemFactions as Faction[];
const typedStarSystemSquads = [
  ...starSystemPolarisSquads,
  ...starSystemProtectorateSquads,
  ...starSystemMercenariesSquads
] as Squad[];
const typedStarSystemMachines = [
  ...starSystemPolarisMachines,
  ...starSystemProtectorateMachines,
  ...starSystemMercenariesMachines
] as Machine[];
const typedTehnologFactions = tehnologFactions as Faction[];

// Star System source metadata
const starSystemSource: ArmyListSource = {
  id: 'star_system',
  name: 'Star System',
  description: 'Армейские листы от сообщества Star System',
  link: 'https://vk.com/star_system',
  version: '1.0'
};

// Tehnolog source metadata
const tehnologSource: ArmyListSource = {
  id: 'tehnolog',
  name: 'Технолог',
  description: 'Официальные армейские листы от компании Технолог',
  version: '1.0'
};

// Sources registry
export const sourcesRegistry: Record<SourceID, SourceData> = {
  star_system: {
    source: starSystemSource,
    factions: typedStarSystemFactions,
    squads: typedStarSystemSquads,
    machines: typedStarSystemMachines
  },
  tehnolog: {
    source: tehnologSource,
    factions: typedTehnologFactions,
    squads: [],
    machines: []
  }
};

// Get default source
export function getDefaultSource(): SourceID {
  return 'star_system';
}

// Get source by ID with fallback
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

// Get all available sources
export function getAllSources(): ArmyListSource[] {
  return Object.values(sourcesRegistry).map(s => s.source);
}

// Validate if a string is a valid source ID
export function isValidSource(id: string): boolean {
  return Object.keys(sourcesRegistry).includes(id);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- sources-registry.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/sources-registry.ts src/__tests__/sources-registry.test.ts
git commit -m "feat: implement source registry

- Add sourcesRegistry with star_system and tehnolog sources
- Implement getDefaultSource, getSource, getAllSources, isValidSource
- Add fallback behavior for invalid sources
- Add unit tests

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: Source Selector Component

### Task 3.1: Create SourceSelector Component

**Files:**
- Create: `src/components/rules/SourceSelector.tsx`

- [ ] **Step 1: Create SourceSelector component**

Create `src/components/rules/SourceSelector.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { ExternalLink, Lock, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { ArmyListSource, SourceID } from '@/lib/types';
import { FloatingContinueButton } from '../controls/FloatingContinueButton';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

interface SourceSelectorProps {
  sources: ArmyListSource[];
  selectedSource: SourceID;
  onSourceChange: (id: SourceID) => void;
  onConfirm?: () => void;
}

// Sources that are disabled
const DISABLED_SOURCES: Set<SourceID> = new Set(['tehnolog']);

export function SourceSelector({
  sources,
  selectedSource,
  onSourceChange,
  onConfirm,
}: SourceSelectorProps) {
  const [expandedSourceId, setExpandedSourceId] = useState<SourceID | null>(null);
  const debouncedSaveRef = useRef<NodeJS.Timeout>();

  // Auto-expand selected source on mount
  useEffect(() => {
    if (selectedSource && expandedSourceId !== selectedSource) {
      setExpandedSourceId(selectedSource);
    }
  }, [selectedSource, expandedSourceId]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, []);

  const handleSourceClick = (sourceId: SourceID, isDisabled: boolean) => {
    if (isDisabled) return;

    onSourceChange(sourceId);
    setExpandedSourceId(sourceId === expandedSourceId ? null : sourceId);

    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ARMY_LIST_SOURCE, sourceId);
    }, 300);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, sourceId: SourceID, isDisabled: boolean) => {
    if (isDisabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSourceClick(sourceId, isDisabled);
    } else if (e.key === 'Escape' && expandedSourceId === sourceId) {
      setExpandedSourceId(null);
    }
  };

  // Get selected source for styling
  const selectedSourceData = sources.find(s => s.id === selectedSource);
  const accentColor = selectedSourceData?.id === 'tehnolog' ? '#f59e0b' : '#10b981';

  return (
    <>
      <div id="source-selector" className="space-y-4 max-w-2xl mx-auto pb-32">
        {/* Compact Header */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-px flex-1 bg-slate-700/50" />
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-300 font-mono tracking-wider">ИСТОЧНИК</span>
          </div>
          <div className="h-px flex-1 bg-slate-700/50" />
        </div>

        {/* Source Version Selector - Compact accordion style */}
        <div className="space-y-2">
          {sources.map((source) => {
            const isSelected = selectedSource === source.id;
            const isExpanded = expandedSourceId === source.id;
            const isDisabled = DISABLED_SOURCES.has(source.id);

            return (
              <div
                key={source.id}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-pressed={isSelected}
                aria-expanded={isExpanded}
                onKeyDown={(e) => handleKeyDown(e, source.id, isDisabled)}
                onClick={() => handleSourceClick(source.id, isDisabled)}
                data-testid={`source-card-${source.id}`}
                className={clsx(
                  'relative group transition-all duration-200',
                  'rounded-lg border overflow-hidden',
                  isSelected ? 'ring-1' : 'hover:border-slate-600',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  borderColor: isSelected ? (source.id === 'tehnolog' ? '#f59e0b' : '#10b981') : '#334155',
                  backgroundColor: isSelected ? `${(source.id === 'tehnolog' ? '#f59e0b' : '#10b981')}10` : 'rgba(30, 41, 59, 0.6)',
                  ...(isSelected && { ringColor: `${(source.id === 'tehnolog' ? '#f59e0b' : '#10b981')}50` })
                }}
              >
                {/* Main row - always visible */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {/* Selection indicator */}
                    <div
                      className={clsx(
                        'w-5 h-5 rounded flex items-center justify-center border-2 transition-all',
                        isSelected ? 'border-current' : 'border-slate-600'
                      )}
                      style={{ borderColor: isSelected ? (source.id === 'tehnolog' ? '#f59e0b' : '#10b981') : undefined }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" style={{ color: source.id === 'tehnolog' ? '#f59e0b' : '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <h3 className={clsx(
                        'font-mono font-bold text-sm tracking-wide',
                        isSelected ? '' : 'text-slate-400'
                      )} style={isSelected ? { color: source.id === 'tehnolog' ? '#f59e0b' : '#10b981' } : undefined}>
                        {source.name}
                      </h3>
                    </div>

                    {isDisabled && (
                      <Lock className="w-4 h-4 text-amber-400 ml-2" />
                    )}
                  </div>

                  {!isDisabled && (
                    <svg className={clsx(
                      'w-4 h-4 text-slate-500 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && !isDisabled && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                      {source.description}
                    </p>
                    {source.link && (
                      <a
                        href={source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Подробнее →
                      </a>
                    )}
                  </div>
                )}

                {/* Disabled message */}
                {isDisabled && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
                    <p className="text-xs text-amber-400 leading-relaxed">
                      🔒 Скоро. Требуется помощь сообщества.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating confirm button - fixed at bottom */}
      {onConfirm && (
        <FloatingContinueButton
          text="Выбрать источник"
          tooltip="Выбрать источник"
          accentColor={accentColor}
          onClick={onConfirm}
          dataTestid="source-confirm-button"
          icon={<ArrowRight className="w-4 h-4" />}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/rules/SourceSelector.tsx
git commit -m "feat: add SourceSelector component

- Minimal accordion-style UI matching RulesSelector
- Disabled state for Tehnolog source with lock icon
- External links to source communities
- Persists selection to localStorage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: Update Existing Components

### Task 4.1: Update StepProgressIndicator

**Files:**
- Modify: `src/components/rules/StepProgressIndicator.tsx`

- [ ] **Step 1: Update steps array (lines 15-21)**

Replace the existing `steps` array:
```typescript
const steps: Step[] = [
  { id: 1, label: 'Правила', description: 'Выберите версию правил', icon: Book },
  { id: 2, label: 'Фракция', description: 'Выберите сторону конфликта', icon: Shield },
  { id: 3, label: 'Бюджет', description: 'Установите лимит очков армии', icon: Coins },
  { id: 4, label: 'Армия', description: 'Соберите свою армию', icon: Users },
  { id: 5, label: 'Расстановка', description: 'Подготовьте войска к бою', icon: Sword },
];
```

With:
```typescript
const steps: Step[] = [
  { id: 1, label: 'Правила', description: 'Выберите версию правил', icon: Book },
  { id: 2, label: 'Источник', description: 'Выберите армейские листы', icon: Shield },
  { id: 3, label: 'Фракция', description: 'Выберите сторону конфликта', icon: Shield },
  { id: 4, label: 'Бюджет', description: 'Установите лимит очков армии', icon: Coins },
  { id: 5, label: 'Армия', description: 'Соберите свою армию', icon: Users },
  { id: 6, label: 'Расстановка', description: 'Подготовьте войска к бою', icon: Sword },
];
```

- [ ] **Step 2: Update currentStep type (line 24)**

Replace:
```typescript
currentStep: 'faction' | 'budget' | 'rules' | 'units' | 'preparation' | 'complete';
```

With:
```typescript
currentStep: 'faction' | 'budget' | 'rules' | 'source' | 'units' | 'preparation' | 'complete';
```

- [ ] **Step 3: Update getStepIndex function (lines 48-58)**

Replace the entire `getStepIndex` function with:
```typescript
  const getStepIndex = (): number => {
    switch (currentStep) {
      case 'rules': return 0;
      case 'source': return 1;
      case 'faction': return 2;
      case 'budget': return 3;
      case 'units': return 4;
      case 'preparation':
      case 'complete': return 5;
      default: return 0;
    }
  };
```

- [ ] **Step 4: Run type check**

```bash
npm run type-check
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/rules/StepProgressIndicator.tsx
git commit -m "feat: add Source step to StepProgressIndicator

- Add 'source' step between rules and faction
- Update step indices for 6-step flow
- Update currentStep type to include 'source'

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4.2: Update FactionSelector

**Files:**
- Modify: `src/components/controls/FactionSelector.tsx`

**Note:** FactionSelector already accepts `factions` as a prop (line 10). This task verifies it's ready for dynamic use and removes any hardcoded imports if present.

- [ ] **Step 1: Check for hardcoded faction imports**

```bash
head -20 src/components/controls/FactionSelector.tsx | grep -i "import"
```

Expected output should show:
- `import type { Faction, FactionID } from '@/lib/types';` ✅ acceptable (type import)
- ❌ NOT acceptable: `import factionsData from '@/data/factions.json';`
- ❌ NOT acceptable: Any direct JSON import of faction data

If unacceptable imports are found, remove them and use the `factions` prop instead.

- [ ] **Step 2: Verify factions prop is used throughout**

Check these key usages:
- Line 35: `factions` in props destructuring ✅
- Line 105: `factions.map((faction) => ...)` ✅
- Line 240: `factions.find(f => f.id === selectedFaction)` ✅

No changes needed - component is ready.

- [ ] **Step 3: Run type check**

```bash
npm run type-check
```

Expected: PASS

Note: No commit needed - no changes were made to this file.

---

### Task 4.3: Update ArmyBuilder

**Files:**
- Modify: `src/components/ArmyBuilder.tsx`

- [ ] **Step 1: Add source-related imports (after line 19)**

Add after existing imports:
```typescript
import { getAllSources, getSource, isValidSource, getDefaultSource } from '@/lib/sources-registry';
import { SourceSelector } from './rules/SourceSelector';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import type { SourceID } from '@/lib/types';
```

- [ ] **Step 2: Update setupStep state type (line 90)**

Replace:
```typescript
const [setupStep, setSetupStep] = useState<'rules' | 'faction' | 'budget' | 'units' | 'preparation'>(() => {
```

With:
```typescript
const [setupStep, setSetupStep] = useState<'rules' | 'source' | 'faction' | 'budget' | 'units' | 'preparation'>(() => {
```

- [ ] **Step 3: Add selectedSource state (after line 87, before setupStep)**

Insert:
```typescript
  // Source selection state - persisted in localStorage
  const [selectedSource, setSelectedSource] = useState<SourceID>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ARMY_LIST_SOURCE);
      return saved && isValidSource(saved) ? saved : getDefaultSource();
    }
    return getDefaultSource();
  });
```

- [ ] **Step 4: Add source data loading (after selectedSource state)**

Insert:
```typescript
  // Load factions from selected source
  const sourceData = getSource(selectedSource);
  const availableFactions = sourceData?.factions || [];

  // Error handling: if sourceData is null, getSource already fell back to default
  // Log warning for debugging
  useEffect(() => {
    if (!sourceData) {
      console.warn(`Source data not found for ${selectedSource}, using fallback`);
    }
  }, [selectedSource, sourceData]);
```

- [ ] **Step 5: Add handleSourceChange function (after handleXxx functions)**

Find the end of the toggle handler functions and insert:
```typescript
  const handleSourceChange = (sourceId: SourceID) => {
    setSelectedSource(sourceId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ARMY_LIST_SOURCE, sourceId);

    // Clear army - start fresh with new source
    setArmy({
      name: army.name,
      faction: '',
      units: [],
      totalCost: 0,
      sourceId,
      pointBudget: army.pointBudget,
      currentStep: 'faction-select',
    });
    setSetupStep('faction');
  };
```

- [ ] **Step 6: Remove hardcoded faction imports (lines 5-11)**

Remove these lines:
```typescript
import polairsSquads from '@/data/polaris/squads.json';
import polairsMachines from '@/data/polaris/machines.json';
import protectorateSquads from '@/data/protectorate/squads.json';
import protectorateMachines from '@/data/protectorate/machines.json';
import mercenariesSquads from '@/data/mercenaries/squads.json';
import mercenariesMachines from '@/data/mercenaries/machines.json';
import factionsData from '@/data/factions.json';
```

- [ ] **Step 7: Remove type assertions (lines 21-24)**

Remove:
```typescript
// Type assertions for JSON imports
const typedFactions = factionsData as Faction[];
const typedSquads = [...polairsSquads, ...protectorateSquads, ...mercenariesSquads] as Squad[];
const typedMachines = [...polairsMachines, ...protectorateMachines, ...mercenariesMachines] as Machine[];
```

- [ ] **Step 8: Update RulesSelector onConfirm callback (line ~145)**

Find:
```typescript
onConfirm={() => setSetupStep('faction')}
```

Replace with:
```typescript
onConfirm={() => setSetupStep('source')}
```

- [ ] **Step 9: Add SourceSelector render (after RulesSelector block)**

After the closing `}` of the RulesSelector block (around line 147), insert:
```typescript
            {/* Step 2: Source Selection */}
            {setupStep === 'source' && (
              <SourceSelector
                sources={getAllSources()}
                selectedSource={selectedSource}
                onSourceChange={handleSourceChange}
                onConfirm={() => setSetupStep('faction')}
              />
            )}

            {/* Step 3: Faction Selection */}
```

- [ ] **Step 10: Update FactionSelector props (find FactionSelector usage)**

Find the `<FactionSelector>` component and add `factions` prop:
```typescript
              <FactionSelector
                factions={availableFactions}
                selectedFaction={army.faction}
                // ... rest of existing props
              />
```

- [ ] **Step 11: Update useEffect sync logic (lines 96-106)**

Find the useEffect that syncs setupStep with army.currentStep. Update the conditions:

Replace:
```typescript
    if (army.currentStep === 'faction-select' && (setupStep === 'units' || setupStep === 'budget' || setupStep === 'faction')) {
      setSetupStep('rules');
```

With:
```typescript
    if (army.currentStep === 'faction-select' && (setupStep === 'units' || setupStep === 'budget' || setupStep === 'faction' || setupStep === 'source')) {
      setSetupStep('rules');
```

- [ ] **Step 12: Update StepProgressIndicator currentStep prop (find it)**

The StepProgressIndicator `currentStep` prop already supports the values we use. No changes needed.

- [ ] **Step 13: Run type check**

```bash
npm run type-check
```

Expected: PASS

If type check FAILS with errors about `FactionID` being incompatible:
- This is expected if other components still use the old union type
- Check the error messages for specific files that need updating
- Most errors should be resolved by previous tasks (types.ts changes)
- Fix any remaining errors by updating those components to use `string` type for faction IDs

- [ ] **Step 14: Run lint**

```bash
npm run lint
```

Expected: PASS

- [ ] **Step 15: Commit**

```bash
git add src/components/ArmyBuilder.tsx
git commit -m "feat: integrate source selection into ArmyBuilder flow

- Add source selection step between Rules and Faction
- Load factions dynamically from selected source
- Clear army when source changes
- Remove hardcoded faction/unit imports
- Update flow: rules → source → faction → budget → units

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4.4: Update encyclopedia-utils

**Files:**
- Modify: `src/lib/encyclopedia-utils.ts`

- [ ] **Step 1: List all data imports to update**

```bash
grep "from '@/data/" src/lib/encyclopedia-utils.ts
```

Expected: List of imports from old paths like:
- `from '@/data/polaris/squads.json'`
- `from '@/data/polaris/machines.json'`
- `from '@/data/protectorate/squads.json'`
- `from '@/data/mercenaries/squads.json'`
- etc.

Document these patterns - you'll need to update each one.

- [ ] **Step 2: Update import paths for new source structure**

For each import found in Step 1, update the path:

From: `@/data/{faction}/{squads|machines}.json`
To: `@/data/sources/star_system/{faction}/{squads|machines}.json`

Example using sed (or edit manually):
```bash
sed -i "s|from '@/data/|from '@/data/sources/star_system/|g" src/lib/encyclopedia-utils.ts
```

Verify the changes:
```bash
grep "from '@/data/" src/lib/encyclopedia-utils.ts
```

Expected: All paths now include `sources/star_system/`

- [ ] **Step 3: Run type check**

```bash
npm run type-check
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/encyclopedia-utils.ts
git commit -m "refactor: update encyclopedia imports for new source structure

Change paths from src/data/{faction}/ to src/data/sources/star_system/{faction}/

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 5: E2E Tests

### Task 5.1: Create Source Selection E2E Tests

**Files:**
- Create: `e2e/source-selection.spec.ts`

- [ ] **Step 1: Create E2E test file**

Create `e2e/source-selection.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Source Selection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('selects default source on first visit', async ({ page }) => {
    // Rules confirmation
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Should be on source step, Star System should be selected by default
    const starSystemCard = page.getByTestId('source-card-star_system');
    await expect(starSystemCard).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows disabled state for Tehnolog source', async ({ page }) => {
    // Navigate to source step
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Tehnolog card should be disabled
    const tehnologCard = page.getByTestId('source-card-tehnolog');
    await expect(tehnologCard).toHaveClass(/opacity-50/);
    await expect(tehnologCard).toHaveClass(/cursor-not-allowed/);

    // Should show lock icon
    const lockIcon = tehnologCard.locator('svg');
    await expect(lockIcon).toBeVisible();
  });

  test('persists source selection across sessions', async ({ page }) => {
    // First session - select Star System
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Confirm and continue to faction
    await page.click('[data-testid="source-confirm-button"]');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Rules confirmation again (new session)
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Star System should still be selected
    const starSystemCard = page.getByTestId('source-card-star_system');
    await expect(starSystemCard).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows error when source data is corrupted', async ({ page }) => {
    // Set invalid source in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('bronepehota_army_list_source', 'invalid_source');
    });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Should fall back to default source
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Star System should be selected (fallback)
    const starSystemCard = page.getByTestId('source-card-star_system');
    await expect(starSystemCard).toHaveAttribute('aria-pressed', 'true');
  });

  test('external link opens in new tab', async ({ page }) => {
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Click on source card to expand
    await page.click('[data-testid="source-card-star_system"]');
    await page.waitForTimeout(200);

    // Get the link
    const link = page.getByRole('link', { name: /подробнее/i });

    // Check href attribute
    const href = await link.getAttribute('href');
    expect(href).toBe('https://vk.com/star_system');

    // Check target attribute
    const target = await link.getAttribute('target');
    expect(target).toBe('_blank');
  });
});
```

- [ ] **Step 2: Run E2E tests**

```bash
npm run test:e2e -- source-selection.spec.ts
```

Expected: Tests should pass (may need adjustments based on actual implementation)

- [ ] **Step 3: Commit**

```bash
git add e2e/source-selection.spec.ts
git commit -m "test: add E2E tests for source selection flow

- Test default source selection
- Test disabled state for Tehnolog
- Test persistence across sessions
- Test fallback behavior
- Test external links

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 6: Cleanup and Documentation

### Task 6.1: Remove Old Data Files

**Files:**
- Delete: `src/data/factions.json`
- Delete: `src/data/polaris/` (directory)
- Delete: `src/data/protectorate/` (directory)
- Delete: `src/data/mercenaries/` (directory)

- [ ] **Step 1: Verify all components use new paths**

```bash
# Check for old paths
grep -r "data/polaris\|data/protectorate\|data/mercenaries\|data/factions.json" src/ --include="*.ts" --include="*.tsx"
```

Expected: Only references to `sources/star_system/...` should remain (from encyclopedia-utils which we already updated)

- [ ] **Step 2: Run type check to verify no broken imports**

```bash
npm run type-check
```

Expected: PASS - no import errors

- [ ] **Step 3: Remove old data files**

```bash
rm -rf src/data/factions.json
rm -rf src/data/polaris/
rm -rf src/data/protectorate/
rm -rf src/data/mercenaries/
```

- [ ] **Step 4: Run tests to ensure nothing broke**

```bash
npm run validate
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove old data files

Remove src/data/factions.json and faction directories after
migration to src/data/sources/ structure.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6.2: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add documentation for source system**

Find the "### Rules System (`src/lib/rules/`)" section (around line 70-90). Add a new subsection immediately after it:

```markdown
### Army List Sources System (`src/lib/sources-registry.ts`)

Manages multiple army list sources with different unit databases.

**Functions:**
- `getAllSources()` - List all available sources
- `getSource(id)` - Get specific source data (factions, squads, machines)
- `getDefaultSource()` - Get default source ID
- `isValidSource(id)` - Validate source ID

**Source Implementations** (`src/data/sources/`):
- `star_system/` - Star System community source
- `tehnolog/` - Official Tehnolog source (disabled, coming soon)

**Adding a new source:**
1. Create directory `src/data/sources/{sourceId}/`
2. Add `factions.json` with faction definitions
3. Create faction directories with `squads.json` and `machines.json`
4. Register in `sources-registry.ts`
```

- [ ] **Step 2: Update data directory structure documentation**

Find the "### Data Layer" section (around line 25-35). Update the directory structure from:
```markdown
src/data/
├── factions.json    - Faction definitions (3 factions)
├── polaris/         - Polaris faction units
│   ├── squads.json  - Polaris squad data
│   └── machines.json - Polaris vehicle data
```

To:
```markdown
src/data/
├── sources/         - Army list source directories
│   ├── star_system/ - Star System community source
│   │   ├── factions.json - Faction definitions
│   │   ├── polaris/ - Polaris faction units
│   │   │   ├── squads.json
│   │   │   └── machines.json
│   │   ├── protectorate/ - Protectorate faction units
│   │   │   ├── squads.json
│   │   │   └── machines.json
│   │   └── mercenaries/ - Mercenaries faction units
│   │       ├── squads.json
│   │       └── machines.json
│   └── tehnolog/   - Official Tehnolog source (disabled)
│       └── factions.json
```

Adding a new source:
1. Create directory `src/data/sources/{sourceId}/`
2. Add `factions.json` with faction definitions
3. Create faction directories with `squads.json` and `machines.json`
4. Register in `sources-registry.ts`
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document multi-source army list system

Add documentation for sources registry, data structure,
and how to add new sources.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Verification

### Task 7.1: Final Verification

- [ ] **Step 1: Run full validation**

```bash
npm run validate
```

Expected: All tests pass, type check passes, lint passes

- [ ] **Step 2: Run E2E tests**

```bash
npm run test:e2e
```

Expected: All E2E tests pass

- [ ] **Step 3: Manual smoke test**

**IMPORTANT:** This is a BREAKING CHANGE for existing users. Anyone with an existing army will find their army cleared when they upgrade, as the `sourceId` field is new.

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000

3. Verify each step with specific checks:

   **Rules Step:**
   - [ ] Page loads without errors
   - [ ] Can select a rules version
   - [ ] Toggle switches work
   - [ ] Continue button enabled

   **Source Step (NEW):**
   - [ ] Appears after Rules step
   - [ ] Star System is selected by default
   - [ ] Card shows selection indicator (checkmark)
   - [ ] Clicking card expands details
   - [ ] External link "Подробнее →" opens VK in new tab
   - [ ] Tehnolog card shows lock icon and is non-interactive
   - [ ] Disabled card shows "🔒 Скоро. Требуется помощи сообщества."
   - [ ] Continue button enabled

   **Faction Step:**
   - [ ] All 3 factions load (Polaris, Protectorate, Mercenaries)
   - [ ] Clicking faction selects it
   - [ ] Continue button enabled after selection

   **Budget Step:**
   - [ ] Budget options appear
   - [ ] Can select budget

   **Units Step:**
   - [ ] Can add units to army
   - [ ] Army cost updates correctly

   **Persistence:**
   - [ ] Refresh page (F5)
   - [ ] Source selection preserved (Star System still selected)
   - [ ] Can navigate back through steps

4. Check browser console for errors:
   - Open DevTools (F12)
   - Check Console tab for red errors
   - Expected: No errors

5. Check localStorage:
   - In DevTools Console, type: `localStorage.getItem('bronepehota_army_list_source')`
   - Expected: `"star_system"`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete multi-source army list system implementation

Implementation complete. All tests passing.

Features:
- Source selection step in battle configuration flow
- Star System source (fully functional)
- Tehnolog source (disabled, coming soon)
- Dynamic faction loading per source
- Fallback behavior for invalid sources
- localStorage persistence
- E2E tests

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

This implementation plan:

1. **Follows existing patterns** — mirrors the rules-registry structure
2. **Uses TDD** — tests written before implementation
3. **Commits frequently** — each task is independently commit-able
4. **Is bite-sized** — each step takes 2-5 minutes
5. **Handles edge cases** — fallback behavior, disabled states, validation
6. **Includes documentation** — updates CLAUDE.md with new patterns

Total estimated time: 2-3 hours for a developer familiar with the codebase.
