// src/__tests__/components/FactionsListPage.test.tsx
import { render, screen } from '@testing-library/react';
import FactionsListPage from '@/components/encyclopedia/FactionsListPage';
import { getFactions } from '@/lib/encyclopedia-registry';

// EncyclopediaTabs читает usePathname — вне Next-роутера он null (jsdom).
jest.mock('next/navigation', () => ({
  usePathname: (): string => '/encyclopedia/factions',
}));

describe('FactionsListPage — мост в приложение', () => {
  it('на карточке фракции есть «Собрать армию» с deep-link', () => {
    render(<FactionsListPage factions={getFactions()} />);
    const links = screen.getAllByTestId('faction-build-army-link');
    expect(links.length).toBeGreaterThanOrEqual(5);
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/app?faction=polaris');
    expect(hrefs).toContain('/app?faction=dead_fleet');
  });
});
