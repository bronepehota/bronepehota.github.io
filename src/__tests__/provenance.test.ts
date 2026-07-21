import {
  resolveUnitProvenance,
  resolveFactionProvenance,
  resolveMissionProvenance,
  isProvenanceUniform,
} from '../lib/provenance';
import type { EncyclopediaUnit, EncyclopediaFaction } from '../lib/encyclopedia-registry';
import type { Mission } from '../lib/mission-types';
import type { Provenance } from '../lib/provenance';

// Minimal factory helpers — the resolvers read only id / faction / provenance.
const unit = (faction: string, provenance?: Partial<Provenance>): EncyclopediaUnit =>
  ({ faction, provenance } as unknown as EncyclopediaUnit);
const faction = (id: string, provenance?: Partial<Provenance>): EncyclopediaFaction =>
  ({ id, provenance } as unknown as EncyclopediaFaction);
const mission = (provenance?: Partial<Provenance>): Mission =>
  ({ id: 'm', provenance } as unknown as Mission);

describe('provenance resolver', () => {
  describe('resolveUnitProvenance', () => {
    test('default non-rutenia unit: origin tehnolog, loreAuthor star_system', () => {
      expect(resolveUnitProvenance(unit('polaris'))).toEqual({
        origin: 'tehnolog',
        loreAuthor: 'star_system',
      });
    });

    test('rutenia unit: both star_system (community creation)', () => {
      expect(resolveUnitProvenance(unit('rutenia'))).toEqual({
        origin: 'star_system',
        loreAuthor: 'star_system',
      });
    });

    test('explicit origin override only', () => {
      expect(resolveUnitProvenance(unit('polaris', { origin: 'star_system' }))).toEqual({
        origin: 'star_system',
        loreAuthor: 'star_system',
      });
    });

    test('explicit loreAuthor override only', () => {
      expect(resolveUnitProvenance(unit('polaris', { loreAuthor: 'tehnolog' }))).toEqual({
        origin: 'tehnolog',
        loreAuthor: 'tehnolog',
      });
    });

    test('explicit override of both axes', () => {
      expect(
        resolveUnitProvenance(unit('polaris', { origin: 'star_system', loreAuthor: 'tehnolog' })),
      ).toEqual({ origin: 'star_system', loreAuthor: 'tehnolog' });
    });

    test('rutenia origin cannot be accidentally left as tehnolog when only loreAuthor overridden', () => {
      // rutenia origin default is star_system; overriding loreAuthor leaves origin intact.
      expect(resolveUnitProvenance(unit('rutenia', { loreAuthor: 'tehnolog' }))).toEqual({
        origin: 'star_system',
        loreAuthor: 'tehnolog',
      });
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
});
