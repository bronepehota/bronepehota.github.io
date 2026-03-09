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

  describe('dead pilot', () => {
    it('shows pilot as dead when pilotInfo.alive=false', () => {
      const deadPilot: PilotInfo = {
        squadInstanceId: 'squad-1',
        soldierIndex: 0,
        pilotArmor: 2,
        alive: false
      };

      render(
        <MachinePilotPanel
          {...defaultProps}
          pilotInfo={deadPilot}
          pilotImage="/images/pilot.jpg"
        />
      );

      expect(screen.getByText('ПОГИБ')).toBeInTheDocument();
    });
  });

  describe('survival test', () => {
    const mockPilotInfo: PilotInfo = {
      squadInstanceId: 'squad-1',
      soldierIndex: 0,
      pilotArmor: 2,
      alive: true
    };

    it('shows survival test result with green background for survived', () => {
      const survivalTest = { roll: 12, survived: true, testedAt: Date.now() };

      render(
        <MachinePilotPanel
          {...defaultProps}
          pilotInfo={mockPilotInfo}
          pilotImage="/images/pilot.jpg"
          survivalTest={survivalTest}
        />
      );

      const buttons = screen.getAllByRole('button');
      const testButton = buttons[1]; // Survival test button
      expect(testButton).toHaveClass('bg-green-600');
    });

    it('shows survival test result with red background for died', () => {
      const survivalTest = { roll: 3, survived: false, testedAt: Date.now() };

      render(
        <MachinePilotPanel
          {...defaultProps}
          pilotInfo={mockPilotInfo}
          pilotImage="/images/pilot.jpg"
          survivalTest={survivalTest}
        />
      );

      const buttons = screen.getAllByRole('button');
      const testButton = buttons[1]; // Survival test button
      expect(testButton).toHaveClass('bg-red-600');
    });

    it('disables survival test button during test', () => {
      render(
        <MachinePilotPanel
          {...defaultProps}
          pilotInfo={mockPilotInfo}
          pilotImage="/images/pilot.jpg"
          isTestRunning={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const testButton = buttons[1]; // Survival test button
      expect(testButton).toBeDisabled();
    });
  });
});
