import { render, screen, fireEvent } from '@testing-library/react';
import { SoldierDoneButton } from '@/components/cards/soldier-card/SoldierDoneButton';

describe('SoldierDoneButton', () => {
  const defaultProps = {
    isDone: false,
    isDead: false,
    soldierIndex: 2,
    onToggleDone: jest.fn(),
    onStartLongPress: jest.fn((cb: () => void) => cb),
    onEndLongPress: jest.fn(),
    isLongPressing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with accessible name, testid and soldier index', () => {
    render(<SoldierDoneButton {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Завершить ход бойца/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-testid', 'soldier-done-button');
    expect(button).toHaveAttribute('data-soldier-index', '2');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('reflects the done state (aria-pressed, cancel wording)', () => {
    render(<SoldierDoneButton {...defaultProps} isDone={true} />);

    const button = screen.getByRole('button', { name: /Боевых действий завершён/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('title', 'Долгое нажатие для отмены');
  });

  it('click calls onToggleDone', () => {
    render(<SoldierDoneButton {...defaultProps} />);

    fireEvent.click(screen.getByTestId('soldier-done-button'));
    expect(defaultProps.onToggleDone).toHaveBeenCalledTimes(1);
  });

  it('dead soldier: disabled, red «УБИТ» chip of full brightness, click is a no-op', () => {
    render(<SoldierDoneButton {...defaultProps} isDead={true} />);

    const button = screen.getByTestId('soldier-done-button');
    expect(button).toBeDisabled();
    // Плейтест: затемнённый «ГОТОВ» на трупе не читался как статус —
    // убитый носит красный «УБИТ» полной яркости
    expect(button).toHaveTextContent('УБИТ');
    expect(button).not.toHaveTextContent('ГОТОВ');
    expect(button).toHaveAccessibleName('Боец убит');
    expect(button.className).toContain('bg-red-950/80');
    expect(button.className).toContain('text-red-300');
    expect(button.className).not.toContain('disabled:opacity-40');
    fireEvent.click(button);
    expect(defaultProps.onToggleDone).not.toHaveBeenCalled();
  });

  it('long press on a done soldier cancels exactly once (trailing click swallowed)', () => {
    // Long-press semantics live in SoldierCard.startLongPress (600ms timer);
    // here the hook contract is mocked: onStartLongPress fires the callback
    // when the hold completes.
    const onStartLongPress = jest.fn((cb: () => void) => { cb(); });
    render(
      <SoldierDoneButton
        {...defaultProps}
        isDone={true}
        onStartLongPress={onStartLongPress}
      />
    );

    const button = screen.getByTestId('soldier-done-button');
    fireEvent.mouseDown(button);   // hold begins → callback fires (cancel done)
    fireEvent.mouseUp(button);
    fireEvent.click(button);       // trailing click after the long press

    expect(onStartLongPress).toHaveBeenCalledTimes(1);
    expect(defaultProps.onToggleDone).toHaveBeenCalledTimes(1);
  });

  it('not-done soldier: mousedown does not start a long press, click still toggles', () => {
    render(<SoldierDoneButton {...defaultProps} />);

    const button = screen.getByTestId('soldier-done-button');
    fireEvent.mouseDown(button);
    expect(defaultProps.onStartLongPress).not.toHaveBeenCalled();
    fireEvent.mouseUp(button);
    fireEvent.click(button);
    expect(defaultProps.onToggleDone).toHaveBeenCalledTimes(1);
  });
});
