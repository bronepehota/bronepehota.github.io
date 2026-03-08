import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StepToCmFactorToggle, getStepToCmFactor } from '@/components/toggles/StepToCmFactorToggle';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('StepToCmFactorToggle', () => {
  let onValueChangeMock: jest.Mock;

  beforeEach(() => {
    onValueChangeMock = jest.fn();
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('should render with default value "5"', () => {
    render(<StepToCmFactorToggle value="5" onValueChange={onValueChangeMock} />);

    expect(screen.getByText('МАСШТАБ')).toBeInTheDocument();
    expect(screen.getByText('1 шаг = 5см')).toBeInTheDocument();
  });

  it('should render with value "4"', () => {
    render(<StepToCmFactorToggle value="4" onValueChange={onValueChangeMock} />);

    expect(screen.getByText('МАСШТАБ')).toBeInTheDocument();
    expect(screen.getByText('1 шаг = 4см')).toBeInTheDocument();
  });

  it('should toggle from "5" to "4" when clicked', async () => {
    render(<StepToCmFactorToggle value="5" onValueChange={onValueChangeMock} />);

    const button = screen.getByRole('button', { name: /масштаб: 1 шаг = 5см/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onValueChangeMock).toHaveBeenCalledWith('4');
    });
    expect(mockLocalStorage.getItem('bronepehota_step_to_cm_factor')).toBe('4');
  });

  it('should toggle from "4" to "5" when clicked', async () => {
    render(<StepToCmFactorToggle value="4" onValueChange={onValueChangeMock} />);

    const button = screen.getByRole('button', { name: /масштаб: 1 шаг = 4см/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onValueChangeMock).toHaveBeenCalledWith('5');
    });
    expect(mockLocalStorage.getItem('bronepehota_step_to_cm_factor')).toBe('5');
  });

  it('should show modal when info button is clicked', () => {
    render(<StepToCmFactorToggle value="5" onValueChange={onValueChangeMock} />);

    const infoButton = screen.getByRole('button', { name: /подробнее о масштабе/i });
    fireEvent.click(infoButton);

    expect(screen.getByText('МАСШТАБ ИГРЫ')).toBeInTheDocument();
    expect(screen.getByText(/выберите масштаб перевода шагов/i)).toBeInTheDocument();
  });

  it('should close modal when clicking outside', () => {
    render(<StepToCmFactorToggle value="5" onValueChange={onValueChangeMock} />);

    // Open modal
    const infoButton = screen.getByRole('button', { name: /подробнее о масштабе/i });
    fireEvent.click(infoButton);
    expect(screen.getByText('МАСШТАБ ИГРЫ')).toBeInTheDocument();

    // Close modal by clicking overlay
    const modal = screen.getByText('МАСШТАБ ИГРЫ').closest('.fixed');
    expect(modal).toBeInTheDocument();
    if (modal) {
      fireEvent.click(modal);
      expect(screen.queryByText('МАСШТАБ ИГРЫ')).not.toBeInTheDocument();
    }
  });

  it('should have correct data-testid', () => {
    const { container } = render(
      <StepToCmFactorToggle value="5" onValueChange={onValueChangeMock} />
    );

    expect(container.querySelector('[data-testid="step-to-cm-factor-toggle"]')).toBeInTheDocument();
  });

  it('should have violet styling when in "4" mode', () => {
    const { container } = render(
      <StepToCmFactorToggle value="4" onValueChange={onValueChangeMock} />
    );

    const toggle = container.querySelector('[data-testid="step-to-cm-factor-toggle"]');
    expect(toggle).toHaveClass('bg-violet-950/30', 'border-violet-600/60');
  });

  it('should have slate styling when in "5" mode', () => {
    const { container } = render(
      <StepToCmFactorToggle value="5" onValueChange={onValueChangeMock} />
    );

    const toggle = container.querySelector('[data-testid="step-to-cm-factor-toggle"]');
    expect(toggle).toHaveClass('bg-slate-800/40', 'border-slate-700/50');
  });
});

describe('getStepToCmFactor helper', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('should return "4" when localStorage has "4"', () => {
    mockLocalStorage.setItem('bronepehota_step_to_cm_factor', '4');
    expect(getStepToCmFactor()).toBe('4');
  });

  it('should return "5" when localStorage has "5"', () => {
    mockLocalStorage.setItem('bronepehota_step_to_cm_factor', '5');
    expect(getStepToCmFactor()).toBe('5');
  });

  it('should return "5" when localStorage is empty', () => {
    expect(getStepToCmFactor()).toBe('5');
  });

  it('should return "5" when localStorage has invalid value', () => {
    mockLocalStorage.setItem('bronepehota_step_to_cm_factor', 'invalid');
    expect(getStepToCmFactor()).toBe('5');
  });
});
