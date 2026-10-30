import Link from 'next/link';
import type { RatingRow, Tournament, TournamentPlayer } from '@/lib/tournament-types';
import { getPlayer, groupGames } from '@/lib/tournaments-registry';
import CupBadges from './CupBadges';

interface PlayerProfilePageProps {
  player: TournamentPlayer;
  rating: RatingRow | undefined;
  tournaments: Tournament[];
}

interface HistoryEntry {
  tournament: Tournament;
  round: number;
  opponentNick: string;
  win: boolean;
  draw: boolean;
  modePoints: number;
  armyPoints: number;
}

/** История: игры игрока по всем турнирам (свежие турниры сверху). */
function buildHistory(player: TournamentPlayer, tournaments: Tournament[]): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  for (const t of tournaments) {
    const games = groupGames(t.matches).filter(
      (g) => g.p1.playerId === player.id || g.p2?.playerId === player.id,
    );
    for (const g of games) {
      const mine = g.p1.playerId === player.id ? g.p1 : g.p2!;
      const oppId = mine.playerId === g.p1.playerId ? g.p2?.playerId ?? null : g.p1.playerId;
      const draw = !!g.p2 && !g.p1.win && !g.p2.win;
      entries.push({
        tournament: t,
        round: g.round,
        opponentNick: oppId ? (getPlayer(oppId)?.nick ?? oppId) : '—',
        win: mine.win,
        draw,
        modePoints: mine.modePoints,
        armyPoints: mine.armyPoints,
      });
    }
  }
  return entries;
}

/** Профиль игрока: ачивки, сводка, история матчей, ростеры. */
export default function PlayerProfilePage({ player, rating, tournaments }: PlayerProfilePageProps) {
  const history = buildHistory(player, tournaments);
  const rosters = tournaments.flatMap((t) =>
    t.rosters
      .filter((r) => r.playerId === player.id)
      .map((r) => ({ tournament: t, roster: r })),
  );

  return (
    <div className="min-h-screen bg-military-dark text-military-sand">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/tournaments"
          className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust hover:text-military-amber transition-colors no-underline inline-block min-h-[44px] leading-[44px]"
        >
          ← РЕЙТИНГ
        </Link>

        <header className="mt-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              data-testid="profile-nick"
              className="font-russo text-2xl md:text-3xl uppercase tracking-wider"
            >
              {player.nick}
            </h1>
            {rating && (
              <CupBadges gold={rating.gold} silver={rating.silver} bronze={rating.bronze} />
            )}
          </div>
          {player.name && (
            <div className="font-ibm-mono text-xs text-military-taupe mt-1">{player.name}</div>
          )}
          {rating && (
            <div
              data-testid="profile-summary"
              className="font-ibm-mono text-xs text-military-taupe mt-2 flex flex-wrap gap-x-4 gap-y-1"
            >
              <span>игры: {rating.games}</span>
              <span>победы: {rating.wins}</span>
              <span className="text-military-amber">процент побед: {rating.winRateDisplay}%</span>
              <span>турниров: {rating.participations}</span>
            </div>
          )}
        </header>

        <section className="mt-8">
          <h2 className="font-russo uppercase tracking-wider text-lg">История матчей</h2>
          <div className="mt-3">
            {history.length === 0 && (
              <p className="font-ibm-mono text-xs text-military-taupe">Матчей пока нет.</p>
            )}
            {history.map((h, i) => (
              <div
                key={i}
                data-testid="history-row"
                className="flex items-baseline gap-3 flex-wrap border-b border-military-steel/20 py-2 font-ibm-mono text-xs min-h-[44px]"
              >
                <Link
                  href={`/tournaments/${h.tournament.id}`}
                  className="text-military-sand hover:text-military-amber transition-colors no-underline"
                >
                  {h.tournament.name}
                </Link>
                <span className="text-military-taupe">тур {h.round}</span>
                <span>vs {h.opponentNick}</span>
                <span
                  className={
                    h.win ? 'text-emerald-400' : h.draw ? 'text-military-taupe' : 'text-red-400'
                  }
                >
                  {h.win ? 'ПОБЕДА' : h.draw ? 'НИЧЬЯ' : 'ПОРАЖЕНИЕ'}
                </span>
                <span className="text-military-taupe ml-auto">
                  режим {h.modePoints} · армия {h.armyPoints}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8" data-testid="profile-participations">
          <h2 className="font-russo uppercase tracking-wider text-lg">Участие в турнирах</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] border border-military-steel/40 hover:border-military-amber/60 px-2 py-1.5 text-military-taupe hover:text-military-sand transition-colors no-underline"
              >
                {t.name} · {t.date.slice(0, 4)}
              </Link>
            ))}
          </div>
        </section>

        {rosters.length > 0 && (
          <section className="mt-8" data-testid="profile-rosters">
            <h2 className="font-russo uppercase tracking-wider text-lg">Ростеры</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {rosters.map(({ tournament, roster }, i) => (
                <div key={i} className="border border-military-steel/40 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-russo uppercase text-sm">{tournament.name}</span>
                    <span className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
                      {roster.faction}
                      {roster.points != null ? ` · ${roster.points}` : ''}
                    </span>
                  </div>
                  <p className="font-ibm-mono text-xs text-military-taupe mt-1.5">{roster.composition}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
