import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { Crosshair } from 'lucide-react';

/**
 * «Вооружение» — weapon manifest from the official Справочник техники.
 *
 * A mobile-first table: each row is the weapon's name (with its model code) over
 * a micro-label meta line (caliber / range), plus an optional notes paragraph.
 * Columns without any data across all rows simply never render. Mirrors the
 * dossier idiom of `UnitSpecs` (folded paper, oswald values, ibm-mono labels).
 * Hidden entirely when the machine has no `armament` (squads, machines outside
 * the handbook).
 */
interface UnitArmamentProps {
  unit: EncyclopediaUnit;
}

export function UnitArmament({ unit }: UnitArmamentProps) {
  const armament = unit.encyclopedia?.armament;
  if (!armament || armament.length === 0) return null;

  return (
    <div id="armament" className="folded-paper military-corners p-6 scroll-mt-4" data-testid="unit-armament">
      <h2 className="font-oswald text-lg text-military-sand mb-4 flex items-center gap-2">
        <Crosshair className="w-5 h-5 text-military-rust" />
        Вооружение
      </h2>

      <ul className="divide-y divide-military-steel/15">
        {armament.map((w) => (
          <li key={w.name} className="py-3 first:pt-0 last:pb-0" data-testid="armament-entry">
            <div className="font-oswald text-military-sand text-sm md:text-base leading-tight">
              {w.name}
            </div>
            {(w.caliber || w.range) && (
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/60">
                {w.caliber && <span>{w.caliber}</span>}
                {w.range && <span>{w.range}</span>}
              </div>
            )}
            {w.notes && (
              <p className="mt-1 text-military-sand/70 text-sm leading-relaxed">{w.notes}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
