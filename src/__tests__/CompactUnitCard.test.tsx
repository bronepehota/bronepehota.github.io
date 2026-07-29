import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompactUnitCard } from '@/components/CompactUnitCard';
import type { Squad, Machine } from '@/lib/types';

// Use real squad data from the Excel import
const mockSquad: Squad = {
  id: 'polaris_lineynaya_klon_pehota',
  name: 'Линейная клон-пехота',
  shortName: 'Линейная клон-пехота',
  faction: 'polaris',
  cost: 50,
  image: '/test.jpg',
  soldiers: [
    { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2 },
    { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, armor: 2 },
    { num: 3, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, armor: 2 },
    { num: 4, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, armor: 2 },
    { num: 5, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, armor: 2 },
    { num: 6, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, armor: 2 },
  ],
};

// Use real machine data (existing from machines.json)
const mockMachine: Machine = {
  id: 'polaris_legkaya_shturmovaya_grin_bolter',
  name: 'Лёгкая штурмовая "Грин-болтер"',
  shortName: 'Грин-болтер лёг.',
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
    { name: 'Грин-болтер', range: 'D12', power: '2D12', special: '' },
  ],
};

describe('CompactUnitCard', () => {
  it('renders squad card with correct info', () => {
    render(
      <CompactUnitCard
        unit={mockSquad}
        type="squad"
        onAdd={jest.fn()}
        onClick={jest.fn()}
        factionId="polaris"
        canAfford={true}
      />
    );

    expect(screen.getByText('Линейная клон-пехота')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText(/R2/)).toBeInTheDocument();
    expect(screen.getByText(/6 бойцов/)).toBeInTheDocument();
  });

  it('renders machine card with correct info', () => {
    render(
      <CompactUnitCard
        unit={mockMachine}
        type="machine"
        onAdd={jest.fn()}
        onClick={jest.fn()}
        factionId="polaris"
        canAfford={true}
      />
    );

    expect(screen.getByText('Лёгкая штурмовая "Грин-болтер"')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(/R2/)).toBeInTheDocument();
    expect(screen.getByText(/Прч16/)).toBeInTheDocument();
    expect(screen.getByText(/Ск2/)).toBeInTheDocument();
  });

  it('calls onClick when the unit name is clicked and can afford', async () => {
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

    // The name is the trigger for the in-app stats modal (no navigation).
    await user.click(screen.getByText('Линейная клон-пехота'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when the unit name is clicked and cannot afford', async () => {
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

    await user.click(screen.getByText('Линейная клон-пехота'));

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

    const addButton = screen.getByTestId('add-compact-polaris_lineynaya_klon_pehota');
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

    const addButton = screen.getByTestId('add-compact-polaris_lineynaya_klon_pehota');
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

    const card = screen.getByTestId('compact-unit-card-polaris_lineynaya_klon_pehota');
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
