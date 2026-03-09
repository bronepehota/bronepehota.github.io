import { render, screen, fireEvent } from '@testing-library/react';
import { MachineAmmoPanel } from '@/components/cards/unit-card/machine-view/MachineAmmoPanel';
import { Weapon } from '@/lib/types';

describe('MachineAmmoPanel', () => {
  const mockWeapons: Weapon[] = [
    { name: 'Cannon', range: 'D12', power: '2D20' },
    { name: 'MG', range: 'D6', power: '1D12' }
  ];

  const defaultProps = {
    currentAmmo: 15,
    maxAmmo: 20,
    shotsUsed: 0,
    fireRate: 2,
    weapons: mockWeapons,
    weaponAmmo: [15, 15],
    onUpdateAmmo: jest.fn(),
    usePerWeaponAmmo: false
  };

  it('renders ammo count and shots used', () => {
    render(<MachineAmmoPanel {...defaultProps} />);

    expect(screen.getByText(/15.*20/)).toBeInTheDocument(); // Current ammo (15/20)
    expect(screen.getByText(/0.*2/)).toBeInTheDocument(); // Shots used (0/2)
  });

  it('renders segmented ammo bar for tehnolog rules', () => {
    render(<MachineAmmoPanel {...defaultProps} usePerWeaponAmmo={false} />);

    // Check for ammo segments (should be 20 for maxAmmo)
    const ammoSegments = screen.getAllByText(/15.*20/);
    expect(ammoSegments.length).toBeGreaterThan(0);

    // Verify specific ammo count display
    expect(screen.getByText(/15.*20/)).toBeInTheDocument();
  });

  it('renders per-weapon ammo display for community star system', () => {
    render(<MachineAmmoPanel {...defaultProps} usePerWeaponAmmo={true} />);

    // Should show weapon names with ammo counts
    expect(screen.getByText('Cannon')).toBeInTheDocument();
    expect(screen.getByText('MG')).toBeInTheDocument();
  });

  it('calls onUpdateAmmo when increment button clicked', () => {
    const onUpdateAmmo = jest.fn();
    render(<MachineAmmoPanel {...defaultProps} usePerWeaponAmmo={false} onUpdateAmmo={onUpdateAmmo} />);

    // Find increment button (Plus icon)
    const incrementButton = screen.getByTitle('Увеличить боезапас');
    fireEvent.click(incrementButton);

    expect(onUpdateAmmo).toHaveBeenCalledWith(1);
  });

  it('calls onUpdateAmmo when decrement button clicked', () => {
    const onUpdateAmmo = jest.fn();
    render(<MachineAmmoPanel {...defaultProps} usePerWeaponAmmo={false} onUpdateAmmo={onUpdateAmmo} />);

    // Find decrement button (Minus icon)
    const decrementButton = screen.getByTitle('Уменьшить боезапас');
    fireEvent.click(decrementButton);

    expect(onUpdateAmmo).toHaveBeenCalledWith(-1);
  });

  it('disables increment button when ammo is at max', () => {
    render(<MachineAmmoPanel {...defaultProps} currentAmmo={20} maxAmmo={20} usePerWeaponAmmo={false} />);

    const incrementButton = screen.getByTitle('Увеличить боезапас');
    expect(incrementButton).toBeDisabled();
  });

  it('disables decrement button when ammo is at 0', () => {
    render(<MachineAmmoPanel {...defaultProps} currentAmmo={0} maxAmmo={20} usePerWeaponAmmo={false} />);

    const decrementButton = screen.getByTitle('Уменьшить боезапас');
    expect(decrementButton).toBeDisabled();
  });

  it('does not render increment/decrement buttons when onUpdateAmmo is not provided', () => {
    render(<MachineAmmoPanel {...defaultProps} usePerWeaponAmmo={false} onUpdateAmmo={undefined} />);

    expect(screen.queryByTitle('Увеличить боезапас')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Уменьшить боезапас')).not.toBeInTheDocument();
  });

  it('shows total ammo count for community star system', () => {
    render(<MachineAmmoPanel {...defaultProps} usePerWeaponAmmo={true} weaponAmmo={[10, 5]} />);

    // Total ammo: 10 + 5 = 15, Max: 20 + 20 = 40 (weapons don't have ammo property, so uses maxAmmo)
    expect(screen.getByText(/15.*40/)).toBeInTheDocument();
  });
});
