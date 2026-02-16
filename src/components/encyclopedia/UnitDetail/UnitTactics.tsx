import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Target } from 'lucide-react';

interface UnitTacticsProps {
  unit: UnitWithType;
}

export function UnitTactics({ unit }: UnitTacticsProps) {
  if (!unit.encyclopedia?.tactics) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Тактика использования
      </h2>
      <p className="text-slate-300 leading-relaxed">{unit.encyclopedia.tactics}</p>
    </div>
  );
}
