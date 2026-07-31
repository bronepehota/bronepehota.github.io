import { SourceID, SourceData, ArmyListSource, Faction, Squad, Machine } from './types';
import starSystemFactions from '@/data/sources/star_system/factions.json';
import starSystemPolarisSquads from '@/data/sources/star_system/polaris/squads.json';
import starSystemPolarisMachines from '@/data/sources/star_system/polaris/machines.json';
import starSystemProtectorateSquads from '@/data/sources/star_system/protectorate/squads.json';
import starSystemProtectorateMachines from '@/data/sources/star_system/protectorate/machines.json';
import starSystemMercenariesSquads from '@/data/sources/star_system/mercenaries/squads.json';
import starSystemMercenariesMachines from '@/data/sources/star_system/mercenaries/machines.json';
import starSystemRuteniaSquads from '@/data/sources/star_system/rutenia/squads.json';
import starSystemRuteniaMachines from '@/data/sources/star_system/rutenia/machines.json';
import starSystemDeadFleetSquads from '@/data/sources/star_system/dead_fleet/squads.json';
import starSystemDeadFleetMachines from '@/data/sources/star_system/dead_fleet/machines.json';
import tehnologFactions from '@/data/sources/tehnolog/factions.json';
import tehnologPolarisSquads from '@/data/sources/tehnolog/polaris/squads.json';
import tehnologPolarisMachines from '@/data/sources/tehnolog/polaris/machines.json';
import tehnologProtectorateSquads from '@/data/sources/tehnolog/protectorate/squads.json';
import tehnologProtectorateMachines from '@/data/sources/tehnolog/protectorate/machines.json';
import tehnologMercenariesSquads from '@/data/sources/tehnolog/mercenaries/squads.json';
import tehnologMercenariesMachines from '@/data/sources/tehnolog/mercenaries/machines.json';
import tehnolog2026Factions from '@/data/sources/tehnolog_2026/factions.json';
import { getCustomSourcesStorage } from './editor/storage';
import { getCustomSourceData } from './editor/converters';

// Type assertions
const typedStarSystemFactions = starSystemFactions as Faction[];
const typedStarSystemSquads = [
  ...starSystemPolarisSquads,
  ...starSystemProtectorateSquads,
  ...starSystemMercenariesSquads,
  ...starSystemRuteniaSquads,
  ...starSystemDeadFleetSquads
] as Squad[];
const typedStarSystemMachines = [
  ...starSystemPolarisMachines,
  ...starSystemProtectorateMachines,
  ...starSystemMercenariesMachines,
  ...starSystemRuteniaMachines,
  ...starSystemDeadFleetMachines
] as Machine[];
const typedTehnologFactions = tehnologFactions as Faction[];
const typedTehnologSquads = [
  ...tehnologPolarisSquads,
  ...tehnologProtectorateSquads,
  ...tehnologMercenariesSquads
] as Squad[];
const typedTehnologMachines = [
  ...tehnologPolarisMachines,
  ...tehnologProtectorateMachines,
  ...tehnologMercenariesMachines
] as Machine[];
const typedTehnolog2026Factions = tehnolog2026Factions as Faction[];

// Star System source metadata
const starSystemSource: ArmyListSource = {
  id: 'star_system',
  name: 'Star System',
  description: 'Армейские листы от сообщества Star System',
  link: 'https://vk.com/bp_bnp',
  version: '1.0'
};

// Tehnolog source metadata
const tehnologSource: ArmyListSource = {
  id: 'tehnolog',
  name: 'Технолог Классик',
  description: 'Официальные армейские листы от компании Технолог',
  link: 'https://vk.com/album-122813310_260326962',
  version: '1.0'
};

