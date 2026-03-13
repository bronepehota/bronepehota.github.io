import { getDefaultSource, getSource, getAllSources, isValidSource } from '../lib/sources-registry';

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
});
