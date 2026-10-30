/**
 * Логика рейтинга игроков (чистая, без обращений к данным).
 * Правило Дениса: сортировка по проценту побед; при равном проценте —
 * больше отыгранных партий выше; финальный тайбрейк — ник (детерминизм).
 */
import type { RatingRow, Tournament, TournamentPlayer } from './tournament-types';

/** '0' / '100' / '66,7' — целые без дробной части, иначе один знак и запятая. */
export function formatWinRate(rate: number): string {
  const rounded = Math.round(rate * 1000) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
}

interface PlayerStats {
  games: number;
  wins: number;
  modePoints: number;
  armyPoints: number;
  gold: number;
  silver: number;
  bronze: number;
  participations: number;
}

/**
 * Рейтинг по всем турнирам. Игроки с 0 игр не попадают (профиль появляется
 * с первой игры). Неизвестные playerId в данных мягко пропускаются —
 * валидация реестра мягкая, в духе missions-registry.
 */
export function computeRating(players: TournamentPlayer[], tournaments: Tournament[]): RatingRow[] {
  const byId = new Map(players.map((p) => [p.id, p]));
  const stats = new Map<string, PlayerStats>();
  const ensure = (id: string): PlayerStats => {
    let s = stats.get(id);
    if (!s) {
      s = { games: 0, wins: 0, modePoints: 0, armyPoints: 0, gold: 0, silver: 0, bronze: 0, participations: 0 };
      stats.set(id, s);
    }
    return s;
  };

  for (const t of tournaments) {
    for (const pid of t.players) ensure(pid).participations += 1;
    for (const m of t.matches) {
      // строки протокола построчные: каждый playerId учитывает свою игру
      const s = ensure(m.playerId);
      s.games += 1;
      if (m.win) s.wins += 1;
      s.modePoints += m.modePoints;
      s.armyPoints += m.armyPoints;
    }
    for (const r of t.results) {
      const s = ensure(r.playerId);
      if (r.place === 1) s.gold += 1;
      else if (r.place === 2) s.silver += 1;
      else if (r.place === 3) s.bronze += 1;
    }
  }

  const rows: RatingRow[] = [];
  // forEach вместо for-of по Map: tsconfig target es5 без downlevelIteration.
  stats.forEach((s, pid) => {
    const player = byId.get(pid);
    if (!player || s.games === 0) return;
    const winRate = s.wins / s.games;
    rows.push({
      player,
      games: s.games,
      wins: s.wins,
      winRate,
      winRateDisplay: formatWinRate(winRate),
      modePoints: s.modePoints,
      armyPoints: s.armyPoints,
      gold: s.gold,
      silver: s.silver,
      bronze: s.bronze,
      participations: s.participations,
    });
  });

  // Формула (уточнена владельцем 2026-10-30): % ↓ → партии ↓ → очки режима ↓
  // → очки армии ↓ → ник. С одним турниром рейтинг совпадает с подиумом.
  rows.sort(
    (a, b) =>
      b.winRate - a.winRate ||
      b.games - a.games ||
      b.modePoints - a.modePoints ||
      b.armyPoints - a.armyPoints ||
      a.player.nick.localeCompare(b.player.nick, 'ru'),
  );
  return rows;
}
