# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Бронепехота (Bronepehota) is a Next.js 14 web application for a tabletop wargame. The app allows players to build armies and manage game sessions. All UI text is in Russian; code uses English conventions.

**Primary Target Device**: Mobile phones (MOBILE FIRST design approach). All UI components should be designed with mobile touch interactions in mind first, then enhanced for desktop.

**Exception**: The editor (`/editor`) is desktop-only. On mobile it shows a notice with import/export buttons.

**Frontend Design**: When building new UI components or pages, use the `frontend-design` skill to ensure production-grade, visually polished interfaces that avoid generic AI aesthetics.

## Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run dev:e2e          # Start dev server on port 3001 for E2E tests

# Building
npm run build            # Production build
npm run start            # Run production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type check
npm run validate         # Run type-check + lint + unit tests

# Testing
npm run test             # Run all Jest unit tests
npm run test:watch       # Run tests in watch mode
npm run test:ci          # Run tests with coverage (CI mode)

# E2E Testing
npm run test:e2e         # Run Playwright E2E tests (headless)
npm run test:e2e:headed  # Run E2E tests with visible browser
npm run test:e2e:debug   # Run E2E tests in debug mode with inspector
```

## Architecture

### Data Layer

**Encyclopedia Data** (`src/data/encyclopedia/`):
```
src/data/encyclopedia/
├── units/              # Centralized lore database (split by faction/type)
│   ├── polaris/
│   │   ├── squads.json
│   │   └── machines.json
│   ├── protectorate/
│   │   ├── squads.json
│   │   └── machines.json
│   └── mercenaries/
│       ├── squads.json
│       └── machines.json
└── factions.json       # Faction lore (name, description, motto, etc.)
```

**Encyclopedia Registry** (`src/lib/encyclopedia-registry.ts`): Central access to lore data.
- `getEncyclopediaUnit(id)` - Get unit with lore by ID
- `getEncyclopediaFaction(id)` - Get faction with lore by ID
- `getUnitsForFaction(factionId)` - Get all units for a faction
- `getUnitSources(id)` - Get which army lists contain this unit with costs
- `isUnitInSource(unitId, sourceId)` - Check unit availability
- `getUnitCostForSource(unitId, sourceId)` - Get cost for specific source

**Key Pattern**: Game data (cost, soldiers, weapons) lives in `sources/`. Lore data (descriptions, history, tactics) lives in `encyclopedia/`. `encyclopedia-utils.ts` merges them for display.

**Source-based JSON storage** in `src/data/sources/`:
```
src/data/sources/
├── star_system/      - Star System community source
│   ├── factions.json - Faction definitions (3 factions)
│   ├── polaris/      - Polaris faction units
│   │   ├── squads.json
│   │   └── machines.json
│   ├── protectorate/ - Protectorate faction units
│   │   ├── squads.json
│   │   └── machines.json
│   └── mercenaries/  - Mercenaries faction units
│       ├── squads.json
│       └── machines.json
└── tehnolog/         - Official Tehnolog source (placeholder for future data)
    └── factions.json
```

**Source Registry** (`src/lib/sources-registry.ts`): Manages multiple army list sources.
- `sourcesRegistry` - Registry of all available sources with their data
- `getAllSources()` - List all available sources
- `getSource(id)` - Get specific source with fallback to default
- `getDefaultSource()` - Returns 'star_system' as default
- `isValidSource(id)` - Validate source ID

**Source Types**:
```typescript
type SourceID = string;  // Dynamic source identifiers
type FactionID = string; // Dynamic faction identifiers (changed from union type)

interface ArmyListSource {
  id: SourceID;
  name: string;
  description: string;
  link?: string;
  version: string;
}

