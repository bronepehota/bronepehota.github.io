# Sub-faction visual hierarchy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show Рутения nested under Протекторат and Мёртвый Флот under Полярис as visual sub-factions (encyclopedia, landing, faction picker, unit-selector badges) — without changing the unit-availability mechanic.

**Architecture:** Add a `parent` field to factions (display-only; unit availability stays on the existing `allies` system). A pure `faction-hierarchy.ts` module derives ordering + relationships from that field. Each UI surface consumes the helpers to order factions parent→child and tag sub-factions. The unit-selector ally badge becomes relationship-aware («Подфракция»/«Основная»/«Союзник»).

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind, Jest (unit), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-07-29-subfactions-design.md`
**Branch:** `feat/subfactions`

## Global Constraints

- **Mobile-first** UI; all UI text in **Russian**, code/ids in English.
- **Do NOT change unit availability.** The `allies` field + `getAlliedFactions` remain the source of truth for who can field whose units. `parent` is display-only.
- `FactionID` is `string` (`src/lib/types.ts:3`) — no union to edit.
- Each task ends green: `npm run type-check` clean. Logic tasks add Jest tests; UI tasks verified by type-check + Task 9 E2E.
- Final gate: `npm run type-check && npm run test && NEXT_PUBLIC_GITHUB_PAGES=true npm run build`.

---

## File Structure

- **Create** `src/lib/faction-hierarchy.ts` — pure helpers: ordering + parent/sub-faction/relation queries.
- **Create** `src/__tests__/lib/faction-hierarchy.test.ts` — unit tests for the above (TDD).
- **Modify** `src/lib/types.ts` — add `parent?` to `Faction`.
- **Modify** `src/lib/encyclopedia-registry.ts` — add `parent?` to `EncyclopediaFaction`.
- **Modify** `src/data/encyclopedia/factions.json` — set `parent` on rutenia + dead_fleet.
- **Modify** `src/components/encyclopedia/FactionsListPage.tsx` — order + «Подфракция» tag + «Включает:» note.
- **Modify** `src/components/encyclopedia/EncyclopediaPage.tsx` — faction chips order via helper.
- **Modify** `src/components/landing/FactionsSection.tsx` — order + tag.
- **Modify** `src/components/controls/FactionSelector.tsx` — order + tag.
- **Modify** `src/components/ArmyBuilder.tsx` — carry `parent` through `availableFactions`.
- **Modify** `src/components/UnitSelector.tsx` — relationship-aware ally badge label.
- **Modify** `src/components/CompactUnitCard.tsx` + `src/components/machine/MachineCard.tsx` — accept + show the ally-label.
- **Create/extend** `e2e/subfactions.spec.ts` — E2E for ordering/tags/badges.

---

### Task 1: Add `parent` field to faction types + data

**Files:**
- Modify: `src/lib/types.ts` (`Faction` interface, ~line 13-22)
- Modify: `src/lib/encyclopedia-registry.ts` (`EncyclopediaFaction` interface, ~line 73-88)
- Modify: `src/data/encyclopedia/factions.json` (rutenia + dead_fleet entries)

**Interfaces:**
- Produces: `Faction.parent?: FactionID`, `EncyclopediaFaction.parent?: FactionID`; `rutenia.parent = "protectorate"`, `dead_fleet.parent = "polaris"`.

- [ ] **Step 1: add `parent?` to the `Faction` type**

In `src/lib/types.ts`, inside the `Faction` interface, add after the `allies` field:
```ts
  allies?: FactionID[]; // faction ids allied with this one (symmetric); "*" = ally of all
  /** Parent faction id — when set, this faction is a *sub-faction* of `parent`
   *  for display purposes (nesting, «Подфракция» tags). Does NOT affect unit
   *  availability, which is governed by `allies`. */
  parent?: FactionID;
