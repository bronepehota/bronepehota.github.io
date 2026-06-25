# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Бронепехота (Bronepehota) is a Next.js 14 web application for a tabletop wargame. The app allows players to build armies and manage game sessions. All UI text is in Russian; code uses English conventions.

**Primary Target Device**: Mobile phones (MOBILE FIRST design approach). All UI components should be designed with mobile touch interactions in mind first, then enhanced for desktop.

**Exception**: The editor (`/editor`) is desktop-only. On mobile it shows a notice with import/export buttons.

**Frontend Design**: When building new UI components or pages, use the `frontend-design` skill to ensure production-grade, visually polished interfaces that avoid generic AI aesthetics.

**Prefer LSP tools** (`workspaceSymbol`, `goToDefinition`, `findReferences`) for code exploration over spawning Explore agents. Use `grep` for text search, LSP for symbol navigation.

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

## Testing Workflow

**ALWAYS write tests for new features.** The project has 1100+ unit tests (79 test files) and 94 E2E tests across 19 spec files. Both are required.

### When to write what

| Scenario | Test type | Location |
|----------|-----------|----------|
| Pure logic (dice parsing, damage calc, state transforms) | **Unit** (`src/__tests__/`) | `*.test.ts` |
| New utility/lib function | **Unit** (`src/__tests__/`) | `*.test.ts` |
| New page or UI flow | **E2E** (`e2e/`) | `*.spec.ts` |
| Changed UI interaction pattern | **E2E** (`e2e/`) | Update existing spec |
| New combat mechanic | **Both** — unit for logic, E2E for UI flow | Both dirs |

### Required checks before finishing work

```bash
npm run type-check          # Must pass
npm run test                # All unit tests pass
npm run test:e2e            # All E2E tests pass
```

`npm run validate` runs type-check + lint + unit tests but does NOT run E2E — run E2E separately.

### E2E test conventions

- **Selector priority**: `getByTestId()` > `getByRole()` > `getByText()` > CSS selectors
- **Always clear localStorage** in `beforeEach`
- **Always `await page.waitForTimeout(200)`** after clicks
- **Dev server auto-starts** on `http://localhost:3001` before tests
- **Headed mode**: `npm run test:e2e:headed` (visible browser)
- **Debug mode**: `npm run test:e2e:debug` (Playwright Inspector)
- **Shared setup helpers**: `e2e/helpers/setup.ts` — use `setupToArmyBuilder`, `setupGameSessionWithSquad`, `setupToPreparation` etc. to reduce setup duplication

### Existing E2E coverage

| Area | Spec file | Tests |
|------|-----------|-------|
| Calculator | `calculator.spec.ts` | 7 |
| Combat flow | `combat.spec.ts` | 4 |
| Aimed shot | `aimed-shot.spec.ts` | 7 |
| Battle buffs | `battle-buffs.spec.ts` | 11 |
| Source selection | `source-selection.spec.ts` | 9 |
| Editor | `editor.spec.ts` | 7 |
| Encyclopedia | `encyclopedia.spec.ts` | 7 |
| Landing | `landing.spec.ts` | 2 |
| Army creation | `army-creation.spec.ts` | 3 |
| Game session | `game-session.spec.ts` | 2 |
| Soldier state | `soldier-state-management.spec.ts` | 6 |
| Pilot | `pilot-functionality.spec.ts` | 1 |
| Preparation | `preparation-phase.spec.ts` | 5 |
| Unit cards | `unit-card-complex-scenarios.spec.ts` | 4 |
| Fire rate | `unit-card-fire-rate.spec.ts` | 1 |
| Navigator | `expanded-navigator.spec.ts` | 1 |
| Modifier display | `modifier-stat-display.spec.ts` | 7 |
| Calculator tab | `calculator-tab.spec.ts` | 7 |
| Example/smoke | `example.spec.ts` | 3 |

