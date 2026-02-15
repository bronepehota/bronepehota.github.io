import { Squad, Machine, FactionID } from './types';

export type UnitWithType = (Squad | Machine) & { type: 'squad' | 'machine' };

export interface FilterOptions {
  faction?: FactionID;
  type?: 'squad' | 'machine';
  class?: string;
  search?: string;
}

async function loadSquads(faction: string): Promise<Squad[]> {
  const data = await import(`@/data/${faction}/squads.json`);
  return data.default;
}

async function loadMachines(faction: string): Promise<Machine[]> {
  const data = await import(`@/data/${faction}/machines.json`);
  return data.default;
}

export async function getAllUnits(): Promise<UnitWithType[]> {
  const factions: FactionID[] = ['polaris', 'protectorate', 'mercenaries'];
  const units: UnitWithType[] = [];

  for (const faction of factions) {
    const squads = await loadSquads(faction);
    const machines = await loadMachines(faction);

    units.push(
      ...squads.map(s => ({ ...s, type: 'squad' as const })),
      ...machines.map(m => ({ ...m, type: 'machine' as const }))
    );
  }

  return units;
}

export async function getUnitById(id: string): Promise<UnitWithType | null> {
  const units = await getAllUnits();
  return units.find(u => u.id === id) || null;
}

export function filterUnits(units: UnitWithType[], options: FilterOptions): UnitWithType[] {
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
