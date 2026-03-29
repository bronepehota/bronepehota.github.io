/**
 * Tests for modifier-storage.ts — custom modifiers CRUD in localStorage.
 */

import {
  getCustomModifiers,
  saveCustomModifiers,
  addCustomBuff,
  removeCustomBuff,
  addCustomDebuff,
  removeCustomDebuff,
  exportCustomModifiers,
  importCustomModifiers,
  isStorageAvailable,
} from '@/lib/editor/modifier-storage';
import type { BuffDefinition, DebuffTemplate } from '@/lib/modifier-types';

// Ensure clean state before each test
beforeEach(() => {
  localStorage.clear();
});

// === getCustomModifiers ===

describe('getCustomModifiers', () => {
  it('should return empty buffs and debuffs when nothing is stored', () => {
    const result = getCustomModifiers();
    expect(result.buffs).toEqual([]);
    expect(result.debuffs).toEqual([]);
  });

  it('should return stored modifiers', () => {
    const data = {
      buffs: [{ id: 'b1', name: 'Test Buff', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' }],
      debuffs: [{ id: 'd1', name: 'Test Debuff', description: '', applyTo: ['soldier'], target: 'speed_multiply', value: 0.5, phase: 'always', duration: 1 }],
    };
    localStorage.setItem('bronepehota_custom_modifiers', JSON.stringify(data));

    const result = getCustomModifiers();
    expect(result.buffs).toHaveLength(1);
    expect(result.debuffs).toHaveLength(1);
  });

  it('should handle corrupted JSON gracefully', () => {
    localStorage.setItem('bronepehota_custom_modifiers', 'not-json{{{');
    const result = getCustomModifiers();
    expect(result.buffs).toEqual([]);
    expect(result.debuffs).toEqual([]);
  });

  it('should handle missing buffs field', () => {
    localStorage.setItem('bronepehota_custom_modifiers', JSON.stringify({ debuffs: [] }));
    const result = getCustomModifiers();
    expect(result.buffs).toEqual([]);
  });

  it('should handle missing debuffs field', () => {
    localStorage.setItem('bronepehota_custom_modifiers', JSON.stringify({ buffs: [] }));
    const result = getCustomModifiers();
    expect(result.debuffs).toEqual([]);
  });
});

// === saveCustomModifiers ===

describe('saveCustomModifiers', () => {
  it('should persist buffs and debuffs to localStorage', () => {
    const data = {
      buffs: [{ id: 'b1', name: 'B1', description: '', applyTo: ['soldier'] as any, target: 'range_bonus' as any, value: 1, phase: 'shot' as any }],
      debuffs: [],
    };
    saveCustomModifiers(data);

    const stored = JSON.parse(localStorage.getItem('bronepehota_custom_modifiers')!);
    expect(stored.buffs).toHaveLength(1);
    expect(stored.debuffs).toHaveLength(0);
  });

  it('should overwrite existing data', () => {
    saveCustomModifiers({ buffs: [{ id: 'old' } as any], debuffs: [] });
    saveCustomModifiers({ buffs: [{ id: 'new' } as any], debuffs: [] });

    const stored = JSON.parse(localStorage.getItem('bronepehota_custom_modifiers')!);
    expect(stored.buffs).toHaveLength(1);
    expect(stored.buffs[0].id).toBe('new');
  });
});

// === addCustomBuff / removeCustomBuff ===

describe('addCustomBuff', () => {
  it('should add a new buff to empty storage', () => {
    const buff: BuffDefinition = {
      id: 'test_buff', name: 'Test', description: 'Desc',
      applyTo: ['soldier'], target: 'range_bonus', value: 2, phase: 'shot',
    };
    addCustomBuff(buff);

    const result = getCustomModifiers();
    expect(result.buffs).toHaveLength(1);
    expect(result.buffs[0].id).toBe('test_buff');
  });

  it('should update existing buff with same ID', () => {
    addCustomBuff({ id: 'b1', name: 'V1', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });
    addCustomBuff({ id: 'b1', name: 'V2', description: 'Updated', applyTo: ['soldier'], target: 'range_bonus', value: 5, phase: 'shot' });

    const result = getCustomModifiers();
    expect(result.buffs).toHaveLength(1);
    expect(result.buffs[0].name).toBe('V2');
    expect(result.buffs[0].value).toBe(5);
  });

  it('should add multiple different buffs', () => {
    addCustomBuff({ id: 'b1', name: 'B1', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });
    addCustomBuff({ id: 'b2', name: 'B2', description: '', applyTo: ['machine'], target: 'armor_bonus', value: 2, phase: 'always' });

    const result = getCustomModifiers();
    expect(result.buffs).toHaveLength(2);
  });
});

describe('removeCustomBuff', () => {
  it('should remove buff by ID', () => {
    addCustomBuff({ id: 'b1', name: 'B1', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });
    addCustomBuff({ id: 'b2', name: 'B2', description: '', applyTo: ['soldier'], target: 'melee_bonus', value: 1, phase: 'melee' });

    removeCustomBuff('b1');
    const result = getCustomModifiers();
    expect(result.buffs).toHaveLength(1);
    expect(result.buffs[0].id).toBe('b2');
  });

  it('should do nothing if buff not found', () => {
    addCustomBuff({ id: 'b1', name: 'B1', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });
    removeCustomBuff('nonexistent');

    expect(getCustomModifiers().buffs).toHaveLength(1);
  });

  it('should handle empty storage gracefully', () => {
    expect(() => removeCustomBuff('anything')).not.toThrow();
  });
});

// === addCustomDebuff / removeCustomDebuff ===

describe('addCustomDebuff', () => {
  it('should add a new debuff', () => {
    const debuff: DebuffTemplate = {
      id: 'test_debuff', name: 'Slow', description: 'Halves speed',
      applyTo: ['soldier'], target: 'speed_multiply', value: 0.5, phase: 'always', duration: 2,
    };
    addCustomDebuff(debuff);

    const result = getCustomModifiers();
    expect(result.debuffs).toHaveLength(1);
    expect(result.debuffs[0].name).toBe('Slow');
  });

  it('should update existing debuff with same ID', () => {
    addCustomDebuff({ id: 'd1', name: 'D1', description: '', applyTo: ['soldier'], target: 'speed_multiply', value: 0.5, phase: 'always', duration: 1 });
    addCustomDebuff({ id: 'd1', name: 'D1-updated', description: 'v2', applyTo: ['soldier'], target: 'speed_multiply', value: 0.3, phase: 'always', duration: 3 });

    const result = getCustomModifiers();
    expect(result.debuffs).toHaveLength(1);
    expect(result.debuffs[0].value).toBe(0.3);
    expect(result.debuffs[0].duration).toBe(3);
  });
});

describe('removeCustomDebuff', () => {
  it('should remove debuff by ID', () => {
    addCustomDebuff({ id: 'd1', name: 'D1', description: '', applyTo: ['soldier'], target: 'speed_multiply', value: 0.5, phase: 'always', duration: 1 });
    removeCustomDebuff('d1');

    expect(getCustomModifiers().debuffs).toHaveLength(0);
  });

  it('should not affect buffs', () => {
    addCustomBuff({ id: 'b1', name: 'B1', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });
    addCustomDebuff({ id: 'd1', name: 'D1', description: '', applyTo: ['soldier'], target: 'speed_multiply', value: 0.5, phase: 'always', duration: 1 });

    removeCustomDebuff('d1');
    expect(getCustomModifiers().buffs).toHaveLength(1);
    expect(getCustomModifiers().debuffs).toHaveLength(0);
  });
});

// === export / import ===

describe('exportCustomModifiers', () => {
  it('should return valid JSON with buffs and debuffs', () => {
    addCustomBuff({ id: 'b1', name: 'B1', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });
    addCustomDebuff({ id: 'd1', name: 'D1', description: '', applyTo: ['soldier'], target: 'speed_multiply', value: 0.5, phase: 'always', duration: 1 });

    const exported = exportCustomModifiers();
    const parsed = JSON.parse(exported);
    expect(parsed.buffs).toHaveLength(1);
    expect(parsed.debuffs).toHaveLength(1);
  });

  it('should export empty arrays when nothing stored', () => {
    const exported = exportCustomModifiers();
    const parsed = JSON.parse(exported);
    expect(parsed.buffs).toEqual([]);
    expect(parsed.debuffs).toEqual([]);
  });
});

describe('importCustomModifiers', () => {
  it('should import new buffs and debuffs', () => {
    const json = JSON.stringify({
      buffs: [{ id: 'imported_b1', name: 'Imported Buff', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 3, phase: 'shot' }],
      debuffs: [{ id: 'imported_d1', name: 'Imported Debuff', description: '', applyTo: ['soldier'], target: 'armor_bonus', value: -1, phase: 'always', duration: 2 }],
    });

    const result = importCustomModifiers(json);
    expect(result.added).toBe(2);
    expect(result.errors).toHaveLength(0);

    const stored = getCustomModifiers();
    expect(stored.buffs.find(b => b.id === 'imported_b1')).toBeDefined();
    expect(stored.debuffs.find(d => d.id === 'imported_d1')).toBeDefined();
  });

  it('should update existing entries with same ID', () => {
    addCustomBuff({ id: 'existing', name: 'Old', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });

    const json = JSON.stringify({
      buffs: [{ id: 'existing', name: 'New', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 5, phase: 'shot' }],
      debuffs: [],
    });

    const result = importCustomModifiers(json);
    expect(result.updated).toBe(1);
    expect(result.added).toBe(0);

    const stored = getCustomModifiers();
    expect(stored.buffs).toHaveLength(1);
    expect(stored.buffs[0].value).toBe(5);
  });

  it('should reject invalid JSON', () => {
    const result = importCustomModifiers('not-valid-json');
    expect(result.errors).toContain('Некорректный JSON');
  });

  it('should reject buffs with missing required fields', () => {
    const json = JSON.stringify({
      buffs: [{ id: '', name: 'No ID' } as any],
      debuffs: [],
    });

    const result = importCustomModifiers(json);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject debuffs with missing required fields', () => {
    const json = JSON.stringify({
      buffs: [],
      debuffs: [{ id: 'has_id' } as any],  // missing name, target
    });

    const result = importCustomModifiers(json);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle mixed valid and invalid entries', () => {
    const json = JSON.stringify({
      buffs: [
        { id: 'valid', name: 'Valid', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' },
        { id: '', name: 'Invalid' } as any,
      ],
      debuffs: [],
    });

    const result = importCustomModifiers(json);
    expect(result.added).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should merge with existing data', () => {
    addCustomBuff({ id: 'existing', name: 'Old', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });

    const json = JSON.stringify({
      buffs: [{ id: 'new_one', name: 'New', description: '', applyTo: ['soldier'], target: 'melee_bonus', value: 2, phase: 'melee' }],
      debuffs: [],
    });

    const result = importCustomModifiers(json);
    expect(result.added).toBe(1);

    const stored = getCustomModifiers();
    expect(stored.buffs).toHaveLength(2); // existing + new_one
  });
});

// === isStorageAvailable ===

describe('isStorageAvailable', () => {
  it('should return true in jsdom environment', () => {
    expect(isStorageAvailable()).toBe(true);
  });
});

// === Cross-cutting: buffs and debuffs are independent ===

describe('buffs and debuffs independence', () => {
  it('adding a buff should not affect debuffs and vice versa', () => {
    addCustomBuff({ id: 'b1', name: 'B1', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' });
    addCustomDebuff({ id: 'd1', name: 'D1', description: '', applyTo: ['soldier'], target: 'speed_multiply', value: 0.5, phase: 'always', duration: 1 });

    removeCustomBuff('b1');
    expect(getCustomModifiers().debuffs).toHaveLength(1);

    removeCustomDebuff('d1');
    expect(getCustomModifiers().buffs).toHaveLength(0);
    expect(getCustomModifiers().debuffs).toHaveLength(0);
  });

  it('import should handle buffs-only payload', () => {
    const result = importCustomModifiers(JSON.stringify({
      buffs: [{ id: 'ib1', name: 'IB1', description: '', applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot' }],
    }));
    expect(result.added).toBe(1);
    expect(getCustomModifiers().debuffs).toEqual([]);
  });

  it('import should handle debuffs-only payload', () => {
    const result = importCustomModifiers(JSON.stringify({
      debuffs: [{ id: 'id1', name: 'ID1', description: '', applyTo: ['soldier'], target: 'speed_multiply', value: 0.5, phase: 'always', duration: 1 }],
    }));
    expect(result.added).toBe(1);
    expect(getCustomModifiers().buffs).toEqual([]);
  });
});
