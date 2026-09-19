import { render, screen, fireEvent } from '@testing-library/react';
import { SoldierActions } from '@/components/cards/soldier-card/SoldierActions';

/**
 * Кнопка «череп» убрана (решение владельца 2026-09-19): убить/оживить —
 * только свайп вправо по карточке (useCardSwipe). Колонка живёт лишь для
 * особых состояний: пилот → навигация к машине, паника → индикатор.
 */
describe('SoldierActions', () => {
  const defaultProps = {
    isDead: false,
    isInPanic: false,
  };

  describe('Regular soldier rendering', () => {
    it('renders nothing — the kill button is gone, right swipe is the only kill path', () => {
      const { container } = render(<SoldierActions {...defaultProps} />);
      // Никакой пустой колонки на 44px — компонент не занимает места
      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByTestId('soldier-kill-button')).not.toBeInTheDocument();
      // The done button lives on the image (SoldierDoneButton), not here
      expect(screen.queryByTestId('soldier-done-button')).not.toBeInTheDocument();
    });

    it('renders nothing for a dead regular soldier either (resurrect is a swipe)', () => {
      const { container } = render(<SoldierActions {...defaultProps} isDead={true} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('does not render the legacy action button', () => {
      render(<SoldierActions {...defaultProps} />);
      expect(screen.queryByText('ДЕЙСТВИЕ')).not.toBeInTheDocument();
    });
  });

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

    it('should not show kill button for pilot', () => {
      render(
        <SoldierActions {...defaultProps} isPilot={true} onNavigateToMachine={jest.fn()} />
      );

      expect(screen.queryByTestId('soldier-kill-button')).not.toBeInTheDocument();
    });

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
    it('should show the Footprints indicator in panic state (kill is a right swipe)', () => {
      render(<SoldierActions {...defaultProps} isInPanic={true} />);

      expect(screen.getByTestId('panic-indicator')).toBeInTheDocument();
      expect(screen.queryByTestId('soldier-kill-button')).not.toBeInTheDocument();
    });

    it('should NOT show ГОТОВ button in panic state', () => {
      render(<SoldierActions {...defaultProps} isInPanic={true} />);

      expect(screen.queryByTestId('soldier-done-button')).not.toBeInTheDocument();
    });

    it('should render nothing when panicking and dead (skull overlay on photo carries the status)', () => {
      const { container } = render(
        <SoldierActions {...defaultProps} isInPanic={true} isDead={true} />
      );

      expect(container).toBeEmptyDOMElement();
    });
  });
});
