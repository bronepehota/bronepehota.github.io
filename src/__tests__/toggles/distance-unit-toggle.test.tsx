import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DistanceUnitToggle, getDistanceUnit } from '@/components/toggles/DistanceUnitToggle';

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

describe('DistanceUnitToggle', () => {
  let onValueChangeMock: jest.Mock;

  beforeEach(() => {
    onValueChangeMock = jest.fn();
    mockLocalStorage.clear();
    // Clear module cache to reset useEffect behavior
    jest.clearAllMocks();
  });

  it('should render with default value "steps"', () => {
    render(<DistanceUnitToggle value="steps" onValueChange={onValueChangeMock} />);

    expect(screen.getByText('ЕДИНИЦЫ')).toBeInTheDocument();
    expect(screen.getByText('Ввод в шагах')).toBeInTheDocument();
  });

  it('should render with value "cm"', () => {
    render(<DistanceUnitToggle value="cm" onValueChange={onValueChangeMock} />);

    expect(screen.getByText('ЕДИНИЦЫ')).toBeInTheDocument();
    expect(screen.getByText('Ввод в сантиметрах')).toBeInTheDocument();
  });

  it('should toggle from "steps" to "cm" when clicked', async () => {
    render(<DistanceUnitToggle value="steps" onValueChange={onValueChangeMock} />);

    const button = screen.getByRole('button', { name: /единицы измерения: шаги/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onValueChangeMock).toHaveBeenCalledWith('cm');
    });
    expect(mockLocalStorage.getItem('bronepehota_distance_input_unit')).toBe('cm');
  });

  it('should toggle from "cm" to "steps" when clicked', async () => {
    render(<DistanceUnitToggle value="cm" onValueChange={onValueChangeMock} />);

    const button = screen.getByRole('button', { name: /единицы измерения: сантиметры/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onValueChangeMock).toHaveBeenCalledWith('steps');
    });
    expect(mockLocalStorage.getItem('bronepehota_distance_input_unit')).toBe('steps');
  });

  it('should show modal when info button is clicked', () => {
    render(<DistanceUnitToggle value="steps" onValueChange={onValueChangeMock} />);

    const infoButton = screen.getByRole('button', { name: /подробнее о единицах измерения/i });
    fireEvent.click(infoButton);

    expect(screen.getByText('ЕДИНИЦЫ ИЗМЕРЕНИЯ')).toBeInTheDocument();
    expect(screen.getByText(/выберите удобную единицу измерения/i)).toBeInTheDocument();
  });

  it('should close modal when clicking outside', () => {
    render(<DistanceUnitToggle value="steps" onValueChange={onValueChangeMock} />);

    // Open modal
    const infoButton = screen.getByRole('button', { name: /подробнее о единицах измерения/i });
    fireEvent.click(infoButton);
    expect(screen.getByText('ЕДИНИЦЫ ИЗМЕРЕНИЯ')).toBeInTheDocument();

    // Close modal by clicking overlay
    const modal = screen.getByText('ЕДИНИЦЫ ИЗМЕРЕНИЯ').closest('.fixed');
    expect(modal).toBeInTheDocument();
    if (modal) {
      fireEvent.click(modal);
      // Modal should be removed from DOM
      expect(screen.queryByText('ЕДИНИЦЫ ИЗМЕРЕНИЯ')).not.toBeInTheDocument();
    }
  });

  it('should have correct data-testid', () => {
    const { container } = render(
      <DistanceUnitToggle value="steps" onValueChange={onValueChangeMock} />
    );

    expect(container.querySelector('[data-testid="distance-unit-toggle"]')).toBeInTheDocument();
  });

  it('should have amber styling when in cm mode', () => {
    const { container } = render(
      <DistanceUnitToggle value="cm" onValueChange={onValueChangeMock} />
    );

    const toggle = container.querySelector('[data-testid="distance-unit-toggle"]');
    expect(toggle).toHaveClass('bg-amber-950/30', 'border-amber-600/60');
  });

  it('should have slate styling when in steps mode', () => {
    const { container } = render(
      <DistanceUnitToggle value="steps" onValueChange={onValueChangeMock} />
    );

    const toggle = container.querySelector('[data-testid="distance-unit-toggle"]');
    expect(toggle).toHaveClass('bg-slate-800/40', 'border-slate-700/50');
  });
});

describe('getDistanceUnit helper', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('should return "cm" when localStorage has "cm"', () => {
    mockLocalStorage.setItem('bronepehota_distance_input_unit', 'cm');
    expect(getDistanceUnit()).toBe('cm');
  });

  it('should return "steps" when localStorage has "steps"', () => {
    mockLocalStorage.setItem('bronepehota_distance_input_unit', 'steps');
    expect(getDistanceUnit()).toBe('steps');
  });

  it('should return "steps" when localStorage is empty', () => {
    expect(getDistanceUnit()).toBe('steps');
  });

  it('should return "steps" when localStorage has invalid value', () => {
    mockLocalStorage.setItem('bronepehota_distance_input_unit', 'invalid');
    expect(getDistanceUnit()).toBe('steps');
  });
});
