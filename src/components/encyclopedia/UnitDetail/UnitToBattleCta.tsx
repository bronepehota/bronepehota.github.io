'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { getFactionColors } from '@/lib/faction-colors';
import { FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UnitToBattleCtaProps {
  faction: FactionID;
}

/** Мост «энциклопедия → игра»: панель призыва в конце досье юнита. */
export function UnitToBattleCta({ faction }: UnitToBattleCtaProps) {
  const colors = getFactionColors(faction);
  return (
    <section
      data-testid="unit-to-battle-cta"
      className="folded-paper military-corners p-5 md:p-6"
      style={{ borderColor: `${colors.primary}55` }}
    >
      <div className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-rust/70 mb-3">
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
    </section>
  );
}