```

- [ ] **Step 2: add `parent?` to `EncyclopediaFaction`**

In `src/lib/encyclopedia-registry.ts`, inside `EncyclopediaFaction`, add (next to `allies?`):
```ts
  allies?: string[];
  /** Parent faction id — display-only sub-faction grouping (see `Faction.parent`). */
  parent?: string;
```

- [ ] **Step 3: set `parent` on the two sub-factions in JSON**

In `src/data/encyclopedia/factions.json`, add `"parent"` to the rutenia and dead_fleet entries (e.g. right after `"allies"`):
```json
    "id": "rutenia",
    ...
    "allies": ["protectorate"],
    "parent": "protectorate",
```
```json
    "id": "dead_fleet",
    ...
    "allies": ["polaris"],
    "parent": "polaris",
```
Leave polaris / protectorate / mercenaries without `parent`.

- [ ] **Step 4: verify**

Run: `npm run type-check`
Expected: clean (no errors).

- [ ] **Step 5: commit**
```bash
git add src/lib/types.ts src/lib/encyclopedia-registry.ts src/data/encyclopedia/factions.json
git commit -m "feat(factions): add display-only \`parent\` field (sub-faction grouping)"
```

---

### Task 2: `faction-hierarchy.ts` helpers (TDD)

**Files:**
- Create: `src/__tests__/lib/faction-hierarchy.test.ts`
- Create: `src/lib/faction-hierarchy.ts`

**Interfaces:**
- Consumes: faction objects with `{ id: FactionID; parent?: FactionID }` (from Task 1).
- Produces (all exported from `src/lib/faction-hierarchy.ts`):
  - `getParent<T>(factionId, factions) => T | undefined`
  - `getSubFactions<T>(parentId, factions) => T[]`
  - `isSubFaction(factionId, factions) => boolean`
  - `orderedFactions<T>(factions) => T[]` — top-level in canonical order, each followed by its sub-factions; custom top-level last; orphan children appended.
  - `relationTo(unitFactionId, selectedFactionId, factions) => 'own' | 'subfaction' | 'parent' | 'ally'`

- [ ] **Step 1: write the failing tests**

Create `src/__tests__/lib/faction-hierarchy.test.ts`:
```ts
import {
  getParent, getSubFactions, isSubFaction, orderedFactions, relationTo,
} from '@/lib/faction-hierarchy';

const F = [
  { id: 'polaris' },
  { id: 'protectorate' },
  { id: 'mercenaries' },
  { id: 'rutenia', parent: 'protectorate' },
  { id: 'dead_fleet', parent: 'polaris' },
];

describe('faction-hierarchy', () => {
  it('getParent returns the parent faction', () => {
    expect(getParent('rutenia', F)?.id).toBe('protectorate');
    expect(getParent('polaris', F)).toBeUndefined();
  });

  it('getSubFactions returns children of a parent', () => {
    expect(getSubFactions('polaris', F).map(f => f.id)).toEqual(['dead_fleet']);
    expect(getSubFactions('protectorate', F).map(f => f.id)).toEqual(['rutenia']);
    expect(getSubFactions('mercenaries', F)).toEqual([]);
  });

  it('isSubFaction is true only for factions with a parent', () => {
    expect(isSubFaction('rutenia', F)).toBe(true);
    expect(isSubFaction('dead_fleet', F)).toBe(true);
    expect(isSubFaction('polaris', F)).toBe(false);
  });

  it('orderedFactions nests each sub-faction right after its parent', () => {
    expect(orderedFactions(F).map(f => f.id)).toEqual([
      'polaris', 'dead_fleet', 'protectorate', 'rutenia', 'mercenaries',
    ]);
  });

  it('orderedFactions puts unknown/custom top-level factions last, orphans at the very end', () => {
    const f = [...F, { id: 'custom_a' }, { id: 'orphan', parent: 'missing' }];
    const ids = orderedFactions(f).map(x => x.id);
    expect(ids).toEqual([
      'polaris', 'dead_fleet', 'protectorate', 'rutenia', 'mercenaries', 'custom_a', 'orphan',
    ]);
  });

  it('relationTo classifies the four relationships', () => {
    expect(relationTo('protectorate', 'protectorate', F)).toBe('own');
    // unit is a child of the selected faction
    expect(relationTo('rutenia', 'protectorate', F)).toBe('subfaction');
    // unit is the parent of the selected (sub-)faction
    expect(relationTo('protectorate', 'rutenia', F)).toBe('parent');
    // plain ally (e.g. mercenaries) and anything else
    expect(relationTo('mercenaries', 'protectorate', F)).toBe('ally');
    expect(relationTo('polaris', 'rutenia', F)).toBe('ally');
    expect(relationTo('protectorate', undefined, F)).toBe('own');
  });
});
```

- [ ] **Step 2: run tests — verify they fail**

Run: `npx jest src/__tests__/lib/faction-hierarchy.test.ts`
Expected: FAIL (module `@/lib/faction-hierarchy` not found).

- [ ] **Step 3: implement `faction-hierarchy.ts`**

Create `src/lib/faction-hierarchy.ts`:
```ts
import type { FactionID } from './types';

