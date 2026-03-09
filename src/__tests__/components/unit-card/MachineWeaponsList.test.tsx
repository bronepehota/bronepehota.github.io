import { render, screen, fireEvent } from '@testing-library/react';
import { MachineWeaponsList } from '@/components/cards/unit-card/machine-view/MachineWeaponsList';
import { Weapon } from '@/lib/types';

describe('MachineWeaponsList', () => {
  const mockWeapons: Weapon[] = [
    { name: 'Cannon', range: 'D12', power: '2D20' },
    { name: 'MG', range: 'D6', power: '1D12' },
    { name: 'Melee Spike', range: 'ББ', power: 'D12' }
  ];

  const defaultProps = {
    weapons: mockWeapons,
    weaponShots: { 0: 0, 1: 0, 2: 0 },
    fireRate: 2,
    totalShotsUsed: 0,
    currentAmmo: 10,
    weaponAmmo: undefined,
    usePerWeaponAmmo: false,
    onWeaponAttack: jest.fn(),
    onWeaponInfo: jest.fn(),
    stepToCmFactor: 5
  };

  describe('Basic rendering', () => {
    it('renders all ranged weapons', () => {
      render(<MachineWeaponsList {...defaultProps} />);

      expect(screen.getByText('Cannon')).toBeInTheDocument();
      expect(screen.getByText('MG')).toBeInTheDocument();
    });

    it('renders melee weapons in separate section', () => {
      render(<MachineWeaponsList {...defaultProps} />);

      expect(screen.getByText('Melee Spike')).toBeInTheDocument();
      expect(screen.getByText(/ближний бой/i)).toBeInTheDocument();
    });

    it('handles empty weapons array', () => {
      const props = { ...defaultProps, weapons: [] };

      expect(() => {
        render(<MachineWeaponsList {...props} />);
      }).not.toThrow();
    });

    it('handles weapons with special properties', () => {
      const weaponsWithSpecial: Weapon[] = [
        { name: 'Special Cannon', range: 'D12', power: '2D20', special: 'Explosive' }
      ];

      const props = { ...defaultProps, weapons: weaponsWithSpecial, weaponShots: { 0: 0 } };

      render(<MachineWeaponsList {...props} />);

      expect(screen.getByText('Special Cannon')).toBeInTheDocument();
      expect(screen.getByText('Explosive')).toBeInTheDocument();
    });
  });

  describe('Fire button interactions', () => {
    it('calls onWeaponAttack when fire button clicked', () => {
      const onWeaponAttack = jest.fn();
      render(<MachineWeaponsList {...defaultProps} onWeaponAttack={onWeaponAttack} />);

      const fireButton = screen.getAllByTitle('Выстрел')[0];
      fireEvent.click(fireButton);

      expect(onWeaponAttack).toHaveBeenCalledWith(0);
    });

    it('calls onWeaponInfo when info button clicked', () => {
      const onWeaponInfo = jest.fn();
      render(<MachineWeaponsList {...defaultProps} onWeaponInfo={onWeaponInfo} />);

      const infoButton = screen.getAllByTitle('Информация об оружии')[0];
      fireEvent.click(infoButton);

      expect(onWeaponInfo).toHaveBeenCalledWith(0);
    });

    it('calls onWeaponAttack for each weapon independently', () => {
      const onWeaponAttack = jest.fn();
      render(<MachineWeaponsList {...defaultProps} onWeaponAttack={onWeaponAttack} />);

      const fireButtons = screen.getAllByTitle('Выстрел');

      fireEvent.click(fireButtons[0]);
      expect(onWeaponAttack).toHaveBeenCalledWith(0);

      fireEvent.click(fireButtons[1]);
      expect(onWeaponAttack).toHaveBeenCalledWith(1);
    });
  });

  describe('Fire rate limiting', () => {
    it('disables fire button when fire rate limit is reached', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 0, 2: 0 }, // Weapon 0 has fired 2 times
        totalShotsUsed: 2, // Total shots equals fireRate
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const fireButtons = screen.getAllByTitle('Лимит выстрелов исчерпан');
      expect(fireButtons.length).toBeGreaterThan(0);
      expect(fireButtons[0]).toBeDisabled();
    });

    it('keeps fire button enabled when shots are below fire rate limit', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 1, 1: 0, 2: 0 }, // Weapon 0 has fired 1 time
        totalShotsUsed: 1, // Total shots below fireRate
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const fireButtons = screen.getAllByTitle('Выстрел');
      expect(fireButtons.length).toBeGreaterThan(0);
      expect(fireButtons[0]).not.toBeDisabled();
    });

    it('enables all weapons when shotsUsed is below fireRate', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 0, 1: 0, 2: 0 },
        totalShotsUsed: 0,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const fireButtons = screen.getAllByTitle('Выстрел');
      expect(fireButtons.length).toBe(2); // Two ranged weapons
      fireButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('disables all weapons when total shots equal fireRate', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 0, 2: 0 }, // Weapon 0 has 2 shots
        totalShotsUsed: 2, // Total equals fireRate - ALL weapons disabled
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      // ALL weapons should be disabled (not just weapon 0)
      const disabledButtons = screen.getAllByTitle('Лимит выстрелов исчерпан');
      expect(disabledButtons.length).toBe(2); // Both ranged weapons disabled
    });

    it('handles fire rate of 1', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 1, 1: 0, 2: 0 },
        totalShotsUsed: 1, // Total equals fireRate
        fireRate: 1
      };
      render(<MachineWeaponsList {...props} />);

      // With fireRate=1 and totalShotsUsed=1, all weapons should be disabled
      const allFireButtons = screen.getAllByTitle('Лимит выстрелов исчерпан');
      expect(allFireButtons.length).toBe(2); // Both ranged weapons disabled
    });

    it('handles fire rate of 3', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 0, 2: 0 },
        totalShotsUsed: 2, // Total shots below fireRate
        fireRate: 3
      };
      render(<MachineWeaponsList {...props} />);

      // Weapons should still be enabled (2 < 3)
      const fireButtons = screen.getAllByTitle('Выстрел');
      expect(fireButtons.length).toBeGreaterThan(0);
    });

    it('handles zero fire rate', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 0, 1: 0, 2: 0 },
        totalShotsUsed: 0,
        fireRate: 0
      };

      expect(() => {
        render(<MachineWeaponsList {...props} />);
      }).not.toThrow();
    });
  });

  describe('Visual feedback', () => {
    it('shows disabled state with correct styling', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 0, 2: 0 },
        totalShotsUsed: 2, // Total equals fireRate
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const disabledButton = screen.getAllByTitle('Лимит выстрелов исчерпан')[0];
      expect(disabledButton).toHaveClass('opacity-50');
      expect(disabledButton).toHaveClass('cursor-not-allowed');
    });

    it('shows active state when weapon has been fired', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 1, 1: 0, 2: 0 },
        totalShotsUsed: 1, // Below fireRate
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      // Check that weapon card has active background
      const weaponCards = document.querySelectorAll('.bg-amber-950\\/20');
      expect(weaponCards.length).toBeGreaterThan(0);
    });

    it('shows default state when no shots fired', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 0, 1: 0, 2: 0 },
        totalShotsUsed: 0,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      // Check for tech corners on active weapons
      const techCorners = document.querySelectorAll('.border-amber-600\\/30');
      expect(techCorners.length).toBeGreaterThan(0);
    });
  });

  describe('Per-weapon shot tracking', () => {
    it('disables all weapons when total shots reach fireRate', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 1, 2: 0 }, // Weapon 0 has 2 shots, weapon 1 has 1
        totalShotsUsed: 3, // Total exceeds fireRate
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      // ALL weapons should be disabled when total shots >= fireRate
      const disabledButtons = screen.getAllByTitle('Лимит выстрелов исчерпан');
      expect(disabledButtons.length).toBe(2); // Both ranged weapons disabled
    });

    it('handles missing weapon index in weaponShots', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 1 }, // Missing weapon 1 and 2
        totalShotsUsed: 1
      };
      render(<MachineWeaponsList {...props} />);

      // Should render without errors, treating missing as 0
      expect(screen.getByText('Cannon')).toBeInTheDocument();
      expect(screen.getByText('MG')).toBeInTheDocument();
    });
  });

  describe('Ammo limiting', () => {
    it('disables fire button when global ammo is 0 (tehnolog rules)', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 0,
        usePerWeaponAmmo: false
      };
      render(<MachineWeaponsList {...props} />);

      const disabledButtons = screen.getAllByTitle('Нет боезапаса');
      expect(disabledButtons.length).toBe(2); // Both ranged weapons disabled
      disabledButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('keeps fire button enabled when ammo is available (tehnolog rules)', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 5,
        usePerWeaponAmmo: false
      };
      render(<MachineWeaponsList {...props} />);

      const fireButtons = screen.getAllByTitle('Выстрел');
      expect(fireButtons.length).toBeGreaterThan(0);
      fireButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('disables fire button when per-weapon ammo is 0 (community rules)', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 10, // Global ammo available
        weaponAmmo: [0, 5], // Weapon 0 has no ammo
        usePerWeaponAmmo: true
      };
      render(<MachineWeaponsList {...props} />);

      // Weapon 0 should be disabled (no per-weapon ammo)
      const disabledButtons = screen.getAllByTitle('Нет боезапаса');
      expect(disabledButtons.length).toBe(1);
      expect(disabledButtons[0]).toBeDisabled();
    });

    it('disables all weapons when global ammo is 0 (community rules)', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 0, // No global ammo
        weaponAmmo: [5, 5], // Per-weapon ammo available
        usePerWeaponAmmo: true
      };
      render(<MachineWeaponsList {...props} />);

      // ALL weapons should be disabled (global ammo check takes priority)
      const disabledButtons = screen.getAllByTitle('Нет боезапаса');
      expect(disabledButtons.length).toBe(2); // Both ranged weapons
    });

    it('allows melee weapons even when ammo is 0', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 0,
        usePerWeaponAmmo: false
      };
      render(<MachineWeaponsList {...props} />);

      // Melee weapons should be listed but ranged should be disabled
      expect(screen.getByText('Melee Spike')).toBeInTheDocument();
      // Info button for melee weapon should still be available
      const infoButtons = screen.getAllByTitle('Информация об оружии');
      expect(infoButtons.length).toBe(3); // All weapons have info buttons
    });
  });

  describe('Melee weapons', () => {
    it('does not show fire button for melee weapons', () => {
      render(<MachineWeaponsList {...defaultProps} />);

      // Melee weapons should not have fire buttons
      const meleeWeapon = screen.getByText('Melee Spike');
      expect(meleeWeapon).toBeInTheDocument();

      // Should not find fire button for melee weapon
      const fireButtons = screen.getAllByTitle('Выстрел');
      expect(fireButtons.length).toBe(2); // Only ranged weapons
    });

    it('shows info button for melee weapons', () => {
      render(<MachineWeaponsList {...defaultProps} />);

      const infoButtons = screen.getAllByTitle('Информация об оружии');
      expect(infoButtons.length).toBe(3); // All weapons have info buttons
    });

    it('handles machine with only melee weapons', () => {
      const meleeOnlyWeapons: Weapon[] = [
        { name: 'Melee Spike', range: 'ББ', power: 'D12' },
        { name: 'Claw', range: 'ББ', power: 'D6' }
      ];

      const props = {
        ...defaultProps,
        weapons: meleeOnlyWeapons,
        weaponShots: { 0: 0, 1: 0 }
      };

      render(<MachineWeaponsList {...props} />);

      expect(screen.getByText(/ближний бой/i)).toBeInTheDocument();
      expect(screen.getByText('Melee Spike')).toBeInTheDocument();
      expect(screen.getByText('Claw')).toBeInTheDocument();
    });
  });

  describe('Weapon stat display', () => {
    it('displays range stat correctly', () => {
      render(<MachineWeaponsList {...defaultProps} />);

      expect(screen.getAllByText('D12').length).toBeGreaterThan(0);
      expect(screen.getAllByText('D6').length).toBeGreaterThan(0);
    });

    it('displays power stat correctly', () => {
      render(<MachineWeaponsList {...defaultProps} />);

      expect(screen.getAllByText('2D20').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1D12').length).toBeGreaterThan(0);
    });

    it('formats range in cm based on stepToCmFactor', () => {
      const props = {
        ...defaultProps,
        stepToCmFactor: 5
      };

      render(<MachineWeaponsList {...props} />);

      // D12 with factor 5 should show 60см
      expect(screen.getByText('60см')).toBeInTheDocument();
    });

    it('handles different stepToCmFactor values', () => {
      const props = {
        ...defaultProps,
        stepToCmFactor: 4
      };

      render(<MachineWeaponsList {...props} />);

      // D12 with factor 4 should show 48см
      expect(screen.getByText('48см')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles weapon with empty string range', () => {
      const weaponsWithEmpty: Weapon[] = [
        { name: 'Unknown Weapon', range: '', power: 'D6' }
      ];

      const props = {
        ...defaultProps,
        weapons: weaponsWithEmpty,
        weaponShots: { 0: 0 }
      };

      expect(() => {
        render(<MachineWeaponsList {...props} />);
      }).not.toThrow();
    });

    it('handles weapon with numeric power', () => {
      const weaponsWithNumericPower: Weapon[] = [
        { name: 'Flamethrower', range: 'D6', power: '3' }
      ];

      const props = {
        ...defaultProps,
        weapons: weaponsWithNumericPower,
        weaponShots: { 0: 0 }
      };

      render(<MachineWeaponsList {...props} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('handles very long weapon names', () => {
      const longNameWeapons: Weapon[] = [
        { name: 'Very Long Weapon Name That Should Not Break Layout', range: 'D12', power: '2D20' }
      ];

      const props = {
        ...defaultProps,
        weapons: longNameWeapons,
        weaponShots: { 0: 0 }
      };

      expect(() => {
        render(<MachineWeaponsList {...props} />);
      }).not.toThrow();
    });
  });
});
