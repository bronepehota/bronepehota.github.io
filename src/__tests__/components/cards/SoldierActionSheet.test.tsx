import { render, screen, fireEvent } from '@testing-library/react';
import { SoldierActionSheet } from '@/components/cards/soldier-card/SoldierActionSheet';

/**
 * Лист действий бойца (2026-11-27: ⋯ на карточке убран, действия — тап по
 * фото). Строки контекстные: граната — пока доступна, захват — когда есть
 * кандидаты, эффекты/фуллскрин — всегда.
 */
const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  soldierLabel: '#1',
  squadName: 'Линейная клон-пехота',
  imageUrl: '/images/squads/polaris/x/1.png',
  actions: {
    onFullscreen: jest.fn(),
    grenade: { onClick: jest.fn() },
    onEffects: jest.fn(),
    onCapture: jest.fn(),
  },
};

describe('SoldierActionSheet — контекстные строки действий', () => {
  it('показывает все четыре строки: фуллскрин, граната, эффекты, захват', () => {
    render(<SoldierActionSheet {...baseProps} />);

    expect(screen.getByTestId('sheet-action-fullscreen')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-grenade')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-effects')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-capture')).toBeInTheDocument();
  });

  it('граната недоступна (брошена) — строки нет', () => {
    render(
      <SoldierActionSheet
        {...baseProps}
        actions={{ ...baseProps.actions, grenade: undefined }}
      />
    );

    expect(screen.queryByTestId('sheet-action-grenade')).not.toBeInTheDocument();
  });

  it('захват не показывается без обработчика (нет кандидатов)', () => {
    render(
      <SoldierActionSheet
        {...baseProps}
        actions={{ ...baseProps.actions, onCapture: undefined }}
      />
    );

    expect(screen.queryByTestId('sheet-action-capture')).not.toBeInTheDocument();
  });

  it('тап по строке: действие + закрытие листа', () => {
    const onClose = jest.fn();
    const grenade = { onClick: jest.fn() };
    render(
      <SoldierActionSheet
        {...baseProps}
        onClose={onClose}
        actions={{ ...baseProps.actions, grenade }}
      />
    );

    fireEvent.click(screen.getByTestId('sheet-action-grenade'));
    expect(grenade.onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('закрыт (isOpen=false) — не рендерится', () => {
    render(<SoldierActionSheet {...baseProps} isOpen={false} />);

    expect(screen.queryByTestId('soldier-action-sheet')).not.toBeInTheDocument();
  });

  it('строки ≥44px — тач-минимум (мобильный первый)', () => {
    render(<SoldierActionSheet {...baseProps} />);

    for (const key of ['fullscreen', 'grenade', 'effects', 'capture']) {
      expect(screen.getByTestId(`sheet-action-${key}`)).toHaveClass('min-h-[48px]');
    }
  });
});
