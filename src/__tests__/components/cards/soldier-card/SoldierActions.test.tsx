import { render, screen, fireEvent } from '@testing-library/react';
import { SoldierActions } from '@/components/cards/soldier-card/SoldierActions';
import { SoldierActionState } from '@/components/cards/soldier-card/SoldierActions';

describe('SoldierActions - Pilot Button', () => {
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
    it('should show "К МАШИНЕ →" button for pilot', () => {
      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          onNavigateToMachine={jest.fn()}
        />
      );

      // Check for the navigation button text (visible on larger screens)
      const buttonText = screen.queryByText('К МАШИНЕ →');
      expect(buttonText).toBeInTheDocument();
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

      const buttonText = screen.getByText('К МАШИНЕ →');
      fireEvent.click(buttonText);

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

      // Should NOT contain "ДЕЙСТВИЕ" text
      const actionButton = screen.queryByText('ДЕЙСТВИЕ');
      expect(actionButton).not.toBeInTheDocument();
    });
  });

  describe('Regular soldier rendering', () => {
    it('should show "ДЕЙСТВИЕ" button for regular soldier', () => {
      render(<SoldierActions {...defaultProps} isPilot={false} />);

      const actionButton = screen.queryByText('ДЕЙСТВИЕ');
      expect(actionButton).toBeInTheDocument();
    });

    it('should not show navigation button for regular soldier', () => {
      render(<SoldierActions {...defaultProps} isPilot={false} />);

      const navigateButton = screen.queryByText('К МАШИНЕ →');
      expect(navigateButton).not.toBeInTheDocument();
    });
  });

  describe('Pilot with panic state', () => {
    it('should show panic state instead of navigation button when pilot is in panic', () => {
      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          isInPanic={true}
          onNavigateToMachine={jest.fn()}
        />
      );

      // Should show "В ПАНИКЕ"
      const panicText = screen.queryByText('В ПАНИКЕ');
      expect(panicText).toBeInTheDocument();

      // Should NOT show navigation button
      const navigateButton = screen.queryByText('К МАШИНЕ →');
      expect(navigateButton).not.toBeInTheDocument();
    });
  });

  describe('GOТОВ and УБИТЬ buttons work for pilots', () => {
    it('should render ГОТОВ button for pilot', () => {
      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          onNavigateToMachine={jest.fn()}
        />
      );

      // Check for the ГОТОВ button (accessible via aria-label)
      const doneButton = screen.getByRole('button', { name: /Завершить ход бойца/i });
      expect(doneButton).toBeInTheDocument();
    });

    it('should call onToggleDone when ГОТОВ is clicked for pilot', () => {
      const onToggleDone = jest.fn();

      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          onNavigateToMachine={jest.fn()}
          onToggleDone={onToggleDone}
        />
      );

      const doneButton = screen.getByRole('button', { name: /Завершить ход бойца/i });
      fireEvent.click(doneButton);

      expect(onToggleDone).toHaveBeenCalledTimes(1);
    });

    it('should render УБИТЬ button for pilot', () => {
      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          onNavigateToMachine={jest.fn()}
        />
      );

      // Check for the УБИТЬ button (accessible via aria-label)
      const killButton = screen.getByRole('button', { name: /Пометить бойца как убитого/i });
      expect(killButton).toBeInTheDocument();
    });

    it('should call onToggleDead when УБИТЬ is clicked for pilot', () => {
      const onToggleDead = jest.fn();

      render(
        <SoldierActions
          {...defaultProps}
          isPilot={true}
          onNavigateToMachine={jest.fn()}
          onToggleDead={onToggleDead}
        />
      );

      const killButton = screen.getByRole('button', { name: /Пометить бойца как убитого/i });
      fireEvent.click(killButton);

      expect(onToggleDead).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation button without callback', () => {
    it('should render button but onNavigateToMachine is optional', () => {
      // This should not throw an error
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
});
