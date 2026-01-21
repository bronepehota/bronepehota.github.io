import { Machine, ArmyUnit } from '@/lib/types';

/**
 * Test helper to simulate the ammo deduction logic from UnitCard.tsx
 * This mirrors the logic in the useEffect that handles combat completion
 */
function calculateAmmoAfterShot(unit: ArmyUnit, weaponIndex: number): number {
  const machine = unit.data as Machine;
  const weapon = machine.weapons[weaponIndex];
  const isMeleeWeapon = weapon?.range === 'ББ';

  return isMeleeWeapon
    ? (unit.currentAmmo || 0)  // Не списываем для ББ
    : Math.max(0, (unit.currentAmmo || 0) - 1);
}

describe('Machine Ammo Deduction', () => {
  const mockMachine: Machine = {
    id: 'test_tank',
    name: 'Test Tank',
    cost: 100,
    faction: 'polaris',
    rank: 5,
    durability_max: 10,
    ammo_max: 20,
    fire_rate: 2,
    speed_sectors: [
      { min_durability: 1, max_durability: 10, speed: 12 },
      { min_durability: 5, max_durability: 10, speed: 14 }
    ],
    weapons: [
      { name: 'Cannon', range: 'D12', power: '2D6', special: '' },
      { name: 'Machine Gun', range: 'D6', power: 'D6', special: '' },
      { name: 'Melee Spike', range: 'ББ', power: 'D12', special: '' }
    ]
  };

  describe('Ranged Weapons - should deduct ammo', () => {
    test('Cannon shot (D12 range) deducts 1 ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-1',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20
      };

      const newAmmo = calculateAmmoAfterShot(unit, 0);
      expect(newAmmo).toBe(19);
    });

    test('Machine gun shot (D6 range) deducts 1 ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-2',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 15
      };

      const newAmmo = calculateAmmoAfterShot(unit, 1);
      expect(newAmmo).toBe(14);
    });

    test('Multiple ranged shots deduct correct ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-3',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 10
      };

      // First shot
      let ammo = calculateAmmoAfterShot(unit, 0);
      expect(ammo).toBe(9);

      // Second shot
      unit.currentAmmo = ammo;
      ammo = calculateAmmoAfterShot(unit, 1);
      expect(ammo).toBe(8);
    });

    test('Ammo never goes below 0', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-4',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 0
      };

      const newAmmo = calculateAmmoAfterShot(unit, 0);
      expect(newAmmo).toBe(0);
    });
  });

  describe('Melee Weapons (ББ) - should NOT deduct ammo', () => {
    test('Melee weapon shot (ББ range) does NOT deduct ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-5',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20
      };

      const newAmmo = calculateAmmoAfterShot(unit, 2); // Melee Spike is index 2
      expect(newAmmo).toBe(20); // Should remain unchanged
    });

    test('Multiple melee attacks do not deduct ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-6',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 15
      };

      // First melee attack
      let ammo = calculateAmmoAfterShot(unit, 2);
      expect(ammo).toBe(15);

      // Second melee attack
      ammo = calculateAmmoAfterShot(unit, 2);
      expect(ammo).toBe(15);
    });

    test('Mixed ranged and melee attacks - only ranged deducts ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-7',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 10
      };

      // Ranged shot
      let ammo = calculateAmmoAfterShot(unit, 0);
      expect(ammo).toBe(9);

      // Melee attack
      unit.currentAmmo = ammo;
      ammo = calculateAmmoAfterShot(unit, 2);
      expect(ammo).toBe(9); // Unchanged

      // Another ranged shot
      ammo = calculateAmmoAfterShot({ ...unit, currentAmmo: ammo }, 0);
      expect(ammo).toBe(8);
    });
  });

  describe('Edge cases', () => {
    test('Weapon with undefined range defaults to deducting ammo', () => {
      const machineWithUndefined: Machine = {
        ...mockMachine,
        weapons: [
          { name: 'Unknown Weapon', range: '', power: 'D6', special: '' }
        ]
      };

      const unit: ArmyUnit = {
        instanceId: 'test-machine-8',
        type: 'machine',
        data: machineWithUndefined,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 5
      };

      const newAmmo = calculateAmmoAfterShot(unit, 0);
      // Empty string is not 'ББ', so it should deduct
      expect(newAmmo).toBe(4);
    });
  });
});
