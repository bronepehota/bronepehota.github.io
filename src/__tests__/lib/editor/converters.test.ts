import { mergeWithBaseSource, getCustomSourceData } from '@/lib/editor/converters';
import type { CustomSource } from '@/lib/editor/types';
import type { SourceData } from '@/lib/types';

// Mock base source data
const mockBaseSource: SourceData = {
  source: { id: 'base_source', name: 'Base', description: 'Base source', version: '1.0' },
  factions: [
    { id: 'faction_a', name: 'Faction A', color: '#ff0000', description: '', homeWorld: '', motto: '' },
    { id: 'faction_b', name: 'Faction B', color: '#00ff00', description: '', homeWorld: '', motto: '' },
  ],
  squads: [
    { id: 'squad_1', name: 'Squad 1', faction: 'faction_a', cost: 50, soldiers: [] },
    { id: 'squad_2', name: 'Squad 2', faction: 'faction_a', cost: 75, soldiers: [] },
    { id: 'squad_3', name: 'Squad 3', faction: 'faction_b', cost: 100, soldiers: [] },
  ],
  machines: [
    { id: 'machine_1', name: 'Machine 1', faction: 'faction_a', cost: 150, rank: 2, fire_rate: 1, ammo_max: 10, durability_max: 10, speed_sectors: [], weapons: [] },
    { id: 'machine_2', name: 'Machine 2', faction: 'faction_b', cost: 200, rank: 3, fire_rate: 2, ammo_max: 20, durability_max: 15, speed_sectors: [], weapons: [] },
  ],
};

function makeCustomSource(overrides: Partial<CustomSource> = {}): CustomSource {
  return {
    id: 'custom_source',
    name: 'Custom Source',
    description: 'Test custom source',
    version: '1.0',
    baseSource: 'base_source',
    factions: [],
    squads: [],
    machines: [],
    hiddenUnits: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mergeWithBaseSource', () => {
  test('should include all base units when hiddenUnits is empty', () => {
    const custom = makeCustomSource({ hiddenUnits: [] });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.squads).toHaveLength(3);
    expect(result.machines).toHaveLength(2);
  });

  test('should include all base units when hiddenUnits is undefined', () => {
    const custom = makeCustomSource({ hiddenUnits: undefined });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.squads).toHaveLength(3);
    expect(result.machines).toHaveLength(2);
  });

  test('should exclude squads listed in hiddenUnits', () => {
    const custom = makeCustomSource({ hiddenUnits: ['squad_1', 'squad_3'] });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.squads).toHaveLength(1);
    expect(result.squads[0].id).toBe('squad_2');
  });

  test('should exclude machines listed in hiddenUnits', () => {
    const custom = makeCustomSource({ hiddenUnits: ['machine_1'] });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.machines).toHaveLength(1);
    expect(result.machines[0].id).toBe('machine_2');
  });

  test('should exclude both squads and machines from hiddenUnits', () => {
    const custom = makeCustomSource({ hiddenUnits: ['squad_1', 'machine_2'] });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.squads).toHaveLength(2);
    expect(result.squads.map(s => s.id).sort()).toEqual(['squad_2', 'squad_3']);
    expect(result.machines).toHaveLength(1);
    expect(result.machines[0].id).toBe('machine_1');
  });

  test('should ignore hiddenUnits IDs that do not match any unit', () => {
    const custom = makeCustomSource({ hiddenUnits: ['nonexistent_squad', 'ghost_machine'] });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.squads).toHaveLength(3);
    expect(result.machines).toHaveLength(2);
  });

  test('should merge custom squads and still respect hiddenUnits', () => {
    const custom = makeCustomSource({
      squads: [
        { id: 'custom_squad', name: 'Custom Squad', faction: 'faction_a', cost: 60, soldiers: [] } as any,
      ],
      hiddenUnits: ['squad_1'],
    });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    // squad_1 hidden, squad_2 and squad_3 remain, plus custom_squad
    expect(result.squads).toHaveLength(3);
    const ids = result.squads.map(s => s.id).sort();
    expect(ids).toEqual(['custom_squad', 'squad_2', 'squad_3']);
  });

  test('should merge custom machines and still respect hiddenUnits', () => {
    const custom = makeCustomSource({
      machines: [
        { id: 'custom_machine', name: 'Custom Machine', faction: 'faction_a', cost: 180, durability_max: 12, speed_sectors: [], weapons: [] } as any,
      ],
      hiddenUnits: ['machine_1'],
    });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.machines).toHaveLength(2);
    const ids = result.machines.map(m => m.id).sort();
    expect(ids).toEqual(['custom_machine', 'machine_2']);
  });

  test('should hide all base squads', () => {
    const custom = makeCustomSource({ hiddenUnits: ['squad_1', 'squad_2', 'squad_3'] });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.squads).toHaveLength(0);
    expect(result.machines).toHaveLength(2);
  });

  test('should hide all base machines', () => {
    const custom = makeCustomSource({ hiddenUnits: ['machine_1', 'machine_2'] });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.squads).toHaveLength(3);
    expect(result.machines).toHaveLength(0);
  });

  test('should preserve custom squad overriding base squad with same ID (not hidden)', () => {
    const custom = makeCustomSource({
      squads: [
        { id: 'squad_1', name: 'Modified Squad 1', faction: 'faction_a', cost: 99, soldiers: [] } as any,
      ],
      hiddenUnits: [],
    });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    const squad1 = result.squads.find(s => s.id === 'squad_1');
    expect(squad1).toBeDefined();
    expect(squad1!.name).toBe('Modified Squad 1');
    expect(squad1!.cost).toBe(99);
  });

  test('should hide squad even if custom overrides it', () => {
    const custom = makeCustomSource({
      squads: [
        { id: 'squad_1', name: 'Modified Squad 1', faction: 'faction_a', cost: 99, soldiers: [] } as any,
      ],
      hiddenUnits: ['squad_1'],
    });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.squads.find(s => s.id === 'squad_1')).toBeUndefined();
  });

  test('should preserve factions regardless of hiddenUnits', () => {
    const custom = makeCustomSource({ hiddenUnits: ['squad_1', 'machine_1'] });
    const result = mergeWithBaseSource(custom, mockBaseSource);

    expect(result.factions).toHaveLength(2);
  });
});

describe('getCustomSourceData', () => {
  test('should use mergeWithBaseSource when baseSource is set', () => {
    const custom = makeCustomSource({ hiddenUnits: ['squad_1'] });
    const result = getCustomSourceData(custom, () => mockBaseSource);

    expect(result.squads).toHaveLength(2);
    expect(result.squads.find(s => s.id === 'squad_1')).toBeUndefined();
  });

  test('should fall back to convertToSourceData when base source not found', () => {
    const custom = makeCustomSource({ baseSource: 'nonexistent' });
    const result = getCustomSourceData(custom, () => null);

    // Should still return data (from custom source directly)
    expect(result).toBeDefined();
    expect(result.source.id).toBe('custom_source');
  });

  test('should use convertToSourceData when baseSource is null', () => {
    const custom = makeCustomSource({
      baseSource: null,
      squads: [
        { id: 'solo_squad', name: 'Solo', faction: 'faction_a', cost: 50, soldiers: [] } as any,
      ],
    });
    const result = getCustomSourceData(custom, () => mockBaseSource);

    expect(result.squads).toHaveLength(1);
    expect(result.squads[0].id).toBe('solo_squad');
  });
});
