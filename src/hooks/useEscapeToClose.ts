import { useEffect } from 'react';

/**
 * Closes a modal/overlay when Escape is pressed.
 *
 * Place at the top of the component body, BEFORE any `if (!isOpen) return null;`
 * early return — hooks must run unconditionally. No-op while `active` is false.
 */
export function useEscapeToClose(active: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onClose]);
}
