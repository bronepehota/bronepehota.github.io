import { Machine, ArmyUnit } from '@/lib/types';

/**
 * Test helper to simulate the weapon filtering logic from UnitCard.tsx
 * This mirrors the getSelectedWeapons() function
 */
function getSelectedWeapons(unit: ArmyUnit): Array<{ weapon: any; originalIndex: number }> {
  if (unit.type === 'squad') return [];
  const machine = unit.data as Machine;
  if (!unit.selectedWeaponIndices) {
    // All weapons for backward compat
    return machine.weapons.map((weapon, i) => ({ weapon, originalIndex: i }));
  }
  // Return only selected weapons with their original indices
  return unit.selectedWeaponIndices.map(i => ({
    weapon: machine.weapons[i],
    originalIndex: i
  }));
}

const mockMachine: Machine = {
  id: 'test_destroyer',
  name: 'Test Destroyer',
  cost: 160,
  faction: 'polaris',
  rank: 2,
  durability_max: 16,
  ammo_max: 20,
  fire_rate: 2,
  speed_sectors: [
    { min_durability: 9, max_durability: 16, speed: 2 },
    { min_durability: 1, max_durability: 8, speed: 1 }
  ],
  weapons: [
    { name: 'Тяжелая ракета', range: 'D12', power: '4D20' },
    { name: 'Импульсное орудие', range: 'D12', power: '1D20' },
    { name: 'Четырехствольный пулемет', range: 'D20', power: '2D12' },
    { name: 'Пушка Гатлинга', range: 'D12', power: '3D20' },
    { name: 'Энергетический гарпун', range: 'D6+2', power: '6D20' },
    { name: 'Механическая пила', range: 'ББ', power: '2' }
  ]
};

describe('Machine Weapon Selection', () => {
  describe('Default Selection', () => {
    test('All weapons selected by default when selectedWeaponIndices is undefined', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-1',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(6);
      expect(selected[0].weapon.name).toBe('Тяжелая ракета');
      expect(selected[5].weapon.name).toBe('Механическая пила');
    });

    test('All weapons selected when empty array passed', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-2',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: []
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(0);
    });

    test('Specific weapons selected when indices provided', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-3',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: [0, 4]
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(2);
      expect(selected[0].weapon.name).toBe('Тяжелая ракета');
      expect(selected[0].originalIndex).toBe(0);
      expect(selected[1].weapon.name).toBe('Энергетический гарпун');
      expect(selected[1].originalIndex).toBe(4);
    });
  });

  describe('Weapon Filtering', () => {
    test('getSelectedWeapons returns all weapons when selection undefined', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-4',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(6);
      expect(selected.every(s => s.weapon !== undefined)).toBe(true);
    });

    test('getSelectedWeapons returns only selected weapons by index', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-5',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: [1, 3, 5]
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(3);
      expect(selected[0].weapon.name).toBe('Импульсное орудие');
      expect(selected[1].weapon.name).toBe('Пушка Гатлинга');
      expect(selected[2].weapon.name).toBe('Механическая пила');
    });

    test('getSelectedWeapons returns empty array when no weapons selected', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-6',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: []
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(0);
    });

    test('Weapon indices map correctly to weapon objects', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-7',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: [0, 2, 4]
      };

      const selected = getSelectedWeapons(unit);
      expect(selected[0].originalIndex).toBe(0);
      expect(selected[0].weapon.name).toBe('Тяжелая ракета');
      expect(selected[1].originalIndex).toBe(2);
      expect(selected[1].weapon.name).toBe('Четырехствольный пулемет');
      expect(selected[2].originalIndex).toBe(4);
      expect(selected[2].weapon.name).toBe('Энергетический гарпун');
    });
  });

  describe('Backward Compatibility', () => {
    test('Existing army units without selectedWeaponIndices show all weapons', () => {
      // Simulating an old army unit that was created before weapon selection feature
      const unit: ArmyUnit = {
        instanceId: 'old-unit-1',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20
        // Note: no selectedWeaponIndices field
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(6);
    });

    test('Imported armies without selection work correctly', () => {
      // Simulating an imported army without selectedWeaponIndices
      const importedUnit: ArmyUnit = {
        instanceId: 'imported-1',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 15
      };

      const selected = getSelectedWeapons(importedUnit);
      expect(selected).toHaveLength(6);
    });
  });

  describe('Combat Integration', () => {
    test('Shots tracking works with filtered weapons', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-8',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: [0, 2],
        machineWeaponShots: {
          0: 1,
          2: 1
        }
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(2);

      // Original indices should map correctly to shots tracking
      expect(unit.machineWeaponShots?.[selected[0].originalIndex]).toBe(1);
      expect(unit.machineWeaponShots?.[selected[1].originalIndex]).toBe(1);
    });

    test('Melee weapons (ББ) are correctly identified in selection', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-9',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: [0, 5]
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(2);

      // First weapon is ranged
      expect(selected[0].weapon.range).toBe('D12');

      // Second weapon is melee
      expect(selected[1].weapon.range).toBe('ББ');
    });
  });

  describe('Edge Cases', () => {
    test('Machine with 0 weapons (empty selection) renders correctly', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-10',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: []
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(0);
      expect(selected).toEqual([]);
    });

    test('Machine with all weapons selected renders all', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-11',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 16,
        currentAmmo: 20,
        selectedWeaponIndices: [0, 1, 2, 3, 4, 5]
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(6);
    });

    test('Squad units return empty array', () => {
      const unit: ArmyUnit = {
        instanceId: 'squad-1',
        type: 'squad',
        data: {
          id: 'test_squad',
          name: 'Test Squad',
          faction: 'polaris',
          cost: 100,
          soldiers: [
            { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
          ]
        },
        instanceNumber: 1
      };

      const selected = getSelectedWeapons(unit);
      expect(selected).toHaveLength(0);
    });
  });
});
