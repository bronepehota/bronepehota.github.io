import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BattlePreparationScreen } from '@/components/BattlePreparationScreen';
import { Army } from '@/lib/types';

describe('BattlePreparationScreen', () => {
  const mockArmy: Army = {
    name: 'Test Army',
    faction: 'polaris',
    units: [],
    totalCost: 0,
    currentStep: 'preparation',
    isInBattle: false,
    currentTurn: 1
  };

  const mockSetArmy = jest.fn();
  const mockOnStartBattle = jest.fn();
  const mockOnBackToBuilder = jest.fn();

  it('должен отображать заголовок "Готовьте войска!"', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    expect(screen.getByText('Готовьте войска!')).toBeInTheDocument();
  });

  it('должен показывать иммерсивный текст', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    expect(screen.getByText('Готовьте войска!')).toBeInTheDocument();
    expect(screen.getByText('Соберите миниатюры и расставьте их на поле.')).toBeInTheDocument();
  });

  it('должен отображать кнопку "Начать бой"', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    const button = screen.getByTestId('start-battle-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Начать бой');
  });

  it('должен открывать модальное окно инициативы при клике на "Начать бой" (с юнитами)', () => {
    const mockArmyWithUnits: Army = {
      ...mockArmy,
      units: [
        {
          instanceId: 'unit1',
          type: 'squad',
          data: {
            id: 'polaris_test',
            name: 'Test Squad',
            faction: 'polaris',
            cost: 100,
            soldiers: []
          },
          deadSoldiers: [],
          actionsUsed: []
        }
      ]
    };

    render(
      <BattlePreparationScreen
        army={mockArmyWithUnits}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    const button = screen.getByTestId('start-battle-button');
    fireEvent.click(button);

    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();
  });
});
