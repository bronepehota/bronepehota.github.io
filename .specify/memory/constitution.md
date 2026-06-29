<!--
Sync Impact Report:
Version change: 2.1.0 → 2.2.0
Modified principles: Reference Documentation (updated with new TXT file paths)
Added sections:
  - Core Principle VIII: Rules Version System (new principle)
Removed sections: None
Templates requiring updates:
  ✅ plan-template.md - Constitution Check updated with rules version principle
  ✅ spec-template.md - No changes needed
  ✅ tasks-template.md - No changes needed
  ✅ All command templates verified
Follow-up TODOs: None
-->

# Бронепехота (Bronepehota) Constitution

## Core Principles

### I. Russian Language UI

All user-facing text MUST be in Russian. This includes all UI elements, error messages, tooltips, and API responses that reach the client.

**Rationale**: The application serves Russian-speaking users for a tabletop wargame. Consistent Russian localization ensures accessibility and user experience.

**Implementation**:
- UI component text: Russian
- API error messages: Russian (e.g., `Ошибка чтения данных`, `Фракция не найдена`)
- Code identifiers: English (variable names, function names, types)
- Comments and documentation: English

### II. File-Based Data Storage

Game data (factions, squads, machines) MUST be stored as JSON files in `src/data/`. API routes MUST use synchronous file operations (`readFileSync`, `writeFileSync`).

**Rationale**: Simple, version-controllable data storage without external database dependencies. Synchronous operations are acceptable for the expected scale and simplify error handling.

**Constraints**:
- All API routes under `src/app/api/armlists/` operate on JSON files
- POST handlers handle both create (new ID generation) and update (existing ID)
- Image uploads save to `public/images/` with timestamp + random suffix for uniqueness

### III. Client-Side Army State

Army state MUST be persisted to `localStorage` using key `bronepehota_army`. State MUST be managed through React useState in the main page component and passed down to children.

**Rationale**: Enables offline gameplay, simplifies state management, provides instant persistence without server calls. Distinguishes template data (immutable definitions) from runtime data (mutable game state).

**Data Separation**:
- Template data: `Squad`, `Machine` from JSON (read-only, cached)
- Runtime data: `ArmyUnit` with current state (durability, ammo, deadSoldiers, actionsUsed)

### IV. Type Safety

All TypeScript types MUST be defined in `src/lib/types.ts`. Adding new game entities (e.g., new faction) requires updating both the type definition and the corresponding JSON data file.

**Rationale**: Central type definitions ensure consistency across the application, enable compile-time error checking, and serve as single source of truth for data structures.

**Requirements**:
- `FactionID` type MUST list all valid faction identifiers
- Type changes MUST include corresponding JSON updates
- No `any` types without explicit justification

### V. Test Game Logic

Game mechanics in `src/lib/game-logic.ts` MUST have corresponding Jest tests in `src/__tests__/`. Focus areas: dice notation parsing, hit calculation, damage calculation, melee combat.

**Rationale**: Game logic correctness is critical for fair gameplay. Automated tests prevent regressions when mechanics change and document expected behavior.

**Test Requirements**:
- Dice notation: `parseRoll`, `executeRoll` with formats like "D6", "D12+2", "2D12", "ББ"
- Combat calculations: `calculateHit`, `calculateDamage`, `calculateMelee`
- Edge cases: boundary values, special inputs ("ББ" for melee)
- Test files use `.test.ts` suffix in `src/__tests__/`

### VI. Mobile-First Experience

The application MUST provide excellent usability on both desktop browsers and mobile devices. Army management features MUST be optimized for mobile interaction patterns.

**Rationale**: Players use the application during tabletop game sessions where mobile devices are the primary interface. Poor mobile usability directly impacts the game experience. Soldiers must be easily identifiable by their images during gameplay.

**Requirements**:
- Touch-friendly controls: minimum 44x44px tap targets, no hover-only interactions
- Responsive layout: mobile-first design using Tailwind breakpoints
- Army management core flows (build, edit, game session) MUST work seamlessly on mobile
- Viewport meta tag configured for mobile (no zoom, proper scaling)
- Text input optimized for mobile keyboards
- Critical actions (add unit, modify state, combat) accessible within 1-2 taps
- Performance: fast load times on mobile networks (4G/5G)
- **Soldier images**: MUST be clearly visible and identifiable on mobile for unit recognition during gameplay

