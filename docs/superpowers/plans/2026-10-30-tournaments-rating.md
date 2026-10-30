# Турниры и рейтинг — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Раздел турнирной статистики: рейтинг игроков (win% → больше игр → ник), страницы турниров и профили с ачивками (кубки/участие), данные из JSON в репо.

**Architecture:** Полностью статически, без бэкенда: JSON-данные в `src/data/tournaments/` → реестр `tournaments-registry.ts` (паттерн `missions-registry.ts`) → чистая логика `rating.ts` → статические страницы (`generateStaticParams`). Обновление данных = PR с JSON.

**Tech Stack:** Next.js 14 App Router (static export), TypeScript, Tailwind (военное досье-токены), Jest + Playwright.

**Spec:** `docs/superpowers/specs/2026-10-30-tournaments-rating-design.md` (аргументируется спекой — исполнитель читает обе)

**Ветка:** `feat/tournaments-rating` (создана, спека закоммичена `0b825b6`)

## Global Constraints

- **Статический экспорт**: реестры синхронные (JSON импортируется на билде); динамические маршруты — `generateStaticParams`; canonical через `absoluteUrl()` из `@/lib/seo`; OG через `pageOpenGraph({ title, description, path })` (голый `{title, description}` ЗАМЕНИТ layout-карточку OG — см. комментарий в `src/app/encyclopedia/missions/page.tsx`).
- **Досье-стиль** (референсы `ArchiveHub.tsx`, `CTAButton.tsx`): `font-russo` — заголовки, `font-ibm-mono` — данные/лейблы, палитра `military-*` (rust/amber/sand/steel/taupe/dark), квадратные рамки (никаких `rounded-`), телеграф-лейблы `{'// ЛЕЙБЛ'}` — строковые литералы в фигурных скобках, иначе ошибка `react/jsx-no-comment-textnodes`. Утилита классов — `cn` из `@/lib/utils`.
- **Десктоп равноправен с мобилой** (правка владельца): макет от широкого экрана (`md:`), полностью рабочий на 320px. Интерактивные строки — тап-зона ≥44px (`min-h-[44px]`).
- **Тайбрейк рейтинга**: winRate ↓ → games ↓ → `a.player.nick.localeCompare(b.player.nick, 'ru')` ↑.
- **Данные**: транскрипция протокола 1:1 (фракции ростеров — свободные строки протокола, НЕ `FactionID`). Provisional-поля сида (`name`/`date`/`rulesVersion`) — подтвердить у владельца перед merge, перечислить в описании PR.
- **Обязательные проверки каждого таска**: `npm run type-check` + `npm run test`. E2E-тесты пишутся в каждом UI-таске, запускаются в Task 6 (локально — паттерн переиспользования сервера :3001 из памяти `local-e2e-via-reused-server`, официально — CI).
- **Коммиты**: `git add` только конкретных файлов (никогда `-A` — в дереве много посторонних untracked); сообщение заканчивать строкой `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
- **Jest + JSON**: импорт JSON в реестрах работает (доказано `missions-registry.test.ts`); новые тест-файлы — в `src/__tests__/lib/`.

---

### Task 1: Типы и логика рейтинга (чистые модули, TDD)

**Files:**
- Create: `src/lib/tournament-types.ts`
- Create: `src/lib/rating.ts`
- Test: `src/__tests__/lib/rating.test.ts`

**Interfaces:**
- Produces (используются всеми следующими тасками):
  - `TournamentPlayer { id: string; nick: string; name?: string | null; vkUrl?: string | null; region?: string | null }`
  - `TournamentResultRow { place: number; playerId: string }`
  - `TournamentMatch { round: number; table: number | null; playerId: string; opponentId: string | null; win: boolean; modePoints: number; armyPoints: number }`
  - `TournamentRoster { playerId: string; round: number | null; faction: string; points: number | null; composition: string }`
  - `Tournament { id: string; name: string; date: string; region?: string | null; rulesVersion: string; rosterPoints: number; format: string; rounds: number; organizers: string[]; players: string[]; results: TournamentResultRow[]; matches: TournamentMatch[]; rosters: TournamentRoster[] }`
  - `RatingRow { player: TournamentPlayer; games: number; wins: number; winRate: number; winRateDisplay: string; gold: number; silver: number; bronze: number; participations: number }`
  - `formatWinRate(rate: number): string`
  - `computeRating(players: TournamentPlayer[], tournaments: Tournament[]): RatingRow[]`

- [ ] **Step 1: Write the failing test**

`src/__tests__/lib/rating.test.ts`:

```typescript
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
      players: ['a', 'b'],
      matches: [
        { round: 1, table: 1, playerId: 'a', opponentId: 'b', win: true, modePoints: 0, armyPoints: 0 },
        { round: 1, table: 1, playerId: 'b', opponentId: 'a', win: false, modePoints: 0, armyPoints: 0 },
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
    // b: 2/2 = 100%; a: 1/1 = 100%; c: 0/1
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

  it('кубки из мест 1-3 и участия считаются по всем турнирам', () => {
    const res = (place: number, playerId: string) => ({ place, playerId });
    const t1 = makeTournament({ id: 't1', players: ['a', 'b'], results: [res(1, 'a'), res(2, 'b')], matches: [] });
    const t2 = makeTournament({ id: 't2', players: ['a', 'b'], results: [res(3, 'a'), res(1, 'b')], matches: [] });
    const rows = computeRating([P('a', 'Аня'), P('b', 'Боря')], [t1, t2]);
    const a = rows.find((r) => r.player.id === 'a')!;
    expect(a.gold).toBe(1);
    expect(a.silver).toBe(1);
    expect(a.bronze).toBe(0);
    expect(a.participations).toBe(2);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/lib/rating.test.ts`
Expected: FAIL — cannot find module `@/lib/rating`

- [ ] **Step 3: Write the implementation**

`src/lib/tournament-types.ts`:

```typescript
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
  gold: number;
  silver: number;
  bronze: number;
  participations: number;
}
```

`src/lib/rating.ts`:

```typescript
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
      s = { games: 0, wins: 0, gold: 0, silver: 0, bronze: 0, participations: 0 };
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
    }
    for (const r of t.results) {
      const s = ensure(r.playerId);
      if (r.place === 1) s.gold += 1;
      else if (r.place === 2) s.silver += 1;
      else if (r.place === 3) s.bronze += 1;
    }
  }

  const rows: RatingRow[] = [];
  for (const [pid, s] of stats) {
    const player = byId.get(pid);
    if (!player || s.games === 0) continue;
    const winRate = s.wins / s.games;
    rows.push({
      player,
      games: s.games,
      wins: s.wins,
      winRate,
      winRateDisplay: formatWinRate(winRate),
      gold: s.gold,
      silver: s.silver,
      bronze: s.bronze,
      participations: s.participations,
    });
  }

  rows.sort(
    (a, b) =>
      b.winRate - a.winRate ||
      b.games - a.games ||
      a.player.nick.localeCompare(b.player.nick, 'ru'),
  );
  return rows;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/__tests__/lib/rating.test.ts` → PASS; `npm run type-check` → 0 ошибок.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tournament-types.ts src/lib/rating.ts src/__tests__/lib/rating.test.ts
git commit -m "feat(rating): типы турнирных данных и чистая логика рейтинга

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: Сид-данные (Turnir.xlsx) и реестр

**Files:**
- Create: `src/data/tournaments/players.json`
- Create: `src/data/tournaments/2026-10-yuzhnyy-ural-open.json`
- Create: `src/lib/tournaments-registry.ts`
- Test: `src/__tests__/lib/tournaments-registry.test.ts`

**Interfaces:**
- Consumes: типы и `computeRating` из Task 1.
- Produces:
  - `getAllPlayers(): TournamentPlayer[]`
  - `getPlayer(id: string): TournamentPlayer | undefined`
  - `getAllTournaments(): Tournament[]` (по дате ↓)
  - `getTournament(id: string): Tournament | undefined`
  - `getPlayerTournaments(playerId: string): Tournament[]` (по дате ↓)
  - `getRating(): RatingRow[]`
  - `resolveResults(t: Tournament): Array<{ place: number; player: TournamentPlayer }>` (места ↑, неизвестные id пропущены)
  - `groupGames(matches: TournamentMatch[]): TournamentGame[]`, где `TournamentGame { round: number; table: number | null; p1: TournamentMatch; p2: TournamentMatch | null }` — p2: null = пропускная

**Provisional-поля сида** (подтвердить у владельца перед merge): название «Открытый турнир Южного Урала», дата `2026-10-15`, правила `community_star_system`. Блоки ростеров «ЮГ УРАЛА» и «Я» из протокола не включены (нет игр в турнире; принадлежность уточняется) — открытые вопросы спеки.

- [ ] **Step 1: Write the failing test**

`src/__tests__/lib/tournaments-registry.test.ts`:

```typescript
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
    expect(rows[1].silver).toBe(1);
    expect(rows[2].bronze).toBe(1);
    expect(rows[4].games).toBe(3); // Шнайдер
    expect(rows[4].wins).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/__tests__/lib/tournaments-registry.test.ts`
Expected: FAIL — cannot find module `@/lib/tournaments-registry`

- [ ] **Step 3: Create the seed data**

`src/data/tournaments/players.json` — ник ↔ ФИО восстановлен из листа мест протокола:

```json
{
  "players": [
    { "id": "semen_kashapov", "nick": "Семён", "name": "Семён Кашапов", "vkUrl": null, "region": null },
    { "id": "pavel_boev", "nick": "Павел", "name": "Павел Боев", "vkUrl": null, "region": null },
    { "id": "valera_zhilin", "nick": "Валера", "name": "Валера Жилин", "vkUrl": null, "region": null },
    { "id": "shnayder", "nick": "Шнайдер", "name": "Денис Шнайдер", "vkUrl": null, "region": null },
    { "id": "kostya_vasilev", "nick": "Костя", "name": "Константин Васильев", "vkUrl": null, "region": null },
    { "id": "ahe_aks", "nick": "Ахе", "name": "Алесандр Акс", "vkUrl": null, "region": null },
    { "id": "edik_agievich", "nick": "Эдик", "name": "Эдуард Агиевич", "vkUrl": null, "region": null },
    { "id": "andrey_sukov", "nick": "Андрей", "name": "Андрей Суков", "vkUrl": null, "region": null }
  ]
}
```

`src/data/tournaments/2026-10-yuzhnyy-ural-open.json` — транскрипция `~/Downloads/Turnir.xlsx` (лист «Таблица»: пары туров и построчные результаты; лист «Ростеры»: 8 именных блоков; составы — дословно, включая особенности источника):

```json
{
  "id": "2026-10-yuzhnyy-ural-open",
  "name": "Открытый турнир Южного Урала",
  "date": "2026-10-15",
  "region": null,
  "rulesVersion": "community_star_system",
  "rosterPoints": 700,
  "format": "swiss",
  "rounds": 3,
  "organizers": ["Андрей Андреев"],
  "players": [
    "semen_kashapov", "pavel_boev", "valera_zhilin", "shnayder",
    "kostya_vasilev", "ahe_aks", "edik_agievich", "andrey_sukov"
  ],
  "results": [
    { "place": 1, "playerId": "semen_kashapov" },
    { "place": 2, "playerId": "pavel_boev" },
    { "place": 3, "playerId": "valera_zhilin" },
    { "place": 4, "playerId": "shnayder" },
    { "place": 5, "playerId": "kostya_vasilev" },
    { "place": 6, "playerId": "ahe_aks" },
    { "place": 7, "playerId": "edik_agievich" },
    { "place": 8, "playerId": "andrey_sukov" }
  ],
  "matches": [
    { "round": 1, "table": 1, "playerId": "andrey_sukov", "opponentId": "pavel_boev", "win": false, "modePoints": 1, "armyPoints": 292 },
    { "round": 1, "table": 1, "playerId": "pavel_boev", "opponentId": "andrey_sukov", "win": true, "modePoints": 3, "armyPoints": 591 },
    { "round": 1, "table": 2, "playerId": "semen_kashapov", "opponentId": "kostya_vasilev", "win": true, "modePoints": 0, "armyPoints": 454 },
    { "round": 1, "table": 2, "playerId": "kostya_vasilev", "opponentId": "semen_kashapov", "win": false, "modePoints": 0, "armyPoints": 428 },
    { "round": 1, "table": 3, "playerId": "edik_agievich", "opponentId": "valera_zhilin", "win": false, "modePoints": 1, "armyPoints": 191 },
    { "round": 1, "table": 3, "playerId": "valera_zhilin", "opponentId": "edik_agievich", "win": true, "modePoints": 1, "armyPoints": 420 },
    { "round": 1, "table": 4, "playerId": "ahe_aks", "opponentId": "shnayder", "win": false, "modePoints": 1, "armyPoints": 122 },
    { "round": 1, "table": 4, "playerId": "shnayder", "opponentId": "ahe_aks", "win": true, "modePoints": 2, "armyPoints": 142 },

    { "round": 2, "table": 1, "playerId": "semen_kashapov", "opponentId": "edik_agievich", "win": true, "modePoints": 4, "armyPoints": 592 },
    { "round": 2, "table": 1, "playerId": "edik_agievich", "opponentId": "semen_kashapov", "win": false, "modePoints": 2, "armyPoints": 477 },
    { "round": 2, "table": 2, "playerId": "andrey_sukov", "opponentId": "valera_zhilin", "win": false, "modePoints": 2, "armyPoints": 497 },
    { "round": 2, "table": 2, "playerId": "valera_zhilin", "opponentId": "andrey_sukov", "win": true, "modePoints": 5, "armyPoints": 223 },
    { "round": 2, "table": 3, "playerId": "pavel_boev", "opponentId": "ahe_aks", "win": true, "modePoints": 5, "armyPoints": 322 },
    { "round": 2, "table": 3, "playerId": "ahe_aks", "opponentId": "pavel_boev", "win": false, "modePoints": 3, "armyPoints": 156 },
    { "round": 2, "table": 5, "playerId": "kostya_vasilev", "opponentId": "shnayder", "win": true, "modePoints": 1, "armyPoints": 395 },
    { "round": 2, "table": 5, "playerId": "shnayder", "opponentId": "kostya_vasilev", "win": false, "modePoints": 0, "armyPoints": 186 },

    { "round": 3, "table": 1, "playerId": "kostya_vasilev", "opponentId": "valera_zhilin", "win": true, "modePoints": 4, "armyPoints": 480 },
    { "round": 3, "table": 1, "playerId": "valera_zhilin", "opponentId": "kostya_vasilev", "win": false, "modePoints": 2, "armyPoints": 20 },
    { "round": 3, "table": 2, "playerId": "pavel_boev", "opponentId": "shnayder", "win": false, "modePoints": 5, "armyPoints": 125 },
    { "round": 3, "table": 2, "playerId": "shnayder", "opponentId": "pavel_boev", "win": true, "modePoints": 5, "armyPoints": 347 },
    { "round": 3, "table": 4, "playerId": "andrey_sukov", "opponentId": "semen_kashapov", "win": false, "modePoints": 0, "armyPoints": 80 },
    { "round": 3, "table": 4, "playerId": "semen_kashapov", "opponentId": "andrey_sukov", "win": true, "modePoints": 3, "armyPoints": 547 },
    { "round": 3, "table": 5, "playerId": "edik_agievich", "opponentId": "ahe_aks", "win": false, "modePoints": 0, "armyPoints": 375 },
    { "round": 3, "table": 5, "playerId": "ahe_aks", "opponentId": "edik_agievich", "win": true, "modePoints": 5, "armyPoints": 222 }
  ],
  "rosters": [
    { "playerId": "shnayder", "round": null, "faction": "ИМПЕРИЯ", "points": 680, "composition": "Линейная КП(Т), Линейная КП(Л)*2, Линейная КП(Л), Красные молнии, ЛНТ, Трибунаторы(Т), тяжелая КП(Т)" },
    { "playerId": "shnayder", "round": null, "faction": "ПРОТЕКТОРАТ", "points": 700, "composition": "Спецназ Фелиция(Л), Родезия, КП(Л), Легкая КП(Т), Грифон, ополчение велиана(Т)" },
    { "playerId": "shnayder", "round": null, "faction": "Волки", "points": 700, "composition": "Йотун, Хускарлы, Хирманы1, Хирдманы2, Ульфхиднары*2, Валькирии" },

    { "playerId": "semen_kashapov", "round": null, "faction": "ИМПЕРИЯ", "points": null, "composition": "Линейная клон пехота*4; Шидуанский спецназ 2 отряда 180 очков; Тяжелая клон пехота 80 очков; МСТ 230 очков" },
    { "playerId": "semen_kashapov", "round": null, "faction": "ПРОТЕКТОРАТ", "points": null, "composition": "Штурмовой спецназ(нов)(Т)*4, Карнивор" },
    { "playerId": "semen_kashapov", "round": null, "faction": "Наемники", "points": 695, "composition": "Пираты Маркуса(стар.)(Т)*4, Рейдеры*3, Найтсталкеры, Аборигены ростков*2, Карнивор" },

    { "playerId": "ahe_aks", "round": null, "faction": "ИМПЕРИЯ", "points": 695, "composition": "ЛНТ, Хантер, Трибунаторы(Л), Десант(Л), линейная КП(Т), Линейная КП(Л)" },
    { "playerId": "ahe_aks", "round": null, "faction": "ПРОТЕКТОРАТ", "points": 690, "composition": "Грифон, Спецназ Фелиции(Л), Штурмовая КП, шт" },
    { "playerId": "ahe_aks", "round": null, "faction": "Наемники", "points": 700, "composition": "Бронеход*2, Саламандра, Скерные парни, Мутанты, Рейдеры пыльной зоны" },

    { "playerId": "valera_zhilin", "round": null, "faction": "ИМПЕРИЯ", "points": 680, "composition": "Тяжелая КП(Т), Легкая штурм КП(Т), Легкий штурм десант(Т), Локуст-М, Раптор*2" },
    { "playerId": "valera_zhilin", "round": null, "faction": "ПРОТЕКТОРАТ", "points": 700, "composition": "Штурм спецназ нов(Т), КП(Т), Регуляры Велиан(Т), Бронеход, Ти-Рекс" },
    { "playerId": "valera_zhilin", "round": null, "faction": "Наемники", "points": 695, "composition": "Мутанты, Пираты МаркусаНОВ(Т), Рейдеры(Т), Локуст-М, Раптор, Бронеход, Саламандер" },

    { "playerId": "kostya_vasilev", "round": null, "faction": "ИМПЕРИЯ", "points": 690, "composition": "Арбитры, Легкая штурм КП(Т), Тяжелая КП(Т)*2, Тяжелый Штурм десант(Т), Раптор" },
    { "playerId": "kostya_vasilev", "round": null, "faction": "ПРОТЕКТОРАТ", "points": 700, "composition": "Стервятники, Бронеход, регуляры велиан(Т), спецназ планеты Фелиция(Т)*2" },
    { "playerId": "kostya_vasilev", "round": null, "faction": "Наемники", "points": 690, "composition": "Аборигены ростков*20, Мутанты*3, Рейдеры*3" },

    { "playerId": "edik_agievich", "round": null, "faction": "ИМПЕРИЯ", "points": 700, "composition": "Тяжелый Штурм Десант(Т)*2, Арбитры, Спайдер, Хеликс" },
    { "playerId": "edik_agievich", "round": null, "faction": "ПРОТЕКТОРАТ", "points": 690, "composition": "ТИ-Рэкс, Стервятники, Регуляры Велиан(Т)*2, Саламандер" },
    { "playerId": "edik_agievich", "round": null, "faction": "ИМПЕРИЯ", "points": 695, "composition": "Демолишер, Легкий штурм десант(Т)*2, Арбиторы, Режимная КП(Т)" },

    { "playerId": "andrey_sukov", "round": null, "faction": "ИМПЕРИЯ", "points": 690, "composition": "Арбиторы(Т), Трибунаторы(Т), Т600, Локуст" },
    { "playerId": "andrey_sukov", "round": null, "faction": "ПРОТЕКТОРАТ", "points": 695, "composition": "Спецназ фелиция(Т), Штурмовой Спецназ(Т), Штурмовой спецназ(Л), Грифон, Саламандра" },
    { "playerId": "andrey_sukov", "round": null, "faction": "Наемники", "points": 700, "composition": "МЗСТ, Супер Локуст, Пираты тортуги, Найтсталкеры, Рейдеры, мутанты, Аборигены Ростков, Косари" },

    { "playerId": "pavel_boev", "round": null, "faction": "ИМПЕРИЯ", "points": 700, "composition": "Спайдер, Хантер, Линейная КП(Т), ТяжелаяКП(Т), Спецназ Шиду, ТрибунаторыСТАР(Т)" },
    { "playerId": "pavel_boev", "round": null, "faction": "ПРОТЕКТОРАТ", "points": 690, "composition": "Карнивор, ТИ-Рекс, Спецназ Фелиции(Т), Штурмовой спецназНОВ(Т)" },
    { "playerId": "pavel_boev", "round": null, "faction": "Наемники", "points": 690, "composition": "Спайдер, ТИ-Рекс, Мутанты, Скверные парни-2, Шахматисты" }
  ]
}
```

Примечание к транскрипции: у Эдика в протоколе два списка «ИМПЕРИЯ» и нет «Наемников» — это особенность источника, не ошибка; многострочная ячейка Семёна склеена через `; `.

- [ ] **Step 4: Write the registry**

`src/lib/tournaments-registry.ts`:

```typescript
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
  return [...byKey.values()]
    .map((g) => ({ round: g.p1.round, table: g.p1.table, p1: g.p1, p2: g.p2 ?? null }))
    .sort((a, b) => a.round - b.round || (a.table ?? 0) - (b.table ?? 0));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest src/__tests__/lib/tournaments-registry.test.ts src/__tests__/lib/rating.test.ts` → PASS; `npm run type-check` → 0 ошибок.

- [ ] **Step 6: Commit**

```bash
git add src/data/tournaments/players.json src/data/tournaments/2026-10-yuzhnyy-ural-open.json src/lib/tournaments-registry.ts src/__tests__/lib/tournaments-registry.test.ts
git commit -m "feat(tournaments): сид первого турнира (Turnir.xlsx) и реестр

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: Хаб `/tournaments` — рейтинг и список турниров

