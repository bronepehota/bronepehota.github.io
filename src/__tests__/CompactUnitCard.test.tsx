import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompactUnitCard } from '@/components/CompactUnitCard';
import type { Squad, Machine } from '@/lib/types';

const mockSquad: Squad = {
  id: 'test_squad',
  name: 'Test Squad',
  shortName: 'TST SQUAD',
  faction: 'polaris',
  cost: 100,
  image: '/test.jpg',
  soldiers: [
    { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
    { rank: 6, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 3 },
  ],
};

const mockMachine: Machine = {
  id: 'test_machine',
  name: 'Test Machine',
  shortName: 'TST MECH',
  faction: 'polaris',
  cost: 150,
  rank: 2,
  fire_rate: 2,
  ammo_max: 20,
  durability_max: 16,
  image: '/test.jpg',
  speed_sectors: [
    { min_durability: 9, max_durability: 16, speed: 2 },
    { min_durability: 1, max_durability: 8, speed: 1 },
  ],
  weapons: [
    { name: 'Test Weapon', range: 'D12', power: '2D12', special: '' },
  ],
};

describe('CompactUnitCard', () => {
  it('renders squad card with correct info', () => {
    const handleAdd = jest.fn();
    const handleClick = jest.fn();

    render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={handleAdd}
        onClick={handleClick}
        factionId="polaris"
        canAfford={true}
      />
    );

    expect(screen.getByText('TST SQUAD')).toBeInTheDocument();
    expect(screen.getByText('ОТРЯД')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/R7/)).toBeInTheDocument();
    expect(screen.getByText(/2 бойцов/)).toBeInTheDocument();
  });

  it('renders machine card with correct info', () => {
    const handleAdd = jest.fn();
    const handleClick = jest.fn();

    render(
      <CompactUnitCard
        unit={mockMachine}
        type="machine"
        onAdd={handleAdd}
        onClick={handleClick}
        factionId="polaris"
        canAfford={true}
      />
    );

    expect(screen.getByText('TST MECH')).toBeInTheDocument();
    expect(screen.getByText('МАШИНА')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(/R2/)).toBeInTheDocument();
    expect(screen.getByText(/Прч16/)).toBeInTheDocument();
    expect(screen.getByText(/Ск2/)).toBeInTheDocument();
  });

  it('shows count badge when units in army', () => {
    render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={() => {}}
        onClick={() => {}}
        factionId="polaris"
        canAfford={true}
        countInArmy={2}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show count badge when zero in army', () => {
    render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={() => {}}
        onClick={() => {}}
        factionId="polaris"
        canAfford={true}
        countInArmy={0}
      />
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClick when card clicked and can afford', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={() => {}}
        onClick={handleClick}
        factionId="polaris"
        canAfford={true}
      />
    );

    const card = screen.getByTestId('compact-unit-card-test_squad');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when cannot afford', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={() => {}}
        onClick={handleClick}
        factionId="polaris"
        canAfford={false}
      />
    );

    const card = screen.getByTestId('compact-unit-card-test_squad');
    await user.click(card);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('calls onAdd when add button clicked', async () => {
    const handleAdd = jest.fn();
    const user = userEvent.setup();

    render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={handleAdd}
        onClick={() => {}}
        factionId="polaris"
        canAfford={true}
      />
    );

    const addButton = screen.getByTestId('add-compact-test_squad');
    await user.click(addButton);

    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it('does not call onAdd when cannot afford', async () => {
    const handleAdd = jest.fn();
    const user = userEvent.setup();

    render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={handleAdd}
        onClick={() => {}}
        factionId="polaris"
        canAfford={false}
      />
    );

    const addButton = screen.getByTestId('add-compact-test_squad');
    await user.click(addButton);

    expect(handleAdd).not.toHaveBeenCalled();
  });

  it('shows reduced opacity when cannot afford', () => {
    const { rerender } = render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={() => {}}
        onClick={() => {}}
        factionId="polaris"
        canAfford={true}
      />
    );

    const card = screen.getByTestId('compact-unit-card-test_squad');
    expect(card).toHaveClass('cursor-pointer');

    rerender(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={() => {}}
        onClick={() => {}}
        factionId="polaris"
        canAfford={false}
      />
    );

    expect(card).toHaveClass('opacity-60');
    expect(card).toHaveClass('cursor-not-allowed');
  });
});
