/**
 * RouteTracker: первый рендер — GA-only pageview; смена маршрута — pageview;
 * appinstalled → pwa_install; mount → flush буфера.
 */
jest.mock('next/navigation', () => ({
  usePathname: (): string => usePathnameMock(),
}));

import { render } from '@testing-library/react';
import RouteTracker from '@/components/RouteTracker';

const trackInitialPageView = jest.fn();
const trackPageView = jest.fn();
const trackEvent = jest.fn();
const flushAnalyticsQueue = jest.fn();

jest.mock('@/lib/analytics', () => ({
  trackInitialPageView: (...args: unknown[]) => trackInitialPageView(...args),
  trackPageView: (...args: unknown[]) => trackPageView(...args),
  trackEvent: (...args: unknown[]) => trackEvent(...args),
  flushAnalyticsQueue: (...args: unknown[]) => flushAnalyticsQueue(...args),
}));

let usePathnameMock: () => string;

beforeEach(() => {
  jest.clearAllMocks();
  usePathnameMock = () => '/';
});

test('первый рендер — trackInitialPageView + flush, без trackPageView', () => {
  render(<RouteTracker />);
  expect(trackInitialPageView).toHaveBeenCalledWith('/');
  expect(trackPageView).not.toHaveBeenCalled();
  expect(flushAnalyticsQueue).toHaveBeenCalledTimes(1);
});

test('смена маршрута — trackPageView', () => {
  const { rerender } = render(<RouteTracker />);
  usePathnameMock = () => '/app';
  rerender(<RouteTracker />);
  expect(trackPageView).toHaveBeenCalledWith('/app');
  expect(trackInitialPageView).toHaveBeenCalledTimes(1);
});

test('повторный рендер того же пути ничего не шлёт', () => {
  const { rerender } = render(<RouteTracker />);
  rerender(<RouteTracker />);
  expect(trackPageView).not.toHaveBeenCalled();
});

test('appinstalled → pwa_install', () => {
  render(<RouteTracker />);
  window.dispatchEvent(new Event('appinstalled'));
  expect(trackEvent).toHaveBeenCalledWith('pwa_install');
});