**Files:**
- Create: `src/components/tournaments/CupBadges.tsx`
- Create: `src/components/tournaments/RatingTable.tsx`
- Create: `src/components/tournaments/TournamentsHub.tsx`
- Create: `src/app/tournaments/page.tsx`
- Test: `e2e/tournaments.spec.ts` (describe «Хаб»; запуск — в Task 6)

**Interfaces:**
- Consumes: `getRating`, `getAllTournaments`, `resolveResults` из Task 2; типы из Task 1; `pageOpenGraph` из `@/lib/seo`.
- Produces: `CupBadges({ gold, silver, bronze, className? })` — используется в Task 4/5; testids: `tournaments-title`, `rating-table`, `rating-row-<playerId>`, `tournament-card`, `tournament-winner`, `cup-gold|silver|bronze`.

UI-задача: TDD через e2e (пишем тест — падает как 404 — реализуем). Юнит-проверка — `type-check`; e2e-прогон в Task 6.

- [ ] **Step 1: Write the failing e2e test**

`e2e/tournaments.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

test.describe('Турниры: хаб', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('рейтинг отсортирован по проценту побед, у победителя золотой кубок', async ({ page }) => {
    await page.goto('/tournaments');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('tournaments-title')).toBeVisible();
    const rows = page.getByTestId(/^rating-row-/);
    await expect(rows.first()).toContainText('Семён');
    await expect(rows.first()).toContainText('100');
    // четвёрка 66,7% отсортирована по никам (тайбрейк «больше игр» тут равный)
    const texts = await rows.allTextContents();
    const idx = (n: string) => texts.findIndex((t) => t.includes(n));
    expect(idx('Валера')).toBeLessThan(idx('Костя'));
    expect(idx('Костя')).toBeLessThan(idx('Павел'));
    expect(idx('Павел')).toBeLessThan(idx('Шнайдер'));
    await expect(
      page.getByTestId('rating-row-semen_kashapov').getByTestId('cup-gold'),
    ).toBeVisible();
  });

  test('карточка турнира показывает победителя и ведёт на протокол', async ({ page }) => {
    await page.goto('/tournaments');
    await page.waitForLoadState('networkidle');

    const card = page.getByTestId('tournament-card').first();
    await expect(card).toContainText('Открытый турнир Южного Урала');
    await expect(page.getByTestId('tournament-winner').first()).toContainText('Семён');
    await card.click();
    await expect(page).toHaveURL(/\/tournaments\/2026-10-yuzhnyy-ural-open$/);
  });
});
```