interface SourceData {
  source: ArmyListSource;
  factions: Faction[];
  squads: Squad[];
  machines: Machine[];
}
```

### State Management

**Client-side persistence** (localStorage keys):
- `bronepehota_army` - Player's army state (units, totalCost, faction, sourceId)
- `bronepehota_view` - Current view: 'army' (builder) or 'game' (session)
- `bronepehota_display_mode` - Display mode preference
- `bronepehota_army_list_source` - Selected army list source ('star_system' or 'tehnolog')
- `bronepehota_rules_version` - Selected rules version for game session
- `bronepehota_panic_enabled` - Panic rule toggle state
- `bronepehota_aimed_shot_enabled` - Aimed shot rule toggle state
- `bronepehota_surprise_attack_enabled` - Surprise attack (rear attack) toggle state
- `AUTO_COMPLETE_ENABLED` - Auto-complete actions after combat
- `DISTANCE_INPUT_UNIT` - Distance unit: 'steps' or 'cm'
- `STEP_TO_CM_FACTOR` - Conversion factor from steps to cm (default: 5)
- `STRICT_PILOT_RANK_ENABLED` - Enforce pilot rank requirements

The main app page (`src/app/app/page.tsx`) manages the `Army` state and passes it down to child components.

**Runtime vs Template Data**:
- Template data (Squad, Machine) = immutable definitions from JSON
- Runtime data (ArmyUnit) = instances with current state (durability, ammo, deadSoldiers, actionsUsed)

### Core Types (`src/lib/types.ts`)

```typescript
Soldier      // Individual soldier stats (rank, speed, range, power, melee, armor, props)
Squad        // Collection of 1-6 soldiers + buffs[]
Machine      // Vehicle with weapons, speed_sectors, durability, ammo
ArmyUnit     // Runtime instance of Squad or Machine with game state (deadSoldiers, actionsUsed, soldierModifiers, activeDebuffs, etc.)
Army         // Player's army with units, totalCost, faction, sourceId, currentTurn
```

**Adding a new source**:
1. Create directory `src/data/sources/{source_id}/`
2. Add `factions.json` with faction definitions
3. Create faction subdirectories with `squads.json` and `machines.json`
4. Add source metadata to `sources-registry.ts`
5. Source will appear in SourceSelector UI

**Adding a new faction to existing source**:
1. Add faction definition to `{source}/factions.json`
2. Create directory `{source}/{faction_id}/`
3. Add `squads.json` and `machines.json` files

### Game Logic (`src/lib/game-logic.ts`)

Dice notation parsing: `D6`, `D12+2`, `2D12`, `ББ` (melee)
- `parseRoll(rollStr)` → `{ dice, sides, bonus }`
- `executeRoll(rollStr)` → `{ total, rolls[] }`
- `calculateHit(rangeStr, distanceSteps)` → hit check
- `calculateDamage(powerStr, targetArmor)` → damage count
- `calculateMelee(attackerMelee, defenderMelee)` → combat resolution
- `multiplyRange(rangeStr, multiplier)` → multiply dice range (e.g., D6 → D12, D6+2 → D12+4)

### Rules System (`src/lib/`)

**Rules Registry** (`rules-registry.ts`): Manages multiple rule versions with selectors for game sessions.
- `getAllRulesVersions()` - List all available rule versions
- `getRulesByVersion(version)` - Get specific rules implementation

**Rule Implementations** (`rules/`):
- `fan.ts` - Fan rules implementation
- `tehnolog.ts` - Tehnolog rules implementation
- `community_star_system.ts` - Star System community rules implementation

Adding a new rules version:
1. Create new file in `src/lib/rules/{version}.ts`
2. Export rules object with required game mechanics
3. Register in `rules-registry.ts`

**Note**: Rules versions and army list sources are independent - any rules version can be used with any source.

### Component Structure

**Component Organization** (`src/components/`):
```
src/components/
├── cards/           - Unit/soldier card components (UnitCard, SoldierCard, SquadView, MachineView)
│   └── soldier-card/ - Soldier sub-components (ModifierIndicator, SoldierActions, SoldierStats)
│   └── unit-card/   - Unit sub-components + hooks (useUnitCardState)
├── combat/          - Combat modals (BottomSheetCombatModal, ActionSelector, ParameterInputs, CombatResults, ActiveModifiersDisplay, HitProbabilityIndicator)
├── controls/        - Shared controls (FortificationSelector, DistanceConverter)
├── editor/          - Desktop-only unit editor (SourcesList, SquadEditor, ModifiersEditor, BuffSelector)
├── encyclopedia/    - Encyclopedia page components (UnitDetailPage)
├── game-session/    - Game session components (ActiveBuffsIndicator)
├── landing/         - Landing page
├── machine/         - Machine-specific components
├── modals/          - Shared modals (SoldierEffectsModal, PilotAssignmentModal, PanicTestModal, EncyclopediaModal)
├── preparation/     - Battle preparation components
├── rules/           - Rules/source selectors, toggles
├── toggles/         - Settings toggles
├── ui/              - Reusable UI primitives (NumberStepper)
└── *.tsx           - Top-level components (ArmyBuilder, GameSession, UnitCard)
```

**Main Page** (`src/app/app/page.tsx`): ArmyBuilder (construction) OR GameSession (gameplay).

### Grenade Combat Mechanics

**Two-phase grenade flow (per Fan rules lines 1161-1213)**:

**Phase 1: Determine Explosion Location**
- Roll D6 + soldier's army rank (A) = explosion distance
- Display: "Взрыв на расстоянии X шагов [Y-Z см]" (X ± 1 step)
- Warning if D6 roll = 1: "⚠️ Опасно! Вы в зоне взрыва!"
- Example: D6=4, rank=2 → distance=6 → blast zone [5-7 steps, 20-28 cm]

**Phase 2: Check Targets in Blast Zone**
- Input: "Броня цели" (with memory for last value)
- Button: **ВЗРЫВ** → rolls 1D20 vs target armor
- Result: D20 > armor = ПРОБИТО, D20 ≤ armor = НЕ ПРОБИТО
- Can repeat for multiple targets in blast zone

**Implementation**:
- `useCombatFlow.ts`: `executeGrenade()` (Phase 1) and `checkGrenadeTarget()` (Phase 2)
- `combat-types.ts`: `GrenadeBlastResult`, `grenadeDistance`, `grenadeBlastZone`, `grenadeBlastChecks`
- `CombatResults.tsx`: Special grenade display with blast zone and target check UI

**Grenade Usage**:
- Only squads can throw grenades (not machines)
- Grenades can be used once per battle (`grenadesUsed: true` after first use)
- Soldier's army rank (0-7) is added to D6 roll for distance

### Pilot Assignment System

**Purpose**: Soldiers can be assigned as pilots to machines. When assigned, the pilot is blocked from independent actions and must navigate to the machine to operate it.

**Pilot Navigation Flow**:
1. Open machine view in game session
2. Click pilot button (shield icon or pilot portrait)
3. Select squad from modal
4. Select soldier from squad
5. Confirm assignment
6. Pilot soldier now shows:
   - "ПИЛОТ" badge on soldier card
   - "К МАШИНЕ →" button instead of "ДЕЙСТВИЕ"
   - Clicking navigates directly to the machine card
7. Machine shows pilot portrait in TacticalDashboard

**Implementation**:
- `PilotAssignmentModal.tsx`: Two-step modal (squad → soldier selection)
- `SoldierActions.tsx`: Shows "К МАШИНЕ →" button when `isPilot=true`
- `TacticalDashboard.tsx`: Displays pilot status and portrait
- Navigation: `onNavigateToUnit(instanceId)` prop chain from UnitCard → SquadView → SoldierCard

**Type Definitions**:
```typescript
interface PilotInfo {
  squadInstanceId: string;
  soldierIndex: number;
  pilotArmor: number;
  alive: boolean;
}

