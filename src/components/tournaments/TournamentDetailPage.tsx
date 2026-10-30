import Link from 'next/link';
import type { Tournament } from '@/lib/tournament-types';
import { groupGames, getPlayer, resolveResults } from '@/lib/tournaments-registry';
import CupBadges from './CupBadges';

const RULE_LABELS: Record<string, string> = {
  tehnolog: 'Технолог',
  community_star_system: 'Звёздная Система (сообщ.)',
};

const FORMAT_LABELS: Record<string, string> = {
  swiss: 'швейцарская система',
  round_robin: 'круговая система',
};

function nickOf(id: string | null): string {
  if (!id) return '—';
  return getPlayer(id)?.nick ?? id;
}

/** Протокол турнира: места с кубками, игры по турам, ростеры. */
export default function TournamentDetailPage({ tournament }: { tournament: Tournament }) {
  const results = resolveResults(tournament);
  const rounds = Array.from(new Set(tournament.matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-military-dark text-military-sand">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/tournaments"
          className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust hover:text-military-amber transition-colors no-underline inline-block min-h-[44px] leading-[44px]"
        >
          ← ТУРНИРЫ
        </Link>
        <header className="mt-2">
          <div className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust">
            {tournament.date}
          </div>
          <h1
            data-testid="tournament-title"
            className="font-russo text-2xl md:text-3xl uppercase tracking-wider mt-1"
          >
            {tournament.name}
          </h1>
          <div className="font-ibm-mono text-xs text-military-taupe mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span>{RULE_LABELS[tournament.rulesVersion] ?? tournament.rulesVersion}</span>
            <span>{tournament.rosterPoints} очков</span>
            <span>{FORMAT_LABELS[tournament.format] ?? tournament.format}</span>
            {tournament.organizers.length > 0 && <span>организатор: {tournament.organizers.join(', ')}</span>}
          </div>
        </header>

        <section className="mt-8">
          <h2 className="font-russo uppercase tracking-wider text-lg">Итоги</h2>
          <ol className="mt-3">
            {results.map(({ place, player }) => (
              <li
                key={player.id}
                data-testid="place-row"
                className="flex items-center gap-3 border-b border-military-steel/20 py-1"
              >
                <span className="font-ibm-mono text-sm text-military-taupe w-6 text-right">{place}</span>
                <Link
                  href={`/players/${player.id}`}
                  className="font-russo uppercase text-sm text-military-sand hover:text-military-amber transition-colors min-h-[44px] inline-flex items-center"
                >
                  {player.nick}
                </Link>
                {player.name && (
                  <span className="font-ibm-mono text-xs text-military-taupe hidden sm:inline">
                    {player.name}
                  </span>
                )}
                <CupBadges
                  gold={place === 1 ? 1 : 0}
                  silver={place === 2 ? 1 : 0}
                  bronze={place === 3 ? 1 : 0}
                  className="ml-auto"
                />
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8" data-testid="tournament-rounds">
          <h2 className="font-russo uppercase tracking-wider text-lg">Туры</h2>
          {/* Десктоп: туры в ряд (как сетка СТОЛ 1–5 в протоколе); мобила: стек */}
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {rounds.map((round) => (
              <div
                key={round}
                data-testid="round-card"
                className="border border-military-steel/40 p-3"
              >
                <div className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
                  ТУР {round}
                </div>
                <div className="mt-2 space-y-2">
                  {groupGames(tournament.matches.filter((m) => m.round === round)).map((g) => (
                    <div key={`${g.table}-${g.p1.playerId}`} data-testid="game-row" className="font-ibm-mono text-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-military-taupe shrink-0">стол {g.table ?? '—'}</span>
                        <span className="text-right">
                          <span className={g.p1.win ? 'text-military-amber' : ''}>{nickOf(g.p1.playerId)}</span>
                          {' — '}
                          <span className={g.p2?.win ? 'text-military-amber' : ''}>{nickOf(g.p2?.playerId ?? null)}</span>
                        </span>
                      </div>
                      <div className="text-military-taupe text-[10px] text-right">
                        режим {g.p1.modePoints}:{g.p2?.modePoints ?? '—'} · армия {g.p1.armyPoints}:{g.p2?.armyPoints ?? '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8" data-testid="tournament-rosters">
          <h2 className="font-russo uppercase tracking-wider text-lg">Ростеры</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {tournament.rosters.map((r, i) => (
              <div key={i} data-testid="roster-item" className="border border-military-steel/40 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-russo uppercase text-sm">{nickOf(r.playerId)}</span>
                  <span className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
                    {r.faction}
                    {r.points != null ? ` · ${r.points}` : ''}
                  </span>
                </div>
                <p className="font-ibm-mono text-xs text-military-taupe mt-1.5">{r.composition}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
