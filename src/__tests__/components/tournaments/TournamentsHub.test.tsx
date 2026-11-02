import { render, screen } from '@testing-library/react';
import TournamentsHub from '@/components/tournaments/TournamentsHub';
import { getAllTournaments } from '@/lib/tournaments-registry';

describe('TournamentsHub — вход для организаторов', () => {
  it('ссылка в шапке ведёт на /tournaments/organizers', () => {
    render(<TournamentsHub rating={[]} tournaments={getAllTournaments()} />);
    expect(screen.getByTestId('organizers-guide-link')).toHaveAttribute(
      'href',
      '/tournaments/organizers',
    );
  });
});
