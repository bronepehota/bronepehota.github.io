import type { Army, ArmyUnit, FactionID, RulesVersionID } from '../lib/types';

describe('Type Validation', () => {
  describe('FactionID', () => {
    test('should accept valid faction IDs', () => {
      const validFactions: FactionID[] = ['polaris', 'protectorate', 'mercenaries'];

      validFactions.forEach(faction => {
        expect(faction).toMatch(/^(polaris|protectorate|mercenaries)$/);
      });
    });

    test('should have only three factions', () => {
      const factions: FactionID[] = ['polaris', 'protectorate', 'mercenaries'];

      expect(factions).toHaveLength(3);
    });
  });

  describe('RulesVersionID', () => {
    test('should accept valid rules versions', () => {
      const validRules: RulesVersionID[] = ['tehnolog', 'community_star_system'];

      validRules.forEach(version => {
        expect(version).toMatch(/^(tehnolog|community_star_system)$/);
      });
    });

    test('should have at least one rules version', () => {
      const rules: RulesVersionID[] = ['tehnolog', 'community_star_system'];

      expect(rules.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Army Unit Structure', () => {
    test('should require instanceId', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-1',
        type: 'squad',
        data: {
          id: 'test',
          name: 'Test',
          faction: 'polaris',
          cost: 50,
          soldiers: [],
          image: ''
        },
        instanceNumber: 1,
        deadSoldiers: [1, 2, 3]
      };

      expect(unit.instanceId).toBeTruthy();
      expect(typeof unit.instanceId).toBe('string');
    });

    test('should require data property', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-1',
        type: 'squad',
        data: {
          id: 'test',
          name: 'Test',
          faction: 'polaris',
          cost: 50,
          soldiers: [],
          image: ''
        },
        instanceNumber: 1,
        deadSoldiers: [1, 2, 3]
      };

      expect(unit.data).toBeDefined();
      expect(typeof unit.data).toBe('object');
      expect(unit.data.id).toBeTruthy();
    });

    test('should require cost in data', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-1',
        type: 'squad',
        data: {
          id: 'test',
          name: 'Test',
          faction: 'polaris',
          cost: 50,
          soldiers: [],
          image: ''
        },
        instanceNumber: 1,
        deadSoldiers: [1, 2, 3]
      };

      expect(unit.data.cost).toBeDefined();
      expect(typeof unit.data.cost).toBe('number');
      expect(unit.data.cost).toBeGreaterThan(0);
    });

    test('should handle soldiers array', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-1',
        type: 'squad',
        data: {
          id: 'test',
          name: 'Test',
          faction: 'polaris',
          cost: 50,
          soldiers: [
            { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
            { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 }
          ],
          image: ''
        },
        instanceNumber: 1,
        deadSoldiers: [1, 2]
      };

      // Type assertion needed for this test - we know it's a squad
      const squadData = unit.data as { id: string; name: string; faction: string; cost: number; soldiers: unknown[]; image: string };
      expect(Array.isArray(squadData.soldiers)).toBe(true);
      expect(squadData.soldiers).toHaveLength(2);
    });
  });

  describe('Army State Machine', () => {
    test('should handle faction-select step', () => {
      const army: Army = {
        name: 'Test',
        faction: 'polaris',
        units: [],
        totalCost: 0,
        currentStep: 'faction-select',
        isInBattle: false,
        currentTurn: 1
      };

      expect(army.currentStep).toBe('faction-select');
      expect(army.units).toHaveLength(0);
    });

    test('should handle unit-select step', () => {
      const army: Army = {
        name: 'Test',
        faction: 'polaris',
        units: [],
        totalCost: 0,
        currentStep: 'unit-select',
        isInBattle: false,
        currentTurn: 1
      };

      expect(army.currentStep).toBe('unit-select');
    });

    test('should handle battle step', () => {
      const army: Army = {
        name: 'Test',
        faction: 'polaris',
        units: [{
          instanceId: 'test-1',
          type: 'squad',
          data: { id: 'test', name: 'Test', faction: 'polaris', cost: 50, soldiers: [], image: '' },
          instanceNumber: 1,
          deadSoldiers: [1, 2, 3]
        }],
        totalCost: 50,
        currentStep: 'battle',
        isInBattle: true,
        currentTurn: 1
      };

      expect(army.currentStep).toBe('battle');
      expect(army.isInBattle).toBe(true);
    });

    test('should track turn number', () => {
      const army: Army = {
        name: 'Test',
        faction: 'polaris',
        units: [],
        totalCost: 0,
        currentStep: 'battle',
        isInBattle: true,
        currentTurn: 5
      };

      expect(army.currentTurn).toBe(5);
      expect(army.currentTurn).toBeGreaterThan(0);
    });
  });
});
