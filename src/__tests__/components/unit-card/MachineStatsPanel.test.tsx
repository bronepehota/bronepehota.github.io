import { render, screen, fireEvent } from '@testing-library/react';
import { MachineStatsPanel } from '@/components/cards/unit-card/machine-view/MachineStatsPanel';
import { DurabilityZone } from '@/lib/types';

describe('MachineStatsPanel', () => {
  const mockZone: DurabilityZone = {
    max: 16,
    color: 'green',
    damagePerDie: { D6: 1, D12: 2, D20: 3 }
  };

  const defaultProps = {
    currentDurability: 12,
    maxDurability: 16,
    speed: 2,
    zone: mockZone,
    onUpdateDurability: jest.fn(),
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5
  };

  it('renders durability and speed values', () => {
    render(<MachineStatsPanel {...defaultProps} />);

    expect(screen.getByText('12')).toBeInTheDocument(); // Durability
    expect(screen.getByText('2шаг')).toBeInTheDocument(); // Speed
  });

  it('calls onUpdateDurability with -1 when damage button clicked', () => {
    const onUpdateDurability = jest.fn();
    render(<MachineStatsPanel {...defaultProps} onUpdateDurability={onUpdateDurability} />);

    const buttons = screen.getAllByRole('button');
    const damageButton = buttons[0]; // First button is damage
    fireEvent.click(damageButton);

    expect(onUpdateDurability).toHaveBeenCalledWith(-1);
  });

  it('disables damage button at durability 0', () => {
    render(<MachineStatsPanel {...defaultProps} currentDurability={0} />);

    const buttons = screen.getAllByRole('button');
    const damageButton = buttons[0];
    expect(damageButton).toBeDisabled();
  });
});
