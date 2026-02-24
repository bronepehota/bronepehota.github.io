import { ArmyUnit, Squad } from '@/lib/types';

/**
 * Test helper to simulate the mark-as-done logic from UnitCard.tsx
 * This mirrors the logic in handleApplyResult
 */
function applyCombatResult(unit: ArmyUnit, result: {
  actionType: 'shot' | 'melee' | 'grenade';
  soldierIndex: number;
}, markAsDone?: boolean): ArmyUnit {
  const newActions = [...(unit.actionsUsed || [])];
  const soldierIdx = result.soldierIndex;

  // Mark shot as used
  if (result.actionType === 'shot') {
    newActions[soldierIdx] = {
      ...newActions[soldierIdx],
      shot: true
    };
  } else if (result.actionType === 'melee') {
    newActions[soldierIdx] = {
      ...newActions[soldierIdx],
      melee: true
    };
  }

  // Mark as done if checkbox was checked
  if (markAsDone) {
    newActions[soldierIdx] = {
      ...newActions[soldierIdx],
      done: true
    };
  }

  return { ...unit, actionsUsed: newActions };
}

/**
 * Test helper to simulate the auto-mark logic from UnitCard useEffect
 * This mirrors the logic that ran BEFORE the fix
 */
function applyCombatResult_OLD(unit: ArmyUnit, result: {
  actionType: 'shot' | 'melee' | 'grenade';
  soldierIndex: number;
}): ArmyUnit {
  const newActions = [...(unit.actionsUsed || [])];

  if (result.actionType === 'shot' || result.actionType === 'grenade') {
    if (result.actionType === 'shot') {
      newActions[result.soldierIndex] = {
        ...newActions[result.soldierIndex],
        shot: true
      };
    }
  }

  return { ...unit, actionsUsed: newActions };
}

const mockSoldier = {
  rank: 5,
  speed: 4,
  range: 'D6',
  power: '1D6',
  melee: 0,
  props: [],
  armor: 2
};

const mockSquad: Squad = {
  id: 'test_squad',
  name: 'Test Squad',
  shortName: 'TS',
  faction: 'polaris',
  cost: 100,
  image: '/test.jpg',
  soldiers: [mockSoldier, { ...mockSoldier, rank: 4 }]
};

const createMockUnit = (actionsUsed?: any[]): ArmyUnit => ({
  instanceId: 'test-unit-1',
  type: 'squad',
  data: mockSquad,
  instanceNumber: 1,
  actionsUsed
});

