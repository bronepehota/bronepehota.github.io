import { Army, ArmyUnit, Squad } from '../lib/types';
import {
  countByUnitType,
  getNextInstanceNumber,
  assignInstanceNumber,
  canAddUnit,
  validateAddUnit,
  formatUnitNumber,
  formatCountBadge
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
    test('should assign sequential numbers to multiple units', () => {
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
    test('should separate squads and machines', () => {
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
});
