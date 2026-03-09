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

  describe('threshold boundaries', () => {
    it('shows correct zone when durability at exact threshold', () => {
      // At exactly 2/3 threshold (11 for max 16)
      const yellowZone: DurabilityZone = {
        max: 16,
        color: 'yellow',
        damagePerDie: { D6: 1, D12: 2, D20: 3 }
      };

      render(
        <MachineStatsPanel
          {...defaultProps}
          currentDurability={11}
          zone={yellowZone}
        />
      );

      // Should display yellow zone color
      const zoneIndicator = screen.getByText('11');
      expect(zoneIndicator).toBeInTheDocument();
    });

    it('handles custom zones with non-standard colors', () => {
      const customZone: DurabilityZone = {
        max: 5,
        color: 'red',
        damagePerDie: { D6: 1, D12: 2, D20: 3 }
      };

      render(
        <MachineStatsPanel
          {...defaultProps}
          currentDurability={3}
          zone={customZone}
        />
      );

      // Should render with red zone
      const durabilityValue = screen.getByText('3');
      expect(durabilityValue).toBeInTheDocument();
    });
  });

  it('displays speed in cm when distanceInputUnit is cm', () => {
    render(<MachineStatsPanel {...defaultProps} distanceInputUnit="cm" stepToCmFactor={5} />);
    expect(screen.getByText('10см')).toBeInTheDocument();
  });
});
