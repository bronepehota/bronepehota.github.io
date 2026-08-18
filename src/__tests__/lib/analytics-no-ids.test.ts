/**
 * Фасад без id счётчиков: ничего не отправляет и не буферизует.
 * Отдельный файл: статический jest.mock с undefined id здесь не конфликтует
 * с основным analytics.test.ts (там id заданы для остальных сценариев).
 */
jest.mock('@/lib/constants', () => {
  const actual = jest.requireActual('@/lib/constants');
  return {
    ...actual,
    GA_MEASUREMENT_ID: undefined,
    YANDEX_METRICA_ID: undefined,
  };
});

import { trackEvent, trackPageView, flushAnalyticsQueue } from '@/lib/analytics';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

beforeEach(() => {
  localStorage.clear();
  window.gtag = jest.fn() as unknown as typeof window.gtag;
  window.ym = jest.fn() as unknown as typeof window.ym;
});

test('без id счётчиков ничего не отправляет и не буферизует', () => {
  trackEvent('battle_start');
  trackPageView('/app');
  flushAnalyticsQueue();
  expect(window.gtag).not.toHaveBeenCalled();
  expect(window.ym).not.toHaveBeenCalled();
  expect(localStorage.getItem(LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE)).toBeNull();
});
