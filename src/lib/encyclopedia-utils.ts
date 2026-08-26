/**
 * Encyclopedia Utilities
 *
 * Utilities for encyclopedia pages that combine game data from sources
 * with lore data from the centralized encyclopedia registry.
 */

import { Squad, Machine, FactionID } from './types';
import type { BuffDefinition } from './modifier-types';
import {
  getEncyclopediaUnit,
  getEncyclopediaFaction,
  getUnitCostForSource,
  getAllUnits as getAllEncyclopediaUnits,
  EncyclopediaUnit,
  EncyclopediaFaction,
} from './encyclopedia-registry';
import { getSource } from './sources-registry';

export type UnitWithType = (Squad | Machine) & { type: 'squad' | 'machine' };

export interface FilterOptions {
  faction?: FactionID;
  type?: 'squad' | 'machine';
  class?: string;
  search?: string;
  sourceId?: string;
}

export interface EnrichedUnit extends EncyclopediaUnit {
  // Required game data from source
  cost: number;
  // Squad-specific data
  soldiers?: Squad['soldiers'];
  // Machine-specific data
  rank?: Machine['rank'];
  fire_rate?: Machine['fire_rate'];
  ammo_max?: Machine['ammo_max'];
  durability_max?: Machine['durability_max'];
  weapons?: Machine['weapons'];
  speed_sectors?: Machine['speed_sectors'];
  buffs?: BuffDefinition[];
}

/**
 * Get all units from encyclopedia (lore data only)
 */
export async function getAllUnits(): Promise<EncyclopediaUnit[]> {
  return getAllEncyclopediaUnits();
}

/**
 * Get enriched unit with both lore and game data
 * Combines encyclopedia data with source game data
 */
export async function getEnrichedUnit(id: string, sourceId?: string): Promise<EnrichedUnit | null> {
  // Get encyclopedia unit (lore, sources, etc.)
  const encyclopediaUnit = getEncyclopediaUnit(id);
  if (!encyclopediaUnit) {
    return null;
  }

  // Determine which source to use for game data and cost
  const targetSourceId = sourceId || encyclopediaUnit.sources[0]?.id;
  // Cost is read from the source army list (single source of truth), not from
  // a duplicated field on the encyclopedia record.
  const cost = (targetSourceId && getUnitCostForSource(id, targetSourceId)) || 0;

  if (!targetSourceId) {
    return { ...encyclopediaUnit, cost } as EnrichedUnit;
  }

  // Get source data and find the unit
  const sourceData = getSource(targetSourceId);
  if (!sourceData) {
    return { ...encyclopediaUnit, cost } as EnrichedUnit;
  }

  // Find game data from source
  let gameData: Squad | Machine | undefined;
  if (encyclopediaUnit.type === 'squad') {
    gameData = sourceData.squads.find((s: Squad) => s.id === id);
  } else {
    gameData = sourceData.machines.find((m: Machine) => m.id === id);
  }

  // Merge encyclopedia data with game data, ensuring cost is included
  // Destructure to remove cost from gameData if present, use our calculated cost
  const { cost: _gameDataCost, ...gameDataWithoutCost } = gameData || ({} as Squad | Machine);
  return {
    ...encyclopediaUnit,
    cost,
    ...gameDataWithoutCost,
    // Encyclopedia is the canonical display layer — its image wins over the
    // source's (e.g. a group/hero photo) while game stats still come from source.
    image: encyclopediaUnit.image ?? gameDataWithoutCost.image,
  } as EnrichedUnit;
}

/**
 * Get unit by ID (encyclopedia data only)
 * @deprecated Use getEnrichedUnit for combined data, or getEncyclopediaUnit from registry
 */
export async function getUnitById(id: string): Promise<EncyclopediaUnit | null> {
  const unit = getEncyclopediaUnit(id);
  if (!unit) {
    return null;
  }

  // Return encyclopedia unit (legacy behavior)
  return unit;
}

/**
 * Get all factions from encyclopedia
 */
export async function getAllFactions(): Promise<EncyclopediaFaction[]> {
  const factions: EncyclopediaFaction[] = [];
  const factionIds = ['polaris', 'protectorate', 'mercenaries', 'rutenia', 'dead_fleet', 'snow_wolves'];

  for (const id of factionIds) {
    const faction = getEncyclopediaFaction(id);
    if (faction) {
      factions.push(faction);
    }
  }

  return factions;
}

/**
 * Get faction by ID
 */
export function getFactionById(id: string): EncyclopediaFaction | undefined {
  return getEncyclopediaFaction(id);
}

/**
 * Filter units based on options
 * Works with EncyclopediaUnit[] from registry
 */
export function filterUnits(units: EncyclopediaUnit[], options: FilterOptions): EncyclopediaUnit[] {
  return units.filter(unit => {
    // Faction filter
    if (options.faction && unit.faction !== options.faction) {
      return false;
    }

    // Type filter
    if (options.type && unit.type !== options.type) {
      return false;
    }

    // Class filter (from encyclopedia)
    if (options.class && unit.encyclopedia?.class !== options.class) {
      return false;
    }

    // Source filter - check if unit is available in source
    if (options.sourceId) {
      const inSource = unit.sources.some((s) => s.id === options.sourceId);
      if (!inSource) {
        return false;
      }
    }

    // Search filter (name or shortName, case insensitive)
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const nameMatch = unit.name.toLowerCase().includes(searchLower);
      const shortNameMatch = unit.shortName?.toLowerCase().includes(searchLower);
      if (!nameMatch && !shortNameMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get unique classes from units
 */
export function getUnitClasses(units: EncyclopediaUnit[]): string[] {
  const classes = new Set<string>();
  for (const unit of units) {
    if (unit.encyclopedia?.class) {
      classes.add(unit.encyclopedia.class);
    }
  }
  return Array.from(classes).sort();
}