**Implementation**:
- Use Tailwind responsive utilities: `hidden md:inline` for conditional display
- Test all user flows on actual mobile devices or mobile emulation
- Prefer bottom navigation/sheet modals over dropdowns on mobile
- Swipe gestures where appropriate (e.g., delete, dismiss)
- Collapse complex UI into expandable sections on small screens
- Soldier/unit images MUST render at sufficient size and quality on mobile screens
- Image loading MUST be optimized for mobile (lazy load, appropriate sizing)

### VII. Production-Grade Visual Design

The application MUST exhibit production-grade visual design quality that avoids generic AI-generated aesthetics. All interfaces MUST demonstrate deliberate design choices with clear visual hierarchy, strategic use of accent colors, and purposeful interaction patterns.

**Rationale**: High-quality visual design establishes credibility, enhances user trust, and creates a distinctive application identity. Generic designs fail to engage users and undermine the perceived quality of the game companion tool. The dark theme aesthetic requires thoughtful contrast management and intentional color deployment.

**Visual Design Requirements**:
- **Color Strategy**: Use faction colors (Polaris red, Protectorate blue, Mercenaries yellow) as strategic accents, not overwhelming backgrounds. Reserve dark slate tones for structure, use faction colors ONLY for:
  - Active state indicators (selected tabs, enabled buttons)
  - Faction identity markers (borders, badges, branding elements)
  - Critical action buttons (primary CTAs)
  - Status differentiation (damage, faction-specific states)
- **Typography Hierarchy**: Establish clear visual levels using:
  - Inter font family with proper weight scaling (400/500/600/700)
  - Size differentiation: headers (24px+), subheaders (18-20px), body (14-16px), captions (12px)
  - Line height ratio 1.5-1.6 for readability
  - Letter spacing -0.01 for headings, 0 for body text
- **Spacing System**: Use Tailwind's spacing scale consistently:
  - Base unit: 4px (1 in Tailwind)
  - Component padding: 12-16px (3-4)
  - Section gaps: 24-32px (6-8)
  - Page margins: 16-24px on mobile, 32-48px on desktop
- **Visual Hierarchy**: Guide user attention through:
  - Primary actions: highest contrast, larger size, accent color
  - Secondary actions: medium contrast, neutral colors
  - Informational content: lower contrast, proper spacing
  - Disabled states: clearly distinguishable (opacity + grayscale)
- **Glassmorphism & Depth**: Use judiciously for layer separation:
  - `.glass` for overlays (70% opacity, 10px blur)
  - `.glass-strong` for modals/panels (90% opacity, 20px blur)
  - Limit to 2-3 depth levels maximum
  - Ensure text contrast WCAG AA minimum (4.5:1)
- **Motion & Transitions**: Apply consistent easing:
  - Standard transitions: 200ms cubic-bezier(0.4, 0, 0.2, 1)
  - Micro-interactions (hover, focus): 150ms same curve
  - State changes (modal open, tab switch): 200-300ms
  - No motion for load states (instant feedback)
- **Border & Radius Strategy**:
  - Default radius: 6-8px for cards, buttons
  - Small radius: 4px for badges, tags
  - Large radius: 12-16px for modals, panels
  - Border width: 1px standard, 2px for emphasis
  - Border colors: slate-700 for subtle, slate-500 for visible

**Component Design Standards**:
- **Cards**: Subtle borders (slate-700), 8px radius, 16px padding, hover state with slight border brightening
- **Buttons**:
  - Primary: faction-colored background, white text, no border
  - Secondary: slate-700 background, slate-200 text, 1px border
  - Ghost: transparent background, slate-300 text, no border (hover: slate-800 bg)
  - All buttons: 200ms transition, 44px min height, 8px radius
- **Inputs**: slate-800 background, slate-300 text, 1px slate-600 border, 8px radius, focus: faction-color border
- **Modals**: glass-strong background, 16px radius, 24px max-width on mobile, 600px on desktop
- **Tabs**: Underline style for primary tabs, pill style for filters, active state uses faction color

**Anti-Patterns to Avoid**:
- Large solid faction-color backgrounds (use as accents only)
- Random border radius values (stick to scale: 4/8/12/16px)
- Overusing gradients (linear gradient only for body background)
- Excessive shadow layers (max 2 levels: card shadow, modal shadow)
- Inconsistent spacing (always use Tailwind spacing scale)
- Generic "modern" trends without purpose (e.g., unnecessary glass, forced animations)
- Full-width buttons on desktop (target 200-400px width)

