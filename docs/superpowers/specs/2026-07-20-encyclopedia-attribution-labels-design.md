# Encyclopedia Attribution Labels — Design

**Date:** 2026-07-20
**Status:** Approved (design); pending spec review → implementation plan
**Owner:** atuzov

## Problem

The encyclopedia surfaces a lot of content (faction lore, unit lore, mission scenarios, painted-miniature photos) that comes from different origins — official Tehnolog material vs. community (Star System) creations vs. individual painters. Readers currently can't tell what is **official canon** versus **community-authored** lore, or who painted a given miniature. The only existing attribution is a small *"Источник фото:"* logo chip on unit detail pages (`UnitDetailPage.tsx:261-282`).

The closing observation from the maintainer: *"по сути отрядов оригинального технолога мало с лором"* — most units are Tehnolog-originals, but the rich lore text describing them was written by the Star System community. Origin and lore-authorship are therefore **two different things** and must be distinguishable.

## Goal

Add a unified **attribution («источник»)** layer across the encyclopedia that marks, for every piece of content, where it comes from:

1. **Origin** — who *invented the concept* (the faction / unit / mission idea).
2. **Lore author** — who *wrote the descriptive lore text*.
3. **Painter** — who *painted the miniature* shown in a photo (extends the existing credits system; new painters Лисицин and Сергей Переверзев to be added).

All three share one visual language so the page reads as a single coherent "where does all this come from" layer.

## Non-goals (YAGNI — out of scope)

- Filtering / searching the encyclopedia by canon level (official-only toggle). The data model supports this later; no UI now.
- Attribution labels on the unit **grid cards** (encyclopedia browsing). Scope is the 3 content surfaces only.
- Painter attribution for non-group photos (per-soldier card art). Only group hero photos carry painter credit, as today.
- Attribution for **Campaigns (Хроники войн)** — separate Markdown-driven content system; can be added later.
- Provenance for editor custom sources.

## Provenance taxonomy

Two lore buckets (no meaningful third bucket exists in the source materials):

| Value | Meaning | Icon | Tone |
|---|---|---|---|
| `tehnolog` | Official Tehnolog material (canon) | `Shield` | cyan / steel (`#06b6d4`) — matches existing `SourceAvailability` |
| `star_system` | Community (Star System / fanon) | `Star` | amber (`#f59e0b`) — matches existing `SourceAvailability` |

Painter values: `shnayder`, `star_system` (existing) + `lisitsin`, `pereverzev` (new) — driven by the `CREDITS` registry.

## Data model

### Lore provenance (new)

New type, optional field on three entity types, resolver with defaults.

```ts
// src/lib/provenance.ts
export type LoreSource = 'tehnolog' | 'star_system';

export interface Provenance {
  origin: LoreSource;      // who invented the concept
  loreAuthor: LoreSource;  // who wrote the lore text
}
```

Optional field added to:
- `EncyclopediaFaction` (`src/lib/encyclopedia-registry.ts`) — sourced from `src/data/encyclopedia/factions.json`
- `EncyclopediaUnit` (`src/lib/encyclopedia-registry.ts`) — sourced from `src/data/encyclopedia/units/*/*.json`
- `Mission` (`src/lib/mission-types.ts`) — sourced from `src/data/missions/missions.json`

```ts
provenance?: Partial<Provenance>;  // overrides per-axis; resolver fills the rest
```

### Resolver — `src/lib/provenance.ts`

```ts
export function resolveUnitProvenance(unit: EncyclopediaUnit): Provenance;
export function resolveFactionProvenance(faction: EncyclopediaFaction): Provenance;
export function resolveMissionProvenance(mission: Mission): Provenance;
```

**Defaults (single rule, ~0 explicit fields needed for the common case):**

| Entity type | `origin` default | `loreAuthor` default |
|---|---|---|
| Unit | `tehnolog` → `star_system` when `faction === 'rutenia'` | `star_system` (lore is community-written) |
| Faction | `tehnolog` → `star_system` when `id === 'rutenia'` | `star_system` |
| Mission | `tehnolog` | `tehnolog` (Cerber scenarios are verbatim from tehnolog.ru) |

