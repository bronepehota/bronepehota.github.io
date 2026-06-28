import { useEffect, RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Trap keyboard focus inside `ref` while `active` (open). On open, focus moves to the
 * first focusable element (or the container if none — give it tabIndex={-1}); Tab wraps
 * from last→first and Shift+Tab from first→last. On close, focus is restored to the
 * element that had it before the trap opened (the trigger).
 *
 * Attach `ref` to the modal's inner panel (NOT the fixed backdrop overlay).
 */
export function useFocusTrap<T extends HTMLElement>(
  ref: RefObject<T>,
  active: boolean,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));

    // Move focus into the trap on open.
    const items = focusables();
    if (items.length > 0) items[0].focus();
    else el.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', handler);
    return () => {
      el.removeEventListener('keydown', handler);
      previouslyFocused?.focus?.();
    };
  }, [ref, active]);
}
