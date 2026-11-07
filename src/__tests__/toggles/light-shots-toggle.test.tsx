import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LightShotsToggle, getLightShotsEnabled } from '@/components/toggles/LightShotsToggle';

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

describe('LightShotsToggle', () => {
  let onChangeMock: jest.Mock;

  beforeEach(() => {
    onChangeMock = jest.fn();
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('renders with БЕТА badge and off state by default', () => {
    render(<LightShotsToggle enabled={false} onEnabledChange={onChangeMock} />);

    expect(screen.getByTestId('light-shots-toggle')).toBeInTheDocument();
    expect(screen.getByText('БЕТА')).toBeInTheDocument();
    expect(screen.getByText('ЛЁГКИЕ 2 ВЫСТРЕЛА')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /техника с 1 выстрелом:/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles on click and persists to localStorage', () => {
    render(<LightShotsToggle enabled={false} onEnabledChange={onChangeMock} />);

    fireEvent.click(screen.getByRole('button', { name: /включить/i }));

    expect(onChangeMock).toHaveBeenCalledWith(true);
    expect(mockLocalStorage.getItem('bronepehota_light_shots_enabled')).toBe('true');
  });

  it('persists disable state when toggled off', () => {
    render(<LightShotsToggle enabled={true} onEnabledChange={onChangeMock} />);

    fireEvent.click(screen.getByRole('button', { name: /отключить/i }));

    expect(onChangeMock).toHaveBeenCalledWith(false);
    expect(mockLocalStorage.getItem('bronepehota_light_shots_enabled')).toBe('false');
  });

  it('getLightShotsEnabled reads localStorage (default false)', () => {
    expect(getLightShotsEnabled()).toBe(false);

    mockLocalStorage.setItem('bronepehota_light_shots_enabled', 'true');
    expect(getLightShotsEnabled()).toBe(true);
  });
});
