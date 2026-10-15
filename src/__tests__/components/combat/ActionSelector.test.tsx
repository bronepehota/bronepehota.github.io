import { render, screen } from '@testing-library/react';
import { ActionSelector } from '@/components/combat/ActionSelector';

/**
 * Плейтест: кнопки выбора действия (ВЫСТРЕЛ/БЛИЖНИЙ БОЙ/…) мелкие на телефоне —
 * в палец не попадают. Строки-кнопки должны быть высокими с крупным кеглем
 * на мобиле (десктоп не регрессирует).
 */
describe('ActionSelector — мобильный размер кнопок', () => {
  it('строки действий высокие (min-h-[60px]) с крупным кеглем', () => {
    render(<ActionSelector onSelect={jest.fn()} />);

    for (const label of ['ВЫСТРЕЛ', 'БЛИЖНИЙ БОЙ', 'ГРАНАТА']) {
      const button = screen.getByRole('button', { name: new RegExp(label) });
      expect(button).toHaveClass('min-h-[60px]');
      const heading = button.querySelector('.font-black');
      expect(heading).toHaveClass('text-base');
    }
  });

  it('все действия остаются на месте (выстрел/ББ/граната)', () => {
    render(<ActionSelector onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: /ВЫСТРЕЛ/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /БЛИЖНИЙ БОЙ/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ГРАНАТА/ })).toBeInTheDocument();
  });
});
