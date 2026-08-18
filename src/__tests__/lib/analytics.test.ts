/**
 * Юнит-тесты аналитического фасада: fan-out GA/YM, офлайн-буфер, diff юнитов.
 */
jest.mock('@/lib/constants', () => {
  const actual = jest.requireActual('@/lib/constants');
  return {
    ...actual,
    GA_MEASUREMENT_ID: 'G-TEST',
    YANDEX_METRICA_ID: '111302711',
  };
});

import {
  trackEvent,
  trackPageView,
  trackInitialPageView,
  flushAnalyticsQueue,
  diffCustomSourceUnits,
} from '@/lib/analytics';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

const QUEUE_KEY = LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE;

function setOnline(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
}

function stubTransports(): { gtag: jest.Mock; ym: jest.Mock } {
  const gtag = jest.fn();
  const ym = jest.fn();
  window.gtag = gtag as unknown as typeof window.gtag;
  window.ym = ym as unknown as typeof window.ym;
  (window as unknown as { matchMedia: unknown }).matchMedia = jest
    .fn()
    .mockReturnValue({ matches: false });
  return { gtag, ym };
}

beforeEach(() => {
  localStorage.clear();
  stubTransports();
  setOnline(true);
});

describe('trackEvent — fan-out в обе системы', () => {
  beforeEach(() => {
    // Reset transports before each test in this suite
    stubTransports();
  });

  test('шлёт event в gtag и reachGoal в ym с меткой pwa', () => {
    trackEvent('battle_start', { faction: 'polaris', rules: 'tehnolog' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'battle_start', {
      faction: 'polaris',
      rules: 'tehnolog',
      pwa: false,
    });
    expect(window.ym).toHaveBeenCalledWith(111302711, 'reachGoal', 'battle_start', {
      faction: 'polaris',
      rules: 'tehnolog',
      pwa: false,
    });
  });

  test('pwa=true в standalone-режиме', () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = jest
      .fn()
      .mockReturnValue({ matches: true });
    trackEvent('pwa_install');
    expect(window.gtag).toHaveBeenCalledWith('event', 'pwa_install', { pwa: true });
  });

  test.skip('без id счётчиков ничего не отправляет и не буферизует — TODO: fix jest.isolateModules mocking', () => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      stubTransports();
      jest.doMock('@/lib/constants', () => {
        const actual = jest.requireActual('@/lib/constants');
        return { ...actual, GA_MEASUREMENT_ID: undefined, YANDEX_METRICA_ID: undefined };
      });
      const mod = require('@/lib/analytics');
      mod.trackEvent('x');
    });
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.ym).not.toHaveBeenCalled();
    expect(localStorage.getItem(QUEUE_KEY)).toBeNull();
  });
});

describe('офлайн-буфер', () => {
  test('офлайн событие ставится в очередь и уходит при flush', () => {
    setOnline(false);
    trackEvent('battle_turn', { turn: 2 });
    expect(window.gtag).not.toHaveBeenCalled();
    const queued = JSON.parse(localStorage.getItem(QUEUE_KEY)!) as unknown[];
    expect(queued).toHaveLength(1);

    setOnline(true);
    flushAnalyticsQueue();
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'battle_turn',
      expect.objectContaining({ turn: 2 }),
    );
    expect(window.ym).toHaveBeenCalledWith(
      111302711,
      'reachGoal',
      'battle_turn',
      expect.objectContaining({ turn: 2 }),
    );
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY)!)).toHaveLength(0);
  });

  test('незагруженный транспорт — событие ждёт в очереди оба транспорта', () => {
    (window as unknown as { ym: unknown }).ym = undefined;
    trackEvent('battle_start');
    expect(window.gtag).not.toHaveBeenCalled(); // GA-часть тоже ждёт (единый элемент очереди)
    stubTransports();
    flushAnalyticsQueue();
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.ym).toHaveBeenCalledTimes(1);
  });

  test('кап 200: старые вытесняются', () => {
    setOnline(false);
    for (let i = 0; i < 205; i++) trackEvent(`ev_${i}`);
    const queued = JSON.parse(localStorage.getItem(QUEUE_KEY)!) as { name?: string }[];
    expect(queued).toHaveLength(200);
    expect(queued[0].name).toBe('ev_5');
    expect(queued[199].name).toBe('ev_204');
  });
});

describe('просмотры страниц', () => {
  test('trackPageView — config в GA и hit в YM', () => {
    trackPageView('/app');
    expect(window.gtag).toHaveBeenCalledWith('config', 'G-TEST', { page_path: '/app' });
    expect(window.ym).toHaveBeenCalledWith(
      111302711,
      'hit',
      '/app',
      expect.objectContaining({ params: expect.objectContaining({ pwa: false }) }),
    );
  });

  test('trackInitialPageView — только GA (визит Метрики уже послал её init)', () => {
    trackInitialPageView('/');
    expect(window.gtag).toHaveBeenCalledWith('config', 'G-TEST', { page_path: '/' });
    expect(window.ym).not.toHaveBeenCalled();
  });
});

describe('diffCustomSourceUnits', () => {
  const prev = {
    squads: [{ id: 's1', name: 'A' }],
    machines: [{ id: 'm1', name: 'T' }],
  };

  test('новый отряд', () => {
    const next = { squads: [...prev.squads, { id: 's2', name: 'B' }], machines: prev.machines };
    expect(diffCustomSourceUnits(prev, next)).toEqual([{ kind: 'squad', id: 's2' }]);
  });

  test('изменённая техника', () => {
    const next = { squads: prev.squads, machines: [{ id: 'm1', name: 'T2' }] };
    expect(diffCustomSourceUnits(prev, next)).toEqual([{ kind: 'machine', id: 'm1' }]);
  });

  test('без изменений и удаление — пусто', () => {
    expect(diffCustomSourceUnits(prev, prev)).toEqual([]);
    expect(diffCustomSourceUnits(prev, { squads: [], machines: prev.machines })).toEqual([]);
  });
});
