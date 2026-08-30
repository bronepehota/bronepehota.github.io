'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sword } from 'lucide-react';
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

/** Модульная строка первого экрана: ШТАБ (primary) + широкая ЭНЦИКЛОПЕДИЯ.
 *  Единая разметка для SSR и свежего состояния клиента. */
function ModuleRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-stretch gap-2.5 w-full max-w-sm mx-auto', className)}>
      {/* Primary: ШТАБ */}
      <Link
        href="/app"
        data-testid="landing-cta-button"
        onClick={() => trackEvent('battle_entry', { from: 'landing_hero' })}
        className="group relative inline-flex bg-military-dark/85 backdrop-blur-sm border-2 border-military-rust font-russo font-bold text-sm sm:text-base uppercase tracking-wider md:tracking-widest text-military-rust hover:border-military-amber hover:text-military-amber transition-all duration-300 overflow-hidden touch-manipulation min-h-[56px] no-underline"
      >
        <span className="absolute inset-0 bg-military-rust/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
        <span className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-military-rust" />
        <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-military-rust" />
        <span className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-military-rust" />
        <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-military-rust" />
        <span className="relative flex items-center justify-between gap-3 w-full px-4 sm:px-6">
          <span className="flex flex-col items-start leading-tight text-left">
            <span>ШТАБ</span>
            <span className="font-ibm-mono text-[9px] sm:text-[10px] normal-case tracking-normal text-military-sand/70">
              собери армию и веди бой
            </span>
          </span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </Link>

      {/* Secondary: широкая ЭНЦИКЛОПЕДИЯ (быстрый расчёт боя — песочница на странице юнита) */}
      <Link
        href="/encyclopedia"
        data-testid="landing-encyclopedia-button"
        className="group relative inline-flex items-center bg-military-dark/75 backdrop-blur-sm border-2 border-military-steel/50 hover:border-military-steel transition-all duration-300 overflow-hidden touch-manipulation min-h-[44px] no-underline"
      >
        <span className="relative flex items-center justify-between leading-tight w-full px-4 py-2">
          <span className="flex flex-col items-start text-left">
            <span className="font-russo font-bold text-[10px] sm:text-xs uppercase tracking-wider text-military-sand/90 group-hover:text-white">
              ЭНЦИКЛОПЕДИЯ
            </span>
            <span className="font-ibm-mono text-[9px] sm:text-[10px] text-military-sand/60">
              отряды, лор, тактика
            </span>
          </span>
          <ArrowRight className="w-4 h-4 text-military-sand/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </span>
      </Link>
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
        // saveArmy пишет конверт {schemaVersion, army}; поддерживаем и голый
        // Army (легаси) — иначе isInBattle всегда undefined и карточка «Бой идёт»
        // не показывается (баг с PR #223, пойман ручным тестом 2026-08-28).
        const parsed = JSON.parse(saved);
        const army = parsed?.army ?? parsed;
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

    // Та же структура, что у ModuleRow без боя: primary во всю ширину +
    // вторичный ряд из двух модулей — вместо тесной 3-сегментной полосы.
    return (
      <div className={cn('flex flex-col items-stretch gap-2.5 w-full max-w-sm mx-auto', className)}>
        {/* Primary: Продолжить бой */}
        <Link
          href="/app"
          onClick={handleContinueBattle}
          data-testid="landing-continue-button"
          className="group relative inline-flex bg-military-dark/85 backdrop-blur-sm border-2 border-amber-500/70 hover:border-amber-400 font-russo font-bold text-sm sm:text-base uppercase tracking-wider md:tracking-widest text-amber-400 hover:text-amber-300 transition-all duration-300 overflow-hidden touch-manipulation min-h-[56px] no-underline"
        >
          <span className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-amber-500" />
          <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-amber-500" />
          <span className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-amber-500" />
          <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-amber-500" />
          <span className="relative flex items-center justify-between gap-3 w-full px-4 sm:px-6">
            <span className="flex flex-col items-start leading-tight text-left">
              <span>Продолжить бой</span>
              <span className="font-ibm-mono text-[9px] sm:text-[10px] normal-case tracking-normal text-military-sand/70">
                бой идёт{dateText ? ` · ${dateText}` : ''}
              </span>
            </span>
            <Sword className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transform group-hover:translate-x-1 transition-transform duration-300" />
          </span>
        </Link>

        {/* Secondary: Начать заново + Энциклопедия */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/app"
            onClick={handleRestart}
            data-testid="landing-restart-button"
            className="group relative inline-flex items-center bg-military-dark/75 backdrop-blur-sm border-2 border-military-steel/50 hover:border-military-steel transition-all duration-300 overflow-hidden touch-manipulation min-h-[44px] no-underline"
          >
            <span className="relative flex flex-col items-center justify-center leading-tight w-full px-2 py-2">
              <span className="font-russo font-bold text-[10px] sm:text-xs uppercase tracking-wider text-military-sand/90 group-hover:text-white">
                ЗАНОВО
              </span>
              <span className="font-ibm-mono text-[9px] sm:text-[10px] text-military-sand/60">
                сброс армии
              </span>
            </span>
          </Link>
          <Link
            href="/encyclopedia"
            data-testid="landing-encyclopedia-button"
            className="group relative inline-flex items-center bg-military-dark/75 backdrop-blur-sm border-2 border-military-steel/50 hover:border-military-steel transition-all duration-300 overflow-hidden touch-manipulation min-h-[44px] no-underline"
          >
            <span className="relative flex flex-col items-center justify-center leading-tight w-full px-2 py-2">
              <span className="font-russo font-bold text-[10px] sm:text-xs uppercase tracking-wider text-military-sand/90 group-hover:text-white">
                ЭНЦИКЛОПЕДИЯ
              </span>
              <span className="font-ibm-mono text-[9px] sm:text-[10px] text-military-sand/60">
                отряды, лор, тактика
              </span>
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // Normal state - модульная строка: ШТАБ + ЭНЦИКЛОПЕДИЯ
  return <ModuleRow className={className} />;
}
