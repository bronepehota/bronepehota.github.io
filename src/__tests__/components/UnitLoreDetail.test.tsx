import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnitLoreDetail } from '@/components/encyclopedia/UnitDetail/UnitLoreDetail';
import type { UnitLoreDoc } from '@/lib/unit-lore';

const doc = (over: Partial<UnitLoreDoc> = {}): UnitLoreDoc => ({
  id: 'griffin',
  bodyHtml: '<h2>Концепция</h2><p>Рейдовый шагающий танк.</p>',
  sourceLabel: 'Справочник техники «Робогир»',
  sourceUrl: 'https://www.robogear.ru',
  ...over,
});

describe('UnitLoreDetail — «Читать подробнее»', () => {
  it('renders the full body HTML (always in DOM, even when collapsed → crawlable)', () => {
    render(<UnitLoreDetail doc={doc()} />);
    expect(screen.getByText('Рейдовый шагающий танк.')).toBeInTheDocument();
    expect(screen.getByTestId('unit-lore-detail')).toBeInTheDocument();
  });

  it('the toggle button reflects expanded state', () => {
    render(<UnitLoreDetail doc={doc()} />);
    const btn = screen.getByRole('button', { name: /полное описание/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the primary-source reference link', () => {
    render(<UnitLoreDetail doc={doc()} />);
    const link = screen.getByRole('link', { name: /первоисточник/i });
    expect(link).toHaveAttribute('href', 'https://www.robogear.ru');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders a non-link span when no sourceUrl is set', () => {
    render(<UnitLoreDetail doc={doc({ sourceUrl: undefined, sourceLabel: 'канон' })} />);
    // No external link, but the label still shows.
    expect(screen.getByText(/канон/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /первоисточник/i })).toBeNull();
  });
});
