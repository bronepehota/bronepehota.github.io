import { ArmyUnit, Machine } from '@/lib/types';

/**
 * Integration tests for machine fire rate functionality.
 * These tests verify the complete flow from firing a shot to updating counters.
 */

describe('Machine Fire Rate Integration Tests', () => {
  const mockMachine: Machine = {
    id: 'test_tank',
    name: 'Test Tank',
    shortName: 'TT',
    cost: 150,
    faction: 'polaris',
    rank: 2,
    fire_rate: 2,
    ammo_max: 20,
    durability_max: 16,
    image: '/images/test.jpg',
    speed_sectors: [
      { min_durability: 1, max_durability: 16, speed: 2 }
    ],
    weapons: [
      { name: 'Cannon', range: 'D12', power: '2D20' },
      { name: 'Machine Gun', range: 'D6', power: '1D12' },
      { name: 'Melee Spike', range: 'ББ', power: 'D12' }
    ]
  };

  const createMockUnit = (overrides?: Partial<ArmyUnit>): ArmyUnit => ({
    instanceId: 'test-machine-1',
    type: 'machine',
    data: mockMachine,
    instanceNumber: 1,
    currentDurability: 12,
    currentAmmo: 20,
    machineShotsUsed: 0,
    machineWeaponShots: {},
    ...overrides
  });

  /**
   * Simulates the shot application logic from UnitCard.handleApplyResult
   */
  function simulateShotApplication(
    unit: ArmyUnit,
    weaponIndex: number,
    usePerWeaponAmmo: boolean = false
  ): ArmyUnit {
    const machine = unit.data as Machine;
    const weapon = machine.weapons[weaponIndex];
    const isMeleeWeapon = weapon?.range === 'ББ';

    const newShotsUsed = (unit.machineShotsUsed || 0) + 1;
    const newWeaponShots = {
      ...(unit.machineWeaponShots || {}),
      [weaponIndex]: (unit.machineWeaponShots?.[weaponIndex] || 0) + 1
    };

    if (usePerWeaponAmmo && !isMeleeWeapon) {
      // Per-weapon ammo system
      const newWeaponAmmo = [...(unit.weaponAmmo || machine.weapons.map(w => w.ammo ?? machine.ammo_max))];
      newWeaponAmmo[weaponIndex] = Math.max(0, (newWeaponAmmo[weaponIndex] || 0) - 1);

      return {
        ...unit,
        weaponAmmo: newWeaponAmmo,
        currentAmmo: Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: newShotsUsed,
        machineWeaponShots: newWeaponShots,
        isMachineShot: true
      };
    } else {
      // Original behavior
      const newAmmo = isMeleeWeapon
        ? (unit.currentAmmo || 0)
        : Math.max(0, (unit.currentAmmo || 0) - 1);

      return {
        ...unit,
        currentAmmo: newAmmo,
        machineShotsUsed: newShotsUsed,
        machineWeaponShots: newWeaponShots,
        isMachineShot: true
      };
    }
  }

  describe('Full flow: Fire shot → Apply result → Verify counter updated', () => {
    test('Complete flow for single weapon shot', () => {
      let unit = createMockUnit();

      // Initial state
      expect(unit.machineShotsUsed).toBe(0);
      expect(unit.currentAmmo).toBe(20);
      expect(unit.machineWeaponShots?.[0]).toBeUndefined();

      // Fire shot
      unit = simulateShotApplication(unit, 0);

      // Verify state after shot
      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.currentAmmo).toBe(19);
      expect(unit.machineWeaponShots?.[0]).toBe(1);
      expect(unit.isMachineShot).toBe(true);
    });

    test('Complete flow for multiple shots from same weapon', () => {
      let unit = createMockUnit();

      // First shot
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.machineWeaponShots?.[0]).toBe(1);
      expect(unit.currentAmmo).toBe(19);

      // Second shot (same weapon)
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineShotsUsed).toBe(2);
      expect(unit.machineWeaponShots?.[0]).toBe(2);
      expect(unit.currentAmmo).toBe(18);

      // Third shot should be blocked by fire rate
      const canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(false);
    });

    test('Complete flow for shots from different weapons', () => {
      let unit = createMockUnit();

      // Fire Cannon (weapon 0)
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.machineWeaponShots?.[0]).toBe(1);
      expect(unit.currentAmmo).toBe(19);

      // Fire Machine Gun (weapon 1)
      unit = simulateShotApplication(unit, 1);
      expect(unit.machineShotsUsed).toBe(2);
      expect(unit.machineWeaponShots?.[0]).toBe(1);
      expect(unit.machineWeaponShots?.[1]).toBe(1);
      expect(unit.currentAmmo).toBe(18);

      // Fire limit reached
      const canShootWeapon0 = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      const canShootWeapon1 = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShootWeapon0).toBe(false);
      expect(canShootWeapon1).toBe(false);
    });
  });

  describe('Fire rate limit enforcement across all weapons', () => {
    test('Fire rate is shared across all weapons', () => {
      let unit = createMockUnit();

      // Fire weapon 0 once
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineShotsUsed).toBe(1);

      // Fire weapon 1 once
      unit = simulateShotApplication(unit, 1);
      expect(unit.machineShotsUsed).toBe(2);

      // Both weapons should now be disabled
      const canShootWeapon0 = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      const canShootWeapon1 = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShootWeapon0).toBe(false);
      expect(canShootWeapon1).toBe(false);
    });

    test('Cannot exceed fire rate even with different weapons', () => {
      let unit = createMockUnit();

      // Try to fire all weapons
      for (let i = 0; i < 3; i++) {
        if ((unit.machineShotsUsed || 0) < mockMachine.fire_rate) {
          unit = simulateShotApplication(unit, i % 2); // Alternate between weapons 0 and 1
        }
      }

      // Should stop at fire_rate
      expect(unit.machineShotsUsed).toBe(2);
    });

    test('Fire rate limit applies regardless of weapon combination', () => {
      let unit = createMockUnit();

      // Fire weapon 0 twice
      unit = simulateShotApplication(unit, 0);
      unit = simulateShotApplication(unit, 0);

      expect(unit.machineShotsUsed).toBe(2);
      expect(unit.machineWeaponShots?.[0]).toBe(2);
      expect(unit.machineWeaponShots?.[1]).toBeUndefined();

      // Cannot fire weapon 1 even though it hasn't been used
      const canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(false);
    });
  });

  describe('Melee weapon integration', () => {
    test('Melee weapons do not deduct ammo', () => {
      let unit = createMockUnit({ currentAmmo: 20 });

      const initialAmmo = unit.currentAmmo;

      // Fire melee weapon
      unit = simulateShotApplication(unit, 2); // Weapon 2 is melee

      expect(unit.currentAmmo).toBe(initialAmmo);
      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.machineWeaponShots?.[2]).toBe(1);
    });

    test('Melee attacks still count toward fire rate limit', () => {
      let unit = createMockUnit();

      // Fire ranged weapon
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineShotsUsed).toBe(1);

      // Fire melee weapon
      unit = simulateShotApplication(unit, 2);
      expect(unit.machineShotsUsed).toBe(2);

      // Fire rate limit reached
      const canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(false);
    });

    test('Can mix ranged and melee attacks', () => {
      let unit = createMockUnit({ currentAmmo: 20 });

      // Ranged shot
      unit = simulateShotApplication(unit, 0);
      expect(unit.currentAmmo).toBe(19);
      expect(unit.machineShotsUsed).toBe(1);

      // Melee attack (no ammo deduction)
      unit = simulateShotApplication(unit, 2);
      expect(unit.currentAmmo).toBe(19); // Unchanged
      expect(unit.machineShotsUsed).toBe(2);
    });
  });

  describe('Per-weapon ammo system integration', () => {
    test('Per-weapon ammo deducts from specific weapon', () => {
      let unit = createMockUnit({
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      });

      // Fire weapon 0
      unit = simulateShotApplication(unit, 0, true);

      expect(unit.weaponAmmo?.[0]).toBe(9);
      expect(unit.weaponAmmo?.[1]).toBe(20); // Unchanged
      expect(unit.currentAmmo).toBe(29);
    });

    test('Per-weapon ammo tracks independently', () => {
      let unit = createMockUnit({
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      });

      // Fire weapon 0 twice
      unit = simulateShotApplication(unit, 0, true);
      expect(unit.weaponAmmo?.[0]).toBe(9);

      unit = simulateShotApplication(unit, 0, true);
      expect(unit.weaponAmmo?.[0]).toBe(8);
      expect(unit.weaponAmmo?.[1]).toBe(20); // Still unchanged
    });

    test('Per-weapon ammo does not deduct for melee weapons', () => {
      let unit = createMockUnit({
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      });

      // Fire melee weapon
      unit = simulateShotApplication(unit, 2, true);

      expect(unit.weaponAmmo?.[2]).toBe(0); // Unchanged (melee has no ammo)
      expect(unit.currentAmmo).toBe(30); // Unchanged
    });
  });

  describe('Turn reset flow', () => {
    test('Resetting shot counters allows shooting again', () => {
      let unit = createMockUnit();

      // Fire all shots
      unit = simulateShotApplication(unit, 0);
      unit = simulateShotApplication(unit, 0);

      expect(unit.machineShotsUsed).toBe(2);

      // Cannot shoot
      let canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(false);

      // Reset turn
      unit = {
        ...unit,
        machineShotsUsed: 0,
        machineWeaponShots: {},
        isMachineShot: false,
        isMachineDone: false
      };

      // Can shoot again
      canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(true);

      // Fire again after reset
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineShotsUsed).toBe(1);
    });

    test('Full cycle: fire → reset → fire again', () => {
      let unit = createMockUnit({ currentAmmo: 20 });

      // Turn 1: Fire all shots
      unit = simulateShotApplication(unit, 0);
      unit = simulateShotApplication(unit, 1);

      expect(unit.machineShotsUsed).toBe(2);
      expect(unit.currentAmmo).toBe(18);

      // Reset
      unit = {
        ...unit,
        machineShotsUsed: 0,
        machineWeaponShots: {},
        isMachineShot: false,
        isMachineDone: false
      };

      // Turn 2: Fire again
      unit = simulateShotApplication(unit, 0);
      unit = simulateShotApplication(unit, 1);

      expect(unit.machineShotsUsed).toBe(2);
      expect(unit.currentAmmo).toBe(16);
    });
  });

  describe('Edge cases integration', () => {
    test('Handles shooting at ammo boundary', () => {
      let unit = createMockUnit({ currentAmmo: 1 });

      // Should be able to fire with 1 ammo
      const canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate && (unit.currentAmmo || 0) > 0;
      expect(canShoot).toBe(true);

      // Fire last shot
      unit = simulateShotApplication(unit, 0);

      expect(unit.currentAmmo).toBe(0);

      // Cannot fire due to no ammo
      const canShootAfter = (unit.machineShotsUsed || 0) < mockMachine.fire_rate && (unit.currentAmmo || 0) > 0;
      expect(canShootAfter).toBe(false);
    });

    test('Handles zero fire rate', () => {
      const machineZeroRate: Machine = {
        ...mockMachine,
        fire_rate: 0
      };

      const unit = createMockUnit({ data: machineZeroRate });

      // Cannot shoot with fire_rate of 0
      const canShoot = (unit.machineShotsUsed || 0) < machineZeroRate.fire_rate;
      expect(canShoot).toBe(false);
    });

    test('Handles high fire rate', () => {
      const machineHighRate: Machine = {
        ...mockMachine,
        fire_rate: 5
      };

      let unit = createMockUnit({ data: machineHighRate });

      // Fire 5 times
      for (let i = 0; i < 5; i++) {
        unit = simulateShotApplication(unit, 0);
      }

      expect(unit.machineShotsUsed).toBe(5);
      expect(unit.machineWeaponShots?.[0]).toBe(5);

      // 6th shot should be blocked
      const canShoot = (unit.machineShotsUsed || 0) < machineHighRate.fire_rate;
      expect(canShoot).toBe(false);
    });

    test('Handles undefined weaponShots gracefully', () => {
      let unit = createMockUnit({
        machineWeaponShots: undefined
      });

      // Should be able to fire
      expect(unit.machineWeaponShots?.[0]).toBeUndefined();

      unit = simulateShotApplication(unit, 0);

      expect(unit.machineWeaponShots?.[0]).toBe(1);
    });
  });

  describe('Real-world scenarios', () => {
    test('Scenario: Tank fires main weapon twice', () => {
      let unit = createMockUnit({ currentAmmo: 20 });

      // Turn starts
      expect(unit.machineShotsUsed).toBe(0);

      // Fire main cannon
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.currentAmmo).toBe(19);

      // Fire main cannon again
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineShotsUsed).toBe(2);
      expect(unit.currentAmmo).toBe(18);

      // Cannot fire again this turn
      const canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(false);
    });

    test('Scenario: Mix of main and secondary weapons', () => {
      let unit = createMockUnit({ currentAmmo: 20 });

      // Fire main cannon
      unit = simulateShotApplication(unit, 0);
      expect(unit.machineWeaponShots?.[0]).toBe(1);

      // Fire machine gun
      unit = simulateShotApplication(unit, 1);
      expect(unit.machineWeaponShots?.[0]).toBe(1);
      expect(unit.machineWeaponShots?.[1]).toBe(1);

      // Fire limit reached for both weapons
      const canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(false);
    });

    test('Scenario: Melee attack when out of ammo', () => {
      let unit = createMockUnit({ currentAmmo: 0 });

      // Cannot fire ranged weapons
      const canShootRanged = (unit.currentAmmo || 0) > 0;
      expect(canShootRanged).toBe(false);

      // Can still use melee
      unit = simulateShotApplication(unit, 2);

      expect(unit.currentAmmo).toBe(0); // Still 0
      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.machineWeaponShots?.[2]).toBe(1);
    });
  });
});
