import { Army, ArmyUnit } from '../lib/types';

describe('Army State', () => {
  describe('Army Creation', () => {
    test('should create default army', () => {
      const army: Army = {
        name: 'Моя Армия',
        faction: 'polaris',
        units: [],
        totalCost: 0,
        currentStep: 'faction-select',
        isInBattle: false,
        currentTurn: 1
      };

      expect(army.name).toBe('Моя Армия');
      expect(army.faction).toBe('polaris');
      expect(army.units).toEqual([]);
      expect(army.totalCost).toBe(0);
      expect(army.isInBattle).toBe(false);
      expect(army.currentTurn).toBe(1);
    });

    test('should handle different factions', () => {
      const factions: Array<'polaris' | 'protectorate' | 'mercenaries'> = ['polaris', 'protectorate', 'mercenaries'];

      factions.forEach(faction => {
        const army: Army = {
          name: 'Test',
          faction,
          units: [],
          totalCost: 0,
          currentStep: 'faction-select',
          isInBattle: false,
          currentTurn: 1
        };

        expect(army.faction).toBe(faction);
      });
    });
  });

  describe('Army Units', () => {
    test('should add unit to army', () => {
      const unit: ArmyUnit = {
        instanceId: 'unit-1',
        data: {
          id: 'test',
          name: 'Test Unit',
          cost: 50,
          soldiers: [],
          image: '/test.jpg'
        },
        instanceNumber: 1,
        currentSoldiers: [1, 2, 3]
      };

      const army: Army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [],
        totalCost: 0,
        currentStep: 'unit-select',
        isInBattle: false,
        currentTurn: 1
      };

      const updated = {
        ...army,
        units: [...army.units, unit],
        totalCost: army.totalCost + unit.data.cost
      };

      expect(updated.units.length).toBe(1);
      expect(updated.totalCost).toBe(50);
    });

    test('should remove unit from army', () => {
      const unit: ArmyUnit = {
        instanceId: 'unit-1',
        data: {
          id: 'test',
          name: 'Test Unit',
          cost: 50,
          soldiers: [],
          image: '/test.jpg'
        },
        instanceNumber: 1,
        currentSoldiers: [1, 2, 3]
      };

      const army: Army = {
        name: 'Test Army',
        faction: 'polaris',
        units: [unit],
        totalCost: 50,
        currentStep: 'unit-select',
        isInBattle: false,
        currentTurn: 1
      };

      const updated = {
        ...army,
        units: army.units.filter(u => u.instanceId !== unit.instanceId),
        totalCost: army.totalCost - unit.data.cost
      };

      expect(updated.units.length).toBe(0);
      expect(updated.totalCost).toBe(0);
    });

    test('should calculate total cost correctly', () => {
      const units: ArmyUnit[] = [
        {
          instanceId: 'unit-1',
          data: { id: 'test1', name: 'Unit 1', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2]
        },
        {
          instanceId: 'unit-2',
          data: { id: 'test2', name: 'Unit 2', cost: 75, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1]
        },
        {
          instanceId: 'unit-3',
          data: { id: 'test3', name: 'Unit 3', cost: 100, soldiers: [], image: '' },
          instanceNumber: 1,
          currentSoldiers: [1, 2, 3]
        }
      ];

      const total = units.reduce((sum, unit) => sum + unit.data.cost, 0);

      expect(total).toBe(225); // 50 + 75 + 100
    });
  });

  describe('Game State', () => {
    test('should track current turn', () => {
      const army: Army = {
        name: 'Test',
        faction: 'polaris',
        units: [],
        totalCost: 0,
        currentStep: 'game',
        isInBattle: true,
        currentTurn: 5
      };

      expect(army.currentTurn).toBe(5);
      expect(army.isInBattle).toBe(true);
      expect(army.currentStep).toBe('game');
    });

    test('should handle turn increment', () => {
      const army: Army = {
        name: 'Test',
        faction: 'polaris',
        units: [],
        totalCost: 0,
        currentStep: 'game',
        isInBattle: true,
        currentTurn: 1
      };

      const nextTurn = {
        ...army,
        currentTurn: army.currentTurn + 1
      };

      expect(nextTurn.currentTurn).toBe(2);
    });
  });
});
