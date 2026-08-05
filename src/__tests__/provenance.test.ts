import {
  resolveUnitProvenance,
  resolveFactionProvenance,
  resolveMissionProvenance,
  isProvenanceUniform,
  isAlternativeVersion,
} from '../lib/provenance';
import type { EncyclopediaUnit, EncyclopediaFaction } from '../lib/encyclopedia-registry';
import type { Mission } from '../lib/mission-types';
import type { Provenance } from '../lib/provenance';

// Minimal factory helpers — the resolvers read id / faction / sources / type / provenance.
const unit = (
  faction: string,
  provenance?: Partial<Provenance>,
  opts: { sources?: string[]; type?: string } = {},
): EncyclopediaUnit =>
  ({
    faction,
    provenance,
    sources: (opts.sources ?? []).map((id) => ({ id })),
    type: opts.type,
  } as unknown as EncyclopediaUnit);
const faction = (id: string, provenance?: Partial<Provenance>): EncyclopediaFaction =>
  ({ id, provenance } as unknown as EncyclopediaFaction);
const mission = (provenance?: Partial<Provenance>): Mission =>
  ({ id: 'm', provenance } as unknown as Mission);

describe('provenance resolver', () => {
  describe('resolveUnitProvenance', () => {
    test('official unit (in the tehnolog army list): both tehnolog', () => {
      expect(resolveUnitProvenance(unit('polaris', undefined, { sources: ['tehnolog', 'star_system'] }))).toEqual({
        origin: 'tehnolog',
        loreAuthor: 'tehnolog',
      });
    });

    test('community unit (star_system list only): both star_system', () => {
      expect(resolveUnitProvenance(unit('polaris', undefined, { sources: ['star_system'] }))).toEqual({
        origin: 'star_system',
        loreAuthor: 'star_system',
      });
    });

    test('rutenia unit: both star_system (community creation)', () => {
      expect(resolveUnitProvenance(unit('rutenia'))).toEqual({
        origin: 'star_system',
        loreAuthor: 'star_system',
      });
    });

    test('explicit origin override on an official unit', () => {
      expect(resolveUnitProvenance(unit('polaris', { origin: 'star_system' }, { sources: ['tehnolog'] }))).toEqual({
        origin: 'star_system',
        loreAuthor: 'tehnolog',
      });
    });

    test('explicit loreAuthor override on a community unit', () => {
      expect(resolveUnitProvenance(unit('polaris', { loreAuthor: 'tehnolog' }, { sources: ['star_system'] }))).toEqual({
        origin: 'star_system',
        loreAuthor: 'tehnolog',
      });
    });

    test('explicit override of both axes', () => {
      expect(
        resolveUnitProvenance(unit('polaris', { origin: 'star_system', loreAuthor: 'tehnolog' }, { sources: ['tehnolog'] })),
      ).toEqual({ origin: 'star_system', loreAuthor: 'tehnolog' });
    });

    test('rutenia origin cannot be accidentally left as tehnolog when only loreAuthor overridden', () => {
      // rutenia origin default is star_system; overriding loreAuthor leaves origin intact.
      expect(resolveUnitProvenance(unit('rutenia', { loreAuthor: 'tehnolog' }))).toEqual({
        origin: 'star_system',
        loreAuthor: 'tehnolog',
      });
    });

    test('machine: both tehnolog (official техника, regardless of faction)', () => {
      const m = unit('polaris', undefined, { type: 'machine' });
      expect(resolveUnitProvenance(m)).toEqual({ origin: 'tehnolog', loreAuthor: 'tehnolog' });
    });

    test('орудие is treated like a machine (tehnolog)', () => {
      const o = unit('polaris', undefined, { type: 'орудие' });
      expect(resolveUnitProvenance(o)).toEqual({ origin: 'tehnolog', loreAuthor: 'tehnolog' });
    });

    test('machine explicit provenance overrides the tehnolog default per-axis', () => {
      const m = unit('polaris', { loreAuthor: 'star_system' }, { type: 'machine' });
      expect(resolveUnitProvenance(m)).toEqual({ origin: 'tehnolog', loreAuthor: 'star_system' });
    });
  });

  describe('resolveFactionProvenance', () => {
    test('default non-rutenia faction: origin tehnolog, loreAuthor star_system', () => {
      expect(resolveFactionProvenance(faction('polaris'))).toEqual({
        origin: 'tehnolog',
        loreAuthor: 'star_system',
      });
    });

    test('rutenia faction: both star_system', () => {
      expect(resolveFactionProvenance(faction('rutenia'))).toEqual({
        origin: 'star_system',
        loreAuthor: 'star_system',
      });
    });

    test('dead_fleet faction: both universestarsys (Звёздные Системы creation)', () => {
      expect(resolveFactionProvenance(faction('dead_fleet'))).toEqual({
        origin: 'universestarsys',
        loreAuthor: 'universestarsys',
      });
    });

    test('override loreAuthor to tehnolog (verbatim official lore)', () => {
      expect(resolveFactionProvenance(faction('protectorate', { loreAuthor: 'tehnolog' }))).toEqual({
        origin: 'tehnolog',
        loreAuthor: 'tehnolog',
      });
    });
  });

  describe('resolveMissionProvenance', () => {
    test('default mission: both tehnolog (Cerber scenarios are official)', () => {
      expect(resolveMissionProvenance(mission())).toEqual({
        origin: 'tehnolog',
        loreAuthor: 'tehnolog',
      });
    });

    test('override origin to star_system (community mission)', () => {
      expect(resolveMissionProvenance(mission({ origin: 'star_system' }))).toEqual({
        origin: 'star_system',
        loreAuthor: 'tehnolog',
      });
    });
  });

  describe('isProvenanceUniform', () => {
    test('true when origin === loreAuthor', () => {
      expect(isProvenanceUniform({ origin: 'tehnolog', loreAuthor: 'tehnolog' })).toBe(true);
      expect(isProvenanceUniform({ origin: 'star_system', loreAuthor: 'star_system' })).toBe(true);
    });

    test('false when axes differ', () => {
      expect(isProvenanceUniform({ origin: 'tehnolog', loreAuthor: 'star_system' })).toBe(false);
      expect(isProvenanceUniform({ origin: 'star_system', loreAuthor: 'tehnolog' })).toBe(false);
    });
  });

  describe('isAlternativeVersion', () => {
    test('false when origin is tehnolog (official content)', () => {
      expect(isAlternativeVersion({ origin: 'tehnolog', loreAuthor: 'tehnolog' })).toBe(false);
      // Even community-written lore on an official concept is NOT «АВБ» — the minis/concept
      // are still Технолог's; only the prose is community.
      expect(isAlternativeVersion({ origin: 'tehnolog', loreAuthor: 'star_system' })).toBe(false);
    });

    test('true when origin is a community source (alternative concept/minis)', () => {
      expect(isAlternativeVersion({ origin: 'star_system', loreAuthor: 'star_system' })).toBe(true);
      expect(isAlternativeVersion({ origin: 'universestarsys', loreAuthor: 'universestarsys' })).toBe(true);
      // Community concept regardless of who wrote the lore.
      expect(isAlternativeVersion({ origin: 'star_system', loreAuthor: 'ai' })).toBe(true);
      // «avb» — generic alternative-version content (no named community) is also alternative.
      expect(isAlternativeVersion({ origin: 'avb', loreAuthor: 'avb' })).toBe(true);
    });
  });

  describe('resolveUnitProvenance — avb override', () => {
    test('explicit avb provenance on a star_system-list unit yields avb/avb', () => {
      expect(
        resolveUnitProvenance(unit('polaris', { origin: 'avb', loreAuthor: 'avb' }, { sources: ['star_system'] })),
      ).toEqual({ origin: 'avb', loreAuthor: 'avb' });
    });
  });
});
