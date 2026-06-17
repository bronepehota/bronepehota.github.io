import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEnrichedUnit, getAllUnits, EnrichedUnit } from '@/lib/encyclopedia-utils';
import { getSource } from '@/lib/sources-registry';
import UnitDetailPage from '@/components/encyclopedia/UnitDetailPage';

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
      title: 'Не найдено — Энциклопедия Бронепехота',
    };
  }

  return {
    title: `${unit.name} — Энциклопедия Бронепехота`,
    description: unit.encyclopedia?.lore || `Отряд ${unit.name} фракции ${unit.faction}`,
    openGraph: {
      images: unit.image ? [unit.image] : [],
    },
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
  const sourceLabels: Record<string, string> = {};
  for (const sid of sourceOrder) {
    sourceLabels[sid] = getSource(sid)?.source.name ?? sid;
  }

  return (
    <UnitDetailPage
      unit={unit}
      bySource={bySource}
      sourceOrder={sourceOrder}
      sourceLabels={sourceLabels}
    />
  );
}

