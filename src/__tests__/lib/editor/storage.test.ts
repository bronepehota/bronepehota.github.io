/**
 * Tests for CustomSourcesStorage
 */

import { CustomSourcesStorage } from '@/lib/editor/storage';
import { CustomSource } from '@/lib/editor/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Setup
beforeAll(() => {
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

beforeEach(() => {
  localStorageMock.clear();
});

describe('CustomSourcesStorage', () => {
  describe('getAll', () => {
    it('returns empty array when no sources', () => {
      const storage = new CustomSourcesStorage();
      expect(storage.getAll()).toEqual([]);
    });

    it('returns stored sources', () => {
      const storage = new CustomSourcesStorage();
      const source: CustomSource = {
        id: 'custom_test123',
        name: 'Test Source',
        description: 'Test description',
        version: '1.0',
        baseSource: null,
        factions: [],
        squads: [],
        machines: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };

      storage.save(source);
      const sources = storage.getAll();

      expect(sources).toHaveLength(1);
      expect(sources[0].id).toBe('custom_test123');
    });
  });

  describe('getById', () => {
    it('returns null for non-existent source', () => {
      const storage = new CustomSourcesStorage();
      expect(storage.getById('nonexistent')).toBeNull();
    });

    it('returns source by id', () => {
      const storage = new CustomSourcesStorage();
      const source: CustomSource = {
        id: 'custom_test456',
        name: 'Test Source 2',
        description: 'Another test',
        version: '1.0',
        baseSource: null,
        factions: [],
        squads: [],
        machines: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };

      storage.save(source);
      const found = storage.getById('custom_test456');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Test Source 2');
    });
  });

  describe('save', () => {
    it('creates new source', () => {
      const storage = new CustomSourcesStorage();
      const source: CustomSource = {
        id: 'custom_new',
        name: 'New Source',
        description: 'Brand new',
        version: '1.0',
        baseSource: null,
        factions: [],
        squads: [],
        machines: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };

      storage.save(source);

      expect(storage.getAll()).toHaveLength(1);
    });

    it('updates existing source', () => {
      const storage = new CustomSourcesStorage();
      const source: CustomSource = {
        id: 'custom_update',
        name: 'Original Name',
        description: 'Original',
        version: '1.0',
        baseSource: null,
        factions: [],
        squads: [],
        machines: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };

      storage.save(source);

      // Update
      const updated: CustomSource = {
        ...source,
        name: 'Updated Name',
        updatedAt: '2026-03-15T01:00:00Z',
      };

      storage.save(updated);

      const found = storage.getById('custom_update');
      expect(found?.name).toBe('Updated Name');
      expect(storage.getAll()).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('deletes source by id', () => {
      const storage = new CustomSourcesStorage();
      const source: CustomSource = {
        id: 'custom_delete',
        name: 'To Delete',
        description: 'Will be deleted',
        version: '1.0',
        baseSource: null,
        factions: [],
        squads: [],
        machines: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };

      storage.save(source);
      expect(storage.getAll()).toHaveLength(1);

      storage.delete('custom_delete');
      expect(storage.getAll()).toHaveLength(0);
    });

    it('does nothing for non-existent id', () => {
      const storage = new CustomSourcesStorage();
      storage.delete('nonexistent');
      expect(storage.getAll()).toHaveLength(0);
    });
  });

  describe('exportToJson / importFromJson', () => {
    it('exports and imports source', () => {
      const storage = new CustomSourcesStorage();
      const source: CustomSource = {
        id: 'custom_export',
        name: 'Export Test',
        description: 'Testing export',
        version: '1.0',
        baseSource: null,
        factions: [],
        squads: [],
        machines: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };

      const json = storage.exportToJson(source);
      expect(json).toContain('custom_export');

      const imported = storage.importFromJson(json);
      expect(imported.id).toBe('custom_export');
      expect(imported.name).toBe('Export Test');
    });

    it('throws error for invalid JSON', () => {
      const storage = new CustomSourcesStorage();

      expect(() => storage.importFromJson('not json')).toThrow('Invalid JSON format');
    });

    it('throws error for invalid source structure', () => {
      const storage = new CustomSourcesStorage();

      // Missing required fields
      const invalidJson = JSON.stringify({ id: 'test' });

      expect(() => storage.importFromJson(invalidJson)).toThrow('Invalid source structure');
    });

    it('filters out overridden units in export for extension sources', () => {
      const storage = new CustomSourcesStorage();

      // Source with overridden squad (same ID as in base)
      const source: CustomSource = {
        id: 'custom_override',
        name: 'Override Test',
        description: 'Testing override export',
        version: '1.0',
        baseSource: 'star_system', // Extension source
        factions: [],
        squads: [
          {
            id: 'polaris_lineynaya_klon_pehota', // Same ID as base squad in star_system
            name: 'Линейная клон-пехота (Modified)',
            faction: 'polaris',
            cost: 150, // Modified cost (base is 50)
            soldiers: [],
          },
          {
            id: 'custom_new_squad', // New custom squad
            name: 'New Squad',
            faction: 'polaris',
            cost: 200,
            soldiers: [],
          },
        ],
        machines: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };

      const json = storage.exportToJson(source);
      const exported = JSON.parse(json);

      // Overridden squad should be filtered out (exists in base)
      expect(exported.squads).toHaveLength(1);
      expect(exported.squads[0].id).toBe('custom_new_squad');
      // Only custom squads remain
      expect(exported.squads.find((s: any) => s.id === 'polaris_lineynaya_klon_pehota')).toBeUndefined();
    });

    it('does not filter units for non-extension sources', () => {
      const storage = new CustomSourcesStorage();

      // Source without baseSource (not an extension)
      const source: CustomSource = {
        id: 'custom_new_source',
        name: 'New Source',
        description: 'Testing non-extension',
        version: '1.0',
        baseSource: null,
        factions: [],
        squads: [
          {
            id: 'my_squad',
            name: 'My Squad',
            faction: 'custom',
            cost: 100,
            soldiers: [],
          },
        ],
        machines: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };

      const json = storage.exportToJson(source);
      const exported = JSON.parse(json);

      // All squads should be exported
      expect(exported.squads).toHaveLength(1);
      expect(exported.squads[0].id).toBe('my_squad');
    });
  });
});
