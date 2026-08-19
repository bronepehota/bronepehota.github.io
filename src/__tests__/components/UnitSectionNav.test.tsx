import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnitSectionNav } from '@/components/encyclopedia/UnitDetail/UnitSectionNav';
import type { EnrichedUnit } from '@/lib/encyclopedia-utils';

// Minimal factory — UnitSectionNav reads only encyclopedia fields, type and
// soldiers/images presence (it must mirror the null-conditions of the section
// components it links to: UnitSpecs / UnitArmament / UnitStatTable /
// SoldierImages / tactics section / UnitLore / UnitLoreDetail).
const unit = (over: Record<string, unknown>): EnrichedUnit =>
  ({ id: 'x', name: 'X', faction: 'polaris', type: 'machine', sources: [], ...over } as unknown as EnrichedUnit);

const CHIP = (id: string) => screen.queryByTestId(`unit-section-chip-${id}`);

describe('UnitSectionNav — якорная навигация по секциям досье', () => {
  it('renders anchors for every section of a rich machine dossier (griffin-like)', () => {
    const machine = unit({
      encyclopedia: {
        type: 'Линейный шагающий танк',
        manufacturer: '«Робогир Индастриз»',
        monoblock: 'РМ-1',
        mass: '4,3 тонны',
        crew: '1 человек',
        armament: [
          { name: 'Лазерная пушка «Вихрь»', caliber: '30 МЭ', range: 'D12' },
          { name: 'Пулемёт', notes: 'стрельба очередями' },
        ],
        lore: 'Лор и история грифона.',
        tactics: 'Держаться пересечённой местности.',
      },
    });
    render(<UnitSectionNav unit={machine} activeUnit={machine} hasLoreDoc />);

    // Specs + armament + stats + tactics + lore + full-lore = 6 anchors
    // (no «Личный состав» — machines don't render SoldierImages).
    const chips = screen.getAllByTestId(/^unit-section-chip-/);
    expect(chips).toHaveLength(6);
    expect(CHIP('specs')).toHaveAttribute('href', '#specs');
    expect(CHIP('armament')).toHaveAttribute('href', '#armament');
    expect(CHIP('stats')).toHaveAttribute('href', '#stats');
    expect(CHIP('personnel')).toBeNull();
    expect(CHIP('tactics')).toHaveAttribute('href', '#tactics');
    expect(CHIP('lore')).toHaveAttribute('href', '#lore');
    expect(CHIP('full-lore')).toHaveAttribute('href', '#full-lore');
    expect(CHIP('armament')).toHaveTextContent('Вооружение');
  });

  it('renders fewer anchors for a squad without ТТХ/armament/tactics', () => {
    const squad = unit({
      type: 'squad',
      image: '/images/squads/squad.png',
      soldiers: [{ image: '/images/squads/s1.png' }, {}],
      encyclopedia: { lore: 'Короткий лор отряда.' },
    });
    render(<UnitSectionNav unit={squad} activeUnit={squad} hasLoreDoc={false} />);

    const chips = screen.getAllByTestId(/^unit-section-chip-/);
    expect(chips).toHaveLength(3); // stats + personnel + lore
    expect(CHIP('specs')).toBeNull();
    expect(CHIP('armament')).toBeNull();
    expect(CHIP('tactics')).toBeNull();
    expect(CHIP('full-lore')).toBeNull();
    expect(CHIP('personnel')).toHaveAttribute('href', '#personnel');
  });

  it('omits the personnel anchor when a squad has no images', () => {
    const squad = unit({
      type: 'squad',
      soldiers: [{ rank: 2 }],
      encyclopedia: { lore: 'л' },
    });
    render(<UnitSectionNav unit={squad} activeUnit={squad} hasLoreDoc={false} />);
    expect(CHIP('personnel')).toBeNull();
  });

  it('renders nothing for a unit with a single section (nav would be noise)', () => {
    // Боевой расчёт always renders, so a bare unit yields exactly one anchor.
    const bare = unit({});
    const { container } = render(
      <UnitSectionNav unit={bare} activeUnit={bare} hasLoreDoc={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the encyclopedia block is absent', () => {
    const bare = unit({ encyclopedia: undefined });
    const { container } = render(
      <UnitSectionNav unit={bare} activeUnit={bare} hasLoreDoc={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('counts lore arrays (keyBattles/locations) as lore content', () => {
    const withBattles = unit({ encyclopedia: { keyBattles: [{ name: 'Битва', year: '2190' }] } });
    render(<UnitSectionNav unit={withBattles} activeUnit={withBattles} hasLoreDoc={false} />);
    expect(CHIP('lore')).toBeInTheDocument();
  });
});