// Soldier has pilot flags
interface Soldier {
  isPilot: boolean;
  pilotOfInstanceId: string | null;  // Which machine this soldier pilots
}
```

### Adding New Units via JSON

**To add a new squad or machine:**

1. Navigate to the source and faction directory: `src/data/sources/{source_id}/{faction}/`
   - Default source: `star_system`
   - Available factions: `polaris`, `protectorate`, `mercenaries`

2. Edit `squads.json` for infantry or `machines.json` for vehicles

3. Add a new unit object with required fields:

**Squad Structure:**
```json
{
  "id": "{source}_{faction}_{slugified_name}",
  "name": "Название на русском",
  "shortName": "Краткое название",
  "faction": "polaris|protectorate|mercenaries",
  "cost": 100,
  "image": "/images/squads/filename.jpg",
  "soldiers": [
    {
      "rank": 7,
      "speed": 4,
      "range": "D6",
      "power": "1D6",
      "melee": 0,
      "props": ["Г"],       // Props array: "Г" = grenade, etc. Resolved to modifiers at runtime via resolveSoldierEffects()
      "armor": 2
    }
    // ... up to 6 soldiers
  ]
}
```

**Machine Structure:**
```json
{
  "id": "{faction}_{slugified_name}",
  "name": "Название на русском",
  "shortName": "Краткое название",
  "faction": "polaris|protectorate|mercenaries",
  "cost": 150,
  "rank": 2,
  "fire_rate": 2,
  "ammo_max": 20,
  "durability_max": 16,
  "image": "/images/machines/filename.jpg",
  "speed_sectors": [
    {"min_durability": 9, "max_durability": 16, "speed": 2},
    {"min_durability": 1, "max_durability": 8, "speed": 1}
  ],
  "weapons": [
    {
      "name": "Weapon Name",
      "range": "D12",
      "power": "2D20",
      "special": "Optional special effect"
    }
  ]
}
```

**ID Generation**: `{faction}_{slugified_name}` (e.g., `polaris_light_assault_clone`)

**Images**: Place in `public/images/squads/` or `public/images/machines/`

**Dice Notation**:
- Range: "D6", "D12", "D20", "D6+2"
- Power: "1D6", "2D12", "ББ" (melee)
- Modifiers: Soldier `props` field in JSON (e.g., `["Г"]` for grenade). Resolved to modifier IDs at runtime via `resolveSoldierEffects()`

**Speed Sectors**: Must cover full range 1 to durability_max without gaps

**Image Standards:**
- Target size: 300x400 px (PNG format)
- White background (#FFFFFF)
- Figure centered with ~5% margins
- Use `tools/standardize_images.py` to process new images

### Custom Hooks (`src/hooks/`)

- `useBottomSheet.ts` - Swipe-down gesture hook for mobile bottom sheets
  - Configurable close threshold (default: 100px)
  - Touch handlers for drag-to-close
- `useCombatFlow.ts` - Combat state machine for shots, melee, grenades
  - `executeShot()`, `executeMelee()`, `executeGrenade()`, `checkGrenadeTarget()`
- `useLongPress.ts` - Long-press gesture detection for undo actions
- `usePilotTestFlow.ts` - Pilot survival test state machine (D12 + D6 rolls)
- `usePanicTestFlow.ts` - Panic test state for squads
- `useEditorState.ts` - Editor form state management (desktop-only)

### Long-Press Pattern

**Purpose**: Undo state changes (marking done/dead) via long-press on SoldierCard.
- Short click (< 100ms): Activates state. Long press (> 600ms): Cancels state (shows progress bar after 100ms).
- Implementation: `src/components/cards/SoldierCard.tsx` + `src/components/cards/soldier-card/SoldierActions.tsx`
- Hook: `src/hooks/useLongPress.ts`

### Utilities (`src/lib/`)

- `unit-utils.ts` - Helper functions for unit operations (numbering, validation, etc.)
- `combat-types.ts` - TypeScript types for combat system (CombatParameters, ShotResult, MeleeResult, GrenadeBlastResult, etc.)
- `faction-colors.ts` - Centralized faction color mappings (getFactionColors function)
  - Polaris: red tones, Protectorate: cyan tones, Mercenaries: yellow tones
  - Returns object with all color variants (text, bg, border, glow, etc.)
- `constants.ts` - Application-wide constants

### Modifier System (`src/lib/modifier-types.ts`, `src/lib/modifier-utils.ts`)

**Modifier Types:**
- **Buffs** (positive): Static bonuses from unit data OR temporary effects applied during battle
- **Debuffs** (negative): Applied during combat, always time-limited (1-3 turns)
- **Soldier Modifiers**: Applied to individual soldiers via `SoldierEffectsModal`, tracked with `catalogId` for one-time-use enforcement

**Duration System:**
- `ModifierDuration = 1 | 2 | 3` (turns)
- No `duration` field = permanent (abilities). `SoldierModifier.duration` and `expiresAtTurn` are optional
- One-time-use abilities tracked via `soldierAbilitiesUsed: string[]` on ArmyUnit (format: `"catalogId_soldierIndex"`)
- Cleanup happens at start of each turn via `cleanupExpiredModifiers()`

**Apply Target**: `ModifierApplyTarget = 'machine' | 'soldier' | 'army'` (no 'squad' — removed)

**Storage:**
- Unit-level: `activeBuffs`, `activeDebuffs` on `ArmyUnit`
- Soldier-level: `soldierModifiers[]` with `soldierIndex` for squads, `catalogId` for tracking
- One-time tracking: `soldierAbilitiesUsed[]` — persists independently from active modifiers
- Custom modifiers stored in localStorage via `modifier-storage.ts`

**Catalog:**
- `src/data/modifiers/standard-modifiers.json` - Built-in buffs/debuffs
- Access via `getStandardBuffs()`, `getStandardDebuffs()`
- Custom modifiers created via editor (UI at `/editor`)

**Key Functions (`src/lib/modifier-utils.ts`):**
- `collectBuffsForUnit()` - Collect static buffs from army
- `collectActiveBuffsForUnit()` - Collect temporary buffs for a unit
- `getSoldierModifiers(unit, soldierIndex, army)` - Get modifiers for specific soldier
- `resolveModifierSummary(unit, army, phase, soldierIndex?)` - Calculate ALL active modifiers for combat (buffs + debuffs + soldier mods, filtered by phase)
- `resolveSoldierEffects(squadBuffs, soldierModIds)` - Resolve per-soldier modifier IDs against catalog; returns `{ buffs, abilities }` (temporary vs permanent)
- `cleanupExpiredModifiers(army)` - Remove expired modifiers at turn start; sets empty arrays to `undefined`
- `isModifierActive(appliedAtTurn, duration?, currentTurn?)` - Returns `true` for `duration === undefined` (permanent); expiry: `currentTurn > appliedAtTurn + duration`

**Combat Integration:**
- `BottomSheetCombatModal` receives `army` prop, computes `modifierSummary` via `useMemo`
- Syncs to `state.parameters.activeModifiers` via `useEffect`
- `ActiveModifiersDisplay` shown in PARAMETERS phase (between inputs and execute button)
- For squads: `soldierIndex` passed; for machines: `soldierIndex = undefined`
- Phase mapping: `actionType === 'melee'` → `'melee'`, otherwise → `'shot'`

**Combat Relevance Filtering:**
- `resolveModifierSummary` filters modifiers by action-relevant targets:
  - **Shot phase**: `range_bonus`, `range_multiply`, `power_bonus`, `armor_bonus`, `distance_penalty`, `custom`
  - **Melee phase**: `melee_bonus`, `custom`
  - **Always phase** (soldier card stats): ALL targets included
- `speed_multiply` (e.g., Адреналин) is hidden in combat panel but visible on soldier card stats
- This filtering only affects `descriptions` and bonus values in combat; soldier card stats use separate phase calls (shot/melee/always)

**Soldier Effects Flow:**
- `ModifierIndicator` on SoldierCard → click opens `SoldierEffectsModal` (3 tabs: buffs/debuffs/abilities)
- Buffs/abilities filtered from `squad.buffs` (not global catalog); debuffs from catalog
- GameSession manages `effectsModalState` and `onSoldierModifierClick` prop chain

### Styling

- **MOBILE FIRST**: Design for mobile screens first (320px+), then enhance for tablets and desktop using Tailwind's `md:` and `lg:` breakpoints
- **Tailwind CSS** with dark theme (slate-900 base)
- **Faction colors**: Use `getFactionColors(factionId)` from `@/lib/faction-colors` for consistent coloring
  - Polaris: red tones (#ef4444)
  - Protectorate: cyan tones (#06b6d4)
  - Mercenaries: yellow tones (#eab308)
- **Touch-friendly targets**: Minimum 44x44px tap targets (WCAG 2.5.5)
- **Responsive patterns**: Bottom sheets for mobile modals, centered cards for desktop, hide labels on mobile (`hidden md:inline`)
- **Path alias**: `@/*` maps to `src/*` (configured in `tsconfig.json`)

### GitHub Pages Deployment

**Important Notes**:
- The app uses `basePath: '/bronepehota'` in production (configured in `next.config.mjs`)
- The basePath is controlled by `GITHUB_PAGES` environment variable:
  - **Local development**: `GITHUB_PAGES` unset → basePath is empty (`""`)
  - **GitHub Pages**: `GITHUB_PAGES=true` → basePath is `/bronepehota`
- Always use Next.js `<Link>` component for internal navigation (respects basePath automatically)
- For `<Image>` components, use `unoptimized` prop when images don't display on GitHub Pages
- Example: `<Link href="/encyclopedia">` not `<a href="/encyclopedia">`

**Image Loading for GitHub Pages:**
- Use `GitHubPagesImage` component from `@/components/GitHubPagesImage` for most images
- It automatically handles `BASE_PATH` prefixing for paths starting with `/images/`
- Uses regular `<img>` tag instead of Next.js `<Image>` for reliable static export
- For dynamic image components (like navigation cards), use:
  ```tsx
  const BASE_PATH = process.env.GITHUB_PAGES === 'true' ? '/bronepehota' : '';
  const finalSrc = imageUrl.startsWith('/images/') ? `${BASE_PATH}${imageUrl}` : imageUrl;
  <img src={finalSrc} ... />
  ```

**Building for local testing**:
```bash
npm run build
npx serve out -l 3000
# Manifest will have paths without /bronepehota prefix
```

**Building for GitHub Pages**:
```bash
GITHUB_PAGES=true npm run build
# Manifest will have paths with /bronepehota prefix
# This is automatically set in .github/workflows/deploy.yml
```

### Testing

**Unit Tests (Jest)**:
- Focus on game logic utilities (`game-logic.ts`, `unit-utils.ts`)
- Test files location: `src/__tests__/`
- Run with: `npm run test`

**E2E Tests (Playwright)**:
- TypeScript-based E2E tests using Playwright
- Test files location: `e2e/*.spec.ts`
- Configuration: `playwright.config.ts`
- **Automatically starts dev server** on `http://localhost:3001` before tests
- Run with: `npm run test:e2e`
- Debug mode: `npm run test:e2e:debug` (opens Playwright Inspector)

**E2E Testing Best Practices**:
- **Selector Priority**: `getByTestId()` > `getByRole()` > `getByText()` > CSS selectors
- **Local Cleanup**: Always clear localStorage in `beforeEach`
- **Async state**: Always use `await page.waitForTimeout(200)` after clicks

**App Navigation Flow** (critical — tests must follow this sequence):
```
1. Rules → click [data-testid="rules-confirm-button"]
2. Source → select source → click [data-testid="source-confirm-button"]
3. Faction → select faction → click [data-testid="faction-continue-button"]
4. Budget → select points → click [data-testid="budget-next-button"]
5. Army Builder → add units → click [data-testid="to-battle-button"]
6. Battle Preparation → click [data-testid="start-battle-button"]
```

**Common Pitfalls**:
1. **Cannot skip steps** — must follow the full 6-step sequence
2. **Toggle selectors**: `data-testid` on wrapper, `aria-pressed` on inner button — use `container.locator('button[aria-pressed]')`
3. **Missing Source step**: After Rules, always click source-confirm before Faction

**Helper — navigate to Army Builder**:
```typescript
async function navigateToArmyBuilder(page: Page) {
  await page.click('[data-testid="rules-confirm-button"]');
  await page.waitForTimeout(500);
  await page.click('[data-testid="source-confirm-button"]');
  await page.waitForTimeout(500);
  await page.click('[data-testid="faction-card-polaris"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="faction-continue-button"]');
  await page.waitForTimeout(500);
  await page.click('button:has-text("350")');
  await page.waitForTimeout(300);
  await page.click('[data-testid="budget-next-button"]');
  await page.waitForTimeout(500);
}
```

**CI/CD**: Unit tests on every commit (~30s). E2E tests in CI after deployment (~2-5min). See `.github/workflows/test.yml`.

## Important Notes

1. **MOBILE FIRST DESIGN**: Primary target device is mobile phone. Exception: the editor is desktop-only.
2. **Frontend Design Skill**: Use `frontend-design` skill when building new UI components to ensure production-grade, visually polished interfaces.
3. **All API error messages must be in Russian** (e.g., `Ошибка чтения данных`)
4. **Dice notation**: "D6", "D12", "D20" for range; "1D6", "2D12" for power; "ББ" for melee
5. **Speed sectors** must cover full range from 1 to `durability_max` without gaps
6. **Soldier modifiers**: Soldiers have `props: string[]` in JSON data (e.g., `["Г"]` for grenade). These are resolved to modifier catalog IDs at runtime via `resolveSoldierEffects()`. Per-soldier runtime effects are stored in `soldierModifiers[]` on ArmyUnit.
7. **Images**: Place images in `public/images/squads/` or `public/images/machines/`

## Active Technologies

**Core Stack**:
- TypeScript 5.x (via Next.js 14.2.35)
- React 18
- Next.js 14 (App Router)
- Tailwind CSS
- Lucide React (icons)

**State & Storage**:
- localStorage for state persistence (see full list in State Management section)
- JSON files in `src/data/` (factions.json, and faction-specific squads/machines)

**Testing**:
- Jest with jsdom environment (unit tests)
- Playwright 1.49.0 (E2E tests in TypeScript)

**Utilities**:
- clsx, tailwind-merge for conditional styling