**Design Consistency Checks**:
- All components use consistent spacing from Tailwind scale
- Faction colors appear only in approved contexts
- All text maintains WCAG AA contrast minimum (4.5:1)
- Interactive elements have 44px minimum touch target
- All transitions use 200ms with same easing curve
- Border radius values follow defined scale
- No more than 3 depth levels in glassmorphism

### VIII. Rules Version System

The application MUST support multiple rules editions (official 'tehnolog' and fan 'star_system'). Users MUST be able to select and switch between rules editions, and game mechanics calculations MUST respect the selected edition.

**Rationale**: The Бронепехота wargame has multiple rule editions with significantly different combat mechanics. Official rules (by Технолог) use "Виртуальная стрельба" (direct comparison for hit, roll > armor for damage). Fan rules (by Панов) use zone-based durability damage and different modifiers. Supporting both editions ensures all players can use the application regardless of their preferred ruleset.

**Requirements**:
- Rules version MUST be persisted to `localStorage` with key `bronepehota_rules_version`
- Default version MUST be 'tehnolog' (official rules)
- Rules version MUST be selectable in the UI (header or settings)
- All combat calculations (hit, damage, melee) MUST use the selected rules edition
- Rules implementations MUST be located in `src/lib/rules/` directory:
  - `tehnolog.ts` - Official rules by Технолог
  - `fan.ts` - Fan rules by Панов
- Common dice logic MUST be shared in `src/lib/game-logic.ts`

**Rules Editions**:
- **tehnolog** (Official rules by Технолог):
  - Hit calculation: Direct comparison (roll >= distance)
  - Damage: "Виртуальная стрельба" - each die > armor = 1 wound
  - Fortifications: Add to target armor (light +1, bunker +2, heavy +3)
  - Tech damage: Uses "Виртуальная стрельба" (each die > armor = 1 damage)
  - Speed sectors: Only affect movement, NOT hit calculation
- **fan** (Fan rules by Панов):
  - Hit calculation: Lookup table or simplified formula
  - Damage: Each die > armor = 1 wound (same as official)
  - Fortifications: Add to effective distance (light +1, bunker +2)
  - Tech damage: Zone-based comparison (green/yellow/red zones)
    - D6 = 1 damage, D12 = 2 damage, D20 = 3 damage on penetration
  - Special effects: Support for effects (Взрыв, Ремонт, Burst)

**Implementation**:
- Rules registry pattern: `rulesRegistry` maps version IDs to implementations
- Type-safe rules version IDs: `RulesVersionID = 'tehnolog' | 'fan'`
- Each rules module MUST export: `calculateHit`, `calculateDamage`, `calculateMelee`
- UI MUST show current rules version and provide easy switching
- Combat assistant MUST respect selected rules version

## Development Standards

### Reference Documentation

Official and fan game rules are located in `docs/` as TXT files (converted from PDF):
- `docs/tehnolog/official_rules.txt` - Official rules by Технолог (БРОНЕПЕХОТА Правила игры)
- `docs/star_system/fan_rules.md` - Fan rules by Панов (Правила игры Фанатская редакция 2025)

These TXT files contain the authoritative source of truth for game mechanics, unit statistics, and faction rules. All game logic implementation MUST align with these reference materials.

**Rationale**: The TXT files provide searchable, version-controllable access to the complete rulesets. They serve as the reference for implementing combat mechanics and resolving disputes about rule interpretation.

