import { getEncyclopediaUnit } from './encyclopedia-registry';
import { getSource } from './sources-registry';
import type { Machine } from './types';

/**
 * Resolve real gameplay Machine data from sources via the encyclopedia's source list.
 * The encyclopedia JSON carries only lore (no gameplay stats); the source JSON has
 * rank/fire_rate/weapons/speed_sectors/durability_max/ammo_max. Used by #168 capture
 * (catalog + UnitCard's handleCaptureConfirm) — single source of truth.
 */
export function resolveMachineFromSource(machineId: string): Machine | null {
  const enc = getEncyclopediaUnit(machineId);
  const sourceIds = enc?.sources?.map((s: any) => s.id) ?? [];
  for (const sourceId of sourceIds) {
    const sourceData = getSource(sourceId);
    const found = sourceData?.machines.find((m: any) => m.id === machineId);
    if (found) return found as Machine;
  }
  return null;
}
