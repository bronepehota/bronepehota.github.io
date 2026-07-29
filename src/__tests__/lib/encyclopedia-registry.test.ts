import {
  getEncyclopediaUnit,
  getEncyclopediaFaction,
  getUnitsForFaction,
  getUnitsByType,
  getFactions,
  getAllUnits,
  getUnitSources,
  isUnitInSource,
  getUnitCostForSource,
  isFactionInSource,
} from '@/lib/encyclopedia-registry';

describe('encyclopedia-registry', () => {
  describe('getFactions', () => {
    it('returns all factions', () => {
      const factions = getFactions();
      expect(factions.length).toBeGreaterThan(0);
      for (const f of factions) {
        expect(f.id).toBeTruthy();
        expect(f.name).toBeTruthy();
      }
    });
    it('returns exactly the 5 known factions including rutenia and dead_fleet', () => {
      const factions = getFactions();
      expect(factions.map((f) => f.id).sort()).toEqual(['dead_fleet', 'mercenaries', 'polaris', 'protectorate', 'rutenia']);
    });
  });

  describe('getEncyclopediaFaction', () => {
    it('returns faction by id', () => {
      const factions = getFactions();
      const first = factions[0];
      const result = getEncyclopediaFaction(first.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(first.id);
    });

    it('returns undefined for unknown faction', () => {
      expect(getEncyclopediaFaction('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllUnits', () => {
    it('returns all encyclopedia units', () => {
      const units = getAllUnits();
      expect(units.length).toBeGreaterThan(0);
      for (const u of units) {
        expect(u.id).toBeTruthy();
        expect(u.name).toBeTruthy();
        expect(['squad', 'machine', 'орудие']).toContain(u.type);
      }
    });
  });

  describe('getEncyclopediaUnit', () => {
    it('returns unit by id', () => {
      const units = getAllUnits();
      const first = units[0];
      const result = getEncyclopediaUnit(first.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(first.id);
    });

    it('returns undefined for unknown unit', () => {
      expect(getEncyclopediaUnit('nonexistent_unit')).toBeUndefined();
    });
  });

  describe('getUnitsForFaction', () => {
    it('returns units matching faction', () => {
      const factions = getFactions();
      const factionId = factions[0].id;
      const units = getUnitsForFaction(factionId);
      expect(units.length).toBeGreaterThan(0);
      for (const u of units) {
        expect(u.faction).toBe(factionId);
      }
    });

    it('returns empty array for unknown faction', () => {
      expect(getUnitsForFaction('nonexistent')).toEqual([]);
    });
  });

  describe('getUnitsByType', () => {
    it('returns only squads', () => {
      const squads = getUnitsByType('squad');
      expect(squads.length).toBeGreaterThan(0);
      for (const u of squads) {
        expect(u.type).toBe('squad');
      }
    });

    it('returns only machines', () => {
      const machines = getUnitsByType('machine');
      expect(machines.length).toBeGreaterThan(0);
      for (const u of machines) {
        expect(u.type).toBe('machine');
      }
    });
  });

  describe('getUnitSources', () => {
    it('returns sources for a unit that has them', () => {
      const units = getAllUnits();
      const unitWithSources = units.find(u => u.sources && u.sources.length > 0);
      expect(unitWithSources).toBeDefined();
      const sources = getUnitSources(unitWithSources!.id);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0].id).toBeTruthy();
      expect(typeof sources[0].cost).toBe('number');
    });

    it('returns empty array for unknown unit', () => {
      expect(getUnitSources('nonexistent')).toEqual([]);
    });
  });

  describe('isUnitInSource', () => {
    it('returns true when unit is in source', () => {
      const units = getAllUnits();
      const unitWithSources = units.find(u => u.sources && u.sources.length > 0);
      expect(unitWithSources).toBeDefined();
      const sourceId = unitWithSources!.sources[0].id;
      expect(isUnitInSource(unitWithSources!.id, sourceId)).toBe(true);
    });

    it('returns false for wrong source', () => {
      const units = getAllUnits();
      const unitWithSources = units.find(u => u.sources && u.sources.length > 0);
      expect(unitWithSources).toBeDefined();
      expect(isUnitInSource(unitWithSources!.id, 'nonexistent_source')).toBe(false);
    });

    it('returns false for unknown unit', () => {
      expect(isUnitInSource('nonexistent', 'any_source')).toBe(false);
    });
  });

  describe('getUnitCostForSource', () => {
    it('returns cost for valid source', () => {
      const units = getAllUnits();
      const unitWithSources = units.find(u => u.sources && u.sources.length > 0);
      expect(unitWithSources).toBeDefined();
      const source = unitWithSources!.sources[0];
      const cost = getUnitCostForSource(unitWithSources!.id, source.id);
      expect(cost).toBe(source.cost);
    });

    it('returns undefined for wrong source', () => {
      const units = getAllUnits();
      const unit = units[0];
      expect(getUnitCostForSource(unit.id, 'nonexistent_source')).toBeUndefined();
    });

    it('returns undefined for unknown unit', () => {
      expect(getUnitCostForSource('nonexistent', 'any_source')).toBeUndefined();
    });
  });

  describe('isFactionInSource', () => {
    it('returns true when faction is in source', () => {
      const factions = getFactions();
      const faction = factions.find(f => f.sources && f.sources.length > 0);
      expect(faction).toBeDefined();
      expect(isFactionInSource(faction!.id, faction!.sources[0])).toBe(true);
    });

    it('returns false for wrong source', () => {
      const factions = getFactions();
      const faction = factions[0];
      expect(isFactionInSource(faction.id, 'nonexistent_source')).toBe(false);
    });

    it('returns false for unknown faction', () => {
      expect(isFactionInSource('nonexistent', 'any_source')).toBe(false);
    });
  });
});