/** Minimal faction shape these helpers need (works for Faction & EncyclopediaFaction). */
export interface FactionLike {
  id: FactionID;
  parent?: FactionID;
}

/** Canonical display order of top-level (parent-less) factions. */
const TOP_LEVEL_ORDER: readonly FactionID[] = ['polaris', 'protectorate', 'mercenaries'];

/** The parent faction of `factionId`, or undefined if it is top-level / unknown. */
export function getParent<T extends FactionLike>(factionId: FactionID, factions: T[]): T | undefined {
  const f = factions.find((x) => x.id === factionId);
  if (!f?.parent) return undefined;
  return factions.find((x) => x.id === f.parent);
}

/** Direct sub-factions of `parentId`. */
export function getSubFactions<T extends FactionLike>(parentId: FactionID, factions: T[]): T[] {
  return factions.filter((f) => f.parent === parentId);
}

/** True if `factionId` declares a `parent`. */
export function isSubFaction(factionId: FactionID, factions: FactionLike[]): boolean {
  return factions.some((f) => f.id === factionId && !!f.parent);
}

/**
 * Top-level factions (no `parent`) in canonical order, each immediately followed
 * by its sub-factions; custom top-level factions next (source order); orphan
 * children (whose `parent` is absent from the list) last.
 */
export function orderedFactions<T extends FactionLike>(factions: T[]): T[] {
  const byId = new Map(factions.map((f) => [f.id, f]));
  const out: T[] = [];
  const seen = new Set<FactionID>();
  const emit = (p: T) => {
    if (seen.has(p.id)) return;
    out.push(p);
    seen.add(p.id);
    for (const c of factions.filter((f) => f.parent === p.id)) {
      if (!seen.has(c.id)) {
        out.push(c);
        seen.add(c.id);
      }
    }
  };
  for (const id of TOP_LEVEL_ORDER) {
    const f = byId.get(id);
    if (f && !f.parent) emit(f);
  }
  for (const f of factions) {
    if (!f.parent && !seen.has(f.id)) emit(f);
  }
  for (const f of factions) {
    if (!seen.has(f.id)) {
      out.push(f);
      seen.add(f.id);
    }
  }
  return out;
}

export type FactionRelation = 'own' | 'subfaction' | 'parent' | 'ally';

/**
 * Relationship of a unit's faction to the player's selected faction.
 *  - `own`       — same faction (or no selection)
 *  - `subfaction`— the unit's faction is a child of the selected faction
 *  - `parent`    — the unit's faction is the parent of the selected (sub-)faction
 *  - `ally`      — anything else (incl. wildcard allies like mercenaries)
 */
