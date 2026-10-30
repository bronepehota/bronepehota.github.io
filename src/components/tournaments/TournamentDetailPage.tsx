import Link from 'next/link';
import type { Tournament, TournamentPlayer, TournamentRoster } from '@/lib/tournament-types';
import { groupGames, getPlayer, resolveResults } from '@/lib/tournaments-registry';
import CupBadges from './CupBadges';
import TacticalFrame, { RoundChip } from './TacticalFrame';

const RULE_LABELS: Record<string, string> = {
  tehnolog: 'Технолог',
  community_star_system: 'Звёздная Система (сообщ.)',
};

const FORMAT_LABELS: Record<string, string> = {
  swiss: 'швейцарская система',
  round_robin: 'круговая система',
};

const PLACE_RAIL: Record<number, string> = {
  1: 'border-l-2 border-l-amber-400',
  2: 'border-l-2 border-l-slate-300',
  3: 'border-l-2 border-l-amber-700',
};

function nickOf(id: string | null): string {
  if (!id) return '—';
  return getPlayer(id)?.nick ?? id;
}

/** Ростеры, сгруппированные по игроку (в порядке итоговых мест; игроки без
 *  места — в конце). Прямой ответ на «у кого какой лист и в каком туре». */
function groupRostersByPlayer(tournament: Tournament): Array<{
  player: TournamentPlayer | null;
  rosters: TournamentRoster[];
}> {
  const byPlayer = new Map<string, TournamentRoster[]>();
  for (const r of tournament.rosters) {
    const list = byPlayer.get(r.playerId);
    if (list) list.push(r);
    else byPlayer.set(r.playerId, [r]);
  }
  const ordered: Array<{ player: TournamentPlayer | null; rosters: TournamentRoster[] }> = [];
  for (const { player } of resolveResults(tournament)) {
    const rosters = byPlayer.get(player.id);
    if (rosters) {
      ordered.push({ player, rosters });
      byPlayer.delete(player.id);
    }
  }
  // Игроки вне итоговой ведомости (мягкая валидация) — в конце, по порядку данных.
  // forEach, не for-of: tsconfig es5 без downlevelIteration (см. src/lib/rating.ts).
  byPlayer.forEach((rosters, playerId) => {
    ordered.push({ player: getPlayer(playerId) ?? null, rosters });
  });
  return ordered;
}

