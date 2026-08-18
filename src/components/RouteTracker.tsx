'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  flushAnalyticsQueue,
  trackEvent,
  trackInitialPageView,
  trackPageView,
} from '@/lib/analytics';

/**
 * SPA-слежение маршрутов: первый просмотр — только GA (визит Метрики шлёт её
 * init), каждое последующее изменение пути — в обе системы. Также ловит
 * установку PWA и флешит офлайн-буфер аналитики.
 */
export default function RouteTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const onInstall = () => trackEvent('pwa_install');
    const onOnline = () => flushAnalyticsQueue();
    window.addEventListener('appinstalled', onInstall);
    window.addEventListener('online', onOnline);
    flushAnalyticsQueue();
    // повторный flush: транспорты (afterInteractive-скрипты) могли догрузиться позже
    const timer = setTimeout(flushAnalyticsQueue, 3000);
    return () => {
      window.removeEventListener('appinstalled', onInstall);
      window.removeEventListener('online', onOnline);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (lastPath.current === null) {
      trackInitialPageView(pathname);
    } else if (lastPath.current !== pathname) {
      trackPageView(pathname);
    }
    lastPath.current = pathname;
  }, [pathname]);

  return null;
}