- [ ] **Step 2: Implement the components**

`src/components/tournaments/CupBadges.tsx`:

```tsx
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CupBadgesProps {
  gold: number;
  silver: number;
  bronze: number;
  className?: string;
}

const CUP_STYLES: Array<{ kind: string; countKey: 'gold' | 'silver' | 'bronze'; color: string; label: string }> = [
  { kind: 'gold', countKey: 'gold', color: 'text-amber-400', label: '1 место' },
  { kind: 'silver', countKey: 'silver', color: 'text-slate-300', label: '2 место' },
  { kind: 'bronze', countKey: 'bronze', color: 'text-amber-700', label: '3 место' },
];

/** Кубки за места у имени игрока: 🏆 золото / серебро / бронза. */
export default function CupBadges({ gold, silver, bronze, className }: CupBadgesProps) {
  const counts = { gold, silver, bronze };
  const cups = CUP_STYLES.filter((c) => counts[c.countKey] > 0);
  if (cups.length === 0) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 align-middle', className)}>
      {cups.map((c) => (
        <span
          key={c.kind}
          data-testid={`cup-${c.kind}`}
          title={c.label}
          className={cn('inline-flex items-center gap-0.5', c.color)}
        >
          <Trophy className="w-3.5 h-3.5" aria-label={c.label} />
          {counts[c.countKey] > 1 && (
            <span className="font-ibm-mono text-[9px]">×{counts[c.countKey]}</span>
          )}
        </span>
      ))}
    </span>
  );
}
```

