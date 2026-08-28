// src/__tests__/components/CTAButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CTAButton from '@/components/landing/CTAButton';
import { trackEvent } from '@/lib/analytics';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

// Изоляция тестов: без этого battle-state localStorage протекает между
// тестами/порядком запуска (jsdom хранит его на всё время жизни окружения).
beforeEach(() => {
  localStorage.clear();
});

describe('CTAButton — модульная строка (fresh state)', () => {
  it('рендерит ШТАБ и широкую ЭНЦИКЛОПЕДИЮ с верными href', () => {
    render(<CTAButton />);
    expect(screen.getByTestId('landing-cta-button').getAttribute('href')).toBe('/app');
    expect(screen.getByTestId('landing-encyclopedia-button').getAttribute('href')).toBe('/encyclopedia');
  });

  it('микротексты модулей', () => {
    render(<CTAButton />);
    expect(screen.getByText('собери армию и веди бой')).toBeInTheDocument();
    expect(screen.getByText('отряды, лор, тактика')).toBeInTheDocument();
  });

  it('клик по ШТАБ шлёт battle_entry(from=landing_hero)', () => {
    render(<CTAButton />);
    fireEvent.click(screen.getByTestId('landing-cta-button'));
    expect(trackEvent).toHaveBeenCalledWith('battle_entry', { from: 'landing_hero' });
  });
});

describe('CTAButton — карточка «Бой идёт» (battle state)', () => {
  it('КОНВЕРТ {schemaVersion, army} с isInBattle → карточка боя; энциклопедия доступна', () => {
    localStorage.setItem('bronepehota_army', JSON.stringify({
      schemaVersion: 1,
      army: { isInBattle: true, lastBattleDate: '2026-08-28T10:00:00Z', units: [{}] },
    }));
    render(<CTAButton />);
    expect(screen.getByTestId('landing-continue-button')).toBeInTheDocument();
    // модульная строка скрыта, но вход в энциклопедию остаётся третьим сегментом карточки
    expect(screen.queryByTestId('landing-cta-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('landing-encyclopedia-button').getAttribute('href')).toBe('/encyclopedia');
  });

  it('легаси-голый Army тоже работает', () => {
    localStorage.setItem('bronepehota_army', JSON.stringify({ isInBattle: true }));
    render(<CTAButton />);
    expect(screen.getByTestId('landing-continue-button')).toBeInTheDocument();
  });

  it('isInBattle=false → модульная строка', () => {
    localStorage.setItem('bronepehota_army', JSON.stringify({
      schemaVersion: 1,
      army: { isInBattle: false, units: [] },
    }));
    render(<CTAButton />);
    expect(screen.queryByTestId('landing-continue-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('landing-encyclopedia-button')).toBeInTheDocument();
  });
});
