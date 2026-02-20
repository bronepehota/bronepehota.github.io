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
    expect(typeof result.current.handlers.onMouseDown).toBe('function');
    expect(typeof result.current.handlers.onMouseUp).toBe('function');
    expect(typeof result.current.handlers.onMouseLeave).toBe('function');
    expect(typeof result.current.handlers.onTouchStart).toBe('function');
    expect(typeof result.current.handlers.onTouchEnd).toBe('function');
    expect(typeof result.current.handlers.onTouchMove).toBe('function');
  });

  it('should use default delay of 500ms', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    expect(result.current.isPressed).toBe(true);
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('should use custom delay when provided', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, delay: 1000 }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
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
    const { result } = renderHook(() => useLongPress({ onLongPress, delay: 500 }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    act(() => {
      result.current.handlers.onMouseUp();
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.isPressed).toBe(false);
  });

  it('should call onLongPress after delay if not released', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, delay: 500 }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(result.current.isPressed).toBe(false);
  });

  it('should cancel long press on mouse leave', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, delay: 500 }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    act(() => {
      result.current.handlers.onMouseLeave();
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.isPressed).toBe(false);
  });

  it('should cancel long press on touch move', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, delay: 500 }));

    act(() => {
      result.current.handlers.onTouchStart({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    act(() => {
      result.current.handlers.onTouchMove();
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(result.current.isPressed).toBe(false);
  });

  it('should work with touch events', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, delay: 500 }));

    act(() => {
      result.current.handlers.onTouchStart({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('should call onClick for short press', () => {
    const onLongPress = jest.fn();
    const onClick = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick, delay: 500 }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      result.current.handlers.onMouseUp();
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick for long press', () => {
    const onLongPress = jest.fn();
    const onClick = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, onClick, delay: 500 }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    act(() => {
      result.current.handlers.onMouseUp();
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should set isPressed to true during press and false after', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, delay: 500 }));

    expect(result.current.isPressed).toBe(false);

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    expect(result.current.isPressed).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.isPressed).toBe(false);
  });

  it('should cancel previous timer if press starts again', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, delay: 500 }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Start new press before first completes
    act(() => {
      result.current.handlers.onMouseUp();
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // First press was cancelled, second press at 200ms shouldn't trigger yet
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Second press completes at 500ms
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('should handle onLongPressEnd callback', () => {
    const onLongPress = jest.fn();
    const onLongPressEnd = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, onLongPressEnd, delay: 500 }));

    act(() => {
      result.current.handlers.onMouseDown({ preventDefault: jest.fn() } as any);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPressEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isPressed).toBe(false);
  });
});
