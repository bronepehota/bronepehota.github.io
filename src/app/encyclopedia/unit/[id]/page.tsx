import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEnrichedUnit, getAllUnits, EnrichedUnit } from '@/lib/encyclopedia-utils';
import { getUnitLoreDoc } from '@/lib/unit-lore';
import { unitCampaigns } from '@/lib/campaigns';
import UnitDetailPage from '@/components/encyclopedia/UnitDetailPage';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, breadcrumbJsonLd, metaDescription, pageOpenGraph } from '@/lib/seo';

interface PageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  const units = await getAllUnits();
  return units.map(unit => ({ id: unit.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const unit = await getEnrichedUnit(params.id);

  if (!unit) {
    return {
      title: 'Не найдено — Энциклопедия Бронепехоты',
    };
  }

  // Meta description — the lore's first ~180 chars (word boundary + ellipsis),
  // same pattern as the history/world pages; raw lore can run 1000+ chars.
  const description = metaDescription(
    unit.encyclopedia?.lore || `Отряд ${unit.name} фракции ${unit.faction}`,
    180,
  );

  return {
    title: `${unit.name} — Энциклопедия Бронепехоты`,
    description,
    alternates: {
      canonical: absoluteUrl(`/encyclopedia/unit/${unit.id}`),
    },
    // Full OG set via pageOpenGraph — the old bare `openGraph: { images }`
    // REPLACED the layout's og:title/description/locale and, when the unit had
    // no image, wiped og:image entirely (empty array) (seo.ts gotcha). Keeps
    // the unit card as the social image, falls back to the site card.
    openGraph: pageOpenGraph({
      title: `${unit.name} — Энциклопедия Бронепехоты`,
      description,
      path: `/encyclopedia/unit/${unit.id}`,
      images: unit.image
        ? [{ url: absoluteUrl(unit.image), alt: unit.name }]
        : undefined,
    }),
  };
}

export default async function Page({ params }: PageProps) {
  const unit = await getEnrichedUnit(params.id);

  if (!unit) {
    notFound();
  }

  // Pre-compute enriched game data for EVERY source the unit appears in, so the
  // client can switch sources (stats/cost/weapons) without a network round-trip.
  // Lore is source-independent and lives on the encyclopedia entry.
  const sourceIds = unit.sources.map(s => s.id);
  const bySource: Record<string, EnrichedUnit> = {};
  await Promise.all(sourceIds.map(async sid => {
    const enriched = await getEnrichedUnit(params.id, sid);
    if (enriched) bySource[sid] = enriched;
  }));
  const sourceOrder = sourceIds.filter(sid => bySource[sid]);

  // Long-form lore doc (build-time render → lands in static HTML). Null when absent.
  const loreDoc = await getUnitLoreDoc(params.id);
  // «// УЧАСТИЕ В ВОЙНАХ» — reverse index over the campaign frontmatter rosters
  // (the campaign→unit edge already exists; this makes it bidirectional).
  const campaigns = unitCampaigns(params.id);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          // Aligned with the visible navigation: «Энциклопедия» is the archive
          // hub (root), «Юниты» — the catalog the back-link returns to.
          { name: 'Энциклопедия', path: '/encyclopedia' },
          { name: 'Юниты', path: '/encyclopedia/units' },
          { name: unit.name, path: `/encyclopedia/unit/${unit.id}` },
        ])}
      />
      <UnitDetailPage
        unit={unit}
        bySource={bySource}
        sourceOrder={sourceOrder}
        loreDoc={loreDoc}
        campaigns={campaigns}
      />
    </>
  );
}

