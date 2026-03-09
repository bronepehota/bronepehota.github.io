import { useMemo, useCallback } from 'react';
import { ArmyUnit, Machine, DurabilityZone } from '@/lib/types';

export interface MachineStats {
  currentDurability: number;
  maxDurability: number;
  speed: number;
  zone: DurabilityZone;
  updateDurability: (delta: number) => void;
}

export function useMachineStats(
  unit: ArmyUnit,
  updateUnit: (updater: (unit: ArmyUnit) => ArmyUnit) => void
): MachineStats {
  // Guard: only for machines
  if (unit.type !== 'machine') {
    throw new Error('useMachineStats is for machines only');
  }

  const machine = unit.data as Machine;

  // Calculate speed based on durability sector
  const speed = useMemo(() => {
    if (!unit.currentDurability) return 0;
    const sector = machine.speed_sectors.find(
      s => unit.currentDurability! >= s.min_durability && unit.currentDurability! <= s.max_durability
    );
    return sector ? sector.speed : 0;
  }, [machine.speed_sectors, unit.currentDurability]);

  // Calculate durability zone
  const zone = useMemo(() => {
    const current = unit.currentDurability || 0;
    const max = machine.durability_max;

    // Check if custom zones are defined
    if (machine.durabilityZones && machine.durabilityZones.length > 0) {
      const zone = machine.durabilityZones.find(
        zone => current > zone.max
      ) || machine.durabilityZones[machine.durabilityZones.length - 1];
      // For green zone, use durability_max as the displayed value
      if (zone.color === 'green') {
        return { ...zone, max };
      }
      return zone;
    }

    // Default zones calculation (2/3 and 1/3)
    const greenThreshold = Math.ceil(max * 2 / 3);
    const yellowThreshold = Math.ceil(max / 3);

    if (current > greenThreshold) {
      return { max, color: 'green' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
    }
    if (current > yellowThreshold) {
      return { max: greenThreshold, color: 'yellow' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
    }
    return { max: yellowThreshold, color: 'red' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
  }, [machine.durability_max, machine.durabilityZones, unit.currentDurability]);

  // Update durability with bounds checking
  const updateDurability = useCallback((delta: number) => {
    updateUnit((u) => {
      if (u.type !== 'machine') return u;
      const max = (u.data as Machine).durability_max;
      const current = u.currentDurability || 0;
      const newVal = Math.max(0, Math.min(max, current + delta));

      if (newVal === 0) {
        return { ...u, currentDurability: 0, isMachineDone: true };
      }
      return { ...u, currentDurability: newVal };
    });
  }, [updateUnit]);

  return {
    currentDurability: unit.currentDurability || 0,
    maxDurability: machine.durability_max,
    speed,
    zone,
    updateDurability
  };
}
