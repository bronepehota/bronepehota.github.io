# Sub-faction mechanism (visual hierarchy)

**Date:** 2026-07-29
**Status:** Approved design → awaiting implementation plan
**Branch:** `feat/subfactions`

## Context

Five factions exist today, all rendered as a **flat peer list**: Полярис, Протекторат, Наёмники, Рутения, Мёртвый Флот. Canonically Рутения belongs under Протекторат and Мёртвый Флот under Полярис (the Empire), but the app models both as symmetric alliances (`allies` field) and shows every faction as an equal top-level entry. Players can't see the parent→child relationship in the encyclopedia or the faction picker.

**Goal:** introduce a **visual** sub-faction hierarchy — nest sub-faction cards under their parent, tag them as «Подфракция», and reflect the relationship in the unit-selection badges.

**Explicitly out of scope (decided):**
- **No mechanical change.** Unit availability stays on the existing symmetric `allies` system. Рутения ↔ Протекторат and Мёртвый Флот ↔ Полярис already share units via `allies`; that keeps working unchanged. Sub-factions remain independently selectable as a player's faction.
- No new sub-faction *data* beyond the two existing pairs (though the model is generic so future ones plug in with one field).

Two axes, deliberately decoupled:
- `allies` → **who can field whose units** (mechanic, unchanged).
- `parent` (new) → **visual grouping** (display only).

## Data model

New optional field on a faction:

```ts
// src/lib/types.ts  (Faction)
// src/lib/encyclopedia-registry.ts  (EncyclopediaFaction)
parent?: FactionID;   // when set, this faction is a sub-faction of `parent`
```

JSON entries (`src/data/encyclopedia/factions.json`):
- `rutenia` → add `"parent": "protectorate"`
- `dead_fleet` → add `"parent": "polaris"`
- others: no `parent` (top-level).

A **sub-faction** = a faction with `parent` set. The existing `allies` entries for these two pairs are **kept** (they drive unit availability).

New module **`src/lib/faction-hierarchy.ts`** (pure, tested):
- `getParent(factionId, factions) => EncyclopediaFaction | undefined`
- `getSubFactions(parentId, factions) => EncyclopediaFaction[]` (stable order)
- `isSubFaction(factionId, factions) => boolean`
- `orderedFactions(factions) => EncyclopediaFaction[]` — top-level factions (no `parent`) in canonical order, each immediately followed by its sub-factions; custom factions without `parent` appended last (preserves today's "custom last" behavior).
- `relationTo(unitFactionId, selectedFactionId, factions) => 'own' | 'subfaction' | 'parent' | 'ally'` — used by the unit-selector badge logic (own = same; subfaction = unit's faction is a child of selected; parent = unit's faction is the parent of selected; otherwise ally).

Canonical top-level order source: derive from a small ordered list of known parents `['polaris', 'protectorate', 'mercenaries']` (the factions with no `parent` in canonical order), then any remaining parent-less faction. This removes the need to hardcode the full faction list including children.

## Ordering (replaces hardcoded faction arrays)

Today, faction id arrays are hardcoded in ~6 places (`constants.FACTIONS`, `FactionsListPage.order`, `encyclopedia-utils.getAllFactions`, `FactionsSection.factionIds`, `FactionSelector.factionStyles`, editor `FactionsList`). Result list:

```
Полярис → Мёртвый Флот → Протекторат → Рутения → Наёмники
```

In the surfaces this feature touches, replace the hardcoded order with `orderedFactions(factions)` (data-driven). Future sub-factions then appear with **zero** list edits. (`FactionSelector.factionStyles` and `faction-colors` style maps remain per-id maps — those still need an entry per faction for theming; only the *ordering* becomes data-driven.)

## Visual

Chosen layout: **each sub-faction keeps its own full card**, placed immediately after its parent, with a «Подфракция» tag. Works uniformly across surfaces and preserves the existing dossier-card design language (mobile-first).

### Encyclopedia factions page (`FactionsListPage.tsx`)
- Order via `orderedFactions`.
- Sub-faction card: add a tag near the name — **«Подфракция «Протекторат»»** — tinted with the parent's color. Sub-faction card visual weight slightly reduced (e.g. thinner side-rail / smaller emblem) to read as nested.
- Parent card: subtle line **«Включает: Мёртвый Флот»** (links to the sub-faction's filtered unit list).
- `<EncyclopediaPage>` units-list filter order follows the same `orderedFactions`.

### Landing (`FactionsSection.tsx`)
- Same `orderedFactions` order + «Подфракция» tag on sub-faction cards. Grid stays responsive; a sub-faction card simply renders under its parent.

### Faction selector — setup wizard (`FactionSelector.tsx`)
- Cards ordered via `orderedFactions`; sub-faction cards tagged «Подфракция «…»». Selection mechanic unchanged (still sets `army.faction` to one id; sub-faction remains a valid pick).

### Unit selector — army building (`UnitSelector.tsx`)
- The allied-unit badge (currently always «Союзник») becomes relationship-aware via `relationTo(unit.faction, selectedFaction, factions)`:
  - **«Подфракция»** — unit belongs to a sub-faction of the selected faction (e.g. picked Протекторат, unit is Рутения).
  - **«Основная»** — unit belongs to the parent of the selected faction (e.g. picked Рутения, unit is Протекторат).
  - **«Союзник»** — any other ally, incl. Наёмники (unchanged).
- Own-faction units: no badge (unchanged). Sort order (own first) unchanged.

## Testing

**Unit (`src/__tests__/lib/faction-hierarchy.test.ts`):**
- `getParent` / `getSubFactions` / `isSubFaction` for rutenia↔protectorate, dead_fleet↔polaris, and a parent-less faction.
- `orderedFactions` produces `polaris, dead_fleet, protectorate, rutenia, mercenaries` and appends unknown parent-less factions last.
- `relationTo` returns the four cases correctly.
- Guard: a faction whose `parent` points at a non-existent id is treated as top-level (no crash).

**E2E (`e2e/` — new or extend `encyclopedia.spec.ts` / `army-creation.spec.ts`):**
- Encyclopedia factions page: Рутения card tagged «Подфракция «Протекторат»» and ordered right after Протекторат; same for Мёртвый Флот under Полярис.
- Faction selector: sub-factions grouped under parents with the tag.
- UnitSelector: with Протекторат selected, a Рутения unit shows «Подфракция», a Наёмники unit shows «Союзник».

## Verification
- `npm run type-check`, `npm run test` (incl. new hierarchy tests), `npm run test:e2e` (new/extended specs).
- `NEXT_PUBLIC_GITHUB_PAGES=true npm run build` — prerender the factions page + all unit pages without errors.
- Manual: factions page ordering + tags; faction selector; unit-selector badges for a parent pick and a sub-faction pick.
