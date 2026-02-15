import Image from 'next/image';
import { UnitWithType } from '@/lib/encyclopedia-utils';

interface UnitHeaderProps {
  unit: UnitWithType;
}

const factionColors = {
  polaris: 'text-red-400',
  protectorate: 'text-cyan-400',
  mercenaries: 'text-yellow-400',
};

const factionNames = {
  polaris: 'Империя Полярис',
  protectorate: 'Торговый Протекторат',
  mercenaries: 'Наёмники',
};

export function UnitHeader({ unit }: UnitHeaderProps) {
  const factionColor = factionColors[unit.faction];
  const factionName = factionNames[unit.faction];

  if (!unit.image) {
    return (
      <div className="mb-8">
        <div className={`text-sm font-semibold ${factionColor} mb-2`}>
          {factionName}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{unit.name}</h1>
        {unit.encyclopedia?.class && (
          <div className="text-slate-400 mb-4">{unit.encyclopedia.class}</div>
        )}
        <div className="text-2xl font-bold text-slate-300">{unit.cost} очков</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 mb-8">
      <div className="w-full md:w-1/3 relative aspect-[3/4] rounded-lg overflow-hidden">
        <Image
          src={unit.image}
          alt={unit.name}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex-1">
        <div className={`text-sm font-semibold ${factionColor} mb-2`}>
          {factionName}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{unit.name}</h1>
        {unit.encyclopedia?.class && (
          <div className="text-slate-400 mb-4">{unit.encyclopedia.class}</div>
        )}
        <div className="text-2xl font-bold text-slate-300">{unit.cost} очков</div>
      </div>
    </div>
  );
}