`src/components/tournaments/RatingTable.tsx`:

```tsx
import Link from 'next/link';
import type { RatingRow } from '@/lib/tournament-types';
import CupBadges from './CupBadges';

/** Таблица рейтинга: десктоп — все колонки, мобила скрывает «турниры». */
export default function RatingTable({ rating }: { rating: RatingRow[] }) {
  return (
    <table data-testid="rating-table" className="w-full border-collapse font-ibm-mono text-sm mt-4">
      <thead>
        <tr className="border-b border-military-steel/40 text-left text-[10px] uppercase tracking-[0.2em] text-military-taupe">
          <th className="py-2 pr-2 font-normal">#</th>
          <th className="py-2 pr-2 font-normal">Игрок</th>
          <th className="py-2 pr-2 font-normal hidden md:table-cell">Турниры</th>
          <th className="py-2 pr-2 font-normal">Игры</th>
          <th className="py-2 pr-2 font-normal">Победы</th>
          <th className="py-2 text-right font-normal">%</th>
        </tr>
      </thead>
      <tbody>
        {rating.map((row, i) => (
          <tr
            key={row.player.id}
            data-testid={`rating-row-${row.player.id}`}
            className="border-b border-military-steel/20 hover:bg-military-dark/40 transition-colors"
          >
            <td className="py-2.5 pr-2 text-military-taupe">{i + 1}</td>
            <td className="py-2.5 pr-2">
              <Link
                href={`/players/${row.player.id}`}
                className="font-russo uppercase text-sm text-military-sand hover:text-military-amber transition-colors min-h-[44px] inline-flex items-center"
              >
                {row.player.nick}
              </Link>
              <CupBadges gold={row.gold} silver={row.silver} bronze={row.bronze} className="ml-2" />
            </td>
            <td className="py-2.5 pr-2 hidden md:table-cell text-military-taupe">{row.participations}</td>
            <td className="py-2.5 pr-2">{row.games}</td>
            <td className="py-2.5 pr-2">{row.wins}</td>
            <td className="py-2.5 text-right font-bold text-military-amber">{row.winRateDisplay}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`src/components/tournaments/TournamentsHub.tsx`:

```tsx
import Link from 'next/link';
import type { RatingRow, Tournament } from '@/lib/tournament-types';
import { resolveResults } from '@/lib/tournaments-registry';
import RatingTable from './RatingTable';

