import { getUnitsByType } from './encyclopedia-registry';
import { resolveMachineFromSource } from './machine-resolver';

/** A machine selectable for capture (cross-faction catalog). */
export interface CaptureCandidate {
  id: string;
  name: string;
  faction: string;
  rank: number;
  durability_max: number;
  ammo_max: number;
  image?: string;
}

/** Aggregate all machines across factions, resolving real gameplay stats from sources. */
export function getCaptureCandidates(): CaptureCandidate[] {
  return getUnitsByType('machine').map((u: any) => {
    const real = resolveMachineFromSource(u.id);
    return {
      id: u.id,
      name: real?.name ?? u.name,
      faction: real?.faction ?? u.faction ?? 'unknown',
      rank: real?.rank ?? 0,
      durability_max: real?.durability_max ?? 0,
      ammo_max: real?.ammo_max ?? 0,
      image: real?.image ?? u.image,
    };
  });
}

/** Filter catalog by capturing soldier's rank (strict) and optionally faction. */
export function filterCaptureCatalog(
  catalog: CaptureCandidate[],
  opts: { soldierRank: number; strictRank: boolean; factionFilter?: string | null }
): CaptureCandidate[] {
  return catalog.filter((m) => {
    if (opts.strictRank && m.rank > opts.soldierRank) return false;
    if (opts.factionFilter && m.faction !== opts.factionFilter) return false;
    return true;
  });
}

/** Default opposing faction: any faction ≠ the player's. */
export function opposingFaction(armyFaction: string, allFactions: string[]): string {
  const other = allFactions.find((f) => f !== armyFaction);
  return other ?? armyFaction;
}
