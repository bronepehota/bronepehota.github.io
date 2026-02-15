import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { UnitWithType } from '@/lib/encyclopedia-utils';

interface UnitCardProps {
  unit: UnitWithType;
}

const factionColors = {
  polaris: 'bg-red-500',
  protectorate: 'bg-cyan-500',
  mercenaries: 'bg-yellow-500',
};

export function UnitCard({ unit }: UnitCardProps) {
  const factionColor = factionColors[unit.faction];

  return (
    <Link
      href={`/encyclopedia/unit/${unit.id}`}
      className="block bg-slate-800 rounded-lg overflow-hidden hover:bg-slate-700 transition-colors"
      data-testid={`unit-card-${unit.id}`}
    >
      <div className="relative aspect-[3/4] w-full">
        <SafeImage
          src={unit.image || '/images/placeholder.png'}
          alt={unit.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${factionColor}`}>
            {unit.faction === 'polaris' && 'Полярис'}
            {unit.faction === 'protectorate' && 'Протекторат'}
            {unit.faction === 'mercenaries' && 'Наёмники'}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-white text-sm mb-1">{unit.name}</h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{unit.encyclopedia?.class || (unit.type === 'squad' ? 'Отряд' : 'Машина')}</span>
          <span>{unit.cost} очков</span>
        </div>
      </div>
    </Link>
  );
}
