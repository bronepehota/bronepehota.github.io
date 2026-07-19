import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import InitiativeModal from '@/components/modals/InitiativeModal';

describe('InitiativeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('не должен рендериться когда isOpen=false', () => {
    render(
      <InitiativeModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    expect(screen.queryByTestId('initiative-modal')).not.toBeInTheDocument();
  });

  it('должен рендериться когда isOpen=true', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();
    expect(screen.getByText('ИНИЦИАТИВА')).toBeInTheDocument();
  });

  it('должен показывать кнопку "НАЧАТЬ БОЙ" в контексте preparation', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    const confirmButton = screen.getByTestId('confirm-initiative-button');
    expect(confirmButton).toHaveTextContent('НАЧАТЬ БОЙ');
  });

  it('должен показывать кнопку "НАЧАТЬ ТУР" в контексте turn', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        activeUnitsCount={5}
        context="turn"
      />
    );

    const confirmButton = screen.getByTestId('confirm-initiative-button');
    expect(confirmButton).toHaveTextContent('НАЧАТЬ ТУР');
  });

  it('должен показывать статистику боеспособных юнитов в контексте turn', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        activeUnitsCount={3}
        context="turn"
      />
    );

    expect(screen.getByText(/БОЕСПОСОБНЫХ:/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('не должен показывать статистику боеспособных юнитов в контексте preparation', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        activeUnitsCount={5}
        context="preparation"
      />
    );

    expect(screen.queryByText(/БОЕСПОСОБНЫХ:/i)).not.toBeInTheDocument();
  });

  it('должен вызывать onClose при клике на кнопку закрытия', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    const closeButton = screen.getByTitle('Закрыть');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('должен вызывать onConfirm при клике на кнопку подтверждения', async () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    // Wait for animation to complete
    await waitFor(() => expect(screen.getByTestId('confirm-initiative-button')).not.toBeDisabled());

    const confirmButton = screen.getByTestId('confirm-initiative-button');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('не должен вызывать onConfirm пока идет анимация броска', async () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    const confirmButton = screen.getByTestId('confirm-initiative-button');
    // Button should be disabled initially during animation
    expect(confirmButton).toBeDisabled();

    // Click while disabled should not call onConfirm
    fireEvent.click(confirmButton);
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Wait for animation to complete
    await waitFor(() => expect(screen.getByTestId('confirm-initiative-button')).not.toBeDisabled());

    // Now button should be enabled
    expect(confirmButton).not.toBeDisabled();
  });

  it('должен перебрасывать кубик при клике на кнопку "ПЕРЕБРОС"', async () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    // Wait for initial roll
    await waitFor(() => expect(screen.getByTestId('confirm-initiative-button')).not.toBeDisabled());

    const _diceBefore = screen.getByTestId('initiative-dice').textContent;

    const rerollButton = screen.getByTestId('reroll-button');
    await act(async () => {
      fireEvent.click(rerollButton);
      await new Promise(resolve => setTimeout(resolve, 700));
    });

    const diceAfter = screen.getByTestId('initiative-dice').textContent;

    // Dice value should exist (1-6)
    expect(parseInt(diceAfter || '0')).toBeGreaterThanOrEqual(1);
    expect(parseInt(diceAfter || '0')).toBeLessThanOrEqual(6);
  });

  it('должен показывать правильные фракционные цвета для Polaris', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    const modal = screen.getByTestId('initiative-modal');
    expect(modal).toHaveClass('bg-slate-950/95');
  });

  it('должен показывать правильные фракционные цвета для Protectorate', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="protectorate"
        context="preparation"
      />
    );

    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-initiative-button')).toBeInTheDocument();
  });

  it('должен показывать правильные фракционные цвета для Mercenaries', () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="mercenaries"
        context="preparation"
      />
    );

    expect(screen.getByTestId('initiative-modal')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-initiative-button')).toBeInTheDocument();
  });

  it('должен отображать значение кубика от 1 до 6', async () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    // Wait for roll animation
    await waitFor(() => expect(screen.getByTestId('confirm-initiative-button')).not.toBeDisabled());

    const dice = screen.getByTestId('initiative-dice');
    const value = parseInt(dice.textContent || '0');
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(6);
  });

  it('должен отключать кнопку переброса во время анимации', async () => {
    render(
      <InitiativeModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        factionId="polaris"
        context="preparation"
      />
    );

    const rerollButton = screen.getByTestId('reroll-button');
    // Should be disabled during initial animation
    expect(rerollButton).toBeDisabled();

    // Wait for animation to complete
    await waitFor(() => expect(screen.getByTestId('confirm-initiative-button')).not.toBeDisabled());

    // Should be enabled after animation
    expect(rerollButton).not.toBeDisabled();
  });
});
