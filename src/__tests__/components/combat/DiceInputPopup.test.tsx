import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiceInputPopup } from '@/components/combat/DiceInputPopup';

const baseProps = {
  title: 'БРОНЯ ЦЕЛИ',
  field: 'armor',
  color: 'orange' as const,
  mode: 'number' as const,
  numericValue: 2,
  min: 0,
  max: 99,
  onSubmit: jest.fn(),
  onClose: jest.fn(),
};

describe('DiceInputPopup — quick values and field override', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders custom quickValues instead of the default 0-10 grid', () => {
    render(<DiceInputPopup {...baseProps} quickValues={[0, 1, 2, 3, 4, 5, 6, 7, 8, 10]} />);

    for (const v of [0, 1, 2, 3, 4, 5, 6, 7, 8, 10]) {
      expect(screen.getByRole('button', { name: String(v) })).toBeInTheDocument();
    }
    // Default grid values beyond the custom list are absent
    expect(screen.queryByRole('button', { name: '9' })).not.toBeInTheDocument();
  });

  it('filters quickValues by min/max', () => {
    render(<DiceInputPopup {...baseProps} min={1} max={40} quickValues={[0, 1, 5, 40, 60]} />);

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '40' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '60' })).not.toBeInTheDocument();
  });

  it('selecting a quick value and confirming writes history under the field override', async () => {
    const onSubmit = jest.fn();
    render(<DiceInputPopup {...baseProps} onSubmit={onSubmit} quickValues={[0, 2, 4, 8]} />);

    await userEvent.click(screen.getByRole('button', { name: '4' }));
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(onSubmit).toHaveBeenCalledWith('4');

    const history = JSON.parse(localStorage.getItem('bronepehota_dice_history') ?? '[]');
    expect(history[0]).toMatchObject({ value: '4', field: 'armor' });
  });

  it('recent chips render from history of the overridden field', () => {
    localStorage.setItem('bronepehota_dice_history', JSON.stringify([
      { value: '6', field: 'armor', timestamp: 1 },
      { value: 'D6+2', field: 'range', timestamp: 2 },
    ]));

    render(<DiceInputPopup {...baseProps} field="armor" quickValues={[0, 2, 6]} />);

    // Only armor-field entries appear as recent chips
    const recentRow = screen.getByText('Недавние').parentElement!.nextElementSibling as HTMLElement;
    expect(recentRow).toHaveTextContent('6');
    expect(recentRow).not.toHaveTextContent('D6+2');
  });

  it('allows typing an arbitrary value not in the quick grid', async () => {
    const onSubmit = jest.fn();
    render(<DiceInputPopup {...baseProps} onSubmit={onSubmit} quickValues={[0, 2, 4, 8]} />);

    const input = screen.getByLabelText('Значение');
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, '13');
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(onSubmit).toHaveBeenCalledWith('13');
  });

  it('clamps manually typed values to max on submit', async () => {
    const onSubmit = jest.fn();
    render(<DiceInputPopup {...baseProps} onSubmit={onSubmit} quickValues={[0, 2]} />);

    const input = screen.getByLabelText('Значение');
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, '999');
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(onSubmit).toHaveBeenCalledWith('99');
  });

  it('typing overrides a previously selected quick value', async () => {
    const onSubmit = jest.fn();
    render(<DiceInputPopup {...baseProps} onSubmit={onSubmit} quickValues={[0, 2, 4, 8]} />);

    await userEvent.click(screen.getByRole('button', { name: '4' }));
    const input = screen.getByLabelText('Значение');
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, '7');
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(onSubmit).toHaveBeenCalledWith('7');
  });
});
