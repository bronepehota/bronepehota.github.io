import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUnitById, getAllUnits } from '@/lib/encyclopedia-utils';
import { UnitHeader } from '@/components/encyclopedia/UnitDetail/UnitHeader';
import { UnitStats } from '@/components/encyclopedia/UnitDetail/UnitStats';
import { UnitLore } from '@/components/encyclopedia/UnitDetail/UnitLore';
import { UnitTactics } from '@/components/encyclopedia/UnitDetail/UnitTactics';
import { SourceLink } from '@/components/encyclopedia/UnitDetail/SourceLink';

interface PageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  const units = await getAllUnits();
  return units.map(unit => ({ id: unit.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const unit = await getUnitById(params.id);

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

export default async function UnitDetailPage({ params }: PageProps) {
  const unit = await getUnitById(params.id);

  if (!unit) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <UnitHeader unit={unit} />
        <UnitStats unit={unit} />
        <UnitLore unit={unit} />
        <UnitTactics unit={unit} />
        <div className="mt-8">
          <SourceLink unit={unit} />
        </div>
      </div>
    </div>
  );
}
