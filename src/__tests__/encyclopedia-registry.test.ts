import {
  getEncyclopediaUnit,
  getEncyclopediaFaction,
  getUnitsForFaction,
  getFactions,
  getUnitSources,
  isUnitInSource,
  getUnitCostForSource,
  isFactionInSource,
} from '@/lib/encyclopedia-registry';

const POLARIS_SQUAD = 'polaris_lineynaya_klon_pehota';

describe('encyclopedia-registry', () => {
  it('getEncyclopediaUnit returns the unit / undefined', () => {
    const unit = getEncyclopediaUnit(POLARIS_SQUAD);
    expect(unit?.faction).toBe('polaris');
    expect(unit?.type).toBe('squad');
    expect(getEncyclopediaUnit('nope')).toBeUndefined();
  });

  it('getUnitsForFaction returns only that faction, [] for missing', () => {
    const polaris = getUnitsForFaction('polaris');
    expect(polaris.length).toBeGreaterThan(0);
    expect(polaris.every((u) => u.faction === 'polaris')).toBe(true);
    expect(getUnitsForFaction('nope')).toEqual([]);
  });

  it('getFactions returns the four known factions', () => {
    const factions = getFactions();
    expect(factions.map((f) => f.id).sort()).toEqual(['mercenaries', 'polaris', 'protectorate', 'rutenia']);
  });

  it('getEncyclopediaFaction returns the faction / undefined', () => {
    expect(getEncyclopediaFaction('polaris')?.id).toBe('polaris');
    expect(getEncyclopediaFaction('nope')).toBeUndefined();
  });

  it('source availability + cost lookups', () => {
    expect(getUnitSources(POLARIS_SQUAD).map((s) => s.id).sort()).toEqual(['star_system', 'tehnolog']);
    expect(isUnitInSource(POLARIS_SQUAD, 'star_system')).toBe(true);
    expect(isUnitInSource(POLARIS_SQUAD, 'nope')).toBe(false);
    expect(getUnitCostForSource(POLARIS_SQUAD, 'star_system')).toBe(50);
    expect(getUnitCostForSource(POLARIS_SQUAD, 'tehnolog')).toBe(70);
    expect(getUnitCostForSource(POLARIS_SQUAD, 'nope')).toBeUndefined();
    expect(getUnitCostForSource('nope', 'star_system')).toBeUndefined();
  });

  it('isFactionInSource', () => {
    expect(isFactionInSource('polaris', 'star_system')).toBe(true);
    expect(isFactionInSource('polaris', 'nope')).toBe(false);
    expect(isFactionInSource('nope', 'star_system')).toBe(false);
  });
});
