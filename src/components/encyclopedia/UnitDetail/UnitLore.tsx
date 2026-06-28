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
    <div className="folded-paper military-corners p-6">
      <h2 className="font-oswald text-lg text-military-sand mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-military-rust" />
        Лор и история
      </h2>

      {unit.encyclopedia?.lore && (
        <div className="mb-4">
          <h3 className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
            {'// ОПИСАНИЕ'}
          </h3>
          <p className="text-military-sand/90 leading-relaxed">{unit.encyclopedia.lore}</p>
        </div>
      )}

      {unit.encyclopedia?.history && (
        <div className="mb-4">
          <h3 className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
            {'// ИСТОРИЯ СОЗДАНИЯ'}
          </h3>
          <p className="text-military-sand/80 leading-relaxed">{unit.encyclopedia.history}</p>
        </div>
      )}

      {unit.encyclopedia?.traditions && (
        <div className="mt-4">
          <h3 className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
            {'// ТРАДИЦИИ'}
          </h3>
          <p className="text-military-sand/80 leading-relaxed italic border-l-2 border-military-amber/60 pl-4">
            {unit.encyclopedia.traditions}
          </p>
        </div>
      )}

      {unit.encyclopedia?.keyBattles && unit.encyclopedia.keyBattles.length > 0 && (
        <div className="mt-4">
          <h3 className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
            {'// КЛЮЧЕВЫЕ СРАЖЕНИЯ'}
          </h3>
          <div className="space-y-3">
            {unit.encyclopedia.keyBattles.map((battle, index) => (
              <div key={index} className="border-l-2 border-military-steel/40 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-oswald text-military-sand">{battle.name}</h4>
                  <span className="font-ibm-mono text-xs text-military-amber">{battle.year}</span>
                </div>
                <p className="text-sm text-military-sand/70 mb-1">{battle.description}</p>
                <p className="text-xs text-military-steel italic">{battle.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {unit.encyclopedia?.locations && unit.encyclopedia.locations.length > 0 && (
        <div className="mt-4">
          <h3 className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
            {'// ЗНАЧИМЫЕ МЕСТА'}
          </h3>
          <div className="space-y-2">
            {unit.encyclopedia.locations.map((location, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-lg">{getLocationIcon(location.type)}</span>
                <div>
                  <h4 className="font-oswald text-military-sand">{location.name}</h4>
                  <p className="text-sm text-military-sand/70">{location.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
