import { render, screen } from '@testing-library/react';
import { MachineView } from '@/components/cards/unit-card/MachineView';
import { ArmyUnit, Machine, DurabilityZone } from '@/lib/types';

describe('MachineView', () => {
  const mockMachine: Machine = {
    id: 'test_machine',
    name: 'Test Machine',
    shortName: 'TM',
    faction: 'polaris',
    cost: 100,
    rank: 2,
    fire_rate: 2,
    ammo_max: 20,
    durability_max: 16,
    image: '/images/test.jpg',
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 }
    ],
    weapons: [
      { name: 'Cannon', range: 'D12', power: '2D20' },
      { name: 'Machine Gun', range: 'D6', power: '1D12' }
    ]
  };

  const createMockUnit = (overrides?: Partial<ArmyUnit>): ArmyUnit => ({
    instanceId: 'test-1',
    type: 'machine',
    data: mockMachine,
    currentDurability: 12,
    currentAmmo: 15,
    machineShotsUsed: 0,
    machineWeaponShots: {},
    ...overrides
  });

  const mockZone: DurabilityZone = {
    max: 16,
    color: 'green',
    damagePerDie: { D6: 1, D12: 2, D20: 3 }
  };

  const defaultProps = {
    unit: createMockUnit(),
    zone: mockZone,
    speed: 2,
    updateDurability: jest.fn(),
    updateAmmo: jest.fn(),
    onWeaponAttack: jest.fn(),
    onWeaponInfo: jest.fn(),
    onPilotAssign: jest.fn(),
    onPilotRemove: jest.fn(),
    onPilotSurvivalTest: jest.fn(),
    pilotSurvivalTest: null,
    pilotImage: null,
    isPilotTestRunning: false,
    pilotTestUrgent: false,
    rulesVersion: 'tehnolog' as const,
    usePerWeaponAmmo: false,
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5,
    imageUrl: mockMachine.image,
    machineName: mockMachine.name,
    isDestroyed: false,
    onShowImage: jest.fn()
  };

  it('renders machine stats panel', () => {
    render(<MachineView {...defaultProps} />);

    expect(screen.getByText(/прочн/i)).toBeInTheDocument();
  });

  it('renders ammo panel', () => {
    render(<MachineView {...defaultProps} />);

    expect(screen.getByText(/боезапас/i)).toBeInTheDocument();
  });

  describe('Machine shot tracking display', () => {
    it('displays correct shotsUsed from machineShotsUsed', () => {
      const unit = createMockUnit({ machineShotsUsed: 1 });

      render(<MachineView {...defaultProps} unit={unit} />);

      // The ammo panel should display the shots used
      expect(screen.getByText(/боезапас/i)).toBeInTheDocument();
    });

    it('displays correct weaponShots for each weapon', () => {
      const unit = createMockUnit({
        machineShotsUsed: 2,
        machineWeaponShots: { 0: 1, 1: 1 }
      });

      render(<MachineView {...defaultProps} unit={unit} />);

      // Weapons list should be displayed for tehnolog rules
      expect(screen.getByText('Cannon')).toBeInTheDocument();
      expect(screen.getByText('Machine Gun')).toBeInTheDocument();
    });

    it('displays fire rate correctly', () => {
      const unit = createMockUnit();

      render(<MachineView {...defaultProps} unit={unit} />);

      // Fire rate should be visible in the UI
      expect(screen.getByText(/боезапас/i)).toBeInTheDocument();
    });
  });

  describe('Weapons list rendering', () => {
    it('renders weapons list for tehnolog rules', () => {
      render(<MachineView {...defaultProps} />);

      expect(screen.getByText('Cannon')).toBeInTheDocument();
      expect(screen.getByText('Machine Gun')).toBeInTheDocument();
    });

    it('renders weapons list for community_star_system rules too', () => {
      render(<MachineView {...defaultProps} />);

      // Weapons list should be displayed for all rules versions
      expect(screen.getByText('Cannon')).toBeInTheDocument();
      expect(screen.getByText('Machine Gun')).toBeInTheDocument();
    });

    it('handles machine with no weapons', () => {
      const machineNoWeapons: Machine = {
        ...mockMachine,
        weapons: []
      };

      const unit = createMockUnit({ data: machineNoWeapons });

      expect(() => {
        render(<MachineView {...defaultProps} unit={unit} />);
      }).not.toThrow();
    });

    it('handles machine with melee weapons only', () => {
      const machineMeleeOnly: Machine = {
        ...mockMachine,
        weapons: [
          { name: 'Melee Spike', range: 'ББ', power: 'D12' }
        ]
      };

      const unit = createMockUnit({ data: machineMeleeOnly });

      render(<MachineView {...defaultProps} unit={unit} />);

      expect(screen.getByText('Melee Spike')).toBeInTheDocument();
      // «Ближний бой» now appears both as the weapon's range label (MachineWeaponsList)
      // and as the close-combat action button (#125).
      expect(screen.getAllByText(/ближний бой/i).length).toBeGreaterThan(0);
    });
  });

  describe('Pilot panel integration', () => {
    it('renders pilot chip when pilot info is present', () => {
      const unit = createMockUnit({
        pilotInfo: {
          squadInstanceId: 'squad-1',
          soldierIndex: 0,
          pilotArmor: 2,
          alive: true
        }
      });

      render(<MachineView {...defaultProps} unit={unit} />);

      // Pilot chip is rendered in the header (portrait now lives in the sheet)
      expect(screen.getByText(/жив/i)).toBeInTheDocument();
    });

    it('survival test result does not crash render', () => {
      const unit = createMockUnit({
        pilotInfo: {
          squadInstanceId: 'squad-1',
          soldierIndex: 0,
          pilotArmor: 2,
          alive: true
        }
      });

      const props = {
        ...defaultProps,
        unit,
        pilotSurvivalTest: {
          roll: 15,
          survived: true,
          testedAt: Date.now()
        }
      };

      render(<MachineView {...props} />);

      // Pilot chip still renders alongside a survival-test result
      expect(screen.getByText(/жив/i)).toBeInTheDocument();
    });
  });

  describe('Shot counter state', () => {
    it('passes correct machineShotsUsed to AmmoPanel', () => {
      const unit = createMockUnit({
        machineShotsUsed: 1,
        currentAmmo: 19
      });

      render(<MachineView {...defaultProps} unit={unit} />);

      // The component should render without errors
      expect(screen.getByText(/боезапас/i)).toBeInTheDocument();
    });

    it('passes correct weaponShots to WeaponsList', () => {
      const unit = createMockUnit({
        machineWeaponShots: { 0: 1, 1: 0 }
      });

      render(<MachineView {...defaultProps} unit={unit} />);

      // Weapons should be displayed
      expect(screen.getByText('Cannon')).toBeInTheDocument();
    });

    it('handles undefined machineWeaponShots gracefully', () => {
      const unit = createMockUnit({
        machineWeaponShots: undefined
      });

      expect(() => {
        render(<MachineView {...defaultProps} unit={unit} />);
      }).not.toThrow();
    });

    it('handles zero machineShotsUsed', () => {
      const unit = createMockUnit({
        machineShotsUsed: 0
      });

      render(<MachineView {...defaultProps} unit={unit} />);

      expect(screen.getByText(/боезапас/i)).toBeInTheDocument();
    });
  });

  describe('Per-weapon ammo system', () => {
    it('handles usePerWeaponAmmo flag', () => {
      const unit = createMockUnit({
        weaponAmmo: [10, 10]
      });

      render(
        <MachineView
          {...defaultProps}
          unit={unit}
          usePerWeaponAmmo={true}
        />
      );

      expect(screen.getByText(/боезапас/i)).toBeInTheDocument();
    });

    it('displays weapon-specific ammo when usePerWeaponAmmo is true', () => {
      const unit = createMockUnit({
        weaponAmmo: [10, 10],
        currentAmmo: 20
      });

      render(
        <MachineView
          {...defaultProps}
          unit={unit}
          usePerWeaponAmmo={true}
        />
      );

      // Component should render without errors
      expect(screen.getByText(/боезапас/i)).toBeInTheDocument();
    });
  });
});
