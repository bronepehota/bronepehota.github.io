/**
 * Tests for QR code generation module
 */

import {
  splitForQr,
  formatChunkForQr,
  parseQrChunk,
  reassembleChunks,
  getChunkCount,
  estimateQrCount,
  generateQrCode,
  generateAllQrCodes,
} from '@/lib/editor/qr-code';
import { CustomSource, QrChunk } from '@/lib/editor/types';

// Polyfill for TextEncoder (required by qrcode in Node environment)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

describe('splitForQr', () => {
  const smallSource: CustomSource = {
    id: 'custom_small',
    name: 'Small Source',
    description: 'A small test source',
    version: '1.0',
    baseSource: null,
    factions: [{ id: 'test', name: 'Test Faction', color: '#ff0000' }],
    squads: [],
    machines: [],
    createdAt: '2026-03-15T00:00:00Z',
    updatedAt: '2026-03-15T00:00:00Z',
  };

  it('returns single chunk for small source', () => {
    const chunks = splitForQr(smallSource);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].index).toBe(1);
    expect(chunks[0].total).toBe(1);
  });

  it('splits large source into multiple chunks', () => {
    // Create a large source by adding many squads
    const largeSource: CustomSource = {
      ...smallSource,
      squads: Array(50).fill(null).map((_, i) => ({
        id: `squad_${i}`,
        name: `Squad ${i}`,
        faction: 'test',
        cost: 100,
        soldiers: [
          { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      })),
    };

    const chunks = splitForQr(largeSource);
    expect(chunks.length).toBeGreaterThan(1);

    // Verify all chunks have correct metadata
    const total = chunks[0].total;
    chunks.forEach((chunk, i) => {
      expect(chunk.index).toBe(i + 1);
      expect(chunk.total).toBe(total);
    });
  });

  it('chunk data concatenates to original JSON', () => {
    const source: CustomSource = {
      ...smallSource,
      squads: Array(20).fill(null).map((_, i) => ({
        id: `squad_${i}`,
        name: `Squad ${i}`,
        faction: 'test',
        cost: 100,
        soldiers: [
          { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 },
        ],
      })),
    };

    const chunks = splitForQr(source);
    const reassembled = chunks.map(c => c.data).join('');
    const originalJson = JSON.stringify(source);

    expect(reassembled).toBe(originalJson);
  });
});

describe('formatChunkForQr', () => {
  it('formats chunk correctly', () => {
    const chunk: QrChunk = {
      index: 1,
      total: 3,
      data: 'testdata',
    };

    const formatted = formatChunkForQr(chunk);
    expect(formatted).toBe('1/3:testdata');
  });

  it('handles data with special characters', () => {
    const chunk: QrChunk = {
      index: 2,
      total: 5,
      data: '{"key":"value with spaces"}',
    };

    const formatted = formatChunkForQr(chunk);
    expect(formatted).toBe('2/5:{"key":"value with spaces"}');
  });
});

describe('parseQrChunk', () => {
  it('parses valid chunk string', () => {
    const result = parseQrChunk('1/3:testdata');
    expect(result).not.toBeNull();
    expect(result?.index).toBe(1);
    expect(result?.total).toBe(3);
    expect(result?.data).toBe('testdata');
  });

  it('parses chunk with JSON data', () => {
    const result = parseQrChunk('2/5:{"key":"value"}');
    expect(result).not.toBeNull();
    expect(result?.index).toBe(2);
    expect(result?.total).toBe(5);
    expect(result?.data).toBe('{"key":"value"}');
  });

  it('returns null for invalid format', () => {
    expect(parseQrChunk('invalid')).toBeNull();
    expect(parseQrChunk('1/test:data')).toBeNull();
    expect(parseQrChunk('test/1:data')).toBeNull();
  });

  it('returns null for invalid indices', () => {
    expect(parseQrChunk('0/1:data')).toBeNull(); // index must be >= 1
    expect(parseQrChunk('2/1:data')).toBeNull(); // index > total
    expect(parseQrChunk('1/0:data')).toBeNull(); // total must be >= 1
  });
});

describe('reassembleChunks', () => {
  it('reassembles single chunk', () => {
    const chunks: QrChunk[] = [
      { index: 1, total: 1, data: '{"test":"data"}' },
    ];

    const result = reassembleChunks(chunks);
    expect(result).toBe('{"test":"data"}');
  });

  it('reassembles multiple chunks in order', () => {
    const chunks: QrChunk[] = [
      { index: 2, total: 3, data: 'part2' },
      { index: 1, total: 3, data: 'part1' },
      { index: 3, total: 3, data: 'part3' },
    ];

    const result = reassembleChunks(chunks);
    expect(result).toBe('part1part2part3');
  });

  it('returns null for incomplete chunks', () => {
    const chunks: QrChunk[] = [
      { index: 1, total: 3, data: 'part1' },
      { index: 2, total: 3, data: 'part2' },
      // Missing chunk 3
    ];

    const result = reassembleChunks(chunks);
    expect(result).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(reassembleChunks([])).toBeNull();
  });

  it('returns null for mismatched totals', () => {
    const chunks: QrChunk[] = [
      { index: 1, total: 2, data: 'part1' },
      { index: 2, total: 3, data: 'part2' }, // Different total
    ];

    const result = reassembleChunks(chunks);
    expect(result).toBeNull();
  });
});

describe('getChunkCount', () => {
  it('returns 1 for small source', () => {
    const source: CustomSource = {
      id: 'custom_test',
      name: 'Test',
      description: 'Test',
      version: '1.0',
      baseSource: null,
      factions: [],
      squads: [],
      machines: [],
      createdAt: '2026-03-15T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    };

    expect(getChunkCount(source)).toBe(1);
  });

  it('returns correct count for large source', () => {
    // Create a source with known size
    const source: CustomSource = {
      id: 'custom_large',
      name: 'Large Source',
      description: 'x'.repeat(5000), // 5000 char description
      version: '1.0',
      baseSource: null,
      factions: [],
      squads: [],
      machines: [],
      createdAt: '2026-03-15T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    };

    // Should be at least 3 chunks (5000 / 2000)
    expect(getChunkCount(source)).toBeGreaterThanOrEqual(3);
  });
});

describe('estimateQrCount', () => {
  it('estimates 1 for small size', () => {
    expect(estimateQrCount(100)).toBe(1);
    expect(estimateQrCount(2000)).toBe(1);
  });

  it('estimates correctly for larger sizes', () => {
    expect(estimateQrCount(2001)).toBe(2);
    expect(estimateQrCount(4000)).toBe(2);
    expect(estimateQrCount(4001)).toBe(3);
  });
});

describe('generateQrCode', () => {
  it('generates a data URL', async () => {
    const chunk: QrChunk = {
      index: 1,
      total: 1,
      data: 'testdata',
    };

    const qrDataUrl = await generateQrCode(chunk);

    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

describe('generateAllQrCodes', () => {
  it('generates QR codes for source', async () => {
    const source: CustomSource = {
      id: 'custom_test',
      name: 'Test',
      description: 'Test',
      version: '1.0',
      baseSource: null,
      factions: [],
      squads: [],
      machines: [],
      createdAt: '2026-03-15T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    };

    const qrCodes = await generateAllQrCodes(source);

    expect(qrCodes).toHaveLength(1);
    expect(qrCodes[0]).toMatch(/^data:image\/png;base64,/);
  });
});
