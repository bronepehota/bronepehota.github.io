import {
  getParent, getSubFactions, isSubFaction, orderedFactions, relationTo,
} from '@/lib/faction-hierarchy';

const F = [
  { id: 'polaris' },
  { id: 'protectorate' },
  { id: 'mercenaries' },
  { id: 'rutenia', parent: 'protectorate' },
  { id: 'dead_fleet', parent: 'polaris' },
];

describe('faction-hierarchy', () => {
  it('getParent returns the parent faction', () => {
    expect(getParent('rutenia', F)?.id).toBe('protectorate');
    expect(getParent('polaris', F)).toBeUndefined();
  });

  it('getSubFactions returns children of a parent', () => {
    expect(getSubFactions('polaris', F).map(f => f.id)).toEqual(['dead_fleet']);
    expect(getSubFactions('protectorate', F).map(f => f.id)).toEqual(['rutenia']);
    expect(getSubFactions('mercenaries', F)).toEqual([]);
  });

  it('isSubFaction is true only for factions with a parent', () => {
    expect(isSubFaction('rutenia', F)).toBe(true);
    expect(isSubFaction('dead_fleet', F)).toBe(true);
    expect(isSubFaction('polaris', F)).toBe(false);
  });

  it('orderedFactions nests each sub-faction right after its parent', () => {
    expect(orderedFactions(F).map(f => f.id)).toEqual([
      'polaris', 'dead_fleet', 'protectorate', 'rutenia', 'mercenaries',
    ]);
  });

  it('orderedFactions puts unknown/custom top-level factions last, orphans at the very end', () => {
    const f = [...F, { id: 'custom_a' }, { id: 'orphan', parent: 'missing' }];
    const ids = orderedFactions(f).map(x => x.id);
    expect(ids).toEqual([
      'polaris', 'dead_fleet', 'protectorate', 'rutenia', 'mercenaries', 'custom_a', 'orphan',
    ]);
  });

  it('relationTo classifies the four relationships', () => {
    expect(relationTo('protectorate', 'protectorate', F)).toBe('own');
    expect(relationTo('rutenia', 'protectorate', F)).toBe('subfaction');
    expect(relationTo('protectorate', 'rutenia', F)).toBe('parent');
    expect(relationTo('mercenaries', 'protectorate', F)).toBe('ally');
    expect(relationTo('polaris', 'rutenia', F)).toBe('ally');
    expect(relationTo('protectorate', undefined, F)).toBe('own');
  });
});
