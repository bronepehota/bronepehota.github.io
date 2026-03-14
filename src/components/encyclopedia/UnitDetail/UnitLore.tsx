import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { BookOpen } from 'lucide-react';
import { getLocationIcon } from '@/lib/lore-utils';

interface UnitLoreProps {
  unit: EncyclopediaUnit;
}

export function UnitLore({ unit }: UnitLoreProps) {
  const hasContent = unit.encyclopedia?.lore || unit.encyclopedia?.history ||
                      unit.encyclopedia?.traditions ||
                      (unit.encyclopedia?.keyBattles && unit.encyclopedia.keyBattles.length > 0) ||
                      (unit.encyclopedia?.locations && unit.encyclopedia.locations.length > 0);

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
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">История создания</h3>
          <p className="text-slate-300 leading-relaxed">{unit.encyclopedia.history}</p>
        </div>
      )}

      {unit.encyclopedia?.traditions && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Традиции</h3>
          <p className="text-slate-300 leading-relaxed italic border-l-4 border-amber-500/60 pl-4">
            {unit.encyclopedia.traditions}
          </p>
        </div>
      )}

      {unit.encyclopedia?.keyBattles && unit.encyclopedia.keyBattles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Ключевые сражения</h3>
          <div className="space-y-3">
            {unit.encyclopedia.keyBattles.map((battle, index) => (
              <div key={index} className="border-l-2 border-slate-600 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">{battle.name}</h4>
                  <span className="text-xs text-amber-400">{battle.year}</span>
                </div>
                <p className="text-sm text-slate-300 mb-1">{battle.description}</p>
                <p className="text-xs text-slate-400 italic">{battle.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {unit.encyclopedia?.locations && unit.encyclopedia.locations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Значимые места</h3>
          <div className="space-y-2">
            {unit.encyclopedia.locations.map((location, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-lg">{getLocationIcon((location as any).type || 'default')}</span>
                <div>
                  <h4 className="font-semibold text-white">{location.name}</h4>
                  <p className="text-sm text-slate-300">{location.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
