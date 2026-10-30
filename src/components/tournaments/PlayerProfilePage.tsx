import Link from 'next/link';
import type { RatingRow, Tournament, TournamentPlayer } from '@/lib/tournament-types';
import { getPlayer, groupGames } from '@/lib/tournaments-registry';
import { getAllUnits } from '@/lib/encyclopedia-registry';
import { buildUnitIndex } from '@/lib/roster-links';
import CupBadges from './CupBadges';
import TacticalFrame, { TourChip } from './TacticalFrame';
import { CompositionText, FactionLabel } from './RosterLinks';

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

/** Ячейка сводки: моно-число на стальной рамке, у % — янтарная. */
function StatCell({
  label,
  value,
  amber,
  testId,
}: {
  label: string;
  value: string;
  amber?: boolean;
  testId?: string;
}) {
  return (
    <div className="border border-military-steel/40 px-3 py-2">
      <div className="font-ibm-mono text-[9px] uppercase tracking-[0.2em] text-military-taupe">
        {label}
      </div>
      <div
        data-testid={testId}
        className={`font-russo text-xl leading-tight mt-0.5 ${amber ? 'text-military-amber' : 'text-military-sand'}`}
      >
        {value}
      </div>
    </div>
  );
}

/** Профиль игрока: ачивки, сводка, история матчей, ростеры. */
export default function PlayerProfilePage({ player, rating, tournaments }: PlayerProfilePageProps) {
  const history = buildHistory(player, tournaments);
  const unitIdx = buildUnitIndex(getAllUnits());
  const rosters = tournaments.flatMap((t) => {
    return t.rosters
      .filter((r) => r.playerId === player.id)
      .map((roster) => ({ tournament: t, roster }));
  });

  return (
    <div className="min-h-screen bg-military-dark text-military-sand">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/tournaments"
          className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust hover:text-military-amber transition-colors no-underline inline-block min-h-[44px] leading-[44px]"
        >
          ← РЕЙТИНГ
        </Link>

        {/* Шапка-личная карточка на штриховке */}
        <TacticalFrame stripes className="mt-2 px-5 py-5 md:px-8 md:py-6">
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
              className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"
            >
              <StatCell label="игры" value={String(rating.games)} testId="stat-games" />
              <StatCell label="победы" value={String(rating.wins)} testId="stat-wins" />
              <StatCell label="% побед" value={`${rating.winRateDisplay}%`} amber testId="stat-winrate" />
              <StatCell label="турниров" value={String(rating.participations)} testId="stat-tournaments" />
            </div>
          )}
        </TacticalFrame>

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
                <span className="font-ibm-mono text-[10px] uppercase tracking-[0.15em] text-military-rust border border-military-rust/50 px-1 py-0.5">
                  ТУР {h.round}
                </span>
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
                <div key={i} className="border border-military-steel/40 bg-military-charcoal/40 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TourChip round={roster.round} />
                    <FactionLabel faction={roster.faction} />
                    {roster.points != null && (
                      <span className="font-ibm-mono text-xs text-military-sand">
                        {roster.points} очк.
                      </span>
                    )}
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      className="font-ibm-mono text-[10px] text-military-taupe hover:text-military-amber transition-colors no-underline ml-auto"
                    >
                      {tournament.name}
                    </Link>
                  </div>
                  <p className="font-ibm-mono text-xs text-military-taupe mt-1.5">
                    <CompositionText composition={roster.composition} unitIdx={unitIdx} />
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
