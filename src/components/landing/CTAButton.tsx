'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sword, RotateCcw, Clock, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

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
    return `${diffMinutes}мин`;
  }

  // Less than a day
  if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes > 0) {
      return `${diffHours}ч ${remainingMinutes}мин`;
    }
    return `${diffHours}ч`;
  }

  // Days and hours
  const remainingHours = diffHours % 24;
  if (remainingHours > 0) {
    return `${diffDays}д ${remainingHours}ч`;
  }
  return `${diffDays}д`;
}

/** Модульная строка первого экрана: ШТАБ (primary) + ЭНЦИКЛОПЕДИЯ + КАЛЬКУЛЯТОР.
 *  Единая разметка для SSR и свежего состояния клиента. */
function ModuleRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-stretch gap-2.5 w-full max-w-sm mx-auto', className)}>
      {/* Primary: ШТАБ */}
      <Link
        href="/app"
        data-testid="landing-cta-button"
        onClick={() => trackEvent('battle_entry', { from: 'landing_hero' })}
        className="group relative inline-flex bg-transparent border-2 border-military-rust/60 font-russo font-bold text-sm sm:text-base uppercase tracking-wider md:tracking-widest text-military-rust hover:border-military-amber hover:text-military-amber transition-all duration-300 overflow-hidden touch-manipulation min-h-[56px] no-underline"
      >
        <span className="absolute inset-0 bg-military-rust/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
        <span className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-military-rust" />
        <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-military-rust" />
        <span className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-military-rust" />
        <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-military-rust" />
        <span className="relative flex items-center justify-between gap-3 w-full px-4 sm:px-6">
          <span className="flex flex-col items-start leading-tight text-left">
            <span>ШТАБ</span>
            <span className="font-ibm-mono text-[9px] sm:text-[10px] normal-case tracking-normal text-military-steel/80">
              собери армию и веди бой
            </span>
          </span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </Link>

      {/* Secondary: ЭНЦИКЛОПЕДИЯ + КАЛЬКУЛЯТОР */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/encyclopedia"
          data-testid="landing-encyclopedia-button"
          className="group relative inline-flex items-center bg-transparent border-2 border-military-steel/30 hover:border-military-steel/60 transition-all duration-300 overflow-hidden touch-manipulation min-h-[44px] no-underline"
        >
          <span className="relative flex flex-col items-center justify-center leading-tight w-full px-2 py-2">
            <span className="font-russo font-bold text-[10px] sm:text-xs uppercase tracking-wider text-military-steel/80 group-hover:text-military-steel">
              ЭНЦИКЛОПЕДИЯ
            </span>
            <span className="font-ibm-mono text-[8px] sm:text-[9px] text-military-steel/50">
              отряды, лор, тактика
            </span>
          </span>
        </Link>
        <Link
          href="/calculator"
          data-testid="landing-calculator-button"
          className="group relative inline-flex items-center bg-transparent border-2 border-military-steel/30 hover:border-military-steel/60 transition-all duration-300 overflow-hidden touch-manipulation min-h-[44px] no-underline"
        >
          <span className="relative flex flex-col items-center justify-center leading-tight w-full px-2 py-2">
            <span className="font-russo font-bold text-[10px] sm:text-xs uppercase tracking-wider text-military-steel/80 group-hover:text-military-steel">
              КАЛЬКУЛЯТОР
            </span>
            <span className="font-ibm-mono text-[8px] sm:text-[9px] text-military-steel/50">
              броски и урон в бою
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
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
    return <ModuleRow className={className} />;
  }

  // Active battle state - compact battle card
  if (hasActiveBattle) {
    const dateText = lastBattleDate ? formatBattleDate(lastBattleDate) : null;

    return (
      <div className={cn(
        'relative w-full max-w-sm mx-auto',
        'bg-slate-900/60 backdrop-blur-sm',
        'border border-slate-700/50',
        'rounded-lg overflow-hidden',
        className
      )}>
        {/* Status bar with date */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="font-ibm-mono text-[10px] text-amber-400/90 tracking-wide uppercase">
              Бой идёт
            </span>
          </div>
          {dateText && (
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3" />
              <span className="font-ibm-mono text-[10px] text-slate-400">
                {dateText}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons - horizontal, compact */}
        <div className="flex items-stretch divide-x divide-slate-700/50">
          {/* Restart - secondary, compact */}
          <Link
            href="/app"
            onClick={handleRestart}
            data-testid="landing-restart-button"
            className="group flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2
              bg-slate-800/30 hover:bg-slate-700/50
              transition-all duration-200 touch-manipulation no-underline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-colors" />
            <span className="font-russo text-[10px] sm:text-xs text-slate-400 group-hover:text-slate-300 transition-colors uppercase">
              Начать заново
            </span>
          </Link>

          {/* Continue - primary, emphasized */}
          <Link
            href="/app"
            onClick={handleContinueBattle}
            data-testid="landing-continue-button"
            className="group flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2
              bg-amber-950/40 hover:bg-amber-950/60
              relative overflow-hidden
              transition-all duration-200 touch-manipulation no-underline"
          >
            {/* Active glow effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <Sword className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-400 transition-colors" />
            <span className="font-russo text-[10px] sm:text-xs text-amber-400 group-hover:text-amber-300 transition-colors uppercase font-semibold">
              <span className="hidden sm:inline">Продолжить бой</span>
              <span className="sm:hidden">В бой</span>
            </span>
          </Link>

          {/* Calculator */}
          <Link
            href="/calculator"
            className="group flex items-center justify-center gap-1 px-2 sm:px-3 py-2
              bg-slate-800/30 hover:bg-slate-700/50
              transition-all duration-200 touch-manipulation no-underline"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-colors" />
            <span className="font-russo text-[10px] sm:text-xs text-slate-400 group-hover:text-slate-300 transition-colors uppercase">
              <span className="hidden sm:inline">Калькулятор</span>
              <span className="sm:hidden">Кальк</span>
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // Normal state - модульная строка: ШТАБ + ЭНЦИКЛОПЕДИЯ + КАЛЬКУЛЯТОР
  return <ModuleRow className={className} />;
}