interface TournamentsHubProps {
  rating: RatingRow[];
  tournaments: Tournament[];
}

/** Хаб турнирного раздела: рейтинг игроков + список турниров. */
export default function TournamentsHub({ rating, tournaments }: TournamentsHubProps) {
  return (
    <div className="min-h-screen bg-military-dark text-military-sand">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header>
          <div
            data-testid="tournaments-title"
            className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust"
          >
            {'// ТУРНИРЫ'}
          </div>
          <h1 className="font-russo text-2xl md:text-3xl uppercase tracking-wider mt-1">
            Рейтинг игроков
          </h1>
          <p className="font-ibm-mono text-xs text-military-taupe mt-1">
            процент побед · при равенстве — больше партий
          </p>
        </header>

        <RatingTable rating={rating} />

        <section className="mt-10">
          <h2 className="font-russo uppercase tracking-wider text-lg">Турниры</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {tournaments.map((t) => {
              const winner = resolveResults(t)[0];
              return (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  data-testid="tournament-card"
                  className="block border border-military-steel/40 hover:border-military-amber/60 p-4 transition-colors no-underline text-military-sand min-h-[44px]"
                >
                  <div className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust">
                    {t.date}
                  </div>
                  <div className="font-russo uppercase text-base mt-1">{t.name}</div>
                  {winner && (
                    <div
                      data-testid="tournament-winner"
                      className="font-ibm-mono text-xs text-military-taupe mt-2"
                    >
                      🥇 {winner.player.nick}
                    </div>
                  )}
                  <div className="font-ibm-mono text-xs text-military-taupe">
                    {t.players.length} участников
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
```

`src/app/tournaments/page.tsx`:

```tsx
import type { Metadata } from 'next';
import TournamentsHub from '@/components/tournaments/TournamentsHub';
import { getAllTournaments, getRating } from '@/lib/tournaments-registry';
import { pageOpenGraph } from '@/lib/seo';

const TITLE = 'Турниры — Бронепехота';
const DESCRIPTION = 'Рейтинг игроков и итоги турниров «Бронепехоты»: победы, партии, кубки и протоколы.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/tournaments' },
  openGraph: pageOpenGraph({ title: TITLE, description: DESCRIPTION, path: '/tournaments' }),
};

export default function TournamentsPage() {
  // Данные бандлятся на билде (static export) — синхронный доступ.
  return <TournamentsHub rating={getRating()} tournaments={getAllTournaments()} />;
}
```

- [ ] **Step 3: Verify**

Run: `npm run type-check` → 0 ошибок; `npm run test` → все зелёные (e2e не запускается локально здесь).

- [ ] **Step 4: Commit**

```bash
git add src/components/tournaments/CupBadges.tsx src/components/tournaments/RatingTable.tsx src/components/tournaments/TournamentsHub.tsx src/app/tournaments/page.tsx e2e/tournaments.spec.ts
git commit -m "feat(tournaments): хаб /tournaments — рейтинг и список турниров

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Страница турнира `/tournaments/[id]`

**Files:**
- Create: `src/components/tournaments/TournamentDetailPage.tsx`
- Create: `src/app/tournaments/[id]/page.tsx`
- Test: `e2e/tournaments.spec.ts` (добавить describe «Протокол турнира»)

**Interfaces:**
- Consumes: `getTournament`, `resolveResults`, `groupGames`, `getPlayer` из Task 2; `CupBadges` из Task 3; `breadcrumbJsonLd`, `absoluteUrl`, `pageOpenGraph` из `@/lib/seo`; `notFound` из `next/navigation`.
- Produces: testids `tournament-title`, `place-row`, `tournament-rounds`, `round-card`, `game-row`, `tournament-rosters`, `roster-item`.

- [ ] **Step 1: Write the failing e2e test**

Добавить в `e2e/tournaments.spec.ts` (внутрь верхного уровня файла, после describe хаба):

```typescript
test.describe('Турниры: протокол', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('места с кубками, туры и ростеры рендерятся', async ({ page }) => {
    await page.goto('/tournaments/2026-10-yuzhnyy-ural-open');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: 'Открытый турнир Южного Урала' }),
    ).toBeVisible();
    const places = page.getByTestId('place-row');
    await expect(places).toHaveCount(8);
    await expect(places.first()).toContainText('Семён');
    await expect(places.first().getByTestId('cup-gold')).toBeVisible();
    await expect(page.getByTestId('round-card')).toHaveCount(3);
    await expect(page.getByTestId('game-row').first()).toBeVisible();
    await expect(page.getByTestId('roster-item').first()).toBeVisible();
  });

  test('неизвестный id — 404', async ({ page }) => {
    const resp = await page.goto('/tournaments/nope');
    expect(resp?.status()).toBe(404);
  });
});
```

- [ ] **Step 2: Implement**

`src/components/tournaments/TournamentDetailPage.tsx`:

```tsx
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
  const rounds = [...new Set(tournament.matches.map((m) => m.round))].sort((a, b) => a - b);

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
```

`src/app/tournaments/[id]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllTournaments, getTournament } from '@/lib/tournaments-registry';
import TournamentDetailPage from '@/components/tournaments/TournamentDetailPage';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, breadcrumbJsonLd, pageOpenGraph } from '@/lib/seo';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  // Реестр бандлится на билде (static export) — синхронный доступ.
  return getAllTournaments().map((t) => ({ id: t.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const tournament = getTournament(params.id);
  if (!tournament) {
    return { title: 'Турнир не найден — Бронепехота' };
  }
  const title = `«${tournament.name}» — Турниры — Бронепехота`;
  const description = `Итоги турнира «${tournament.name}» (${tournament.date}): места, матчи по турам и ростеры участников.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/tournaments/${tournament.id}`) },
    openGraph: pageOpenGraph({ title, description, path: `/tournaments/${tournament.id}` }),
  };
}

export default function Page({ params }: PageProps) {
  const tournament = getTournament(params.id);
  if (!tournament) {
    notFound();
  }
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Турниры', path: '/tournaments' },
          { name: tournament.name, path: `/tournaments/${tournament.id}` },
        ])}
      />
      <TournamentDetailPage tournament={tournament} />
    </>
  );
}
```

Примечание: `generateStaticParams` повторяет вид из `src/app/encyclopedia/mission/[id]/page.tsx:12-15`.

- [ ] **Step 3: Verify**

Run: `npm run type-check` → 0 ошибок; `npm run test` → зелёные.

- [ ] **Step 4: Commit**

```bash
git add src/components/tournaments/TournamentDetailPage.tsx src/app/tournaments/[id]/page.tsx e2e/tournaments.spec.ts
git commit -m "feat(tournaments): страница турнира — итоги, туры, ростеры

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: Профиль игрока `/players/[id]` + sitemap

**Files:**
- Create: `src/components/tournaments/PlayerProfilePage.tsx`
- Create: `src/app/players/[id]/page.tsx`
- Modify: `src/app/sitemap.ts`
- Test: `e2e/tournaments.spec.ts` (добавить describe «Профиль игрока»)

**Interfaces:**
- Consumes: `getPlayer`, `getRating`, `getPlayerTournaments`, `groupGames` из Task 2; `CupBadges` из Task 3; `getAllPlayers`, `getAllTournaments` (для sitemap).
- Produces: testids `profile-nick`, `profile-summary`, `history-row`, `profile-rosters`, `profile-participations`.

- [ ] **Step 1: Write the failing e2e test**

Добавить в `e2e/tournaments.spec.ts`:

```typescript
test.describe('Турниры: профиль игрока', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('сводка, кубки и история матчей Шнайдера', async ({ page }) => {
    await page.goto('/players/shnayder');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('profile-nick')).toHaveText('Шнайдер');
    const summary = page.getByTestId('profile-summary');
    await expect(summary).toContainText('игры: 3');
    await expect(summary).toContainText('победы: 2');
    await expect(summary).toContainText('66,7');
    await expect(page.getByTestId('cup-silver')).toBeVisible();
    await expect(page.getByTestId('history-row')).toHaveCount(3);
    await expect(page.getByTestId('profile-participations')).toContainText('Открытый турнир');
  });

  test('переход из рейтинга по клику на ник', async ({ page }) => {
    await page.goto('/tournaments');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('rating-row-shnayder').getByRole('link').click();
    await expect(page).toHaveURL(/\/players\/shnayder$/);
  });

  test('неизвестный игрок — 404', async ({ page }) => {
    const resp = await page.goto('/players/nonexistent');
    expect(resp?.status()).toBe(404);
  });
});
```

- [ ] **Step 2: Implement the component**

`src/components/tournaments/PlayerProfilePage.tsx`:

```tsx
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
```

- [ ] **Step 3: Implement the route**

`src/app/players/[id]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllPlayers,
  getPlayer,
  getPlayerTournaments,
  getRating,
} from '@/lib/tournaments-registry';
import PlayerProfilePage from '@/components/tournaments/PlayerProfilePage';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, breadcrumbJsonLd, pageOpenGraph } from '@/lib/seo';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return getAllPlayers().map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const player = getPlayer(params.id);
  if (!player) {
    return { title: 'Игрок не найден — Бронепехота' };
  }
  const title = `${player.nick} — профиль игрока — Бронепехота`;
  const description = `${player.name ?? player.nick}: статистика турниров «Бронепехоты» — партии, победы, процент, кубки и история матчей.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/players/${player.id}`) },
    openGraph: pageOpenGraph({ title, description, path: `/players/${player.id}` }),
  };
}