// Sources registry
export const sourcesRegistry: Record<SourceID, SourceData> = {
  star_system: {
    source: starSystemSource,
    factions: typedStarSystemFactions,
    squads: typedStarSystemSquads,
    machines: typedStarSystemMachines
  },
  tehnolog: {
    source: tehnologSource,
    factions: typedTehnologFactions,
    squads: typedTehnologSquads,
    machines: typedTehnologMachines
  },
  tehnolog_2026: {
    source: {
      id: 'tehnolog_2026',
      name: 'Технолог 2026',
      description: 'Новые армейские листы 2026 — требуется помощь сообщества по наполнению данных',
      link: 'https://vk.com/album-66793422_309816315',
      version: '0.1'
    },
    factions: typedTehnolog2026Factions,
    squads: [],
    machines: []
  }
};

// Get default source
export function getDefaultSource(): SourceID {
  return 'star_system';
}

// Get source by ID with fallback
export function getSource(id: SourceID): SourceData | null {
  const source = sourcesRegistry[id];

  if (!source) {
    console.warn(`Source ${id} not found, falling back to default`);
    return sourcesRegistry[getDefaultSource()] || null;
  }

  // Structure validation
  if (!source.factions || !Array.isArray(source.factions)) {
    console.error(`Invalid source data for ${id}`);
    return sourcesRegistry[getDefaultSource()] || null;
  }

  return source;
}

// Get all available sources
export function getAllSources(): ArmyListSource[] {
  return Object.values(sourcesRegistry).map(s => s.source);
}

// Validate if a string is a valid source ID
export function isValidSource(id: string): boolean {
  return Object.keys(sourcesRegistry).includes(id);
}

/**
 * Validate if a string is a valid source ID, including custom sources
 * Checks both built-in sources and custom sources from localStorage
 */
export function isValidSourceWithCustom(id: string): boolean {
  // Check built-in sources
  if (Object.keys(sourcesRegistry).includes(id)) {
    return true;
  }

  // Check custom sources (must start with 'custom_' prefix)
  if (id.startsWith('custom_')) {
    const storage = getCustomSourcesStorage();
    return storage.getById(id) !== null;
  }

  return false;
}

/**
 * Check if a source ID is a custom source
 */
export function isCustomSource(id: string): boolean {
  return id.startsWith('custom_');
}

/**
 * Get source by ID, including custom sources
 * Custom sources are loaded from localStorage and merged with base sources if needed
 */
export function getSourceWithCustom(id: SourceID): SourceData | null {
  // Check built-in sources first
  if (sourcesRegistry[id]) {
    return sourcesRegistry[id];
  }

  // Check custom sources
  if (isCustomSource(id)) {
    const storage = getCustomSourcesStorage();
    const customSource = storage.getById(id);

    if (customSource) {
      return getCustomSourceData(customSource, (baseId) => {
        // Recursively get base source (can be built-in or another custom)
        return getSourceWithCustom(baseId);
      });
    }
  }

  // Fallback to default
  console.warn(`Source ${id} not found, falling back to default`);
  return sourcesRegistry[getDefaultSource()] || null;
}

/**
 * Get all available sources, including custom sources from localStorage
 */
export function getAllSourcesWithCustom(): ArmyListSource[] {
  const builtIn = getAllSources();

  // Load custom sources from storage
  const storage = getCustomSourcesStorage();
  const customSources = storage.getAll();

  const custom: ArmyListSource[] = customSources.map(cs => ({
    id: cs.id,
    name: cs.name,
    description: cs.description,
    version: cs.version,
  }));

  return [...builtIn, ...custom];
}

/**
 * Read a unit's cost directly from its source army list — the single source of
 * truth for cost (the inline `cost` on the squad/machine record). Returns
 * undefined if the unit isn't in the given source. Used by the encyclopedia so
 * cost is never duplicated between the source JSON and encyclopedia lore JSON.
 */
export function getSourceUnitCost(sourceId: SourceID, unitId: string): number | undefined {
  // Strict lookup — never fall back to the default source (cost is source-specific;
  // a missing/invalid source or a unit not in it must return undefined).
  if (!isValidSourceWithCustom(sourceId)) return undefined;
  const source = getSourceWithCustom(sourceId);
  if (!source) return undefined;
  const unit = [...source.squads, ...source.machines].find((u) => u.id === unitId);
  return unit?.cost;
}