**CI/CD**: Unit tests on every commit (~6s). E2E tests in CI after deployment (~2-5min). See `.github/workflows/test.yml`.

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
├── tehnolog/         - Official Tehnolog source
│   └── factions.json
└── tehnolog_2026/    - Tehnolog 2026 edition source
```

**Source Registry** (`src/lib/sources-registry.ts`): Manages multiple army list sources.
- `sourcesRegistry` - Registry of all available sources with their data
- `getAllSources()` - List all available sources
- `getSource(id)` - Get specific source with fallback to default
- `getDefaultSource()` - Returns 'star_system' as default
- `isValidSource(id)` - Validate source ID

**Source Types**: See `src/lib/types.ts` — `SourceID` and `FactionID` are dynamic strings; `ArmyListSource` and `SourceData` define source metadata.

**Missions** (`src/data/missions/missions.json` + `campaigns.json`; registry `src/lib/missions-registry.ts`): battle scenarios — **informational reference only; the app does NOT enforce objectives/turns/winners**. Registry exports `getAllMissions`, `getMission`, `getMissionsForCampaign`, `getAllCampaigns`. Routes: list `/encyclopedia/missions`, detail `/encyclopedia/mission/[id]` (**singular**). Participant machine `unitId` is a **bare slug** (`hunter`, `salamander`, `raptor`), linked as `/encyclopedia/unit/${unitId}`. The registry casts the JSON `as unknown as Mission[]` (TS infers a union of objective/participant shapes across missions) — don't simplify back to `as Mission[]`.

**Campaigns (Хроники войн)** — in-app lore from build-time Markdown: content `src/content/campaigns/*.md` (frontmatter + body), loader `src/lib/campaigns.ts`. `getAllCampaigns()` is sync (frontmatter only, via `gray-matter`); `getCampaign(slug)` is async and renders the body→HTML via **dynamically-imported** `remark`/`remark-gfm`/`remark-html` (dynamic import keeps the module Jest-importable — unit-test only `getAllCampaigns`, never `getCampaign`). Routes `/campaigns` + `/campaigns/[slug]`. **Markdown under `docs/` is NOT published** (not in the static export) — in-app content must live under `src/` and be build-imported.

### State Management

**Client-side persistence** (localStorage keys — canonical list in `src/lib/constants.ts`):
- `bronepehota_army` - Player's army state (units, totalCost, faction, sourceId)
- `bronepehota_view` - Current view: 'army' (builder) or 'game' (session)
- `bronepehota_display_mode` - Display mode preference
- `bronepehota_army_list_source` - Selected army list source ('star_system' or 'tehnolog')
- `bronepehota_rules_version` - Selected rules version for game session
- `bronepehota_calculator_rules` - Calculator rules version ('tehnolog' or 'community_star_system')
- `bronepehota_dice_history` - Calculator dice input history (JSON array of {value, field, timestamp})
- `bronepehota_panic_enabled` - Panic rule toggle state
- `bronepehota_aimed_shot_enabled` - Aimed shot rule toggle state
- `bronepehota_surprise_attack_enabled` - Surprise attack (rear attack) toggle state
- `bronepehota_auto_complete_enabled` - Auto-complete actions after combat
- `bronepehota_distance_input_unit` - Distance unit: 'steps' or 'cm'
- `bronepehota_step_to_cm_factor` - Conversion factor from steps to cm (default: 5)
- `bronepehota_strict_pilot_rank_enabled` - Enforce pilot rank requirements
- `bronepehota_custom_sources` - Editor custom source JSON
- `bronepehota_custom_modifiers` - Editor custom modifiers JSON
- `bronepehota_setup_step` - Current setup wizard step
- `bronepehota_editor_show_base_units` - Editor base unit visibility toggle
- `bronepehota_weapon_selections` - Weapon selector modal selections

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
- **Negative bonuses supported**: `parseRoll`/`multiplyRange`/`addBonusToRoll` (all in `src/lib/game-logic.ts`) match an optional `+N`/`-N` (e.g. `D6-1`, `2D6-1`). `2D6-1` parses to bonus -1; such values are valid in unit `range`/`power`.

### Rules System (`src/lib/`)

**Rules Registry** (`rules-registry.ts`): Manages multiple rule versions with selectors for game sessions.
- `getAllRulesVersions()` - List all available rule versions
- `getRulesByVersion(version)` - Get specific rules implementation

**Rule Implementations** (`rules/`):
- `community_star_system.ts` - Star System community rules implementation
- `tehnolog.ts` - Tehnolog rules implementation

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
├── calculator/      - Standalone combat calculator (CalculatorPage, DiceInputPopup, ModifiersSelector, RulesSelector)
├── combat/          - Combat modals (BottomSheetCombatModal, ActionSelector, ParameterInputs, CombatResults, ActiveModifiersDisplay, HitProbabilityIndicator)
├── controls/        - Shared controls (FortificationSelector, DistanceConverter)
├── editor/          - Desktop-only unit editor (SourcesList, SquadEditor, MachineEditor, ModifiersEditor, UnifiedSaveArea, BuffSelector, ModifierIcons, UnitsList, FactionsList, CreateSourceModal)
├── encyclopedia/    - Encyclopedia page components (UnitDetailPage)
├── GameSession/     - Game session navigation (ExpandedNavigator, ExpandedUnitCard, UnitNavigationCard) — PascalCase dir
├── game-session/    - Game session sub-components (ActiveBuffsIndicator)
├── landing/         - Landing page
├── machine/         - Machine-specific components
├── modals/          - Shared modals (SoldierEffectsModal, PilotAssignmentModal, PanicTestModal, EncyclopediaModal, ImportExportHelp)
├── preparation/     - Battle preparation components
├── rules/           - Rules/source selectors, toggles
├── toggles/         - Settings toggles
├── ui/              - Reusable UI primitives (NumberStepper)
└── *.tsx           - Top-level components (ArmyBuilder, GameSession, UnitCard)
```

**Main Page** (`src/app/app/page.tsx`): ArmyBuilder (construction) OR GameSession (gameplay).

**Calculator Page** (`src/app/calculator/page.tsx`): Standalone combat calculator — fully decoupled from Army/ArmyUnit. Users manually input all combat parameters (range, power, melee, armor, rank) via `DiceInputPopup`. Reuses combat components (`ActionSelector`, `ParameterInputs`, `CombatResults`) via the `CombatantData` adapter pattern. Accessible from landing page and direct URL.

**Orphaned editor files** (not imported anywhere): `ExportModal.tsx`, `ImportModal.tsx`, `ModifierExportImport.tsx` in `src/components/editor/` — functionality replaced by `UnifiedSaveArea.tsx`. Can be safely deleted.

**Legacy files**: `UnitCard.legacy.tsx` mirrors `UnitCard.tsx` logic — always update both when changing shared behavior (panic, combat, state updates).

### Grenade Combat Mechanics

Two-phase flow: (1) Roll D6 + soldier rank = blast distance, (2) Roll D20 vs target armor for each target in blast zone. D6=1 triggers self-danger warning.

- Implementation: `useCombatFlow.ts` (`executeGrenade()`, `checkGrenadeTarget()`), `combat-types.ts` (`GrenadeBlastResult`), `CombatResults.tsx`
- Only squads can throw grenades; once per battle (`grenadesUsed: true`)

### Pilot Assignment System

Soldiers can be assigned as pilots to machines. Assigned pilots show "ПИЛОТ" badge and "К МАШИНЕ →" button that navigates to their machine.

- `PilotAssignmentModal.tsx`: Two-step modal (squad → soldier)
- `SoldierActions.tsx`: Shows pilot navigation when `isPilot=true`
- `TacticalDashboard.tsx`: Displays pilot status/portrait
- Navigation via `onNavigateToUnit(instanceId)` prop chain
- Types: `PilotInfo { squadInstanceId, soldierIndex, pilotArmor, alive }`; Soldier has `isPilot` and `pilotOfInstanceId` flags

### Adding New Units via JSON

Edit `squads.json` or `machines.json` in `src/data/sources/{source_id}/{faction}/`. Use existing entries as templates.

**Squad**: `id`, `name`, `shortName`, `faction`, `cost`, `image`, `soldiers[]` (up to 6, each with `rank`, `speed`, `range`, `power`, `melee`, `armor`, `props[]`). ID format: `{source}_{faction}_{slugified_name}`.

**Machine**: `id`, `name`, `shortName`, `faction`, `cost`, `rank`, `fire_rate`, `ammo_max`, `durability_max`, `image`, `speed_sectors[]` (must cover 1 to durability_max), `weapons[]`.

**Image Standards**: 300x400 px PNG, white background, centered with ~5% margins. Process with `tools/standardize_images.py`. Place in `public/images/squads/` or `public/images/machines/`.

### Custom Hooks (`src/hooks/`)

- `useBottomSheet.ts` - Swipe-down gesture hook for mobile bottom sheets
  - Configurable close threshold (default: 100px)
  - Touch handlers for drag-to-close
- `useCombatFlow.ts` - Combat state machine for shots, melee, grenades
  - `executeShot()`, `executeMelee()`, `executeGrenade()`, `checkGrenadeTarget()`
  - Accepts optional `combatantData` (5th param of `startCombat`) for standalone calculator mode
- `useStandaloneCombatFlow.ts` - Standalone calculator state (no ArmyUnit dependency)
  - Uses `combatantData` adapter pattern via `combatantToUnitLike()` to create fake ArmyUnit
  - Manages rules version, modifier summary, combatant data
  - Provides `switchAction()`, `newCalculation()`, `updateCombatantField()`
- `useLongPress.ts` - Long-press gesture detection for undo actions
- `usePilotTestFlow.ts` - Pilot survival test state machine (D12 + D6 rolls)
- `usePanicTestFlow.ts` - Panic test state for squads
  - **Star System rules**: panic test is once per game per squad (tracked via `panicTestUsed` on `ArmyUnit`), not per-turn
- `useEditorState.ts` - Editor form state management (desktop-only)

### Long-Press Pattern

**Purpose**: Undo state changes (marking done/dead) via long-press on SoldierCard.
- Short click (< 100ms): Activates state. Long press (> 600ms): Cancels state (shows progress bar after 100ms).
- Implementation: `src/components/cards/SoldierCard.tsx` + `src/components/cards/soldier-card/SoldierActions.tsx`
- Hook: `src/hooks/useLongPress.ts`

### Utilities (`src/lib/`)

- `unit-utils.ts` - Helper functions for unit operations (numbering, validation, etc.)
- `combat-types.ts` - TypeScript types for combat system (CombatParameters, ShotResult, MeleeResult, GrenadeBlastResult, etc.)
- `combatant-data.ts` - Calculator adapter: `CombatantData` interface, `combatantToUnitLike()`, `isCombatReady()`, `missingFields()`
- `dice-history.ts` - Dice input history persistence: `loadHistory()`, `saveEntry()`, `getRecentForField()`, `fieldFromTitle()`
- `faction-colors.ts` - Centralized faction color mappings (getFactionColors function)
  - Polaris: red tones, Protectorate: cyan tones, Mercenaries: yellow tones
  - Returns object with all color variants (text, bg, border, glow, etc.)
- `constants.ts` - Application-wide constants

### Modifier System (`src/lib/modifier-types.ts`, `src/lib/modifier-utils.ts`)

- **Buffs** (positive): Static from unit data or temporary (1-3 turns). **Debuffs** (negative): Combat-applied, always time-limited.
- **Soldier Modifiers**: Per-soldier via `SoldierEffectsModal`, tracked with `catalogId` for one-time-use.
- **Duration**: No `duration` field = permanent. Cleanup via `cleanupExpiredModifiers()` at turn start.
- **Apply Target**: `'machine' | 'soldier' | 'army'` (no 'squad').
- **Storage**: Unit-level (`activeBuffs`, `activeDebuffs`), soldier-level (`soldierModifiers[]`), one-time tracking (`soldierAbilitiesUsed[]`).
- **Catalog**: `src/data/modifiers/standard-modifiers.json`. Access via `getStandardBuffs()`, `getStandardDebuffs()`.
- **Key function**: `resolveModifierSummary(unit, army, phase, soldierIndex?)` — computes all active modifiers filtered by phase ('shot', 'melee', or all).
- **Combat integration**: `BottomSheetCombatModal` computes `modifierSummary` → `ActiveModifiersDisplay` in PARAMETERS phase.
- **Soldier Effects Flow**: `ModifierIndicator` click → `SoldierEffectsModal` (3 tabs: buffs/debuffs/abilities).

### Import/Export System

**Purpose**: Save/load all editor configuration (custom sources + custom modifiers) via file or Google Drive.

**Key Files**:
- `src/lib/config-export.ts` — Envelope creation/validation. `createConfigEnvelope(sources, modifiers)` bundles all config into versioned envelope. `validateConfigEnvelope(jsonString)` validates on import.
- `src/lib/google-drive.ts` — Google Identity Services (GIS) OAuth + Drive API v3 wrapper. Uses `drive.file` scope (only files created by app). Functions: `loadGisScript()`, `requestAccessToken()`, `listConfigFiles()`, `downloadFile()`, `uploadConfigFile()`.
- `src/components/editor/UnifiedSaveArea.tsx` — Unified save/load component. Props: `mode: 'full' | 'import-only'`, `variant: 'default' | 'compact' | 'toolbar'`. Used in editor tab bar (`toolbar`), app header (`compact`), and editor sidebar (`default`).
- `src/components/modals/ImportExportHelp.tsx` — Step-by-step help modal

**Config Envelope Format**:
```typescript
{ version: 1, type: 'bronepehota_config', exportedAt: string, data: { sources: CustomSource[], modifiers: { buffs: Modifier[], debuffs: Modifier[] } } }
```

**Environment**: Requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for Drive features. Without it, only file save/load is available (Drive buttons hidden).

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
- The basePath is controlled by `NEXT_PUBLIC_GITHUB_PAGES` environment variable:
  - **Local development**: `NEXT_PUBLIC_GITHUB_PAGES` unset → basePath is empty (`""`)
  - **GitHub Pages**: `NEXT_PUBLIC_GITHUB_PAGES=true` → basePath is `/bronepehota`
- Always use Next.js `<Link>` component for internal navigation (respects basePath automatically)
- For `<Image>` components, use `unoptimized` prop when images don't display on GitHub Pages
- Example: `<Link href="/encyclopedia">` not `<a href="/encyclopedia">`

**Image Loading for GitHub Pages:**
- Use `GitHubPagesImage` component from `@/components/GitHubPagesImage` for most images
- It automatically handles `BASE_PATH` prefixing for paths starting with `/images/`
- Uses regular `<img>` tag instead of Next.js `<Image>` for reliable static export
- For dynamic image components (like navigation cards), use:
  ```tsx
  const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/bronepehota' : '';
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
NEXT_PUBLIC_GITHUB_PAGES=true npm run build
# Manifest will have paths with /bronepehota prefix
# This is automatically set in .github/workflows/deploy.yml
```

### Testing

See **Testing Workflow** section above for full testing conventions. Key commands:

```bash
npm run test              # Unit tests (Jest, ~6s)
npm run test:e2e          # E2E tests (Playwright, ~2-5min)
npm run validate          # type-check + lint + unit tests (no E2E)
```

**App Navigation Flow** for E2E tests (must follow this sequence, cannot skip steps):
```
Rules → Source → Faction → Budget → Army Builder → Battle Preparation
```
Use `data-testid` selectors: `rules-confirm-button`, `source-confirm-button`, `faction-continue-button`, `budget-next-button`, `to-battle-button`, `start-battle-button`.

**Toggle selectors**: `data-testid` on wrapper, `aria-pressed` on inner button — use `container.locator('button[aria-pressed]')`.

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

