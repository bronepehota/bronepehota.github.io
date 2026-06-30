import { render } from '@testing-library/react';
import { SquadView } from '@/components/cards/unit-card/SquadView';
import { ArmyUnit, Squad } from '@/lib/types';

describe('SquadView', () => {
  const mockSquad: Squad = {
    id: 'test_squad',
    name: 'Test Squad',
    shortName: 'TS',
    faction: 'polaris',
    cost: 100,
    soldiers: [
      { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 }
    ]
  };

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'squad',
    data: mockSquad,
    actionsUsed: []
  };

  const defaultProps = {
    unit: mockUnit,
    updateUnit: jest.fn(),
    onSoldierAction: jest.fn(),
    setShowSoldierImage: jest.fn(),
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5,
    allUnits: [],
    getSoldierImage: jest.fn((idx: number) => `/images/soldier-${idx}.png`)
  };

  it('renders soldiers grid', () => {
    const { container } = render(<SquadView {...defaultProps} />);

    // Check that the grid container exists
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();

    // Check that SoldierCard components are rendered by looking for the status stripe
    const statusStripes = container.querySelectorAll('[data-testid="soldier-status-stripe"]');
    expect(statusStripes.length).toBe(1);
  });
});
