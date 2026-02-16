import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FortificationSelector } from '@/components/controls/FortificationSelector';

describe('FortificationSelector', () => {
  it('renders 3 options', () => {
    render(
      <FortificationSelector
        value="none"
        onChange={() => {}}
        rulesVersion="tehnolog"
      />
    );

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'Укрытие цели');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('displays correct labels for teknolog rules', () => {
    render(
      <FortificationSelector
        value="none"
        onChange={() => {}}
        rulesVersion="tehnolog"
      />
    );

    expect(screen.getByLabelText('Без укрытия')).toBeInTheDocument();
    expect(screen.getByLabelText(/Лёгкое укрытие.*менее 50%/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Полное укрытие.*более 50%/)).toBeInTheDocument();
  });

  it('displays correct modifiers in tooltips for teknolog rules (armor)', () => {
    render(
      <FortificationSelector
        value="none"
        onChange={() => {}}
        rulesVersion="tehnolog"
      />
    );

    expect(screen.getByTitle(/Без укрытия.*\+0/)).toBeInTheDocument();
    expect(screen.getByTitle(/Лёгкое.*\+1 к броне/)).toBeInTheDocument();
    expect(screen.getByTitle(/Полное.*\+2 к броне/)).toBeInTheDocument();
  });

  it('displays correct modifiers in tooltips for community_star_system rules (distance)', () => {
    render(
      <FortificationSelector
        value="none"
        onChange={() => {}}
        rulesVersion="community_star_system"
      />
    );

    expect(screen.getByTitle(/Без укрытия.*\+0/)).toBeInTheDocument();
    expect(screen.getByTitle(/Лёгкое.*\+1 к дистанции/)).toBeInTheDocument();
    expect(screen.getByTitle(/Полное.*\+2 к дистанции/)).toBeInTheDocument();
  });

  it('calls onChange when option clicked', async () => {
    const handleChange = jest.fn();
    render(
      <FortificationSelector
        value="none"
        onChange={handleChange}
        rulesVersion="tehnolog"
      />
    );

    const lightButton = screen.getByLabelText(/Лёгкое укрытие.*менее 50%/);
    await userEvent.click(lightButton);

    expect(handleChange).toHaveBeenCalledWith('light');
  });

  it('applies active styling to selected option', () => {
    const { rerender } = render(
      <FortificationSelector
        value="none"
        onChange={() => {}}
        rulesVersion="tehnolog"
      />
    );

    const buttons = screen.getAllByRole('radio');
    // First button (none) should be active
    expect(buttons[0]).toHaveAttribute('aria-checked', 'true');

    rerender(
      <FortificationSelector
        value="heavy"
        onChange={() => {}}
        rulesVersion="tehnolog"
      />
    );

    // Third button (heavy) should now be active
    expect(buttons[2]).toHaveAttribute('aria-checked', 'true');
  });

});
