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

  describe('Click-to-fire interactions', () => {
    it('calls onWeaponAttack when weapon card is clicked', () => {
      const onWeaponAttack = jest.fn();
      render(<MachineWeaponsList {...defaultProps} onWeaponAttack={onWeaponAttack} />);

      // Weapon cards now have role="button" with aria-label
      const weaponCard = screen.getByRole('button', { name: /Выстрел: Cannon/i });
      fireEvent.click(weaponCard);

      expect(onWeaponAttack).toHaveBeenCalledWith(0);
    });

    it('calls onWeaponInfo when info button clicked', () => {
      const onWeaponInfo = jest.fn();
      render(<MachineWeaponsList {...defaultProps} onWeaponInfo={onWeaponInfo} />);

      const infoButtons = screen.getAllByTitle('Информация об оружии');
      fireEvent.click(infoButtons[0]);

      expect(onWeaponInfo).toHaveBeenCalledWith(0);
    });

    it('calls onWeaponAttack for each weapon independently', () => {
      const onWeaponAttack = jest.fn();
      render(<MachineWeaponsList {...defaultProps} onWeaponAttack={onWeaponAttack} />);

      const cannonCard = screen.getByRole('button', { name: /Выстрел: Cannon/i });
      fireEvent.click(cannonCard);
      expect(onWeaponAttack).toHaveBeenCalledWith(0);

      const mgCard = screen.getByRole('button', { name: /Выстрел: MG/i });
      fireEvent.click(mgCard);
      expect(onWeaponAttack).toHaveBeenCalledWith(1);
    });
  });

  describe('Fire rate limiting', () => {
    it('disables weapon card when fire rate limit is reached', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 0, 2: 0 },
        totalShotsUsed: 2,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      // Disabled weapons show "Оружие недоступно" aria-label
      const disabledCards = screen.getAllByRole('button', { name: /Оружие недоступно/i });
      expect(disabledCards.length).toBe(2);
    });

    it('keeps weapon card enabled when shots are below fire rate limit', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 1, 1: 0, 2: 0 },
        totalShotsUsed: 1,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const weaponCards = screen.getAllByRole('button', { name: /Выстрел:/i });
      expect(weaponCards.length).toBe(2);
      weaponCards.forEach(card => {
        expect(card).not.toHaveAttribute('aria-disabled');
      });
    });

    it('enables all weapons when shotsUsed is below fireRate', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 0, 1: 0, 2: 0 },
        totalShotsUsed: 0,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const weaponCards = screen.getAllByRole('button', { name: /Выстрел:/i });
      expect(weaponCards.length).toBe(2);
    });

    it('disables all weapons when total shots equal fireRate', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 0, 2: 0 },
        totalShotsUsed: 2,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const disabledCards = screen.getAllByRole('button', { name: /Оружие недоступно/i });
      expect(disabledCards.length).toBe(2);
    });

    it('handles fire rate of 1', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 1, 1: 0, 2: 0 },
        totalShotsUsed: 1,
        fireRate: 1
      };
      render(<MachineWeaponsList {...props} />);

      const disabledCards = screen.getAllByRole('button', { name: /Оружие недоступно/i });
      expect(disabledCards.length).toBe(2);
    });

    it('handles fire rate of 3', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 0, 2: 0 },
        totalShotsUsed: 2,
        fireRate: 3
      };
      render(<MachineWeaponsList {...props} />);

      const weaponCards = screen.getAllByRole('button', { name: /Выстрел:/i });
      expect(weaponCards.length).toBeGreaterThan(0);
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
        totalShotsUsed: 2,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const disabledCards = screen.getAllByRole('button', { name: /Оружие недоступно/i });
      expect(disabledCards[0]).toHaveClass('opacity-50');
      expect(disabledCards[0]).toHaveClass('cursor-not-allowed');
    });

    it('shows active state when weapon has been fired', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 1, 1: 0, 2: 0 },
        totalShotsUsed: 1,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const weaponCards = document.querySelectorAll('.bg-amber-950\\/20');
      expect(weaponCards.length).toBeGreaterThan(0);
    });
  });

  describe('Per-weapon shot tracking', () => {
    it('disables all weapons when total shots reach fireRate', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 2, 1: 1, 2: 0 },
        totalShotsUsed: 3,
        fireRate: 2
      };
      render(<MachineWeaponsList {...props} />);

      const disabledCards = screen.getAllByRole('button', { name: /Оружие недоступно/i });
      expect(disabledCards.length).toBe(2);
    });

    it('handles missing weapon index in weaponShots', () => {
      const props = {
        ...defaultProps,
        weaponShots: { 0: 1 },
        totalShotsUsed: 1
      };
      render(<MachineWeaponsList {...props} />);

      expect(screen.getByText('Cannon')).toBeInTheDocument();
      expect(screen.getByText('MG')).toBeInTheDocument();
    });
  });

  describe('Ammo limiting', () => {
    it('disables weapon card when global ammo is 0 (tehnolog rules)', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 0,
        usePerWeaponAmmo: false
      };
      render(<MachineWeaponsList {...props} />);

      const disabledCards = screen.getAllByRole('button', { name: /Оружие недоступно/i });
      expect(disabledCards.length).toBe(2);
    });

    it('keeps weapon card enabled when ammo is available (tehnolog rules)', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 5,
        usePerWeaponAmmo: false
      };
      render(<MachineWeaponsList {...props} />);

      const weaponCards = screen.getAllByRole('button', { name: /Выстрел:/i });
      expect(weaponCards.length).toBeGreaterThan(0);
    });

    it('disables weapon card when per-weapon ammo is 0 (community rules)', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 10,
        weaponAmmo: [0, 5],
        usePerWeaponAmmo: true
      };
      render(<MachineWeaponsList {...props} />);

      // Weapon 0 disabled (no per-weapon ammo)
      const disabledCards = screen.getAllByRole('button', { name: /Оружие недоступно/i });
      expect(disabledCards.length).toBe(1);
    });

    it('disables all weapons when global ammo is 0 (community rules)', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 0,
        weaponAmmo: [5, 5],
        usePerWeaponAmmo: true
      };
      render(<MachineWeaponsList {...props} />);

      const disabledCards = screen.getAllByRole('button', { name: /Оружие недоступно/i });
      expect(disabledCards.length).toBe(2);
    });

    it('allows melee weapons even when ammo is 0', () => {
      const props = {
        ...defaultProps,
        currentAmmo: 0,
        usePerWeaponAmmo: false
      };
      render(<MachineWeaponsList {...props} />);

      expect(screen.getByText('Melee Spike')).toBeInTheDocument();
      const infoButtons = screen.getAllByTitle('Информация об оружии');
      expect(infoButtons.length).toBe(3);
    });
  });

  describe('Melee weapons', () => {
    it('does not show click-to-fire for melee weapons', () => {
      render(<MachineWeaponsList {...defaultProps} />);

      expect(screen.getByText('Melee Spike')).toBeInTheDocument();

      // Only ranged weapons have role="button" with "Выстрел:" aria-label
      const rangedCards = screen.getAllByRole('button', { name: /Выстрел:/i });
      expect(rangedCards.length).toBe(2);
    });

    it('shows info button for melee weapons', () => {
      render(<MachineWeaponsList {...defaultProps} />);

      const infoButtons = screen.getAllByTitle('Информация об оружии');
      expect(infoButtons.length).toBe(3);
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

    it('no longer displays cm range (removed)', () => {
      render(<MachineWeaponsList {...defaultProps} stepToCmFactor={5} />);

      // CM values were removed from the UI
      expect(screen.queryByText('60см')).not.toBeInTheDocument();
      expect(screen.queryByText('48см')).not.toBeInTheDocument();
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
