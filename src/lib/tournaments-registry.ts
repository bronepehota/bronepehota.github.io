/**
 * Tournaments Registry
 *
 * Централизованный доступ к турнирным данным (спека
 * 2026-10-30-tournaments-rating-design.md). Паттерн missions-registry:
 * compile-time JSON imports → типизированные массивы → accessor-функции.
 * Статический экспорт бандлит JSON на билде; обновление данных = PR.
 */
import playersJson from '@/data/tournaments/players.json';
import tournamentYuzhnyyUral from '@/data/tournaments/2026-10-yuzhnyy-ural-open.json';
import type {
  RatingRow,
  Tournament,
  TournamentMatch,
  TournamentPlayer,
} from './tournament-types';
import { computeRating } from './rating';

const players: TournamentPlayer[] = (playersJson as unknown as { players: TournamentPlayer[] }).players;

// Новый турнир = новый файл + строка в этом списке (как sources-registry).
const tournaments: Tournament[] = [tournamentYuzhnyyUral].map(
  (t) => t as unknown as Tournament,
);

export function getAllPlayers(): TournamentPlayer[] {
  return [...players];
}

export function getPlayer(id: string): TournamentPlayer | undefined {
  return players.find((p) => p.id === id);
}

/** Все турниры, по дате по убыванию (свежие сверху). */
export function getAllTournaments(): Tournament[] {
  return [...tournaments].sort((a, b) => b.date.localeCompare(a.date));
}

export function getTournament(id: string): Tournament | undefined {
  return tournaments.find((t) => t.id === id);
}

/** Турниры с участием игрока, по дате по убыванию. */
export function getPlayerTournaments(playerId: string): Tournament[] {
  return getAllTournaments().filter((t) => t.players.includes(playerId));
}

/** Глобальный рейтинг (см. src/lib/rating.ts). */
export function getRating(): RatingRow[] {
  return computeRating(players, tournaments);
}

/** Итоговые места турнира с игроками, по месту возрастанию. */
export function resolveResults(t: Tournament): Array<{ place: number; player: TournamentPlayer }> {
  return [...t.results]
    .sort((a, b) => a.place - b.place)
    .map((r) => {
      const player = getPlayer(r.playerId);
      return player ? { place: r.place, player } : null;
    })
    .filter((x): x is { place: number; player: TournamentPlayer } => x !== null);
}

/** Игра = пара строк протокола (round, table, пара игроков). p2: null — пропускная. */
export interface TournamentGame {
  round: number;
  table: number | null;
  p1: TournamentMatch;
  p2: TournamentMatch | null;
}

export function groupGames(matches: TournamentMatch[]): TournamentGame[] {
  const byKey = new Map<string, { p1: TournamentMatch; p2?: TournamentMatch }>();
  for (const m of matches) {
    const pair = [m.playerId, m.opponentId ?? ''].sort().join('|');
    const key = `${m.round}|${m.table}|${pair}`;
    const g = byKey.get(key);
    if (g) g.p2 = m;
    else byKey.set(key, { p1: m });
  }
  const games: TournamentGame[] = [];
  byKey.forEach((g) => {
    games.push({ round: g.p1.round, table: g.p1.table, p1: g.p1, p2: g.p2 ?? null });
  });
  return games.sort((a, b) => a.round - b.round || (a.table ?? 0) - (b.table ?? 0));
}