export function relationTo(
  unitFactionId: FactionID,
  selectedFactionId: FactionID | undefined,
  factions: FactionLike[],
): FactionRelation {
  if (!selectedFactionId || unitFactionId === selectedFactionId) return 'own';
  const unit = factions.find((f) => f.id === unitFactionId);
  const selected = factions.find((f) => f.id === selectedFactionId);
  if (unit?.parent === selectedFactionId) return 'subfaction';
  if (selected?.parent === unitFactionId) return 'parent';
  return 'ally';
}
```

- [ ] **Step 4: run tests — verify pass**

Run: `npx jest src/__tests__/lib/faction-hierarchy.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: commit**
```bash
git add src/lib/faction-hierarchy.ts src/__tests__/lib/faction-hierarchy.test.ts
git commit -m "feat(factions): add faction-hierarchy helpers (ordering + relations) with tests"
```

---

### Task 3: Encyclopedia factions page — order + «Подфракция» tag

**Files:**
- Modify: `src/components/encyclopedia/FactionsListPage.tsx`

**Interfaces:**
- Consumes: `orderedFactions`, `isSubFaction`, `getParent`, `getSubFactions` from `@/lib/faction-hierarchy`; `factionDisplayNames` from `@/lib/faction-colors` (already imported).

- [ ] **Step 1: replace the hardcoded order with `orderedFactions`**

In `FactionsListPage.tsx`, replace the `order` array + `sorted` (around lines 23-29):
```ts
  // Stable display order: polaris, protectorate, mercenaries, rutenia
  const order = ['polaris', 'protectorate', 'mercenaries', 'rutenia'];
  // Fallback glyph when a faction has no logo image (e.g. mercenaries)
  const symbolIcon: Record<string, typeof Shield> = { Shield, Zap, Skull, Flag, Star };
  const sorted = [...factions].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
  );
```
with:
```ts
  // Fallback glyph when a faction has no logo image (e.g. mercenaries)
  const symbolIcon: Record<string, typeof Shield> = { Shield, Zap, Skull, Flag, Star, Anchor };
  // Data-driven order: each sub-faction nests right after its parent.
  const sorted = orderedFactions(factions);
  const subFactionParent = (id: string) => getParent(id, factions)?.name;
```
Add the import at the top:
```ts
import { orderedFactions, getParent, getSubFactions } from '@/lib/faction-hierarchy';
```

- [ ] **Step 2: add a «Подфракция» tag on sub-faction cards**

Inside the card body (the `<div className="flex items-baseline gap-3 flex-wrap mb-1">` that holds the faction `<h2>` name, around line 152-156), add a tag when the faction is a sub-faction. Replace:
```tsx
                      <div className="flex items-baseline gap-3 flex-wrap mb-1">
                        <h2 className="font-russo font-black text-2xl md:text-3xl text-white">
                          {faction.name}
                        </h2>
                      </div>
```
with:
```tsx
                      <div className="flex items-baseline gap-3 flex-wrap mb-1">
                        <h2 className="font-russo font-black text-2xl md:text-3xl text-white">
                          {faction.name}
                        </h2>
                        {faction.parent && subFactionParent(faction.id) && (
                          <span
                            className="font-ibm-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border"
                            style={{ color: colors.primary, borderColor: `${colors.primary}55` }}
                          >
                            Подфракция «{subFactionParent(faction.id)}»
                          </span>
                        )}
                      </div>
```

- [ ] **Step 3: add a «Включает:» note on parent cards**

Just below the description `<p>` (around line 188-192), inside the body column, add a sub-factions line for parents. After:
```tsx
                      {faction.description && (
                        <p className="text-military-sand/75 leading-relaxed text-sm md:text-base">
                          {faction.description}
                        </p>
                      )}
```
insert:
```tsx
                      {getSubFactions(faction.id, factions).length > 0 && (
                        <p className="mt-3 font-ibm-mono text-[11px] text-military-steel/70 uppercase tracking-wider">
                          Включает: {getSubFactions(faction.id, factions).map((s, i) => (
                            <span key={s.id}>
                              {i > 0 && ', '}
                              <Link
                                href={`/encyclopedia?faction=${s.id}`}
                                className="hover:text-military-amber transition-colors"
                                style={{ color: colors.primary }}
                              >
                                {s.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      )}
```

