import { GA_MEASUREMENT_ID, LOCAL_STORAGE_KEYS, YANDEX_METRICA_ID } from '@/lib/constants';

// Обратная совместимость: GoogleAnalytics.tsx импортирует id отсюда.
export { GA_MEASUREMENT_ID } from '@/lib/constants';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    ym: (id: number, action: string, ...rest: unknown[]) => void;
  }
}

type QueuedItem = {
  kind: 'pageview' | 'event';
  path?: string;
  name?: string;
  params?: Record<string, unknown>;
  /** false => YM-часть не отправляем (первый просмотр: визит уже послал init Метрики) */
  ym?: boolean;
  ts: number;
};

const QUEUE_LIMIT = 200;

function pwaStandalone(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

function activeTransportsReady(): boolean {
  const needGa = Boolean(GA_MEASUREMENT_ID);
  const needYm = Boolean(YANDEX_METRICA_ID);
  // If no analytics is configured at all, we're effectively "ready" but dispatch should no-op.
  const gaReady = !needGa || typeof window.gtag === 'function';
  const ymReady = !needYm || typeof window.ym === 'function';
  return gaReady && ymReady;
}

function canSendNow(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.onLine && activeTransportsReady();
}

function readQueue(): QueuedItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QueuedItem[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE, JSON.stringify(items));
  } catch {
    // quota exceeded — теряем буфер, это аналитика
  }
}

function enqueue(item: QueuedItem): void {
  const queue = [...readQueue(), item].slice(-QUEUE_LIMIT);
  writeQueue(queue);
}

function deliver(item: QueuedItem): void {
  const params = { ...item.params, pwa: pwaStandalone() };
  if (item.kind === 'pageview' && item.path) {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
      window.gtag('config', GA_MEASUREMENT_ID, { page_path: item.path });
    }
    if (item.ym !== false && YANDEX_METRICA_ID && typeof window.ym === 'function') {
      window.ym(Number(YANDEX_METRICA_ID), 'hit', item.path, { params });
    }
    return;
  }
  if (item.kind === 'event' && item.name) {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
      window.gtag('event', item.name, params);
    }
    if (YANDEX_METRICA_ID && typeof window.ym === 'function') {
      window.ym(Number(YANDEX_METRICA_ID), 'reachGoal', item.name, params);
    }
  }
}

function dispatch(item: QueuedItem): void {
  // If no analytics is configured at all, do nothing.
  if (!GA_MEASUREMENT_ID && !YANDEX_METRICA_ID) return;
  if (canSendNow()) deliver(item);
  else enqueue(item);
}

/** Просмотр страницы при клиентском переходе — в обе системы. */
export function trackPageView(path: string): void {
  dispatch({ kind: 'pageview', path, ts: Date.now() });
}

/**
 * Первый просмотр (полная загрузка страницы). В Метрику hit НЕ шлём:
 * её init при загрузке уже зарегистрировал визит — повторный hit дал бы
 * двойной счёт лендинга. GA получает page_view (у нас send_page_view: false).
 */
export function trackInitialPageView(path: string): void {
  dispatch({ kind: 'pageview', path, ym: false, ts: Date.now() });
}

/** Событие — в обе системы. */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  dispatch({ kind: 'event', name, params, ts: Date.now() });
}

/** Отправка накопленного офлайн-буфера (at-most-once: очередь чистится до отправки). */
export function flushAnalyticsQueue(): void {
  if (typeof window === 'undefined' || !navigator.onLine || !activeTransportsReady()) return;
  const queue = readQueue();
  if (queue.length === 0) return;
  writeQueue([]);
  queue.forEach(deliver);
}

export type UnitLike = { id: string } & Record<string, unknown>;

/**
 * Diff юнитов кастомного источника до/после сохранения —
 * кто реально изменился (basis для события editor_unit_saved).
 */
export function diffCustomSourceUnits(
  prev: { squads: UnitLike[]; machines: UnitLike[] },
  next: { squads: UnitLike[]; machines: UnitLike[] },
): Array<{ kind: 'squad' | 'machine'; id: string }> {
  const changed: Array<{ kind: 'squad' | 'machine'; id: string }> = [];
  const prevSquads = new Map(prev.squads.map((s) => [s.id, JSON.stringify(s)]));
  for (const s of next.squads) {
    if (prevSquads.get(s.id) !== JSON.stringify(s)) changed.push({ kind: 'squad', id: s.id });
  }
  const prevMachines = new Map(prev.machines.map((m) => [m.id, JSON.stringify(m)]));
  for (const m of next.machines) {
    if (prevMachines.get(m.id) !== JSON.stringify(m)) changed.push({ kind: 'machine', id: m.id });
  }
  return changed;
}
