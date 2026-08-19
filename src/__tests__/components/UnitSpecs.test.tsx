import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnitSpecs } from '@/components/encyclopedia/UnitDetail/UnitSpecs';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

// Minimal factory — UnitSpecs reads only `unit.encyclopedia`.
const unit = (encyclopedia: Record<string, unknown>): EncyclopediaUnit =>
  ({ encyclopedia } as unknown as EncyclopediaUnit);

describe('UnitSpecs — ТТХ data plate', () => {
  it('renders the machine specs when present', () => {
    render(
      <UnitSpecs
        unit={unit({
          type: 'Линейный шагающий танк',
          manufacturer: '«Робогир Индастриз», Ангерран',
          monoblock: 'РМ-1',
          mass: '4,3 тонны',
          crew: '1 человек',
        })}
      />,
    );
    expect(screen.getByText('Характеристики')).toBeInTheDocument();
    // Labels and values all surface (previously these fields were never rendered).
    expect(screen.getByText('Разработчик')).toBeInTheDocument();
    expect(screen.getByText('«Робогир Индастриз», Ангерран')).toBeInTheDocument();
    expect(screen.getByText('Моноблок')).toBeInTheDocument();
    expect(screen.getByText('РМ-1')).toBeInTheDocument();
    expect(screen.getByText('4,3 тонны')).toBeInTheDocument();
    expect(screen.getByText('1 человек')).toBeInTheDocument();
  });

  it('is hidden when no machine-defining specs are set (squads)', () => {
    // A squad carries only `type`/`class` (class already shows in the header) — no spec plate.
    const { container } = render(<UnitSpecs unit={unit({ type: 'Пехотный отряд' })} />);
    expect(container.firstChild).toBeNull();
  });

  it('is hidden when encyclopedia is absent', () => {
    const { container } = render(<UnitSpecs unit={unit({})} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the sourceUrl as a link when present', () => {
    render(
      <UnitSpecs
        unit={unit({ manufacturer: 'Робогир Индастриз', sourceUrl: 'https://robogear.ru/x' })}
      />,
    );
    const link = screen.getByRole('link', { name: /источник ттх/i });
    expect(link).toHaveAttribute('href', 'https://robogear.ru/x');
  });
});
