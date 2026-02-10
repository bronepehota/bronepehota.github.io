// src/__tests__/panic-logic.test.ts
import { checkPanicTrigger } from '@/lib/panic-logic';
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
    expect(checkPanicTrigger(unit, 'fan')).toBe(false);
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
    expect(checkPanicTrigger(unit, 'fan')).toBe(true);
  });

  test('returns false for non-fan rules', () => {
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
    expect(checkPanicTrigger(unit, 'fan')).toBe(false);
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
    expect(checkPanicTrigger(unit, 'fan', 1)).toBe(false);
  });
});
