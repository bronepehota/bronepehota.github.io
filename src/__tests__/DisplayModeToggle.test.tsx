import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisplayModeToggle } from '@/components/DisplayModeToggle';

describe('DisplayModeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders two buttons', () => {
    render(
      <DisplayModeToggle
        mode="detailed"
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Подробный вид')).toBeInTheDocument();
    expect(screen.getByLabelText('Компактный вид')).toBeInTheDocument();
  });

  it('shows detailed mode as active', () => {
    render(
      <DisplayModeToggle
        mode="detailed"
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Подробный вид')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Компактный вид')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows compact mode as active', () => {
    render(
      <DisplayModeToggle
        mode="compact"
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Подробный вид')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Компактный вид')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange when detailed button clicked', async () => {
    const handleChange = jest.fn();
    render(
      <DisplayModeToggle
        mode="compact"
        onChange={handleChange}
      />
    );

    const detailedButton = screen.getByLabelText('Подробный вид');
    await userEvent.click(detailedButton);

    expect(handleChange).toHaveBeenCalledWith('detailed');
  });

  it('calls onChange when compact button clicked', async () => {
    const handleChange = jest.fn();
    render(
      <DisplayModeToggle
        mode="detailed"
        onChange={handleChange}
      />
    );

    const compactButton = screen.getByLabelText('Компактный вид');
    await userEvent.click(compactButton);

    expect(handleChange).toHaveBeenCalledWith('compact');
  });

  it('persists mode to localStorage', () => {
    render(
      <DisplayModeToggle
        mode="compact"
        onChange={() => {}}
      />
    );

    expect(localStorage.getItem('bronepehota_display_mode')).toBe('compact');
  });

  it('loads mode from localStorage on mount', () => {
    localStorage.setItem('bronepehota_display_mode', 'compact');
    const handleChange = jest.fn();

    render(
      <DisplayModeToggle
        mode="detailed"
        onChange={handleChange}
      />
    );

    // The component should initialize with the saved value
    expect(handleChange).toHaveBeenCalledWith('compact');
  });
});
