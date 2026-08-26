// src/__tests__/components/CTAButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CTAButton from '@/components/landing/CTAButton';
import { trackEvent } from '@/lib/analytics';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

describe('CTAButton — модульная строка (fresh state)', () => {
  it('рендерит три модуля с верными href', () => {
    render(<CTAButton />);
    expect(screen.getByTestId('landing-cta-button').getAttribute('href')).toBe('/app');
    expect(screen.getByTestId('landing-encyclopedia-button').getAttribute('href')).toBe('/encyclopedia');
    expect(screen.getByTestId('landing-calculator-button').getAttribute('href')).toBe('/calculator');
  });

  it('микротексты модулей', () => {
    render(<CTAButton />);
    expect(screen.getByText('собери армию и веди бой')).toBeInTheDocument();
    expect(screen.getByText('отряды, лор, тактика')).toBeInTheDocument();
    expect(screen.getByText('броски и урон в бою')).toBeInTheDocument();
  });

  it('клик по ШТАБ шлёт battle_entry(from=landing_hero)', () => {
    render(<CTAButton />);
    fireEvent.click(screen.getByTestId('landing-cta-button'));
    expect(trackEvent).toHaveBeenCalledWith('battle_entry', { from: 'landing_hero' });
  });
});
