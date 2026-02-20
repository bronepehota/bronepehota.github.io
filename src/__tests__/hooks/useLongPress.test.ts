import { renderHook, act } from '@testing-library/react';
import { useLongPress } from '@/hooks/useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with default state', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress }));

    expect(result.current.isPressed).toBe(false);
    expect(typeof result.current.onMouseDown).toBe('function');
    expect(typeof result.current.onMouseUp).toBe('function');
    expect(typeof result.current.onMouseLeave).toBe('function');
    expect(typeof result.current.onTouchStart).toBe('function');
    expect(typeof result.current.onTouchEnd).toBe('function');
  });

  it('should use default delay of 600ms', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress }));

    act(() => {
      result.current.onMouseDown();
    });

    expect(result.current.isPressed).toBe(true);
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('should use custom ms when provided', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 1000 }));

    act(() => {
      result.current.onMouseDown();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onLongPress if released before delay', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 600 }));

    act(() => {
      result.current.onMouseDown();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    act(() => {
      result.current.onMouseUp();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.isPressed).toBe(false);
  });

  it('should call onLongPress after delay if not released', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 600 }));

    act(() => {
      result.current.onMouseDown();
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(result.current.isPressed).toBe(false);
  });

  it('should cancel long press on mouse leave', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 600 }));

    act(() => {
      result.current.onMouseDown();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    act(() => {
      result.current.onMouseLeave();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.isPressed).toBe(false);
  });

  it('should work with touch events', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 600 }));

    act(() => {
      result.current.onTouchStart();
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('should cancel long press on touch end before delay', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 600 }));

    act(() => {
      result.current.onTouchStart();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    act(() => {
      result.current.onTouchEnd();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.isPressed).toBe(false);
  });

  it('should set isPressed to true during press and false after', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 600 }));

    expect(result.current.isPressed).toBe(false);

    act(() => {
      result.current.onMouseDown();
    });

    expect(result.current.isPressed).toBe(true);

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current.isPressed).toBe(false);
  });

  it('should cancel previous timer if press starts again', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 600 }));

    act(() => {
      result.current.onMouseDown();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Start new press before first completes
    act(() => {
      result.current.onMouseUp();
      result.current.onMouseDown();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // First press was cancelled, second press at 300ms shouldn't trigger yet
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Second press completes at 600ms
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('should call onLongPress with no parameters', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, ms: 600 }));

    act(() => {
      result.current.onMouseDown();
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalledWith();
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('should return flat structure with all handlers at root', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress }));

    // Verify all handlers exist at root level
    expect(result.current).toHaveProperty('onMouseDown');
    expect(result.current).toHaveProperty('onMouseUp');
    expect(result.current).toHaveProperty('onMouseLeave');
    expect(result.current).toHaveProperty('onTouchStart');
    expect(result.current).toHaveProperty('onTouchEnd');
    expect(result.current).toHaveProperty('isPressed');

    // Verify handlers is NOT present
    expect(result.current).not.toHaveProperty('handlers');
  });
});
