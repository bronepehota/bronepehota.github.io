import { render, screen, fireEvent } from '@testing-library/react';
import { ExpandedNavigator } from '@/components/GameSession/ExpandedNavigator';
import type { Army, ArmyUnit, Squad, Machine } from '@/lib/types';

const makeSquad = (
  instanceId: string,
  name: string,
  soldiers: number,
  opts: { dead?: number[]; allDone?: boolean; armor?: number; speed?: number } = {}
): ArmyUnit => {
  const squad = {
    id: `sq_${instanceId}`,
    name,
    faction: 'polaris',
    cost: 50,
    soldiers: Array.from({ length: soldiers }, () => ({
      rank: 2, speed: opts.speed ?? 5, range: 'D12', power: '2D6', melee: 3, armor: opts.armor ?? 2, props: [],
    })),
  } as Squad;
  return {
    instanceId,
    type: 'squad',
    data: squad,
    deadSoldiers: opts.dead ?? [],
    actionsUsed: opts.allDone
      ? Array.from({ length: soldiers }, () => ({ moved: false, shot: false, melee: false, done: true }))
      : undefined,
    instanceNumber: 1,
  } as ArmyUnit;
};

const makeMachine = (
  instanceId: string,
  name: string,
  opts: { durability?: number; isCaptured?: boolean } = {}
): ArmyUnit => {
  const machine = {
    id: `m_${instanceId}`,
    name,
    faction: 'polaris',
    cost: 100,
    durability_max: 16,
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 },
    ],
  } as Machine;
  return {
    instanceId,
    type: 'machine',
    data: machine,
    currentDurability: opts.durability ?? 16,
    isCaptured: opts.isCaptured,
    instanceNumber: 1,
  } as ArmyUnit;
};

const makeArmy = (units: ArmyUnit[]): Army =>
  ({ name: 'Тест', totalCost: 200, units, faction: 'polaris' }) as Army;

