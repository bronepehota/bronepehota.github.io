import { render, screen, fireEvent, act } from '@testing-library/react';
import { SoldierActionSheet } from '@/components/cards/soldier-card/SoldierActionSheet';

/**
 * Лист действий бойца — полная консоль состояния (2026-11-27: чип «ГОТОВ»
 * с фото убран, готов/убит переехали в лист; убой — двухтаповое
 * подтверждение против случайного тапа).
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
    onToggleDone: jest.fn(),
    onToggleDead: jest.fn(),
  },
};

describe('SoldierActionSheet — контекстные строки по состоянию', () => {
  it('активный: полный набор — фуллскрин/граната/эффекты/захват/готов/убит', () => {
    render(<SoldierActionSheet {...baseProps} soldierState="active" />);

    expect(screen.getByTestId('sheet-action-fullscreen')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-grenade')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-effects')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-capture')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-done')).toHaveTextContent('Готов');
    expect(screen.getByTestId('sheet-action-kill')).toHaveTextContent('Убит');
  });

  it('готов: строка становится «Снять готов»', () => {
    render(<SoldierActionSheet {...baseProps} soldierState="done" />);

    expect(screen.getByTestId('sheet-action-done')).toHaveTextContent('Снять готов');
    expect(screen.getByTestId('sheet-action-kill')).toBeInTheDocument();
  });

  it('мёртвый: «Оживить», без гранаты/готова/захвата', () => {
    render(<SoldierActionSheet {...baseProps} soldierState="dead" />);

    expect(screen.getByTestId('sheet-action-revive')).toHaveTextContent('Оживить');
    expect(screen.queryByTestId('sheet-action-grenade')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sheet-action-done')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sheet-action-kill')).not.toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-fullscreen')).toBeInTheDocument();
  });

  it('паника: без готова, убит доступен (§10 — убить в панике можно)', () => {
    render(<SoldierActionSheet {...baseProps} soldierState="panic" />);

    expect(screen.queryByTestId('sheet-action-done')).not.toBeInTheDocument();
    expect(screen.getByTestId('sheet-action-kill')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-action-grenade')).not.toBeInTheDocument();
  });
});

describe('SoldierActionSheet — двухтаповое подтверждение убийства', () => {
  it('первый тап НЕ убивает — вооружает строку («Точно убит?»)', () => {
    render(<SoldierActionSheet {...baseProps} soldierState="active" />);

    const kill = screen.getByTestId('sheet-action-kill');
    fireEvent.click(kill);
    expect(baseProps.actions.onToggleDead).not.toHaveBeenCalled();
    expect(screen.getByTestId('sheet-action-kill')).toHaveTextContent('Точно убит?');
  });

  it('второй тап подтверждает: toggle-убийство + закрытие листа', () => {
    const onClose = jest.fn();
    const onToggleDead = jest.fn();
    render(
      <SoldierActionSheet
        {...baseProps}
        onClose={onClose}
        actions={{ ...baseProps.actions, onToggleDead }}
        soldierState="active"
      />
    );

    fireEvent.click(screen.getByTestId('sheet-action-kill'));
    fireEvent.click(screen.getByTestId('sheet-action-kill'));
    expect(onToggleDead).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('автосброс через 3с — второй поздний тап снова требует подтверждения', () => {
    jest.useFakeTimers();
    const onToggleDead = jest.fn();
    render(
      <SoldierActionSheet
        {...baseProps}
        actions={{ ...baseProps.actions, onToggleDead }}
        soldierState="active"
      />
    );

    const kill = screen.getByTestId('sheet-action-kill');
    fireEvent.click(kill);
    act(() => { jest.advanceTimersByTime(3100); });
    expect(screen.getByTestId('sheet-action-kill')).toHaveTextContent(/^Убит/);
    fireEvent.click(kill);
    expect(onToggleDead).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('готов — одинарный тап без подтверждения', () => {
    const onToggleDone = jest.fn();
    render(
      <SoldierActionSheet
        {...baseProps}
        actions={{ ...baseProps.actions, onToggleDone }}
        soldierState="active"
      />
    );

    fireEvent.click(screen.getByTestId('sheet-action-done'));
    expect(onToggleDone).toHaveBeenCalledTimes(1);
  });

  it('оживление мёртвого — одинарный тап', () => {
    const onToggleDead = jest.fn();
    render(
      <SoldierActionSheet
        {...baseProps}
        actions={{ ...baseProps.actions, onToggleDead }}
        soldierState="dead"
      />
    );

    fireEvent.click(screen.getByTestId('sheet-action-revive'));
    expect(onToggleDead).toHaveBeenCalledTimes(1);
  });
});
