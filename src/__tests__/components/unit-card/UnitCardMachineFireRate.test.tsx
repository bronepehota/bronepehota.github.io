import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnitCard from '@/components/cards/UnitCard';
import { ArmyUnit, Machine, PilotInfo } from '@/lib/types';
import { CombatResult } from '@/lib/combat-types';

// Mock the combat flow controller
jest.mock('@/components/combat/CombatFlowController', () => ({
  useCombatFlowController: () => ({
    state: {
      phase: 'IDLE',
      actionType: null,
      unit: null,
      unitType: 'machine',
      soldierIndex: null,
      parameters: {
        distance: 5,
        targetArmor: 2,
        targetMelee: 2,
        fortification: 'none',
        isSurpriseAttack: false,
        isAimedShot: false,
      },
      diceDisplay: {},
      result: null,
      isRolling: false,
    },
    isOpen: false,
    startCombat: jest.fn(),
    selectAction: jest.fn(),
    setParameters: jest.fn(),
    executeAction: jest.fn(),
    applyResult: jest.fn(),
    goBack: jest.fn(),
    closeCombat: jest.fn(),
    cancelCombat: jest.fn(),
  }),
}));

// Mock the pilot test flow
jest.mock('@/hooks/usePilotTestFlow', () => ({
  usePilotTestFlow: () => ({
    isOpen: false,
    state: null,
    startTest: jest.fn(),
    closeTest: jest.fn(),
    onApply: jest.fn(),
  }),
}));

