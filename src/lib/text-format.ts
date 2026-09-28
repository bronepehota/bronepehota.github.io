// src/lib/text-format.ts
// Механика длинных текстов досье: абзацы и русская типографика.
// «ё» намеренно НЕ нормализуется — только в корпусном прогоне по словарю.

const PAIRED_STRAIGHT_QUOTES = /"([^"\n]+)"/g;

/** `\n\n`-разбивка длинного текста на абзацы; одиночные `\n` — внутристрочные. */
export function splitParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Механическая русская типографика: «ёлочки», тире, многоточие, пробелы. */
export function normalizeRussianTypography(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\.{3}/g, '…')
    .replace(PAIRED_STRAIGHT_QUOTES, '«$1»')
    .replace(/(\s)-(\s)/g, '$1—$2')
    .trim();
}
