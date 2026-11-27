'use client';

import { useEffect, useRef } from 'react';
import { Expand, Bomb, Sparkles, Flag, X } from 'lucide-react';
import { GitHubPagesImage as Image } from '@/components/GitHubPagesImage';
import { cn } from '@/lib/utils';

export interface SoldierSheetActions {
  /** «Во весь экран» — полноразмерный просмотр фото */
  onFullscreen: () => void;
  /** «Граната» — только пока доступна (раз за бой на взвод) */
  grenade?: { onClick: () => void; disabled?: boolean };
  /** «Эффекты» — модал бафов/дебафов/свойств */
  onEffects?: () => void;
  /** «Захват» — только когда есть кандидаты (миссии с техникой) */
  onCapture?: () => void;
}

interface SoldierActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  soldierLabel: string;
  squadName: string;
  imageUrl?: string;
  actions: SoldierSheetActions;
}

/**
 * Лист действий бойца (2026-11-27: ⋯ в углу карточки убран — угол отдан
 * статам). Открывается тапом по фото живого бойца: фото — самая большая
 * тач-цель карточки (≥44×44 на любом вьюпорте). Строки ведут напрямик:
 * граната → боевая модалка в фазе гранаты, эффекты → модал эффектов,
 * захват → модал захвата, «во весь экран» → прежний фуллскрин-оверлей.
 * Закрытие: тап по фону, свайп вниз за ручку, Esc.
 */
export function SoldierActionSheet({
  isOpen,
  onClose,
  soldierLabel,
  squadName,
  imageUrl,
  actions,
}: SoldierActionSheetProps) {
  // | null в generic'е: useRef(null) без него даёт readonly RefObject
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rows: Array<{
    key: string;
    label: string;
    hint: string;
    icon: React.ReactNode;
    tone: string;
    onClick?: () => void;
    disabled?: boolean;
  }> = [
    {
      key: 'fullscreen',
      label: 'Во весь экран',
      hint: 'Кто есть кто',
      icon: <Expand className="w-5 h-5" />,
      tone: 'text-slate-300 border-slate-700/50 bg-slate-800/50',
      onClick: actions.onFullscreen,
    },
    ...(actions.grenade ? [{
      key: 'grenade',
      label: 'Граната',
      hint: '1D20 на площадь • раз за бой',
      icon: <Bomb className="w-5 h-5" />,
      tone: 'text-emerald-400 border-emerald-600/50 bg-emerald-950/30',
      onClick: actions.grenade.onClick,
      disabled: actions.grenade.disabled,
    }] : []),
    ...(actions.onEffects ? [{
      key: 'effects',
      label: 'Эффекты',
      hint: 'Бафы • дебафы • спец-свойства',
      icon: <Sparkles className="w-5 h-5" />,
      tone: 'text-purple-400 border-purple-600/50 bg-purple-950/30',
      onClick: actions.onEffects,
    }] : []),
    ...(actions.onCapture ? [{
      key: 'capture',
      label: 'Захват',
      hint: 'Захватить технику',
      icon: <Flag className="w-5 h-5" />,
      tone: 'text-fuchsia-400 border-fuchsia-600/50 bg-fuchsia-950/30',
      onClick: actions.onCapture,
    }] : []),
  ];

  return (
    <div
      data-testid="soldier-action-sheet"
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Действия: ${soldierLabel}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-md mx-auto rounded-lg border border-slate-700 bg-slate-900',
          'p-3 outline-none',
          'shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-150'
        )}
      >
        {/* Шапка: крупное фото + кто это */}
        <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
          <div className="relative w-20 aspect-[3/4] rounded-md overflow-hidden bg-slate-800 shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
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
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-base font-bold uppercase tracking-wider text-slate-100 truncate">
              {soldierLabel}
            </div>
            <div className="font-mono text-[11px] text-slate-400 truncate">{squadName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm text-slate-500 hover:text-slate-200 hover:bg-slate-800/70 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Строки действий */}
        <div className="pt-2 space-y-1.5">
          {rows.map((row) => (
            <button
              key={row.key}
              type="button"
              data-testid={`sheet-action-${row.key}`}
              onClick={row.disabled ? undefined : () => { row.onClick?.(); onClose(); }}
              disabled={row.disabled}
              className={cn(
                'w-full min-h-[48px] flex items-center gap-3 rounded-md border px-3 text-left transition-all select-none',
                row.tone,
                row.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer hover:brightness-125 active:scale-[0.98]'
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-700/60 bg-slate-900/60 shrink-0">
                {row.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-sm font-black uppercase tracking-wider leading-tight">
                  {row.label}
                </span>
                <span className="block font-mono text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                  {row.hint}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
