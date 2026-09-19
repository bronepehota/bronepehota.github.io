import { render, fireEvent } from '@testing-library/react';
import { SquadView } from '@/components/cards/unit-card/SquadView';
import { ArmyUnit, Squad } from '@/lib/types';

describe('SquadView', () => {
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

  const mockUnit: ArmyUnit = {
    instanceId: 'test-1',
    type: 'squad',
    data: mockSquad,
    actionsUsed: []
  };

  const defaultProps = {
    unit: mockUnit,
    updateUnit: jest.fn(),
    onSoldierAction: jest.fn(),
    setShowSoldierImage: jest.fn(),
    distanceInputUnit: 'steps' as const,
    stepToCmFactor: 5,
    allUnits: [],
    getSoldierImage: jest.fn((idx: number) => `/images/soldier-${idx}.png`)
  };

  it('renders soldiers grid', () => {
    const { container } = render(<SquadView {...defaultProps} />);

    // Check that the grid container exists
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();

    // Check that SoldierCard components are rendered by looking for the status stripe
    const statusStripes = container.querySelectorAll('[data-testid="soldier-status-stripe"]');
    expect(statusStripes.length).toBe(1);
  });

  // jsdom без PointerEvent — диспатчим сами (как в useCardSwipe.test.tsx)
  const firePointer = (el: Element, type: string, init: Record<string, number>) => {
    const ev = new Event(type, { bubbles: true });
    Object.assign(ev, init);
    fireEvent(el, ev);
  };
  const dragLeft = (el: Element) => {
    firePointer(el, 'pointerdown', { pointerId: 1, clientX: 200, clientY: 50 });
    firePointer(el, 'pointermove', { pointerId: 1, clientX: 100, clientY: 50 });
    firePointer(el, 'pointerup', { pointerId: 1, clientX: 100, clientY: 50 });
  };

  it('свайп влево живому бойцу завершает ход', () => {
    const updateUnit = jest.fn();
    const { container } = render(<SquadView {...defaultProps} updateUnit={updateUnit} />);
    dragLeft(container.querySelector('[data-testid="soldier-card"]')!);
    expect(updateUnit).toHaveBeenCalledWith('test-1', expect.any(Function));
  });

  it('свайп влево не обходит гейтинг: паникующий и мёртвый не завершают ход', () => {
    // Паника: можно быть уничтоженным, но нельзя действовать (правила §10)
    const panicUpdate = jest.fn();
    const { container: panicContainer, unmount: panicUnmount } = render(
      <SquadView
        {...defaultProps}
        unit={{ ...mockUnit, panicState: [{ soldierIndex: 0 }] } as ArmyUnit}
        updateUnit={panicUpdate}
      />
    );
    dragLeft(panicContainer.querySelector('[data-testid="soldier-card"]')!);
    expect(panicUpdate).not.toHaveBeenCalled();
    panicUnmount();

    const deadUpdate = jest.fn();
    const { container: deadContainer } = render(
      <SquadView
        {...defaultProps}
        unit={{ ...mockUnit, deadSoldiers: [0] } as ArmyUnit}
        updateUnit={deadUpdate}
      />
    );
    dragLeft(deadContainer.querySelector('[data-testid="soldier-card"]')!);
    expect(deadUpdate).not.toHaveBeenCalled();
  });
});
