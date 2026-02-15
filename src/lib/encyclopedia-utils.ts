import { Squad, Machine, FactionID } from './types';

export type UnitWithType = (Squad | Machine) & { type: 'squad' | 'machine' };

export interface FilterOptions {
  faction?: FactionID;
  type?: 'squad' | 'machine';
  class?: string;
  search?: string;
}

// Direct imports for JSON files (works with Next.js static export)
import polarisSquads from '@/data/polaris/squads.json';
import polarisMachines from '@/data/polaris/machines.json';
import protectorateSquads from '@/data/protectorate/squads.json';
import protectorateMachines from '@/data/protectorate/machines.json';
import mercenariesSquads from '@/data/mercenaries/squads.json';
import mercenariesMachines from '@/data/mercenaries/machines.json';

const squadData: Record<FactionID, Squad[]> = {
  polaris: polarisSquads as Squad[],
  protectorate: protectorateSquads as Squad[],
  mercenaries: mercenariesSquads as Squad[],
};

const machineData: Record<FactionID, Machine[]> = {
  polaris: polarisMachines as Machine[],
  protectorate: protectorateMachines as Machine[],
  mercenaries: mercenariesMachines as Machine[],
};

export async function getAllUnits(): Promise<UnitWithType[]> {
  const factions: FactionID[] = ['polaris', 'protectorate', 'mercenaries'];
  const units: UnitWithType[] = [];

  for (const faction of factions) {
    const squads = squadData[faction];
    const machines = machineData[faction];

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
