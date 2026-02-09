import { Machine, ArmyUnit } from '@/lib/types';

/**
 * Test helper to simulate the canShoot logic from UnitCard.tsx
 * This mirrors the logic used to determine if a weapon can be fired
 */
function canWeaponShoot(
  unit: ArmyUnit,
  weaponIndex: number
): boolean {
  const machine = unit.data as Machine;
  const weaponShots = unit.machineWeaponShots?.[weaponIndex] || 0;
  const totalShotsUsed = unit.machineShotsUsed || 0;
  const fireRate = machine.fire_rate;

  return !unit.isMachineDone &&
         unit.currentDurability !== 0 &&
         (unit.currentAmmo || 0) > 0 &&
         totalShotsUsed < fireRate;
}

/**
 * Test helper to simulate shot tracking logic from UnitCard.tsx
 */
function simulateShot(unit: ArmyUnit, weaponIndex: number): ArmyUnit {
  const machine = unit.data as Machine;
  const weapon = machine.weapons[weaponIndex];
  const isMeleeWeapon = weapon?.range === 'ББ';

  const newAmmo = isMeleeWeapon
    ? (unit.currentAmmo || 0)
    : Math.max(0, (unit.currentAmmo || 0) - 1);
  const newShotsUsed = (unit.machineShotsUsed || 0) + 1;
  const newWeaponShots = {
    ...(unit.machineWeaponShots || {}),
    [weaponIndex]: (unit.machineWeaponShots?.[weaponIndex] || 0) + 1
  };

  return {
    ...unit,
    currentAmmo: newAmmo,
    machineShotsUsed: newShotsUsed,
    machineWeaponShots: newWeaponShots,
    isMachineShot: true
  };
}

describe('Machine Fire Rate', () => {
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
      { min_durability: 1, max_durability: 10, speed: 12 }
    ],
    weapons: [
      { name: 'Cannon', range: 'D12', power: '2D6', special: '' },
      { name: 'Machine Gun', range: 'D6', power: 'D6', special: '' }
    ]
  };

  describe('Fire Rate Limitation', () => {
    test('Machine with fire_rate=2 can shoot twice', () => {
      let unit: ArmyUnit = {
        instanceId: 'test-machine-1',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20
      };

      // First shot should be possible
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Second shot should still be possible
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Third shot should NOT be possible (fire_rate exceeded)
      expect(canWeaponShoot(unit, 0)).toBe(false);
      expect(unit.machineShotsUsed).toBe(2);
    });

    test('Machine with fire_rate=1 can only shoot once', () => {
      const singleShotMachine: Machine = {
        ...mockMachine,
        fire_rate: 1
      };

      let unit: ArmyUnit = {
        instanceId: 'test-machine-2',
        type: 'machine',
        data: singleShotMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20
      };

      // First shot should be possible
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Second shot should NOT be possible
      expect(canWeaponShoot(unit, 0)).toBe(false);
    });

    test('Machine with fire_rate=3 can shoot three times', () => {
      const tripleShotMachine: Machine = {
        ...mockMachine,
        fire_rate: 3
      };

      let unit: ArmyUnit = {
        instanceId: 'test-machine-3',
        type: 'machine',
        data: tripleShotMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20
      };

      // First shot
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Second shot
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Third shot
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Fourth shot should NOT be possible
      expect(canWeaponShoot(unit, 0)).toBe(false);
    });
  });

  describe('Same Weapon Multiple Shots', () => {
    test('Weapon can be fired multiple times within fire_rate limit', () => {
      let unit: ArmyUnit = {
        instanceId: 'test-machine-4',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20
      };

      // Fire the same weapon (Cannon) twice
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // This is the fix: weapon should still be shootable
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Fire limit reached
      expect(canWeaponShoot(unit, 0)).toBe(false);
    });

    test('Weapon with 1 shot recorded can still fire if fire_rate > 1', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-5',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20,
        machineWeaponShots: { 0: 1 },  // Cannon already fired once
        machineShotsUsed: 1
      };

      // Should still be able to shoot (fire_rate=2, shotsUsed=1)
      expect(canWeaponShoot(unit, 0)).toBe(true);
    });
  });

  describe('Different Weapons Shots', () => {
    test('Can shoot different weapons within fire_rate limit', () => {
      let unit: ArmyUnit = {
        instanceId: 'test-machine-6',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20
      };

      // Fire Cannon
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Fire Machine Gun (different weapon)
      expect(canWeaponShoot(unit, 1)).toBe(true);
      unit = simulateShot(unit, 1);

      // Fire limit reached
      expect(canWeaponShoot(unit, 0)).toBe(false);
      expect(canWeaponShoot(unit, 1)).toBe(false);
    });

    test('Can fire same weapon twice (the bug scenario)', () => {
      let unit: ArmyUnit = {
        instanceId: 'test-machine-7',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20
      };

      // This was the bug: after first shot, weaponShots became 1,
      // and the old code checked `weaponShots === 0`, blocking the shot

      // First shot with Cannon
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Verify weaponShots is now 1
      expect(unit.machineWeaponShots?.[0]).toBe(1);

      // This should still work after the fix!
      expect(canWeaponShoot(unit, 0)).toBe(true);
      unit = simulateShot(unit, 0);

      // Verify weaponShots is now 2
      expect(unit.machineWeaponShots?.[0]).toBe(2);
      expect(unit.machineShotsUsed).toBe(2);
    });
  });

  describe('Fire Rate Constraints', () => {
    test('Cannot shoot when isMachineDone is true', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-8',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20,
        isMachineDone: true
      };

      expect(canWeaponShoot(unit, 0)).toBe(false);
    });

    test('Cannot shoot when durability is 0', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-9',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 0,
        currentAmmo: 20
      };

      expect(canWeaponShoot(unit, 0)).toBe(false);
    });

    test('Cannot shoot when ammo is 0', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-10',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 0
      };

      expect(canWeaponShoot(unit, 0)).toBe(false);
    });

    test('Cannot shoot after fire_rate is exhausted', () => {
      const unit: ArmyUnit = {
        instanceId: 'test-machine-11',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20,
        machineShotsUsed: 2  // Equal to fire_rate
      };

      expect(canWeaponShoot(unit, 0)).toBe(false);
    });
  });

  describe('Reset on Turn End', () => {
    test('Resetting machine state allows shooting again', () => {
      // After all shots used
      let unit: ArmyUnit = {
        instanceId: 'test-machine-12',
        type: 'machine',
        data: mockMachine,
        instanceNumber: 1,
        currentDurability: 10,
        currentAmmo: 20,
        machineShotsUsed: 2,
        machineWeaponShots: { 0: 1, 1: 1 },
        isMachineShot: true
      };

      expect(canWeaponShoot(unit, 0)).toBe(false);

      // Simulate turn reset (untoggling "done")
      const resetUnit: ArmyUnit = {
        ...unit,
        isMachineMoved: false,
        isMachineShot: false,
        isMachineMelee: false,
        isMachineDone: false
      };

      // Note: In the actual UI, machineShotsUsed would need to be reset too
      // This test shows that after reset, shooting would be possible
      // if shots were also reset to 0
      const fullyResetUnit: ArmyUnit = {
        ...resetUnit,
        machineShotsUsed: 0,
        machineWeaponShots: {}
      };

      expect(canWeaponShoot(fullyResetUnit, 0)).toBe(true);
    });
  });
});
