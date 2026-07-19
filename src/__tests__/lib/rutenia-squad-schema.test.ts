import { describe, it, expect } from '@jest/globals';
import { parseRoll } from '@/lib/game-logic';
import type { Squad } from '@/lib/types';
import squadsData from '@/data/sources/star_system/rutenia/squads.json';

/**
 * Schema sanity check for the rutenia faction's squad roster JSON. Catches the
 * kind of breakage that would silently render empty cards or NaN stats in the
 * encyclopedia / army builder — bad id prefix, wrong faction tag, missing cost,
 * soldier rows that aren't 1..6, or malformed `range`/`power` dice notation
 * (which parseRoll would otherwise turn into a silent 0-dice no-op).
 *
 * `range`/`power` may legitimately be empty strings (melee-only soldiers such
 * as #4 in «Войска планеты Рутения»), so '' is accepted without calling parseRoll.
 */
const squads = squadsData as Squad[];

describe('rutenia squads.json schema', () => {
  it('file is a non-empty array', () => {
    expect(Array.isArray(squads)).toBe(true);
    expect(squads.length).toBeGreaterThan(0);
  });

  for (const squad of squads) {
    describe(`squad ${squad.id}`, () => {
      it("id starts with 'rutenia_'", () => {
        expect(squad.id.startsWith('rutenia_')).toBe(true);
      });

      it('has a non-empty name', () => {
        expect(typeof squad.name).toBe('string');
        expect(squad.name.length).toBeGreaterThan(0);
      });

      it("faction === 'rutenia'", () => {
        expect(squad.faction).toBe('rutenia');
      });

      it('cost is a number', () => {
        expect(typeof squad.cost).toBe('number');
        expect(Number.isFinite(squad.cost)).toBe(true);
      });

      it('has exactly 6 soldiers numbered 1..6 sequentially', () => {
        expect(squad.soldiers).toHaveLength(6);
        expect(squad.soldiers.map((s) => s.num)).toEqual([1, 2, 3, 4, 5, 6]);
      });

      it('each soldier has numeric rank/speed/melee/armor', () => {
        for (const s of squad.soldiers) {
          expect(typeof s.rank).toBe('number');
          expect(typeof s.speed).toBe('number');
          expect(typeof s.melee).toBe('number');
          expect(typeof s.armor).toBe('number');
        }
      });

      it('each soldier range/power is empty string or valid dice notation', () => {
        for (const s of squad.soldiers) {
          const { range, power } = s;
          if (range !== '') {
            const parsed = parseRoll(range);
            expect(parsed.dice).toBeGreaterThanOrEqual(1);
            expect(parsed.sides).toBeGreaterThanOrEqual(1);
          }
          if (power !== '') {
            const parsed = parseRoll(power);
            expect(parsed.dice).toBeGreaterThanOrEqual(1);
            expect(parsed.sides).toBeGreaterThanOrEqual(1);
          }
        }
      });
    });
  }
});
