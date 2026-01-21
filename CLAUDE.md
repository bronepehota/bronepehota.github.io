# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Бронепехота (Bronepehota) is a Next.js 14 web application for a tabletop wargame. The app allows players to build armies, manage game sessions, and edit game data (squads, machines, factions). All UI text is in Russian; code uses English conventions.

**Primary Target Device**: Mobile phones (MOBILE FIRST design approach). All UI components should be designed with mobile touch interactions in mind first, then enhanced for desktop.

**Frontend Design**: When building new UI components or pages, use the `frontend-design` skill to ensure production-grade, visually polished interfaces that avoid generic AI aesthetics.

## Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)

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

# E2E Testing (requires running app on http://localhost:3000)
npm run test:e2e         # Run Cucumber E2E tests (headless)
npm run test:e2e:headed  # Run E2E tests with visible browser
npm run test:e2e:debug   # Run E2E tests in slow motion for debugging
```

## Architecture

### Data Layer

**File-based JSON storage** in `src/data/`:
- `factions.json` - Faction definitions (3 factions)
- `squads.json` - Squad/army list data
- `machines.json` - Vehicle/machine data

**API Routes** (`src/app/api/armlists/`):
- `factions/route.ts` - GET/POST/DELETE factions
- `squads/route.ts` - GET/POST/DELETE squads
- `machines/route.ts` - GET/POST/DELETE machines
- `upload-image/route.ts` - POST image uploads to `public/images/`

All API routes use synchronous `readFileSync`/`writeFileSync` operations. The POST handler handles both create (new ID) and update (existing ID) operations.

### State Management

**Client-side persistence** (localStorage keys):
- `bronepehota_army` - Player's army state (units, totalCost, faction)
- `bronepehota_rules_version` - Selected rules version for game session

The main page (`src/app/page.tsx`) manages the `Army` state and passes it down to child components.

**Runtime vs Template Data**:
- Template data (Squad, Machine) = immutable definitions from JSON
- Runtime data (ArmyUnit) = instances with current state (durability, ammo, deadSoldiers, actionsUsed)

### Core Types (`src/lib/types.ts`)

```typescript
FactionID = 'polaris' | 'protectorate' | 'mercenaries'