**Usage**:
- When implementing new game mechanics, reference the appropriate rules file for correct formulas
- When adding new combat calculations, verify against the corresponding rules edition
- When fixing bugs in combat logic, cross-reference with the authoritative rules text
- Discrepancies between implementation and reference docs MUST be documented and resolved
- The VK community album (https://vk.com/album-233498256_310668795) contains army lists for unit data verification

### Dice Notation

Game mechanics use specific dice notation formats:
- Range: "D6", "D12", "D20" (single die)
- Power: "1D6", "2D12" (multi-die with optional bonus)
- Melee: "ББ" (special case, no roll)
- Bonus modifier: "+N" suffix (e.g., "D12+2")

### Faction System

Three factions are defined:
- `polaris` - Red color (#ef4444)
- `protectorate` - Blue color (#3b82f6)
- `mercenaries` - Yellow color (#eab308)

Adding a new faction requires:
1. Update `FactionID` type in `src/lib/types.ts`
2. Add faction entry to `src/data/factions.json`
3. Define faction-specific styling color

### Component Architecture

- Main page (`src/app/page.tsx`) manages `Army` state
- View toggle between ArmyBuilder (construction) and GameSession (gameplay)
- Nested editor pattern: `ArmlistEditor` → `SquadEditor`/`MachineEditor` → soldier/weapon sub-editors
- Image upload supports: file picker, drag-drop, clipboard paste (Ctrl+V)
- Rules version selector in header allows switching between 'tehnolog' and 'fan' editions

### Styling Conventions

- **Tailwind CSS** with dark theme (slate-900 base)
- Mobile-first responsive design
- Hide labels on mobile using `hidden md:inline`
- Path alias `@/*` maps to `src/*`
- Glassmorphism utilities: `.glass` and `.glass-strong` for layered UI
- Custom scrollbar: `.custom-scrollbar` class
- Smooth transitions: 200ms cubic-bezier(0.4, 0, 0.2, 1) for all interactive elements

## Quality Gates

### Before Commit

- `npm run lint` MUST pass without errors
- `npm run test` MUST pass all tests
- TypeScript compilation MUST succeed
- New game logic features MUST include tests
- Visual design MUST meet component design standards
- Color contrast MUST meet WCAG AA minimum (4.5:1)
- All interactive elements MUST have 44px minimum touch target
- Rules-specific calculations MUST be tested against reference docs

### Before Release

- All user flows tested manually
- Error messages verified to be in Russian
- Image upload functionality validated (all three methods)
- Faction colors consistent across UI
- Game mechanics verified against `docs/tehnolog/official_rules.txt` for 'tehnolog' edition
- Game mechanics verified against `docs/star_system/fan_rules.md` for 'fan' edition
- **Mobile testing**: All core flows tested on mobile device or emulation
- **Touch targets**: Minimum 44x44px for all interactive elements verified
- **Soldier images**: Visible and identifiable on mobile for unit selection
- **Visual design review**: Component consistency validated
- **Accessibility**: Screen reader compatibility tested
- **Performance**: Load time under 3 seconds on 4G mobile
- **Rules version testing**: Both 'tehnolog' and 'fan' editions tested with example scenarios

### Code Review Checklist

- [ ] Russian language for all user-facing text
- [ ] Type definitions updated for new entities
- [ ] Tests added/updated for game logic changes
- [ ] No `any` types without justification
- [ ] localStorage key remains `bronepehota_army` for army state
- [ ] localStorage key for rules version is `bronepehota_rules_version`
- [ ] File operations use synchronous APIs
- [ ] Game mechanics aligned with appropriate rules edition (tehnolog or fan)
- [ ] Rules-specific logic placed in correct `src/lib/rules/` module
- [ ] Mobile layout tested (responsive design, touch targets)
- [ ] No hover-only interactions that break mobile usability
- [ ] Soldier/unit images clearly visible on mobile for gameplay identification
- [ ] Visual design follows component design standards
- [ ] Faction colors used only in approved contexts
- [ ] All text meets WCAG AA contrast minimum
- [ ] Spacing follows Tailwind scale
- [ ] Transitions use 200ms standard easing
- [ ] Border radius values follow defined scale (4/8/12/16px)
- [ ] Glassmorphism limited to 2-3 depth levels
- [ ] No generic design anti-patterns present
- [ ] Rules version selection tested for both editions

## Governance

### Amendment Process

1. Principle changes require updating this document and incrementing version
2. Version follows semantic versioning (MAJOR.MINOR.PATCH):
   - MAJOR: Backward-incompatible changes (e.g., removing data storage principle)
   - MINOR: New principle or section added
   - PATCH: Clarifications, wording improvements
3. Updates MUST propagate to dependent templates (plan, spec, tasks)
4. Date stamp MUST be updated for any change

### Compliance

- All features and code changes MUST align with these principles
- Constitution Check in plan template MUST verify compliance before implementation
- Violations require explicit justification in Complexity Tracking table
- Runtime development guidance in `CLAUDE.md` complements this constitution

### Authority

This constitution supersedes all other practices. In case of conflict between this document and general coding practices, these principles take precedence for the Бронепехота project.

**Version**: 2.2.0 | **Ratified**: 2026-01-04 | **Last Amended**: 2026-01-14