/** Протокол турнира: места с кубками, игры по турам, ростеры по игрокам. */
export default function TournamentDetailPage({ tournament }: { tournament: Tournament }) {
  const results = resolveResults(tournament);
  const rounds = Array.from(new Set(tournament.matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-military-dark text-military-sand">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/tournaments"
          className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust hover:text-military-amber transition-colors no-underline inline-block min-h-[44px] leading-[44px]"
        >
          ← ТУРНИРЫ
        </Link>

        {/* Шапка-штамп на штриховке */}
        <TacticalFrame stripes className="mt-2 px-5 py-5 md:px-8 md:py-6">
          <div className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust">
            {tournament.date}
          </div>
          <h1
            data-testid="tournament-title"
            className="font-russo text-2xl md:text-3xl uppercase tracking-wider mt-1"
          >
            {tournament.name}
          </h1>
          <div className="font-ibm-mono text-xs text-military-taupe mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <span>{RULE_LABELS[tournament.rulesVersion] ?? tournament.rulesVersion}</span>
            <span>{tournament.rosterPoints} очков</span>
            <span>{FORMAT_LABELS[tournament.format] ?? tournament.format}</span>
            {tournament.organizers.length > 0 && (
              <span>организатор: {tournament.organizers.join(', ')}</span>
            )}
          </div>
        </TacticalFrame>

        <section className="mt-8">
          <h2 className="font-russo uppercase tracking-wider text-lg">Итоги</h2>
          <ol className="mt-3">
            {results.map(({ place, player }) => (
              <li
                key={player.id}
                data-testid="place-row"
                className={`flex items-center gap-3 border-b border-military-steel/20 py-1 ${PLACE_RAIL[place] ?? ''}`}
              >
                <span
                  className={`font-russo text-lg leading-none w-8 text-right ${
                    place <= 3 ? 'text-military-amber' : 'text-military-taupe/70'
                  }`}
                >
                  {place}
                </span>
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
                className="border border-military-steel/40 bg-military-charcoal/40 p-3"
              >
                <div className="flex items-baseline gap-2 border-b border-military-steel/30 pb-2">
                  <span className="font-russo text-xl leading-none text-military-amber">
                    {String(round).padStart(2, '0')}
                  </span>
                  <span className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
                    ТУР
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {groupGames(tournament.matches.filter((m) => m.round === round)).map((g) => (
                    <div
                      key={`${g.table}-${g.p1.playerId}`}
                      data-testid="game-row"
                      className="font-ibm-mono text-xs"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-military-taupe shrink-0">стол {g.table ?? '—'}</span>
                        <span className="text-right">
                          <span className={g.p1.win ? 'text-military-amber' : ''}>
                            {nickOf(g.p1.playerId)}
                          </span>
                          {' — '}
                          <span className={g.p2?.win ? 'text-military-amber' : ''}>
                            {nickOf(g.p2?.playerId ?? null)}
                          </span>
                        </span>
                      </div>
                      <div className="text-military-taupe text-[10px] text-right">
                        режим {g.p1.modePoints}:{g.p2?.modePoints ?? '—'} · армия{' '}
                        {g.p1.armyPoints}:{g.p2?.armyPoints ?? '—'}
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
          <p className="font-ibm-mono text-[10px] text-military-taupe mt-1">
            листы игроков; метка показывает тур («ВСЕ ТУРЫ» — заявлен на турнир)
          </p>
          <div className="mt-3 space-y-4">
            {groupRostersByPlayer(tournament).map(({ player, rosters }, i) => (
              <div
                key={player?.id ?? `unknown-${i}`}
                data-testid="roster-player"
                className={`border border-military-steel/40 bg-military-charcoal/40 ${PLACE_RAIL[rosters[0] ? placeOf(results, player?.id) : 0] ?? ''}`}
              >
                <div className="flex items-center gap-3 px-3 py-2 border-b border-military-steel/30">
                  {player ? (
                    <>
                      <span className="font-russo uppercase text-sm text-military-sand">
                        {player.nick}
                      </span>
                      <span className="font-ibm-mono text-[10px] text-military-taupe">
                        {placeOf(results, player.id)}-е место
                      </span>
                    </>
                  ) : (
                    <span className="font-russo uppercase text-sm text-military-taupe">
                      {rosters[0]?.playerId}
                    </span>
                  )}
                  <CupBadges
                    gold={placeOf(results, player?.id) === 1 ? 1 : 0}
                    silver={placeOf(results, player?.id) === 2 ? 1 : 0}
                    bronze={placeOf(results, player?.id) === 3 ? 1 : 0}
                    className="ml-auto"
                  />
                </div>
                <div className="divide-y divide-military-steel/20">
                  {rosters.map((r, j) => (
                    <div key={j} data-testid="roster-item" className="px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <RoundChip round={r.round} />
                        <span className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
                          {r.faction}
                        </span>
                        {r.points != null && (
                          <span className="font-ibm-mono text-xs text-military-sand">
                            {r.points} очк.
                          </span>
                        )}
                      </div>
                      <p className="font-ibm-mono text-xs text-military-taupe mt-1">{r.composition}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Место игрока в итоговой ведомости (0 — вне ведомости). */
function placeOf(
  results: Array<{ place: number; player: TournamentPlayer }>,
  playerId?: string,
): number {
  if (!playerId) return 0;
  return results.find((r) => r.player.id === playerId)?.place ?? 0;
}