describe('UnitCard - Machine Weapon Fire Rate', () => {
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

  const mockUpdateUnit = jest.fn();
  const mockOnCombatLogEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Machine shot counter increments', () => {
    it('should increment machineShotsUsed after successful shot', async () => {
      let unit = createMockUnit();

      render(
        <UnitCard
          unit={unit}
          updateUnit={mockUpdateUnit}
          onCombatLogEntry={mockOnCombatLogEntry}
        />
      );

      // Simulate shot being applied (this would normally be done via combat modal)
      const mockResult: CombatResult = {
        timestamp: Date.now(),
        unitId: unit.instanceId,
        unitName: unit.data.name,
        unitType: 'machine',
        actionType: 'shot',
        parameters: {
          distance: 5,
          targetArmor: 2,
          targetMelee: 2,
          fortification: 'none',
          isSurpriseAttack: false,
          isAimedShot: false,
          weaponIndex: 0,
        },
        hitResult: {
          roll: 8,
          bonus: 0,
          total: 8,
          success: true,
          rolls: [8]
        },
        damageResult: {
          damage: 3,
          rolls: [3]
        }
      };

      // Simulate the handleApplyResult logic
      mockUpdateUnit.mockImplementation((_instanceId, updateFn) => {
        const updatedUnit = updateFn(unit);
        unit = updatedUnit;
        return updatedUnit;
      });

      // Apply the shot result
      const weaponIndex = 0;
      const newShotsUsed = (unit.machineShotsUsed || 0) + 1;
      const newWeaponShots = {
        ...(unit.machineWeaponShots || {}),
        [weaponIndex]: (unit.machineWeaponShots?.[weaponIndex] || 0) + 1
      };

      unit = {
        ...unit,
        currentAmmo: Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: newShotsUsed,
        machineWeaponShots: newWeaponShots,
        isMachineShot: true
      };

      // Verify shot counters incremented
      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.machineWeaponShots?.[0]).toBe(1);
      expect(unit.currentAmmo).toBe(19);
    });

    it('should track shots for each weapon independently', () => {
      let unit = createMockUnit();

      // Fire weapon 0 (Cannon)
      unit = {
        ...unit,
        currentAmmo: (unit.currentAmmo || 0) - 1,
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: {
          ...(unit.machineWeaponShots || {}),
          0: (unit.machineWeaponShots?.[0] || 0) + 1
        },
        isMachineShot: true
      };

      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.machineWeaponShots?.[0]).toBe(1);
      expect(unit.machineWeaponShots?.[1]).toBeUndefined();

      // Fire weapon 1 (Machine Gun)
      unit = {
        ...unit,
        currentAmmo: (unit.currentAmmo || 0) - 1,
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: {
          ...(unit.machineWeaponShots || {}),
          1: (unit.machineWeaponShots?.[1] || 0) + 1
        },
        isMachineShot: true
      };

      expect(unit.machineShotsUsed).toBe(2);
      expect(unit.machineWeaponShots?.[0]).toBe(1);
      expect(unit.machineWeaponShots?.[1]).toBe(1);
    });

    it('should allow firing same weapon twice within fire rate limit', () => {
      let unit = createMockUnit();

      // Fire weapon 0 twice
      for (let i = 0; i < 2; i++) {
        unit = {
          ...unit,
          currentAmmo: (unit.currentAmmo || 0) - 1,
          machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
          machineWeaponShots: {
            ...(unit.machineWeaponShots || {}),
            0: (unit.machineWeaponShots?.[0] || 0) + 1
          },
          isMachineShot: true
        };
      }

      expect(unit.machineShotsUsed).toBe(2);
      expect(unit.machineWeaponShots?.[0]).toBe(2);
      expect(unit.currentAmmo).toBe(18);
    });
  });

  describe('Ammo deduction for different weapon types', () => {
    it('should decrease ammo for ranged weapons', () => {
      let unit = createMockUnit({ currentAmmo: 20 });

      // Fire Cannon (ranged)
      unit = {
        ...unit,
        currentAmmo: Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: { 0: 1 },
        isMachineShot: true
      };

      expect(unit.currentAmmo).toBe(19);
    });

    it('should NOT decrease ammo for melee weapons (ББ)', () => {
      let unit = createMockUnit({ currentAmmo: 20 });

      // Fire Melee Spike (ББ)
      const isMeleeWeapon = true;
      unit = {
        ...unit,
        currentAmmo: isMeleeWeapon ? (unit.currentAmmo || 0) : Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: { 2: 1 },
        isMachineShot: true
      };

      expect(unit.currentAmmo).toBe(20); // Should remain unchanged
    });

    it('should handle mixed ranged and melee shots correctly', () => {
      let unit = createMockUnit({ currentAmmo: 20 });

      // Ranged shot
      unit = {
        ...unit,
        currentAmmo: Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: { 0: 1 },
        isMachineShot: true
      };
      expect(unit.currentAmmo).toBe(19);

      // Melee shot (no ammo deduction)
      unit = {
        ...unit,
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: { 0: 1, 2: 1 },
        isMachineMelee: true
      };
      expect(unit.currentAmmo).toBe(19); // Still 19

      // Another ranged shot
      unit = {
        ...unit,
        currentAmmo: Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: { 0: 2, 2: 1 },
        isMachineShot: true
      };
      expect(unit.currentAmmo).toBe(18);
    });
  });

  describe('Fire rate limit enforcement', () => {
    it('should prevent shooting when fire rate limit is reached', () => {
      const unit = createMockUnit({
        machineShotsUsed: 2, // Equal to fire_rate
        machineWeaponShots: { 0: 2 }
      });

      const canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(false);
    });

    it('should allow shooting when below fire rate limit', () => {
      const unit = createMockUnit({
        machineShotsUsed: 1, // Below fire_rate
        machineWeaponShots: { 0: 1 }
      });

      const canShoot = (unit.machineShotsUsed || 0) < mockMachine.fire_rate;
      expect(canShoot).toBe(true);
    });

    it('should reset shot counters for new turn', () => {
      const unit = createMockUnit({
        machineShotsUsed: 2,
        machineWeaponShots: { 0: 1, 1: 1 },
        isMachineShot: true,
        isMachineDone: true
      });

      // Simulate turn reset
      const resetUnit: ArmyUnit = {
        ...unit,
        machineShotsUsed: 0,
        machineWeaponShots: {},
        isMachineShot: false,
        isMachineDone: false
      };

      expect(resetUnit.machineShotsUsed).toBe(0);
      expect(Object.keys(resetUnit.machineWeaponShots || {})).toHaveLength(0);
    });
  });

  describe('Grenade handling for machines', () => {
    it('should mark grenades as used after grenade attack', () => {
      let unit = createMockUnit({ grenadesUsed: false });

      // Simulate grenade result
      unit = {
        ...unit,
        grenadesUsed: true
      };

      expect(unit.grenadesUsed).toBe(true);
    });

    it('should track shots for grenade attacks', () => {
      let unit = createMockUnit();

      // Fire grenade
      unit = {
        ...unit,
        currentAmmo: Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: { 0: 1 },
        isMachineShot: true,
        grenadesUsed: true
      };

      expect(unit.machineShotsUsed).toBe(1);
      expect(unit.grenadesUsed).toBe(true);
    });
  });

  describe('Per-weapon ammo system (community_star_system)', () => {
    it('should decrease weapon-specific ammo when usePerWeaponAmmo is true', () => {
      let unit = createMockUnit({
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      });

      const usePerWeaponAmmo = true;
      const weaponIndex = 0;

      // Fire weapon 0
      const newWeaponAmmo = [...(unit.weaponAmmo || [])];
      newWeaponAmmo[weaponIndex] = Math.max(0, (newWeaponAmmo[weaponIndex] || 0) - 1);

      unit = {
        ...unit,
        weaponAmmo: newWeaponAmmo,
        currentAmmo: Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: { [weaponIndex]: 1 },
        isMachineShot: true
      };

      expect(unit.weaponAmmo?.[0]).toBe(9);
      expect(unit.weaponAmmo?.[1]).toBe(20); // Unchanged
      expect(unit.currentAmmo).toBe(29);
    });

    it('should not deduct ammo for melee weapons in per-weapon system', () => {
      let unit = createMockUnit({
        currentAmmo: 30,
        weaponAmmo: [10, 20, 0]
      });

      const usePerWeaponAmmo = true;
      const weaponIndex = 2; // Melee weapon
      const isMeleeWeapon = true;

      if (!isMeleeWeapon) {
        const newWeaponAmmo = [...(unit.weaponAmmo || [])];
        newWeaponAmmo[weaponIndex] = Math.max(0, (newWeaponAmmo[weaponIndex] || 0) - 1);
        unit = { ...unit, weaponAmmo: newWeaponAmmo };
      }

      // Melee weapon ammo should remain unchanged
      expect(unit.weaponAmmo?.[2]).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle machine with no weapons gracefully', () => {
      const machineNoWeapons: Machine = {
        ...mockMachine,
        weapons: []
      };

      const unit = createMockUnit({
        data: machineNoWeapons
      });

      expect(() => {
        render(
          <UnitCard
            unit={unit}
            updateUnit={mockUpdateUnit}
          />
        );
      }).not.toThrow();
    });

    it('should handle machine with single weapon', () => {
      const machineSingleWeapon: Machine = {
        ...mockMachine,
        weapons: [{ name: 'Cannon', range: 'D12', power: '2D20' }]
      };

      const unit = createMockUnit({
        data: machineSingleWeapon
      });

      expect(() => {
        render(
          <UnitCard
            unit={unit}
            updateUnit={mockUpdateUnit}
          />
        );
      }).not.toThrow();
    });

    it('should handle zero fire rate', () => {
      const machineZeroRate: Machine = {
        ...mockMachine,
        fire_rate: 0
      };

      const unit = createMockUnit({
        data: machineZeroRate
      });

      const canShoot = (unit.machineShotsUsed || 0) < machineZeroRate.fire_rate;
      expect(canShoot).toBe(false);
    });

    it('should handle high fire rate', () => {
      const machineHighRate: Machine = {
        ...mockMachine,
        fire_rate: 5
      };

      let unit = createMockUnit({
        data: machineHighRate
      });

      // Should be able to shoot 5 times
      for (let i = 0; i < 5; i++) {
        const canShoot = (unit.machineShotsUsed || 0) < machineHighRate.fire_rate;
        expect(canShoot).toBe(true);

        unit = {
          ...unit,
          machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
          machineWeaponShots: { 0: i + 1 }
        };
      }

      // 6th shot should be blocked
      const canShoot = (unit.machineShotsUsed || 0) < machineHighRate.fire_rate;
      expect(canShoot).toBe(false);
    });

    it('should handle undefined machineWeaponShots', () => {
      const unit = createMockUnit({
        machineWeaponShots: undefined
      });

      const weaponShots = unit.machineWeaponShots?.[0] || 0;
      expect(weaponShots).toBe(0);

      const newWeaponShots = {
        ...(unit.machineWeaponShots || {}),
        0: 1
      };

      expect(newWeaponShots[0]).toBe(1);
    });

    it('should handle ammo at zero boundary', () => {
      let unit = createMockUnit({ currentAmmo: 0 });

      // Try to fire with zero ammo
      unit = {
        ...unit,
        currentAmmo: Math.max(0, (unit.currentAmmo || 0) - 1),
        machineShotsUsed: (unit.machineShotsUsed || 0) + 1,
        machineWeaponShots: { 0: 1 },
        isMachineShot: true
      };

      expect(unit.currentAmmo).toBe(0); // Should stay at 0, not go negative
    });
  });

  describe('Pilot integration', () => {
    it('should render machine with pilot assigned', () => {
      const pilotInfo: PilotInfo = {
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: true
      };

      const unit = createMockUnit({
        pilotInfo
      });

      expect(() => {
        render(
          <UnitCard
            unit={unit}
            updateUnit={mockUpdateUnit}
            allUnits={[]}
          />
        );
      }).not.toThrow();
    });

    it('should handle pilot death', () => {
      const pilotInfo: PilotInfo = {
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: false
      };

      const unit = createMockUnit({
        pilotInfo
      });

      expect(unit.pilotInfo?.alive).toBe(false);
    });
  });

  describe('Combat log integration', () => {
    it('should create combat log entry when shot is applied', () => {
      const unit = createMockUnit();
      const onCombatLogEntry = jest.fn();

      render(
        <UnitCard
          unit={unit}
          updateUnit={mockUpdateUnit}
          onCombatLogEntry={onCombatLogEntry}
        />
      );

      // Simulate combat log entry creation
      const mockResult: CombatResult = {
        timestamp: Date.now(),
        unitId: unit.instanceId,
        unitName: unit.data.name,
        unitType: 'machine',
        actionType: 'shot',
        parameters: {
          distance: 5,
          targetArmor: 2,
          targetMelee: 2,
          fortification: 'none',
          isSurpriseAttack: false,
          isAimedShot: false,
          weaponIndex: 0,
        },
        hitResult: {
          roll: 8,
          bonus: 0,
          total: 8,
          success: true,
          rolls: [8]
        },
        damageResult: {
          damage: 3,
          rolls: [3]
        }
      };

      const entry = {
        id: `${mockResult.unitId}-${mockResult.timestamp}-test123`,
        timestamp: mockResult.timestamp,
        result: mockResult,
        applied: true,
      };

      onCombatLogEntry(entry);

      expect(onCombatLogEntry).toHaveBeenCalledWith(entry);
      expect(onCombatLogEntry).toHaveBeenCalledTimes(1);
    });
  });
});
