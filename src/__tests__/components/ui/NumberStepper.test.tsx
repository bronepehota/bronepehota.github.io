import { render, screen, fireEvent, act } from '@testing-library/react';
import { NumberStepper } from '@/components/ui/NumberStepper';

describe('NumberStepper', () => {
  it('increments and decrements by step on click', () => {
    const onChange = jest.fn();
    render(<NumberStepper value={5} onChange={onChange} min={1} max={10} label="Дистанция" />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase Дистанция' }));
    expect(onChange).toHaveBeenLastCalledWith(6);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease Дистанция' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('clamps at min and max without firing onChange', () => {
    const onChange = jest.fn();
    const { rerender } = render(<NumberStepper value={1} onChange={onChange} min={1} max={10} label="Дистанция" />);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease Дистанция' }));
    expect(onChange).not.toHaveBeenCalled();

    rerender(<NumberStepper value={10} onChange={onChange} min={1} max={10} label="Дистанция" />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Дистанция' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the aria-labels e2e relies on', () => {
    render(<NumberStepper value={5} onChange={jest.fn()} label="Дистанция" />);

    expect(screen.getByRole('button', { name: 'Decrease Дистанция' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Increase Дистанция' })).toBeInTheDocument();
    expect(screen.getByLabelText('Дистанция input')).toBeInTheDocument();
  });

  it('repeats while the button is held and stops on release', () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(<NumberStepper value={0} onChange={onChange} min={0} max={99} label="Дистанция" />);

    const inc = screen.getByRole('button', { name: 'Increase Дистанция' });
    fireEvent.pointerDown(inc);

    // Hold delay elapses → the repeat interval starts
    act(() => { jest.advanceTimersByTime(450); });
    expect(onChange).toHaveBeenCalledTimes(0);

    // Three interval ticks
    act(() => { jest.advanceTimersByTime(140 * 3); });
    expect(onChange).toHaveBeenCalledTimes(3);

    fireEvent.pointerUp(inc);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(onChange).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  it('sweeps through controlled updates — no stale-closure freeze (review #1)', () => {
    jest.useFakeTimers();
    // Simulate a controlled parent: feed every emitted value back via rerender
    let current = 5;
    const onChange = jest.fn((v: number) => { current = v; });
    const view = render(
      <NumberStepper value={current} onChange={onChange} min={1} max={40} label="Дистанция" />
    );

    const inc = screen.getByRole('button', { name: 'Increase Дистанция' });
    fireEvent.pointerDown(inc);
    act(() => { jest.advanceTimersByTime(450); });

    // Tick 1 → 6; parent feeds it back
    act(() => { jest.advanceTimersByTime(140); });
    expect(current).toBe(6);
    view.rerender(
      <NumberStepper value={current} onChange={onChange} min={1} max={40} label="Дистанция" />
    );

    // Tick 2 must see the fresh value → 7 (a captured stale closure would re-emit 6)
    act(() => { jest.advanceTimersByTime(140); });
    expect(current).toBe(7);

    fireEvent.pointerUp(inc);
    jest.useRealTimers();
  });

  it('a held sweep does not add an extra step from the trailing click', () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(<NumberStepper value={0} onChange={onChange} min={0} max={99} label="Дистанция" />);

    const inc = screen.getByRole('button', { name: 'Increase Дистанция' });
    fireEvent.pointerDown(inc);
    act(() => { jest.advanceTimersByTime(450 + 140 * 2); }); // 2 repeats
    fireEvent.pointerUp(inc);
    fireEvent.click(inc); // trailing click must be suppressed

    expect(onChange).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('a quick tap fires exactly one change', () => {
    const onChange = jest.fn();
    render(<NumberStepper value={5} onChange={onChange} min={0} max={99} label="Дистанция" />);

    const inc = screen.getByRole('button', { name: 'Increase Дистанция' });
    fireEvent.pointerDown(inc);
    fireEvent.pointerUp(inc);
    fireEvent.click(inc);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('onInputActivate replaces the input with a tappable value button', () => {
    const onInputActivate = jest.fn();
    render(<NumberStepper value={7} onChange={jest.fn()} label="Броня цели" onInputActivate={onInputActivate} />);

    // Same aria-label e2e relies on, but a button instead of a number input
    const valueButton = screen.getByLabelText('Броня цели input');
    expect(valueButton.tagName).toBe('BUTTON');
    expect(valueButton).toHaveTextContent('7');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();

    fireEvent.click(valueButton);
    expect(onInputActivate).toHaveBeenCalledTimes(1);

    // Steppers keep working
    fireEvent.click(screen.getByRole('button', { name: 'Increase Броня цели' }));
  });
});
