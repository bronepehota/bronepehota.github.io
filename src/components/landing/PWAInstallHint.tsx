'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Download, Share2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PWAInstallHintProps {
  className?: string;
}

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

// Detect platform for appropriate instructions
function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  if (isIOS) return 'ios';

  // Android detection
  const isAndroid = /Android/.test(ua);
  if (isAndroid) return 'android';

  // Check if already installed (running in standalone mode)
  if ((window as any).matchMedia?.('(display-mode: standalone)').matches) {
    return 'unknown'; // Already installed
  }

  return 'desktop';
}

// Get platform-specific instructions
function getInstructions(platform: Platform) {
  switch (platform) {
    case 'ios':
      return {
        icon: <Share2 className="w-5 h-5" />,
        title: 'Установите приложение',
        steps: [
          'Нажмите кнопку «Поделиться»',
          'Прокрутите вниз и нажмите «На экран «Домой»»',
          'Нажмите «Добавить» в верхнем правом углу'
        ],
        note: 'Приложение будет работать как нативное и в полноэкранном режиме'
      };
    case 'android':
      return {
        icon: <Plus className="w-5 h-5" />,
        title: 'Установите приложение',
        steps: [
          'Нажмите на меню (три точки) в браузере',
          'Выберите «Установить приложение» или «Добавить на главный экран»'
        ],
        note: 'Быстрый доступ с главного экрана, оффлайн-режим'
      };
    default:
      return null;
  }
}

export default function PWAInstallHint({ className }: PWAInstallHintProps) {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Detect platform on mount
  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);

    // Only show on mobile platforms that aren't already installed
    const shouldShow = (detected === 'ios' || detected === 'android') &&
                       !localStorage.getItem('pwa-hint-dismissed');

    if (shouldShow) {
      // Delay showing for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle dismiss with localStorage persistence
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem('pwa-hint-dismissed', 'true');
    setTimeout(() => setIsDismissed(true), 300);
  }, []);

  // Don't render if dismissed or not on mobile or already installed
  if (isDismissed || !isVisible || platform === 'desktop' || platform === 'unknown') {
    return null;
  }

  const instructions = getInstructions(platform);
  if (!instructions) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4',
        'animate-slideUp',
        className
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10"
        onClick={handleDismiss}
      />

      {/* Hint card */}
      <div className="relative max-w-lg mx-auto">
        {/* Card container */}
        <div className="relative overflow-hidden rounded-lg border-2 border-military-rust/60 bg-military-charcoal/95 backdrop-blur-md shadow-2xl">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-military-rust via-military-amber to-military-rust" />

          {/* Scanline effect */}
          <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-military-rust/10 to-transparent animate-scan-vertical" />
          </div>

          {/* Content */}
          <div className="relative p-4 sm:p-5">
            {/* Header with dismiss button */}
            <div className="flex items-start justify-between gap-3 mb-4">
              {/* Icon and title */}
              <div className="flex items-center gap-3">
                {/* Icon container */}
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-military-rust/20 border border-military-rust/40 text-military-amber">
                  {instructions.icon}
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-russo font-bold text-sm sm:text-base text-military-amber uppercase tracking-wide">
                    {instructions.title}
                  </h3>
                  <p className="font-ibm-mono text-[10px] text-military-sand/60 uppercase tracking-wider">
                    PWA • Полноэкранный режим
                  </p>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-military-sand/10 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4 text-military-sand/60" />
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-4">
              <ol className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-xs sm:text-sm"
                  >
                    {/* Step number */}
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-sm bg-military-rust/30 border border-military-rust/50 font-ibm-mono text-[10px] text-military-amber">
                  {index + 1}
                </span>
                {/* Step text */}
                <span className="font-oswald text-military-sand/80 leading-snug">
                  {step}
                </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Note */}
            {instructions.note && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-military-sand/5 border border-military-sand/10">
                <Download className="w-3.5 h-3.5 text-military-amber/70 flex-shrink-0 mt-0.5" />
                <p className="font-ibm-mono text-[10px] text-military-sand/60 leading-relaxed">
                  {instructions.note}
                </p>
              </div>
            )}
          </div>

          {/* Corner accents */}
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-military-rust/40" />
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-military-rust/40" />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-military-rust/40" />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-military-rust/40" />
        </div>
      </div>
    </div>
  );
}