export default function Page({ params }: PageProps) {
  const player = getPlayer(params.id);
  if (!player) {
    notFound();
  }
  const rating = getRating().find((r) => r.player.id === player.id);
  const tournaments = getPlayerTournaments(player.id);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Турниры', path: '/tournaments' },
          { name: player.nick, path: `/players/${player.id}` },
        ])}
      />
      <PlayerProfilePage player={player} rating={rating} tournaments={tournaments} />
    </>
  );
}
```

- [ ] **Step 4: Add sitemap entries**

В `src/app/sitemap.ts`: добавить импорт и маршруты.

```typescript
import { getAllTournaments, getAllPlayers } from '@/lib/tournaments-registry';
```

В `staticRoutes` добавить:

```typescript
    // Турнирный раздел: рейтинг игроков и протоколы.
    { path: '/tournaments', freq: 'weekly', priority: 0.8 },
```

В возвращаемый массив (после worldEntries-блока) добавить:

```typescript
    // Турниры: протоколы и профили игроков.
    ...getAllTournaments().map((t) => ({
      url: absoluteUrl(`/tournaments/${t.id}`),
      changeFrequency: 'monthly' as ChangeFreq,
      priority: 0.6,
    })),
    ...getAllPlayers().map((p) => ({
      url: absoluteUrl(`/players/${p.id}`),
      changeFrequency: 'monthly' as ChangeFreq,
      priority: 0.5,
    })),
