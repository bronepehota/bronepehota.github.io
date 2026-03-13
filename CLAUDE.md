# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Бронепехота (Bronepehota) is a Next.js 14 web application for a tabletop wargame. The app allows players to build armies and manage game sessions. All UI text is in Russian; code uses English conventions.

**Primary Target Device**: Mobile phones (MOBILE FIRST design approach). All UI components should be designed with mobile touch interactions in mind first, then enhanced for desktop.

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

**File-based JSON storage** in `src/data/`:
```
src/data/
├── factions.json    - Faction definitions (3 factions)
├── polaris/         - Polaris faction units
│   ├── squads.json  - Polaris squad data
│   └── machines.json - Polaris vehicle data
├── protectorate/    - Protectorate faction units
│   ├── squads.json
│   └── machines.json
└── mercenaries/     - Mercenaries faction units
    ├── squads.json
    └── machines.json
```

### State Management

**Client-side persistence** (localStorage keys):
- `bronepehota_army` - Player's army state (units, totalCost, faction)
- `bronepehota_rules_version` - Selected rules version for game session
- `bronepehota_panic_enabled` - Panic rule toggle state
- `bronepehota_aimed_shot_enabled` - Aimed shot rule toggle state
- `bronepehota_surprise_attack_enabled` - Surprise attack (rear attack) toggle state

The main app page (`src/app/app/page.tsx`) manages the `Army` state and passes it down to child components.

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

**Adding a new faction**:
1. Update `FactionID` type in `types.ts`
2. Add entry to `factions.json`
3. Create new directory `src/data/{faction}/`
4. Add `squads.json` and `machines.json` files
5. Update imports in `ArmyBuilder.tsx`

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

Adding a new rules version:
1. Create new file in `src/lib/rules/{version}.ts`
2. Export rules object with required game mechanics
3. Register in `rules-registry.ts`

### Component Structure

**Component Organization** (`src/components/`):
```
src/components/
├── cards/           - Card components (UnifiedCompactCard, types)
├── controls/        - Control panels and input components
├── modals/          - Modal components (ImageModal, WeaponSelectorModal, etc.)
├── rules/           - Rules selection and toggle components
├── toggles/         - Toggle components (PanicToggle, AimedShotToggle, etc.)
├── combat/          - Combat-related components
├── encyclopedia/    - Encyclopedia page components
├── landing/         - Landing page components
├── machine/         - Machine-specific components
└── *.tsx           - Other top-level components
```

**Main Page** (`src/app/app/page.tsx`):
- Header with faction branding, view toggle (Штаб/В Бой)
- ArmyBuilder (construction) OR GameSession (gameplay)
- Footer with army stats

**Key Components**:
- `ArmyBuilder.tsx` - Filter/search units, add to army, export/import JSON
- `GameSession.tsx` - Two tabs: "Войска" (units) and "Атака" (combat)
- `UnitCard.tsx` - Individual unit display, combat modal, animated dice
- `CombatAssistant.tsx` - Standalone combat calculator
- `UnitDetailsModal.tsx` - Bottom sheet modal for unit details (mobile swipe-to-close)
- `UnitSelector.tsx` - Unit selection interface with filters

**Rules Components** (`src/components/rules/`):
- `RulesSelector.tsx` - Rules version selection interface
- `RulesVersionSelector.tsx` - Dropdown/picker for rules version
- `RulesInfoModal.tsx` - Modal displaying current rules details
- `StepProgressIndicator.tsx` - Visual step progress for multi-step flows

**Toggle Components** (`src/components/toggles/`):
- `PanicToggle.tsx` - Toggle for panic rule with info modal
- `AimedShotToggle.tsx` - Toggle for aimed shot rule (infantry range x2)
- `SurpriseAttackToggle.tsx` - Toggle for rear attack rule (damage x2)

**Card Components** (`src/components/cards/`):
- `UnifiedCompactCard.tsx` - Unified card component for add/remove/view modes
- `types.ts` - TypeScript types for card components

