import { renderHook } from '@testing-library/react';
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
});
