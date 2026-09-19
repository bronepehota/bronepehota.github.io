import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValueChips } from '@/components/ui/ValueChips';

describe('ValueChips', () => {
  it('renders one chip per value', () => {
    render(<ValueChips values={[0, 1, 2]} onSelect={jest.fn()} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('fires onSelect with the tapped value', async () => {
    const onSelect = jest.fn();
    render(<ValueChips values={[1, 2, 3]} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('2'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('marks the selected chip', () => {
    render(<ValueChips values={[1, 2, 3]} selected={2} onSelect={jest.fn()} />);

    expect(screen.getByText('2').closest('button')).toHaveClass('bg-cyan-950/50');
    expect(screen.getByText('1').closest('button')).not.toHaveClass('bg-cyan-950/50');
    expect(screen.getByText('3').closest('button')).not.toHaveClass('bg-cyan-950/50');
  });

  it('renders frequency bars only when freq is provided', () => {
    const { container, rerender } = render(
      <ValueChips values={[5, 7]} onSelect={jest.fn()} freq={[1, 0.5]} />
    );

    const bars = container.querySelectorAll('div[style*="width"]');
    expect(bars).toHaveLength(2);

    rerender(<ValueChips values={[5, 7]} onSelect={jest.fn()} />);
    expect(container.querySelectorAll('div[style*="width"]')).toHaveLength(0);
  });
});
