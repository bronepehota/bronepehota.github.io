// src/__tests__/panic-types.test.ts
import { PanicState, PanicTestResult } from '@/lib/types';

describe('Panic Types', () => {
  test('PanicState interface exists and has correct fields', () => {
    const panicState: PanicState = {
      soldierIndex: 0,
      testRoll: 5,
      rank: 3,
      triggeredAtTurn: 1,
    };
    expect(panicState.soldierIndex).toBe(0);
    expect(panicState.testRoll).toBe(5);
    expect(panicState.rank).toBe(3);
    expect(panicState.triggeredAtTurn).toBe(1);
  });

  test('PanicTestResult interface exists', () => {
    const result: PanicTestResult = {
      soldierIndex: 0,
      isPanic: true,
      roll: 5,
      rank: 3,
    };
    expect(result.isPanic).toBe(true);
  });
});
