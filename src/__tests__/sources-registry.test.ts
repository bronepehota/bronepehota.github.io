import { getDefaultSource, getSource, getAllSources, isValidSource, getSourceUnitCost } from '../lib/sources-registry';

describe('sources-registry', () => {
  test('getDefaultSource returns star_system', () => {
    const result = getDefaultSource();
    expect(result).toBe('star_system');
  });

  test('getSource returns valid data for existing source', () => {
    const result = getSource('star_system');
    expect(result).not.toBeNull();
    expect(result?.source.id).toBe('star_system');
    expect(result?.factions).toBeDefined();
    expect(result?.squads).toBeDefined();
    expect(result?.machines).toBeDefined();
  });

  test('getSource returns fallback for invalid source', () => {
    const result = getSource('nonexistent');
    expect(result).not.toBeNull();
    expect(result?.source.id).toBe('star_system');
  });

  test('isValidSource validates source IDs', () => {
    expect(isValidSource('star_system')).toBe(true);
    expect(isValidSource('tehnolog')).toBe(true);
    expect(isValidSource('nonexistent')).toBe(false);
  });

  test('getAllSources returns all registered sources', () => {
    const result = getAllSources();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].name).toBeDefined();
  });

  describe('getSourceUnitCost (single source of truth for cost)', () => {
    test('reads cost from the source army list', () => {
      // Тандер is a star_system machine with inline cost 620.
      expect(getSourceUnitCost('star_system', 'thunder')).toBe(620);
    });

    test('returns undefined for a unit not in that source', () => {
      // Тандер is not in the tehnolog_2026 (empty) source.
      expect(getSourceUnitCost('tehnolog_2026', 'thunder')).toBeUndefined();
    });

    test('does NOT fall back to default for an invalid source', () => {
      expect(getSourceUnitCost('nonexistent_source', 'thunder')).toBeUndefined();
    });

    test('returns undefined for an unknown unit', () => {
      expect(getSourceUnitCost('star_system', 'nonexistent_unit')).toBeUndefined();
    });
  });
});
