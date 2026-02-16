import { renderHook } from '@testing-library/react';
import { useCombatFlow } from '@/hooks/useCombatFlow';

describe('useCombatFlow', () => {
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(result.current.state.phase).toBe('IDLE');
    expect(result.current.state.actionType).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('should provide all required methods', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(typeof result.current.startCombat).toBe('function');
    expect(typeof result.current.selectAction).toBe('function');
    expect(typeof result.current.setParameters).toBe('function');
    expect(typeof result.current.executeAction).toBe('function');
    expect(typeof result.current.closeCombat).toBe('function');
    expect(typeof result.current.cancelCombat).toBe('function');
    expect(typeof result.current.goBack).toBe('function');
    expect(typeof result.current.checkGrenadeTarget).toBe('function');
  });

  it('should provide derived state', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(result.current.currentPhase).toBe('IDLE');
    expect(result.current.isOpen).toBe(false);
    expect(result.current.canGoBack).toBe(false);
  });

  it('should accept startCombat call with unit', () => {
    const { result } = renderHook(() => useCombatFlow());

    // Just verify the method can be called without error
    expect(() => {
      result.current.startCombat({
        instanceId: 'test',
        type: 'squad',
        data: {
          id: 'test',
          name: 'Test',
          faction: 'polaris',
          cost: 100,
          soldiers: []
        }
      });
    }).not.toThrow();
  });

  it('should accept setParameters call', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(() => {
      result.current.setParameters({ distance: 3 });
    }).not.toThrow();
  });

  it('should accept closeCombat call', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(() => {
      result.current.closeCombat();
    }).not.toThrow();
  });

  it('should accept cancelCombat call', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(() => {
      result.current.cancelCombat();
    }).not.toThrow();
  });
});
