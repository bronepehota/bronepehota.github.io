# Faction Alliances Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let allied factions share units (squads + machines) in the army builder via a declarative `allies` field, generalizing the hardcoded mercenary cross-faction behavior.

**Architecture:** Add an `allies?: FactionID[]` field to faction metadata (declared in `encyclopedia/factions.json`, supports `"*"` wildcard). A pure helper `getAlliedFactions(selected, factions)` resolves the ally set (symmetric + wildcard, source-scoped). `ArmyBuilder` computes the set and passes it to `UnitSelector`, whose filter becomes `faction === selected || alliedFactionIds.has(faction)`. The hardcoded `mercenaries` branches in `UnitSelector` are removed — mercs are now `allies:["*"]`.

**Tech Stack:** TypeScript 5, Next.js 14 (App Router), React 18, Jest (jsdom), Playwright.

## Global Constraints

- Alliances are symmetric and bidirectional; allies share **both squads and machines**; no point/count limits.
- `"*"` in a faction's `allies` means ally of all factions (used for mercenaries).
- Mercenaries' behavior changes intentionally under unification: they now also receive other factions' squads, and all factions now receive the merc machine.
- UI text is Russian; code/identifiers are English.
- Faction plumbing for any future faction must include `FactionSelector.factionStyles` (see import-cards skill Step 6, 13 points).

---

## File Structure

- **Modify** `src/lib/types.ts` — add `allies?: FactionID[]` to `Faction`.
- **Modify** `src/lib/encyclopedia-registry.ts` — add `allies?: string[]` to `EncyclopediaFaction`.
- **Modify** `src/data/encyclopedia/factions.json` — add `allies` arrays.
- **Create** `src/lib/faction-allies.ts` — `getAlliedFactions` helper (pure).
- **Create** `src/__tests__/lib/faction-allies.test.ts` — unit tests for the helper.
- **Modify** `src/components/ArmyBuilder.tsx` (~lines 118-133, 359-442) — enrich `allies`, compute ally set, pass to `UnitSelector`.
- **Modify** `src/components/UnitSelector.tsx` (~lines 84-107) — new `alliedFactionIds` prop, unified filter, remove merc hardcode; add ally badge in the render.
- **Modify** any tests asserting the old hardcoded merc behavior (grep `mercenaries` under `src/__tests__/`).

---

### Task 1: `allies` field on faction types + data

**Files:**
- Modify: `src/lib/types.ts` (`Faction` interface, ~line 13-21)
- Modify: `src/lib/encyclopedia-registry.ts` (`EncyclopediaFaction` interface, ~line 57-68)
- Modify: `src/data/encyclopedia/factions.json`

**Interfaces:**
- Produces: `Faction.allies?: FactionID[]`, `EncyclopediaFaction.allies?: string[]`, and the `allies` values in `encyclopedia/factions.json` consumed by later tasks.

- [ ] **Step 1: Add `allies` to `Faction`**

In `src/lib/types.ts`, inside `export interface Faction { ... }`, add as the last field:

```ts
  allies?: FactionID[]; // faction ids allied with this one (symmetric); "*" = ally of all
```

- [ ] **Step 2: Add `allies` to `EncyclopediaFaction`**

In `src/lib/encyclopedia-registry.ts`, inside `export interface EncyclopediaFaction { ... }`, add (before the closing `}`):

```ts
  allies?: string[];
```

- [ ] **Step 3: Add `allies` data to `encyclopedia/factions.json`**

For each faction object, add an `allies` array:

```json
{ "id": "mercenaries",  "allies": ["*"],           ... },
{ "id": "polaris",      "allies": [],              ... },
{ "id": "protectorate", "allies": ["rutenia"],     ... },
{ "id": "rutenia",      "allies": ["protectorate"], ... }
```

(Keep all existing fields; only add `allies`.)

- [ ] **Step 4: Verify type-check + build**

Run: `npm run type-check`
Expected: PASS (no errors).

Run: `NEXT_PUBLIC_GITHUB_PAGES=true npm run build`
Expected: completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/encyclopedia-registry.ts src/data/encyclopedia/factions.json
git commit -m "feat(alliances): add allies field to faction model + data"
```

---

### Task 2: `getAlliedFactions` helper (TDD)

**Files:**
- Create: `src/__tests__/lib/faction-allies.test.ts`
- Create: `src/lib/faction-allies.ts`

**Interfaces:**
- Produces: `getAlliedFactions(selected: FactionID, factions: FactionLike[]): Set<FactionID>` where `FactionLike = { id: FactionID; allies?: FactionID[] }`. Symmetric + wildcard; only factions in the passed list are considered; excludes `selected`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/faction-allies.test.ts`:

