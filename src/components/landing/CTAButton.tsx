'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sword, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTAButtonProps {
  className?: string;
}

// Format date in Russian: "2д 5ч назад" or "3ч 45мин назад"
function formatBattleDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Less than an hour
  if (diffMinutes < 60) {
    return `${diffMinutes} мин назад`;
  }

  // Less than a day
  if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes > 0) {
      return `${diffHours}ч ${remainingMinutes}мин назад`;
    }
    return `${diffHours}ч назад`;
  }

  // Days and hours
  const remainingHours = diffHours % 24;
  if (remainingHours > 0) {
    return `${diffDays}д ${remainingHours}ч назад`;
  }
  return `${diffDays}д назад`;
}

export default function CTAButton({ className }: CTAButtonProps) {
  const router = useRouter();
  const [hasActiveBattle, setHasActiveBattle] = useState(false);
  const [lastBattleDate, setLastBattleDate] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Check for active battle on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('bronepehota_army');
    if (saved) {
      try {
        const army = JSON.parse(saved);
        if (army.isInBattle === true) {
          setHasActiveBattle(true);
          setLastBattleDate(army.lastBattleDate || null);
        }
      } catch (e) {
        console.error('Failed to parse army', e);
      }
    }
  }, []);

  const handleContinueBattle = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem('bronepehota_view', 'game');
    router.push('/app');
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.preventDefault();
    // Fully reset army to initial state
    const resetArmy = {
      name: 'Моя Армия',
      faction: 'polaris',
      units: [],
      totalCost: 0,
      currentStep: 'faction-select' as const,
      isInBattle: false,
      currentTurn: 1,
    };
    localStorage.setItem('bronepehota_army', JSON.stringify(resetArmy));
    localStorage.setItem('bronepehota_view', 'builder');
    router.push('/app');
  };

  // Don't render different content during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <Link
        href="/app"
        data-testid="landing-cta-button"
        className={cn(
          'group relative inline-flex',
          'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4',
          'bg-transparent',
          'border-2 border-military-rust/60',
          'font-russo font-bold text-sm sm:text-base md:text-lg',
          'uppercase tracking-wider md:tracking-widest',
          'text-military-rust',
          'hover:border-military-amber hover:text-military-amber transition-all duration-300',
          'overflow-hidden touch-manipulation',
          'min-h-[44px] md:min-h-[56px]',
          'hover:shadow-[0_0_20px_rgba(234,88,12,0.3)]',
          'no-underline',
          className
        )}
      >
        <span className="absolute inset-0 bg-military-rust/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
        <span className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-military-rust" />
        <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-military-rust" />
        <span className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-military-rust" />
        <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-military-rust" />
        <span className="relative flex items-center gap-2 md:gap-3">
          <span className="hidden sm:inline">ПЕРЕЙТИ В ШТАБ</span>
          <span className="sm:hidden">В ШТАБ</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
        </span>
        <span className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-military-rust/20 to-transparent transform -translate-x-full group-hover:animate-shine" />
        </span>
      </Link>
    );
  }

  // Active battle state - show two buttons with date info
  if (hasActiveBattle) {
    const dateText = lastBattleDate ? formatBattleDate(lastBattleDate) : null;

    return (
      <div className={cn('flex flex-col gap-3 items-center', className)}>
        {/* Battle date indicator */}
        {dateText && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-sm">
            <Clock className="w-3.5 h-3.5 text-amber-500/70" />
            <span className="font-ibm-mono text-xs text-amber-400/80 tracking-wide">
              Бой начат: {dateText}
            </span>
          </div>
        )}

        {/* Buttons row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          {/* Restart button - secondary */}
          <Link
            href="/app"
            onClick={handleRestart}
            data-testid="landing-restart-button"
            className={cn(
              'group relative inline-flex items-center justify-center',
              'px-4 py-2 sm:px-5 sm:py-3',
              'bg-slate-800/80 border-2 border-slate-600/60',
              'font-russo font-bold text-sm sm:text-base',
              'uppercase tracking-wider',
              'text-slate-400',
              'hover:border-slate-500 hover:text-slate-200',
              'hover:bg-slate-700/80',
              'transition-all duration-300',
              'overflow-hidden touch-manipulation',
              'min-h-[44px] sm:min-h-[48px]',
              'rounded-sm',
              'no-underline'
            )}
          >
            <span className="absolute inset-0 bg-slate-600/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            <span className="relative flex items-center gap-2">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Начать заново</span>
            </span>
          </Link>

          {/* Continue battle button - primary, highlighted */}
          <Link
            href="/app"
            onClick={handleContinueBattle}
            data-testid="landing-continue-button"
            className={cn(
              'group relative inline-flex items-center justify-center',
              'px-4 py-2 sm:px-6 sm:py-3',
              'bg-amber-950/50 border-2 border-amber-500/70',
              'font-russo font-bold text-sm sm:text-base',
              'uppercase tracking-wider',
              'text-amber-400',
              'hover:border-amber-400 hover:text-amber-300',
              'hover:bg-amber-950/70',
              'hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]',
              'transition-all duration-300',
              'overflow-hidden touch-manipulation',
              'min-h-[44px] sm:min-h-[48px]',
              'rounded-sm',
              'animate-pulse-slow',
              'no-underline'
            )}
          >
            {/* Pulsing glow effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent transform -translate-x-full group-hover:animate-shine" />

            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-500" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-500" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-500" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-500" />

            {/* Alert icon indicator */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />

            <span className="relative flex items-center gap-2">
              <Sword className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Продолжить бой</span>
              <span className="sm:hidden">В бой</span>
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // Normal state - single CTA button
  return (
    <Link
      href="/app"
      data-testid="landing-cta-button"
      className={cn(
        'group relative inline-flex',
        'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4',
        'bg-transparent',
        'border-2 border-military-rust/60',
        'font-russo font-bold text-sm sm:text-base md:text-lg',
        'uppercase tracking-wider md:tracking-widest',
        'text-military-rust',
        'hover:border-military-amber hover:text-military-amber transition-all duration-300',
        'overflow-hidden touch-manipulation',
        'min-h-[44px] md:min-h-[56px]',
        'hover:shadow-[0_0_20px_rgba(234,88,12,0.3)]',
        'no-underline',
        className
      )}
    >
      {/* Button background overlay */}
      <span className="absolute inset-0 bg-military-rust/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />

      {/* Corner accents - responsive size */}
      <span className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-military-rust" />
      <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-military-rust" />
      <span className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-military-rust" />
      <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-military-rust" />

      {/* Button content - responsive icon and gap */}
      <span className="relative flex items-center gap-2 md:gap-3">
        <span className="hidden sm:inline">ПЕРЕЙТИ В ШТАБ</span>
        <span className="sm:hidden">В ШТАБ</span>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
      </span>

      {/* Scanline effect on hover */}
      <span className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-military-rust/20 to-transparent transform -translate-x-full group-hover:animate-shine" />
      </span>
    </Link>
  );
}
