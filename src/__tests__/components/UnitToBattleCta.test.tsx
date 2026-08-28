// src/__tests__/components/UnitToBattleCta.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UnitToBattleCta } from '@/components/encyclopedia/UnitDetail/UnitToBattleCta';
import { trackEvent } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

describe('UnitToBattleCta', () => {
  it('кнопка ведёт на /app?faction=<фракция>', () => {
    render(<UnitToBattleCta faction="dead_fleet" />);
    const link = screen.getByTestId('unit-to-battle-cta').querySelector('a');
    expect(link?.getAttribute('href')).toBe('/app?faction=dead_fleet');
  });

  it('клик шлёт battle_entry(from=encyclopedia_unit)', () => {
    render(<UnitToBattleCta faction="polaris" />);
    fireEvent.click(screen.getByRole('link'));
    expect(trackEvent).toHaveBeenCalledWith('battle_entry', { from: 'encyclopedia_unit' });
  });

  it('onOpenSandbox не задан (машины) — кнопки песочницы нет', () => {
    render(<UnitToBattleCta faction="polaris" />);
    expect(screen.queryByTestId('unit-sandbox-open')).not.toBeInTheDocument();
  });

  it('onOpenSandbox задан — кнопка «ПРОВЕРИТЬ БОЕМ» есть, клик вызывает callback', () => {
    const onOpenSandbox = jest.fn();
    render(<UnitToBattleCta faction="polaris" onOpenSandbox={onOpenSandbox} />);
    const btn = screen.getByTestId('unit-sandbox-open');
    expect(btn).toHaveTextContent('ПРОВЕРИТЬ БОЕМ');
    fireEvent.click(btn);
    expect(onOpenSandbox).toHaveBeenCalledTimes(1);
  });
});
