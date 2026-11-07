import { Army, ArmyUnit, Machine, Squad } from '../lib/types';
import {
  countByUnitType,
  getNextInstanceNumber,
  assignInstanceNumber,
  canAddUnit,
  validateAddUnit,
  formatUnitNumber,
  formatCountBadge,
  checkSquadUniformStats,
  getMachineCost,
  getMachineFireRate,
  recalculateArmyCost
} from '../lib/unit-utils';

const mockSquad: Squad = {
  id: 'test-squad',
  name: 'Test Squad',
  faction: 'polaris',
  cost: 100,
  soldiers: [
    { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
    { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 }
  ]
};

const mockArmyUnit = (instanceId: string, data: Squad): ArmyUnit => ({
  instanceId,
  type: 'squad',
  data,
  instanceNumber: 1
});

describe('Unit Utilities', () => {
  describe('Assign Unit Numbers', () => {
    it('should assign sequential numbers to multiple units', () => {
      const units: ArmyUnit[] = [
        {
          instanceId: 'unit-1',
          type: 'squad',
          data: {
            id: 'test-1',
            name: 'Unit 1',
            faction: 'polaris',
            cost: 50,
            soldiers: [],
            image: ''
          },
          instanceNumber: 1
        },
        {
          instanceId: 'unit-2',
          type: 'squad',
          data: {
            id: 'test-2',
            name: 'Unit 2',
            faction: 'polaris',
            cost: 75,
            soldiers: [],
            image: ''
          },
          instanceNumber: 2
        },
        {
          instanceId: 'unit-3',
          type: 'squad',
          data: {
            id: 'test-3',
            name: 'Unit 3',
            faction: 'polaris',
            cost: 100,
            soldiers: [],
            image: ''
          },
          instanceNumber: 3
        }
      ];

      const result = units.map(u => u.instanceNumber);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('Filter Units by Type', () => {
    it('should separate squads and machines', () => {
      const units: ArmyUnit[] = [
        {
          instanceId: 'squad-1',
          type: 'squad',
          data: {
            id: 'squad-1',
            name: 'Squad Unit',
            faction: 'polaris',
            cost: 50,
            soldiers: [],
            image: ''
          },
          instanceNumber: 1
        },
        {
          instanceId: 'machine-1',
          type: 'machine',
          data: {
            id: 'machine-1',
            name: 'Machine Unit',
            faction: 'polaris',
            cost: 150,
            rank: 2,
            fire_rate: 1,
            ammo_max: 20,
            durability_max: 16,
            speed_sectors: [
              { min_durability: 1, max_durability: 16, speed: 2 }
            ],
            weapons: []
          },
          instanceNumber: 1
        }
      ];

      const squads = units.filter(u => u.type === 'squad');
      const machines = units.filter(u => u.type === 'machine');

      expect(squads).toHaveLength(1);
      expect(machines).toHaveLength(1);
    });
  });

  describe('countByUnitType', () => {
    it('should count units by their template ID', () => {
      const units: ArmyUnit[] = [
        mockArmyUnit('u1', mockSquad),
        mockArmyUnit('u2', mockSquad),
        mockArmyUnit('u3', { ...mockSquad, id: 'different-squad' })
      ];

      const counts = countByUnitType(units);
      expect(counts['test-squad']).toBe(2);
      expect(counts['different-squad']).toBe(1);
    });

    it('should return empty object for empty array', () => {
      expect(countByUnitType([])).toEqual({});
    });
  });

  describe('getNextInstanceNumber', () => {
    it('should return 1 for new unit type', () => {
      const army: Army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [],
        totalCost: 0
      };

      expect(getNextInstanceNumber(army, 'test-squad')).toBe(1);
    });

    it('should return next number for existing unit type', () => {
      const army: Army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [
          mockArmyUnit('u1', mockSquad),
          mockArmyUnit('u2', mockSquad)
        ],
        totalCost: 200
      };

      expect(getNextInstanceNumber(army, 'test-squad')).toBe(3);
    });
  });

  describe('assignInstanceNumber', () => {
    it('should assign instance number to unit', () => {
      const unit = mockArmyUnit('u1', mockSquad);
      const updated = assignInstanceNumber(unit, 5);

      expect(updated.instanceNumber).toBe(5);
      expect(updated.instanceId).toBe('u1'); // Other properties unchanged
    });
  });

  describe('canAddUnit', () => {
    it('should return true when under 99 units', () => {
      const army: Army = {
        name: 'Test Army',
        faction: 'polaris',
        units: Array(98).fill(null).map((_, i) => mockArmyUnit(`u${i}`, mockSquad)),
        totalCost: 9800
      };

      expect(canAddUnit(army, 'test-squad')).toBe(true);
    });

    it('should return false when at 99 units', () => {
      const army: Army = {
        name: 'Test Army',
        faction: 'polaris',
        units: Array(99).fill(null).map((_, i) => mockArmyUnit(`u${i}`, mockSquad)),
        totalCost: 9900
      };

      expect(canAddUnit(army, 'test-squad')).toBe(false);
    });
  });

  describe('validateAddUnit', () => {
    it('should return valid when under limit', () => {
      const army: Army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [],
        totalCost: 0
      };

      expect(validateAddUnit(army, 'test-squad')).toEqual({ valid: true });
    });

    it('should return error when at limit', () => {
      const army: Army = {
        name: 'Test Army',
        faction: 'polaris',
        units: Array(99).fill(null).map((_, i) => mockArmyUnit(`u${i}`, mockSquad)),
        totalCost: 9900
      };

      const result = validateAddUnit(army, 'test-squad');
      expect(result.valid).toBe(false);
      if (result.valid === false) {
        expect(result.error).toBe('Максимум 99 юнитов этого типа');
      }
    });
  });

  describe('formatUnitNumber', () => {
    it('should format instance number', () => {
      const unit = mockArmyUnit('u1', mockSquad);
      expect(formatUnitNumber(unit)).toBe('#1');
    });

    it('should use fallback when no instance number', () => {
      const unit = { ...mockArmyUnit('u1', mockSquad), instanceNumber: undefined };
      expect(formatUnitNumber(unit, 4)).toBe('#5');
    });

    it('should return empty string when no number available', () => {
      const unit = { ...mockArmyUnit('u1', mockSquad), instanceNumber: undefined };
      expect(formatUnitNumber(unit)).toBe('');
    });
  });

  describe('formatCountBadge', () => {
    it('should return null for zero count', () => {
      expect(formatCountBadge(0)).toBeNull();
    });

    it('should return string for positive count', () => {
      expect(formatCountBadge(1)).toBe('1');
      expect(formatCountBadge(99)).toBe('99');
    });
  });

  describe('checkSquadUniformStats', () => {
    const makeUnit = (soldiers: Partial<{ armor: number; speed: number }>[], deadSoldiers?: number[]): ArmyUnit => ({
      instanceId: 'test-unit',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 50,
        soldiers: soldiers.map(s => ({
          rank: 2, range: 'D6', power: '1D6', melee: 0,
          armor: s.armor ?? 2,
          speed: s.speed ?? 5,
        })),
      },
      deadSoldiers: deadSoldiers,
      instanceNumber: 1,
    });

    it('should return false for non-squad unit', () => {
      const machine = { instanceId: 'm1', type: 'machine', data: { id: 'm1' } } as ArmyUnit;
      expect(checkSquadUniformStats(machine)).toEqual({ isUniformArmor: false, isUniformSpeed: false });
    });

    it('should return false for single alive soldier', () => {
      const unit = makeUnit([{ armor: 2, speed: 5 }]);
      expect(checkSquadUniformStats(unit)).toEqual({ isUniformArmor: false, isUniformSpeed: false });
    });

    it('should return true when all soldiers share same armor and speed', () => {
      const unit = makeUnit([{ armor: 2, speed: 5 }, { armor: 2, speed: 5 }, { armor: 2, speed: 5 }]);
      expect(checkSquadUniformStats(unit)).toEqual({
        isUniformArmor: true, isUniformSpeed: true, commonArmor: 2, commonSpeed: 5
      });
    });

    it('should return false for armor when soldiers have different armor', () => {
      const unit = makeUnit([{ armor: 2, speed: 5 }, { armor: 3, speed: 5 }]);
      const result = checkSquadUniformStats(unit);
      expect(result.isUniformArmor).toBe(false);
      expect(result.isUniformSpeed).toBe(true);
      expect(result.commonSpeed).toBe(5);
      expect(result.commonArmor).toBeUndefined();
    });

    it('should return false for speed when soldiers have different speed', () => {
      const unit = makeUnit([{ armor: 2, speed: 5 }, { armor: 2, speed: 4 }]);
      const result = checkSquadUniformStats(unit);
      expect(result.isUniformArmor).toBe(true);
      expect(result.isUniformSpeed).toBe(false);
      expect(result.commonArmor).toBe(2);
      expect(result.commonSpeed).toBeUndefined();
    });

    it('should exclude dead soldiers from comparison', () => {
      const unit = makeUnit(
        [{ armor: 2, speed: 5 }, { armor: 3, speed: 4 }, { armor: 2, speed: 5 }],
        [1] // soldier 1 is dead
      );
      expect(checkSquadUniformStats(unit)).toEqual({
        isUniformArmor: true, isUniformSpeed: true, commonArmor: 2, commonSpeed: 5
      });
    });

    it('should return false when all soldiers are dead', () => {
      const unit = makeUnit([{ armor: 2, speed: 5 }, { armor: 2, speed: 5 }], [0, 1]);
      expect(checkSquadUniformStats(unit)).toEqual({ isUniformArmor: false, isUniformSpeed: false });
    });

    it('should return false when only one soldier alive (others dead)', () => {
      const unit = makeUnit([{ armor: 2, speed: 5 }, { armor: 2, speed: 5 }], [1]);
      expect(checkSquadUniformStats(unit)).toEqual({ isUniformArmor: false, isUniformSpeed: false });
    });
  });
});

describe('Machine cost — Star System beta discount (-30%)', () => {
  const makeMachine = (cost: number): Machine => ({
    id: 'test-machine',
    name: 'Test Machine',
    faction: 'polaris',
    cost,
    rank: 3,
    fire_rate: 1,
    ammo_max: 10,
    durability_max: 4,
    speed_sectors: [],
    weapons: [],
  });

  describe('getMachineCost', () => {
    it('discounts only the chassis, weapons stay full price (monoblok split)', () => {
      // Хеликс: 220 = орудия 26 + шасси 194; итог ceil10(26 + 194×0.7 = 161.8) = 170
      expect(getMachineCost(220, true, 26)).toBe(170);
      // Демолишер: 400 = орудия 180 + шасси 220; итог ceil10(180 + 154 = 334) = 340
      expect(getMachineCost(400, true, 180)).toBe(340);
    });

    it('rounds the final price UP to a multiple of 10', () => {
      // Гриффин: 305 = орудия 111 + шасси 194; ceil10(111 + 135.8 = 246.8) = 250
      expect(getMachineCost(305, true, 111)).toBe(250);
    });

    it('falls back to whole-cost discount without the split (custom machines)', () => {
      expect(getMachineCost(220, true, undefined)).toBe(160); // ceil10(154)
      expect(getMachineCost(95, true, undefined)).toBe(70);   // ceil10(66.5)
      expect(getMachineCost(100, true, undefined)).toBe(70);  // ceil10(70)
    });

    it('guards against bad split data (weaponsCost >= cost)', () => {
      expect(getMachineCost(220, true, 220)).toBe(160);
      expect(getMachineCost(220, true, 300)).toBe(160);
      expect(getMachineCost(220, true, 0)).toBe(160);
    });

    it('returns cost unchanged when discount is inactive', () => {
      expect(getMachineCost(95, false)).toBe(95);
      expect(getMachineCost(220, false, 26)).toBe(220);
    });
  });

  describe('recalculateArmyCost', () => {
    it('discounts only machines, squads stay full price', () => {
      const squadUnit: ArmyUnit = { instanceId: 's1', type: 'squad', data: mockSquad, instanceNumber: 1 };
      const machineUnit: ArmyUnit = { instanceId: 'm1', type: 'machine', data: makeMachine(100), instanceNumber: 1 };

      expect(recalculateArmyCost([squadUnit, machineUnit], { machineDiscountActive: true })).toBe(170);
    });

    it('uses the weapons/chassis split when the machine has it', () => {
      const machineUnit: ArmyUnit = { instanceId: 'm1', type: 'machine', data: { ...makeMachine(220), weaponsCost: 26 }, instanceNumber: 1 };
      expect(recalculateArmyCost([machineUnit], { machineDiscountActive: true })).toBe(170);
    });

    it('sums full prices when discount inactive', () => {
      const squadUnit: ArmyUnit = { instanceId: 's1', type: 'squad', data: mockSquad, instanceNumber: 1 };
      const machineUnit: ArmyUnit = { instanceId: 'm1', type: 'machine', data: makeMachine(100), instanceNumber: 1 };

      expect(recalculateArmyCost([squadUnit, machineUnit], { machineDiscountActive: false })).toBe(200);
    });

    it('handles empty army', () => {
      expect(recalculateArmyCost([], { machineDiscountActive: true })).toBe(0);
    });
  });
});

describe('getMachineFireRate — БЕТА «лёгкие ×2 выстрела» (Star System)', () => {
  const makeM = (fire_rate: number) => ({ ...({ id: 'm', name: 'M', faction: 'polaris', cost: 200, rank: 2, fire_rate, ammo_max: 10, durability_max: 10, speed_sectors: [], weapons: [] } as Machine) });

  it('doubles fire_rate 1 → 2 when active', () => {
    expect(getMachineFireRate(makeM(1), true)).toBe(2);
  });

  it('leaves machines with 2+ shots unchanged', () => {
    expect(getMachineFireRate(makeM(2), true)).toBe(2);
    expect(getMachineFireRate(makeM(3), true)).toBe(3);
  });

  it('returns base fire_rate when inactive', () => {
    expect(getMachineFireRate(makeM(1), false)).toBe(1);
    expect(getMachineFireRate(makeM(2), false)).toBe(2);
  });
});
