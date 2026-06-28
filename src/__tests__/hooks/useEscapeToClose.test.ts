import { renderHook } from '@testing-library/react';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';

const escape = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

describe('useEscapeToClose', () => {
  it('calls onClose on Escape when active', () => {
    const onClose = jest.fn();
    renderHook(() => useEscapeToClose(true, onClose));
    escape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does nothing when inactive', () => {
    const onClose = jest.fn();
    renderHook(() => useEscapeToClose(false, onClose));
    escape();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores non-Escape keys', () => {
    const onClose = jest.fn();
    renderHook(() => useEscapeToClose(true, onClose));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', () => {
    const onClose = jest.fn();
    const { unmount } = renderHook(() => useEscapeToClose(true, onClose));
    unmount();
    escape();
    expect(onClose).not.toHaveBeenCalled();
  });
});