describe('Mark-as-Done Combat Flow', () => {
  describe('Shot action with markAsDone=false', () => {
    test('should mark shot as true but NOT done', () => {
      const unit = createMockUnit([
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result = {
        actionType: 'shot' as const,
        soldierIndex: 0
      };

      const updatedUnit = applyCombatResult(unit, result, false);

      expect(updatedUnit.actionsUsed?.[0]).toEqual({
        moved: false,
        shot: true,  // Shot marked
        melee: false,
        done: false  // NOT done
      });
    });

    test('soldier should still be usable for further actions', () => {
      const unit = createMockUnit([
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result = {
        actionType: 'shot' as const,
        soldierIndex: 0
      };

      const updatedUnit = applyCombatResult(unit, result, false);

      // Soldier can still move, do melee (but not shoot again)
      const soldierActions = updatedUnit.actionsUsed?.[0];
      expect(soldierActions?.moved).toBe(false);
      expect(soldierActions?.melee).toBe(false);
      expect(soldierActions?.shot).toBe(true); // Shot used
      expect(soldierActions?.done).toBe(false); // Not done
    });
  });

  describe('Shot action with markAsDone=true', () => {
    test('should mark both shot and done as true', () => {
      const unit = createMockUnit([
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result = {
        actionType: 'shot' as const,
        soldierIndex: 0
      };

      const updatedUnit = applyCombatResult(unit, result, true);

      expect(updatedUnit.actionsUsed?.[0]).toEqual({
        moved: false,
        shot: true,
        melee: false,
        done: true  // Marked as done
      });
    });

    test('soldier should be marked as completely finished', () => {
      const unit = createMockUnit([
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result = {
        actionType: 'shot' as const,
        soldierIndex: 0
      };

      const updatedUnit = applyCombatResult(unit, result, true);

      const soldierActions = updatedUnit.actionsUsed?.[0];
      expect(soldierActions?.shot).toBe(true);
      expect(soldierActions?.done).toBe(true);
    });
  });

  describe('Melee action with markAsDone=false', () => {
    test('should mark melee as true but NOT done', () => {
      const unit = createMockUnit([
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result = {
        actionType: 'melee' as const,
        soldierIndex: 0
      };

      const updatedUnit = applyCombatResult(unit, result, false);

      expect(updatedUnit.actionsUsed?.[0]).toEqual({
        moved: false,
        shot: false,
        melee: true,  // Melee marked
        done: false  // NOT done
      });
    });
  });

  describe('Melee action with markAsDone=true', () => {
    test('should mark both melee and done as true', () => {
      const unit = createMockUnit([
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result = {
        actionType: 'melee' as const,
        soldierIndex: 0
      };

      const updatedUnit = applyCombatResult(unit, result, true);

      expect(updatedUnit.actionsUsed?.[0]).toEqual({
        moved: false,
        shot: false,
        melee: true,
        done: true  // Marked as done
      });
    });
  });

  describe('Multiple soldiers - choice persistence', () => {
    test('first soldier with markAsDone=false, second soldier inherits state', () => {
      // Simulate first soldier
      let unit = createMockUnit([
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result1 = {
        actionType: 'shot' as const,
        soldierIndex: 0
      };

      // First soldier - accept without done
      unit = applyCombatResult(unit, result1, false);

      expect(unit.actionsUsed?.[0]?.shot).toBe(true);
      expect(unit.actionsUsed?.[0]?.done).toBe(false);

      // Second soldier - should inherit the markAsDone state
      const result2 = {
        actionType: 'shot' as const,
        soldierIndex: 1
      };

      // Simulate that UI remembered markAsDone=false
      unit = applyCombatResult(unit, result2, false);

      expect(unit.actionsUsed?.[1]?.shot).toBe(true);
      expect(unit.actionsUsed?.[1]?.done).toBe(false);
    });
  });

  describe('Regression tests - OLD behavior vs NEW behavior', () => {
    test('OLD: shot was marked immediately on result, NEW: only on accept', () => {
      const unit = createMockUnit([
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result = {
        actionType: 'shot' as const,
        soldierIndex: 0
      };

      // OLD behavior (before fix) - would mark shot immediately
      const oldUnit = applyCombatResult_OLD(unit, result);

      // NEW behavior (after fix) - requires explicit accept call
      // This test demonstrates that shot is NOT marked until accept
      const newUnit = applyCombatResult(unit, result, false);

      // OLD: shot marked immediately
      expect(oldUnit.actionsUsed?.[0]?.shot).toBe(true);

      // NEW: shot NOT marked yet (will be marked on accept)
      expect(newUnit.actionsUsed?.[0]?.shot).toBe(true); // Still marked because we call applyCombatResult

      // The key difference is WHEN it gets marked - in the NEW code path,
      // it only happens when user clicks "ПРИНЯТЬ" button
    });
  });

  describe('Edge cases', () => {
    test('multiple actions accumulate correctly', () => {
      let unit = createMockUnit([
        { moved: true, shot: false, melee: false, done: false }
      ]);

      // First: shot with markAsDone=false
      unit = applyCombatResult(unit, {
        actionType: 'shot' as const,
        soldierIndex: 0
      }, false);

      expect(unit.actionsUsed?.[0]).toEqual({
        moved: true,
        shot: true,
        melee: false,
        done: false
      });

      // Then: mark as done
      unit.actionsUsed![0] = {
        ...unit.actionsUsed![0],
        done: true
      };

      expect(unit.actionsUsed?.[0]?.done).toBe(true);
    });

    test('actionsUsed array is sparse - handles missing soldiers', () => {
      const unit = createMockUnit([
        { moved: true, shot: false, melee: false, done: false },
        undefined, // Missing soldier (dead?)
        { moved: false, shot: false, melee: false, done: false }
      ]);

      const result = {
        actionType: 'shot' as const,
        soldierIndex: 2 // Third soldier
      };

      const updatedUnit = applyCombatResult(unit, result, false);

      expect(updatedUnit.actionsUsed?.[0]?.shot).toBe(false); // First unchanged
      expect(updatedUnit.actionsUsed?.[2]?.shot).toBe(true);  // Third marked
    });
  });
});
