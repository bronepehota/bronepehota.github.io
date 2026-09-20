import { render, screen } from '@testing-library/react';
import { SquadSpecialProps } from '@/components/SquadSpecialProps';
import { CompactUnitCard } from '@/components/CompactUnitCard';
import { PrepArmyList } from '@/components/preparation/PrepArmyList';
import type { BuffDefinition } from '@/lib/modifier-types';
import type { Army, ArmyUnit, Squad } from '@/lib/types';

const pro4 = {
  id: 'jump_boost_4', name: 'Пр4', description: 'Прыжковой ускоритель на 4е',
  applyTo: ['soldier'], target: 'custom', value: 4, phase: 'always',
  icon: 'ArrowUp', oneTimeUse: true,
} as unknown as BuffDefinition;

const armorBuff = {
  id: 'armor_plus', name: 'Бронеплиты', description: '+1 брони',
  applyTo: ['squad'], target: 'armor_bonus', value: 1, phase: 'always',
} as unknown as BuffDefinition;

describe('SquadSpecialProps — спец-свойства на карточках армии', () => {
  it('показывает только custom-свойства именованным чипом с подсказкой', () => {
    render(<SquadSpecialProps buffs={[pro4, armorBuff]} />);
    const chip = screen.getByTitle(/Прыжковой ускоритель/);
    expect(chip).toHaveTextContent('Пр4');
    // обычные бафы-модификаторы не показываем — им место в бою
    expect(screen.queryByText('Бронеплиты')).not.toBeInTheDocument();
  });

  it('без свойств не рендерит ничего', () => {
    const { container } = render(<SquadSpecialProps buffs={[armorBuff]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('CompactUnitCard: чип у отряда, у техники нет', () => {
    const squad = {
      id: 'polaris_shturmovaya', name: 'Штурмовая клон-пехота', shortName: 'ШКП',
      faction: 'polaris', cost: 63,
      soldiers: [{ rank: 3, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2 }],
      buffs: [pro4],
    } as unknown as Squad;
    const { rerender } = render(
      <CompactUnitCard unit={squad} type="squad" onAdd={jest.fn()} onClick={jest.fn()} factionId="polaris" canAfford />
    );
    expect(screen.getByText('Пр4')).toBeInTheDocument();

    const machine = {
      id: 'hunter', name: 'Хантер', faction: 'polaris', cost: 100,
      rank: 2, fire_rate: 2, ammo_max: 20, durability_max: 10, speed_sectors: [], weapons: [],
    } as never;
    rerender(
      <CompactUnitCard unit={machine} type="machine" onAdd={jest.fn()} onClick={jest.fn()} factionId="polaris" canAfford />
    );
    expect(screen.queryByText('Пр4')).not.toBeInTheDocument();
  });

  it('PrepArmyList: чип у названия отряда перед боем', () => {
    const army = {
      name: 'T', faction: 'polaris', totalCost: 63,
      units: [{
        instanceId: 'u1', type: 'squad', instanceNumber: 1,
        data: {
          id: 'polaris_shturmovaya', name: 'Штурмовая клон-пехота', shortName: 'ШКП',
          faction: 'polaris', cost: 63,
          soldiers: [{ num: 1, rank: 3, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2, image: '' }],
          buffs: [pro4],
        },
      } as unknown as ArmyUnit],
    } as unknown as Army;
    render(<PrepArmyList army={army} />);
    const heading = screen.getByRole('heading', { name: /Штурмовая клон-пехота/i });
    expect(heading.parentElement).toHaveTextContent('Пр4');
  });
});
