import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

/**
 * Машинный индекс из системы обозначений «Справочника техники» («БМР-1Г»,
 * «УМШ-2», «УМ6-2»). A stamped mono chip next to the unit's class — reads as
 * factory paperwork clipped to the dossier. Absent for squads and machines
 * outside the handbook.
 */
export function DesignationChip({ unit }: { unit: EncyclopediaUnit }) {
  const designation = unit.encyclopedia?.designation;
  if (!designation) return null;
  return (
    <span
      data-testid="unit-designation"
      className="inline-flex items-center rounded border border-military-steel/40 bg-military-charcoal/70 px-2 py-0.5 font-ibm-mono text-[11px] tracking-wider text-military-amber"
    >
      {designation}
    </span>
  );
}
