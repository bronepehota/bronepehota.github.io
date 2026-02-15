import { UnitWithType } from '@/lib/encyclopedia-utils';
import { UnitCard } from './UnitCard';

interface UnitGridProps {
  units: UnitWithType[];
}

export function UnitGrid({ units }: UnitGridProps) {
  if (units.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">Ничего не найдено</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" data-testid="unit-grid">
      {units.map(unit => (
        <UnitCard key={unit.id} unit={unit} />
      ))}
    </div>
  );
}
