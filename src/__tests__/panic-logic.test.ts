// src/__tests__/panic-logic.test.ts
import { checkPanicTrigger, executePanicTest, resolvePanic } from '@/lib/panic-logic';
import { ArmyUnit } from '@/lib/types';

describe('checkPanicTrigger', () => {
  test('returns false for squad with <50% losses', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: Array(6).fill({ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }),
      },
      deadSoldiers: [0, 1], // 2 out of 6 dead = 33%
    };
    expect(checkPanicTrigger(unit, 'community_star_system')).toBe(false);
  });

  test('returns true for squad with 50% losses (3 of 6)', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: Array(6).fill({ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }),
      },
      deadSoldiers: [0, 1, 2], // 3 out of 6 dead = 50%
    };
    expect(checkPanicTrigger(unit, 'community_star_system')).toBe(true);
  });

  test('returns false for non-community rules', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: Array(6).fill({ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }),
      },
      deadSoldiers: [0, 1, 2],
    };
    expect(checkPanicTrigger(unit, 'tehnolog')).toBe(false);
  });

  test('returns false for machines (only squads)', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'machine',
      data: {
        id: 'test-machine',
        name: 'Test Machine',
        faction: 'polaris',
        cost: 100,
        rank: 2,
        fire_rate: 2,
        ammo_max: 20,
        durability_max: 16,
        speed_sectors: [{ min_durability: 1, max_durability: 16, speed: 2 }],
        weapons: [],
      },
      currentDurability: 8,
    };
    expect(checkPanicTrigger(unit, 'community_star_system')).toBe(false);
  });

  test('returns false if panic already triggered this turn', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: Array(6).fill({ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }),
      },
      deadSoldiers: [0, 1, 2],
      panicState: [{ soldierIndex: 0, testRoll: 5, rank: 3, triggeredAtTurn: 1 }],
    };
    expect(checkPanicTrigger(unit, 'community_star_system', 1)).toBe(false);
  });
});

describe('executePanicTest', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.8); // Will roll 5 on D6
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns panic when roll > rank (roll=5, rank=3)', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const result = executePanicTest(unit, 0, 'community_star_system');
    expect(result.isPanic).toBe(true);
    expect(result.roll).toBe(5);
    expect(result.rank).toBe(3);
  });

  test('returns panic when roll == rank + 1 (roll=4, rank=3)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Will roll 4 on D6
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const result = executePanicTest(unit, 0, 'community_star_system');
    expect(result.isPanic).toBe(true); // 4 > 3
  });

  test('returns success when roll < rank (roll=2, rank=7)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.3); // Will roll 2 on D6
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const result = executePanicTest(unit, 0, 'community_star_system');
    expect(result.isPanic).toBe(false);
    expect(result.roll).toBe(2);
    expect(result.rank).toBe(7);
  });

  test('for tehnolog rules, always returns success (no panic logic)', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const result = executePanicTest(unit, 0, 'tehnolog');
    expect(result.isPanic).toBe(false);
  });
});

describe('resolvePanic', () => {
  test('removes panic states when turn increases', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
      panicState: [
        { soldierIndex: 0, testRoll: 5, rank: 3, triggeredAtTurn: 1 },
      ],
    };
    const updated = resolvePanic(unit, 2);
    expect(updated.panicState).toBeUndefined();
  });

  test('keeps panic states when turn has not increased', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
      panicState: [
        { soldierIndex: 0, testRoll: 5, rank: 3, triggeredAtTurn: 1 },
      ],
    };
    const updated = resolvePanic(unit, 1);
    expect(updated.panicState).toHaveLength(1);
  });

  test('handles units without panic state', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      },
    };
    const updated = resolvePanic(unit, 2);
    expect(updated.panicState).toBeUndefined();
  });
});
