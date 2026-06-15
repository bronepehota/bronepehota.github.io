import { render, screen } from '@testing-library/react';
import { UnitStatTable } from '@/components/encyclopedia/UnitDetail/UnitStatTable';
import type { Squad, Machine } from '@/lib/types';

const squad: Squad = {
  id: 'test_squad',
  name: 'Тест',
  faction: 'polaris',
  cost: 40,
  soldiers: [
    { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 4, armor: 3 },
    { num: 2, rank: 3, speed: 5, range: '', power: '2D6', melee: 4, armor: 3, modifiers: ['jump_boost_4'] },
  ],
};

describe('UnitStatTable (squad)', () => {
  it('renders the section and stat values', () => {
    render(<UnitStatTable unit={squad} type="squad" />);
    expect(screen.getByTestId('unit-stat-table')).toBeInTheDocument();
    expect(screen.getByText('D6')).toBeInTheDocument();
    expect(screen.getAllByText('2D6').length).toBe(2);
  });

  it('shows — for empty range', () => {
    render(<UnitStatTable unit={squad} type="squad" />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('resolves and shows the modifier label (Пр4) for jump_boost_4', () => {
    render(<UnitStatTable unit={squad} type="squad" />);
    expect(screen.getByText('Пр4')).toBeInTheDocument();
  });
});

const machine: Machine = {
  id: 'test_machine',
  name: 'Тестовая машина',
  faction: 'polaris',
  cost: 150,
  rank: 2,
  fire_rate: 2,
  ammo_max: 20,
  durability_max: 16,
  speed_sectors: [
    { min_durability: 9, max_durability: 16, speed: 2 },
    { min_durability: 1, max_durability: 8, speed: 1 },
  ],
  weapons: [{ name: 'Пушка', range: 'D12', power: '2D12' }],
};

describe('UnitStatTable (machine)', () => {
  it('renders spec tiles and the weapons list', () => {
    render(<UnitStatTable unit={machine} type="machine" />);
    expect(screen.getByTestId('unit-stat-table')).toBeInTheDocument();
    expect(screen.getByText('Пушка')).toBeInTheDocument();
    expect(screen.getByText('D12')).toBeInTheDocument();
    expect(screen.getByText('2D12')).toBeInTheDocument();
    expect(screen.getByText('Б/с')).toBeInTheDocument();
    expect(screen.getByText('Прочн.')).toBeInTheDocument();
  });
});
