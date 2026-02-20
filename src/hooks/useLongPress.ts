'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  ms?: number;
}

interface UseLongPressReturn {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  isPressed: boolean;
}

export function useLongPress({
  onLongPress,
  ms = 600,
}: UseLongPressOptions): UseLongPressReturn {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = useCallback(() => {
    setIsPressed(true);

    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsPressed(false);
    }, ms);
  }, [onLongPress, ms]);

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressed(false);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    onMouseDown: startPress,
    onMouseUp: cancelPress,
    onMouseLeave: cancelPress,
    onTouchStart: startPress,
    onTouchEnd: cancelPress,
    isPressed,
  };
}
