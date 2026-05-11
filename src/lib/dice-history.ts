export interface HistoryEntry {
  value: string;
  field: string;
  timestamp: number;
}

export const HISTORY_KEY = 'bronepehota_dice_history';
const MAX_HISTORY = 50;
const MAX_RECENT = 6;

export function loadHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEntry(raw: string | null, entry: HistoryEntry): HistoryEntry[] {
  const history = loadHistory(raw);
  history.unshift(entry);
  return history.slice(0, MAX_HISTORY);
}

export function getRecentForField(history: HistoryEntry[], field: string): Array<{ value: string; count: number }> {
  const filtered = history.filter(e => e.field === field);
  const freq = new Map<string, number>();
  for (const e of filtered) {
    freq.set(e.value, (freq.get(e.value) || 0) + 1);
  }
  const seen = new Set<string>();
  const recent: Array<{ value: string; count: number }> = [];
  for (const e of filtered) {
    if (!seen.has(e.value)) {
      seen.add(e.value);
      recent.push({ value: e.value, count: freq.get(e.value) || 1 });
    }
    if (recent.length >= MAX_RECENT) break;
  }
  return recent;
}

const TITLE_TO_FIELD: Record<string, string> = {
  'ДАЛЬНОСТЬ': 'range',
  'МОЩНОСТЬ': 'power',
  'БЛИЖНИЙ БОЙ': 'melee',
  'РАНГ': 'rank',
};

export function fieldFromTitle(title: string): string {
  return TITLE_TO_FIELD[title] || title.toLowerCase();
}
