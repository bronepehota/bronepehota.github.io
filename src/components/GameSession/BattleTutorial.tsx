'use client';

import { useEffect, useRef, useState } from 'react';
import { LayoutGrid, MousePointerClick } from 'lucide-react';
import { GitHubPagesImage as Image } from '@/components/GitHubPagesImage';
import { useCardSwipe } from '@/hooks/useCardSwipe';
import { cn } from '@/lib/utils';

interface BattleTutorialProps {
  /** Фото первого бойца первого взвода — «учебная мишень» */
  demoImageUrl?: string;
  onFinish: () => void;
}

/**
 * «Боевой инструктаж» — интерактивный туториал при первом заходе в бой
 * (плейтест: жесты надо показать). Демо-карточка НЕ трогает реальный взвод:
 * пользователь сам повторяет свайпы (влево — готов, вправо — убит) на
 * копии, затем — подсказка про кнопку СПИСОК в доке. Показ однократно,
 * флаг в localStorage (плюс «Пропустить» в любой момент).
 */
export function BattleTutorial({ demoImageUrl, onFinish }: BattleTutorialProps) {
  const [step, setStep] = useState(0); // 0: свайп влево · 1: вправо · 2: СПИСОК
  const [demoDone, setDemoDone] = useState(false);
  const [demoDead, setDemoDead] = useState(false);

  const swipe = useCardSwipe({
    onSwipeLeft: () => {
      if (step === 0) {
        setDemoDone(true);
        setStep(1);
      }
    },
    onSwipeRight: () => {
      if (step === 1) {
        setDemoDead(true);
        setStep(2);
      }
    },
  });

  // a11y (aria-modal): фокус в диалог при открытии, Tab не уходит за
  // пределы, Esc — пропустить, фокус возвращается при закрытии
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => prev?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onFinish();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const stepMeta = [
    { title: 'СВАЙП ВЛЕВО — ГОТОВ', hint: '← проведи карточку влево' },
    { title: 'СВАЙП ВПРАВО — УБИТ', hint: 'проведи карточку вправо →' },
    { title: 'ШПАРГАЛКА БОЯ', hint: '' },
  ][step];

  return (
    <div
      data-testid="battle-tutorial"
      role="dialog"
      aria-modal="true"
      aria-label="Боевой инструктаж"
      className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-sm border-2 border-amber-700/50 bg-slate-900 rounded-lg p-4 space-y-4 shadow-2xl outline-none"
      >
        {/* Шапка + шаги */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/90">
            {'// Боевой инструктаж'}
          </span>
          <span className="ml-auto flex gap-1" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className={cn('h-1 w-4 rounded-full', i <= step ? 'bg-amber-500' : 'bg-slate-700')}
              />
            ))}
          </span>
        </div>

        {step < 2 ? (
          <>
            <h3 className="font-mono font-bold uppercase tracking-wider text-slate-100 text-sm text-center">
              {stepMeta.title}
            </h3>

            {/* Демо-карточка бойца — свайп работает как в бою */}
            <div className="flex justify-center py-1">
              <div
                {...swipe.handlers}
                style={swipe.style}
                data-testid="battle-tutorial-demo-card"
                className={cn(
                  'relative w-44 rounded-sm border flex items-center gap-2 p-1.5 touch-pan-y select-none transition-all',
                  demoDead
                    ? 'bg-slate-950/80 border-slate-800 opacity-50 grayscale'
                    : demoDone
                      ? 'bg-slate-900/40 border-emerald-700/50'
                      : 'bg-slate-800/30 border-slate-700/50'
                )}
              >
                <div className="relative w-16 aspect-[3/4] rounded-sm overflow-hidden bg-slate-900 shrink-0">
                  {demoImageUrl ? (
                    <Image
                      src={demoImageUrl}
                      alt=""
                      width={60}
                      height={80}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: '50% 15%' }}
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-mono text-[10px] text-slate-500">БОЕЦ</span>
                  )}
                  {demoDead && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 font-mono text-lg font-black text-red-500">✕</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 font-mono">
                  <div className={cn('text-xs font-bold uppercase truncate', demoDead ? 'text-slate-400 line-through' : 'text-slate-200')}>
                    Боец #1
                  </div>
                  <div className="mt-1 h-5 px-1 inline-flex items-center rounded-tl-sm border text-[10px] font-bold"
                    style={
                      demoDead
                        ? { background: 'rgba(127,29,29,.8)', borderColor: 'rgba(185,28,28,.6)', color: '#fca5a5' }
                        : demoDone
                          ? { background: 'rgba(21,94,117,.9)', borderColor: 'rgba(16,185,129,.7)', color: '#fff' }
                          : { background: 'rgba(2,6,23,.4)', borderColor: 'transparent', color: 'rgba(255,255,255,.75)' }
                    }
                  >
                    {demoDead ? 'УБИТ' : 'ГОТОВ'}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center font-mono text-[11px] text-amber-200/90 animate-pulse" data-testid="battle-tutorial-hint">
              {stepMeta.hint}
            </p>
          </>
        ) : (
          <>
            <h3 className="font-mono font-bold uppercase tracking-wider text-slate-100 text-sm text-center">
              {stepMeta.title}
            </h3>

            {/* Рекап жестов — последнее, что читают перед боем */}
            <div className="flex items-center justify-center gap-3 rounded-sm border border-amber-700/40 bg-amber-950/20 px-3 py-2">
              <span className="font-mono text-[11px] text-amber-200/90">
                ← свайп: готов
              </span>
              <span className="h-3 w-px bg-amber-700/40" aria-hidden="true" />
              <span className="font-mono text-[11px] text-amber-200/90">
                убит: свайп →
              </span>
            </div>

            {/* Нажатия — только статы и ГОТОВ; убит — свайп (кнопки «череп»
                больше нет: свайп вправо — единственный путь убить/оживить) */}
            <div className="flex items-center gap-3 rounded-sm border border-slate-700/50 bg-slate-800/40 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-slate-700/50 bg-slate-800/60 shrink-0">
                <MousePointerClick className="h-4 w-4 text-slate-300" />
              </span>
              <p className="text-[12px] leading-relaxed text-slate-300">
                <span className="font-mono font-bold text-slate-100">Статы бойца</span> — выстрел
                и действия; чип <span className="font-mono font-bold text-slate-100">ГОТОВ</span> на
                фото — завершить ход (долгое нажатие — отмена);{' '}
                <span className="font-mono font-bold text-slate-100">убит — свайп вправо</span>{' '}
                (повторный — оживляет).
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-sm border border-slate-700/50 bg-slate-800/40 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-slate-700/50 bg-slate-800/60 shrink-0">
                <LayoutGrid className="h-4 w-4 text-slate-300" />
              </span>
              <p className="text-[12px] leading-relaxed text-slate-300">
                Кнопка <span className="font-mono font-bold text-slate-100">СПИСОК</span> в доке — все
                взводы и счётчик «походили N/M». Ход юнита завершился — список откроется сам.
                Меню <span className="font-mono font-bold text-slate-100">⋮</span> — новый тур и история боя.
              </p>
            </div>
            <button
              data-testid="battle-tutorial-finish"
              onClick={onFinish}
              className="w-full min-h-[48px] rounded-sm border-2 border-amber-600/60 bg-amber-900/40 font-mono text-sm font-black uppercase tracking-wider text-amber-200 transition-all hover:brightness-125 active:scale-95"
            >
              В бой
            </button>
          </>
        )}

        <button
          data-testid="battle-tutorial-skip"
          onClick={onFinish}
          className="mx-auto block font-mono text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-300"
        >
          Пропустить инструктаж
        </button>
      </div>
    </div>
  );
}
