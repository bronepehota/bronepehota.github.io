import { render, screen, fireEvent } from '@testing-library/react';
import { SoldierStats } from '@/components/cards/soldier-card/SoldierStats';
import type { Soldier } from '@/lib/types';

/**
 * Редизайн карточки бойца в бою (плейтест 2026-10-15):
 *  — статы крупными клетками во всю ширину;
 *  — тап по дальности/мощности = сразу ВЫСТРЕЛ, тап по ББ = сразу БЛИЖНИЙ БОЙ
 *    (мимо экрана выбора действия);
 *  — модификаторы и «все действия» (граната/захват) — компактная стопка
 *    в правом верхнем углу, вне сетки статов.
 */
const soldier: Soldier = {
  num: 1,
  rank: 2,
  speed: 5,
  range: 'D12',
  power: '2D6',
  melee: 2,
  armor: 3,
  props: [],
} as Soldier;

describe('SoldierStats — тап по стату = прямое действие', () => {
  it('дальность — кнопка «Выстрел», тап вызывает onStatAction("shot")', () => {
    const onStatAction = jest.fn();
    render(<SoldierStats soldier={soldier} onStatAction={onStatAction} />);

    const badge = screen.getByTestId('stat-badge-range');
    expect(badge).toHaveAttribute('aria-label', 'Выстрел: дальность D12');
    fireEvent.click(badge);
    expect(onStatAction).toHaveBeenCalledWith('shot');
  });

  it('мощность — тоже выстрел', () => {
    const onStatAction = jest.fn();
    render(<SoldierStats soldier={soldier} onStatAction={onStatAction} />);

    fireEvent.click(screen.getByTestId('stat-badge-power'));
    expect(onStatAction).toHaveBeenCalledWith('shot');
  });

  it('ближний бой — кнопка «Ближний бой», тап вызывает onStatAction("melee")', () => {
    const onStatAction = jest.fn();
    render(<SoldierStats soldier={soldier} onStatAction={onStatAction} />);

    const badge = screen.getByTestId('stat-badge-melee');
    expect(badge).toHaveAttribute('aria-label', 'Ближний бой: 2');
    fireEvent.click(badge);
    expect(onStatAction).toHaveBeenCalledWith('melee');
  });

  it('скрытые броня/скорость (типовой отряд) — в сетке только боевые статы', () => {
    render(<SoldierStats soldier={soldier} onStatAction={jest.fn()} hideArmor hideSpeed />);

    expect(screen.queryByTestId('stat-badge-armor')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stat-badge-speed')).not.toBeInTheDocument();
    expect(screen.getByTestId('stat-badge-range')).toBeInTheDocument();
    expect(screen.getByTestId('stat-badge-melee')).toBeInTheDocument();
  });

  it('disabled (готов/убит/паника) — статовые кнопки не нажимаются', () => {
    const onStatAction = jest.fn();
    render(<SoldierStats soldier={soldier} onStatAction={onStatAction} disabled />);

    expect(screen.getByTestId('stat-badge-range')).toBeDisabled();
    fireEvent.click(screen.getByTestId('stat-badge-range'));
    expect(onStatAction).not.toHaveBeenCalled();
  });
});

describe('SoldierStats — угловая стопка (✦ модификаторы, ⋯ действия)', () => {
  it('⋯ открывает меню действий', () => {
    const onOpenActionMenu = jest.fn();
    render(<SoldierStats soldier={soldier} onStatAction={jest.fn()} onOpenActionMenu={onOpenActionMenu} />);

    const menu = screen.getByTestId('action-menu-button');
    expect(menu).toHaveAttribute('aria-label', 'Все действия: граната, захват');
    fireEvent.click(menu);
    expect(onOpenActionMenu).toHaveBeenCalled();
  });

  it('✦ хранит aria-метки модификаторов (спеки баффов на них опираются)', () => {
    render(
      <SoldierStats
        soldier={soldier}
        onStatAction={jest.fn()}
        onModifierClick={jest.fn()}
        availableBuffCount={2}
      />
    );

    expect(screen.getByRole('button', { name: '2 эффектов доступно' })).toBeInTheDocument();
  });

  it('без обработчиков (превью редактора) — статы не кнопки, стопки нет', () => {
    render(<SoldierStats soldier={soldier} />);

    expect(screen.queryByTestId('action-menu-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('stat-badge-range').tagName).not.toBe('BUTTON');
  });
});
