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
    // В панели две ссылки (бой + калькулятор) — трекаем именно боевую
    fireEvent.click(screen.getByRole('link', { name: /Взять отряд в бой/ }));
    expect(trackEvent).toHaveBeenCalledWith('battle_entry', { from: 'encyclopedia_unit' });
  });

  it('onOpenSandbox не задан (машины) — кнопки песочницы нет', () => {
    render(<UnitToBattleCta faction="polaris" />);
    expect(screen.queryByTestId('unit-sandbox-open')).not.toBeInTheDocument();
  });

  it('тихая ссылка на калькулятор с пояснением «в бою статы подтянутся сами»', () => {
    render(<UnitToBattleCta faction="polaris" />);
    const link = screen.getByTestId('unit-calculator-link');
    expect(link.getAttribute('href')).toBe('/calculator');
    expect(screen.getByText('в бою статы подтянутся сами')).toBeInTheDocument();
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
