import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders unit name and cost', () => {
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={false}
        onToggleDone={jest.fn()}
        onOpenDetails={jest.fn()}
      />
    );

    expect(screen.getByText('Test Squad')).toBeInTheDocument();
    expect(screen.getByText('100 очк')).toBeInTheDocument();
  });

  it('shows done icon when done', () => {
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={true}
        onToggleDone={jest.fn()}
        onOpenDetails={jest.fn()}
      />
    );

    const doneIcon = document.querySelector('svg'); // CheckCircle icon
    expect(doneIcon).toBeInTheDocument();
  });

  it('calls onToggleDone when done button clicked', () => {
    const onToggleDone = jest.fn();
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={false}
        onToggleDone={onToggleDone}
        onOpenDetails={jest.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    const doneButton = buttons[buttons.length - 1]; // Last button is done toggle
    fireEvent.click(doneButton);

    expect(onToggleDone).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenDetails when encyclopedia button clicked', () => {
    const onOpenDetails = jest.fn();
    render(
      <UnitCardHeader
        unit={mockUnit}
        isDone={false}
        onToggleDone={jest.fn()}
        onOpenDetails={onOpenDetails}
      />
    );

    // Find the encyclopedia button (has aria-label="Открыть энциклопедию")
    const encyclopediaButton = screen.getByLabelText('Открыть энциклопедию');
    fireEvent.click(encyclopediaButton);

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
  });
});
