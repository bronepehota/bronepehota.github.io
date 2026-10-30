import { computeRating, formatWinRate } from '@/lib/rating';
import type { Tournament, TournamentPlayer } from '@/lib/tournament-types';

const P = (id: string, nick: string): TournamentPlayer => ({ id, nick });

function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1',
    name: 'T1',
    date: '2026-10-15',
    rulesVersion: 'community_star_system',
    rosterPoints: 700,
    format: 'swiss',
    rounds: 1,
    organizers: [],
    players: ['a', 'b'],
    results: [],
    matches: [],
    rosters: [],
    ...overrides,
  };
}

describe('formatWinRate', () => {
  it('целые проценты — без дробной части', () => {
    expect(formatWinRate(0)).toBe('0');
    expect(formatWinRate(1)).toBe('100');
  });
  it('дробные — один знак, запятая', () => {
    expect(formatWinRate(2 / 3)).toBe('66,7');
    expect(formatWinRate(1 / 3)).toBe('33,3');
    expect(formatWinRate(1 / 6)).toBe('16,7');
  });
});

describe('computeRating', () => {
  it('пустые данные — пустой рейтинг', () => {
    expect(computeRating([], [])).toEqual([]);
  });

  it('считает игры, победы и процент', () => {
    const t = makeTournament({
      matches: [
        { round: 1, table: 1, playerId: 'a', opponentId: 'b', win: true, modePoints: 1, armyPoints: 10 },
        { round: 1, table: 1, playerId: 'b', opponentId: 'a', win: false, modePoints: 0, armyPoints: 5 },
        { round: 2, table: 1, playerId: 'a', opponentId: 'b', win: false, modePoints: 2, armyPoints: 7 },
        { round: 2, table: 1, playerId: 'b', opponentId: 'a', win: false, modePoints: 2, armyPoints: 7 },
      ],
    });
    const rows = computeRating([P('a', 'Аня'), P('b', 'Боря')], [t]);
    const a = rows.find((r) => r.player.id === 'a')!;
    const b = rows.find((r) => r.player.id === 'b')!;
    expect(a.games).toBe(2);
    expect(a.wins).toBe(1);
    expect(a.winRate).toBeCloseTo(0.5);
    expect(b.games).toBe(2);
    expect(b.wins).toBe(0); // ничья — игра, но не победа
  });

  it('игрок с 0 игр не попадает в рейтинг', () => {
    const t = makeTournament({ players: ['a', 'b'], matches: [] });
    const rows = computeRating([P('a', 'Аня'), P('b', 'Боря')], [t]);
    expect(rows).toHaveLength(0);
  });

  it('сортировка: процент ↓, при равенстве больше игр выше', () => {
    const t1 = makeTournament({
      id: 't1',
      players: ['a', 'b', 'c'],
      matches: [
        { round: 1, table: 1, playerId: 'a', opponentId: 'c', win: true, modePoints: 0, armyPoints: 0 },
        { round: 1, table: 1, playerId: 'c', opponentId: 'a', win: false, modePoints: 0, armyPoints: 0 },
        { round: 2, table: 1, playerId: 'b', opponentId: 'c', win: true, modePoints: 0, armyPoints: 0 },
        { round: 2, table: 1, playerId: 'c', opponentId: 'b', win: false, modePoints: 0, armyPoints: 0 },
      ],
    });
    const t2 = makeTournament({
      id: 't2',
      players: ['b', 'c'],
      matches: [
        { round: 1, table: 1, playerId: 'b', opponentId: 'c', win: true, modePoints: 0, armyPoints: 0 },
        { round: 1, table: 1, playerId: 'c', opponentId: 'b', win: false, modePoints: 0, armyPoints: 0 },
      ],
    });
    // b: 2/2 = 100% (2 партии); a: 1/1 = 100% (1 партия); c: 0/3 = 0%.
    // Равный процент → больше игр выше: b перед a.
    const rows = computeRating([P('a', 'Аня'), P('b', 'Боря'), P('c', 'Вера')], [t1, t2]);
    expect(rows.map((r) => r.player.id)).toEqual(['b', 'a', 'c']);
  });

  it('при равном проценте и играх — ник по алфавиту (ru)', () => {
    const t = makeTournament({
      players: ['x', 'y'],
      matches: [
        { round: 1, table: 1, playerId: 'x', opponentId: 'y', win: false, modePoints: 0, armyPoints: 0 },
        { round: 1, table: 1, playerId: 'y', opponentId: 'x', win: false, modePoints: 0, armyPoints: 0 },
      ],
    });
    const rows = computeRating([P('x', 'Эдик'), P('y', 'Андрей')], [t]);
    expect(rows.map((r) => r.player.nick)).toEqual(['Андрей', 'Эдик']);
  });

  it('после игр тайбрейк — суммарные очки режима', () => {
    const t = makeTournament({
      players: ['a', 'b', 'c'],
      matches: [
        { round: 1, table: 1, playerId: 'a', opponentId: 'b', win: true, modePoints: 2, armyPoints: 100 },
        { round: 1, table: 1, playerId: 'b', opponentId: 'a', win: false, modePoints: 5, armyPoints: 50 },
        { round: 2, table: 1, playerId: 'a', opponentId: 'b', win: false, modePoints: 2, armyPoints: 100 },
        { round: 2, table: 1, playerId: 'b', opponentId: 'a', win: true, modePoints: 5, armyPoints: 50 },
        { round: 1, table: 2, playerId: 'c', opponentId: 'a', win: false, modePoints: 9, armyPoints: 900 },
      ],
    });
    // a и b: по 50% из 2 игр; режим: b 10 > a 4 → b выше (армия не важна пока режим разный)
    const rows = computeRating([P('a', 'Аня'), P('b', 'Боря'), P('c', 'Вера')], [t]);
    expect(rows.map((r) => r.player.id)).toEqual(['b', 'a', 'c']);
  });

  it('при равных очках режима — суммарные очки армии', () => {
    const t = makeTournament({
      players: ['a', 'b'],
      matches: [
        { round: 1, table: 1, playerId: 'a', opponentId: 'b', win: false, modePoints: 3, armyPoints: 200 },
        { round: 1, table: 1, playerId: 'b', opponentId: 'a', win: true, modePoints: 3, armyPoints: 100 },
        { round: 2, table: 1, playerId: 'a', opponentId: 'b', win: true, modePoints: 3, armyPoints: 200 },
        { round: 2, table: 1, playerId: 'b', opponentId: 'a', win: false, modePoints: 3, armyPoints: 200 },
      ],
    });
    // оба 1/2 (50%), режим по 6; армия: a 400 > b 300 → a выше,
    // хотя по нику ('Аня' у b) алфавит дал бы обратный порядок
    const rows = computeRating([P('a', 'Боря'), P('b', 'Аня')], [t]);
    expect(rows.map((r) => r.player.id)).toEqual(['a', 'b']);
  });

  it('кубки из мест 1-3 и участия считаются по всем турнирам', () => {
    const res = (place: number, playerId: string) => ({ place, playerId });
    const baseMatches = [
      { round: 1, table: 1, playerId: 'a', opponentId: 'b', win: true, modePoints: 0, armyPoints: 0 },
      { round: 1, table: 1, playerId: 'b', opponentId: 'a', win: false, modePoints: 0, armyPoints: 0 },
    ];
    const t1 = makeTournament({ id: 't1', players: ['a', 'b'], results: [res(1, 'a'), res(2, 'b')], matches: baseMatches });
    const t2 = makeTournament({ id: 't2', players: ['a', 'b'], results: [res(3, 'a'), res(1, 'b')], matches: baseMatches });
    const rows = computeRating([P('a', 'Аня'), P('b', 'Боря')], [t1, t2]);
    const a = rows.find((r) => r.player.id === 'a')!;
    const b = rows.find((r) => r.player.id === 'b')!;
    // a: золото (t1) + бронза (t2); b: серебро (t1) + золото (t2)
    expect(a.gold).toBe(1);
    expect(a.silver).toBe(0);
    expect(a.bronze).toBe(1);
    expect(b.gold).toBe(1);
    expect(b.silver).toBe(1);
    expect(a.participations).toBe(2);
    expect(b.participations).toBe(2);
  });

  it('неизвестный playerId в матче мягко пропускается', () => {
    const t = makeTournament({
      matches: [
        { round: 1, table: 1, playerId: 'ghost', opponentId: 'a', win: true, modePoints: 0, armyPoints: 0 },
      ],
    });
    expect(computeRating([P('a', 'Аня')], [t])).toHaveLength(0);
  });
});
