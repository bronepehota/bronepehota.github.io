import { render, screen, fireEvent } from '@testing-library/react';
import { PilotChip } from '@/components/cards/unit-card/machine-view/PilotChip';
import { PilotInfo } from '@/lib/types';

describe('PilotChip', () => {
  const alivePilot: PilotInfo = {
    squadInstanceId: 'squad-1', soldierIndex: 0, pilotArmor: 3, alive: true,
  };

  it('no pilot: shows "назначить" + assign-pilot-button test-id', () => {
    render(<PilotChip pilotInfo={null} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    const chip = screen.getByTestId('assign-pilot-button');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent(/назначить/i);
  });

  it('alive pilot: shows ЖИВ', () => {
    render(<PilotChip pilotInfo={alivePilot} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    expect(screen.getByText(/жив/i)).toBeInTheDocument();
  });

  it('shows pilotLabel (name + number) instead of "Пилот назначен" when provided', () => {
    render(<PilotChip pilotInfo={alivePilot} pilotLabel="ЛИНЕ #3·1" pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    expect(screen.getByText('ЛИНЕ #3·1')).toBeInTheDocument();
    expect(screen.queryByText('Пилот назначен')).not.toBeInTheDocument();
  });

  it('falls back to "Пилот назначен" when pilotLabel is not provided', () => {
    render(<PilotChip pilotInfo={alivePilot} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    expect(screen.getByText('Пилот назначен')).toBeInTheDocument();
  });

  it('dead pilot: shows ПОГИБ', () => {
    const dead = { ...alivePilot, alive: false };
    render(<PilotChip pilotInfo={dead} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
    expect(screen.getByText(/погиб/i)).toBeInTheDocument();
  });

  it('urgent + alive: shows тревога marker', () => {
    render(<PilotChip pilotInfo={alivePilot} pilotTestUrgent={true} onOpenPilot={jest.fn()} />);
    expect(screen.getByText(/тревога/i)).toBeInTheDocument();
  });

  it('click calls onOpenPilot', () => {
    const onOpenPilot = jest.fn();
    render(<PilotChip pilotInfo={alivePilot} pilotTestUrgent={false} onOpenPilot={onOpenPilot} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenPilot).toHaveBeenCalledTimes(1);
  });
});
