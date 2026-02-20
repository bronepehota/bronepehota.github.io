'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseLongPressOptions {
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void;
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
  onLongPressEnd?: () => void;
  delay?: number;
}

interface UseLongPressReturn {
  isPressed: boolean;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: (e?: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e?: React.TouchEvent) => void;
    onTouchMove: () => void;
  };
}

export function useLongPress({
  onLongPress,
  onClick,
  onLongPressEnd,
  delay = 500,
}: UseLongPressOptions): UseLongPressReturn {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPressRef = useRef(false);
  const eventRef = useRef<React.MouseEvent | React.TouchEvent | null>(null);

  const startPress = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Prevent default to avoid text selection and other default behaviors
      e.preventDefault();
      wasLongPressRef.current = false;
      eventRef.current = e;
      setIsPressed(true);

      timerRef.current = setTimeout(() => {
        wasLongPressRef.current = true;
        onLongPress(e);
        setIsPressed(false);
        onLongPressEnd?.();
        eventRef.current = null;
      }, delay);
    },
    [onLongPress, onLongPressEnd, delay]
  );

  const cancelPress = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setIsPressed(false);

      // If it wasn't a long press and we have an onClick handler, call it
      if (!wasLongPressRef.current && onClick) {
        const eventToUse = e || eventRef.current;
        if (eventToUse) {
          onClick(eventToUse);
        }
      }

      wasLongPressRef.current = false;
      eventRef.current = null;
    },
    [onClick]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    isPressed,
    handlers: {
      onMouseDown: startPress,
      onMouseUp: cancelPress,
      onMouseLeave: cancelPress,
      onTouchStart: startPress,
      onTouchEnd: cancelPress,
      onTouchMove: cancelPress,
    },
  };
}
