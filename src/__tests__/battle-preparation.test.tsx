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
    currentStep: 'battle-prep',
    isInBattle: false,
    currentTurn: 1
  };

  const mockSetArmy = jest.fn();
  const mockOnStartBattle = jest.fn();
  const mockOnBackToBuilder = jest.fn();

  it('должен отображать заголовок "Подготовка к бою"', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    expect(screen.getByText('Подготовка к бою')).toBeInTheDocument();
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

  it('должен вызывать onBackToBuilder при клике на кнопку "Назад"', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    const backButton = screen.getByTestId('back-to-builder-button');
    fireEvent.click(backButton);

    expect(mockOnBackToBuilder).toHaveBeenCalledTimes(1);
  });

  it('должен возвращать в ArmyBuilder при пустой армии', () => {
    render(
      <BattlePreparationScreen
        army={mockArmy}
        setArmy={mockSetArmy}
        onStartBattle={mockOnStartBattle}
        onBackToBuilder={mockOnBackToBuilder}
      />
    );

    // Пустая армия должна вызвать onBackToBuilder через useEffect
    expect(mockOnBackToBuilder).toHaveBeenCalledTimes(1);
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
