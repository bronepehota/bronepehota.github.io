'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Горизонтальный свайп для карточки бойца (плейтест 2026-09-18):
 * свайп ВЛЕВО — «готов» (завершить ход), ВПРАВО — «убит».
 *
 * Pointer events (мышь/пальцы/стилус одним кодом) + axis-lock: первое
 * движение >8px решает ось — вертикаль отдаётся нативному скроллу
 * (элемент должен нести `touch-pan-y`), горизонталь ведёт свайп.
 * Клик после реального жеста гасится (onClickCapture), чтобы свайп,
 * начавшийся на фото/статах, не открыл их действие.
 */

const AXIS_LOCK_PX = 8; // px — порог выбора оси
const TRIGGER_PX = 56;  // px — дистанция срабатывания
const MAX_OFFSET_PX = 96; // px — максимальный визуальный сдвиг (сопротивление)

interface UseCardSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function useCardSwipe({ onSwipeLeft, onSwipeRight }: UseCardSwipeOptions) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const axisRef = useRef<'none' | 'x' | 'y'>('none');
  const pointerIdRef = useRef<number | null>(null);
  const swallowClickRef = useRef(false);
  // ref-зеркало: pointerup читает актуальный сдвиг даже без ре-рендера между
  // move и up (быстрый флик одним движением)
  const dxRef = useRef(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    startRef.current = null;
    axisRef.current = 'none';
    pointerIdRef.current = null;
    dxRef.current = 0;
    setDragging(false);
    setDx(0);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    axisRef.current = 'none';
    pointerIdRef.current = e.pointerId;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || pointerIdRef.current !== e.pointerId) return;
    const ddx = e.clientX - start.x;
    const ddy = e.clientY - start.y;

    if (axisRef.current === 'none') {
      if (Math.abs(ddx) <= AXIS_LOCK_PX && Math.abs(ddy) <= AXIS_LOCK_PX) return;
      axisRef.current = Math.abs(ddx) > Math.abs(ddy) ? 'x' : 'y';
      if (axisRef.current === 'x') {
        setDragging(true);
        try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
      }
      if (axisRef.current !== 'x') return; // вертикальный скролл — не наш жест
      // НЕ выходим: то же движение, что заблокировало ось, уже несёт сдвиг —
      // иначе быстрый флик (одно движение до pointerup) терял дистанцию
    } else if (axisRef.current !== 'x') {
      return;
    }

    // Сопротивление: дальше MAX_OFFSET_PX сдвиг растёт еле-еле
    const clamped = Math.sign(ddx) * Math.min(Math.abs(ddx), MAX_OFFSET_PX);
    dxRef.current = clamped;
    setDx(clamped);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (startRef.current) {
      if (axisRef.current === 'x') {
        if (Math.abs(dxRef.current) >= TRIGGER_PX) {
          if (dxRef.current < 0) onSwipeLeft(); else onSwipeRight();
        }
        // Реальный жест был — гасим следующий за ним click (фото/статы/кнопки)
        swallowClickRef.current = true;
      }
      try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* noop */ }
    }
    reset();
  }, [onSwipeLeft, onSwipeRight, reset]);

  const onPointerCancel = useCallback(() => reset(), [reset]);

  /** Гасит click, оставшийся после жеста (capture-фаза — раньше цели) */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (swallowClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      swallowClickRef.current = false;
    }
  }, []);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture },
    style: (
      dragging
        ? { transform: `translateX(${dx}px)`, transition: 'none' }
        : { transform: 'translateX(0)' }
    ) as React.CSSProperties,
  };
}
