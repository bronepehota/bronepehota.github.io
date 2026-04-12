import { getEffectColor, getEffectStyles, COLOR_STYLE_MAP } from '@/lib/effect-colors';

describe('getEffectColor', () => {
  test('should return deterministic color for same ID', () => {
    const a = getEffectColor('aim_boost');
    const b = getEffectColor('aim_boost');
    expect(a.name).toBe(b.name);
    expect(a.hex).toBe(b.hex);
  });

  test('should return same color across multiple calls', () => {
    const results = Array.from({ length: 10 }, () => getEffectColor('mechanic'));
    expect(new Set(results.map(r => r.name)).size).toBe(1);
  });

  test('should return different colors for different IDs (typically)', () => {
    const ids = ['aim_boost', 'armor_up', 'slow', 'stun', 'rage', 'medkit'];
    const colors = ids.map(id => getEffectColor(id).name);
    // With 12 palette colors and 6 IDs, expect at least 4 distinct colors
    expect(new Set(colors).size).toBeGreaterThanOrEqual(4);
  });

  test('should return a valid palette entry', () => {
    const color = getEffectColor('any_id');
    expect(color).toHaveProperty('name');
    expect(color).toHaveProperty('hex');
    expect(COLOR_STYLE_MAP[color.name]).toBeDefined();
  });

  test('should handle empty string', () => {
    const color = getEffectColor('');
    expect(COLOR_STYLE_MAP[color.name]).toBeDefined();
  });

  test('should handle IDs with special characters', () => {
    const color = getEffectColor('buff_123_abc-xyz');
    expect(COLOR_STYLE_MAP[color.name]).toBeDefined();
  });

  test('should handle very long IDs', () => {
    const longId = 'x'.repeat(1000);
    const color = getEffectColor(longId);
    expect(COLOR_STYLE_MAP[color.name]).toBeDefined();
  });

  test('similar IDs should not always collide', () => {
    const colors = new Set<string>();
    for (let i = 0; i < 12; i++) {
      colors.add(getEffectColor(`effect_${i}`).name);
    }
    // 12 IDs against 12 palette colors — expect good distribution (at least 6 distinct)
    expect(colors.size).toBeGreaterThanOrEqual(6);
  });
});

describe('getEffectStyles', () => {
  test('should return full style object for an effect ID', () => {
    const styles = getEffectStyles('aim_boost');
    expect(styles).toHaveProperty('border');
    expect(styles).toHaveProperty('bg');
    expect(styles).toHaveProperty('icon');
    expect(styles).toHaveProperty('label');
    expect(styles).toHaveProperty('glow');
  });

  test('should return styles consistent with getEffectColor', () => {
    const color = getEffectColor('mechanic');
    const styles = getEffectStyles('mechanic');
    // Border should contain the color name
    expect(styles.border).toContain(color.name);
    expect(styles.icon).toContain(color.name);
  });

  test('should be deterministic', () => {
    const a = getEffectStyles('test_effect');
    const b = getEffectStyles('test_effect');
    expect(a).toEqual(b);
  });

  test('glow should contain rgba for subtle shadow', () => {
    const styles = getEffectStyles('any_effect');
    expect(styles.glow).toContain('rgba(');
    expect(styles.glow).toContain('0.3)');
  });
});

describe('COLOR_STYLE_MAP', () => {
  const paletteNames = [
    'emerald', 'amber', 'cyan', 'rose', 'violet', 'orange',
    'sky', 'pink', 'lime', 'fuchsia', 'teal', 'red',
  ];

  test('should have entries for all 12 palette colors', () => {
    for (const name of paletteNames) {
      expect(COLOR_STYLE_MAP[name]).toBeDefined();
      expect(COLOR_STYLE_MAP[name].border).toBeTruthy();
      expect(COLOR_STYLE_MAP[name].bg).toBeTruthy();
      expect(COLOR_STYLE_MAP[name].icon).toBeTruthy();
      expect(COLOR_STYLE_MAP[name].label).toBeTruthy();
      expect(COLOR_STYLE_MAP[name].glow).toBeTruthy();
    }
  });

  test('should have exactly 12 entries', () => {
    expect(Object.keys(COLOR_STYLE_MAP)).toHaveLength(12);
  });
});
