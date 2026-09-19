'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wake Lock для игры за столом (плейтест: телефон лежит на столе/полу,
 * ход длятся минутами — экран не должен гаснуть). Пока `enabled`,
 * удерживаем screen-wake-lock; после возврата из фона/гашения система
 * снимает лок — перезахватываем на visibilitychange. Chrome/Edge/Android
 * и iOS Safari 16.4+; без API — тихо отключено (supported=false).
 *
 * Гонки request() (ревью PR #242): await разрывает проверку guard'а —
 * за время запроса хук могут размонтировать или переключить enabled, и
 * «запоздавший» сентинел утёк бы с активным локом. Лечим cancelled-флагом
 * (сбрасывается в cleanup каждого эффекта) и перепроверкой после await.
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

  const acquire = useCallback(async (cancelled: { current: boolean }) => {
    if (lockRef.current) return;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      // За время await хук размонтировали / enabled выключили / взяли
      // новый лок — этот сентинел никому не нужен, сразу отпускаем
      if (cancelled.current || lockRef.current) {
        try { await sentinel.release(); } catch { /* noop */ }
        return;
      }
      lockRef.current = sentinel;
      setActive(true);
      // Система сняла лок (гашение, уход в фон) — сбрасываем статус,
      // сверяя личность сентинела: событие «чужого» (утёкшего) сентинела
      // не должно рассинхронизировать состояние живого
      sentinel.addEventListener('release', () => {
        if (lockRef.current === sentinel) {
          lockRef.current = null;
          setActive(false);
        }
      });
    } catch {
      // NotAllowedError (Low Power Mode, скрытая вкладка) и пр. —
      // не активен; ретрай на visibilitychange
      setActive(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !supported) { void release(); return; }
    const cancelled = { current: false };
    void acquire(cancelled);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire(cancelled);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled.current = true;
      document.removeEventListener('visibilitychange', onVisible);
      void release();
    };
  }, [enabled, supported, acquire, release]);

  return { supported, active };
}
