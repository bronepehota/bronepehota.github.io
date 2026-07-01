import { render, screen, fireEvent } from '@testing-library/react';
import { PilotSheet } from '@/components/cards/unit-card/machine-view/PilotSheet';
import { PilotInfo } from '@/lib/types';

const alivePilot: PilotInfo = {
  squadInstanceId: 'squad-1', soldierIndex: 0, pilotArmor: 3, alive: true,
};

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  pilotInfo: alivePilot,
  pilotImage: '/images/pilot.png',
  survivalTest: null,
  isTestRunning: false,
  onSurvivalTest: jest.fn(),
  onAssignPilot: jest.fn(),
};

describe('PilotSheet', () => {
  it('closed: renders nothing', () => {
    const { container } = render(<PilotSheet {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('open + alive: shows portrait, броня, test button, сменить', () => {
    render(<PilotSheet {...baseProps} />);
    expect(screen.getByAltText('Пилот')).toBeInTheDocument();
    expect(screen.getByText(/броня/i)).toHaveTextContent('3');
    expect(screen.getByTestId('pilot-sheet-test-button')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /сменить/i })).toBeInTheDocument();
  });

  it('open + dead: no test button', () => {
    render(<PilotSheet {...baseProps} pilotInfo={{ ...alivePilot, alive: false }} />);
    expect(screen.queryByTestId('pilot-sheet-test-button')).not.toBeInTheDocument();
  });

  it('test button calls onSurvivalTest', () => {
    render(<PilotSheet {...baseProps} />);
    fireEvent.click(screen.getByTestId('pilot-sheet-test-button'));
    expect(baseProps.onSurvivalTest).toHaveBeenCalledTimes(1);
  });

  it('сменить calls onAssignPilot', () => {
    render(<PilotSheet {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /сменить/i }));
    expect(baseProps.onAssignPilot).toHaveBeenCalledTimes(1);
  });
});