- [ ] **Step 4: verify**

Run: `npm run type-check`
Expected: clean.

- [ ] **Step 5: commit**
```bash
git add src/components/encyclopedia/FactionsListPage.tsx
git commit -m "feat(encyclopedia): nest sub-factions under parent with «Подфракция» tag"
```

---

### Task 4: Encyclopedia units-list — order faction chips parent→child

**Files:**
- Modify: `src/components/encyclopedia/EncyclopediaPage.tsx` (factions memo, ~lines 42-54)

**Interfaces:**
- Consumes: `orderedFactions` from `@/lib/faction-hierarchy`.

- [ ] **Step 1: derive faction chips via `orderedFactions`**

In `EncyclopediaPage.tsx`, replace the `factions` memo body:
```ts
  const factions = useMemo(() => {
    const present = new Set(units.map((u) => u.faction));
    const ordered = FACTIONS.filter((f) => present.has(f));            // canonical order
    present.forEach((f) => { if (!FACTIONS.includes(f)) ordered.push(f); }); // custom factions last
    return [
      { value: 'all' as const, label: 'ВСЕ', color: '#A8A29E' },
      ...ordered.map((f) => ({
        value: f,
        label: (factionDisplayNames[f] ?? f).toUpperCase(),
        color: getFactionColors(f).primary,
      })),
    ];
  }, [units]);
```
with:
```ts
  const factions = useMemo(() => {
    // Map unit factions to a {id,parent} shape so orderedFactions can nest
    // sub-factions under their parent (data-driven, no hardcoded id list).
    const present = new Set(units.map((u) => u.faction));
    const ordered = orderedFactions([...present].map((id) => ({ id })));
    return [
      { value: 'all' as const, label: 'ВСЕ', color: '#A8A29E' },
      ...ordered.map((f) => ({
        value: f.id,
        label: (factionDisplayNames[f.id] ?? f.id).toUpperCase(),
        color: getFactionColors(f.id).primary,
      })),
    ];
  }, [units]);
```
Add the import:
```ts
import { orderedFactions } from '@/lib/faction-hierarchy';
```
(`FACTIONS` import can stay or be removed if now unused — leave it to avoid touching other usages; if `FACTIONS` becomes unused here, remove that import to keep lint happy.)

- [ ] **Step 2: verify**

Run: `npm run type-check`
Expected: clean.

- [ ] **Step 3: commit**
```bash
git add src/components/encyclopedia/EncyclopediaPage.tsx
git commit -m "feat(encyclopedia): order faction filter chips parent→sub-faction"
```

---

### Task 5: Landing — order + «Подфракция» tag

**Files:**
- Modify: `src/components/landing/FactionsSection.tsx`

**Interfaces:**
- Consumes: `orderedFactions`, `getParent` from `@/lib/faction-hierarchy`; `getFactions()` from `@/lib/encyclopedia-registry` (to get `parent`); `factionDisplayNames` (already imported indirectly via color module — import if needed).

- [ ] **Step 1: derive faction list from data instead of the hardcoded id array**

In `FactionsSection.tsx`, replace:
```ts
const factionIds = ['polaris', 'protectorate', 'mercenaries', 'rutenia'] as const;
```
and the `factionIds.map((factionId, index) => { const faction = getEncyclopediaFaction(factionId); ... })` usage with a data-driven list. Replace the `factionIds` line with:
```ts
import { orderedFactions, getParent } from '@/lib/faction-hierarchy';
import { getFactions } from '@/lib/encyclopedia-registry';
import { factionDisplayNames } from '@/lib/faction-colors';
```
```ts
const allFactions = orderedFactions(getFactions());
```
Then in the grid `.map`, iterate `allFactions` (each item already is the faction object) instead of ids; use `faction.id`, `faction.color`, `faction.symbol`, etc. directly. Replace `factionIds.map((factionId, index) => {` with `allFactions.map((faction, index) => {` and drop the `getEncyclopediaFaction(factionId)` lookup + `if (!faction) return null`.

