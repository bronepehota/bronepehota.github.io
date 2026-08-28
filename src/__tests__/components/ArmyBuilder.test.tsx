import { render, screen, fireEvent } from '@testing-library/react';
import ArmyBuilder, { initialSetupStep } from '@/components/ArmyBuilder';
import type { Army } from '@/lib/types';

const mockArmy: Army = {
  name: '',
  faction: 'polaris',
  units: [],
  totalCost: 0,
  currentStep: 'faction-select',
};

const defaultProps = {
  army: mockArmy,
  setArmy: jest.fn(),
  rulesVersion: 'community_star_system' as const,
  onRulesVersionChange: jest.fn(),
  displayMode: 'detailed' as const,
  onDisplayModeChange: jest.fn(),
  onStartBattle: jest.fn(),
};

// Helper to render with a specific army state
function renderWithArmy(armyOverride: Partial<Army>) {
  const army = { ...mockArmy, ...armyOverride };
  const setArmy = jest.fn();
  render(<ArmyBuilder {...defaultProps} army={army} setArmy={setArmy} />);
  return { army, setArmy };
}

describe('ArmyBuilder back navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    const store: Record<string, string> = {};
    // Wizard past intro — renders assume the rules screen immediately (see initialSetupStep below)
    store['bronepehota_setup_step'] = 'rules';
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { store[key] = val; });
  });

  describe('StepProgressIndicator visibility', () => {
    it('should render step indicator on faction-select screen', () => {
      renderWithArmy({ currentStep: 'faction-select' });
      // Step indicator should be present (renders step icons)
      const stepButtons = screen.getAllByRole('button');
      // At least the step circle buttons should be present
      expect(stepButtons.length).toBeGreaterThanOrEqual(6);
    });

    it('should render step indicator on unit-select screen', () => {
      renderWithArmy({ currentStep: 'unit-select', pointBudget: 350 });
      const stepButtons = screen.getAllByRole('button');
      expect(stepButtons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Navigation from units step', () => {
    it('should show confirmation dialog when clicking back with units in army', () => {
      renderWithArmy({
        currentStep: 'unit-select',
        pointBudget: 350,
        units: [{
          instanceId: 'test-1',
          type: 'squad',
          data: {
            id: 'test_squad',
            name: 'Test',
            shortName: 'T',
            faction: 'polaris',
            cost: 50,
            image: '',
            soldiers: [{ num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2 }],
          },
          instanceNumber: 1,
          deadSoldiers: [],
          actionsUsed: [{ moved: false, shot: false, melee: false, done: false }],
        }],
        totalCost: 50,
      });

      // Click on the first step (rules) which is completed
      const rulesStep = screen.getByLabelText(/Шаг 1.*Правила.*завершен/i);
      fireEvent.click(rulesStep);

      // Confirmation dialog should appear
      expect(screen.getByText('Сбросить армию?')).toBeInTheDocument();
      expect(screen.getByText(/При возврате назад все добавленные юниты будут удалены/)).toBeInTheDocument();
      expect(screen.getByText('Отмена')).toBeInTheDocument();
      expect(screen.getByText('Сбросить')).toBeInTheDocument();
    });

    it('should dismiss confirmation when clicking Cancel', () => {
      renderWithArmy({
        currentStep: 'unit-select',
        pointBudget: 350,
        units: [{
          instanceId: 'test-1',
          type: 'squad',
          data: {
            id: 'test_squad',
            name: 'Test',
            shortName: 'T',
            faction: 'polaris',
            cost: 50,
            image: '',
            soldiers: [{ num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2 }],
          },
          instanceNumber: 1,
          deadSoldiers: [],
          actionsUsed: [{ moved: false, shot: false, melee: false, done: false }],
        }],
        totalCost: 50,
      });

      // Trigger confirmation
      const rulesStep = screen.getByLabelText(/Шаг 1.*Правила.*завершен/i);
      fireEvent.click(rulesStep);
      expect(screen.getByText('Сбросить армию?')).toBeInTheDocument();

      // Click cancel
      fireEvent.click(screen.getByText('Отмена'));
      expect(screen.queryByText('Сбросить армию?')).not.toBeInTheDocument();
    });

    it('should not show confirmation when army has no units', () => {
      const { setArmy } = renderWithArmy({
        currentStep: 'unit-select',
        pointBudget: 350,
        units: [],
        totalCost: 0,
      });

      // Click on a completed step (rules)
      const rulesStep = screen.getByLabelText(/Шаг 1.*Правила.*завершен/i);
      fireEvent.click(rulesStep);

      // No confirmation dialog
      expect(screen.queryByText('Сбросить армию?')).not.toBeInTheDocument();

      // setArmy should have been called to update currentStep
      expect(setArmy).toHaveBeenCalledWith(
        expect.objectContaining({ currentStep: 'faction-select' })
      );
    });
  });
});

describe('initialSetupStep', () => {
  it('новичок (нет сохранённого шага) → intro', () => {
    expect(initialSetupStep(null)).toBe('intro');
  });
  it('сохранённый валидный шаг → он сам', () => {
    expect(initialSetupStep('rules')).toBe('rules');
    expect(initialSetupStep('units')).toBe('units');
  });
  it('мусор → intro', () => {
    expect(initialSetupStep('garbage')).toBe('intro');
    expect(initialSetupStep('intro')).toBe('intro'); // intro не персистится
  });
});
