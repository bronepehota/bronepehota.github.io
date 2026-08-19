import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnitArmament } from '@/components/encyclopedia/UnitDetail/UnitArmament';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

const unit = (encyclopedia: Record<string, unknown>): EncyclopediaUnit =>
  ({ encyclopedia } as unknown as EncyclopediaUnit);

describe('UnitArmament — таблица вооружений', () => {
  it('renders weapon entries with name, caliber and notes', () => {
    render(
      <UnitArmament
        unit={unit({
          designation: 'БМР-1Г',
          armament: [
            { name: 'Лазерная пушка «Световой меч» (LG-25)', notes: '«ЭнергоМагнетик Текнолоджиз Центавра Ко»' },
            { name: '3-х ствольный лёгкий пулемёт «Триплет» (Mk56)', caliber: '5,6 мм' },
          ],
        })}
      />,
    );
    expect(screen.getByText('Вооружение')).toBeInTheDocument();
    expect(screen.getByText('Лазерная пушка «Световой меч» (LG-25)')).toBeInTheDocument();
    expect(screen.getByText('5,6 мм')).toBeInTheDocument();
    expect(screen.getAllByTestId('armament-entry')).toHaveLength(2);
  });

  it('is hidden when armament is absent or empty', () => {
    const { container } = render(<UnitArmament unit={unit({ designation: 'УМ-1Ш' })} />);
    expect(container.firstChild).toBeNull();
    const { container: c2 } = render(<UnitArmament unit={unit({ armament: [] })} />);
    expect(c2.firstChild).toBeNull();
  });

  it('is hidden when encyclopedia is empty', () => {
    const { container } = render(<UnitArmament unit={unit({})} />);
    expect(container.firstChild).toBeNull();
  });
});
