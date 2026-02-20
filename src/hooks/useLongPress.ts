'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  ms?: number;
}

interface UseLongPressReturn {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  isPressed: boolean;
}

export function useLongPress({
  onLongPress,
  ms = 600,
}: UseLongPressOptions): UseLongPressReturn {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Prevent default to avoid text selection and other default behaviors
      e.preventDefault();
      setIsPressed(true);

      timerRef.current = setTimeout(() => {
        onLongPress();
        setIsPressed(false);
      }, ms);
    },
    [onLongPress, ms]
  );

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
