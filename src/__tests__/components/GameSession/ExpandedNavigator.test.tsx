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

    // Убитая строка компактная (фото w-14), живая — крупная (w-24)
    expect(screen.getByTestId('expanded-unit-row-dead').querySelector('.w-14')).toBeTruthy();
    expect(screen.getByTestId('expanded-unit-row-active').querySelector('.w-24')).toBeTruthy();
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

  it('строка статов: отряд — живые/броня/скорость, машина — HP/скорость', () => {
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

    expect(screen.getByText('♥ 4/6 · 🛡 2 · 👣 5')).toBeInTheDocument();
    expect(screen.getByText('HP 8/16 · 👣 1')).toBeInTheDocument();
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
});
