import { EnrichedUnit } from '@/lib/encyclopedia-utils';

/**
 * «Разделы» — anchor chips for the unit dossier's sections.
 *
 * A rich dossier runs 5.7+ screens («Вооружение» sits 2 screens deep, «Лор»
 * deeper still) with no up-front hint of what the page contains. This is a
 * single horizontal strip of mono chips under the header that jumps to each
 * EXISTING section. Presence conditions must mirror the section components'
 * null-conditions exactly (UnitSpecs / UnitArmament / UnitStatTable /
 * SoldierImages / the tactics section / UnitLore / UnitLoreDetail) — a chip
 * pointing at a section that didn't render would be a dead anchor.
 *
 * Hidden when fewer than 2 sections exist: one chip is noise, not navigation.
 * Mobile-first: the row is `overflow-x-auto` with `whitespace-nowrap` chips —
 * it scrolls sideways instead of wrapping to a second line on 320px. The thin
 * custom scrollbar is mobile-only (`custom-scrollbar-mobile`); on md+ the
 * scrollbar is hidden entirely (W2-8c.1): the chips fit and Chromium kept
 * painting a scrollbar/buttons artifact at the right edge even without
 * overflow — hidden it is, exotic overflow still scrolls (owner 2026-09-29).
 *
 * The lead `// РАЗДЕЛЫ` label was REMOVED by owner decision (2026-09-29): on a
 * 320px screen it ate ~90px of the scroll ribbon before the first useful chip.
 * Nav semantics live on `aria-label="Разделы досье"` — sighted users see chips
 * only, screen readers still get the labelled landmark.
 */
interface UnitSectionNavProps {
  /** Base unit — spec/armament/lore are constants of the machine. */
  unit: EnrichedUnit;
  /** Source-switched unit — tactics/personnel follow the active army list. */
  activeUnit: EnrichedUnit;
  /** Whether a long-form lore doc («Полное описание») exists for this unit. */
  hasLoreDoc: boolean;
}

export function UnitSectionNav({ unit, activeUnit, hasLoreDoc }: UnitSectionNavProps) {
  const enc = unit.encyclopedia;
  const activeEnc = activeUnit.encyclopedia;

  // Same conditions as the section components themselves (see class doc).
  const sections = [
    // UnitSpecs: `type` alone doesn't open the block (squads show class in the header)
    {
      id: 'specs',
      label: 'Характеристики',
      present: !!(enc && (enc.monoblock || enc.mass || enc.crew || enc.manufacturer)),
    },
    // UnitArmament
    {
      id: 'armament',
      label: 'Вооружение',
      present: !!(enc?.armament && enc.armament.length > 0),
    },
    // UnitStatTable — always rendered on the detail page
    { id: 'stats', label: 'Боевой расчёт', present: true },
    // SoldierImages — squads with at least one portrait
    {
      id: 'personnel',
      label: 'Личный состав',
      present: activeUnit.type === 'squad' && !!(activeUnit.soldiers?.[0]?.image || activeUnit.image),
    },
    // Tactics section (follows the active source)
    { id: 'tactics', label: 'Тактика', present: !!activeEnc?.tactics },
    // UnitLore
    {
      id: 'lore',
      label: 'Лор',
      present: !!(enc && (
        enc.lore || enc.history || enc.traditions ||
        (enc.keyBattles && enc.keyBattles.length > 0) ||
        (enc.locations && enc.locations.length > 0)
      )),
    },
    // UnitLoreDetail («Читать подробнее»)
    { id: 'full-lore', label: 'Полное описание', present: hasLoreDoc },
  ].filter((s) => s.present);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label="Разделы досье"
      data-testid="unit-section-nav"
      className="-mx-1 overflow-x-auto custom-scrollbar-mobile px-1 md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max items-center gap-1.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              data-testid={`unit-section-chip-${s.id}`}
              className="shrink-0 whitespace-nowrap rounded-sm border border-military-steel/40 bg-military-charcoal/40 px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-wider text-military-taupe/80 transition-colors hover:border-military-amber/50 hover:text-military-amber"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
