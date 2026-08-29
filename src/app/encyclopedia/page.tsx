import type { Metadata } from 'next';
import { getAllUnits } from '@/lib/encyclopedia-utils';
import { getAllHistoryChapters, getHistoryChapterRaw } from '@/lib/history';
import { getAllCampaigns, getCampaignRaw } from '@/lib/campaigns';
import { getAllMissions } from '@/lib/missions-registry';
import { getUnitLoreRaw } from '@/lib/unit-lore';
import { getEncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { toSearchBody, type LorePageRef } from '@/lib/unit-search';
import EncyclopediaPageClient from '@/components/encyclopedia/EncyclopediaPage';
import { pageOpenGraph } from '@/lib/seo';
import { ENCYCLOPEDIA_DESCRIPTION, ENCYCLOPEDIA_TITLE } from './meta';

// Own canonical — the root layout no longer provides one (it used to make every
// alternates-less page a "duplicate" of the homepage). Title/desc live in the
// encyclopedia layout; the page-level openGraph adds og:url (a page-level OG
// object replaces the root one — pageOpenGraph keeps the site og:image card).
export const metadata: Metadata = {
  alternates: { canonical: '/encyclopedia' },
  openGraph: pageOpenGraph({
    title: ENCYCLOPEDIA_TITLE,
    description: ENCYCLOPEDIA_DESCRIPTION,
    path: '/encyclopedia',
  }),
};

export default async function EncyclopediaPage() {
  // Fetch all units at build time
  const allUnits = await getAllUnits();

  // Lore pages for search hints: chapters + campaigns + missions + unit-lore
  // docs. Each entry carries a compact BODY (toSearchBody: head of the cleaned
  // text + a tail of proper nouns from the whole document) so the hints match
  // words from the TEXT («Блауд», «реактор»), not just titles — bodies add
  // ~130KB to the client payload. Campaign hints deep-link to their detail
  // pages (/campaigns/[slug]) — not the shared #wars anchor.
  const lorePages: LorePageRef[] = [
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
    ...allUnits
      .filter((u) => !!getUnitLoreRaw(u.id))
      .map((u) => ({
        title: getEncyclopediaUnit(u.id)?.name ?? u.name,
        href: `/encyclopedia/unit/${u.id}`,
        kind: 'unit-lore' as const,
        body: toSearchBody(getUnitLoreRaw(u.id) ?? ''),
      })),
  ];

  return <EncyclopediaPageClient initialUnits={allUnits} lorePages={lorePages} />;
}
