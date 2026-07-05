import { ArmyUnit, Squad } from './types';

export type UnitStatus = 'active' | 'done' | 'dead' | 'captured';

export function deriveUnitStatus(unit: ArmyUnit): UnitStatus {
  // #168: captured machine — de facto dead, but recaptureable
  if (unit.isCaptured) return 'captured';
  if (unit.type === 'squad') {
    const data = unit.data as Squad;
    const allDead = (unit.deadSoldiers?.length || 0) === data.soldiers.length;
    if (allDead) return 'dead';

    const allDone = data.soldiers.every((_, idx) => {
      const isDead = unit.deadSoldiers?.includes(idx);
      const isActionDone = unit.actionsUsed?.[idx]?.done;
      return isDead || isActionDone;
    });
    return allDone ? 'done' : 'active';
  } else {
    if ((unit.currentDurability || 0) === 0) return 'dead';
    if (unit.isMachineDone) return 'done';
    return 'active';
  }
}