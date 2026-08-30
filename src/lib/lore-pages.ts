import type { EncyclopediaUnit } from './encyclopedia-registry';
import { getEncyclopediaUnit } from './encyclopedia-registry';
import { getAllHistoryChapters, getHistoryChapterRaw } from './history';
import { getAllCampaigns, getCampaignRaw } from './campaigns';
import { getAllMissions } from './missions-registry';
import { getUnitLoreRaw } from './unit-lore';
import { getAllWorldEntries, getWorldEntryRaw, WORLD_KIND_LABELS } from './world';
import { toSearchBody, type LorePageRef } from './unit-search';
import { getAllUnits } from './encyclopedia-utils';

/**
 * Build-time index of every lore page the search hints cover (history
 * chapters, campaigns, missions, unit-lore docs, world entities). Shared by
 * BOTH encyclopedia surfaces that carry a search — the «Архив вселенной» hub
 * (/encyclopedia) and the units catalog (/encyclopedia/units) — so their hint
 * universes can never drift apart.
 *
 * Each entry carries a compact BODY (toSearchBody: head of the cleaned text +
 * a tail of proper nouns from the whole document) so hints match words from
 * the TEXT («Блауд», «реактор»), not just titles — bodies add ~130KB to the
 * client payload. Campaign hints deep-link to their detail pages
 * (/campaigns/[slug]) — not the shared #wars anchor.
 */
export function buildLorePages(units: EncyclopediaUnit[]): LorePageRef[] {
  return [
    ...getAllHistoryChapters().map((c) => ({
      title: c.title,
      href: `/encyclopedia/history#${c.slug}`,
      kind: 'chapter' as const,
      body: toSearchBody(getHistoryChapterRaw(c.slug) ?? ''),
    })),
    ...getAllCampaigns().map((c) => ({
      title: c.title,
      href: `/campaigns/${c.slug}`,
      kind: 'campaign' as const,
      body: toSearchBody(getCampaignRaw(c.slug) ?? ''),
    })),
    // Missions: titles are short («Капкан») — the body indexes the briefing,
    // summary and objectives so mission-specific words are findable.
    ...getAllMissions().map((m) => ({
      title: m.name,
      href: `/encyclopedia/mission/${m.id}`,
      kind: 'mission' as const,
      body: toSearchBody(
        [
          m.tagline,
          m.summary,
          m.briefing?.setting,
          m.briefing?.order,
          m.briefing?.report,
          ...(m.specialRules ?? []),
          ...Object.values(m.objectives ?? {}).flatMap((o) => [o.text, ...(o.victoryConditions ?? [])]),
        ]
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
          .join(' '),
      ),
    })),
    // Unit long-form lore docs — title = the unit's display name.
    ...units
      .filter((u) => !!getUnitLoreRaw(u.id))
      .map((u) => ({
        title: getEncyclopediaUnit(u.id)?.name ?? u.name,
        href: `/encyclopedia/unit/${u.id}`,
        kind: 'unit-lore' as const,
        body: toSearchBody(getUnitLoreRaw(u.id) ?? ''),
      })),
    // World entity pages («Алфавит вселенной») — подсказки несут гриф по kind
    // сущности (ПЕРСОНА/ЛОКАЦИЯ/БИТВА/ТЕРМИН) вместо общего «// СУЩНОСТЬ».
    ...getAllWorldEntries().map((e) => ({
      title: e.title,
      href: `/encyclopedia/world/${e.slug}`,
      kind: 'world' as const,
      label: `// ${WORLD_KIND_LABELS[e.kind]}`,
      body: toSearchBody(getWorldEntryRaw(e.slug) ?? ''),
    })),
  ];
}

/** Convenience for callers that haven't loaded the units yet (server pages). */
export async function buildLorePagesWithUnits(): Promise<LorePageRef[]> {
  return buildLorePages(await getAllUnits());
}
