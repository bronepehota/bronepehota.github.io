import { getAllUnits, getUnitById, filterUnits } from '@/lib/encyclopedia-utils';

describe('encyclopedia-utils', () => {
  describe('getAllUnits', () => {
    it('returns all squads and machines with type field', async () => {
      const units = await getAllUnits();

      expect(units.length).toBeGreaterThan(0);
      expect(units.every(u => u.type === 'squad' || u.type === 'machine' || u.type === 'орудие')).toBe(true);
    });

    it('includes units from all factions', async () => {
      const units = await getAllUnits();
      const factions = new Set(units.map(u => u.faction));

      expect(factions.has('polaris')).toBe(true);
      expect(factions.has('protectorate')).toBe(true);
      expect(factions.has('mercenaries')).toBe(true);
    });
  });

  describe('getUnitById', () => {
    it('returns squad by id', async () => {
      const unit = await getUnitById('polaris_lineynaya_klon_pehota');

      expect(unit).toBeDefined();
      expect(unit?.id).toBe('polaris_lineynaya_klon_pehota');
      expect(unit?.type).toBe('squad');
    });

    it('returns machine by id', async () => {
      const unit = await getUnitById('demolisher');

      expect(unit).toBeDefined();
      expect(unit?.id).toBe('demolisher');
      expect(unit?.type).toBe('machine');
    });

    it('returns null for non-existent id', async () => {
      const unit = await getUnitById('non_existent_id');

      expect(unit).toBeNull();
    });
  });

  describe('filterUnits', () => {
    it('filters by faction', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, { faction: 'polaris' });

      expect(filtered.every(u => u.faction === 'polaris')).toBe(true);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('filters by type', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, { type: 'squad' });

      expect(filtered.every(u => u.type === 'squad')).toBe(true);
    });

    it('filters by class from encyclopedia', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, { class: 'Линейная пехота' });

      expect(filtered.every(u => u.encyclopedia?.class === 'Линейная пехота')).toBe(true);
    });

    it('searches by name (case insensitive)', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, { search: 'клон' });

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(u =>
        u.name.toLowerCase().includes('клон') ||
        (u.shortName && u.shortName.toLowerCase().includes('клон'))
      )).toBe(true);
    });

    it('combines multiple filters', async () => {
      const units = await getAllUnits();
      const filtered = filterUnits(units, {
        faction: 'polaris',
        type: 'squad'
      });

      expect(filtered.every(u => u.faction === 'polaris' && u.type === 'squad')).toBe(true);
    });
  });
});