- [ ] **Step 2: add the «Подфракция» tag on sub-faction cards**

Inside each card, under the faction `<h3>` name (around line 67-72), add:
```tsx
                    {faction.parent && (
                      <div className="font-ibm-mono text-[10px] uppercase tracking-wider mt-1"
                           style={{ color: getParent(faction.id, allFactions)?.color ?? faction.color }}>
                        Подфракция «{factionDisplayNames[getParent(faction.id, allFactions)?.id ?? ''] ?? ''}»
                      </div>
                    )}
```

- [ ] **Step 3: verify**

Run: `npm run type-check`
Expected: clean.

- [ ] **Step 4: commit**
```bash
git add src/components/landing/FactionsSection.tsx
git commit -m "feat(landing): nest sub-factions under parents with «Подфракция» tag"
```

---

### Task 6: Faction selector (setup wizard) — order + tag

**Files:**
- Modify: `src/components/controls/FactionSelector.tsx`

**Interfaces:**
- Consumes: `orderedFactions`, `getParent` from `@/lib/faction-hierarchy`. The component already receives `factions: Faction[]` (carries `parent` after Task 1+7).

- [ ] **Step 1: order the cards via `orderedFactions`**

In `FactionSelector.tsx`, add:
```ts
import { orderedFactions, getParent } from '@/lib/faction-hierarchy';
import { factionDisplayNames } from '@/lib/faction-colors';
```
Change the grid map from `factions.map((faction) => {` to `orderedFactions(factions).map((faction) => {`.

- [ ] **Step 2: add a «Подфракция» tag on sub-faction cards**

Inside the content `<div>` (under the name row, around line 198-208), add:
```tsx
                  {faction.parent && (
                    <div className="font-mono text-[10px] uppercase tracking-wider mb-2"
                         style={{ color: getFactionColors(getParent(faction.id, factions)?.id ?? '').primary }}>
                      Подфракция «{factionDisplayNames[getParent(faction.id, factions)?.id ?? ''] ?? ''}»
                    </div>
                  )}
```
(`getFactionColors` is already imported in this file.)

- [ ] **Step 3: verify**

Run: `npm run type-check`
Expected: clean.

- [ ] **Step 4: commit**
```bash
git add src/components/controls/FactionSelector.tsx
git commit -m "feat(setup): nest sub-factions in faction picker with «Подфракция» tag"
```

---

### Task 7: Carry `parent` through ArmyBuilder → UnitSelector

**Files:**
- Modify: `src/components/ArmyBuilder.tsx` (`availableFactions` memo, ~lines 121-140)

**Interfaces:**
- Consumes: `parent` on `EncyclopediaFaction` (Task 1).
- Produces: `availableFactions: Faction[]` entries now carry `parent`, so `UnitSelector` (Task 8) can compute relations.

- [ ] **Step 1: include `parent` in the enriched faction objects**

In `ArmyBuilder.tsx`, inside the `availableFactions` `.map(f => { ... })`, add `parent` to the returned object (next to `allies`):
```ts
          allies: encyclopediaFaction.allies ?? [],
          parent: encyclopediaFaction.parent,
```

- [ ] **Step 2: verify**

Run: `npm run type-check`
Expected: clean (`Faction.parent` exists from Task 1).

- [ ] **Step 3: commit**
```bash
git add src/components/ArmyBuilder.tsx
git commit -m "feat(army-builder): carry faction \`parent\` to UnitSelector"
```

---

### Task 8: UnitSelector — relationship-aware ally badge

**Files:**
- Modify: `src/components/UnitSelector.tsx`
- Modify: `src/components/CompactUnitCard.tsx`
- Modify: `src/components/machine/MachineCard.tsx`

**Interfaces:**
- Consumes: `relationTo` from `@/lib/faction-hierarchy`; the `factions` prop (Faction[] with `parent`, via Task 7).
- Produces: an `allyLabel?: string` prop on CompactUnitCard + MachineCard (values: `Подфракция` | `Основная` | `Союзник`); UnitSelector computes it.

