// src/__tests__/army-unit-panic.test.ts
import { ArmyUnit, PanicState } from '@/lib/types';

describe('ArmyUnit panic integration', () => {
  test('ArmyUnit accepts panicState field', () => {
    const unit: ArmyUnit = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        id: 'test-squad',
        name: 'Test Squad',
        faction: 'polaris',
        cost: 100,
        soldiers: [{ rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }],
      },
      panicState: [
        { soldierIndex: 0, testRoll: 5, rank: 3, triggeredAtTurn: 1 },
      ],
    };
    expect(unit.panicState).toHaveLength(1);
    expect(unit.panicState?.[0].soldierIndex).toBe(0);
  });
});
