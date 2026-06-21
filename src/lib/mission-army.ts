/**
 * Mission army auto-fill.
 *
 * Builds the army units for the player's faction from a mission's `participants`,
 * so selecting a scenario mission pre-fills the army with the forces that fight
 * in it (skipping manual budget/build). Mortars are included because they are
 * real movable units (id `minomet`). Participants without a `unitId` (e.g. a
 * pilot) are skipped.
 */
import type { Mission, MissionParticipant } from './mission-types';
import type { FactionID, Squad, Machine, ArmyUnit } from './types';

export interface BuiltArmy {
  units: ArmyUnit[];
  totalCost: number;
}

/**
 * Build army units for one faction's side of a mission.
 * @param squads   all squads available in the selected source (any faction)
 * @param machines all machines available in the selected source (any faction)
 */
export function buildMissionArmy(
  mission: Mission,
  faction: FactionID,
  squads: Squad[],
  machines: Machine[],
): BuiltArmy {
  const participants: MissionParticipant[] = mission.participants?.[faction] ?? [];
  const units: ArmyUnit[] = [];
  let totalCost = 0;
  const stamp = Date.now();

  for (const p of participants) {
    if (!p.unitId) continue;
    const count = Math.max(1, p.count ?? 1);
    const squad = squads.find((s) => s.id === p.unitId);
    const machine = !squad ? machines.find((m) => m.id === p.unitId) : undefined;
    if (!squad && !machine) continue;

    for (let i = 0; i < count; i++) {
      if (squad) {
        const instanceNumber = units.filter((u) => u.data.id === squad.id).length + 1;
        units.push({
          instanceId: `${squad.id}_${stamp}_${i}`,
          type: 'squad',
          data: squad,
          instanceNumber,
          currentDurability: undefined,
          currentAmmo: undefined,
          deadSoldiers: [],
          actionsUsed: Array(squad.soldiers.length).fill({
            moved: false,
            shot: false,
            melee: false,
            done: false,
          }),
        });
        totalCost += squad.cost;
      } else if (machine) {
        const instanceNumber = units.filter((u) => u.data.id === machine.id).length + 1;
        const weaponIndices = machine.weapons.map((_, idx) => idx);
        const weaponAmmo = machine.weapons.map((w) => w.ammo ?? machine.ammo_max);
        units.push({
          instanceId: `${machine.id}_${stamp}_${i}`,
          type: 'machine',
          data: machine,
          instanceNumber,
          currentDurability: machine.durability_max,
          currentAmmo: machine.ammo_max,
          weaponAmmo,
          deadSoldiers: undefined,
          actionsUsed: [{ moved: false, shot: false, melee: false, done: false }],
          machineShotsUsed: 0,
          machineWeaponShots: {},
          selectedWeaponIndices: weaponIndices,
        });
        totalCost += machine.cost;
      }
    }
  }

  return { units, totalCost };
}
