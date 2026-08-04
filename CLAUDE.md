# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Бронепехота (Bronepehota) is a Next.js 14 web application for a tabletop wargame. The app allows players to build armies and manage game sessions. All UI text is in Russian; code uses English conventions.

**Primary Target Device**: Mobile phones (MOBILE FIRST design approach). All UI components should be designed with mobile touch interactions in mind first, then enhanced for desktop.

**Exception**: The editor (`/editor`) is desktop-only. On mobile it shows a notice with import/export buttons.

**Frontend Design**: When building new UI components or pages, use the `frontend-design` skill to ensure production-grade, visually polished interfaces that avoid generic AI aesthetics.

**Prefer LSP over grep/Explore for symbol navigation.** This repo has a working TypeScript LSP (the `typescript-lsp` plugin → `typescript-language-server` backed by the project's own `tsserver`) AND JetBrains IDE MCP (`mcp__idea__*`). Reach for them whenever you need *semantic* info — do NOT default to `grep` + Read; that grep-first reflex is the anti-pattern this project keeps falling into.

### Code Navigation — LSP cheat sheet

| You need… | Use |
|---|---|
| Definition / type / docs of a symbol | `hover`, `goToDefinition`, `get_symbol_info` |
| Every caller of a function/symbol | `findReferences`, `incomingCalls` / `analyze_calls` |
| What a function calls | `outgoingCalls` |
| Find a symbol by name across the repo | `workspaceSymbol`, `search_symbol` |
| All exports/symbols in one file | `documentSymbol` |
| Rename a symbol everywhere | `rename_refactoring` (NEVER find/replace) |

Use `grep` / `search_text` only for *literal* text (strings, comments, CSS classes, error messages). Use Explore agents only for broad multi-file sweeps where you want a conclusion, not a single symbol. (LSP diagnostics can lag mid-edit — see the stale-diagnostics note under Testing Workflow.)

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

**ALWAYS write tests for new features.** The project has 1250+ unit tests (93 test files) and 136 E2E tests across 33 spec files. Both are required.

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

**LSP diagnostics can be stale**: type errors shown mid-edit often resolve in the final state. Trust `npm run type-check` (exit code) over LSP diagnostics.

**Local `next build` + heavy e2e are flaky in this env** — intermittently killed (empty log, exit 1) or fail on `Cannot find module for page: /_document` (Next 14 App Router intermittency). Trust `npm run type-check` + `npm run test` (fast, reliable) over local builds; CI is the source of truth. Next is 14.2.35 (latest 14.x — no newer patch; 14→16 is a separate major upgrade). **E2E is CI-only** — Playwright's `webServer` spawns `next dev` (non-terminating), which the harness kills → e2e exits 1 with an empty log; don't try to run it locally. The Bash tool's default `timeout` is 120s — set it higher (up to `600000`) for long foreground ops (multi-figure renders, etc.).

**No persistent background servers** — the harness kills non-terminating background procs (exit 144, empty log). Finite `nohup … &` batches work; for "live" render-on-demand pre-compute (e.g. `render_sweep.py` + matcher slider) instead of a server.

### E2E test conventions

- **Selector priority**: `getByTestId()` > `getByRole()` > `getByText()` > CSS selectors
- **Always clear localStorage** in `beforeEach` (use the `clearStorage(page)` helper)
- **Prefer waiting for state over fixed sleeps**: `expect(locator).toBeVisible()` and
  actionability auto-wait already poll up to 5s, so a `waitForTimeout` immediately
  before them is redundant — drop it. Reserve `waitForTimeout(ms)` for animations /
  transitions that produce no assertable state. Don't sprinkle sleeps "just in case".
- Legacy tests still use `await page.waitForTimeout(200)` after clicks; convert to the
  above when refactoring a spec.
- **Dev server auto-starts** on `http://localhost:3001` before tests
- **Dev server port cleanup**: multiple `npm run dev` instances pile up on ports 3000-3003. Before restarting: `pkill -9 -f next` + `rm -rf .next`. After a clean start, `/app` takes ~30s to compile on first access (Next.js dev on-demand compilation).
- **Background dev server**: run `npm run dev` as its own background command. Don't chain it behind `pkill`/`rm` in the same backgrounded call — that compound form has failed with empty output (exit 1). Do the cleanup in a separate foreground call first.
- **Headed mode**: `npm run test:e2e:headed` (visible browser)
- **Debug mode**: `npm run test:e2e:debug` (Playwright Inspector)
- **Shared setup helpers**: `e2e/helpers/setup.ts` — use `setupToArmyBuilder`, `setupGameSessionWithSquad`, `setupToPreparation` etc. to reduce setup duplication
- **`setupGameSessionWithSquad` clears localStorage**: its `addInitScript` calls `localStorage.clear()`. To persist custom keys (rules, flags), register your `addInitScript` AFTER calling the helper (execution order = registration order), then `page.reload()`.

### Existing E2E coverage

| Area | Spec file | Tests |
|------|-----------|-------|
| Aimed shot | `aimed-shot.spec.ts` | 7 |
| Army creation | `army-creation.spec.ts` | 5 |
| Battle buffs | `battle-buffs.spec.ts` | 11 |
| Calculator | `calculator.spec.ts` | 7 |
| Calculator tab | `calculator-tab.spec.ts` | 7 |
| Campaigns (Хроники войн) | `campaigns.spec.ts` | 3 |
| Combat flow | `combat.spec.ts` | 4 |
| Editor | `editor.spec.ts` | 7 |
| Encyclopedia | `encyclopedia.spec.ts` | 11 |
| Example/smoke | `example.spec.ts` | 3 |
| Fire rate | `unit-card-fire-rate.spec.ts` | 1 |
| Focus trap (a11y) | `focus-trap.spec.ts` | 1 |
| Game session | `game-session.spec.ts` | 2 |
| Grenade targets | `grenade-targets.spec.ts` | 1 |
| Height bonus (community) | `height-bonus.spec.ts` | 3 |
| Landing | `landing.spec.ts` | 2 |
| Machine capture | `machine-capture.spec.ts` | 2 |
| Machine melee/ram | `machine-melee-ram.spec.ts` | 2 |
| Melee defender armor | `melee-defender-armor.spec.ts` | 1 |
| Missions | `missions.spec.ts` | 14 |
| Modifier display | `modifier-stat-display.spec.ts` | 7 |
| Navigator | `expanded-navigator.spec.ts` | 1 |
| Panic kill | `panic-kill.spec.ts` | 1 |
| Panic on death | `panic-on-death.spec.ts` | 3 |
| Pilot | `pilot-functionality.spec.ts` | 1 |
| Pilot test (defender) | `defender-pilot-test.spec.ts` | 1 |
| Preparation | `preparation-phase.spec.ts` | 5 |
| Soldier state | `soldier-state-management.spec.ts` | 6 |
| Source selection | `source-selection.spec.ts` | 9 |
| Squad scroll | `squad-scroll.spec.ts` | 1 |
| Surprise attack preview | `surprise-attack-preview.spec.ts` | 1 |
| Unit cards | `unit-card-complex-scenarios.spec.ts` | 4 |
| Vehicle zone damage (community) | `vehicle-zone-damage.spec.ts` | 2 |

> Counts drift as specs evolve — refresh with `npx playwright test --list` (totals) or `grep -cE '^\s*test\(' e2e/<spec>.ts` (per file).

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

**Squad cost calculator**: `~/Downloads/Kalkulyator_armlistov_pekhoty_Alfa_v-1_03.xlsx` (sheet «АвтоРасчёт») — per-soldier price = Тип отряда + Оружие + ББ + Свойства + Броня/скорость + Раса; **squad cost = ceil5(Σ soldier prices / 10)**. Recalc via `soffice --headless --convert-to xlsx` then read with `openpyxl` (`data_only=True`). Parallel to `tools/machine_cost_model.py` (техника).

**`EncyclopediaUnit` carries LORE only** — no gameplay stats (`rank`, `weapons`, `durability_max`, `ammo_max` are undefined). To resolve real Machine data: `resolveMachineFromSource(id)` from `src/lib/machine-resolver.ts` — looks up `getSource(id).machines` via the encyclopedia's `sources` list.

**Content sources — several distinct "source" dimensions per unit** (don't conflate them):
- **Stats source** = army list (`unit.sources[]`: star_system/tehnolog) — which stats; switchable via `SourceAvailability.tsx`.
- **Lore provenance** (`src/lib/provenance.ts`, optional `provenance` field): `origin` (who invented the concept) + `loreAuthor` (who wrote the text) — org-level: `tehnolog` | `star_system` | `universestarsys`. Individual creators are separate: `miniatureSource`/`imageSource` = credit IDs from `CREDITS` in `painted-images.ts` (e.g. `lisitsin`, `shnayder`). Don't conflate — "concept by Lisitsin" = `provenance.origin: 'star_system'` (org) + `miniatureSource: 'lisitsin'` (person).
- **Painter** (`src/lib/painted-images.ts`): `CREDITS` (logo+url+name) + `SQUAD_PHOTO_SOURCE` (per-squad); `getPhotoCredit(id)` returns `undefined` for unattributed squads (no default).
- **Image source**: painted squad ⇒ its painter; otherwise Star System (unpainted card-art/renders — Lisitsin's squads are painted, so never the fallback).
- Attribution UI: `src/components/encyclopedia/AttributionLabel.tsx` (`ProvenanceRow` `// ИСТОЧНИК`, `PainterChip` `// ПОКРАС`, `ImageSourceChip` `// ИЗОБРАЖЕНИЯ`, `SourceChip`, `ContributeButton`→vk.com/bp_bnp). Logos 128×128 in `public/images/credits/`.

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

**Rules source documents** (`docs/`): authoritative rule texts live outside `src/` (dev/player reference only — NOT imported by the app). Edition ↔ directory:
- `docs/tehnolog/official_rules.md` (+ `Bronepekhota_Pravila_05_08_08.pdf` canonical) — official Tehnolog rules; `source` ref in `src/lib/rules/tehnolog.ts`.
- `docs/star_system/fan_rules.md` (+ `fan_rules_v0.3.pdf` canonical) — fan/community Star System rules (v0.3); `source` ref in `src/lib/rules/community_star_system.ts`.

Both `.md` files are machine-converted from their PDFs; the PDF is authoritative on disagreement. `docs/README.md` maps the full `docs/` layout; `RulesInfoModal.tsx` shows the source path to players (covered by `src/__tests__/RulesInfoModal.test.tsx`).

### State Management

**Client-side persistence** (localStorage keys — most are defined in `src/lib/constants.ts`, a few live inline in their component/hook):
- `bronepehota_army` - Player's army state (units, totalCost, faction, sourceId). Stored as `{ schemaVersion: 1, army: Army }`. When seeding for testing, set localStorage on the landing page (`/`) BEFORE navigating to `/app` — the `/app` pagehide handler flushes the in-memory army, overwriting any seed set while `/app` is loaded.
- `bronepehota_view` - Current view: 'army' (builder) or 'game' (session)
- `bronepehota_display_mode` - Display mode preference
- `bronepehota_army_list_source` - Selected army list source ('star_system' or 'tehnolog')
- `bronepehota_rules_version` - Selected rules version for game session
- `bronepehota_calculator_rules` - Calculator rules version ('tehnolog' or 'community_star_system')
- `bronepehota_dice_history` - Calculator dice input history (JSON array of {value, field, timestamp})
- `bronepehota_panic_enabled` - Panic rule toggle state
- `bronepehota_aimed_shot_enabled` - Aimed shot rule toggle state
- `bronepehota_surprise_attack_enabled` - Surprise attack (rear attack) toggle state
- `bronepehota_height_bonus_enabled` - Height bonus toggle (community Star System only)
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
- **Community per-weapon ammo** (`rulesVersion === 'community_star_system'`): `ArmyUnit.weaponAmmo: number[]` (one entry per weapon); `currentAmmo` = sum for display. `usePerWeaponAmmo` flag gates the UI (per-weapon steppers/bars vs single pool). Tehnolog: single `currentAmmo`/`ammo_max` pool.

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

**Brand-new faction ID** (not just a subdir of a known faction — e.g. `rutenia`): the 2 steps above are NOT enough. Follow the full 13-point plumbing checklist in the `import-cards` skill (Step 6) — `FACTIONS` (constants), `getFactionColors` table, `factionDisplayNames`, both registries, `encyclopedia-utils`, `FactionsListPage`, `FactionsSection`, **`FactionSelector.factionStyles`** (its own map — easy to miss, crashes the card), + 4 tests.

**Faction alliances**: `UnitSelector` shows own + allied units via `faction === selected || alliedFactionIds.has(faction)`, where `alliedFactionIds = getAlliedFactions(...)` (`src/lib/faction-allies.ts` — symmetric + `"*"` wildcard). Factions declare `allies` in `encyclopedia/factions.json` (`mercenaries: ["*"]` = ally of all; `rutenia: ["protectorate"]`). Do NOT re-add hardcoded `selectedFaction === 'mercenaries'` — mercs flow through `allies:["*"]`.
3. Add `squads.json` and `machines.json` files

### Sub-faction hierarchy

**`parent?: FactionID`** on factions — display-only; unit availability stays on `allies`.
Pure helpers in `src/lib/faction-hierarchy.ts`: `orderedFactions()` (parent→children nesting),
`getParent()`, `getSubFactions()`, `relationTo()` (own/subfaction/parent/ally for unit badges).
rutenia→protectorate, dead_fleet→polaris. The encyclopedia faction `<select>` indents sub-factions
with em-spaces (U+2003).

### Game Logic (`src/lib/game-logic.ts`)

Dice notation parsing: `D6`, `D12+2`, `2D12`, `ББ` (melee)
- `parseRoll(rollStr)` → `{ dice, sides, bonus }`
- `executeRoll(rollStr)` → `{ total, rolls[] }`
- `calculateHit(rangeStr, distanceSteps)` → hit check
- `calculateDamage(powerStr, targetArmor)` → damage count
- `calculateMelee(attackerMelee, defenderMelee)` → combat resolution
- `multiplyRange(rangeStr, multiplier)` → multiply dice range (e.g., D6 → D12, D6+2 → D12+4)
- **Negative bonuses supported**: `parseRoll`/`multiplyRange`/`addBonusToRoll` (all in `src/lib/game-logic.ts`) match an optional `+N`/`-N` (e.g. `D6-1`, `2D6-1`). `2D6-1` parses to bonus -1; such values are valid in unit `range`/`power`.
- **Extending `CombatActionType`**: add to the union (`combat-types.ts`), add a style entry to `ActionSelector.tsx`'s `getActionStyle` map, handle in `executeAction` switch (`useCombatFlow.ts`), handle in `handleApplyResult` (`UnitCard.tsx`), and — for non-dice actions — intercept in `onSelectAction` to skip PARAMETERS/ROLLING/RESULTS phases.
- **Combat target is manual input**: the app is single-army (one player's units per session). `useCombatFlow` is attacker-focused — the target is manually-entered numbers (`targetArmor`, `distance`), NOT a tracked enemy unit. Target-side mechanics (zone damage, pilot test) read from manual input or the player's own machine state (when they damage THEIR machine).

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

**Default rules version**: `getDefaultRulesVersion()` returns `'tehnolog'`. Community-only features (panic auto-trigger, vehicle zone damage, height bonus) require `rulesVersion === 'community_star_system'`.

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

**`GameSession.updateUnit`** uses `armyRef.current` (a ref synced to `army` via useEffect), not the closure `army`. When mutating army in the same event handler as `updateUnit` (e.g. adding a unit + marking a soldier), use `armyRef.current` + update the ref synchronously before `setArmy` — otherwise React 18 batching silently overwrites the earlier mutation.

**`deriveUnitStatus`** (`src/lib/unit-status.ts`) returns `'active' | 'done' | 'dead' | 'captured'`. `'captured'` (machines only, `isCaptured` flag) renders orange in the navigator (Flag icon) — de facto dead but recaptureable.

**Calculator Page** (`src/app/calculator/page.tsx`): Standalone combat calculator — fully decoupled from Army/ArmyUnit. Users manually input all combat parameters (range, power, melee, armor, rank) via `DiceInputPopup`. Reuses combat components (`ActionSelector`, `ParameterInputs`, `CombatResults`) via the `CombatantData` adapter pattern. Accessible from landing page and direct URL.

### Grenade Combat Mechanics

Two-phase flow: (1) Roll D6 + soldier rank = blast distance, (2) Roll D20 vs target armor for each target in blast zone. D6=1 triggers self-danger warning.

- Implementation: `useCombatFlow.ts` (`executeGrenade()`, `checkGrenadeTarget()`), `combat-types.ts` (`GrenadeBlastResult`), `CombatResults.tsx`
- Only squads can throw grenades; once per battle (`grenadesUsed: true`)

### Pilot Assignment System

Soldiers can be assigned as pilots to machines. Assigned pilots show "ПИЛОТ" badge and "К МАШИНЕ →" button that navigates to their machine.

- `PilotAssignmentModal.tsx`: Two-step modal (squad → soldier)
- `SoldierActions.tsx`: Shows pilot navigation when `isPilot=true`
- `MachineStatusHeader.tsx`: Status header (badges, PilotChip, durability bar, alert bar). `PilotChip.tsx` (compact pilot indicator) → `PilotModal.tsx` (centered modal: portrait, test, change pilot).
- Navigation via `onNavigateToUnit(instanceId)` prop chain
- Types: `PilotInfo { squadInstanceId, soldierIndex, pilotArmor, alive }`; Soldier has `isPilot` and `pilotOfInstanceId` flags

### Adding New Units via JSON

Edit `squads.json` or `machines.json` in `src/data/sources/{source_id}/{faction}/`. Use existing entries as templates.

**Squad**: `id`, `name`, `shortName`, `faction`, `cost`, `image`, `soldiers[]` (up to 6, each with `rank`, `speed`, `range`, `power`, `melee`, `armor`, `props[]`). ID format: `{source}_{faction}_{slugified_name}`.

**Machine**: `id`, `name`, `shortName`, `faction`, `cost`, `rank`, `fire_rate`, `ammo_max`, `durability_max`, `image`, `speed_sectors[]` (must cover 1 to durability_max), `weapons[]`.

**Image Standards**: 300x400 px PNG, white background, centered with ~5% margins. Process with `tools/standardize_images.py`. Place in `public/images/squads/` or `public/images/machines/`. **Gotcha**: PIL `im.thumbnail()` is downscale-only — if the source render is smaller than the frame, use `im.resize(...)` to upscale (figures must fill ~90% width per the app standard).

**STL (3D models) → card images**: when a source ships `.stl` (not images), render via Blender Cycles headless — `tools/blender_render.py` (auto up-axis + 180° front-flip + per-figure `turn` yaw), batched by `tools/render_folder.py`/`render_local.py`, angle-tuned via `tools/render_sweep.py` + the matcher's live slider. The numpy `render_stl.py` is flat/silhouette — orientation checks only. Full pipeline: `import-cards` skill Step 1 (STL).

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
- `useEditorState.ts` - Editor form state management (desktop-only)

> **Panic (Star System rules)**: the panic test is once per game per squad (tracked via `panicTestUsed` on `ArmyUnit`), not per-turn. Logic lives in `src/lib/panic-logic.ts` + `PanicTestModal.tsx`.

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
- **Dossier `// LABEL` text in JSX**: wrap in braces — `{'// ИСТОЧНИК'}` — or `react/jsx-no-comment-textnodes` errors (bare `//` parses as a comment).
- **Avoid `appearance-none` on `<select>`** — breaks the dropdown on some mobile browsers (invisible/non-interactive). Use native select styling with custom bg/border.

### GitHub Pages Deployment

**Hosting**: User/Org Pages root at **`https://bronepehota.github.io`** (repo **`bronepehota/bronepehota.github.io`**). Served from the domain ROOT — **basePath is `''`**. The old `luxor.github.io/bronepehota` project page is now just a redirect stub (`Luxor/bronepehota` repo) that path-preserves → the new URL.

**basePath** (`next.config.mjs` + `src/lib/constants.ts`, must stay in sync): derived from `NEXT_PUBLIC_SITE_URL`'s pathname —
- Root deployments — the current `bronepehota.github.io`, or any future custom domain set via `NEXT_PUBLIC_SITE_URL` → basePath `''`.
- The legacy `/bronepehota` subpath only if `NEXT_PUBLIC_SITE_URL` explicitly points at the old `luxor.github.io/bronepehota` (abandoned).
- `BASE_PATH` is exported from `@/lib/constants` — **import it; do NOT re-derive inline** (the campaigns pages had a stale inline copy that broke images — keep one source of truth).

Always use Next.js `<Link>` for internal navigation (respects basePath automatically): `<Link href="/encyclopedia">`, not `<a href="/encyclopedia">`. For `<Image>`, use `unoptimized` (static export).

**Image Loading**:
- Use `GitHubPagesImage` from `@/components/GitHubPagesImage` for most images — auto-prefixes `BASE_PATH` for `/images/` paths, uses `<img>` for reliable static export.
- For dynamic image components (navigation cards), import and use the constant:
  ```tsx
  import { BASE_PATH } from '@/lib/constants';
  const finalSrc = imageUrl.startsWith('/images/') ? `${BASE_PATH}${imageUrl}` : imageUrl;
  <img src={finalSrc} ... />
  ```

**Building**:
```bash
# Local (basePath '', localhost origin)
npm run build && npx serve out -l 3000

# GitHub Pages — set in .github/workflows/deploy.yml:
#   NEXT_PUBLIC_GITHUB_PAGES=true  +  NEXT_PUBLIC_SITE_URL=https://bronepehota.github.io (repo secret)
# basePath resolves to '' (root). The PWA manifest (public/manifest.json) is root-served —
# start_url/scope/icons use '/...' and are guarded by src/__tests__/pwa/manifest.test.ts.
```

### SEO / Discoverability

Static-export SEO generated at build time (`output: 'export'`):

- **`app/sitemap.ts`** — every route (landing, encyclopedia, all units/missions/campaigns, calculator). **`app/robots.ts`** — allow-all + sitemap link. Both emit to `out/`.
- **`SITE_URL`** (`src/lib/constants.ts`) — canonical origin; production sets it via the `NEXT_PUBLIC_SITE_URL` repo secret (= `https://bronepehota.github.io`). `src/lib/seo.ts` exposes `absoluteUrl()` (sitemap/canonical/OG) + JSON-LD builders. NOTE: read with `||` not `??` — deploy.yml renders an absent secret as `''`, and `??` would pass `''` through to `new URL('')` and crash the build.
- **Structured data** — `src/lib/seo.ts` + `src/components/JsonLd.tsx`: `WebApplication`+`Organization` on landing, `BreadcrumbList` on unit/mission detail pages.
- **Analytics/verification env vars** (all optional; components no-op without id): `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_YANDEX_METRICA_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_YANDEX_VERIFICATION`.
- **OG image** — `public/og-image.png` is a 1200×630 Playwright screenshot of the landing hero. Regenerate from repo root (dev server on :3000): `node tools/regen-og-image.mjs && python3 tools/regen-og-crop.py`. (Run from repo root — Node ESM resolves `node_modules` relative to the script file, not cwd.)
- **basePath & metadata**: Next does NOT auto-prefix `metadata.icons`/`manifest` with basePath — `BASE_PATH` is applied manually. `metadataBase` = `SITE_URL` (incl. basePath) is safe; icons stay single-prefixed.
- **Root-served (resolved)**: the site lives at a domain/account root, so `robots.txt` + `sitemap.xml` land at the domain root → crawlers auto-discover them. (The old `*.github.io/bronepehota` subpath had a crawler auto-discovery problem — now moot since the move to `bronepehota.github.io`.)

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

**Promo assets** (`docs/promo/`) are NOT committed to git — local-only for VK posts.

**Yandex Disk Cyrillic subfolders**: the listing API (`/v1/disk/public/resources?path=Индейцы`) returns 0 items for Cyrillic-named subfolders, but the download API with an explicit path (`/download?path=/Индейцы/1.png`) works. Don't trust the listing — try downloading by pattern (`/1.png`…`/6.png`) directly.

**Always branch for imports** — even "quick" single-squad imports go through `feat/<branch>` → PR → merge. Never commit directly to `main`.

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

