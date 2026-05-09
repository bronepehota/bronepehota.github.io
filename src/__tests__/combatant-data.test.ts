import { combatantToUnitLike, isCombatReady, missingFields } from '@/lib/combatant-data';
import type { CombatantData } from '@/lib/combatant-data';

describe('combatant-data', () => {
  const baseCombatant: CombatantData = {
    type: 'squad',
    range: 'D6',
    power: '1D6',
    melee: 3,
    armor: 2,
    rank: 5,
    grenadesAvailable: true,
  };

  describe('combatantToUnitLike', () => {
    it('creates squad-like object with soldier data', () => {
      const result = combatantToUnitLike(baseCombatant);

      expect(result.instanceId).toBe('calculator');
      expect(result.type).toBe('squad');
      expect(result.data.name).toBe('Калькулятор');
      expect(result.data.soldiers!).toHaveLength(1);
      expect(result.data.soldiers![0]).toEqual({
        rank: 5,
        range: 'D6',
        power: '1D6',
        melee: 3,
        armor: 2,
        speed: 0,
        modifiers: [],
      });
      expect(result.grenadesUsed).toBe(false);
    });

    it('defaults range/power to D6/1D6 when undefined', () => {
      const data: CombatantData = { ...baseCombatant, range: undefined, power: undefined };
      const result = combatantToUnitLike(data);

      expect(result.data.soldiers![0].range).toBe('D6');
      expect(result.data.soldiers![0].power).toBe('1D6');
    });

    it('sets grenadesUsed=true when grenadesAvailable=false', () => {
      const data: CombatantData = { ...baseCombatant, grenadesAvailable: false };
      const result = combatantToUnitLike(data);

      expect(result.grenadesUsed).toBe(true);
    });

    it('creates machine-like object with weapon data', () => {
      const machineData: CombatantData = {
        type: 'machine',
        range: 'D12',
        power: '2D20',
        melee: 0,
        armor: 8,
        rank: 0,
        grenadesAvailable: false,
      };
      const result = combatantToUnitLike(machineData);

      expect(result.instanceId).toBe('calculator');
      expect(result.type).toBe('machine');
      expect(result.data.weapons!).toHaveLength(1);
      expect(result.data.weapons![0].range).toBe('D12');
      expect(result.data.weapons![0].power).toBe('2D20');
      expect(result.currentDurability).toBe(10);
      expect(result.pilotInfo).toBeUndefined();
    });

    it('creates machine with custom weapons array', () => {
      const machineData: CombatantData = {
        type: 'machine',
        range: 'D12',
        power: '2D20',
        melee: 0,
        armor: 8,
        rank: 0,
        grenadesAvailable: false,
        weapons: [
          { name: 'Пушка', range: 'D12', power: '2D20' },
          { name: 'Пулемёт', range: 'D6', power: '1D12' },
        ],
      };
      const result = combatantToUnitLike(machineData);

      expect(result.data.weapons!).toHaveLength(2);
      expect(result.data.weapons![0].name).toBe('Пушка');
      expect(result.data.weapons![1].name).toBe('Пулемёт');
    });
  });

  describe('isCombatReady', () => {
    it('returns true for shot when range and power are set', () => {
      expect(isCombatReady(baseCombatant, 'shot')).toBe(true);
    });

    it('returns false for shot when range is missing', () => {
      const data: CombatantData = { ...baseCombatant, range: undefined };
      expect(isCombatReady(data, 'shot')).toBe(false);
    });

    it('returns false for shot when power is missing', () => {
      const data: CombatantData = { ...baseCombatant, power: undefined };
      expect(isCombatReady(data, 'shot')).toBe(false);
    });

    it('returns false for shot when both are missing', () => {
      const data: CombatantData = { ...baseCombatant, range: undefined, power: undefined };
      expect(isCombatReady(data, 'shot')).toBe(false);
    });

    it('returns true for melee always (melee >= 0)', () => {
      expect(isCombatReady({ ...baseCombatant, melee: 0 }, 'melee')).toBe(true);
      expect(isCombatReady(baseCombatant, 'melee')).toBe(true);
    });

    it('returns true for grenade when range and power are set', () => {
      expect(isCombatReady(baseCombatant, 'grenade')).toBe(true);
    });

    it('returns false for grenade when range is missing', () => {
      const data: CombatantData = { ...baseCombatant, range: undefined };
      expect(isCombatReady(data, 'grenade')).toBe(false);
    });
  });

  describe('missingFields', () => {
    it('returns empty array for complete shot data', () => {
      expect(missingFields(baseCombatant, 'shot')).toEqual([]);
    });

    it('reports missing range for shot', () => {
      const data: CombatantData = { ...baseCombatant, range: undefined };
      expect(missingFields(data, 'shot')).toContain('range');
    });

    it('reports missing power for shot', () => {
      const data: CombatantData = { ...baseCombatant, power: undefined };
      expect(missingFields(data, 'shot')).toContain('power');
    });

    it('reports missing range and power for shot when both undefined', () => {
      const data: CombatantData = { ...baseCombatant, range: undefined, power: undefined };
      const missing = missingFields(data, 'shot');
      expect(missing).toContain('range');
      expect(missing).toContain('power');
      expect(missing).toHaveLength(2);
    });

    it('returns empty for melee regardless of range/power', () => {
      const data: CombatantData = { ...baseCombatant, range: undefined, power: undefined };
      expect(missingFields(data, 'melee')).toEqual([]);
    });

    it('reports missing rank for grenade when rank is 0', () => {
      const data: CombatantData = { ...baseCombatant, rank: 0 };
      expect(missingFields(data, 'grenade')).toContain('rank');
    });

    it('does not report rank for grenade when rank > 0', () => {
      expect(missingFields(baseCombatant, 'grenade')).toEqual([]);
    });

    it('reports all missing fields for grenade', () => {
      const data: CombatantData = { ...baseCombatant, range: undefined, power: undefined, rank: 0 };
      const missing = missingFields(data, 'grenade');
      expect(missing).toContain('range');
      expect(missing).toContain('power');
      expect(missing).toContain('rank');
    });
  });
});
