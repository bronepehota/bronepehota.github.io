import Link from 'next/link';
import type { RatingRow, Tournament } from '@/lib/tournament-types';
import { resolveResults } from '@/lib/tournaments-registry';
import RatingTable from './RatingTable';
import TacticalFrame from './TacticalFrame';

interface TournamentsHubProps {
  rating: RatingRow[];
  tournaments: Tournament[];
}

/** Хаб турнирного раздела: ведомость рейтинга + карта турниров. */
export default function TournamentsHub({ rating, tournaments }: TournamentsHubProps) {
  return (
    <div className="min-h-screen bg-military-dark text-military-sand">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Шапка-ведомость: тактическая рамка на штриховке */}
        <TacticalFrame stripes className="px-5 py-5 md:px-8 md:py-6">
          <div
            data-testid="tournaments-title"
            className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust"
          >
            {'// ТУРНИРЫ'}
          </div>
          <h1 className="font-russo text-2xl md:text-3xl uppercase tracking-wider mt-1">
            Рейтинг игроков
          </h1>
          <p className="font-ibm-mono text-xs text-military-taupe mt-2">
            процент побед · при равенстве — больше партий
          </p>
        </TacticalFrame>

        <RatingTable rating={rating} />

        <section className="mt-12">
          <div className="military-divider" />
          <h2 className="font-russo uppercase tracking-wider text-lg mt-6">Турниры</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {tournaments.map((t) => {
              const winner = resolveResults(t)[0];
              return (
                <TacticalFrame key={t.id} className="h-full">
                  <Link
                    href={`/tournaments/${t.id}`}
                    data-testid="tournament-card"
                    className="block p-4 no-underline text-military-sand min-h-[44px] group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
                        {t.date}
                      </span>
                      <span className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-taupe">
                        {t.players.length} уч.
                      </span>
                    </div>
                    <div className="font-russo uppercase text-base mt-2 group-hover:text-military-amber transition-colors">
                      {t.name}
                    </div>
                    {winner && (
                      <div
                        data-testid="tournament-winner"
                        className="font-ibm-mono text-xs text-military-taupe mt-3 pt-2 border-t border-military-steel/30"
                      >
                        <span className="text-amber-400">🥇</span> {winner.player.nick}
                      </div>
                    )}
                  </Link>
                </TacticalFrame>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
