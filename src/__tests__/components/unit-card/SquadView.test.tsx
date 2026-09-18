import { render } from '@testing-library/react';
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

  it('renders a list that fills available height (photos grow from a floor)', () => {
    const { container } = render(<SquadView {...defaultProps} />);

    // Колонка растягивается на свободную высоту скролл-области (min-h-full),
    // строки делят остаток (flex-1) — взвод заполняет экран (плейтест:
    // фото были мелкие, снизу оставалось пустое место)
    const list = container.querySelector('[data-testid="squad-list"]');
    expect(list).toBeInTheDocument();
    expect(list!.className).toContain('flex-col');
    expect(list!.className).toContain('min-h-full');

    const row = list!.children[0];
    expect(row.className).toContain('snap-start');
    expect(row.className).toContain('flex-1');

    // Пол роста фото = прежний размер: ширина не ниже 64px, высота — строкой
    const photo = container.querySelector('[data-testid="soldier-photo"]');
    expect(photo).toBeInTheDocument();
    expect(photo!.className).toContain('h-full');
    expect(photo!.className).toContain('min-w-16');
    expect(photo!.className).toContain('aspect-[3/4]');

    // SoldierCard отрендерен (статусная полоса)
    const statusStripes = container.querySelectorAll('[data-testid="soldier-status-stripe"]');
    expect(statusStripes.length).toBe(1);
  });
});
