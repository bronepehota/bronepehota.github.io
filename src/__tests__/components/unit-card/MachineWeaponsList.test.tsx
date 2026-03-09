import { render, screen, fireEvent } from '@testing-library/react';
import { MachineWeaponsList } from '@/components/cards/unit-card/machine-view/MachineWeaponsList';
import { Weapon } from '@/lib/types';

describe('MachineWeaponsList', () => {
  const mockWeapons: Weapon[] = [
    { name: 'Cannon', range: 'D12', power: '2D20' },
    { name: 'MG', range: 'D6', power: '1D12' }
  ];

  const defaultProps = {
    weapons: mockWeapons,
    weaponShots: { 0: 0, 1: 0 },
    onWeaponAttack: jest.fn(),
    onWeaponInfo: jest.fn(),
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5
  };

  it('renders all weapons', () => {
    render(<MachineWeaponsList {...defaultProps} />);

    expect(screen.getByText('Cannon')).toBeInTheDocument();
    expect(screen.getByText('MG')).toBeInTheDocument();
  });

  it('calls onWeaponAttack when fire button clicked', () => {
    const onWeaponAttack = jest.fn();
    render(<MachineWeaponsList {...defaultProps} onWeaponAttack={onWeaponAttack} />);

    // Find the fire button by title (since it has dynamic text)
    const fireButton = screen.getAllByTitle('Выстрел')[0];
    fireEvent.click(fireButton);

    expect(onWeaponAttack).toHaveBeenCalledWith(0);
  });

  it('calls onWeaponInfo when info button clicked', () => {
    const onWeaponInfo = jest.fn();
    render(<MachineWeaponsList {...defaultProps} onWeaponInfo={onWeaponInfo} />);

    // Find the info button by title
    const infoButton = screen.getAllByTitle('Информация об оружии')[0];
    fireEvent.click(infoButton);

    expect(onWeaponInfo).toHaveBeenCalledWith(0);
  });
});
