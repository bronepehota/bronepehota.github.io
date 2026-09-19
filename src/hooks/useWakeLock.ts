'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wake Lock для игры за столом (плейтест: телефон лежит на столе/полу,
 * ход длятся минутами — экран не должен гаснуть). Пока `enabled`,
 * удерживаем screen-wake-lock; после возврата из фона/погасания система
 * снимает лок — перезахватываем на visibilitychange. Chrome/Edge/Android
 * и iOS Safari 16.4+; без API — тихо отключено (supported=false).
 */
export function useWakeLock(enabled: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator);
  }, []);

  const release = useCallback(async () => {
    const lock = lockRef.current;
    lockRef.current = null;
    setActive(false);
    try { await lock?.release(); } catch { /* уже снят системой */ }
  }, []);

  const acquire = useCallback(async () => {
    if (!enabled || lockRef.current) return;
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
      setActive(true);
      // Система сняла лок (гашение, уход в фон) — статус обновится сам
      lockRef.current.addEventListener('release', () => {
        if (lockRef.current) { lockRef.current = null; }
        setActive(false);
      });
    } catch {
      // NotAllowedError и пр. — считаем выключенным, ретраем на visibility
      setActive(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !supported) { void release(); return; }
    void acquire();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void release();
    };
  }, [enabled, supported, acquire, release]);

  return { supported, active };
}
