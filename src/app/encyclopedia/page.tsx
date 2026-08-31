import type { Metadata } from 'next';
import { getAllUnits } from '@/lib/encyclopedia-utils';
import { getAllHistoryChapters, historyEraYears } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import { getAllMissions } from '@/lib/missions-registry';
import { getAllWorldEntries } from '@/lib/world';
import { getSourcesCatalog } from '@/lib/sources-catalog';
import { buildLorePages } from '@/lib/lore-pages';
import ArchiveHub from '@/components/encyclopedia/hub/ArchiveHub';
import { pageOpenGraph } from '@/lib/seo';

// The encyclopedia root is the «АРХИВ ВСЕЛЕННОЙ» hub — a showcase of the
// whole universe (lore-first SEO surface). The unit catalog moved to
// /encyclopedia/units; legacy filter deep-links (?faction=…) forward there.
const TITLE = 'Энциклопедия вселенной Бронепехоты — история, войны, юниты';
const DESCRIPTION =
  'Энциклопедия вселенной Бронепехоты: история Робогир и СтарСис, хроники войн, досье вселенной, юниты, фракции и миссии. Полный лор общего мира настольных игр «Робогир» и «Бронепехота».';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/encyclopedia' },
  // A page-level openGraph object REPLACES the root-layout one (Next merges
  // top-level fields only) — pageOpenGraph keeps the full set incl. the site
  // og:image card and adds this page's own og:url.
  openGraph: pageOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/encyclopedia',
  }),
};

export default async function EncyclopediaHubPage() {
  const allUnits = await getAllUnits();

  // ——— Ledger counts: every number on the hub comes from the data ———
  const chapterMetas = getAllHistoryChapters();
  const campaigns = getAllCampaigns();

  // Era span of the whole ARCHIVE (chapters + campaigns): the hub strip shows
  // the universe's full record, matching the «ХРОНИКА …» badge of the history
  // cover (same union of sources — 1908… now), not just the wars block.
  const years = historyEraYears(chapterMetas);
  years.push(
    ...campaigns.flatMap((c) => (c.era?.match(/\b\d{4}\b/g) ?? []).map(Number)),
  );
  const era = {
    from: years.length ? Math.min(...years) : null,
    to: years.length ? Math.max(...years) : null,
  };

  const counts = {
    chapters: chapterMetas.length,
    campaigns: campaigns.length,
    world: getAllWorldEntries().length,
    units: allUnits.length,
    missions: getAllMissions().length,
    sources: getSourcesCatalog().length,
    factions: new Set(allUnits.map((u) => u.faction)).size,
  };

  // Lore pages for the cover search — shared builder with /encyclopedia/units
  // (src/lib/lore-pages.ts), so both surfaces search the same universe.
  const lorePages = buildLorePages(allUnits);

  return (
    <ArchiveHub lorePages={lorePages} counts={counts} era={era} />
  );
}
