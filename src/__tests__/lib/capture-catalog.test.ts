import { filterCaptureCatalog, opposingFaction, getCaptureCandidates, CaptureCandidate } from '@/lib/capture-catalog';

const catalog: CaptureCandidate[] = [
  { id: 'm1', name: 'M1', faction: 'polaris', rank: 2, durability_max: 10, ammo_max: 5 },
  { id: 'm2', name: 'M2', faction: 'protectorate', rank: 4, durability_max: 12, ammo_max: 6 },
  { id: 'm3', name: 'M3', faction: 'mercenaries', rank: 1, durability_max: 8, ammo_max: 4 },
];

describe('filterCaptureCatalog', () => {
  it('rank filter (strict): only machines with rank ≤ soldier.rank', () => {
    const r = filterCaptureCatalog(catalog, { soldierRank: 2, strictRank: true });
    expect(r.map(m => m.id).sort()).toEqual(['m1', 'm3']);
  });
  it('no rank filter when strictRank=false', () => {
    const r = filterCaptureCatalog(catalog, { soldierRank: 0, strictRank: false });
    expect(r).toHaveLength(3);
  });
  it('faction filter: only matching faction', () => {
    const r = filterCaptureCatalog(catalog, { soldierRank: 9, strictRank: true, factionFilter: 'protectorate' });
    expect(r.map(m => m.id)).toEqual(['m2']);
  });
  it('null factionFilter = all factions', () => {
    const r = filterCaptureCatalog(catalog, { soldierRank: 9, strictRank: true, factionFilter: null });
    expect(r).toHaveLength(3);
  });
});

describe('opposingFaction', () => {
  it('returns a faction ≠ the army faction', () => {
    const all = ['polaris', 'protectorate', 'mercenaries'];
    expect(opposingFaction('polaris', all)).not.toBe('polaris');
    expect(all).toContain(opposingFaction('polaris', all));
  });
});

describe('getCaptureCandidates', () => {
  it('returns the cross-faction machine catalog with required fields', () => {
    const c = getCaptureCandidates();
    expect(c.length).toBeGreaterThan(0);
    c.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(typeof m.rank).toBe('number');
      expect(typeof m.durability_max).toBe('number');
      expect(typeof m.ammo_max).toBe('number');
    });
  });
});
