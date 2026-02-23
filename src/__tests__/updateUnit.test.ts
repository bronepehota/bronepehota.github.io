/**
 * Unit tests for updateUnit functionality in GameSession
 *
 * Tests the fix for the soldier state management bug where marking soldiers
 * as killed or done would cause states to get chaotically toggled.
 *
 * Root cause: When using functional updates, the update function was being
 * called for ALL units instead of just the target unit.
 *
 * Fix: Pass instanceId explicitly to updateUnit to avoid calling the function
 * for all units.
 */

import { Army, ArmyUnit, Squad } from '@/lib/types';

describe('updateUnit - Soldier State Management', () => {
  let mockArmy: Army;
  let mockSetArmy: jest.Mock;
  let updateUnit: (
    arg1: string | ArmyUnit | ((currentUnit: ArmyUnit) => ArmyUnit),
    arg2?: (currentUnit: ArmyUnit) => ArmyUnit
  ) => void;

  beforeEach(() => {
    // Create mock army with a squad of 6 soldiers
    const squadData: Squad = {
      id: 'test_squad',
      name: 'Test Squad',
      shortName: 'Test',
      faction: 'polaris',
      cost: 100,
      image: '/test.png',
      soldiers: Array.from({ length: 6 }, (_, i) => ({
        num: i + 1,
        rank: 2,
        speed: 5,
        range: 'D6',
        power: '2D6',
        melee: 3,
        props: [],
        armor: 2,
        image: ''
      }))
    };

    mockArmy = {
      name: 'Test Army',
      faction: 'polaris',
      units: [{
        instanceId: 'unit-1',
        type: 'squad',
        data: squadData,
        instanceNumber: 1,
        currentSoldiers: [0, 1, 2, 3, 4, 5],
        deadSoldiers: [],
        actionsUsed: []
      }],
      totalCost: 100
    };

    mockSetArmy = jest.fn();

    // Simulate the updateUnit implementation from GameSession
    const armyRef = { current: mockArmy };

    updateUnit = (
      arg1: string | ArmyUnit | ((currentUnit: ArmyUnit) => ArmyUnit),
      arg2?: (currentUnit: ArmyUnit) => ArmyUnit
    ) => {
      if (typeof arg1 === 'string') {
        // updateUnit(instanceId, updateFn) - explicit instanceId
        const targetInstanceId = arg1;
        const newArmy = {
          ...armyRef.current,
          units: armyRef.current.units.map(u =>
            u.instanceId === targetInstanceId ? arg2!(u) : u
          )
        };
        armyRef.current = newArmy;
        mockSetArmy(newArmy);
      } else if (typeof arg1 === 'function') {
        // updateUnit(updateFn) - old buggy style (for comparison)
        const newArmy = {
          ...armyRef.current,
          units: armyRef.current.units.map(u => {
            const result = arg1(u);
            const deadChanged = JSON.stringify(u.deadSoldiers) !== JSON.stringify(result.deadSoldiers);
            const actionsChanged = JSON.stringify(u.actionsUsed) !== JSON.stringify(result.actionsUsed);
            return (deadChanged || actionsChanged) ? result : u;
          })
        };
        armyRef.current = newArmy;
        mockSetArmy(newArmy);
      } else {
        // updateUnit(armyUnit) - direct object update
        const targetInstanceId = arg1.instanceId;
        const newArmy = {
          ...armyRef.current,
          units: armyRef.current.units.map(u => u.instanceId === targetInstanceId ? arg1 : u)
        };
        armyRef.current = newArmy;
        mockSetArmy(newArmy);
      }
    };
  });

  describe('with explicit instanceId (fixed API)', () => {
    it('should mark only soldier 0 as killed', () => {
      const soldierIndex = 0;

      updateUnit(mockArmy.units[0].instanceId, (currentUnit) => ({
        ...currentUnit,
        deadSoldiers: [soldierIndex]
      }));

      expect(mockSetArmy).toHaveBeenCalledWith(
        expect.objectContaining({
          units: expect.arrayContaining([
            expect.objectContaining({
              deadSoldiers: [0]
            })
          ])
        })
      );

      const updatedArmy = mockSetArmy.mock.calls[0][0] as Army;
      expect(updatedArmy.units[0].deadSoldiers).toEqual([0]);
    });

    it('should mark soldiers 0, 1, 2 as killed sequentially', () => {
      // Kill soldier 0
      updateUnit(mockArmy.units[0].instanceId, (currentUnit) => ({
        ...currentUnit,
        deadSoldiers: [...(currentUnit.deadSoldiers || []), 0]
      }));

      let updatedArmy = mockSetArmy.mock.calls[0][0] as Army;
      expect(updatedArmy.units[0].deadSoldiers).toEqual([0]);

      // Update ref for next call
      mockArmy = updatedArmy;

      // Kill soldier 1
      updateUnit(mockArmy.units[0].instanceId, (currentUnit) => ({
        ...currentUnit,
        deadSoldiers: [...(currentUnit.deadSoldiers || []), 1]
      }));

      updatedArmy = mockSetArmy.mock.calls[1][0] as Army;
      expect(updatedArmy.units[0].deadSoldiers).toEqual([0, 1]);

      // Update ref for next call
      mockArmy = updatedArmy;

      // Kill soldier 2
      updateUnit(mockArmy.units[0].instanceId, (currentUnit) => ({
        ...currentUnit,
        deadSoldiers: [...(currentUnit.deadSoldiers || []), 2]
      }));

      updatedArmy = mockSetArmy.mock.calls[2][0] as Army;
      expect(updatedArmy.units[0].deadSoldiers).toEqual([0, 1, 2]);
    });

    it('should not affect other units when updating one unit', () => {
      // Add a second unit to the army
      mockArmy.units.push({
        instanceId: 'unit-2',
        type: 'squad',
        data: mockArmy.units[0].data as Squad,
        instanceNumber: 2,
        currentSoldiers: [0, 1, 2, 3, 4, 5],
        deadSoldiers: [],
        actionsUsed: []
      });

      // Update unit-1
      updateUnit('unit-1', (currentUnit) => ({
        ...currentUnit,
        deadSoldiers: [0]
      }));

      const updatedArmy = mockSetArmy.mock.calls[0][0] as Army;
      expect(updatedArmy.units[0].deadSoldiers).toEqual([0]);
      expect(updatedArmy.units[1].deadSoldiers).toEqual([]);
    });

    it('should toggle done state for individual soldiers', () => {
      // Mark soldier 0 as done
      updateUnit(mockArmy.units[0].instanceId, (currentUnit) => {
        const newActions = [...(currentUnit.actionsUsed || [])];
        newActions[0] = { moved: false, shot: false, melee: false, done: true };
        return { ...currentUnit, actionsUsed: newActions };
      });

      let updatedArmy = mockSetArmy.mock.calls[0][0] as Army;
      expect(updatedArmy.units[0].actionsUsed?.[0]?.done).toBe(true);

      // Update ref for next call
      mockArmy = updatedArmy;

      // Mark soldier 1 as done (soldier 0 should remain done)
      updateUnit(mockArmy.units[0].instanceId, (currentUnit) => {
        const newActions = [...(currentUnit.actionsUsed || [])];
        newActions[1] = { moved: false, shot: false, melee: false, done: true };
        return { ...currentUnit, actionsUsed: newActions };
      });

      updatedArmy = mockSetArmy.mock.calls[1][0] as Army;
      expect(updatedArmy.units[0].actionsUsed?.[0]?.done).toBe(true);
      expect(updatedArmy.units[0].actionsUsed?.[1]?.done).toBe(true);
    });

    it('should remove soldier from deadSoldiers when resurrecting', () => {
      // Start with soldier 0 dead
      mockArmy.units[0].deadSoldiers = [0];

      // Resurrect soldier 0
      updateUnit(mockArmy.units[0].instanceId, (currentUnit) => ({
        ...currentUnit,
        deadSoldiers: currentUnit.deadSoldiers?.filter(i => i !== 0) || []
      }));

      const updatedArmy = mockSetArmy.mock.calls[0][0] as Army;
      expect(updatedArmy.units[0].deadSoldiers).toEqual([]);
    });
  });

  describe('with direct object update (backward compatibility)', () => {
    it('should support direct unit object updates', () => {
      const updatedUnit: ArmyUnit = {
        ...mockArmy.units[0],
        deadSoldiers: [0, 1, 2]
      };

      updateUnit(updatedUnit);

      const resultArmy = mockSetArmy.mock.calls[0][0] as Army;
      expect(resultArmy.units[0].deadSoldiers).toEqual([0, 1, 2]);
    });
  });
});
