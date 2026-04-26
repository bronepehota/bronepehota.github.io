import {
  createConfigEnvelope,
  validateConfigEnvelope,
  generateConfigFileName,
  CURRENT_CONFIG_VERSION,
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

  describe('generateConfigFileName', () => {
    it('should generate filename with UTC date', () => {
      const name = generateConfigFileName();
      expect(name).toMatch(/^bronepehota_config_\d{4}-\d{2}-\d{2}\.json$/);
    });
  });
});