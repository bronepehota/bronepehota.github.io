import { render, screen, fireEvent } from '@testing-library/react';
import { SoldierStats } from '@/components/cards/soldier-card/SoldierStats';
import type { Soldier } from '@/lib/types';

/**
 * Редизайн карточки бойца в бою (плейтест 2026-10-15):
 *  — статы крупными клетками во всю ширину;
 *  — тап по дальности/мощности = сразу ВЫСТРЕЛ, тап по ББ = сразу БЛИЖНИЙ БОЙ
 *    (мимо экрана выбора действия);
 *  — ⋯ — единственная угловая кнопка (меню действий: выстрел/ББ/граната/
 *    захват/модификации).
 *
 * Строка модификаций под статами (2026-11-27): активные эффекты/свойства —
 * тонкая строка на всю ширину ПОД бейджами, видна только когда есть что
 * показать. Обычная карточка её не имеет → минимум строки не растёт
 * (6 бойцов влезают на 667-экранах без скролла).
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

describe('SoldierStats — угла ⋯ больше нет (2026-11-27)', () => {
  it('кнопки меню действий на карточке нет — действия живут в листе по тапу на фото', () => {
    render(<SoldierStats soldier={soldier} onStatAction={jest.fn()} />);

    expect(screen.queryByTestId('action-menu-button')).not.toBeInTheDocument();
  });

  it('без обработчиков (превью редактора) — статы не кнопки', () => {
    render(<SoldierStats soldier={soldier} />);

    expect(screen.getByTestId('stat-badge-range').tagName).not.toBe('BUTTON');
  });
});

describe('SoldierStats — строка модификаций под статами', () => {
  it('есть что показать (доступные бафы) — строка с прежней aria-меткой, тап открывает модал', () => {
    const onModifierClick = jest.fn();
    render(
      <SoldierStats
        soldier={soldier}
        onStatAction={jest.fn()}
        onModifierClick={onModifierClick}
        availableBuffCount={2}
      />
    );

    const strip = screen.getByTestId('modifier-indicator');
    expect(strip).toHaveAttribute('aria-label', '2 эффектов доступно');
    fireEvent.click(strip);
    expect(onModifierClick).toHaveBeenCalled();
  });

  it('пустая карточка (нет ни эффектов, ни свойств, ни доступных) — строки нет', () => {
    render(<SoldierStats soldier={soldier} onStatAction={jest.fn()} onModifierClick={jest.fn()} />);

    expect(screen.queryByTestId('modifier-indicator')).not.toBeInTheDocument();
  });

  it('спец-свойства взвода — видны ИМЕНЕМ, aria как у прежней угловой кнопки', () => {
    render(
      <SoldierStats
        soldier={soldier}
        onStatAction={jest.fn()}
        onModifierClick={jest.fn()}
        staticAbilities={[{ id: 'jump_boost_4', name: 'Пр4' } as never]}
      />
    );

    const strip = screen.getByTestId('modifier-indicator');
    expect(strip).toHaveAttribute('aria-label', 'Спец-свойства: Пр4');
    expect(strip).toHaveTextContent('Пр4');
  });

  it('счётчик баффов не прячет имена свойств (формат прежней кнопки сохранён)', () => {
    render(
      <SoldierStats
        soldier={soldier}
        onStatAction={jest.fn()}
        onModifierClick={jest.fn()}
        buffCount={1}
        debuffCount={0}
        staticAbilities={[
          { id: 'mechanic', name: 'Рм' } as never,
          { id: 'jump_boost_4', name: 'Пр4' } as never,
        ]}
      />
    );

    expect(screen.getByTestId('modifier-indicator')).toHaveAttribute(
      'aria-label',
      '1 баффов, 0 дебаффов, спец-свойства: Рм, Пр4'
    );
  });

  it('пер-солдатские модификаторы — aria «N модификаторов на солдата»', () => {
    render(
      <SoldierStats
        soldier={soldier}
        onStatAction={jest.fn()}
        onModifierClick={jest.fn()}
        soldierModifiers={[{ id: 'm1' } as never]}
      />
    );

    expect(screen.getByTestId('modifier-indicator')).toHaveAttribute(
      'aria-label',
      '1 модификаторов на солдата'
    );
  });

  it('disabled — строка не нажимается', () => {
    const onModifierClick = jest.fn();
    render(
      <SoldierStats
        soldier={soldier}
        onStatAction={jest.fn()}
        onModifierClick={onModifierClick}
        availableBuffCount={1}
        disabled
      />
    );

    const strip = screen.getByTestId('modifier-indicator');
    fireEvent.click(strip);
    expect(onModifierClick).not.toHaveBeenCalled();
  });
});
