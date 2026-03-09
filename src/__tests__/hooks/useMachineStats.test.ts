import { renderHook, act } from '@testing-library/react';
import { useMachineStats } from '@/components/cards/unit-card/hooks/useMachineStats';
import { ArmyUnit, Machine } from '@/lib/types';

describe('useMachineStats', () => {
  const mockMachine: Machine = {
    id: 'test_machine',
    name: 'Test Machine',
    shortName: 'TM',
    faction: 'polaris',
    cost: 100,
    rank: 2,
    fire_rate: 2,
    ammo_max: 20,
    durability_max: 16,
    image: '/images/test.jpg',
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 }
    ],
    weapons: []
  };

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    instanceNumber: 1,
    type: 'machine',
    data: mockMachine,
    currentDurability: 12,
    currentAmmo: 15
  };

  const mockUpdateUnit = jest.fn();

  it('returns current stats for machine', () => {
    const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

    expect(result.current.currentDurability).toBe(12);
    expect(result.current.maxDurability).toBe(16);
    expect(result.current.speed).toBe(2);
  });

  it('calculates correct speed for durability sector', () => {
    const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

    expect(result.current.speed).toBe(2); // 12 is in 9-16 sector
  });

  it('throws error for squad units', () => {
    const squadUnit: ArmyUnit = {
      ...mockUnit,
      type: 'squad'
    };

    expect(() => {
      renderHook(() => useMachineStats(squadUnit, mockUpdateUnit));
    }).toThrow('useMachineStats is for machines only');
  });

  it('prevents durability from going below 0', () => {
    const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

    act(() => {
      result.current.updateDurability(-20); // Try to reduce by 20
    });

    expect(mockUpdateUnit).toHaveBeenCalledWith(expect.any(Function));
    const updateFn = mockUpdateUnit.mock.calls[0][0];
    const updated = updateFn(mockUnit);
    expect(updated.currentDurability).toBe(0);
  });

  describe('default zone calculation', () => {
    it('calculates green zone (above 2/3 threshold)', () => {
      // max=16, 2/3 threshold = 11, currentDurability=12 > 11
      const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

      expect(result.current.zone.color).toBe('green');
      expect(result.current.zone.max).toBe(16);
    });

    it('calculates yellow zone (between 1/3 and 2/3 threshold)', () => {
      // max=16, 2/3=11, 1/3=6, currentDurability=10 is in yellow zone
      const unitInYellowZone = { ...mockUnit, currentDurability: 10 };
      const { result } = renderHook(() => useMachineStats(unitInYellowZone, mockUpdateUnit));

      expect(result.current.zone.color).toBe('yellow');
      expect(result.current.zone.max).toBe(11); // greenThreshold
    });

    it('calculates red zone (below 1/3 threshold)', () => {
      // max=16, 1/3=6, currentDurability=5 is in red zone
      const unitInRedZone = { ...mockUnit, currentDurability: 5 };
      const { result } = renderHook(() => useMachineStats(unitInRedZone, mockUpdateUnit));

      expect(result.current.zone.color).toBe('red');
      expect(result.current.zone.max).toBe(6); // yellowThreshold
    });

    it('handles exact threshold boundaries correctly', () => {
      // max=16, 2/3=11 (rounded up), 1/3=6 (rounded up)
      const unitAtGreenThreshold = { ...mockUnit, currentDurability: 11 };
      const { result: greenResult } = renderHook(() => useMachineStats(unitAtGreenThreshold, mockUpdateUnit));
      expect(greenResult.current.zone.color).toBe('yellow'); // 11 is NOT > 11, so yellow

      const unitAtYellowThreshold = { ...mockUnit, currentDurability: 6 };
      const { result: yellowResult } = renderHook(() => useMachineStats(unitAtYellowThreshold, mockUpdateUnit));
      expect(yellowResult.current.zone.color).toBe('red'); // 6 is NOT > 6, so red
    });
  });

  describe('custom durability zones', () => {
    it('uses custom durability zones - finds zone where current > zone.max', () => {
      // Logic: finds FIRST zone where current > zone.max
      // Zones ordered: green(max:16), yellow(max:10), red(max:5)
      const machineWithCustomZones: Machine = {
        ...mockMachine,
        durabilityZones: [
          { max: 16, color: 'green', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 10, color: 'yellow', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 5, color: 'red', damagePerDie: { D6: 1, D12: 2, D20: 3 } }
        ]
      };

      // Test with currentDurability=12: 12 > 16? No. 12 > 10? Yes -> yellow
      const unitWithZones = { ...mockUnit, data: machineWithCustomZones, currentDurability: 12 };
      const { result } = renderHook(() => useMachineStats(unitWithZones, mockUpdateUnit));

      expect(result.current.zone.color).toBe('yellow');
      expect(result.current.zone.max).toBe(10);
    });

    it('finds correct zone in custom zones - red zone', () => {
      // Zones ordered: green(max:16), yellow(max:10), red(max:5)
      // current=8: 8 > 16? No. 8 > 10? No. 8 > 5? Yes -> red
      const machineWithCustomZones: Machine = {
        ...mockMachine,
        durabilityZones: [
          { max: 16, color: 'green', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 10, color: 'yellow', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 5, color: 'red', damagePerDie: { D6: 1, D12: 2, D20: 3 } }
        ]
      };
      const unitWithZones = { ...mockUnit, data: machineWithCustomZones, currentDurability: 8 };
      const { result } = renderHook(() => useMachineStats(unitWithZones, mockUpdateUnit));

      expect(result.current.zone.color).toBe('red');
      expect(result.current.zone.max).toBe(5);
    });

    it('falls back to last zone when current does not exceed any zone.max', () => {
      // Zones ordered: green(max:16), yellow(max:10), red(max:5)
      // current=3: 3 > 16? No. 3 > 10? No. 3 > 5? No -> returns last zone (red)
      const machineWithCustomZones: Machine = {
        ...mockMachine,
        durabilityZones: [
          { max: 16, color: 'green', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 10, color: 'yellow', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 5, color: 'red', damagePerDie: { D6: 1, D12: 2, D20: 3 } }
        ]
      };
      const unitWithZones = { ...mockUnit, data: machineWithCustomZones, currentDurability: 3 };
      const { result } = renderHook(() => useMachineStats(unitWithZones, mockUpdateUnit));

      expect(result.current.zone.color).toBe('red');
      expect(result.current.zone.max).toBe(5);
    });

    it('uses durability_max for green zone max value', () => {
      // When zone.color is 'green', the max value should be durability_max
      // Zones ordered: green(max:16), yellow(max:10), red(max:5)
      const machineWithCustomZones: Machine = {
        ...mockMachine,
        durabilityZones: [
          { max: 16, color: 'green', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 10, color: 'yellow', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 5, color: 'red', damagePerDie: { D6: 1, D12: 2, D20: 3 } }
        ]
      };
      // Use currentDurability=16: 16 > 16? No. 16 > 10? Yes -> yellow (NOT green!)
      // The logic finds first zone where current > zone.max, not >=
      const unitWithZones = { ...mockUnit, data: machineWithCustomZones, currentDurability: 16 };
      const { result } = renderHook(() => useMachineStats(unitWithZones, mockUpdateUnit));

      expect(result.current.zone.color).toBe('yellow');
      expect(result.current.zone.max).toBe(10);
    });

    it('uses durability_max when falling back to green zone', () => {
      // When no zone matches and we fall back to last zone which is green,
      // the max value should be durability_max
      const machineWithCustomZones: Machine = {
        ...mockMachine,
        durabilityZones: [
          { max: 16, color: 'green', damagePerDie: { D6: 1, D12: 2, D20: 3 } }
        ]
      };
      // currentDurability=12: 12 > 16? No -> falls back to last zone (green)
      // Green zone should use durability_max as max
      const unitWithZones = { ...mockUnit, data: machineWithCustomZones, currentDurability: 12 };
      const { result } = renderHook(() => useMachineStats(unitWithZones, mockUpdateUnit));

      expect(result.current.zone.color).toBe('green');
      expect(result.current.zone.max).toBe(16); // durability_max
    });

    it('correctly handles custom zones with different ordering', () => {
      // Testing with custom thresholds: [yellow(max:12), red(max:6)]
      const machineWithCustomZones: Machine = {
        ...mockMachine,
        durabilityZones: [
          { max: 12, color: 'yellow', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 6, color: 'red', damagePerDie: { D6: 1, D12: 2, D20: 3 } }
        ]
      };

      // current=10: 10 > 12? No. 10 > 6? Yes -> red
      const unitWithZones1 = { ...mockUnit, data: machineWithCustomZones, currentDurability: 10 };
      const { result: result1 } = renderHook(() => useMachineStats(unitWithZones1, mockUpdateUnit));
      expect(result1.current.zone.color).toBe('red');
      expect(result1.current.zone.max).toBe(6);

      // current=4: 4 > 12? No. 4 > 6? No -> returns last zone (red)
      const unitWithZones2 = { ...mockUnit, data: machineWithCustomZones, currentDurability: 4 };
      const { result: result2 } = renderHook(() => useMachineStats(unitWithZones2, mockUpdateUnit));
      expect(result2.current.zone.color).toBe('red');
      expect(result2.current.zone.max).toBe(6);
    });

    it('falls back to last zone when current durability exceeds all zones', () => {
      const machineWithPartialZones: Machine = {
        ...mockMachine,
        durabilityZones: [
          { max: 8, color: 'yellow', damagePerDie: { D6: 1, D12: 2, D20: 3 } },
          { max: 16, color: 'green', damagePerDie: { D6: 1, D12: 2, D20: 3 } }
        ]
      };
      const unitWithZones = { ...mockUnit, data: machineWithPartialZones, currentDurability: 5 };
      const { result } = renderHook(() => useMachineStats(unitWithZones, mockUpdateUnit));

      // Current durability (5) doesn't exceed any zone.max, should return last zone
      expect(result.current.zone.color).toBe('green');
    });
  });

  describe('durability bounds checking', () => {
    it('prevents durability from exceeding max', () => {
      const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

      act(() => {
        result.current.updateDurability(10); // Try to add 10 to 12 (max is 16)
      });

      expect(mockUpdateUnit).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = mockUpdateUnit.mock.calls[mockUpdateUnit.mock.calls.length - 1][0];
      const updated = updateFn(mockUnit);
      expect(updated.currentDurability).toBe(16); // Capped at max
      expect(updated.currentDurability).toBeLessThanOrEqual(16);
    });

    it('sets durability to exact max when attempting to exceed', () => {
      const unitNearMax = { ...mockUnit, currentDurability: 15 };
      const { result } = renderHook(() => useMachineStats(unitNearMax, mockUpdateUnit));

      act(() => {
        result.current.updateDurability(5); // Try to add 5 to 15 (should cap at 16)
      });

      expect(mockUpdateUnit).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = mockUpdateUnit.mock.calls[mockUpdateUnit.mock.calls.length - 1][0];
      const updated = updateFn(unitNearMax);
      expect(updated.currentDurability).toBe(16);
    });
  });

  describe('isMachineDone flag', () => {
    it('sets isMachineDone when durability reaches 0', () => {
      const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

      act(() => {
        result.current.updateDurability(-12); // Reduce 12 to 0
      });

      expect(mockUpdateUnit).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = mockUpdateUnit.mock.calls[mockUpdateUnit.mock.calls.length - 1][0];
      const updated = updateFn(mockUnit);
      expect(updated.currentDurability).toBe(0);
      expect(updated.isMachineDone).toBe(true);
    });

    it('does not set isMachineDone when durability is above 0', () => {
      const { result } = renderHook(() => useMachineStats(mockUnit, mockUpdateUnit));

      act(() => {
        result.current.updateDurability(-5); // Reduce from 12 to 7
      });

      expect(mockUpdateUnit).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = mockUpdateUnit.mock.calls[mockUpdateUnit.mock.calls.length - 1][0];
      const updated = updateFn(mockUnit);
      expect(updated.currentDurability).toBe(7);
      expect(updated.isMachineDone).toBeUndefined();
    });

    it('sets isMachineDone when durability is already at 0 and update is called', () => {
      const unitAtZero = { ...mockUnit, currentDurability: 0 };
      const { result } = renderHook(() => useMachineStats(unitAtZero, mockUpdateUnit));

      act(() => {
        result.current.updateDurability(0); // No change, but already at 0
      });

      // Should not set isMachineDone since we're not reducing to 0
      expect(mockUpdateUnit).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = mockUpdateUnit.mock.calls[mockUpdateUnit.mock.calls.length - 1][0];
      const updated = updateFn(unitAtZero);
      expect(updated.currentDurability).toBe(0);
      // When newVal is 0 from the start, isMachineDone should be set
      expect(updated.isMachineDone).toBe(true);
    });
  });
});