- [ ] **Step 1: add `allyLabel` prop to CompactUnitCard**

In `CompactUnitCard.tsx`, add to the props interface (next to `allyFactionId`):
```ts
  allyFactionId?: FactionID;
  allyLabel?: string; // 'Союзник' (default) | 'Подфракция' | 'Основная'
```
destructure it, and in the badge block (around line 158-164) show the label and use it in the title:
```tsx
              {allyFactionId && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider"
                  style={{ backgroundColor: getFactionColors(allyFactionId).primary + '33', color: getFactionColors(allyFactionId).primary }}
                  title={`${allyLabel ?? 'Союзник'}: ${factionDisplayNames[allyFactionId] ?? allyFactionId}`}
                >
                  <FactionLogo faction={allyFactionId} className="w-3.5 h-3.5" />
                  {allyLabel ?? 'Союзник'}
                </span>
              )}
```

- [ ] **Step 2: add `allyLabel` prop to MachineCard**

In `src/components/machine/MachineCard.tsx`, add `allyLabel?: string` to the props interface, destructure it, and apply the SAME badge block change as Step 1 (around line 142-148):
```tsx
          {allyFactionId && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider"
              style={{ backgroundColor: getFactionColors(allyFactionId).primary + '33', color: getFactionColors(allyFactionId).primary }}
              title={`${allyLabel ?? 'Союзник'}: ${factionDisplayNames[allyFactionId] ?? allyFactionId}`}
            >
              <FactionLogo faction={allyFactionId} className="w-3.5 h-3.5" />
              {allyLabel ?? 'Союзник'}
            </span>
          )}
```
(Ensure `factionDisplayNames` is imported; if not, add `import { getFactionColors, factionDisplayNames } from '@/lib/faction-colors';`.)

- [ ] **Step 3: in UnitSelector, compute + pass the label**

In `UnitSelector.tsx`, un-ignore the `factions` prop (rename `_factions` → `factions`) and add:
```ts
import { relationTo } from '@/lib/faction-hierarchy';
```
Replace the `allyFactionIdFor` helper with a pair that also returns the label:
```ts
  // Relationship of an available unit's faction to the player's selected faction:
  // drives both whether a badge shows (own → none) and its label.
  const RELATION_LABEL: Record<string, string> = {
    subfaction: 'Подфракция',
    parent: 'Основная',
    ally: 'Союзник',
  };
  const allyBadgeFor = (unit: UnitDisplay): { id: FactionID; label: string } | null => {
    if (!selectedFaction || unit.data.faction === selectedFaction) return null;
    const id = unit.data.faction as FactionID;
    const rel = relationTo(id, selectedFaction, factions);
    if (rel === 'own') return null;
    return { id, label: RELATION_LABEL[rel] ?? 'Союзник' };
  };
```
Then at each call site, replace `const allyFactionId = allyFactionIdFor(unit);` with:
```ts
              const allyBadge = allyBadgeFor(unit);
              const allyFactionId = allyBadge?.id;
              const allyLabel = allyBadge?.label;
```
(in both the compact-view block ~line 297 and the detailed-view block ~line 355).

Pass `allyLabel` to CompactUnitCard + MachineCard:
```tsx
                    <CompactUnitCard
                      ...
                      allyFactionId={allyFactionId}
                      allyLabel={allyLabel}
                    />
```
```tsx
                    <MachineCard
                      ...
                      allyFactionId={allyFactionId}
                      allyLabel={allyLabel}
                    />
```

And in the detailed-view inline badge (around line 498-506), use `allyLabel`:
```tsx
                          {allyFactionId && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider"
                              style={{ backgroundColor: getFactionColors(allyFactionId).primary + '33', color: getFactionColors(allyFactionId).primary }}
                              title={`${allyLabel ?? 'Союзник'}: ${factionDisplayNames[allyFactionId] ?? allyFactionId}`}
                            >
                              <FactionLogo faction={allyFactionId} className="w-3.5 h-3.5" />
                              {allyLabel ?? 'Союзник'}
                            </span>
                          )}
```

