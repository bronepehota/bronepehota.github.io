import {
  getAllPlayers,
  getPlayer,
  getAllTournaments,
  getTournament,
  getPlayerTournaments,
  getRating,
  resolveResults,
  groupGames,
} from '@/lib/tournaments-registry';

describe('tournaments-registry: игроки', () => {
  it('8 игроков сида, id уникальны, у каждого ник', () => {
    const all = getAllPlayers();
    expect(all).toHaveLength(8);
    expect(new Set(all.map((p) => p.id)).size).toBe(8);
    for (const p of all) expect(p.nick).toBeTruthy();
  });

  it('getPlayer: hit и miss', () => {
    expect(getPlayer('shnayder')?.nick).toBe('Шнайдер');
    expect(getPlayer('nonexistent')).toBeUndefined();
  });
});

describe('tournaments-registry: турниры', () => {
  it('сид: один турнир, поля заполнены', () => {
    const all = getAllTournaments();
    expect(all).toHaveLength(1);
    const t = all[0];
    expect(t.id).toBe('2026-10-yuzhnyy-ural-open');
    expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(t.rosterPoints).toBe(700);
    expect(t.rounds).toBe(3);
  });

  it('getAllTournaments сортирует по дате по убыванию', () => {
    const all = getAllTournaments();
    for (let i = 1; i < all.length; i++) {
      expect(all[i - 1].date >= all[i].date).toBe(true);
    }
  });

  it('getTournament: hit и miss (не бросает)', () => {
    expect(getTournament('2026-10-yuzhnyy-ural-open')).toBeDefined();
    expect(getTournament('nope')).toBeUndefined();
  });

  it('целостность сида: места 1-8 уникальны, ссылки матчей на участников, ровно одна победа на игру', () => {
    const t = getTournament('2026-10-yuzhnyy-ural-open')!;
    const ids = new Set(t.players);
    expect(t.results.map((r) => r.place).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const r of t.results) expect(ids.has(r.playerId)).toBe(true);
    expect(t.matches).toHaveLength(24); // 8 игроков × 3 тура
    for (const m of t.matches) {
      expect(ids.has(m.playerId)).toBe(true);
      if (m.opponentId) expect(ids.has(m.opponentId)).toBe(true);
    }
    // каждая сыгранная пара в туре имеет ровно одну победу (ничья = 0/0 недопустима в сидe)
    const games = groupGames(t.matches);
    expect(games).toHaveLength(12); // 4 игры × 3 тура
    for (const g of games) {
      const wins = (g.p1.win ? 1 : 0) + (g.p2 ? (g.p2.win ? 1 : 0) : 0);
      expect(wins).toBe(1);
    }
  });

  it('getPlayerTournaments и resolveResults', () => {
    expect(getPlayerTournaments('shnayder')).toHaveLength(1);
    expect(getPlayerTournaments('nonexistent')).toHaveLength(0);
    const t = getTournament('2026-10-yuzhnyy-ural-open')!;
    const results = resolveResults(t);
    expect(results).toHaveLength(8);
    expect(results[0].place).toBe(1);
    expect(results[0].player.nick).toBe('Семён');
  });
});

describe('tournaments-registry: рейтинг по сиду', () => {
  it('порядок: Семён 100%, четвёрка 66,7% по никам, Ахе, замыкают Андрей/Эдик', () => {
    const rows = getRating();
    expect(rows.map((r) => r.player.nick)).toEqual([
      'Семён',
      'Валера',
      'Костя',
      'Павел',
      'Шнайдер',
      'Ахе',
      'Андрей',
      'Эдик',
    ]);
    expect(rows[0].winRateDisplay).toBe('100');
    expect(rows[1].winRateDisplay).toBe('66,7');
    expect(rows[0].gold).toBe(1);
    expect(rows[1].bronze).toBe(1); // Валера — 3-е место
    expect(rows[3].silver).toBe(1); // Павел — 2-е место
    expect(rows[4].games).toBe(3); // Шнайдер
    expect(rows[4].wins).toBe(2);
  });
});
