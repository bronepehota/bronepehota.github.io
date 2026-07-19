# Faction Alliances — Design Spec

**Date:** 2026-07-19
**Status:** Approved (pending spec review)
**Source of request:** Рутения is an allied faction of the Protectorate; when you pick Protectorate (or vice versa) you can take units from both. Mercenaries are a similar cross-faction case. Generalize into a declarative alliance system on factions.

## Background

Today the only cross-faction unit availability is a **hardcoded special-case for mercenaries** in `src/components/UnitSelector.tsx:84-107`:

- All mercenary squads are appended to every non-mercenaries faction (`allMercenaries`, lines 103-105).
- The mercenaries faction itself receives **all machines** from all factions (`if (selectedFaction === 'mercenaries') return machines`, lines 86-91).
- This is asymmetric and string-literal-locked to `'mercenaries'`.

The `Faction` type (`src/lib/types.ts:13-21`) and `EncyclopediaFaction` (`src/lib/encyclopedia-registry.ts:59-70`) have **no** relations/allies field. The choke point for availability is the filter `s.faction === selectedFaction` / `m.faction === selectedFaction` in `UnitSelector`, plus the merc append.

## Goal

A declarative **faction alliances** mechanism: a faction declares its allies; the army builder makes allied factions' units (squads AND machines) available, with no limits. This generalizes and replaces the hardcoded mercenary behavior.

## Rules (agreed)

- An alliance is **symmetric** and **bidirectional**: if A is allied with B, each can take the other's squads and machines.
- Allied units are **unlimited** (no point/count caps) — they appear in the builder alongside your own.
- Allies share **both squads and machines**.
- **Mercenaries** are an ally of **all** factions (`"*"` wildcard), symmetric — everyone gets merc squads + merc machines, and mercs get everyone's squads + machines. (Mercs have only 1 machine in star_system, so their machine contribution is that 1.)
- **Рутения ↔ Protectorate** is an allied pair (star_system).
- Polaris has no allies by default.

## Data model

Add an optional `allies` field to both faction types:

```ts
// src/lib/types.ts — Faction
export interface Faction {
  id: FactionID;
  name: string;
  color: string;
  symbol?: string;
  description: string;
  homeWorld: string;
  motto: string;
  allies?: FactionID[];   // NEW — faction ids and/or "*" (ally of all)
}

// src/lib/encyclopedia-registry.ts — EncyclopediaFaction
export interface EncyclopediaFaction {
  id: string;
  name: string;
  color?: string;
  symbol?: string;
  description?: string;
  homeWorld?: string;
  motto?: string;
  icon?: string;
  banner?: string;
  sources: string[];
  allies?: string[];      // NEW
}
```

Data lives in `src/data/encyclopedia/factions.json` (canonical faction metadata):

```json
{ "id": "polaris",      "allies": [],            ... }
{ "id": "protectorate", "allies": ["rutenia"],   ... }
{ "id": "rutenia",      "allies": ["protectorate"], ... }
{ "id": "mercenaries",  "allies": ["*"],         ... }
```

(Alliance is symmetric, so declaring on one side would suffice; both sides are declared for clarity.)

## Alliance resolution — new helper

New file `src/lib/faction-allies.ts`:

```ts
import type { FactionID } from './types';

interface FactionLike { id: FactionID; allies?: FactionID[]; }

/**
 * Returns the set of factions allied with `selected` (excluding `selected` itself).
 * Symmetric + wildcard: A and B are allied if ANY of:
 *   - A lists B, B lists A, A lists "*", or B lists "*".
 * Only factions present in `factions` (the current source's factions) are considered,
 * so alliances only activate where both factions exist in the source.
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
    const theyListMe  = !!f.allies  && (f.allies.includes(selected) || f.allies.includes('*'));
    if (meListsThem || theyListMe) out.add(f.id);
  }
  return out;
}
```

## Builder wiring

`src/components/ArmyBuilder.tsx:118-133` already enriches source factions from `getEncyclopediaFaction`. Extend the enrichment to carry `allies`. Then compute the ally set and pass it to `UnitSelector`:

```ts
const alliedFactionIds = getAlliedFactions(army.faction!, availableFactions);
// ...
<UnitSelector selectedFaction={army.faction} alliedFactionIds={alliedFactionIds} ... />
```

## UnitSelector change (`src/components/UnitSelector.tsx:84-107`)

Replace the hardcoded merc logic with one rule using the ally set:

```ts
const ok = (f: FactionID) => f === selectedFaction || alliedFactionIds.has(f);
const availableSquads   = useMemo(() => squads.filter((s) => ok(s.faction)), [squads, selectedFaction, alliedFactionIds]);
const availableMachines = useMemo(() => machines.filter((m) => ok(m.faction)), [machines, selectedFaction, alliedFactionIds]);
```

**Remove:**
- `if (selectedFaction === 'mercenaries') return machines;` (lines 86-91) — now handled by `mercenaries: allies:["*"]`.
- `allMercenaries` + the append (lines 94, 103-105) — same.

`UnitSelector` gains a new required prop `alliedFactionIds: Set<FactionID>`.

## UI

Allied units appear in the builder list mixed with the player's own, each with a small **faction badge** (the ally's color + short name, e.g. «Рутения» / «Наёмники») so the origin is visible. Existing filters (`all` / `squad` / `machine`) remain; the `mercenary` filter stays as-is (mercs are now just one ally among possible ones).

## Edge cases

- **Source without Рутения (tehnolog):** no rutenia units exist there, so the rutenia↔protectorate alliance adds nothing — handled naturally by the source-scoped unit list.
- **Mercenaries exist in every source** → `allies:["*"]` activates everywhere.
- **Editor / custom sources:** `allies` is a normal field, edited like other faction metadata.
- **Encyclopedia + army export/import:** unaffected — unit runtime state doesn't change; only builder availability changes.
- **Merc behavior change (intended):** mercs now also receive other factions' squads (previously only machines), and all factions now receive the merc machine (previously none did). This is the agreed symmetric unification.

## Testing

- **New** `src/__tests__/lib/faction-allies.test.ts`:
  - symmetric pair (rutenia↔protectorate) each direction.
  - wildcard (`mercenaries:["*"]`) allies with everyone both ways.
  - no allies (polaris) → empty set.
  - only factions present in the passed list are returned.
  - declaring an ally on one side only still resolves (symmetric).
- **Update** existing army-builder / UnitSelector tests that asserted the hardcoded merc behavior to use `allies:["*"]` instead.
- Verify in the app (Playwright): select Protectorate in star_system → Рутения units appear; select Рутения → Protectorate units appear; select Polaris → merc (+ no rutenia) units appear.

## Out of scope

- Point/count limits on allied units (agreed: none).
- Per-unit alliance restrictions (whole-faction only).
- Asymmetric alliance rules (the merc asymmetric quirk is intentionally replaced by symmetric).
- UI changes beyond the ally badge.
