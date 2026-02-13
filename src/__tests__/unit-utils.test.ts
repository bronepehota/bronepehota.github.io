import { countByUnitType, getNextInstanceNumber, assignInstanceNumber } from '../lib/unit-utils';
import type { ArmyUnit } from '../lib/types';

describe('Unit Utilities', () => {
  describe('countByUnitType', () => {
    test('should count units by their template ID', () => {
      const units: ArmyUnit[] = [
        {
          instanceId: 'unit-1',
          data: { id: 'polaris_light_assault', name: 'Light', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3]
        },
        {
          instanceId: 'unit-2',
          data: { id: 'polaris_light_assault', name: 'Light', cost: 50, soldiers: [], image: '' },
          instanceNumber: 2,
          currentSoldiers: [1, 2]
        },
        {
          instanceId: 'unit-3',
          data: { id: 'polaris_heavy_mech', name: 'Heavy', cost: 100, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1]
        }
      ];

      const counts = countByUnitType(units);

      expect(counts['polaris_light_assault']).toBe(2);
      expect(counts['polaris_heavy_mech']).toBe(1);
    });

    test('should return empty object for empty array', () => {
      const counts = countByUnitType([]);
      expect(counts).toEqual({});
    });

    test('should handle single unit', () => {
      const units: ArmyUnit[] = [
        {
          instanceId: 'unit-1',
          data: { id: 'polaris_light_assault', name: 'Light', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1]
        }
      ];

      const counts = countByUnitType(units);
      expect(counts['polaris_light_assault']).toBe(1);
    });
  });

  describe('getNextInstanceNumber', () => {
    const mockArmy = {
      name: 'Test Army',
      faction: 'polaris' as const,
      units: [
        {
          instanceId: 'unit-1',
          data: { id: 'polaris_light_assault', name: 'Light', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1]
        },
        {
          instanceId: 'unit-2',
          data: { id: 'polaris_light_assault', name: 'Light', cost: 50, soldiers: [], image: '' },
          instanceNumber: 2,
          currentSoldiers: [1]
        },
        {
          instanceId: 'unit-3',
          data: { id: 'polaris_heavy_mech', name: 'Heavy', cost: 100, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1]
        }
      ],
      totalCost: 200,
      currentStep: 'faction-select' as const,
      isInBattle: false,
      currentTurn: 1
    };

    test('should return next number for unit type with existing units', () => {
      const nextNumber = getNextInstanceNumber(mockArmy, 'polaris_light_assault');
      expect(nextNumber).toBe(3); // Already have 2 instances
    });

    test('should return 1 for new unit type', () => {
      const nextNumber = getNextInstanceNumber(mockArmy, 'polaris_new_unit');
      expect(nextNumber).toBe(1);
    });

    test('should return 2 for unit type with single existing unit', () => {
      const nextNumber = getNextInstanceNumber(mockArmy, 'polaris_heavy_mech');
      expect(nextNumber).toBe(2);
    });
  });

  describe('assignInstanceNumber', () => {
    test('should assign instance number to unit', () => {
      const unit: ArmyUnit = {
        instanceId: 'unit-1',
        data: { id: 'polaris_light_assault', name: 'Light', cost: 50, soldiers: [], image: '' },
        instanceNumber: 1,
        currentSoldiers: [1]
      };

      const updated = assignInstanceNumber(unit, 5);

      expect(updated.instanceNumber).toBe(5);
      expect(updated.data).toEqual(unit.data); // Other properties unchanged
      expect(updated.instanceId).toEqual(unit.instanceId);
    });

    test('should not mutate original unit', () => {
      const unit: ArmyUnit = {
        instanceId: 'unit-1',
        data: { id: 'polaris_light_assault', name: 'Light', cost: 50, soldiers: [], image: '' },
        instanceNumber: 1,
        currentSoldiers: [1]
      };

      const originalNumber = unit.instanceNumber;
      assignInstanceNumber(unit, 99);

      expect(unit.instanceNumber).toBe(originalNumber); // Unchanged
    });
  });
});