- [ ] **Step 4: verify**

Run: `npm run type-check && npm run test`
Expected: clean; existing tests pass.

- [ ] **Step 5: commit**
```bash
git add src/components/UnitSelector.tsx src/components/CompactUnitCard.tsx src/components/machine/MachineCard.tsx
git commit -m "feat(unit-selector): relationship-aware ally badge (Подфракция/Основная/Союзник)"
```

---

### Task 9: E2E tests

**Files:**
- Create: `e2e/subfactions.spec.ts`

**Interfaces:**
- Consumes: existing `e2e/helpers/setup.ts` (`setupToArmyBuilder`), `clearStorage`.

- [ ] **Step 1: write the spec**

Create `e2e/subfactions.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('Sub-faction hierarchy', () => {
  test.beforeEach(async ({ page }) => { await clearStorage(page); });

  test('encyclopedia nests sub-factions under their parent with a tag', async ({ page }) => {
    await page.goto('/encyclopedia/factions');
    await expect(page.getByTestId('encyclopedia-faction-card-rutenia')).toContainText('Подфракция');
    // Рутения appears right after Протекторат in the list
    const cards = page.getByTestId(/^encyclopedia-faction-card-/);
    const ids = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
    const prot = ids.findIndex((t) => t?.includes('protectorate'));
    const rut = ids.findIndex((t) => t?.includes('rutenia'));
    expect(prot).toBeGreaterThanOrEqual(0);
    expect(rut).toBe(prot + 1);
  });

  test('unit selector labels a sub-faction unit as «Подфракция»', async ({ page }) => {
    const { setupToArmyBuilder } = await import('./helpers/setup');
    // Pick Протекторат (parent of Рутения) and reach the unit selector.
    const builder = await setupToArmyBuilder(page, { faction: 'protectorate' });
    // A Рутения unit visible in the selector shows the Подфракция badge text.
    await expect(builder.locator('text=Подфракция').first()).toBeVisible();
  });
});
```
> NOTE: `setupToArmyBuilder`'s exact options/return shape varies — read `e2e/helpers/setup.ts` first and adapt the second test to its real signature (the key assertion is that a Рутения unit card shows the «Подфракция» label when Протекторат is selected). The encyclopedia test needs no setup helper.

- [ ] **Step 2: run the encyclopedia E2E**

Run: `npx playwright test e2e/subfactions.spec.ts -g "encyclopedia"`
Expected: PASS (dev server auto-starts on :3001).

- [ ] **Step 3: run the unit-selector E2E (adapt helper signature first)**

Run: `npx playwright test e2e/subfactions.spec.ts -g "unit selector"`
Expected: PASS.

- [ ] **Step 4: commit**
```bash
git add e2e/subfactions.spec.ts
git commit -m "test(e2e): sub-faction nesting + unit-selector badge"
```

---

### Task 10: Final verification

- [ ] **Step 1: full gates**
```bash
npm run type-check
npm run test
NEXT_PUBLIC_GITHUB_PAGES=true npm run build
```
Expected: type-check clean; all unit tests pass; build produces the static pages with no prerender errors.

- [ ] **Step 2: manual smoke check**

Dev server: `npm run dev`. Visit `/encyclopedia/factions` — Полярис then Мёртвый Флот (tagged «Подфракция «Полярис»»), Протекторат then Рутения (tagged), Наёмники; parent cards show «Включает: …». In the setup wizard, faction picker shows the same grouping. Build a Протекторат army — a Рутения unit shows «Подфракция», a Наёмники unit shows «Союзник».

- [ ] **Step 3: push + open PR**
```bash
git push -u origin feat/subfactions
```
Open a PR `feat/subfactions → main` summarizing the visual sub-faction hierarchy (no mechanic change).
