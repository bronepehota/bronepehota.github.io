/**
 * Типы турнирного раздела (спека 2026-10-30-tournaments-rating-design.md).
 * Данные — JSON в src/data/tournaments/, транскрипция протоколов 1:1.
 */

/** Игрок рейтинга. name/vkUrl/region опциональны: отсутствие поля или null = «нет данных». */
export interface TournamentPlayer {
  id: string;
  nick: string;
  name?: string | null;
  vkUrl?: string | null;
  region?: string | null;
}

export interface TournamentResultRow {
  place: number;
  playerId: string;
}

/**
 * Строка протокола: ИГРОК × ТУР (как в эксельке — построчно на игрока).
 * Игра восстанавливается группировкой по (round, table, пара игроков).
 * Ничья = обе строки пары win:false. opponentId: null = техническая пропускная.
 */
export interface TournamentMatch {
  round: number;
  table: number | null;
  playerId: string;
  opponentId: string | null;
  win: boolean;
  modePoints: number;
  armyPoints: number;
}

/** Армлист игрока. round: null = список на турнир без привязки к туру.
 *  faction — свободная строка протокола («ИМПЕРИЯ», «Волки»), НЕ FactionID.
 *  points: null = в протоколе очки не указаны. */
export interface TournamentRoster {
  playerId: string;
  round: number | null;
  faction: string;
  points: number | null;
  composition: string;
}

export interface Tournament {
  id: string; // 'YYYY-MM-<slug>'
  name: string;
  date: string; // ISO YYYY-MM-DD
  region?: string | null;
  rulesVersion: string; // 'tehnolog' | 'community_star_system' (мягкая валидация)
  rosterPoints: number;
  format: string; // 'swiss' | 'round_robin' | ...
  rounds: number;
  organizers: string[];
  players: string[]; // playerId участников
  results: TournamentResultRow[];
  matches: TournamentMatch[];
  rosters: TournamentRoster[];
}

/** Строка рейтинга (см. src/lib/rating.ts). */
export interface RatingRow {
  player: TournamentPlayer;
  games: number;
  wins: number;
  winRate: number; // точная дробь [0..1] — по ней сортировка
  winRateDisplay: string; // '66,7' / '100' — отображение
  modePoints: number; // суммарные очки режима — 3-й уровень тайбрейка
  armyPoints: number; // суммарные очки армии — 4-й уровень тайбрейка
  gold: number;
  silver: number;
  bronze: number;
  participations: number;
}
