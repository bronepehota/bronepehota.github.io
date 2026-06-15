import { render, screen } from '@testing-library/react';
import { UnitStatTable } from '@/components/encyclopedia/UnitDetail/UnitStatTable';
import type { Squad } from '@/lib/types';

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
