import {
  createConfigEnvelope,
  validateConfigEnvelope,
  generateConfigFileName,
  CURRENT_CONFIG_VERSION,
  MAX_CONFIG_BYTES,
} from '@/lib/config-export';
import { CustomSource } from '@/lib/editor/types';

describe('config-export', () => {
  describe('createConfigEnvelope', () => {
    it('should create envelope with correct structure', () => {
      const sources: CustomSource[] = [];
      const modifiers = { buffs: [], debuffs: [] };

      const envelope = createConfigEnvelope(sources, modifiers);

      expect(envelope.version).toBe(CURRENT_CONFIG_VERSION);
      expect(envelope.type).toBe('bronepehota_config');
      expect(envelope.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(envelope.data.sources).toEqual(sources);
      expect(envelope.data.modifiers).toEqual(modifiers);
    });
  });

  describe('validateConfigEnvelope', () => {
    it('should return valid for correct envelope', () => {
      const envelope = createConfigEnvelope([], { buffs: [], debuffs: [] });
      const result = validateConfigEnvelope(JSON.stringify(envelope));
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid JSON', () => {
      const result = validateConfigEnvelope('not json');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Файл повреждён или имеет неверный формат');
    });

    it('should reject wrong type', () => {
      const envelope = createConfigEnvelope([], { buffs: [], debuffs: [] });
      // Create a modified envelope with wrong type for testing
      const modifiedEnvelope = JSON.parse(JSON.stringify(envelope));
      modifiedEnvelope.type = 'wrong';
      const result = validateConfigEnvelope(JSON.stringify(modifiedEnvelope));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Это не файл настроек Бронепехоты');
    });

    it('should reject future version', () => {
      const envelope = createConfigEnvelope([], { buffs: [], debuffs: [] });
      envelope.version = 999;
      const result = validateConfigEnvelope(JSON.stringify(envelope));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Обновите приложение для поддержки этого формата');
    });

    it('should reject missing data.sources', () => {
      const raw = JSON.stringify({ version: 1, type: 'bronepehota_config', exportedAt: '2026-01-01', data: { modifiers: { buffs: [], debuffs: [] } } });
      const result = validateConfigEnvelope(raw);
      expect(result.valid).toBe(false);
    });

    it('should accept current version', () => {
      const envelope = createConfigEnvelope([], { buffs: [], debuffs: [] });
      const raw = JSON.stringify(envelope);
      const result = validateConfigEnvelope(raw);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateConfigEnvelope — hardening', () => {
    const validSource = {
      id: 'src1', name: 'Source 1', description: '', version: '1',
      baseSource: null, factions: [], squads: [], machines: [],
      createdAt: '', updatedAt: '',
    } as unknown as CustomSource;

    it('rejects oversized input with a size-specific error (before parsing)', () => {
      const huge = 'x'.repeat(MAX_CONFIG_BYTES + 1);
      const result = validateConfigEnvelope(huge);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/большой|размер/i);
    });

    it('rejects a source with an empty id', () => {
      const env = createConfigEnvelope(
        [{ ...validSource, id: '' } as CustomSource],
        { buffs: [], debuffs: [] },
      );
      const result = validateConfigEnvelope(JSON.stringify(env));
      expect(result.valid).toBe(false);
    });

    it('rejects a source that is not an object', () => {
      const env = createConfigEnvelope(
        ['not-an-object' as unknown as CustomSource],
        { buffs: [], debuffs: [] },
      );
      const result = validateConfigEnvelope(JSON.stringify(env));
      expect(result.valid).toBe(false);
    });

    it('strips prototype-pollution keys (constructor) from accepted sources', () => {
      const src = { ...validSource, constructor: { polluted: true } } as unknown as CustomSource;
      const env = createConfigEnvelope([src], { buffs: [], debuffs: [] });
      const result = validateConfigEnvelope(JSON.stringify(env));
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(Object.keys(result.data!.sources[0])).not.toContain('constructor');
    });
  });

  describe('generateConfigFileName', () => {
    it('should generate filename with UTC date', () => {
      const name = generateConfigFileName();
      expect(name).toMatch(/^bronepehota_config_\d{4}-\d{2}-\d{2}\.json$/);
    });
  });
});