Explicit `provenance` field overrides the default **per axis** (it's `Partial` — override just `origin`, or just `loreAuthor`, or both).

Consequence: most units/factions need **no JSON edit** — the resolver returns the correct value from defaults. Рутения is also handled by the default rule but will be marked explicitly in `factions.json` for self-documentation. Exceptions the maintainer should mark explicitly during review:

- Any non-rutenia unit whose *concept* is actually a Star System invention → `{ origin: 'star_system' }`.
- Any unit/faction whose *lore text* is verbatim official Tehnolog (rulebook/card) → `{ loreAuthor: 'tehnolog' }`.

### Painter credits (extend existing)

Edit `src/lib/painted-images.ts`:

```ts
export const CREDITS = {
  shnayder:    { url: 'https://vk.com/shnayder_brush', logo: '/images/credits/shnayder_brush.jpg', name: 'Покрасы Шнайдера' },
  star_system: { url: 'https://vk.com/bp_bnp',         logo: '/images/credits/bp_bnp.jpg',         name: 'Star System' },
  lisitsin:    { url: '<TODO from user>',              logo: '/images/credits/lisitsin.jpg',       name: 'Лисицин' },
  pereverzev:  { url: '<TODO from user>',              logo: '/images/credits/pereverzev.jpg',     name: 'Сергей Переверзев' },
} as const;
```

Then assign their squads in `SQUAD_PHOTO_SOURCE`. **Data dependency:** logo images (300×? white-bg, process via `tools/standardize_images.py`) + link URLs for both painters — to be supplied by the maintainer. Design and implementation of the label system do not block on these; the painters simply won't render until their data is present.

## Component — `<AttributionLabel>` (new)

Location: `src/components/encyclopedia/AttributionLabel.tsx`.

Two layers:

### `<SourceChip>` — atomic chip

Renders one source: icon-or-logo + name + optional role sub-label + optional link.

```ts
interface SourceChipProps {
  name: string;
  role?: string;            // 'оригинал' | 'лор' | 'покрас' | 'фото'
  icon?: LucideIcon;        // for tehnolog/star_system
  logo?: string;            // for painters (image path)
  url?: string;             // makes the chip a link
  tone?: 'tehnolog' | 'star_system' | 'painter';
}
```

Visual spec (Direction B — dossier metadata, consistent with existing `// ОПИСАНИЕ` etc.):
- Container: `rounded-sm border border-military-steel/40 bg-military-charcoal/70 px-2.5 py-1`.
- Text: `font-ibm-mono text-[11px] text-military-taupe uppercase tracking-wider`.
- Icon left, 12px, tone-colored.
- Role sub-label inline after name, dimmed (`text-military-steel/60`).
- When `url` provided, render as `<a>` with `hover:border-military-amber/50`.

### `<ProvenanceRow>` — composed row

Renders `// ИСТОЧНИК` header + the relevant chips for a faction/unit/mission.

```ts
interface ProvenanceRowProps {
  provenance: Provenance;
  linkUrl?: string;  // e.g. mission.sourceUrl
}
```

Behavior:
- Header: `// ИСТОЧНИК` in `font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider` (matches existing section labels).
- **Collapse logic:** when `origin === loreAuthor`, render ONE chip: «Технолог — оригинал и лор» (tehnolog) or «Star System — сообщество» (star_system). When they differ, render TWO chips labeled «оригинал» and «лор».
- When `linkUrl` provided (missions), the collapsed chip links to it.

## Placement (3 content surfaces)

1. **Faction list card** — `src/components/encyclopedia/FactionsListPage.tsx`
   - Add `<ProvenanceRow>` (compact, no `// ИСТОЧНИК` header — just the chip) in the meta-chips row alongside `homeWorld` / unit count.
   - Рутения → «Star System — сообщество»; the other three → «Технолог — оригинал и лор».
   - **Decision (a): show on ALL 4 cards** (honest, marks all content as requested). The 3 identical «Технолог» chips are acceptable quiet metadata.

2. **Unit detail — lore block** — `src/components/encyclopedia/UnitDetail/UnitLore.tsx`
   - Add `<ProvenanceRow>` in the «Лор и история» block header (under the `BookOpen` title), showing origin + author (collapsed or split).
   - **Fallback:** for units with no lore block (`UnitLore` returns `null`), render the origin chip in `UnitDetailPage.tsx` header meta (near CLASS / РАНГ) so the concept origin is still attributed.

3. **Mission detail** — `src/app/encyclopedia/mission/[id]/page.tsx`
   - Add `<ProvenanceRow>` near the mission title; passes `linkUrl={mission.sourceUrl}`.
   - Missions collapse to one linked chip «Технолог — официальный сценарий» → tehnolog.ru.

### Painter chip unification

The existing *"Источник фото:"* logo chip in `UnitDetailPage.tsx:261-282` is refactored to render through `<SourceChip>` (role «фото»/«покрас», `logo` + `url` from `getPhotoCredit`). Same visual language, no new placement. Low-risk: the existing `getPhotoCredit` API is preserved; only the rendering element changes.

## Files

**New:**
- `src/lib/provenance.ts` — `LoreSource`, `Provenance`, three resolvers.
- `src/components/encyclopedia/AttributionLabel.tsx` — `SourceChip` + `ProvenanceRow`.
- `src/__tests__/provenance.test.ts` — resolver unit tests.
- E2E: extend `e2e/encyclopedia.spec.ts` (attribution assertions).

**Edited:**
- `src/lib/encyclopedia-registry.ts` — add `provenance?: Partial<Provenance>` to `EncyclopediaFaction` and `EncyclopediaUnit`.
- `src/lib/mission-types.ts` — add `provenance?: Partial<Provenance>` to `Mission`.
- `src/data/encyclopedia/factions.json` — explicit `provenance` on Рутения (self-doc).
- `src/components/encyclopedia/FactionsListPage.tsx` — chip in meta row.
- `src/components/encyclopedia/UnitDetail/UnitLore.tsx` — `<ProvenanceRow>` in header.
- `src/components/encyclopedia/UnitDetailPage.tsx` — origin chip fallback (no-lore units) + refactor painter chip to `<SourceChip>`.
- `src/app/encyclopedia/mission/[id]/page.tsx` — `<ProvenanceRow>` with sourceUrl link.
- `src/lib/painted-images.ts` — add `lisitsin`, `pereverzev` to `CREDITS`.
- `.claude/skills/import-cards/...` — record provenance during new-unit import.

## Testing

- **Unit (`provenance.test.ts`):**
  - Defaults per entity type (unit / faction / mission).
  - Faction-aware origin override (`rutenia` → `star_system`).
  - `Partial` override (override only `origin`, only `loreAuthor`, both).
  - Collapse predicate (`origin === loreAuthor`).
- **E2E (`encyclopedia.spec.ts`):**
  - Attribution chip visible on Рутения faction card → «Star System».
  - Attribution row visible on a unit detail page → shows origin + author.
  - Attribution chip visible on a mission detail page → «Технолог», links to sourceUrl.
- `npm run type-check` + `npm run test` must pass; E2E run separately.

## Resolved micro-decisions

- **(a)** Show the chip on all 4 faction cards (not only non-canon). ✅
- **(b)** Collapse origin + author into one chip when they match. ✅
- **(c)** Mission chip links to `sourceUrl`. ✅

## Open data dependencies (non-blocking for code)

- Лисицин: logo image + link URL.
- Сергей Переверзев: logo image + link URL.
- Maintainer review pass: mark explicit `provenance` exceptions (Star System-original units; units with verbatim official lore).

## Implementation deltas (built beyond the original spec)

Captured for honesty — the code is the source of truth.

- **Source logos, not just icons.** Tehnolog + Star System chips render their actual logos (`public/images/credits/tehnolog.png`, `star_system.jpg`), unifying lore chips with painter chips. `SourceChip` prefers `logo` over `icon`.
- **«Дополнить» contribute CTA.** Every `ProvenanceRow` carries a `Megaphone` button → `vk.com/bp_bnp` (`CONTRIBUTION_VK_URL`) so anyone can submit lore/painters/provenance. `PainterChip` renders it only when there's no lore row (avoids duplicate CTAs on unit pages).
- **Painter chip decoupled from group photo.** `getPhotoCredit` now returns `undefined` for unattributed squads (no more Shnaider-as-default). The chip shows whenever a squad is in `SQUAD_PHOTO_SOURCE`, so Lisitsin's squads display attribution via their per-soldier photos (no group photo needed).
- **Painters added.** `CREDITS` += `lisitsin` (logo ✓, URL pending), `pereverzev` (logo/URL/squads pending — TODO entry, unreferenced). `SQUAD_PHOTO_SOURCE` += Lisitsin's 5 squads (4 Рутения + `protectorate_peschanie_sokoly`) + `protectorate_lyogkaya_kiberpehota` (Shnaider, to preserve prior attribution after removing the default).
- **`originOnly` prop** on `ProvenanceRow` — renders just the origin chip for lore-less units (loreAuthor is moot without lore text).
- **`data-testid`s** `provenance-row` / `painter-chip` / `contribute-link` / `source-filter-*` for stable E2E.

## Encyclopedia source filter — REVERTED

A «Все / Технолог / Star System» filter on the units grid (`EncyclopediaPage.tsx`) filtering by `resolveUnitProvenance(unit).origin` was added, then **reverted per maintainer** (decided it was unnecessary). The data model (`provenance.ts`) still supports such a filter if it's wanted later; only the UI + its E2E test were removed.

