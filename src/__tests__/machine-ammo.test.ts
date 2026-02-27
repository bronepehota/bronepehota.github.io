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

/**
 * Test helper for per-weapon ammo deduction (community_star_system rules)
 */
function calculatePerWeaponAmmoAfterShot(
  unit: ArmyUnit,
  weaponIndex: number
): number[] {
  const machine = unit.data as Machine;
  const weapon = machine.weapons[weaponIndex];
  const isMeleeWeapon = weapon?.range === 'ББ';

  const newWeaponAmmo = [...(unit.weaponAmmo || machine.weapons.map(w => w.ammo ?? machine.ammo_max))];
  if (!isMeleeWeapon) {
    newWeaponAmmo[weaponIndex] = Math.max(0, (newWeaponAmmo[weaponIndex] || 0) - 1);
  }

  return newWeaponAmmo;
}

/**
 * Calculate total ammo from all weapons
 */
function calculateTotalWeaponAmmo(unit: ArmyUnit): { current: number; max: number } {
  const machine = unit.data as Machine;
  const current = machine.weapons.reduce((sum, weapon, idx) => {
    return sum + (unit.weaponAmmo?.[idx] ?? weapon.ammo ?? machine.ammo_max);
  }, 0);
  const max = machine.weapons.reduce((sum, weapon) => {
    return sum + (weapon.ammo ?? machine.ammo_max);
  }, 0);
  return { current, max };
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

// ============================================
// Per-Weapon Ammo Tests (community_star_system)
// ============================================

describe('Per-Weapon Ammo (community_star_system)', () => {
  // Machine with different ammo per weapon
  const mockMachineWithPerWeaponAmmo: Machine = {
    id: 'test_tank_per_weapon',
    name: 'Test Tank Per Weapon',
    cost: 100,
    faction: 'polaris',
    rank: 5,
    durability_max: 10,
    ammo_max: 20,
    fire_rate: 2,
    speed_sectors: [
      { min_durability: 1, max_durability: 10, speed: 12 }
    ],
    weapons: [
      { name: 'Cannon', range: 'D12', power: '2D6', ammo: 10 },
      { name: 'Machine Gun', range: 'D6', power: 'D6', ammo: 20 },
      { name: 'Melee Spike', range: 'ББ', power: 'D12' } // No ammo for melee
    ]
  };

  describe('Per-weapon ammo deduction', () => {
    test('Shot from weapon 0 deducts only weapon 0 ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-pw-1',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      };

      const newWeaponAmmo = calculatePerWeaponAmmoAfterShot(unit, 0);
      expect(newWeaponAmmo[0]).toBe(9);  // Cannon: 10 -> 9
      expect(newWeaponAmmo[1]).toBe(20); // Machine Gun: unchanged
      expect(newWeaponAmmo[2]).toBe(0);  // Melee: unchanged
    });

    test('Shot from weapon 1 deducts only weapon 1 ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-pw-2',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      };

      const newWeaponAmmo = calculatePerWeaponAmmoAfterShot(unit, 1);
      expect(newWeaponAmmo[0]).toBe(10); // Cannon: unchanged
      expect(newWeaponAmmo[1]).toBe(19); // Machine Gun: 20 -> 19
      expect(newWeaponAmmo[2]).toBe(0);  // Melee: unchanged
    });

    test('Melee weapon does not deduct ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-pw-3',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      };

      const newWeaponAmmo = calculatePerWeaponAmmoAfterShot(unit, 2);
      expect(newWeaponAmmo[0]).toBe(10); // All unchanged
      expect(newWeaponAmmo[1]).toBe(20);
      expect(newWeaponAmmo[2]).toBe(0);
    });

    test('Per-weapon ammo never goes below 0', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-pw-4',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 30,
        weaponAmmo: [0, 20, 0] // Cannon already at 0
      };

      const newWeaponAmmo = calculatePerWeaponAmmoAfterShot(unit, 0);
      expect(newWeaponAmmo[0]).toBe(0); // Stays at 0
    });
  });

  describe('Total ammo calculation', () => {
    test('Calculate total ammo from all weapons', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-total-1',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      };

      const total = calculateTotalWeaponAmmo(unit);
      expect(total.current).toBe(30); // 10 + 20 + 0 (weaponAmmo used)
      expect(total.max).toBe(50);     // 10 + 20 + 20 (melee uses ammo_max fallback)
    });

    test('Total ammo after shooting one weapon', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-total-2',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      };

      const newWeaponAmmo = calculatePerWeaponAmmoAfterShot(unit, 0);
      const updatedUnit = { ...unit, weaponAmmo: newWeaponAmmo };

      const total = calculateTotalWeaponAmmo(updatedUnit);
      expect(total.current).toBe(29); // 9 + 20 + 0
    });

    test('Total ammo uses weapon.ammo fallback when weaponAmmo undefined', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-total-3',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 30
        // weaponAmmo not defined - should use weapon.ammo
      };

      const total = calculateTotalWeaponAmmo(unit);
      // melee weapon has no ammo, so uses ammo_max (20) as fallback
      expect(total.current).toBe(50); // 10 + 20 + 20 (melee uses ammo_max)
    });
  });

  describe('Weapon initialization from JSON', () => {
    test('weaponAmmo initialized from weapon.ammo values', () => {
      const machine = mockMachineWithPerWeaponAmmo;
      const weaponAmmo = machine.weapons.map(w => w.ammo ?? machine.ammo_max);

      expect(weaponAmmo).toEqual([10, 20, 20]); // Melee uses ammo_max as fallback
    });
  });

  describe('Can shoot check', () => {
    test('Cannot shoot when weapon has no ammo', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-canshoot-1',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20,
        weaponAmmo: [0, 20, 0] // Cannon at 0
      };

      const weaponIdx = 0;
      const weaponAmmo = unit.weaponAmmo?.[weaponIdx] ?? 0;
      const hasAmmo = weaponAmmo > 0;

      expect(hasAmmo).toBe(false);
    });

    test('Can shoot different weapon when one is empty', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-canshoot-2',
        type: 'machine',
        data: mockMachineWithPerWeaponAmmo,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20,
        weaponAmmo: [0, 20, 0] // Cannon at 0, Machine Gun has 20
      };

      const weaponIdx = 1;
      const weaponAmmo = unit.weaponAmmo?.[weaponIdx] ?? 0;
      const hasAmmo = weaponAmmo > 0;

      expect(hasAmmo).toBe(true);
    });
  });
});
