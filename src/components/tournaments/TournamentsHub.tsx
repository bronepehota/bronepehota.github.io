import Link from 'next/link';
import type { RatingRow, Tournament } from '@/lib/tournament-types';
import { resolveResults } from '@/lib/tournaments-registry';
import RatingTable from './RatingTable';

interface TournamentsHubProps {
  rating: RatingRow[];
  tournaments: Tournament[];
}

/** Хаб турнирного раздела: рейтинг игроков + список турниров. */
export default function TournamentsHub({ rating, tournaments }: TournamentsHubProps) {
  return (
    <div className="min-h-screen bg-military-dark text-military-sand">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header>
          <div
            data-testid="tournaments-title"
            className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust"
          >
            {'// ТУРНИРЫ'}
          </div>
          <h1 className="font-russo text-2xl md:text-3xl uppercase tracking-wider mt-1">
            Рейтинг игроков
          </h1>
          <p className="font-ibm-mono text-xs text-military-taupe mt-1">
            процент побед · при равенстве — больше партий
          </p>
        </header>

        <RatingTable rating={rating} />

        <section className="mt-10">
          <h2 className="font-russo uppercase tracking-wider text-lg">Турниры</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {tournaments.map((t) => {
              const winner = resolveResults(t)[0];
              return (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  data-testid="tournament-card"
                  className="block border border-military-steel/40 hover:border-military-amber/60 p-4 transition-colors no-underline text-military-sand min-h-[44px]"
                >
                  <div className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
                    {t.date}
                  </div>
                  <div className="font-russo uppercase text-base mt-1">{t.name}</div>
                  {winner && (
                    <div
                      data-testid="tournament-winner"
                      className="font-ibm-mono text-xs text-military-taupe mt-2"
                    >
                      🥇 {winner.player.nick}
                    </div>
                  )}
                  <div className="font-ibm-mono text-xs text-military-taupe">
                    {t.players.length} участников
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
