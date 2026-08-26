// src/__tests__/components/FactionsSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FactionsSection from '@/components/landing/FactionsSection';
import { trackEvent } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

describe('FactionsSection — карточки-ссылки', () => {
  it('каждая карточка — ссылка на /encyclopedia/factions', () => {
    render(<FactionsSection />);
    const cards = screen.getAllByTestId('landing-faction-card');
    expect(cards.length).toBeGreaterThanOrEqual(5);
    cards.forEach((c) => expect(c.getAttribute('href')).toBe('/encyclopedia/factions'));
  });

  it('клик шлёт battle_entry(from=landing_factions)', () => {
    render(<FactionsSection />);
    fireEvent.click(screen.getAllByTestId('landing-faction-card')[0]);
    expect(trackEvent).toHaveBeenCalledWith('battle_entry', { from: 'landing_factions' });
  });
});
