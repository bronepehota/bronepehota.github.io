'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { getFactionColors } from '@/lib/faction-colors';
import { FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UnitToBattleCtaProps {
  faction: FactionID;
  /** Задан (отряды) — под primary рисуется кнопка «ПРОВЕРИТЬ БОЕМ» (песочница).
   *  У машин статов солдата нет, поэтому callback не передаётся. */
  onOpenSandbox?: () => void;
}

/** Мост «энциклопедия → игра»: панель призыва в конце досье юнита. */
export function UnitToBattleCta({ faction, onOpenSandbox }: UnitToBattleCtaProps) {
  const colors = getFactionColors(faction);
  return (
    <section
      data-testid="unit-to-battle-cta"
      className="folded-paper military-corners p-5 md:p-6"
      style={{ borderColor: `${colors.primary}55` }}
    >
      <div className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-rust mb-3">
        {'// В БОЙ'}
      </div>
      <Link
        href={`/app?faction=${faction}`}
        onClick={() => trackEvent('battle_entry', { from: 'encyclopedia_unit' })}
        className={cn(
          'group inline-flex items-center justify-between gap-3 w-full',
          'min-h-[52px] px-4 md:px-5 py-3 no-underline touch-manipulation',
          'border-2 transition-all duration-300 hover:brightness-110',
          'shadow-[0_0_24px_-10px]',
        )}
        style={{ borderColor: colors.primary, backgroundColor: colors.primary, color: '#fff' }}
      >
        <span className="font-russo font-bold text-sm md:text-base uppercase tracking-wider">
          Взять отряд в бой
        </span>
        <ArrowRight className="w-5 h-5 shrink-0 transform group-hover:translate-x-1 transition-transform duration-300" />
      </Link>

      {/* Тихий вход в standalone-калькулятор: упрощённый вариант — статы
          руками; пояснение одной строкой, контраст с боевым режимом. */}
      <Link
        href="/calculator"
        data-testid="unit-calculator-link"
        className={cn(
          'mt-3 w-full flex items-center justify-between gap-2',
          'min-h-[44px] px-4 py-2.5 no-underline touch-manipulation',
          'border bg-transparent transition-all duration-300 hover:brightness-125',
          'font-russo font-bold text-[11px] sm:text-xs uppercase tracking-wider',
        )}
        style={{ borderColor: `${colors.primary}55`, color: colors.primary }}
      >
        <span>Калькулятор · без армии</span>
        <ArrowRight className="w-4 h-4 shrink-0" />
      </Link>
      <div className="mt-1.5 font-ibm-mono text-[8px] uppercase tracking-[0.2em] text-military-taupe/70 text-center">
        в бою статы подтянутся сами
      </div>
      {onOpenSandbox && (
        <button
          type="button"
          data-testid="unit-sandbox-open"
          onClick={onOpenSandbox}
          className={cn(
            'mt-3 w-full flex items-center justify-center',
            'min-h-[48px] px-4 py-3 touch-manipulation',
            'border-2 bg-transparent transition-all duration-300 hover:brightness-125',
            'font-russo font-bold text-sm uppercase tracking-wider',
          )}
          style={{ borderColor: `${colors.primary}99`, color: colors.primary }}
        >
          {'ПРОВЕРИТЬ БОЕМ'}
        </button>
      )}
    </section>
  );
}
