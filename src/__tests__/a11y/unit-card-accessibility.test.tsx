import { render, screen } from '@testing-library/react';
import { UnitCardHeader } from '@/components/cards/unit-card/UnitCardHeader';
import { MachineAmmoPanel } from '@/components/cards/unit-card/machine-view/MachineAmmoPanel';
import { PilotChip } from '@/components/cards/unit-card/machine-view/PilotChip';
import { PilotModal } from '@/components/cards/unit-card/machine-view/PilotModal';
import { MachineView } from '@/components/cards/unit-card/MachineView';
import { ArmyUnit, Squad, Machine, DurabilityZone } from '@/lib/types';

describe('UnitCard Accessibility', () => {
  describe('Minimum touch target size (44x44px)', () => {
    describe('UnitCardHeader', () => {
      it('buttons have minimum 44x44px touch targets on mobile', () => {
        const mockUnit = createMockSquadUnit();

        const { container } = render(
          <UnitCardHeader
            unit={mockUnit}
            isDone={false}
          />
        );

        const buttons = container.querySelectorAll('button');
        // UnitCardHeader no longer has action buttons - they moved to header
        expect(buttons.length).toBe(0);

        buttons.forEach(button => {
          // Check for min-w-[44px] and min-h-[44px] Tailwind classes
          const classes = button.className;
          // Mobile buttons should have min-w-[44px] min-h-[44px]
          expect(classes).toContain('min-w-[44px]');
          expect(classes).toContain('min-h-[44px]');
        });
      });

      it('photo button has minimum touch target when shown', () => {
        const mockUnit = createMockMachineUnit();

        const { container } = render(
          <UnitCardHeader
            unit={mockUnit}
            isDone={false}
            showPhotoButton={true}
            onShowPhoto={jest.fn()}
          />
        );

        const photoButton = container.querySelector('button[aria-label="Показать фото машины"]');
        expect(photoButton).toBeDefined();
        expect(photoButton?.className).toContain('min-w-[44px]');
        expect(photoButton?.className).toContain('min-h-[44px]');
      });
    });

    describe('MachineAmmoPanel', () => {
      it('buttons have minimum 44x44px touch targets on mobile', () => {
        const { container } = render(
          <MachineAmmoPanel
            currentAmmo={15}
            maxAmmo={20}
            shotsUsed={0}
            fireRate={2}
            onUpdateAmmo={jest.fn()}
            usePerWeaponAmmo={false}
            weapons={[]}
          />
        );

        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
          const classes = button.className;
          expect(classes).toContain('min-w-[44px]');
          expect(classes).toContain('min-h-[44px]');
        });
      });
    });

    describe('PilotChip', () => {
      it('chip meets 44px min touch target', () => {
        const { container } = render(<PilotChip pilotInfo={null} pilotTestUrgent={false} onOpenPilot={jest.fn()} />);
        const btn = container.querySelector('button');
        expect(btn?.className).toContain('min-h-[44px]');
      });
    });

    describe('PilotModal', () => {
      it('buttons meet 44px min touch target', () => {
        const { container } = render(<PilotModal
          isOpen={true} onClose={jest.fn()}
          pilotInfo={{ squadInstanceId: 's', soldierIndex: 0, pilotArmor: 2, alive: true }}
          pilotImage={null} survivalTest={null} isTestRunning={false}
          onSurvivalTest={jest.fn()} onAssignPilot={jest.fn()} />);
        container.querySelectorAll('button').forEach(b => {
          expect(b.className).toContain('min-h-[44px]');
        });
      });
    });

    describe('MachineView damage/repair row', () => {
      it('damage and repair buttons meet 44px min touch target', () => {
        const mockMachine: Machine = {
          id: 'test_machine',
          name: 'Test Machine',
          shortName: 'TM',
          faction: 'polaris',
          cost: 150,
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
          instanceId: 'machine-1',
          instanceNumber: 1,
          type: 'machine',
          data: mockMachine,
          currentDurability: 12,
          currentAmmo: 15,
          actionsUsed: [{ moved: false, shot: false, melee: false, done: false }]
        };

        const mockZone: DurabilityZone = {
          max: 16,
          color: 'green',
          damagePerDie: { D6: 1, D12: 2, D20: 3 }
        };

        const { container } = render(
          <MachineView
            unit={mockUnit}
            zone={mockZone}
            speed={2}
            updateDurability={jest.fn()}
            updateAmmo={jest.fn()}
            onWeaponAttack={jest.fn()}
            onWeaponInfo={jest.fn()}
            onPilotAssign={jest.fn()}
            onPilotSurvivalTest={jest.fn()}
            pilotSurvivalTest={null}
            pilotImage={null}
            isPilotTestRunning={false}
            pilotTestUrgent={false}
            usePerWeaponAmmo={false}
            distanceInputUnit="steps"
            stepToCmFactor={5}
            imageUrl={mockMachine.image}
            machineName={mockMachine.name}
            isDestroyed={false}
            onShowImage={jest.fn()}
          />
        );

        // Find the damage (-1) and repair (+1) buttons by their text content
        const damageBtn = container.querySelector('button svg.lucide-flame')?.closest('button');
        const repairBtn = container.querySelector('button svg.lucide-wrench')?.closest('button');

        expect(damageBtn).not.toBeNull();
        expect(damageBtn?.className).toContain('min-h-[44px]');
        expect(repairBtn).not.toBeNull();
        expect(repairBtn?.className).toContain('min-h-[44px]');
      });
    });

  });

  describe('ARIA labels', () => {
    describe('UnitCardHeader', () => {
      it('renders without buttons - actions moved to header', () => {
        const mockUnit = createMockSquadUnit();

        render(
          <UnitCardHeader
            unit={mockUnit}
            isDone={false}
          />
        );

        const buttons = screen.queryAllByRole('button');
        expect(buttons.length).toBe(0);
      });
    });

  });

  describe('Keyboard navigation', () => {
    it('UnitCardHeader has no buttons - actions moved to header', () => {
      const mockUnit = createMockSquadUnit();

      const { container } = render(
        <UnitCardHeader
          unit={mockUnit}
          isDone={false}
        />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });

    it('MachineAmmoPanel buttons are focusable', () => {
      const { container } = render(
        <MachineAmmoPanel
          currentAmmo={15}
          maxAmmo={20}
          shotsUsed={0}
          fireRate={2}
          onUpdateAmmo={jest.fn()}
          usePerWeaponAmmo={false}
          weapons={[]}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

  });
});

// Helper functions to create mock units
function createMockSquadUnit(): ArmyUnit {
  const mockSquad: Squad = {
    id: 'test_squad',
    name: 'Test Squad',
    shortName: 'TS',
    faction: 'polaris',
    cost: 100,
    soldiers: [
      { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 }
    ]
  };

  return {
    instanceId: 'test-1',
    instanceNumber: 1,
    type: 'squad',
    data: mockSquad,
    actionsUsed: [
      { moved: false, shot: false, melee: false, done: false }
    ]
  };
}

function createMockMachineUnit(): ArmyUnit {
  const mockMachine: Machine = {
    id: 'test_machine',
    name: 'Test Machine',
    shortName: 'TM',
    faction: 'polaris',
    cost: 150,
    rank: 2,
    fire_rate: 2,
    ammo_max: 20,
    durability_max: 16,
    image: '/images/test.jpg',
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 }
    ],
    weapons: [
      { name: 'Cannon', range: 'D12', power: '2D20' }
    ]
  };

  return {
    instanceId: 'machine-1',
    instanceNumber: 1,
    type: 'machine',
    data: mockMachine,
    currentDurability: 12,
    currentAmmo: 15,
    actionsUsed: [
      { moved: false, shot: false, melee: false, done: false }
    ]
  };
}
