import React from 'react';
import { render } from '@testing-library/react';
import StatusStripe from '../StatusStripe';

describe('StatusStripe', () => {
  it('renders green stripe for done state', () => {
    const { container } = render(<StatusStripe state="done" />);
    const stripe = container.firstChild as HTMLElement;

    expect(stripe).toHaveClass('from-emerald-500', 'to-emerald-600');
  });

  it('renders red stripe for dead state', () => {
    const { container } = render(<StatusStripe state="dead" />);
    const stripe = container.firstChild as HTMLElement;

    expect(stripe).toHaveClass('from-red-600', 'to-red-700');
  });

  it('renders orange stripe for panic state', () => {
    const { container } = render(<StatusStripe state="panic" />);
    const stripe = container.firstChild as HTMLElement;

    expect(stripe).toHaveClass('from-orange-500', 'to-amber-500');
  });

  it('renders transparent for active state', () => {
    const { container } = render(<StatusStripe state="active" />);
    const stripe = container.firstChild as HTMLElement;

    expect(stripe).toHaveClass('bg-transparent');
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatusStripe state="done" className="custom-class" />
    );
    const stripe = container.firstChild as HTMLElement;

    expect(stripe).toHaveClass('custom-class');
  });
});
