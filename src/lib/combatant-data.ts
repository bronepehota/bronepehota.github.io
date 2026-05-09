// src/lib/combatant-data.ts

import type { Weapon } from './types';

/**
 * Minimal data needed to perform combat calculations.
 * In the game, this is derived from ArmyUnit. In the calculator, entered manually.
 */
export interface CombatantData {
  type: 'squad' | 'machine';
  range?: string;          // "D6", "2D12+1" — undefined triggers Dice Input Popup
  power?: string;          // "1D20", "2D6" — undefined triggers Dice Input Popup
  melee: number;           // 0-10
  armor: number;           // 0-10
  rank: number;            // for grenade distance calculation
  weapons?: Weapon[];      // for machines (weapon selection)
  grenadesAvailable: boolean;
}

/**
 * Build a fake ArmyUnit-like object from CombatantData for use with useCombatFlow.
 * useCombatFlow reads unit.data.soldiers[i] and unit.data.weapons[i] — we mimic that shape.
 */
export function combatantToUnitLike(data: CombatantData) {
  if (data.type === 'squad') {
    return {
      instanceId: 'calculator',
      type: 'squad' as const,
      data: {
        name: 'Калькулятор',
        soldiers: [
          {
            rank: data.rank,
            range: data.range || 'D6',
            power: data.power || '1D6',
            melee: data.melee,
            armor: data.armor,
            speed: 0,
            modifiers: [],
          },
        ],
      },
      grenadesUsed: !data.grenadesAvailable,
    };
  }

  return {
    instanceId: 'calculator',
    type: 'machine' as const,
    data: {
      name: 'Калькулятор',
      weapons: data.weapons || [{ name: 'Оружие', range: data.range || 'D6', power: data.power || '1D6' }],
    },
    currentDurability: 10,
    pilotInfo: undefined,
  };
}

/**
 * Check if required combat data is filled for a given action type.
 */
export function isCombatReady(data: CombatantData, actionType: 'shot' | 'melee' | 'grenade'): boolean {
  if (actionType === 'melee') {
    return data.melee >= 0;
  }
  // shot and grenade need range + power
  return Boolean(data.range && data.power);
}

/**
 * Fields missing for a given action type.
 */
export function missingFields(data: CombatantData, actionType: 'shot' | 'melee' | 'grenade'): Array<'range' | 'power' | 'melee' | 'rank'> {
  const missing: Array<'range' | 'power' | 'melee' | 'rank'> = [];
  if (actionType !== 'melee') {
    if (!data.range) missing.push('range');
    if (!data.power) missing.push('power');
  }
  if (actionType === 'grenade' && data.rank <= 0) {
    missing.push('rank');
  }
  return missing;
}