describe('ExpandedNavigator', () => {
  it('плоский список: все юниты, статус — в aria-label, убитые уходят вниз', () => {
    render(
      <ExpandedNavigator
        army={makeArmy([
          makeSquad('row-active', 'Линейная клон-пехота', 6, { dead: [1, 3] }),
          makeSquad('row-done', 'Снайперы', 3, { allDone: true }),
          makeMachine('row-captured', 'Саламандра', { durability: 8, isCaptured: true }),
          makeMachine('row-dead', 'Хантер', { durability: 0 }),
        ])}
        focusedUnitIdx={0}
        onSelectUnit={jest.fn()}
      />
    );

    // Плоский список: четыре строки, все видимы (захваченные больше не теряются)
    expect(screen.getByTestId('expanded-unit-row-active')).toHaveAttribute('aria-label', 'Линейная клон-пехота, активный');
    expect(screen.getByTestId('expanded-unit-row-done')).toHaveAttribute('aria-label', 'Снайперы, походил');
    expect(screen.getByTestId('expanded-unit-row-dead')).toHaveAttribute('aria-label', 'Хантер, убит');
    expect(screen.getByTestId('expanded-unit-row-captured')).toHaveAttribute('aria-label', 'Саламандра, захвачен');

    // Убитые — в конце списка (порядок остальных = порядок армии)
    const rows = screen.getAllByTestId(/^expanded-unit-/);
    expect(rows.map((r) => r.dataset.testid)).toEqual([
      'expanded-unit-row-active',
      'expanded-unit-row-done',
      'expanded-unit-row-captured',
      'expanded-unit-row-dead',
    ]);

    // Убитая строка компактная (фото w-14), живая — адаптивная (72px → w-24 с 375px)
    expect(screen.getByTestId('expanded-unit-row-dead').querySelector('.w-14')).toBeTruthy();
    expect(screen.getByTestId('expanded-unit-row-active').querySelector('[class*="w-24"]')).toBeTruthy();
  });

  it('полное имя юнита без обрезки до 7 символов', () => {
    render(
      <ExpandedNavigator
        army={makeArmy([makeSquad('row-active', 'Линейная клон-пехота', 3)])}
        focusedUnitIdx={0}
        onSelectUnit={jest.fn()}
      />
    );

    expect(screen.getByText('Линейная клон-пехота')).toBeInTheDocument();
  });

  it('строки статов: живучесть (♥/🛡 · HP) и движение (👣+см) раздельно', () => {
    render(
      <ExpandedNavigator
        army={makeArmy([
          makeSquad('row-active', 'Линейная клон-пехота', 6, { dead: [1, 3] }),
          makeMachine('row-captured', 'Саламандра', { durability: 8, isCaptured: true }),
        ])}
        focusedUnitIdx={0}
        onSelectUnit={jest.fn()}
      />
    );

    // Скорость дублируется в сантиметрах (фактор по умолчанию 5): 5×5, 1×5
    expect(screen.getByText('♥ 4/6 · 🛡 2')).toBeInTheDocument();
    expect(screen.getByText('👣 5 (25см)')).toBeInTheDocument();
    expect(screen.getByText('HP 8/16')).toBeInTheDocument();
    expect(screen.getByText('👣 1 (5см)')).toBeInTheDocument();
  });

  it('клик по строке выбирает юнит (индекс в армии)', () => {
    const onSelectUnit = jest.fn();
    render(
      <ExpandedNavigator
        army={makeArmy([
          makeSquad('row-0', 'Первый отряд', 3),
          makeSquad('row-1', 'Второй отряд', 3),
        ])}
        focusedUnitIdx={0}
        onSelectUnit={onSelectUnit}
      />
    );

    fireEvent.click(screen.getByTestId('expanded-unit-row-1'));
    expect(onSelectUnit).toHaveBeenCalledWith(1);
  });

  it('шапка показывает число активных юнитов', () => {
    render(
      <ExpandedNavigator
        army={makeArmy([
          makeSquad('row-0', 'Первый отряд', 3),
          makeSquad('row-1', 'Второй отряд', 3, { allDone: true }),
        ])}
        focusedUnitIdx={0}
        onSelectUnit={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Активных юнитов: 1')).toBeInTheDocument();
  });

  it('от 5 живых юнитов — сетка в 2 колонки с плитками (плейтест: «мало помещается»)', () => {
    render(
      <ExpandedNavigator
        army={makeArmy([
          makeSquad('g-0', 'Первый отряд', 3),
          makeSquad('g-1', 'Второй отряд', 3),
          makeSquad('g-2', 'Третий отряд', 3),
          makeSquad('g-3', 'Четвёртый отряд', 3),
          makeSquad('g-4', 'Пятый отряд', 3),
          makeMachine('g-5', 'Хантер', { durability: 0 }), // убитая — в сетке, но компактная
        ])}
        focusedUnitIdx={0}
        onSelectUnit={jest.fn()}
      />
    );

    // Контейнер — 2-колоночная сетка
    const grid = document.querySelector('.grid.grid-cols-2');
    expect(grid).toBeInTheDocument();

    // Плитка живого: фото-блок h-24; убитой — компактная h-14
    const aliveTile = screen.getByTestId('expanded-unit-g-0');
    expect(aliveTile.querySelector('.h-24')).toBeTruthy();
    const deadTile = screen.getByTestId('expanded-unit-g-5');
    expect(deadTile.querySelector('.h-14')).toBeTruthy();

    // Строки-плитки несут имя и статы (узнавание сохранено)
    expect(aliveTile.textContent).toContain('Первый отряд');
    expect(aliveTile.textContent).toContain('♥ 3/3');
  });

  // Плейтест 2026-10-15: в списке отрядов должно быть видно, есть граната
  // или уже потрачена (она одна на бой) — без захода в карточку.
  describe('маркер гранаты', () => {
    it('у отряда с гранатой — 💣 «Граната доступна»', () => {
      render(
        <ExpandedNavigator
          army={makeArmy([makeSquad('gr-1', 'Гранатомётчики', 3)])}
          focusedUnitIdx={0}
          onSelectUnit={jest.fn()}
        />
      );

      const marker = screen.getByTestId('nav-grenade-gr-1');
      expect(marker).toHaveAttribute('aria-label', 'Граната доступна');
      expect(marker.textContent).toContain('💣');
    });

    it('потраченная граната — приглушённый перечёркнутый 💣 «Граната потрачена»', () => {
      const unit = { ...makeSquad('gr-2', 'Без гранаты', 3), grenadesUsed: true } as ArmyUnit;
      render(
        <ExpandedNavigator
          army={makeArmy([unit])}
          focusedUnitIdx={0}
          onSelectUnit={jest.fn()}
        />
      );

      const marker = screen.getByTestId('nav-grenade-gr-2');
      expect(marker).toHaveAttribute('aria-label', 'Граната потрачена');
      expect(marker.className).toContain('opacity-35');
      expect(marker.className).toContain('line-through');
    });

    it('у машины гранаты нет — маркера нет', () => {
      render(
        <ExpandedNavigator
          army={makeArmy([makeMachine('gr-m', 'Саламандра')])}
          focusedUnitIdx={0}
          onSelectUnit={jest.fn()}
        />
      );

      expect(screen.queryByTestId('nav-grenade-gr-m')).not.toBeInTheDocument();
    });
  });

  // Плейтест 2026-10-15: видно, есть ли в отряде не походившие бойцы —
  // тихая строка «✓ X/Y» только на частичном прогрессе (0/N — просто
  // активный, N/N — отряд и так «походил»).
  describe('прогресс хода отряда', () => {
    const makePartial = (instanceId: string, doneCount: number, soldiers = 3) => ({
      ...makeSquad(instanceId, `Отряд ${instanceId}`, soldiers),
      actionsUsed: Array.from({ length: soldiers }, (_, i) => ({
        moved: false, shot: false, melee: false, done: i < doneCount,
      })),
    }) as ArmyUnit;

    it('частичный прогресс — ✓ X/Y виден', () => {
      render(
        <ExpandedNavigator
          army={makeArmy([makePartial('p-1', 1)])}
          focusedUnitIdx={0}
          onSelectUnit={jest.fn()}
        />
      );

      expect(screen.getByTestId('nav-turn-p-1')).toHaveTextContent('1/3');
    });

    it('никто не походил — строки нет (отряд просто активный)', () => {
      render(
        <ExpandedNavigator
          army={makeArmy([makeSquad('p-2', 'Свежий отряд', 3)])}
          focusedUnitIdx={0}
          onSelectUnit={jest.fn()}
        />
      );

      expect(screen.queryByTestId('nav-turn-p-2')).not.toBeInTheDocument();
    });

    it('все походили — строки нет (статус несёт полоса и ✓-кнопка)', () => {
      render(
        <ExpandedNavigator
          army={makeArmy([makePartial('p-3', 3)])}
          focusedUnitIdx={0}
          onSelectUnit={jest.fn()}
        />
      );

      expect(screen.queryByTestId('nav-turn-p-3')).not.toBeInTheDocument();
    });

    it('машина — строки прогресса нет', () => {
      render(
        <ExpandedNavigator
          army={makeArmy([makeMachine('p-m', 'Саламандра')])}
          focusedUnitIdx={0}
          onSelectUnit={jest.fn()}
        />
      );

      expect(screen.queryByTestId('nav-turn-p-m')).not.toBeInTheDocument();
    });
  });
});
