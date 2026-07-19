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
import polarisSquads from '@/data/encyclopedia/units/polaris/squads.json';
import polarisMachines from '@/data/encyclopedia/units/polaris/machines.json';
import protectorateSquads from '@/data/encyclopedia/units/protectorate/squads.json';
import protectorateMachines from '@/data/encyclopedia/units/protectorate/machines.json';
import mercenariesSquads from '@/data/encyclopedia/units/mercenaries/squads.json';
import mercenariesMachines from '@/data/encyclopedia/units/mercenaries/machines.json';
import ruteniaSquads from '@/data/encyclopedia/units/rutenia/squads.json';
import ruteniaMachines from '@/data/encyclopedia/units/rutenia/machines.json';

// Type definitions
export interface UnitSource {
  id: string;
  cost: number;
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
 * Get unit's source availability with costs
 * Useful for displaying "Available in: Star System (50 pts), Tehnolog (55 pts)"
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
 * Get unit cost for a specific source
 * Returns undefined if unit not available in that source
 */
export function getUnitCostForSource(unitId: string, sourceId: string): number | undefined {
  const sources = getUnitSources(unitId);
  const source = sources.find((s) => s.id === sourceId);
  return source?.cost;
}

/**
 * Check if faction is available in a specific source
 */
export function isFactionInSource(factionId: string, sourceId: string): boolean {
  const faction = getEncyclopediaFaction(factionId);
  return faction?.sources.includes(sourceId) || false;
}
