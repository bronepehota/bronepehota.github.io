import { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Trap({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div ref={ref} tabIndex={-1} data-testid="trap">
      <button>first</button>
      <button>second</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('moves focus into the trap on open', () => {
    render(<Trap active={true} />);
    expect(document.activeElement).toBe(screen.getByText('first'));
  });

  it('wraps Tab from last → first', () => {
    render(<Trap active={true} />);
    const last = screen.getByText('second');
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('first'));
  });

  it('wraps Shift+Tab from first → last', () => {
    render(<Trap active={true} />);
    const first = screen.getByText('first');
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('second'));
  });

  it('does nothing when inactive', () => {
    render(<Trap active={false} />);
    // focus was not moved into the trap
    expect(document.activeElement).not.toBe(screen.getByText('first'));
  });
});
