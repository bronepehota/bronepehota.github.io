import { SourceID, SourceData, ArmyListSource, Faction, Squad, Machine } from './types';
import starSystemFactions from '@/data/sources/star_system/factions.json';
import starSystemPolarisSquads from '@/data/sources/star_system/polaris/squads.json';
import starSystemPolarisMachines from '@/data/sources/star_system/polaris/machines.json';
import starSystemProtectorateSquads from '@/data/sources/star_system/protectorate/squads.json';
import starSystemProtectorateMachines from '@/data/sources/star_system/protectorate/machines.json';
import starSystemMercenariesSquads from '@/data/sources/star_system/mercenaries/squads.json';
import starSystemMercenariesMachines from '@/data/sources/star_system/mercenaries/machines.json';
import tehnologFactions from '@/data/sources/tehnolog/factions.json';

// Type assertions
const typedStarSystemFactions = starSystemFactions as Faction[];
const typedStarSystemSquads = [
  ...starSystemPolarisSquads,
  ...starSystemProtectorateSquads,
  ...starSystemMercenariesSquads
] as Squad[];
const typedStarSystemMachines = [
  ...starSystemPolarisMachines,
  ...starSystemProtectorateMachines,
  ...starSystemMercenariesMachines
] as Machine[];
const typedTehnologFactions = tehnologFactions as Faction[];

// Star System source metadata
const starSystemSource: ArmyListSource = {
  id: 'star_system',
  name: 'Star System',
  description: 'Армейские листы от сообщества Star System',
  link: 'https://vk.com/star_system',
  version: '1.0'
};

// Tehnolog source metadata
const tehnologSource: ArmyListSource = {
  id: 'tehnolog',
  name: 'Технолог',
  description: 'Официальные армейские листы от компании Технолог',
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
