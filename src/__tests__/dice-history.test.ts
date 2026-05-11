import { loadHistory, saveEntry, getRecentForField, fieldFromTitle } from '@/lib/dice-history';

describe('dice-history', () => {
  const baseEntry = { value: 'D6', field: 'range', timestamp: 1000 };

  describe('loadHistory', () => {
    it('returns empty array for null', () => {
      expect(loadHistory(null)).toEqual([]);
    });

    it('returns empty array for invalid JSON', () => {
      expect(loadHistory('not json')).toEqual([]);
    });

    it('parses valid JSON array', () => {
      const entries = [{ value: 'D6', field: 'range', timestamp: 1000 }];
      expect(loadHistory(JSON.stringify(entries))).toEqual(entries);
    });
  });

  describe('saveEntry', () => {
    it('prepends new entry to empty history', () => {
      const result = saveEntry(null, baseEntry);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('D6');
    });

    it('prepends to existing history', () => {
      const existing = JSON.stringify([
        { value: 'D12', field: 'range', timestamp: 999 },
      ]);
      const result = saveEntry(existing, baseEntry);
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('D6');
      expect(result[1].value).toBe('D12');
    });

    it('limits to 50 entries', () => {
      const entries = Array.from({ length: 60 }, (_, i) => ({
        value: `D${i}`, field: 'range', timestamp: i,
      }));
      const result = saveEntry(JSON.stringify(entries), baseEntry);
      expect(result).toHaveLength(50);
      expect(result[0].value).toBe('D6');
    });
  });

  describe('getRecentForField', () => {
    it('returns empty for no matching field', () => {
      const history = [{ value: 'D6', field: 'range', timestamp: 1 }];
      expect(getRecentForField(history, 'power')).toEqual([]);
    });

    it('returns unique recent values with counts', () => {
      const history = [
        { value: 'D12', field: 'range', timestamp: 1 },
        { value: 'D6', field: 'range', timestamp: 2 },
        { value: 'D12', field: 'range', timestamp: 3 },
        { value: 'D6', field: 'range', timestamp: 4 },
        { value: 'D12', field: 'range', timestamp: 5 },
      ];
      const recent = getRecentForField(history, 'range');
      expect(recent).toHaveLength(2);
      // D12 appears first (most recent entry) with count 3
      expect(recent[0]).toEqual({ value: 'D12', count: 3 });
      expect(recent[1]).toEqual({ value: 'D6', count: 2 });
    });

    it('limits to 6 unique values', () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        value: `D${i * 2 + 2}`, field: 'range', timestamp: i,
      }));
      const recent = getRecentForField(history, 'range');
      expect(recent).toHaveLength(6);
    });

    it('filters by field', () => {
      const history = [
        { value: 'D12', field: 'range', timestamp: 1 },
        { value: '1D20', field: 'power', timestamp: 2 },
        { value: 'D6', field: 'range', timestamp: 3 },
      ];
      expect(getRecentForField(history, 'range')).toHaveLength(2);
      expect(getRecentForField(history, 'power')).toHaveLength(1);
    });
  });

  describe('fieldFromTitle', () => {
    it('maps known titles', () => {
      expect(fieldFromTitle('ДАЛЬНОСТЬ')).toBe('range');
      expect(fieldFromTitle('МОЩНОСТЬ')).toBe('power');
      expect(fieldFromTitle('БЛИЖНИЙ БОЙ')).toBe('melee');
      expect(fieldFromTitle('РАНГ')).toBe('rank');
    });

    it('lowercases unknown titles', () => {
      expect(fieldFromTitle('Custom')).toBe('custom');
    });
  });
});
