import { render, screen } from '@testing-library/react';
import { UnitCardHeader } from '@/components/cards/unit-card/UnitCardHeader';
import { ArmyUnit, Squad } from '@/lib/types';

describe('UnitCardHeader', () => {
  const mockSquad: Squad = {
    id: 'test_squad',
    name: 'Test Squad',
    shortName: 'TS',
    faction: 'polaris',
    cost: 100,
    soldiers: []
  };

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    instanceNumber: 1,
    type: 'squad',
    data: mockSquad,
    actionsUsed: [],
    grenadesUsed: false
  };

  it('renders unit name', () => {
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={false}
      />
    );

    expect(screen.getByText('Test Squad')).toBeInTheDocument();
  });

  it('shows done icon when done', () => {
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={true}
      />
    );

    const doneIcon = document.querySelector('svg'); // CheckCircle icon
    expect(doneIcon).toBeInTheDocument();
  });

  it('does not show done icon when not done', () => {
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={false}
      />
    );

    const doneIcon = document.querySelector('svg');
    expect(doneIcon).not.toBeInTheDocument();
  });
});
