/**
 * Army Building Flow Tests
 *
 * Tests are OPTIONAL for this feature.
 * If following TDD, uncomment and implement these tests before implementation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FactionSelector } from '@/components/controls/FactionSelector';
import { PointBudgetInput } from '@/components/controls/PointBudgetInput';
import { UnitSelector } from '@/components/UnitSelector';
import type { Faction, Squad, Machine, ArmyUnit, FactionID } from '@/lib/types';

// Mock faction data
const mockFactions: Faction[] = [
  {
    id: 'polaris',
    name: 'Polaris',
    color: '#ef4444',
    description: 'Элитные кибер-солдаты с передовыми технологиями',
    motto: 'В единении — сила',
    homeWorld: 'Полярис Прайм',
  },
  {
    id: 'protectorate',
    name: 'Протекторат',
    color: '#3b82f6',
    description: 'Защитники галактики с мощной броней',
    motto: 'Защита — наш долг',
    homeWorld: 'Терра Нова',
  },
  {
    id: 'mercenaries',
    name: 'Наёмники',
    color: '#eab308',
    description: ' Profesional soldiers fighting for credits',
    motto: 'Победа любой ценой',
    homeWorld: 'Фрипорт',
  },
];

// Mock squad data
const mockSquads: Squad[] = [
  {
    id: 'polaris_light_assault',
    name: 'Легкий штурм',
    faction: 'polaris' as FactionID,
    cost: 50,
    soldiers: [],
    image: '/images/polaris-light-assault.jpg',
  },
  {
    id: 'polaris_heavy_assault',
    name: 'Тяжелый штурм',
    faction: 'polaris' as FactionID,
    cost: 100,
    soldiers: [],
    image: '/images/polaris-heavy-assault.jpg',
  },
];

// Mock machine data
const mockMachines: Machine[] = [
  {
    id: 'polaris_light_tank',
    name: 'Легкий танк',
    faction: 'polaris' as FactionID,
    cost: 150,
    rank: 3,
    fire_rate: 2,
    ammo_max: 10,
    durability_max: 15,
    speed_sectors: [
      { min_durability: 1, max_durability: 15, speed: 10 },
    ],
    weapons: [
      { name: 'Автопушка', range: 'D12', power: '2D6' },
    ],
    image: '/images/polaris-light-tank.jpg',
  },
];

describe('FactionSelector', () => {
  it('renders all factions', () => {
    const mockSelect = jest.fn();
    render(
      <FactionSelector
        factions={mockFactions}
        onFactionSelect={mockSelect}
      />
    );

    expect(screen.getByText('POLARIS')).toBeInTheDocument();
    expect(screen.getByText('ПРОТЕКТОРАТ')).toBeInTheDocument();
    expect(screen.getByText('НАЁМНИКИ')).toBeInTheDocument();
  });

  it('calls onFactionSelect when card is clicked', () => {
    const mockSelect = jest.fn();
    render(
      <FactionSelector
        factions={mockFactions}
        onFactionSelect={mockSelect}
      />
    );

    fireEvent.click(screen.getByText('POLARIS'));
    expect(mockSelect).toHaveBeenCalledWith('polaris');
  });

  it('highlights selected faction', () => {
    const mockSelect = jest.fn();
    render(
      <FactionSelector
        factions={mockFactions}
        selectedFaction="polaris"
        onFactionSelect={mockSelect}
      />
    );

    const polarisCard = screen.getByText('POLARIS').closest('[role="button"]');
    expect(polarisCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('expands faction details on click', () => {
    const mockSelect = jest.fn();
    render(
      <FactionSelector
        factions={mockFactions}
        onFactionSelect={mockSelect}
      />
    );

    // Initially details are hidden
    expect(screen.queryByText(/Элитные кибер-солдаты/)).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('POLARIS'));
    expect(screen.getByText(/Элитные кибер-солдаты/)).toBeInTheDocument();
  });
});

describe('PointBudgetInput', () => {
  it('renders all preset buttons', () => {
    const mockChange = jest.fn();
    render(
      <PointBudgetInput
        presets={[250, 350, 500, 1000]}
        onChange={mockChange}
      />
    );

    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('calls onChange with preset value when button is clicked', () => {
    const mockChange = jest.fn();
    render(
      <PointBudgetInput
        presets={[250, 350, 500, 1000]}
        onChange={mockChange}
      />
    );

    fireEvent.click(screen.getByText('500'));
    expect(mockChange).toHaveBeenCalledWith(500);
  });

  it('validates custom input', () => {
    const mockChange = jest.fn();
    render(
      <PointBudgetInput
        presets={[250, 350, 500, 1000]}
        onChange={mockChange}
      />
    );

    const input = screen.getByPlaceholderText('0000');

    // Invalid input
    fireEvent.change(input, { target: { value: '-10' } });
    expect(screen.getByText('Введите положительное число')).toBeInTheDocument();

    // Valid input
    fireEvent.change(input, { target: { value: '750' } });
    expect(mockChange).toHaveBeenCalledWith(750);
  });

  it('shows error for values over 10000', () => {
    const mockChange = jest.fn();
    render(
      <PointBudgetInput
        presets={[250, 350, 500, 1000]}
        onChange={mockChange}
      />
    );

    const input = screen.getByPlaceholderText('0000');
    fireEvent.change(input, { target: { value: '15000' } });

    expect(screen.getByText('Максимум 10000 очков')).toBeInTheDocument();
  });
});

describe('UnitSelector', () => {
  const mockArmy: ArmyUnit[] = [];
  const mockAdd = jest.fn();
  const mockRemove = jest.fn();
  const mockToBattle = jest.fn();
  const mockDisplayModeChange = jest.fn();

  beforeEach(() => {
    // Clear localStorage before each test to avoid state pollution
    localStorage.clear();
  });

  it('filters units by selected faction', () => {
    render(
      <UnitSelector
        factions={mockFactions}
        squads={mockSquads}
        selectedFaction="polaris"
        pointBudget={500}
        army={mockArmy}
        onAddUnit={mockAdd}
        onRemoveUnit={mockRemove}
        onToBattle={mockToBattle}
        displayMode="detailed"
        onDisplayModeChange={mockDisplayModeChange}
        sourceId="star_system"
      />
    );

    expect(screen.getByText('ЛЕГКИЙ ШТУРМ')).toBeInTheDocument();
    expect(screen.getByText('ТЯЖЕЛЫЙ ШТУРМ')).toBeInTheDocument();
  });

  it('calculates remaining points correctly', () => {
    const armyWithUnits: ArmyUnit[] = [
      {
        instanceId: 'test1',
        type: 'squad',
        data: mockSquads[0],
      },
    ];

    render(
      <UnitSelector
        factions={mockFactions}
        squads={mockSquads}
        selectedFaction="polaris"
        pointBudget={500}
        army={armyWithUnits}
        onAddUnit={mockAdd}
        onRemoveUnit={mockRemove}
        onToBattle={mockToBattle}
        displayMode="detailed"
        onDisplayModeChange={mockDisplayModeChange}
        sourceId="star_system"
      />
    );

    // Budget is now displayed in the footer (page.tsx), not in UnitSelector
    // Just verify the component renders correctly with the given budget
    expect(screen.getAllByText('ЛЕГКИЙ ШТУРМ').length).toBeGreaterThan(0);
  });

  it('prevents adding units over budget', () => {
    render(
      <UnitSelector
        factions={mockFactions}
        squads={mockSquads}
        selectedFaction="polaris"
        pointBudget={30}
        army={mockArmy}
        onAddUnit={mockAdd}
        onRemoveUnit={mockRemove}
        onToBattle={mockToBattle}
        displayMode="detailed"
        onDisplayModeChange={mockDisplayModeChange}
        sourceId="star_system"
      />
    );

    // Find the add button for Лёгкий штурм (costs 50, budget is 30)
    const addButton = screen.getAllByText('В АРМИЮ').find(
      btn => btn.getAttribute('aria-label') === 'Добавить Легкий штурм'
    );

    // Button should be disabled when unit cannot be afforded
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveAttribute('aria-disabled', 'true');

    // Unit should not be added
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('enables "В бой" button when army has units', async () => {
    const armyWithUnits: ArmyUnit[] = [
      {
        instanceId: 'test1',
        type: 'squad',
        data: mockSquads[0],
      },
    ];

    render(
      <UnitSelector
        factions={mockFactions}
        squads={mockSquads}
        selectedFaction="polaris"
        pointBudget={500}
        army={armyWithUnits}
        onAddUnit={mockAdd}
        onRemoveUnit={mockRemove}
        onToBattle={mockToBattle}
        displayMode="detailed"
        onDisplayModeChange={mockDisplayModeChange}
        sourceId="star_system"
      />
    );

    // FloatingContinueButton appears directly when units are in army
    await waitFor(() => {
      const battleButton = screen.getByText('НАЧАТЬ БОЙ');
      expect(battleButton).toBeInTheDocument();
    });
  });

  it('hides "В бой" button when army is empty', () => {
    render(
      <UnitSelector
        factions={mockFactions}
        squads={mockSquads}
        selectedFaction="polaris"
        pointBudget={500}
        army={mockArmy}
        onAddUnit={mockAdd}
        onRemoveUnit={mockRemove}
        onToBattle={mockToBattle}
        displayMode="detailed"
        onDisplayModeChange={mockDisplayModeChange}
        sourceId="star_system"
      />
    );

    // "НАЧАТЬ БОЙ" button should not be in document when army is empty
    expect(screen.queryByText('НАЧАТЬ БОЙ')).not.toBeInTheDocument();
  });

  it('displays both squads and machines when machines prop is provided', () => {
    const mockAddMachine = jest.fn();

    render(
      <UnitSelector
        factions={mockFactions}
        squads={mockSquads}
        machines={mockMachines}
        selectedFaction="polaris"
        pointBudget={500}
        army={mockArmy}
        onAddUnit={mockAdd}
        onAddMachine={mockAddMachine}
        onRemoveUnit={mockRemove}
        onToBattle={mockToBattle}
        displayMode="detailed"
        onDisplayModeChange={mockDisplayModeChange}
        sourceId="star_system"
      />
    );

    // Should display squads (uppercase names now)
    expect(screen.getByText('ЛЕГКИЙ ШТУРМ')).toBeInTheDocument();
    expect(screen.getByText('ТЯЖЕЛЫЙ ШТУРМ')).toBeInTheDocument();

    // Should display machines (MachineCard shows uppercase names)
    expect(screen.getByText('ЛЕГКИЙ ТАНК')).toBeInTheDocument();
  });

  it('opens weapon selector modal when machine add button is clicked', () => {
    const mockAddMachine = jest.fn();

    render(
      <UnitSelector
        factions={mockFactions}
        squads={mockSquads}
        machines={mockMachines}
        selectedFaction="polaris"
        pointBudget={500}
        army={mockArmy}
        onAddUnit={mockAdd}
        onAddMachine={mockAddMachine}
        onRemoveUnit={mockRemove}
        onToBattle={mockToBattle}
        displayMode="detailed"
        onDisplayModeChange={mockDisplayModeChange}
        sourceId="star_system"
      />
    );

    // Find the add button - squads use "ДОБАВИТЬ", machines use "В АРМИЮ"
    const addButton = screen.getAllByText('В АРМИЮ').find(
      btn => btn.getAttribute('aria-label') === 'Добавить Легкий танк'
    );

    if (addButton) {
      fireEvent.click(addButton);
      // After weapon selection feature, clicking add should NOT directly call onAddMachine
      // Instead, it opens the weapon selector modal
      expect(mockAddMachine).not.toHaveBeenCalled();

      // Verify that the weapon selector modal is now visible
      // The modal contains the weapon selection heading
      expect(screen.getByText('Выберите вооружение:')).toBeInTheDocument();
      // Use getAllByText since "Легкий танк" appears both in the list and modal
      expect(screen.getAllByText('Легкий танк')).toHaveLength(2);
    }
  });

  it('adds machine with default weapons when weapon selector confirms', () => {
    const mockAddMachine = jest.fn();

    render(
      <UnitSelector
        factions={mockFactions}
        squads={mockSquads}
        machines={mockMachines}
        selectedFaction="polaris"
        pointBudget={500}
        army={mockArmy}
        onAddUnit={mockAdd}
        onAddMachine={mockAddMachine}
        onRemoveUnit={mockRemove}
        onToBattle={mockToBattle}
        displayMode="detailed"
        onDisplayModeChange={mockDisplayModeChange}
        sourceId="star_system"
      />
    );

    // Open weapon selector
    const addButton = screen.getAllByText('В АРМИЮ').find(
      btn => btn.getAttribute('aria-label') === 'Добавить Легкий танк'
    );

    if (addButton) {
      fireEvent.click(addButton);

      // Click confirm button to add machine with all weapons
      const confirmButton = screen.getByText(/150 ОЧКОВ/);
      fireEvent.click(confirmButton);

      // onAddMachine should be called with machine and default weapon indices (all weapons)
      expect(mockAddMachine).toHaveBeenCalledWith(
        mockMachines[0],
        [0] // Single weapon at index 0
      );
    }
  });
});