**UI Components**:
- `FactionSelector.tsx` - Faction selection with visual branding
- `PointBudgetInput.tsx` - Army point budget input
- `FortificationSelector.tsx` - Fortification selection for units
- `DiceRoller.tsx` - Animated dice rolling component
- `SafeImage.tsx` - Image component with error handling
- `DisplayModeToggle.tsx` - Toggle between detailed/compact display modes
- `TabBar.tsx` - Bottom tab navigation for mobile

**Combat Components** (`src/components/combat/`):
- `BottomSheetCombatModal.tsx` - Modal for all combat actions (shot, melee, grenade)
- `ActionSelector.tsx` - Choose action type: ВЫСТРЕЛ/БЛИЖНИЙ БОЙ/ГРАНАТА
- `ParameterInputs.tsx` - Set distance, armor, cover before attack
- `CombatResults.tsx` - Display attack results with grenade blast zone and target checks
- `DiceAnimation.tsx` - Animated dice rolling visuals

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

1. Navigate to the faction's directory: `src/data/{faction}/`
   - Available factions: `polaris`, `protectorate`, `mercenaries`

2. Edit `squads.json` for infantry or `machines.json` for vehicles

3. Add a new unit object with required fields:

**Squad Structure:**
```json
{
  "id": "{faction}_{slugified_name}",
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
      "props": ["Г"],
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
- Props: ["Г"] for grenade, ["БЫ"] for medic, [] for none

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
  - Smooth snap-back animation
- `useCombatFlow.ts` - Combat state machine for shots, melee, grenades
  - `executeShot()`, `executeMelee()`, `executeGrenade()`, `checkGrenadeTarget()`
  - Manages combat parameters, dice rolls, and results
- `useLongPress.ts` - Long-press gesture detection for undo actions

### Long-Press Pattern

**Purpose**: Allow users to undo state changes (marking done/dead) via long-press gesture.

**Usage in SoldierCard** (`src/components/cards/SoldierCard.tsx`):

```typescript
const [isLongPressing, setIsLongPressing] = useState(false);
const [longPressProgress, setLongPressProgress] = useState(0);
const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

const startLongPress = (callback: () => void) => {
  // Show progress bar only after 100ms of holding
  const progressDelay = 100;

  // Long press callback after 600ms
  longPressTimerRef.current = setTimeout(() => {
    callback();
    setIsLongPressing(false);
    setLongPressProgress(1);
  }, 600);

  // Show progress bar after delay
  longPressProgressRef.current = setTimeout(() => {
    setIsLongPressing(true);
    setLongPressProgress(0);

    // Animate progress
    let progress = progressDelay / 600;
    const progressInterval = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) {
        progress = 1;
        clearInterval(progressInterval);
      }
      setLongPressProgress(progress);
    }, 30);
  }, progressDelay);
};