```ts
import { getAlliedFactions } from '@/lib/faction-allies';

const factions = [
  { id: 'polaris', allies: [] },
  { id: 'protectorate', allies: ['rutenia'] },
  { id: 'rutenia', allies: ['protectorate'] },
  { id: 'mercenaries', allies: ['*'] },
];

describe('getAlliedFactions', () => {
  it('symmetric pair resolves both ways', () => {
    expect([...getAlliedFactions('protectorate', factions)].sort()).toEqual(['rutenia']);
    expect([...getAlliedFactions('rutenia', factions)].sort()).toEqual(['protectorate']);
  });

  it('wildcard allies everyone both ways', () => {
    expect([...getAlliedFactions('mercenaries', factions)].sort()).toEqual(['polaris', 'protectorate', 'rutenia']);
    expect(getAlliedFactions('polaris', factions).has('mercenaries')).toBe(true);
  });

  it('faction with no allies still gets wildcard allies (mercenaries) but not others', () => {
    expect([...getAlliedFactions('polaris', factions)].sort()).toEqual(['mercenaries']);
  });

  it('one-side declaration still resolves symmetrically', () => {
    const oneSided = [{ id: 'a', allies: ['b'] }, { id: 'b' }];
    expect([...getAlliedFactions('b', oneSided)]).toEqual(['a']);
    expect([...getAlliedFactions('a', oneSided)]).toEqual(['b']);
  });

  it('excludes self', () => {
    expect(getAlliedFactions('polaris', factions).has('polaris')).toBe(false);
  });

  it('only considers factions present in the passed list', () => {
    const subset = [{ id: 'polaris', allies: [] }, { id: 'mercenaries', allies: ['*'] }];
    expect([...getAlliedFactions('polaris', subset)]).toEqual(['mercenaries']);
  });

  it('undefined allies treated as no allies', () => {
    const noAllies = [{ id: 'a' }, { id: 'b' }];
    expect(getAlliedFactions('a', noAllies).size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/lib/faction-allies.test.ts`
Expected: FAIL — `Cannot find module '@/lib/faction-allies'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/faction-allies.ts`:

```ts
import type { FactionID } from './types';

export interface FactionLike {
  id: FactionID;
  allies?: FactionID[];
}

/**
 * Returns the set of factions allied with `selected` (excluding `selected`).
 *
 * Symmetric + wildcard: A and B are allied if ANY is true:
 *   - A's allies include B
 *   - B's allies include A
 *   - A's allies include "*" (A is ally of all)
 *   - B's allies include "*" (B is ally of all)
 *
 * Only factions present in `factions` (the current source's factions) can be
 * returned, so alliances only activate where both factions exist in the source.
 */
export function getAlliedFactions(
  selected: FactionID,
  factions: FactionLike[],
): Set<FactionID> {
  const me = factions.find((f) => f.id === selected);
  const out = new Set<FactionID>();
  for (const f of factions) {
    if (f.id === selected) continue;
    const meListsThem = !!me?.allies && (me.allies.includes(f.id) || me.allies.includes('*'));
    const theyListMe = !!f.allies && (f.allies.includes(selected) || f.allies.includes('*'));
    if (meListsThem || theyListMe) out.add(f.id);
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/__tests__/lib/faction-allies.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/faction-allies.ts src/__tests__/lib/faction-allies.test.ts
git commit -m "feat(alliances): getAlliedFactions helper (symmetric + wildcard)"
```

---

### Task 3: Wire `ArmyBuilder` to compute + pass the ally set

**Files:**
- Modify: `src/components/ArmyBuilder.tsx` (~lines 118-133 enrichment; ~359-442 the `<UnitSelector>` render)

**Interfaces:**
- Consumes: `getAlliedFactions` from Task 2; `EncyclopediaFaction.allies` from Task 1.
- Produces: `ArmyBuilder` passes `alliedFactionIds: Set<FactionID>` to `<UnitSelector>` (prop added in Task 4).

- [ ] **Step 1: Enrich `allies` in the faction map**

In `src/components/ArmyBuilder.tsx`, find the `availableFactions` mapping (~line 118-133) that builds the display object from `getEncyclopediaFaction(f.id)`. Add `allies` to the returned object:

```ts
const availableFactions = (sourceData?.factions || [])
  .map((f) => {
    const encyclopediaFaction = getEncyclopediaFaction(f.id);
    if (!encyclopediaFaction) return null;
    return {
      id: encyclopediaFaction.id,
      name: encyclopediaFaction.name,
      color: encyclopediaFaction.color || '#94a3b8',
      symbol: encyclopediaFaction.symbol,
      description: encyclopediaFaction.description || '',
      homeWorld: encyclopediaFaction.homeWorld || '',
      motto: encyclopediaFaction.motto || '',
      allies: encyclopediaFaction.allies ?? [],   // NEW
    };
  })
  .filter((f): f is NonNullable<typeof f> => f !== null);
```

