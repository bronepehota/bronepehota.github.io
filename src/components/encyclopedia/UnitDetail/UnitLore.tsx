import { UnitWithType } from '@/lib/encyclopedia-utils';
import { BookOpen } from 'lucide-react';

interface UnitLoreProps {
  unit: UnitWithType;
}

export function UnitLore({ unit }: UnitLoreProps) {
  const hasContent = unit.encyclopedia?.lore || unit.encyclopedia?.history;

  if (!hasContent) return null;

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Лор и история
      </h2>

      {unit.encyclopedia?.lore && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Описание</h3>
          <p className="text-slate-300 leading-relaxed">{unit.encyclopedia.lore}</p>
        </div>
      )}

      {unit.encyclopedia?.history && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">История создания</h3>
          <p className="text-slate-300 leading-relaxed">{unit.encyclopedia.history}</p>
        </div>
      )}
    </div>
  );
}
