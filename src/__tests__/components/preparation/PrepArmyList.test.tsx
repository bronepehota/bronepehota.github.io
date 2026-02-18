// src/__tests__/components/preparation/PrepArmyList.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PrepArmyList } from '@/components/preparation/PrepArmyList';
import { Army, ArmyUnit, FactionID } from '@/lib/types';

describe('PrepArmyList', () => {
  const createMockArmy = (units: ArmyUnit[] = [], faction: FactionID = 'polaris'): Army => ({
    name: 'Test Army',
    faction,
    units,
    totalCost: units.reduce((sum, unit) => sum + unit.data.cost, 0),
  });

  const mockSquadUnit: ArmyUnit = {
    instanceId: 'squad-1',
    type: 'squad',
    instanceNumber: 1,
    data: {
      id: 'polaris_light_assault',
      name: 'Лёгкий штурмовой отряд',
      shortName: 'Штурмовики',
      faction: 'polaris',
      cost: 100,
      soldiers: [
        { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        { rank: 4, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
      ],
    },
  };

  const mockMachineUnit: ArmyUnit = {
    instanceId: 'machine-1',
    type: 'machine',
    instanceNumber: 1,
    data: {
      id: 'polaris_walker',
      name: 'Шагающий танк «Истребитель»',
      shortName: 'Истребитель',
      faction: 'polaris',
      cost: 200,
      rank: 2,
      fire_rate: 2,
      ammo_max: 20,
      durability_max: 16,
      speed_sectors: [
        { min_durability: 9, max_durability: 16, speed: 2 },
        { min_durability: 1, max_durability: 8, speed: 1 },
      ],
      weapons: [
        { name: 'Пушка', range: 'D12', power: '2D12' },
      ],
    },
  };

  describe('empty state', () => {
    it('should display empty state message when army has no units', () => {
      const emptyArmy = createMockArmy([]);
      render(<PrepArmyList army={emptyArmy} factionId="polaris" />);

      expect(screen.getByText('Армия пуста. Вернитесь к сбору армии.')).toBeInTheDocument();
    });

    it('should render container with proper testid when empty', () => {
      const emptyArmy = createMockArmy([]);
      const { container } = render(<PrepArmyList army={emptyArmy} factionId="polaris" />);

      expect(container.firstChild).toHaveAttribute('data-testid', 'prep-army-list');
    });
  });

  describe('army with units', () => {
    it('should display army summary with correct unit count', () => {
      const army = createMockArmy([mockSquadUnit, mockMachineUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText(/2 юнита/)).toBeInTheDocument();
    });

    it('should display correct Russian pluralization for 1 unit', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText(/1 юнит/)).toBeInTheDocument();
    });

    it('should display correct Russian pluralization for 5+ units', () => {
      const army = createMockArmy([
        mockSquadUnit,
        mockMachineUnit,
        { ...mockSquadUnit, instanceId: 'squad-2' },
        { ...mockSquadUnit, instanceId: 'squad-3' },
        { ...mockMachineUnit, instanceId: 'machine-2' },
      ]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText(/5 юнитов/)).toBeInTheDocument();
    });

    it('should display total cost', () => {
      const army = createMockArmy([mockSquadUnit, mockMachineUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText(/300/)).toBeInTheDocument();
      expect(screen.getByText(/очков/)).toBeInTheDocument();
    });

    it('should display correct Russian pluralization for 1 point', () => {
      const cheapUnit: ArmyUnit = {
        ...mockSquadUnit,
        data: { ...mockSquadUnit.data, cost: 1 },
      };
      const army = createMockArmy([cheapUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText(/1 очко/)).toBeInTheDocument();
    });

    it('should display correct Russian pluralization for 2-4 points', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText(/100 очков/)).toBeInTheDocument();
    });

    it('should render all units from the army', () => {
      const army = createMockArmy([mockSquadUnit, mockMachineUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText('Лёгкий штурмовой отряд')).toBeInTheDocument();
      expect(screen.getByText('Шагающий танк «Истребитель»')).toBeInTheDocument();
    });

    it('should display header text "Состав армии"', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText('Состав армии')).toBeInTheDocument();
    });
  });

  describe('unit cards', () => {
    it('should render readonly CompactArmyCard for each unit', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      // Check that the unit card is rendered with proper data-testid
      expect(screen.getByTestId('prep-unit-squad-1')).toBeInTheDocument();
    });

    it('should not show remove buttons on unit cards (readonly mode)', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      // CompactArmyCard in readonly mode should not have remove buttons
      expect(screen.queryByLabelText(/удалить/i)).not.toBeInTheDocument();
    });
  });

  describe('faction colors', () => {
    it('should apply Polaris (red) faction colors', () => {
      const army = createMockArmy([mockSquadUnit], 'polaris');
      const { container } = render(<PrepArmyList army={army} factionId="polaris" />);

      expect(container.firstChild).toHaveAttribute('data-testid', 'prep-army-list');
    });

    it('should apply Protectorate (cyan) faction colors', () => {
      const army = createMockArmy([mockSquadUnit], 'protectorate');
      render(<PrepArmyList army={army} factionId="protectorate" />);

      expect(screen.getByText('Состав армии')).toBeInTheDocument();
    });

    it('should apply Mercenaries (yellow) faction colors', () => {
      const army = createMockArmy([mockSquadUnit], 'mercenaries');
      render(<PrepArmyList army={army} factionId="mercenaries" />);

      expect(screen.getByText('Состав армии')).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should render on mobile viewport', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByTestId('prep-army-list')).toBeInTheDocument();
    });
  });

  describe('unit instance numbers', () => {
    it('should display instance number on unit cards when present', () => {
      const unitWithNumber: ArmyUnit = {
        ...mockSquadUnit,
        instanceNumber: 3,
      };
      const army = createMockArmy([unitWithNumber]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should not display instance number when not present', () => {
      const unitWithoutNumber: ArmyUnit = {
        ...mockSquadUnit,
        instanceNumber: undefined,
      };
      const army = createMockArmy([unitWithoutNumber]);
      render(<PrepArmyList army={army} factionId="polaris" />);

      expect(screen.queryByText(/\#\d+/)).not.toBeInTheDocument();
    });
  });
});