```

- [ ] **Step 5: Verify**

Run: `npm run type-check` → 0 ошибок; `npm run test` → зелёные.

- [ ] **Step 6: Commit**

```bash
git add src/components/tournaments/PlayerProfilePage.tsx src/app/players/[id]/page.tsx src/app/sitemap.ts e2e/tournaments.spec.ts
git commit -m "feat(tournaments): профиль игрока и маршруты в sitemap

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Входы (лендинг + хаб энциклопедии) и финальная проверка

**Files:**
- Modify: `src/components/landing/CTAButton.tsx` (2 места — варианты «обычный» `ModuleRow` и «бой идёт»)
- Modify: `src/components/encyclopedia/hub/ArchiveHub.tsx` (после строки-телеграфа калькулятора, ~строка 196-211)
- Test: `e2e/tournaments.spec.ts` (добавить describe «Входы»)

**Interfaces:**
- Consumes: существующие паттерны `CalculatorTelegraph` (CTAButton.tsx:47-62) и тихой строки `// КАЛЬКУЛЯТОР БОЯ` (ArchiveHub.tsx:196-211).
- Produces: testids `landing-tournaments-link`, `encyclopedia-tournaments-link`.

- [ ] **Step 1: Write the failing e2e test**

Добавить в `e2e/tournaments.spec.ts`:

