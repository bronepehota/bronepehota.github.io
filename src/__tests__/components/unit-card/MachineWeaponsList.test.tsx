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
    fireRate: 2,
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

  it('disables fire button when fire rate limit is reached', () => {
    const props = {
      ...defaultProps,
      weaponShots: { 0: 2, 1: 0 }, // Weapon 0 has fired 2 times (equal to fireRate)
      fireRate: 2
    };
    render(<MachineWeaponsList {...props} />);

    // Find the fire button for weapon 0
    const fireButtons = screen.getAllByTitle('Лимит выстрелов исчерпан');
    expect(fireButtons.length).toBeGreaterThan(0);

    // Button should be disabled
    expect(fireButtons[0]).toBeDisabled();
  });

  it('keeps fire button enabled when shots are below fire rate limit', () => {
    const props = {
      ...defaultProps,
      weaponShots: { 0: 1, 1: 0 }, // Weapon 0 has fired 1 time (below fireRate)
      fireRate: 2
    };
    render(<MachineWeaponsList {...props} />);

    // Find the fire button for weapon 0
    const fireButtons = screen.getAllByTitle('Выстрел');
    expect(fireButtons.length).toBeGreaterThan(0);

    // Button should not be disabled
    expect(fireButtons[0]).not.toBeDisabled();
  });
});
