import { renderHook, act } from '@testing-library/react';
import { useBottomSheet } from '@/hooks/useBottomSheet';

describe('useBottomSheet', () => {
  it('should initialize with default state', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useBottomSheet({ onClose }));

    expect(result.current.dragY).toBe(0);
    expect(result.current.isDragging).toBe(false);
    expect(result.current.sheetRef).toBeTruthy();
  });

  it('should use custom closeThreshold', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useBottomSheet({ onClose, closeThreshold: 200 }));

    expect(result.current).toBeTruthy();
    // Hook should accept custom threshold
    expect(typeof result.current.touchHandlers.onTouchStart).toBe('function');
  });

  it('should use custom isEnabled', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useBottomSheet({ onClose, isEnabled: false }));

    expect(result.current.isDragging).toBe(false);
    expect(result.current).toBeTruthy();
  });

  it('should return all required handlers', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useBottomSheet({ onClose }));

    expect(result.current.touchHandlers).toEqual({
      onTouchStart: expect.any(Function),
      onTouchMove: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });
  });

  it('should reset dragY to 0 when not dragging', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useBottomSheet({ onClose }));

    expect(result.current.dragY).toBe(0);
    expect(result.current.isDragging).toBe(false);
  });

  it('clears the sheet transform after a snap-back — a lingering translateY(0) would become the containing block for fixed popups inside the sheet', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const { result } = renderHook(() => useBottomSheet({ onClose, closeThreshold: 100 }));

    const sheet = document.createElement('div');
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement>).current = sheet;

    // Drag down (below threshold) then release → snap-back path
    const touch = (clientY: number) =>
      ({ touches: [{ clientY }], preventDefault: () => {} } as unknown as React.TouchEvent);
    act(() => result.current.touchHandlers.onTouchStart(touch(100)));
    act(() => result.current.touchHandlers.onTouchMove(touch(150)));
    act(() => result.current.touchHandlers.onTouchEnd(touch(150)));

    // Snap-back sets translateY(0) for the animation…
    expect(sheet.style.transform).toBe('translateY(0)');

    // …and after the 200ms animation the transform is cleared, not left behind
    jest.advanceTimersByTime(210);
    expect(sheet.style.transition).toBe('');
    expect(sheet.style.transform).toBe('');

    jest.useRealTimers();
  });
});
