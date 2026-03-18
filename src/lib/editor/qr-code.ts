/**
 * QR Code generation for custom sources
 * Splits large sources into multiple QR codes for transfer
 */

import QRCode from 'qrcode';
import { CustomSource, QrChunk } from './types';

/**
 * Maximum data size per QR code (in characters)
 * QR codes have limits based on version and error correction
 * Using ~2000 chars for reliable scanning
 */
const MAX_QR_CHUNK_SIZE = 2000;

/**
 * Split a CustomSource into chunks for QR code generation
 */
export function splitForQr(source: CustomSource): QrChunk[] {
  const json = JSON.stringify(source);
  const totalChunks = Math.ceil(json.length / MAX_QR_CHUNK_SIZE);

  const chunks: QrChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * MAX_QR_CHUNK_SIZE;
    const end = Math.min(start + MAX_QR_CHUNK_SIZE, json.length);
    const data = json.slice(start, end);

    chunks.push({
      index: i + 1, // 1-based index
      total: totalChunks,
      data,
    });
  }

  return chunks;
}

/**
 * Format a chunk for QR code encoding
 * Format: {index}/{total}:{data}
 */
export function formatChunkForQr(chunk: QrChunk): string {
  return `${chunk.index}/${chunk.total}:${chunk.data}`;
}

/**
 * Generate a QR code data URL from a chunk
 */
export async function generateQrCode(chunk: QrChunk): Promise<string> {
  const data = formatChunkForQr(chunk);

  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M', // Medium error correction for balance of size/reliability
    type: 'image/png',
    width: 400, // 400px width for good scannability
    margin: 2, // 2 modules margin
  });
}

/**
 * Generate all QR codes for a source
 * Returns array of data URLs
 */
export async function generateAllQrCodes(source: CustomSource): Promise<string[]> {
  const chunks = splitForQr(source);
  const qrCodes: string[] = [];

  for (const chunk of chunks) {
    const qrDataUrl = await generateQrCode(chunk);
    qrCodes.push(qrDataUrl);
  }

  return qrCodes;
}

/**
 * Parse a QR code chunk string
 * Format: {index}/{total}:{data}
 */
export function parseQrChunk(qrString: string): QrChunk | null {
  // Use [\s\S] instead of . with s flag to match any character including newlines
  const match = qrString.match(/^(\d+)\/(\d+):([\s\S]*)$/);

  if (!match) {
    return null;
  }

  const index = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);
  const data = match[3];

  if (isNaN(index) || isNaN(total) || index < 1 || total < 1 || index > total) {
    return null;
  }

  return { index, total, data };
}

/**
 * Reassemble chunks into original source
 * Returns null if chunks are incomplete or invalid
 */
export function reassembleChunks(chunks: QrChunk[]): string | null {
  if (chunks.length === 0) {
    return null;
  }

  // Verify all chunks are present
  const total = chunks[0].total;
  const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);

  // Check all chunks are present
  for (let i = 1; i <= total; i++) {
    if (sortedChunks[i - 1]?.index !== i || sortedChunks[i - 1]?.total !== total) {
      return null;
    }
  }

  // Reassemble data
  return sortedChunks.map(c => c.data).join('');
}

/**
 * Get chunk count for a source (without generating QR codes)
 */
export function getChunkCount(source: CustomSource): number {
  const json = JSON.stringify(source);
  return Math.ceil(json.length / MAX_QR_CHUNK_SIZE);
}

/**
 * Estimate QR code count from JSON size
 */
export function estimateQrCount(jsonSize: number): number {
  return Math.ceil(jsonSize / MAX_QR_CHUNK_SIZE);
}
