import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { Gauge, ExternalLink } from 'lucide-react';

/**
 * «Характеристики» — the machine's technical spec plate (ТТХ).
 *
 * Renders the structured `encyclopedia` fields that describe the PHYSICAL machine
 * (Разработчик / Моноблок / Масса / Экипаж / Тип). These were historically stored in
 * JSON but never displayed; this card surfaces them (and, being in the static HTML,
 * makes them crawlable). Shown only when at least one of the machine-defining specs
 * is present — squads rarely carry these, so the block stays hidden for them (their
 * `class` already shows in the header). Mirrors the dossier idiom of `UnitLore`:
 * folded-paper card, oswald values under ibm-mono micro-labels.
 */
interface UnitSpecsProps {
  unit: EncyclopediaUnit;
}

// Label + key pairs, in display order. `type` is last because the broad `class`
// already appears in the header — `type` is the finer role (e.g. «Линейный шагающий танк»).
const SPEC_FIELDS: { key: 'type' | 'manufacturer' | 'monoblock' | 'mass' | 'crew'; label: string }[] = [
  { key: 'type', label: 'Тип' },
  { key: 'manufacturer', label: 'Разработчик' },
  { key: 'monoblock', label: 'Моноблок' },
  { key: 'mass', label: 'Масса' },
  { key: 'crew', label: 'Экипаж' },
];

export function UnitSpecs({ unit }: UnitSpecsProps) {
  const enc = unit.encyclopedia;
  if (!enc) return null;

  // Machine-defining specs (monoblock / mass / crew / manufacturer). `type` alone
  // (common on squads, whose class is already in the header) does not open the block.
  const hasMachineSpec = !!(enc.monoblock || enc.mass || enc.crew || enc.manufacturer);
  if (!hasMachineSpec) return null;

  const rows = SPEC_FIELDS.filter((f) => enc[f.key]);
  const sourceUrl = enc.sourceUrl;

  return (
    <div className="folded-paper military-corners p-6" data-testid="unit-specs">
      <h2 className="font-oswald text-lg text-military-sand mb-4 flex items-center gap-2">
        <Gauge className="w-5 h-5 text-military-rust" />
        Характеристики
      </h2>

      {/* Data plate — micro-labels above oswald values, thin top rules read as a
          stamped instrument panel rather than a plain table. */}
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
        {rows.map((f) => (
          <div key={f.key} className="border-t border-military-steel/20 pt-2">
            <dt className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/50">
              {f.label}
            </dt>
            <dd className="font-oswald text-military-sand text-sm md:text-base leading-tight mt-1">
              {enc[f.key]}
            </dd>
          </div>
        ))}
      </dl>

      {sourceUrl && (
        <div className="mt-5 pt-3 border-t border-military-steel/15">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/60 hover:text-military-amber transition-colors"
          >
            <ExternalLink className="w-3 h-3" aria-hidden />
            Источник ТТХ
          </a>
        </div>
      )}
    </div>
  );
}