const cancelLongPress = () => {
  if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  if (longPressProgressRef.current) clearTimeout(longPressProgressRef.current);
  setIsLongPressing(false);
  setLongPressProgress(0);
};
```

**Button Logic** (`src/components/cards/soldier-card/SoldierActions.tsx`):

```typescript
// Only start long-press if in the "active" state (for cancellation)
if (isDone) {
  onMouseDown={() => {
    setWasLongPressTriggered(false);
    onStartLongPress(() => {
      setWasLongPressTriggered(true);
      onToggleDone(); // Cancel: reset done state
    });
  }
}

// Short click for activation
onClick={() => {
  if (wasLongPressTriggered) return; // Ignore if long-press fired
  if (!isDone) {
    onToggleDone(); // Activate: mark as done
  }
  setWasLongPressTriggered(false);
}
```

**Behavior**:
- Short click (< 100ms): Activates state (mark done/kill), NO progress bar
- Long press (> 100ms): Progress bar appears, after 600ms → cancels state (reset/resurrect)

**Visual feedback**:
- Progress bar: `h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600` at bottom of card
- Button: `scale-95 opacity-80` during press

### Utilities (`src/lib/`)

- `unit-utils.ts` - Helper functions for unit operations (numbering, validation, etc.)
- `combat-types.ts` - TypeScript types for combat system (CombatParameters, ShotResult, MeleeResult, GrenadeBlastResult, etc.)
- `faction-colors.ts` - Centralized faction color mappings (getFactionColors function)
  - Polaris: red tones, Protectorate: cyan tones, Mercenaries: yellow tones
  - Returns object with all color variants (text, bg, border, glow, etc.)
- `constants.ts` - Application-wide constants
  - LOCAL_STORAGE_KEYS - All localStorage key names
  - DEFAULT_POINT_BUDGETS - Available point budget options
  - Use import { LOCAL_STORAGE_KEYS, DEFAULT_POINT_BUDGETS } from '@/lib/constants'

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
- **Test ID Strategy**: Add `data-testid` attributes to interactive elements for reliable testing
- **Local Cleanup**: Always add `beforeEach` hooks to clear localStorage between tests
- **Mobile Testing**: Use projects in `playwright.config.ts` to test mobile viewports
- **Timeout Management**: Use explicit waits: `await page.waitForLoadState('networkidle')`
- **Auto-webServer**: Playwright config automatically starts dev server - no manual setup needed
- **Debugging E2E Tests**:
  - Use `/webapp-testing` skill to debug failing E2E tests - it can navigate the app, take screenshots, and inspect DOM in real-time
  - Use `/using-superpowers` systematic-debugging skill when encountering bugs, test failures, or unexpected behavior
  - The `webapp-testing` skill provides interactive browser control for manual testing and debugging

**App Navigation Flow** (critical for E2E tests):
```
/app page flow (army creation):
1. Rules Selection → click [data-testid="rules-confirm-button"]
2. Faction Selection → select faction → click [data-testid="faction-continue-button"]
3. Budget Selection → select points → click [data-testid="budget-next-button"]
4. Unit Selection (Army Builder) → add units → click [data-testid="to-battle-button"]
5. Battle Preparation → click [data-testid="start-battle-button"]
6. Game Session → battle mode
```

**Common E2E Testing Pitfalls**:
1. **Skipping steps**: The app has a multi-step flow. Tests cannot jump directly to any screen - must follow the full sequence
2. **Wrong selectors**: When testing toggle components, `data-testid` may be on a wrapper `<div>` while `aria-pressed` is on an inner `<button>`. Use: `container.locator('button[aria-pressed]')`
3. **Async state**: Always use `await page.waitForTimeout(200)` after clicks to allow React state updates

**Helper Functions for E2E Tests**:
```typescript
// Navigate to Army Builder (Unit Selection) through the full flow
async function navigateToArmyBuilder(page: Page) {
  // Step 1: Rules confirmation (first screen)
  await page.click('[data-testid="rules-confirm-button"]');
  await page.waitForTimeout(500);

  // Step 2: Select faction
  await page.click('[data-testid="faction-card-polaris"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="faction-continue-button"]');
  await page.waitForTimeout(500);

  // Step 3: Select budget
  await page.click('button:has-text("350")');
  await page.waitForTimeout(300);
  await page.click('[data-testid="budget-next-button"]');
  await page.waitForTimeout(500);

  // Now on Unit Selection (Army Builder) screen
}
```

**Example Test Structure**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should toggle option on Rules screen', async ({ page }) => {
    // Step 1: Rules confirmation - first screen
    await page.click('[data-testid="rules-confirm-button"]');
    await page.waitForTimeout(500);

    // Now on Faction screen - could test faction-specific features here

    // Or continue to Budget
    await page.click('[data-testid="faction-card-polaris"]');
    await page.click('[data-testid="faction-continue-button"]');
    await page.waitForTimeout(500);

    // Find toggle - data-testid is on container, aria-pressed on inner button
    const toggleContainer = page.getByTestId('some-toggle');
    const toggleButton = toggleContainer.locator('button[aria-pressed]');

    await expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    await toggleButton.click();
    await page.waitForTimeout(200);
    await expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
  });
});
```

**Troubleshooting E2E Tests**:
- **Tests hanging/timeouts**: Usually wrong selector or element not found. Use `/webapp-testing` to inspect live DOM
- **"Element not found"**: Check if `data-testid` exists, or use text selectors like `button:has-text("ТЕКСТ")`
- **Navigation issues**: Always follow the full flow sequence (Rules → Faction → Budget → Units → Battle → Game)
- **Async state problems**: Add `await page.waitForTimeout(200)` after clicks to allow React state updates
- **Toggle components**: `data-testid` may be on wrapper div, use `container.locator('button[aria-pressed]')` for the actual button

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

## Recent Changes
- **PWA Installability Fix (2026-02)**: Fixed PWA manifest for GitHub Pages deployment
  - Changed from `NODE_ENV` to `GITHUB_PAGES` environment variable for basePath control
  - Dynamic manifest generation using Next.js route handler (`src/app/manifest.ts`)
  - Updated `.github/workflows/deploy.yml` to build with `GITHUB_PAGES=true`
  - Local testing: `npm run build` (no basePath)
  - GitHub Pages: `GITHUB_PAGES=true npm run build` (basePath: `/bronepehota`)
- **Code Refactoring (2026-02)**: Major refactoring to eliminate code duplication and improve organization
  - Created centralized `getFactionColors()` utility in `src/lib/faction-colors.ts`
  - Created `constants.ts` for application-wide constants (localStorage keys, point budgets)
  - Organized components into logical directories: `cards/`, `controls/`, `modals/`, `rules/`, `toggles/`
  - Added comprehensive unit tests (370+ tests passing)
  - Replaced duplicate `cn()` implementations with shared utility from `@/lib/utils`
  - Updated faction colors: Protectorate blue→cyan, Mercenaries green→yellow
- **GitHub Pages Fixes (2026-02)**: Fixed encyclopedia images and navigation on GitHub Pages
  - Added `unoptimized` prop to Image components for compatibility
  - Fixed Footer.tsx to use Next.js Link component for proper basePath handling
- **Aimed Shot Feature (2025-02)**: Implemented "11.1 Прицельная стрельба пехотинцев" from official rules
  - Doubles range for infantry when using aimed shot (not moving)
  - Toggle on Rules screen and in combat modal
  - `multiplyRange()` function in game-logic.ts handles D6, D12, D6+2 notation
  - Only available for squads (not machines)
- **Optional Rules Toggles**: Redesigned rules screen with compact toggles
  - `PanicToggle`, `AimedShotToggle`, `SurpriseAttackToggle` components
  - Info modals with detailed rule descriptions
  - States persisted in localStorage
- **E2E Testing Migration (2025-02)**: Migrated from Cucumber BDD to Playwright TypeScript
  - Removed complex Cucumber feature files and step definitions
  - Added `playwright.config.ts` with automatic dev server startup
  - TypeScript-based tests are simpler to write and maintain
  - Auto-starts dev server before tests - no manual setup needed
- **CI/CD Pipeline**: GitHub Actions workflow with parallel quality checks and E2E tests
- **Bottom Sheet Redesign**: `UnitDetailsModal` redesigned as mobile bottom sheet with swipe-to-close gesture (`useBottomSheet` hook)
- **Rules System**: Added multi-version rules support with `rules-registry.ts` and rule implementations (fan, tehno)
- **Rules Selector**: `RulesSelector`, `RulesVersionSelector`, `RulesInfoModal` components
- **Step Progress**: `StepProgressIndicator` component for multi-step flows
- **Unit Selector**: `UnitSelector.tsx` component with filtering
- **Mobile First**: MOBILE FIRST design approach documented, bottom sheet patterns established
