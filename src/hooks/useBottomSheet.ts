'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseBottomSheetOptions {
  onClose: () => void;
  closeThreshold?: number;
  isEnabled?: boolean;
}

interface UseBottomSheetReturn {
  sheetRef: React.RefObject<HTMLDivElement>;
  dragY: number;
  isDragging: boolean;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function useBottomSheet({
  onClose,
  closeThreshold = 100,
  isEnabled = true,
}: UseBottomSheetOptions): UseBottomSheetReturn {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEnabled) return;

    // Only start dragging if touching near the top edge (drag handle area)
    const touch = e.touches[0];
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeY = touch.clientY - rect.top;
    // Allow dragging from top 100px of the sheet
    if (relativeY <= 100) {
      setIsDragging(true);
      startYRef.current = touch.clientY;
      currentYRef.current = 0;
    }
  }, [isEnabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isEnabled) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startYRef.current;

    // Only allow dragging downward
    if (deltaY > 0) {
      currentYRef.current = deltaY;
      setDragY(deltaY);

      // Apply transform to the sheet
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }

    // Prevent default to stop page scroll while dragging
    if (deltaY > 10) {
      e.preventDefault();
    }
  }, [isDragging, isEnabled]);

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (!isDragging || !isEnabled) return;

    const deltaY = currentYRef.current;
    setIsDragging(false);

    if (deltaY > closeThreshold) {
      // Close threshold exceeded - animate out and close
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.2s ease-out';
        sheetRef.current.style.transform = 'translateY(100%)';

        // Call onClose after animation completes
        setTimeout(() => {
          onClose();
          // Reset for next open
          if (sheetRef.current) {
            sheetRef.current.style.transition = '';
            sheetRef.current.style.transform = '';
          }
        }, 200);
      }
    } else {
      // Snap back to original position
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.2s ease-out';
        sheetRef.current.style.transform = 'translateY(0)';

        // Reset after animation
        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = '';
          }
        }, 200);
      }
    }

    setDragY(0);
    setIsDragging(false);
  }, [isDragging, isEnabled, closeThreshold, onClose]);

  // Reset transform on mount
  useEffect(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
  }, []);

  return {
    sheetRef,
    dragY,
    isDragging,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