- [ ] **Step 2: Import the helper + compute the ally set**

At the top of `ArmyBuilder.tsx`, add the import:

```ts
import { getAlliedFactions } from '@/lib/faction-allies';
```

Near where `selectedFaction` / `army.faction` is used in render (after `availableFactions` is computed), add:

```ts
const alliedFactionIds = army.faction
  ? getAlliedFactions(army.faction, availableFactions)
  : new Set<FactionID>();
```

(If `FactionID` isn't imported in this file, import the type: `import type { FactionID } from '@/lib/types';` — check existing imports first; `Army`/`ArmyUnit` are likely already imported from `types`.)

- [ ] **Step 3: Pass the prop to `UnitSelector`**

Find the `<UnitSelector ... />` render (~line 359-442) and add the prop:

```tsx
<UnitSelector
  selectedFaction={army.faction}
  alliedFactionIds={alliedFactionIds}   // NEW
  squads={typedSquads}
  machines={typedMachines}
  // ...existing props unchanged
/>
```

- [ ] **Step 4: Verify type-check**

Run: `npm run type-check`
Expected: FAIL with `alliedFactionIds` missing on `UnitSelector` props OR type error (Task 4 adds the prop). This is expected — proceed to Task 4. (If it passes because the prop is optional, that's fine too; Task 4 makes it required.)

> Note: This task and Task 4 are tightly coupled (the prop producer + consumer). Commit after Task 4 makes type-check pass. If you prefer a green commit here, make `alliedFactionIds` optional in Task 4 first, then this task type-checks.

- [ ] **Step 5: (Commit deferred to Task 4)**

---

### Task 4: `UnitSelector` unified filter + remove merc hardcode

**Files:**
- Modify: `src/components/UnitSelector.tsx` (~lines 80-110 props + filter; ~line 84 squads; ~86-91 machines; ~94 + 103-105 merc append)
- Modify: any tests under `src/__tests__/` asserting the old hardcoded merc behavior.

**Interfaces:**
- Consumes: `alliedFactionIds: Set<FactionID>` prop from `ArmyBuilder`.
- Produces: `availableUnits` includes own + allied squads AND machines; the `selectedFaction === 'mercenaries'` special-cases are gone.

- [ ] **Step 1: Add the `alliedFactionIds` prop**

In `src/components/UnitSelector.tsx`, find the props interface/type (the component receives `selectedFaction`, `squads`, `machines`, etc.). Add:

```ts
alliedFactionIds: Set<FactionID>;
```

(Import `FactionID` from `@/lib/types` if not already.)

- [ ] **Step 2: Replace the filter block**

Find the block at ~lines 84-107 (the `availableSquads` / `availableMachines` / `allMercenaries` / `availableUnits` useMemos). Replace it with:

```ts
const isAvailable = useCallback(
  (faction: FactionID) => faction === selectedFaction || alliedFactionIds.has(faction),
  [selectedFaction, alliedFactionIds],
);

const availableSquads = useMemo(
  () => squads.filter((s) => isAvailable(s.faction)),
  [squads, isAvailable],
);
const availableMachines = useMemo(
  () => machines.filter((m) => isAvailable(m.faction)),
  [machines, isAvailable],
);

const availableUnits: UnitDisplay[] = useMemo(
  () => [
    ...availableSquads.map((s) => ({ type: 'squad' as const, data: s })),
    ...availableMachines.map((m) => ({ type: 'machine' as const, data: m })),
  ],
  [availableSquads, availableMachines],
);
```

This removes:
- the `if (selectedFaction === 'mercenaries') return machines;` branch (machines now via `allies:["*"]`),
- the `allMercenaries` memo and its append to `availableUnits`.

Ensure `useCallback` is imported from `react` (add to the existing react import if not).

- [ ] **Step 3: Update the existing mercenary filter (FilterType)**

If the `FilterType` `'mercenary'` filter (around line 116-118) referenced the removed `allMercenaries`, update it to filter `availableUnits` by `data.faction === 'mercenaries'` instead. Read the current filter code and adjust to:

```ts
// 'mercenary' filter shows allied mercenary squads within availableUnits
case 'mercenary':
  return availableUnits.filter((u) => u.type === 'squad' && u.data.faction === 'mercenaries');
```

(Match the existing filter's return shape — read the current code first.)

- [ ] **Step 4: Update/verify existing tests**

Run: `grep -rl "mercenaries" src/__tests__/ | xargs grep -l "availableMachines\|allMercenaries\|selectedFaction === 'mercenaries'"` to find tests asserting old merc behavior.

For each such test, update the expectation to the new model:
- A non-merc faction's available units now include merc squads **and** the merc machine (via `allies:["*"]`).
- The merc faction's available units now include other factions' squads AND machines.

If a test directly unit-tests `UnitSelector`, it must now pass `alliedFactionIds` (e.g., `alliedFactionIds={new Set(['mercenaries'])}` for a polaris selection). If no `UnitSelector` unit test exists, rely on `faction-allies.test.ts` (Task 2) + Playwright (Task 6) and skip this step.

- [ ] **Step 5: Verify type-check + unit tests**

Run: `npm run type-check`
Expected: PASS.

Run: `npm run test`
Expected: PASS (all suites, including updated merc tests).

- [ ] **Step 6: Commit (covers Task 3 + Task 4)**

```bash
git add src/components/ArmyBuilder.tsx src/components/UnitSelector.tsx
git commit -m "feat(alliances): unified ally filter in UnitSelector; remove merc hardcode"
```

(Also `git add` any test files changed in Step 4.)

---

### Task 5: Ally badge in the unit list

**Files:**
- Modify: `src/components/UnitSelector.tsx` (the unit-list item render — wherever each `UnitDisplay` is rendered as a card/row)

**Interfaces:**
- Consumes: `selectedFaction` + each unit's `data.faction` + faction display names (from `factionDisplayNames` in `@/lib/faction-colors`).

- [ ] **Step 1: Add a badge for non-selected-faction units**

In the unit-list rendering inside `UnitSelector` (the `.map` over `availableUnits` that renders each unit card/row), add a badge when `unit.data.faction !== selectedFaction`:

```tsx
import { factionDisplayNames } from '@/lib/faction-colors';

// inside the unit card render:
{unit.data.faction !== selectedFaction && (
  <span
    className="ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-slate-700/70 text-slate-200"
    title={`Союзник: ${factionDisplayNames[unit.data.faction] ?? unit.data.faction}`}
  >
    {factionDisplayNames[unit.data.faction] ?? unit.data.faction}
  </span>
)}
```

Place it next to the unit's name/shortName in the card. Read the existing render to find the exact spot (search for where `data.name` / `data.shortName` is rendered for each unit).

- [ ] **Step 2: Verify in the app (Playwright)**

Start dev server: `npm run dev`. Open `http://localhost:3000/app`, complete setup choosing **Protectorate** (source star_system). In the army builder, confirm:
- Рутения units appear in the list, each with an orange «Рутения» badge.
- Наёмники units appear with a «Наёмники» badge.
- Protectorate's own units have no badge.

(Capture a screenshot; the badge must be visible on allied units only.)

- [ ] **Step 3: Commit**

```bash
git add src/components/UnitSelector.tsx
git commit -m "feat(alliances): ally-faction badge on non-selected-faction units"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: type-check + lint + unit tests**

Run: `npm run validate`
Expected: PASS (type-check + lint + unit tests; no E2E).

- [ ] **Step 2: production build**

Run: `NEXT_PUBLIC_GITHUB_PAGES=true npm run build`
Expected: completes, all pages prerender, no lore↔source mismatch.

- [ ] **Step 3: Playwright alliance matrix**

`npm run dev`, then for each of these selections in star_system verify available units via DOM (`document.querySelectorAll` for unit cards, or screenshots):
- **Protectorate**: own + Рутения (badge) + Наёмники (badge). NOT Polaris.
- **Рутения**: own + Protectorate (badge) + Наёмники (badge). NOT Polaris.
- **Polaris**: own + Наёмники (badge). NOT Рутения, NOT Protectorate.
- **Наёмники**: own + Polaris + Protectorate + Рутения (all badged).
- **Tehnolog source, Polaris**: own + Наёмники. NOT Рутения (absent from tehnolog).

- [ ] **Step 4: Final commit (if any test/verification tweaks)**

```bash
git add -A   # only verification-related changes, if any
git commit -m "test(alliances): verification" || echo "nothing to commit"
```

- [ ] **Step 5: Open PR**

```bash
git push -u origin feat/faction-alliances
gh pr create --base main --title "feat: faction alliances (allied units in army builder)" --body "..."
```

---

## Self-Review (completed)

- **Spec coverage:** data model (Task 1) ✓; helper (Task 2) ✓; builder wiring (Task 3) ✓; UnitSelector filter + merc migration (Task 4) ✓; UI badge (Task 5) ✓; edge cases (source without Рутения — Task 6 step 3) ✓; testing (Task 2 unit, Task 6 Playwright) ✓.
- **Placeholders:** none — all steps have concrete code/commands.
- **Type consistency:** `getAlliedFactions` returns `Set<FactionID>` (Task 2) → `alliedFactionIds: Set<FactionID>` prop (Task 4) → `.has(faction)` (Task 4 filter) ✓. `allies` field name consistent across types/data/helper ✓.
