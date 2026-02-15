import { FactionID } from '@/lib/types';

interface FilterBarProps {
  selectedFaction: FactionID | 'all';
  selectedType: 'all' | 'squad' | 'machine';
  onFactionChange: (faction: FactionID | 'all') => void;
  onTypeChange: (type: 'all' | 'squad' | 'machine') => void;
}

const factions: { value: FactionID | 'all'; label: string }[] = [
  { value: 'all', label: 'Все фракции' },
  { value: 'polaris', label: 'Империя Полярис' },
  { value: 'protectorate', label: 'Торговый Протекторат' },
  { value: 'mercenaries', label: 'Наёмники' },
];

const types: { value: 'all' | 'squad' | 'machine'; label: string }[] = [
  { value: 'all', label: 'Все типы' },
  { value: 'squad', label: 'Пехота' },
  { value: 'machine', label: 'Техника' },
];

export function FilterBar({
  selectedFaction,
  selectedType,
  onFactionChange,
  onTypeChange
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Faction filter */}
      <div role="group" aria-label="Фильтр по фракции" className="flex gap-1">
        {factions.map(faction => (
          <button
            key={faction.value}
            onClick={() => onFactionChange(faction.value)}
            aria-pressed={selectedFaction === faction.value}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-slate-500 ${
              selectedFaction === faction.value
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {faction.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div role="group" aria-label="Фильтр по типу" className="flex gap-1">
        {types.map(type => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            aria-pressed={selectedType === type.value}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-slate-500 ${
              selectedType === type.value
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
