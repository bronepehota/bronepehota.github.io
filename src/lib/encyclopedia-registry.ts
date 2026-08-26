/**
 * Encyclopedia Registry
 *
 * Centralized access to encyclopedia lore data independent of army list sources.
 * This registry provides units and factions with their descriptive content (lore, tactics, history).
 *
 * Game data (stats, soldiers, weapons) remains in source files for army building.
 */

import factionsJson from '@/data/encyclopedia/factions.json';
// Import units from faction/type structure
import type { Location } from '@/lib/types';
// Type-only: Provenance type lives in ./provenance, which type-only-imports back
// from this module — type-only on both sides, no runtime cycle.
import type { Provenance } from '@/lib/provenance';
import { getSourceUnitCost } from './sources-registry';
import type { SourceID } from './types';
import polarisSquads from '@/data/encyclopedia/units/polaris/squads.json';
import polarisMachines from '@/data/encyclopedia/units/polaris/machines.json';
import protectorateSquads from '@/data/encyclopedia/units/protectorate/squads.json';
import protectorateMachines from '@/data/encyclopedia/units/protectorate/machines.json';
import mercenariesSquads from '@/data/encyclopedia/units/mercenaries/squads.json';
import mercenariesMachines from '@/data/encyclopedia/units/mercenaries/machines.json';
import ruteniaSquads from '@/data/encyclopedia/units/rutenia/squads.json';
import ruteniaMachines from '@/data/encyclopedia/units/rutenia/machines.json';
import deadFleetSquads from '@/data/encyclopedia/units/dead_fleet/squads.json';
import deadFleetMachines from '@/data/encyclopedia/units/dead_fleet/machines.json';
import snowWolvesSquads from '@/data/encyclopedia/units/snow_wolves/squads.json';
import snowWolvesMachines from '@/data/encyclopedia/units/snow_wolves/machines.json';

// Type definitions
export interface UnitSource {
  id: string;
}

/** Позиция вооружения из официального «Справочника техники» (лор-ТТХ, не игровые статы). */
export interface ArmamentEntry {
  /** Русское название + код модели, напр. «Лазерная пушка «Световой меч» (LG-25)». */
  name: string;
  /** «30 мм», «5,6 мм» — как в справочнике, строкой. */
  caliber?: string;
  /** Дальность/особенность эффектом — строкой, если указана. */
  range?: string;
  /** Производитель, монтаж, эффект — кратко. */
  notes?: string;
}

export interface EncyclopediaLore {
  class?: string;
  type?: string;
  lore?: string;
  tactics?: string;
  history?: string;
  manufacturer?: string;
  traditions?: string;
  keyBattles?: Array<{ name: string; year: string; description: string; outcome: string }>;
  locations?: Array<{ name: string; description: string; type?: Location['type'] }>;
  sourceUrl?: string;
  monoblock?: string;
  mass?: string;
  crew?: string;
  shortDescription?: string;
  /** Машинный индекс по системе обозначений справочника: «БМР-1Г», «УМ-2Ш», «УМ6-2». */
  designation?: string;
  /** Таблица вооружений из «Справочника техники». */
  armament?: ArmamentEntry[];
  [key: string]: any;
}

export interface EncyclopediaUnit {
  id: string;
  name: string;
  shortName: string;
  faction: string;
  type: 'squad' | 'machine' | 'орудие';
  sources: UnitSource[];
  image?: string;
  encyclopedia?: EncyclopediaLore;
  /** Optional disclaimer shown on the detail page (e.g. provisional stats). */
  statsNote?: string;
  /** Lore provenance override (origin / loreAuthor). Unset axes fall back to the
   * faction-aware default — see `resolveUnitProvenance` in `@/lib/provenance`. */
  provenance?: Partial<Provenance>;
  /** Who made the 3D model / card-art render of this squad's images — a credit id
   *  from `CREDITS` (e.g. 'lisitsin'). Shown on the detail page; absent = generic
   *  card-art (→ Star System image-source fallback). */
  imageSource?: string;
  /** Who made the PHYSICAL miniature / sculpt — a credit id from `CREDITS`.
   *  Can differ from `imageSource` (e.g. Lisitsin rendered a Tehnolog-original model).
   *  Shown as // МИНИАТЮРЫ chip when it differs from the image creator. */
  miniatureSource?: string;
  /** Squad sponsor — a person who funded/commissioned the squad's miniatures or lore.
   *  Shown as a // СПОНСОР chip on the detail page. `name` is optional (defaults to a
   *  generic «Спонсор отряда» label); `url` is the sponsor's profile (e.g. VK). */
  sponsor?: { name?: string; url: string };
}

