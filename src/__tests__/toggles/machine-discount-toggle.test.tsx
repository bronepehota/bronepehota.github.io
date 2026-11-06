import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MachineDiscountToggle, getMachineDiscountEnabled } from '@/components/toggles/MachineDiscountToggle';

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

describe('MachineDiscountToggle', () => {
  let onChangeMock: jest.Mock;

  beforeEach(() => {
    onChangeMock = jest.fn();
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('renders with БЕТА badge and disabled subtitle by default', () => {
    render(<MachineDiscountToggle enabled={false} onEnabledChange={onChangeMock} />);

    expect(screen.getByTestId('machine-discount-toggle')).toBeInTheDocument();
    expect(screen.getByText('БЕТА')).toBeInTheDocument();
    expect(screen.getByText('ТЕХНИКА −30%')).toBeInTheDocument();
  });

  it('is off by default (aria-pressed=false when enabled=false)', () => {
    render(<MachineDiscountToggle enabled={false} onEnabledChange={onChangeMock} />);

    expect(screen.getByRole('button', { name: /скидка на технику:/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles on click and persists to localStorage', () => {
    render(<MachineDiscountToggle enabled={false} onEnabledChange={onChangeMock} />);

    fireEvent.click(screen.getByRole('button', { name: /включить скидку/i }));

    expect(onChangeMock).toHaveBeenCalledWith(true);
    expect(mockLocalStorage.getItem('bronepehota_machine_discount_enabled')).toBe('true');
  });

  it('persists disable state when toggled off', () => {
    render(<MachineDiscountToggle enabled={true} onEnabledChange={onChangeMock} />);

    fireEvent.click(screen.getByRole('button', { name: /отключить скидку/i }));

    expect(onChangeMock).toHaveBeenCalledWith(false);
    expect(mockLocalStorage.getItem('bronepehota_machine_discount_enabled')).toBe('false');
  });

  it('getMachineDiscountEnabled reads localStorage (default false)', () => {
    expect(getMachineDiscountEnabled()).toBe(false);

    mockLocalStorage.setItem('bronepehota_machine_discount_enabled', 'true');
    expect(getMachineDiscountEnabled()).toBe(true);
  });
});
