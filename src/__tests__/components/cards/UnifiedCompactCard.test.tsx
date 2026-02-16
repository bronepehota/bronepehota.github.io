import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedCompactCard } from '@/components/cards/UnifiedCompactCard';
import { FactionID } from '@/lib/types';

const mockSquad = {
  id: 'test-squad',
  name: 'Test Squad',
  shortName: 'TS',
  faction: 'polaris' as FactionID,
  cost: 100,
  soldiers: [
    { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
  ]
};

const mockMachine = {
  id: 'test-machine',
  name: 'Test Machine',
  shortName: 'TM',
  faction: 'protectorate' as FactionID,
  cost: 150,
  rank: 2,
  fire_rate: 2,
  ammo_max: 20,
  durability_max: 16,
  speed_sectors: [{ min_durability: 1, max_durability: 16, speed: 2 }],
  weapons: [{ name: 'Gun', range: 'D12', power: '2D12' }]
};

describe('UnifiedCompactCard', () => {
  describe('add mode', () => {
    it('should render squad in add mode', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={jest.fn()}
          canAfford={true}
        />
      );

      expect(screen.getByText('Test Squad')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByLabelText(/добавить/i)).toBeInTheDocument();
    });

    it('should call onAction when add button clicked', () => {
      const onAction = jest.fn();
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={onAction}
          canAfford={true}
        />
      );

      const addButton = screen.getByLabelText(/добавить/i);
      fireEvent.click(addButton);

      expect(onAction).toHaveBeenCalledWith(mockSquad);
    });

    it('should be disabled when cannot afford', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={jest.fn()}
          canAfford={false}
        />
      );

      const card = screen.getByTestId('compact-unit-card-test-squad');
      expect(card).toHaveClass('opacity-60', 'cursor-not-allowed');
    });
  });

  describe('remove mode', () => {
    it('should render in remove mode', () => {
      const mockArmyUnit = {
        instanceId: 'test-instance',
        type: 'squad' as const,
        data: mockSquad
      };

      render(
        <UnifiedCompactCard
          unit={mockArmyUnit}
          mode="remove"
          factionId="polaris"
          onAction={jest.fn()}
        />
      );

      expect(screen.getByText('Test Squad')).toBeInTheDocument();
      expect(screen.getByLabelText(/удалить/i)).toBeInTheDocument();
    });

    it('should call onAction when remove button clicked', () => {
      const onAction = jest.fn();
      const mockArmyUnit = {
        instanceId: 'test-instance',
        type: 'squad' as const,
        data: mockSquad
      };

      render(
        <UnifiedCompactCard
          unit={mockArmyUnit}
          mode="remove"
          factionId="polaris"
          onAction={onAction}
        />
      );

      const removeButton = screen.getByLabelText(/удалить/i);
      fireEvent.click(removeButton);

      expect(onAction).toHaveBeenCalledWith(mockArmyUnit);
    });

    it('should not show remove button in readonly mode', () => {
      const mockArmyUnit = {
        instanceId: 'test-instance',
        type: 'squad' as const,
        data: mockSquad
      };

      render(
        <UnifiedCompactCard
          unit={mockArmyUnit}
          mode="remove"
          factionId="polaris"
          onAction={jest.fn()}
          readonly={true}
        />
      );

      expect(screen.queryByLabelText(/удалить/i)).not.toBeInTheDocument();
    });
  });

  describe('view mode', () => {
    it('should render in view mode without action buttons', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="polaris"
        />
      );

      expect(screen.getByText('Test Squad')).toBeInTheDocument();
      expect(screen.queryByLabelText(/добавить/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/удалить/i)).not.toBeInTheDocument();
    });

    it('should call onClick when card clicked in view mode', () => {
      const onClick = jest.fn();
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="polaris"
          onClick={onClick}
        />
      );

      const card = screen.getByTestId('compact-unit-card-test-squad');
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledWith(mockSquad);
    });
  });

  describe('faction colors', () => {
    it('should apply polaris colors', () => {
      const { container } = render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="polaris"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-red-500');
      expect(card).toHaveClass('border-l-4');
    });

    it('should apply protectorate colors', () => {
      const { container } = render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="protectorate"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-cyan-500');
      expect(card).toHaveClass('border-l-4');
    });

    it('should apply mercenaries colors', () => {
      const { container } = render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="mercenaries"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-yellow-500');
      expect(card).toHaveClass('border-l-4');
    });
  });

  describe('ArmyUnit support', () => {
    it('should render ArmyUnit with instance number', () => {
      const mockArmyUnit = {
        instanceId: 'test-instance',
        type: 'squad' as const,
        instanceNumber: 3,
        data: mockSquad
      };

      render(
        <UnifiedCompactCard
          unit={mockArmyUnit}
          mode="remove"
          factionId="polaris"
          onAction={jest.fn()}
        />
      );

      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should render machine ArmyUnit', () => {
      const mockMachineUnit = {
        instanceId: 'machine-instance',
        type: 'machine' as const,
        data: mockMachine
      };

      render(
        <UnifiedCompactCard
          unit={mockMachineUnit}
          mode="remove"
          factionId="protectorate"
          onAction={jest.fn()}
        />
      );

      expect(screen.getByText('Test Machine')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  describe('countInArmy badge', () => {
    it('should display count badge when countInArmy > 0', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={jest.fn()}
          canAfford={true}
          countInArmy={2}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not display count badge when countInArmy is 0', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={jest.fn()}
          canAfford={true}
          countInArmy={0}
        />
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('custom dataTestId', () => {
    it('should use custom dataTestId', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="polaris"
          dataTestId="custom-test-id"
        />
      );

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('quick stats', () => {
    it('should display quick stats for squad in add mode', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="add"
          factionId="polaris"
          onAction={jest.fn()}
          canAfford={true}
        />
      );

      expect(screen.getByText(/R5/)).toBeInTheDocument();
      expect(screen.getByText(/1 бойцов/)).toBeInTheDocument();
    });

    it('should display quick stats for machine in add mode', () => {
      render(
        <UnifiedCompactCard
          unit={mockMachine}
          mode="add"
          factionId="protectorate"
          onAction={jest.fn()}
          canAfford={true}
        />
      );

      expect(screen.getByText(/R2/)).toBeInTheDocument();
      expect(screen.getByText(/Прч16/)).toBeInTheDocument();
    });
  });

  describe('type labels', () => {
    it('should show ОТРЯД for squads', () => {
      render(
        <UnifiedCompactCard
          unit={mockSquad}
          mode="view"
          factionId="polaris"
        />
      );

      expect(screen.getByText('ОТРЯД')).toBeInTheDocument();
    });

    it('should show МАШИНА for machines', () => {
      render(
        <UnifiedCompactCard
          unit={mockMachine}
          mode="view"
          factionId="protectorate"
        />
      );

      expect(screen.getByText('МАШИНА')).toBeInTheDocument();
    });
  });
});
