import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEnrichedUnit, getAllUnits } from '@/lib/encyclopedia-utils';
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

  return <UnitDetailPage unit={unit} />;
}
