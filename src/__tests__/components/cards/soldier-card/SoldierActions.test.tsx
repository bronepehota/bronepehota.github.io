import { render, screen, fireEvent } from '@testing-library/react';
import { SoldierActions } from '@/components/cards/soldier-card/SoldierActions';
import { SoldierActionState } from '@/components/cards/soldier-card/SoldierActions';

describe('SoldierActions', () => {
  const defaultProps = {
    isDead: false,
    isDone: false,
    isInPanic: false,
    actions: { moved: false, shot: false, melee: false, done: false } as SoldierActionState,
    onActionClick: jest.fn(),
    onToggleDone: jest.fn(),
    onToggleDead: jest.fn(),
    soldierIndex: 0,
    onStartLongPress: jest.fn(),
    onEndLongPress: jest.fn(),
    isLongPressing: false
  };

  describe('Pilot soldier rendering', () => {
    it('should show navigation button for pilot', () => {
      const onNavigateToMachine = jest.fn();
      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          onNavigateToMachine={onNavigateToMachine}
        />
      );

      // Pilot shows navigation button (ArrowRightCircle icon, aria-label)
      const navButton = screen.getByLabelText('Перейти к машине');
      expect(navButton).toBeInTheDocument();
    });

    it('should call onNavigateToMachine when pilot clicks navigation button', () => {
      const onNavigateToMachine = jest.fn();
      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          onNavigateToMachine={onNavigateToMachine}
        />
      );

      const navButton = screen.getByLabelText('Перейти к машине');
      fireEvent.click(navButton);

      expect(onNavigateToMachine).toHaveBeenCalledTimes(1);
    });

    it('should not show action button for pilot', () => {
      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          onNavigateToMachine={jest.fn()}
        />
      );

      // Should NOT contain "ДЕЙСТВИЕ" text (button was removed)
      const actionButton = screen.queryByText('ДЕЙСТВИЕ');
      expect(actionButton).not.toBeInTheDocument();
    });
  });

  describe('Regular soldier rendering', () => {
    it('should show ГОТОВ and УБИТЬ buttons for regular soldier', () => {
      render(<SoldierActions {...defaultProps} isPilot={false} />);

      const doneButton = screen.getByRole('button', { name: /Завершить ход бойца/i });
      expect(doneButton).toBeInTheDocument();
      const killButton = screen.getByRole('button', { name: /Пометить бойца как убитого/i });
      expect(killButton).toBeInTheDocument();
    });

    it('should not show action button (removed)', () => {
      render(<SoldierActions {...defaultProps} isPilot={false} />);

      const actionButton = screen.queryByText('ДЕЙСТВИЕ');
      expect(actionButton).not.toBeInTheDocument();
    });

    it('should not show navigation button for regular soldier', () => {
      render(<SoldierActions {...defaultProps} isPilot={false} />);

      const navigateButton = screen.queryByLabelText('Перейти к машине');
      expect(navigateButton).not.toBeInTheDocument();
    });
  });

  describe('Pilot with panic state', () => {
    it('should still show navigation button for pilot even in panic (navigation takes priority)', () => {
      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          isInPanic={true}
          onNavigateToMachine={jest.fn()}
        />
      );

      // Pilot navigation takes priority over panic display
      const navigateButton = screen.getByLabelText('Перейти к машине');
      expect(navigateButton).toBeInTheDocument();
    });
  });

  describe('Navigation button without callback', () => {
    it('should render button but onNavigateToMachine is optional', () => {
      expect(() => {
        render(
          <SoldierActions
            {...defaultProps}
            isPilot={true}
            onNavigateToMachine={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Panic state rendering', () => {
    it('should show УБИТЬ button in panic state', () => {
      render(<SoldierActions {...defaultProps} isInPanic={true} />);

      expect(screen.getByTestId('soldier-kill-button')).toBeInTheDocument();
    });

    it('should NOT show ГОТОВ button in panic state', () => {
      render(<SoldierActions {...defaultProps} isInPanic={true} />);

      expect(screen.queryByTestId('soldier-done-button')).not.toBeInTheDocument();
    });

    it('should call onToggleDead when clicking УБИТЬ in panic state', () => {
      const onToggleDead = jest.fn();
      render(
        <SoldierActions {...defaultProps} isInPanic={true} onToggleDead={onToggleDead} />
      );

      fireEvent.click(screen.getByTestId('soldier-kill-button'));

      expect(onToggleDead).toHaveBeenCalledTimes(1);
    });

    it('should still render УБИТЬ (killed state) when panicking and dead', () => {
      render(<SoldierActions {...defaultProps} isInPanic={true} isDead={true} />);

      const killButton = screen.getByTestId('soldier-kill-button');
      expect(killButton).toBeInTheDocument();
      expect(killButton).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
