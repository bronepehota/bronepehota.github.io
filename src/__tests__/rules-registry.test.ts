import { rulesRegistry, isValidRulesVersion, getDefaultRulesVersion, getRulesVersion, getAllRulesVersions } from '@/lib/rules-registry';

describe('Rules Registry', () => {
  test('getDefaultRulesVersion returns tehnolog', () => {
    expect(getDefaultRulesVersion()).toBe('tehnolog');
  });

  test('isValidRulesVersion validates correctly', () => {
    expect(isValidRulesVersion('tehnolog')).toBe(true);
    expect(isValidRulesVersion('community_star_system')).toBe(true);
    expect(isValidRulesVersion('invalid')).toBe(false);
  });

  test('rulesRegistry contains all versions', () => {
    expect(Object.keys(rulesRegistry)).toEqual(['tehnolog', 'community_star_system']);
  });

  test('getRulesVersion returns correct version', () => {
    const tehnolog = getRulesVersion('tehnolog');
    expect(tehnolog.id).toBe('tehnolog');
    expect(tehnolog.name).toBe('Технолог');

    const community = getRulesVersion('community_star_system');
    expect(community.id).toBe('community_star_system');
    expect(community.name).toBe('Правила от Сообщества Star System');
  });

  test('getAllRulesVersions returns all versions', () => {
    const versions = getAllRulesVersions();
    expect(versions).toHaveLength(2);
    expect(versions.map(v => v.id)).toEqual(expect.arrayContaining(['tehnolog', 'community_star_system']));
  });

  test('each version has required functions', () => {
    Object.values(rulesRegistry).forEach((version) => {
      expect(version).toHaveProperty('calculateHit');
      expect(version).toHaveProperty('calculateDamage');
      expect(version).toHaveProperty('calculateMelee');
      expect(typeof version.calculateHit).toBe('function');
      expect(typeof version.calculateDamage).toBe('function');
      expect(typeof version.calculateMelee).toBe('function');
    });
  });
});

describe('Extensibility Verification', () => {
  test('each rules version exports all required functions', () => {
    Object.values(rulesRegistry).forEach((version) => {
      expect(version).toHaveProperty('calculateHit');
      expect(version).toHaveProperty('calculateDamage');
      expect(version).toHaveProperty('calculateMelee');
    });
  });

  test('getAllRulesVersions returns all registered versions', () => {
    const versions = getAllRulesVersions();
    expect(versions.length).toBeGreaterThan(0);
    expect(versions.every(v => Object.values(rulesRegistry).includes(v)));
  });
});

describe('Special Effects (Community Rules)', () => {
  const community = rulesRegistry.community_star_system;
  const tehnolog = rulesRegistry.tehnolog;

  test('Community supports special effects, Tehnolog does not', () => {
    expect(community.supportsSpecialEffects).toBe(true);
    expect(tehnolog.supportsSpecialEffects).toBe(false);
  });

  test('Community parses AoE effect from string', () => {
    const result = community.calculateDamage('4D20', 3, 'none', 'Взрыв 2ш - 1D20');
    expect(result.special).toBeDefined();
    expect(result.special?.type).toBe('aoe');
    expect(result.special?.description).toContain('2ш');
  });

  test('Community parses Repair effect from string', () => {
    const result = community.calculateDamage('1D20', 3, 'none', 'Ремонт 2 повреждения');
    expect(result.special).toBeDefined();
    expect(result.special?.type).toBe('repair');
    expect(result.special?.additionalDamage).toBe(-2);
  });

  test('Community parses Burst effect from string', () => {
    const result = community.calculateDamage('1D6', 3, 'none', '3 выстрела в 3х направлениях');
    expect(result.special).toBeDefined();
    expect(result.special?.type).toBe('burst');
    expect(result.special?.targets).toHaveLength(3);
  });

  test('Tehnolog ignores special effects', () => {
    const result = tehnolog.calculateDamage('4D20', 3, 'none', 'Взрыв 2ш - 1D20');
    expect(result.special).toBeUndefined();
  });

  test('Community calculates normal damage without special effects', () => {
    const result = community.calculateDamage('2D12', 5, 'none');
    expect(result.damage).toBeGreaterThanOrEqual(0);
    expect(result.rolls).toHaveLength(2);
    expect(result.special).toBeUndefined();
  });
});