export interface EncyclopediaFaction {
  id: string;
  name: string;
  color?: string;
  symbol?: string;
  description?: string;
  homeWorld?: string;
  motto?: string;
  icon?: string;
  banner?: string;
  sources: string[];
  allies?: string[];
  /** Parent faction id — display-only sub-faction grouping (see `Faction.parent`). */
  parent?: string;
  /** Lore provenance override (origin / loreAuthor). Unset axes fall back to the
   * faction-aware default — see `resolveFactionProvenance` in `@/lib/provenance`. */
  provenance?: Partial<Provenance>;
  /** Optional link to the faction's official / community page (for more details). */
  siteUrl?: string;
}

// Type assertion for JSON imports
// Merge all faction/type units into single array
const encyclopediaUnits: EncyclopediaUnit[] = [
  ...(polarisSquads as EncyclopediaUnit[]),
  ...(polarisMachines as EncyclopediaUnit[]),
  ...(protectorateSquads as EncyclopediaUnit[]),
  ...(protectorateMachines as EncyclopediaUnit[]),
  ...(mercenariesSquads as EncyclopediaUnit[]),
  ...(mercenariesMachines as EncyclopediaUnit[]),
  ...(ruteniaSquads as EncyclopediaUnit[]),
  ...(ruteniaMachines as EncyclopediaUnit[]),
  ...(deadFleetSquads as EncyclopediaUnit[]),
  ...(deadFleetMachines as EncyclopediaUnit[]),
  ...(snowWolvesSquads as EncyclopediaUnit[]),
  ...(snowWolvesMachines as EncyclopediaUnit[]),
];
const encyclopediaFactions: EncyclopediaFaction[] = factionsJson as EncyclopediaFaction[];

/**
 * Get encyclopedia unit by ID
 * Returns undefined if unit not found
 */
export function getEncyclopediaUnit(id: string): EncyclopediaUnit | undefined {
  return encyclopediaUnits.find((unit) => unit.id === id);
}

/**
 * Get encyclopedia faction by ID
 * Returns undefined if faction not found
 */
export function getEncyclopediaFaction(id: string): EncyclopediaFaction | undefined {
  return encyclopediaFactions.find((faction) => faction.id === id);
}

/**
 * Get all units for a specific faction
 * Returns empty array if faction has no units
 */
export function getUnitsForFaction(factionId: string): EncyclopediaUnit[] {
  return encyclopediaUnits.filter((unit) => unit.faction === factionId);
}

/**
 * Get all units of a specific type (squad or machine)
 */
export function getUnitsByType(type: 'squad' | 'machine' | 'орудие'): EncyclopediaUnit[] {
  return encyclopediaUnits.filter((unit) => unit.type === type);
}

/**
 * Get all factions
 */
export function getFactions(): EncyclopediaFaction[] {
  return encyclopediaFactions;
}

/**
 * Get all encyclopedia units
 */
export function getAllUnits(): EncyclopediaUnit[] {
  return encyclopediaUnits;
}

/**
 * Get unit's source availability — an id-only index of which army-list sources
 * contain this unit. For a source's cost, use `getUnitCostForSource` (cost is
 * read from the source army list, the single source of truth).
 */
export function getUnitSources(unitId: string): UnitSource[] {
  const unit = getEncyclopediaUnit(unitId);
  return unit?.sources || [];
}

/**
 * Check if unit is available in a specific source
 */
export function isUnitInSource(unitId: string, sourceId: string): boolean {
  const sources = getUnitSources(unitId);
  return sources.some((s) => s.id === sourceId);
}

/**
 * Get unit cost for a specific source — read directly from the source army list
 * (single source of truth). Returns undefined if the unit isn't in that source.
 */
export function getUnitCostForSource(unitId: string, sourceId: string): number | undefined {
  return getSourceUnitCost(sourceId as SourceID, unitId);
}

/**
 * Check if faction is available in a specific source
 */
export function isFactionInSource(factionId: string, sourceId: string): boolean {
  const faction = getEncyclopediaFaction(factionId);
  return faction?.sources.includes(sourceId) || false;
}