Soldier      // Individual soldier stats (rank, speed, range, power, melee, props, armor)
Squad        // Collection of 1-6 soldiers
Machine      // Vehicle with weapons, speed_sectors, durability, ammo
ArmyUnit     // Runtime instance of Squad or Machine with game state
Army         // Player's army with units, totalCost, faction
```

**Adding a new faction**: Update `FactionID` type in `types.ts` and add entry to `factions.json`.

### Game Logic (`src/lib/game-logic.ts`)

Dice notation parsing: `D6`, `D12+2`, `2D12`, `ББ` (melee)
- `parseRoll(rollStr)` → `{ dice, sides, bonus }`
- `executeRoll(rollStr)` → `{ total, rolls[] }`
- `calculateHit(rangeStr, distanceSteps)` → hit check
- `calculateDamage(powerStr, targetArmor)` → damage count
- `calculateMelee(attackerMelee, defenderMelee)` → combat resolution

### Rules System (`src/lib/`)

**Rules Registry** (`rules-registry.ts`): Manages multiple rule versions with selectors for game sessions.
- `getAllRulesVersions()` - List all available rule versions
- `getRulesByVersion(version)` - Get specific rules implementation

**Rule Implementations** (`rules/`):
- `fan.ts` - Fan rules implementation
- `tehnolog.ts` - Tehnolog rules implementation

Adding a new rules version:
1. Create new file in `src/lib/rules/{version}.ts`
2. Export rules object with required game mechanics
3. Register in `rules-registry.ts`

### Component Structure

**Main Page** (`src/app/page.tsx`):
- Header with faction branding, view toggle (Штаб/В Бой), editor link
- ArmyBuilder (construction) OR GameSession (gameplay)
- Footer with army stats

**Key Components**:
- `ArmyBuilder.tsx` - Filter/search units, add to army, export/import JSON
- `GameSession.tsx` - Two tabs: "Войска" (units) and "Атака" (combat)
- `UnitCard.tsx` - Individual unit display, combat modal, animated dice
- `ArmlistEditor.tsx` - Create/edit squads and machines with nested sub-editors
- `CombatAssistant.tsx` - Standalone combat calculator
- `UnitDetailsModal.tsx` - Bottom sheet modal for unit details (mobile swipe-to-close)
- `UnitSelector.tsx` - Unit selection interface with filters

**Rules Components**:
- `RulesSelector.tsx` - Rules version selection interface
- `RulesVersionSelector.tsx` - Dropdown/picker for rules version
- `RulesInfoModal.tsx` - Modal displaying current rules details
- `StepProgressIndicator.tsx` - Visual step progress for multi-step flows

**UI Components**:
- `FactionSelector.tsx` - Faction selection with visual branding
- `PointBudgetInput.tsx` - Army point budget input
- `FortificationSelector.tsx` - Fortification selection for units
- `DiceRoller.tsx` - Animated dice rolling component
- `SafeImage.tsx` - Image component with error handling

### Editor Pattern

The editor uses nested components:
- `ArmlistEditor` → toggle between Squad/Machine mode
- `SquadEditor` → `SoldierEditor[]` (up to 6 soldiers)
- `MachineEditor` → speed sectors + weapons

**ID Generation**: `{faction}_{slugified_name}` (e.g., `polaris_light_assault_clone`)

**Image Upload**: Three methods - file picker, drag-drop, clipboard paste (Ctrl+V). Images saved to `public/images/squads/` or `public/images/machines/`.

### Custom Hooks (`src/hooks/`)

- `useBottomSheet.ts` - Swipe-down gesture hook for mobile bottom sheets
  - Configurable close threshold (default: 100px)
  - Touch handlers for drag-to-close
  - Smooth snap-back animation

### Utilities (`src/lib/`)

- `unit-utils.ts` - Helper functions for unit operations (numbering, validation, etc.)

### Styling

- **MOBILE FIRST**: Design for mobile screens first (320px+), then enhance for tablets and desktop using Tailwind's `md:` and `lg:` breakpoints
- **Tailwind CSS** with dark theme (slate-900 base)
- **Faction colors**: Polaris (red #ef4444), Protectorate (blue #3b82f6), Mercenaries (yellow #eab308)
- **Touch-friendly targets**: Minimum 44x44px tap targets (WCAG 2.5.5)
- **Responsive patterns**: Bottom sheets for mobile modals, centered cards for desktop, hide labels on mobile (`hidden md:inline`)
- **Path alias**: `@/*` maps to `src/*` (configured in `tsconfig.json`)

### Testing

**Unit Tests (Jest)**:
- Focus on game logic utilities (`game-logic.ts`, `unit-utils.ts`)
- Test files location: `src/__tests__/`
- Run with: `npm run test`

**E2E Tests (Cucumber + Playwright)**:
- BDD-style tests with Russian Gherkin syntax
- Test files location: `e2e/features/`
- Step definitions: `e2e/step-definitions/`
- Configuration: `e2e/cucumber.yaml`
- **Requires running application** on `http://localhost:3000`
- Run with: `npm run test:e2e`

**Test Structure**:
- `e2e/features/rules-selection.feature` - Rules version selection scenarios
- `e2e/features/army-building.feature` - Army creation and unit management
- `e2e/features/game-session.feature` - Combat gameplay mechanics
- `e2e/features/armlist-editor.feature` - Squad/machine editor functionality

**CI/CD Pipeline**:
- Unit tests run on every commit (fast, ~30s)
- E2E tests run only in CI after deployment (slow, ~2-5min)
- See `.github/workflows/test.yml` for pipeline configuration

## Important Notes

1. **MOBILE FIRST DESIGN**: Primary target device is mobile phone. Always design UI for mobile first, then enhance for desktop. Use bottom sheets for modals, large tap targets (min 44x44px), swipe gestures where appropriate.
2. **Frontend Design Skill**: Use `frontend-design` skill when building new UI components to ensure production-grade, visually polished interfaces.
3. **All API error messages must be in Russian** (e.g., `Ошибка чтения данных`)
4. **Dice notation**: "D6", "D12", "D20" for range; "1D6", "2D12" for power; "ББ" for melee
5. **Speed sectors** must cover full range from 1 to `durability_max` without gaps
6. **Props** are string arrays: `["Г"]` for grenade, `[]` for none
7. **Images**: Max 10MB, saved with timestamp + random suffix for uniqueness

## Active Technologies

**Core Stack**:
- TypeScript 5.x (via Next.js 14.2.35)
- React 18
- Next.js 14 (App Router)
- Tailwind CSS
- Lucide React (icons)

**State & Storage**:
- localStorage for army state (`bronepehota_army`)
- localStorage for rules version (`bronepehota_rules_version`)
- JSON files in `src/data/` (factions.json, squads.json, machines.json)

**Testing**:
- Jest with jsdom environment (unit tests)
- Cucumber 10.9.0 + Playwright (E2E tests, BDD with Russian Gherkin)

**Utilities**:
- clsx, tailwind-merge for conditional styling

## Recent Changes
- **E2E Testing**: Added Cucumber + Playwright BDD tests with Russian Gherkin syntax (43 scenarios, 318 steps)
- **CI/CD Pipeline**: GitHub Actions workflow with parallel quality checks and E2E tests
- **Bottom Sheet Redesign**: `UnitDetailsModal` redesigned as mobile bottom sheet with swipe-to-close gesture (`useBottomSheet` hook)
- **Rules System**: Added multi-version rules support with `rules-registry.ts` and rule implementations (fan, tehno)
- **Rules Selector**: `RulesSelector`, `RulesVersionSelector`, `RulesInfoModal` components
- **Step Progress**: `StepProgressIndicator` component for multi-step flows
- **Unit Selector**: `UnitSelector.tsx` component with filtering
- **Mobile First**: MOBILE FIRST design approach documented, bottom sheet patterns established
