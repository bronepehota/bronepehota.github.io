'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntroBriefingProps {
  onStart: () => void;
}

const STEPS = [
  { n: '①', title: 'ПРАВИЛА', desc: 'версия правил боя' },
  { n: '②', title: 'АРМИЯ', desc: 'фракция, бюджет, отряды' },
  { n: '③', title: 'БОЙ', desc: 'ходы, броски, счётчики' },
] as const;

/** Брифинг-экран «что будет происходить» — шаг 0 визарда, только новичок.
 *  HUD-композиция: шапка сверху, консоль запуска прижата к нижней кромке. */
export function IntroBriefing({ onStart }: IntroBriefingProps) {
  return (
    <div
      data-testid="intro-briefing"
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center px-4 py-6"
    >
      <div className="w-full max-w-md flex-1 flex flex-col">
        {/* Шапка брифинга */}
        <div className="pt-6 md:pt-10">
          <div className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-rust/70 mb-3">
            {'// БРИФИНГ'}
          </div>
          <h1 className="font-russo font-black text-2xl md:text-4xl military-text-gradient mb-2 leading-tight">
            СОБЕРИ АРМИЮ<br />И В БОЙ
          </h1>
          <p className="font-oswald text-sm md:text-base text-military-taupe mb-6">
            Три шага — и сражение за игровым столом.
          </p>
        </div>

        {/* Шаги с рельсом-последовательностью */}
        <div className="relative space-y-3 my-auto">
          {/* вертикальная линия, связывающая ①→②→③ */}
          <span
            aria-hidden
            className="absolute left-[27px] top-[38px] bottom-[38px] w-px bg-military-rust/25"
          />
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="folded-paper military-corners p-4 flex items-baseline gap-3 relative fade-in-up opacity-0"
              style={{ animationFillMode: 'forwards', animationDelay: `${0.05 + i * 0.1}s` }}
            >
              <span className="font-russo text-lg text-military-rust shrink-0">{s.n}</span>
              <div>
                <div className="font-russo font-bold text-sm md:text-base text-military-sand tracking-wider">
                  {s.title}
                </div>
                <div className="font-ibm-mono text-[10px] md:text-xs text-military-steel/70 mt-0.5">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Консоль запуска — прижата к нижней кромке */}
        <div className="pt-6 pb-2">
          <button
            type="button"
            onClick={onStart}
            data-testid="intro-start-button"
            className={cn(
              'group relative w-full min-h-[56px]',
              'border-2 border-military-rust/60 hover:border-military-amber',
              'font-russo font-bold text-sm md:text-base uppercase tracking-widest',
              'text-military-rust hover:text-military-amber',
              'transition-all duration-300 touch-manipulation',
              'active:translate-y-0.5 active:transition-transform active:duration-75',
              'inline-flex items-center justify-center gap-3',
            )}
          >
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-military-rust" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-military-rust" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-military-rust" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-military-rust" />
            НАЧАТЬ СБОРКУ
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
