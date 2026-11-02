import { render, screen } from '@testing-library/react';
import TournamentDetailPage from '@/components/tournaments/TournamentDetailPage';
import { getTournament } from '@/lib/tournaments-registry';

/**
 * Шапка протокола — фидбек со-организатора (Денис Шнайдер, 2026-11-02):
 *  — метка правил «Звёздная Система (сообщ.)» читалась как сообщество-организатор
 *    → префикс «правила:»;
 *  — организаторов двое (равные), отдельной строкой;
 *  — организаторские сообщества — ссылки на VK.
 */
describe('TournamentDetailPage — шапка: организаторы и сообщества', () => {
  const tournament = getTournament('2026-10-yuzhnyy-ural-open')!;

  it('дата 25.10, «правила:», оба организатора, сообщества-ссылки', () => {
    render(<TournamentDetailPage tournament={tournament} />);

    expect(screen.getByText('2026-10-25')).toBeInTheDocument();
    expect(screen.getByText(/^правила:/)).toHaveTextContent('Звёздная Система (сообщ.)');
    expect(screen.getByText(/организаторы:/)).toHaveTextContent(
      'Андрей Андреев, Денис Шнайдер',
    );
    const ural = screen.getByRole('link', { name: 'Битвы Fantasy на Урале' });
    expect(ural).toHaveAttribute('href', 'https://vk.ru/battle_fantasy_ural');
    expect(ural).toHaveAttribute('target', '_blank');
    expect(
      screen.getByRole('link', { name: 'Студия Покраса Шнайдера' }),
    ).toHaveAttribute('href', 'https://vk.ru/shnayder_brush');
  });
});
