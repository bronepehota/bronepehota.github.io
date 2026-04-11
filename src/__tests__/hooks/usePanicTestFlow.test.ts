// src/__tests__/hooks/usePanicTestFlow.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePanicTestFlow } from '@/hooks/usePanicTestFlow';

describe('usePanicTestFlow', () => {
  test('initializes with default state', () => {
    const { result } = renderHook(() => usePanicTestFlow());
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isRolling).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  test('opens modal with unit', () => {
    const { result } = renderHook(() => usePanicTestFlow());
    const mockUnit: any = {
      instanceId: 'test-1',
      type: 'squad',
      data: {
        soldiers: [
          { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
        ],
      },
    };

    act(() => {
      result.current.startPanicTest(mockUnit);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.unit).toBe(mockUnit);
  });

  test('closes modal', () => {
    const { result } = renderHook(() => usePanicTestFlow());
    const mockUnit: any = {
      instanceId: 'test-1',
      type: 'squad',
      data: { soldiers: [] },
    };

    act(() => {
      result.current.startPanicTest(mockUnit);
    });
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isModalOpen).toBe(false);
  });
});
