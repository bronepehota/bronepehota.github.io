import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnitCard } from '@/components/encyclopedia/UnitCard';
import { getEncyclopediaUnit, getAllUnits } from '@/lib/encyclopedia-registry';

// A real catalog unit keeps the test honest (provenance/credits/image resolution
// all run against production data). Falls back to the first unit if the id drifts.
const unit = getEncyclopediaUnit('griffin') ?? getAllUnits()[0];

describe('UnitCard (encyclopedia catalog) — lazy images', () => {
  it('loads every card image lazily (loading="lazy" decoding="async")', () => {
    // The catalog grid renders 100+ cards × (photo + faction logo + provenance
    // badge) — ~360 images / ~11 MB. They must not load eagerly off-screen.
    const { container } = render(<UnitCard unit={unit} />);
    const imgs = Array.from(container.querySelectorAll('img'));
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) {
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('decoding', 'async');
    }
  });

  it('renders the unit photo as an <img> with the unit name as alt', () => {
    const { container } = render(<UnitCard unit={unit} />);
    const photo = container.querySelector<HTMLImageElement>('img.group-hover\\:scale-110, img');
    expect(photo).not.toBeNull();
    expect(photo?.alt).toBe(unit.name);
  });
});
