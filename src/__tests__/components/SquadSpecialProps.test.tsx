import { render, screen } from '@testing-library/react';
import { SquadSpecialProps } from '@/components/SquadSpecialProps';
import { CompactUnitCard } from '@/components/CompactUnitCard';
import { PrepArmyList } from '@/components/preparation/PrepArmyList';
import type { BuffDefinition } from '@/lib/modifier-types';
import type { Army, ArmyUnit, Squad, Soldier } from '@/lib/types';

const pro4 = {
  id: 'jump_boost_4', name: 'Пр4', description: 'Прыжковой ускоритель на 4е',
  applyTo: ['soldier'], target: 'custom', value: 4, phase: 'always',
  icon: 'ArrowUp', oneTimeUse: true,
} as unknown as BuffDefinition;

const armorBuff = {
  id: 'armor_plus', name: 'Бронеплиты', description: '+1 брони',
  applyTo: ['squad'], target: 'armor_bonus', value: 1, phase: 'always',
} as unknown as BuffDefinition;

const makeSoldier = (modifiers?: string[]): Soldier => ({
  num: 1, rank: 3, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2, modifiers,
});

const makeSquad = (overrides: Partial<Squad> = {}): Squad => ({
  id: 'polaris_shturmovaya', name: 'Штурмовая клон-пехота', shortName: 'ШКП',
  faction: 'polaris', cost: 63,
  soldiers: [makeSoldier()],
  ...overrides,
});

describe('SquadSpecialProps — спец-свойства на карточках армии', () => {
  it('взводные buffs: показывает только custom-свойства именованным чипом с подсказкой', () => {
    render(<SquadSpecialProps squad={makeSquad({ buffs: [pro4, armorBuff] })} />);
    const chip = screen.getByTitle(/Прыжковой ускоритель/);
    expect(chip).toHaveTextContent('Пр4');
    // обычные бафы-модификаторы не показываем — им место в бою
    expect(screen.queryByText('Бронеплиты')).not.toBeInTheDocument();
  });

  it('пер-солдатские modifiers резолвятся из каталога: mechanic → Рм', () => {
    // основная форма в данных: свойство у бойцов, взводных buffs нет
    render(<SquadSpecialProps squad={makeSquad({
      soldiers: [makeSoldier(['mechanic']), makeSoldier(['mechanic'])],
    })} />);
    expect(screen.getByText('Рм')).toBeInTheDocument();
  });

  it('без свойств не рендерит ничего', () => {
    const { container } = render(<SquadSpecialProps squad={makeSquad({ buffs: [armorBuff] })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('CompactUnitCard: чип у отряда (из modifiers бойцов), у техники нет', () => {
    const squad = makeSquad({ soldiers: [makeSoldier(['mechanic'])] });
    const { rerender } = render(
      <CompactUnitCard unit={squad} type="squad" onAdd={jest.fn()} onClick={jest.fn()} factionId="polaris" canAfford />
    );
    expect(screen.getByText('Рм')).toBeInTheDocument();

    const machine = {
      id: 'hunter', name: 'Хантер', faction: 'polaris', cost: 100,
      rank: 2, fire_rate: 2, ammo_max: 20, durability_max: 10, speed_sectors: [], weapons: [],
    } as never;
    rerender(
      <CompactUnitCard unit={machine} type="machine" onAdd={jest.fn()} onClick={jest.fn()} factionId="polaris" canAfford />
    );
    expect(screen.queryByText('Рм')).not.toBeInTheDocument();
  });

  it('PrepArmyList: чип у названия отряда перед боем', () => {
    const army = {
      name: 'T', faction: 'polaris', totalCost: 63,
      units: [{
        instanceId: 'u1', type: 'squad', instanceNumber: 1,
        data: makeSquad({ soldiers: [makeSoldier(['mechanic'])] }),
      } as unknown as ArmyUnit],
    } as unknown as Army;
    render(<PrepArmyList army={army} />);
    const heading = screen.getByRole('heading', { name: /Штурмовая клон-пехота/i });
    expect(heading.parentElement).toHaveTextContent('Рм');
  });
});
