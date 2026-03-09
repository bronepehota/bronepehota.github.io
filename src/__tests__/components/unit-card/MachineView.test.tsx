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
      { name: 'Cannon', range: 'D12', power: '2D20' }
    ]
  };

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'machine',
    data: mockMachine,
    currentDurability: 12,
    currentAmmo: 15
  };

  const mockZone: DurabilityZone = {
    max: 16,
    color: 'green',
    damagePerDie: { D6: 1, D12: 2, D20: 3 }
  };

  const defaultProps = {
    unit: mockUnit,
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
    rulesVersion: 'tehnolog' as const,
    usePerWeaponAmmo: false,
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5
  };

  it('renders machine stats panel', () => {
    render(<MachineView {...defaultProps} />);

    expect(screen.getByText(/прочность/i)).toBeInTheDocument();
  });

  it('renders ammo panel', () => {
    render(<MachineView {...defaultProps} />);

    expect(screen.getByText(/боезапас/i)).toBeInTheDocument();
  });
});
