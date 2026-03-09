import { renderHook, act, waitFor } from '@testing-library/react';
import { useUnitCardState } from '@/components/cards/unit-card/hooks/useUnitCardState';
import { ArmyUnit, Squad } from '@/lib/types';

describe('useUnitCardState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'squad',
    data: {} as Squad,
  };

  it('initializes with default states', () => {
    const { result } = renderHook(() => useUnitCardState(mockUnit));

    expect(result.current.showImage).toBe(false);
    expect(result.current.showDetailsModal).toBe(false);
    expect(result.current.showPilotModal).toBe(false);
    expect(result.current.pilotSurvivalTest).toBe(null);
  });

  it('loads rules version from localStorage', async () => {
    localStorage.setItem('bronepehota_rules_version', 'tehnolog');

    const { result } = renderHook(() => useUnitCardState(mockUnit));

    await waitFor(() => {
      expect(result.current.rulesVersion).toBe('tehnolog');
    });
  });

  it('provides state setters', () => {
    const { result } = renderHook(() => useUnitCardState(mockUnit));

    act(() => {
      result.current.setShowImage(true);
    });

    expect(result.current.showImage).toBe(true);
  });

  it('provides setPilotSurvivalTest setter', () => {
    const { result } = renderHook(() => useUnitCardState(mockUnit));

    const testResult = { roll: 12, survived: true, testedAt: Date.now() };

    act(() => {
      result.current.setPilotSurvivalTest(testResult);
    });

    expect(result.current.pilotSurvivalTest).toEqual(testResult);
  });
});