```typescript
test.describe('Турниры: входы', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('лендинг: телеграфная строка ведёт на /tournaments', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('landing-tournaments-link').click();
    await expect(page).toHaveURL(/\/tournaments$/);
    await expect(page.getByTestId('tournaments-title')).toBeVisible();
  });

  test('хаб энциклопедии: тихая строка ведёт на /tournaments', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('encyclopedia-tournaments-link').click();
    await expect(page).toHaveURL(/\/tournaments$/);
  });
});
```

- [ ] **Step 2: Landing — CTAButton.tsx**

Рядом с `CalculatorTelegraph` (после её определения, ~строка 62) добавить:

```tsx
/** Терциарный вход: телеграфная строка турниров — рейтинг сообщества. */
function TournamentsTelegraph() {
  return (
    <Link
      href="/tournaments"
      data-testid="landing-tournaments-link"
      className="group inline-flex items-baseline justify-center gap-2 w-full py-2 no-underline"
    >
      <span className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust/80 group-hover:text-military-amber transition-colors">
        {'// ТУРНИРЫ'}
      </span>
      <span className="font-ibm-mono text-[9px] text-military-sand/50 group-hover:text-military-sand/80 transition-colors">
        рейтинг игроков
      </span>
    </Link>
  );
}
```

Вставить `<TournamentsTelegraph />` сразу после `<CalculatorTelegraph />` в ОБОИХ вариантах рендера: в `ModuleRow` (~строка 112) и в ветке «бой идёт» (~строка 237).

- [ ] **Step 3: Хаб энциклопедии — ArchiveHub.tsx**

После `<Link href="/calculator" …>` блока (строки 196-211) добавить такой же тихий ряд:

```tsx
          {/* Тихий телеграф турниров под калькулятором: рейтинг сообщества */}
          <Link
            href="/tournaments"
            data-testid="encyclopedia-tournaments-link"
            className="mt-2 flex items-center gap-3 min-h-[36px] px-2 no-underline group touch-manipulation"
          >
            <span className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust/70 group-hover:text-military-amber transition-colors shrink-0">
              {'// ТУРНИРЫ'}
            </span>
            <span className="hidden sm:inline font-ibm-mono text-[10px] text-military-taupe/60 group-hover:text-military-taupe/90 transition-colors truncate">
              рейтинг и протоколы
            </span>
            <span className="flex-1" />
            <span className="font-russo text-[10px] uppercase tracking-widest text-military-rust/70 group-hover:text-military-amber transition-colors shrink-0">
              РЕЙТИНГ →
            </span>
          </Link>
```

- [ ] **Step 4: Full verification**

```bash
npm run type-check   # 0 ошибок
npm run test         # все юнит-тесты зелёные
npm run lint         # чисто
```

E2E локально (паттерн памяти `local-e2e-via-reused-server`; если окружение не даёт — CI прогонит):

```bash
# отдельная фоновая задача: npm run dev:e2e (порт 3001), затем
npx playwright test e2e/tournaments.spec.ts --reporter=list
```

Ожидание: все тесты `tournaments.spec.ts` зелёные; существующие `landing`/`encyclopedia` спеки не сломаны (новые строки не конфликтуют с их селекторами).

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/CTAButton.tsx src/components/encyclopedia/hub/ArchiveHub.tsx e2e/tournaments.spec.ts
git commit -m "feat(tournaments): входы с лендинга и хаба энциклопедии

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Финальные шаги (координатор, не субагент)

1. Полный `npm run validate` + e2e (CI, или локально по паттерну выше).
2. В описании PR перечислить provisional-поля сида для подтверждения владельцем:
   - название «Открытый турнир Южного Урала», дата `2026-10-15`, правила `community_star_system`;
   - блоки ростеров «ЮГ УРАЛА» и «Я» из протокола не включены (уточнить принадлежность);
   - маппинг ник ↔ ФИО из листа мест (показать список).
3. PR → review → merge (никогда не мержить напрямую в main без PR).

