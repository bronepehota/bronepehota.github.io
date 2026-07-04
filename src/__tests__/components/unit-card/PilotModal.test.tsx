import { render, screen, fireEvent } from '@testing-library/react';
import { PilotModal } from '@/components/cards/unit-card/machine-view/PilotModal';
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

describe('PilotModal', () => {
  it('closed: renders nothing', () => {
    const { container } = render(<PilotModal {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('open + alive: shows portrait, броня, test button, сменить', () => {
    render(<PilotModal {...baseProps} />);
    expect(screen.getByAltText('Пилот')).toBeInTheDocument();
    expect(screen.getByText(/броня/i)).toHaveTextContent('3');
    expect(screen.getByTestId('pilot-modal-test-button')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /сменить/i })).toBeInTheDocument();
  });

  it('open + dead: no test button', () => {
    render(<PilotModal {...baseProps} pilotInfo={{ ...alivePilot, alive: false }} />);
    expect(screen.queryByTestId('pilot-modal-test-button')).not.toBeInTheDocument();
  });

  it('test button calls onSurvivalTest', () => {
    render(<PilotModal {...baseProps} />);
    fireEvent.click(screen.getByTestId('pilot-modal-test-button'));
    expect(baseProps.onSurvivalTest).toHaveBeenCalledTimes(1);
  });

  it('сменить calls onAssignPilot', () => {
    render(<PilotModal {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /сменить/i }));
    expect(baseProps.onAssignPilot).toHaveBeenCalledTimes(1);
  });

  it('backdrop click calls onClose', () => {
    const onClose = jest.fn();
    render(<PilotModal {...baseProps} onClose={onClose} />);
    // The dialog container (role=dialog) is the backdrop-click target.
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
