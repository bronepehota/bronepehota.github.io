import { render, screen } from '@testing-library/react';
import { PrepArmyList } from '@/components/preparation/PrepArmyList';
import { Army, ArmyUnit, FactionID } from '@/lib/types';
import { Squad, Machine } from '@/lib/types';

describe('PrepArmyList', () => {
  const createMockArmy = (units: ArmyUnit[] = [], faction: FactionID = 'polaris'): Army => ({
    name: 'Test Army',
    faction,
    units,
    totalCost: units.reduce((sum, unit) => sum + unit.data.cost, 0),
    currentStep: 'unit-select',
    isInBattle: false,
    currentTurn: 1,
  });

  const mockSquadUnit: ArmyUnit = {
    instanceId: 'squad-1',
    type: 'squad',
    instanceNumber: 1,
    data: {
      id: 'polaris_light_assault',
      name: 'Штурмовики',
      shortName: 'Штурмовики',
      faction: 'polaris',
      cost: 100,
      image: '/images/squads/light-assault.jpg',
      soldiers: [
        { num: 1, rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2, image: '/images/soldiers/1.jpg' },
        { num: 2, rank: 4, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2, image: '/images/soldiers/2.jpg' },
      ],
    } as Squad,
    currentDurability: undefined,
    currentAmmo: undefined,
    deadSoldiers: [],
    actionsUsed: [],
  };

  const mockMachineUnit: ArmyUnit = {
    instanceId: 'machine-1',
    type: 'machine',
    instanceNumber: 1,
    data: {
      id: 'polaris_walker',
      name: 'Танк «Гром»',
      shortName: 'Гром',
      faction: 'polaris',
      cost: 200,
      image: '/images/machines/tank.jpg',
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
    } as Machine,
    currentDurability: 16,
    currentAmmo: 20,
    deadSoldiers: undefined,
    actionsUsed: [{ moved: false, shot: false, melee: false, done: false }],
    machineShotsUsed: 0,
    machineWeaponShots: {},
  };

  describe('empty state', () => {
    it('should display empty state message when army has no units', () => {
      const emptyArmy = createMockArmy([]);
      render(<PrepArmyList army={emptyArmy} />);

      expect(screen.getByText('Армия пуста. Вернитесь к сбору армии.')).toBeInTheDocument();
    });

    it('should render container with proper testid when empty', () => {
      const emptyArmy = createMockArmy([]);
      render(<PrepArmyList army={emptyArmy} />);

      expect(screen.getByTestId('prep-army-list')).toBeInTheDocument();
    });
  });

  describe('squad units', () => {
    it('should display squad name', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} />);

      expect(screen.getByText('Штурмовики')).toBeInTheDocument();
    });

    it('should render soldier images for squad', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} />);

      const images = screen.getAllByRole('img');
      expect(images.length).toBe(2); // 2 soldiers
    });

    it('should use fallback image when soldier image is missing', () => {
      const squadWithoutSoldierImages: ArmyUnit = {
        ...mockSquadUnit,
        data: {
          ...mockSquadUnit.data,
          soldiers: [
            { num: 1, rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
          ],
        } as Squad,
      };
      const army = createMockArmy([squadWithoutSoldierImages]);
      render(<PrepArmyList army={army} />);

      // Should still render image with fallback
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('machine units', () => {
    it('should display machine name', () => {
      const army = createMockArmy([mockMachineUnit]);
      render(<PrepArmyList army={army} />);

      expect(screen.getByText(/Танк/)).toBeInTheDocument();
      expect(screen.getByText(/Гром/)).toBeInTheDocument();
    });

    it('should render single image for machine', () => {
      const army = createMockArmy([mockMachineUnit]);
      render(<PrepArmyList army={army} />);

      const images = screen.getAllByRole('img');
      expect(images.length).toBe(1);
    });
  });

  describe('instance numbers', () => {
    it('should display instance number when greater than 1', () => {
      const unitWithNumber: ArmyUnit = {
        ...mockSquadUnit,
        instanceNumber: 2,
      };
      const army = createMockArmy([unitWithNumber]);
      render(<PrepArmyList army={army} />);

      expect(screen.getByText(/#2/)).toBeInTheDocument();
    });

    it('should not display instance number when 1', () => {
      const army = createMockArmy([mockSquadUnit]);
      render(<PrepArmyList army={army} />);

      expect(screen.queryByText(/#\d+$/)).not.toBeInTheDocument();
    });
  });

  describe('mixed units', () => {
    it('should display both squad and machine units', () => {
      const army = createMockArmy([mockSquadUnit, mockMachineUnit]);
      render(<PrepArmyList army={army} />);

      expect(screen.getByText('Штурмовики')).toBeInTheDocument();
      expect(screen.getByText(/Танк/)).toBeInTheDocument();
    });

    it('should render correct number of images', () => {
      const army = createMockArmy([mockSquadUnit, mockMachineUnit]);
      render(<PrepArmyList army={army} />);

      const images = screen.getAllByRole('img');
      expect(images.length).toBe(3); // 2 soldiers + 1 machine
    });
  });
});
