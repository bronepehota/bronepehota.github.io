import { render, screen, fireEvent } from '@testing-library/react';
import { MachinePilotPanel } from '@/components/cards/unit-card/machine-view/MachinePilotPanel';
import { PilotInfo } from '@/lib/types';

describe('MachinePilotPanel', () => {
  const defaultProps = {
    pilotInfo: null,
    pilotImage: null,
    survivalTest: null,
    onAssignPilot: jest.fn(),
    onSurvivalTest: jest.fn()
  };

  it('shows empty state when no pilot assigned', () => {
    render(<MachinePilotPanel {...defaultProps} />);

    expect(screen.getByText('Пилот')).toBeInTheDocument();
  });

  it('shows pilot image when assigned', () => {
    const mockPilot: PilotInfo = {
      squadInstanceId: 'squad-1',
      soldierIndex: 0,
      pilotArmor: 2,
      alive: true
    };

    render(
      <MachinePilotPanel
        {...defaultProps}
        pilotInfo={mockPilot}
        pilotImage="/images/pilot.jpg"
      />
    );

    expect(screen.getByText('ЖИВ')).toBeInTheDocument();
  });

  it('calls onAssignPilot when clicked', () => {
    const onAssignPilot = jest.fn();
    render(<MachinePilotPanel {...defaultProps} onAssignPilot={onAssignPilot} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onAssignPilot).toHaveBeenCalled();
  });
});
