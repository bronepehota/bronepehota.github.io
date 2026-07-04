'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowRightCircle, Loader2, Plane, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PilotInfo } from '@/lib/types';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';

interface PilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  pilotInfo: PilotInfo;
  pilotImage: string | null;
  pilotLabel?: string;
  survivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  isTestRunning: boolean;
  onSurvivalTest: () => void;
  onAssignPilot: () => void;
  onNavigateToUnit?: (unitInstanceId: string) => void;
}

export function PilotModal({
  isOpen, onClose, pilotInfo, pilotImage, pilotLabel, survivalTest, isTestRunning, onSurvivalTest, onAssignPilot, onNavigateToUnit,
}: PilotModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const alive = !!pilotInfo.alive;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Карточка пилота"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-700/60 bg-slate-800/50">
          <div className="flex items-center gap-2 min-w-0">
            <Plane className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-100 truncate">{pilotLabel || 'Пилот'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="shrink-0 -mr-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex gap-3 items-center mb-4">
            <div className="w-20 aspect-[4/5] rounded-lg overflow-hidden border border-purple-700/30 bg-slate-950/60 shrink-0">
              <GitHubPagesImage
                src={pilotImage || '/images/soldiers/empty.png'}
                alt="Пилот"
                width={80}
                height={100}
                className="w-full h-full object-cover object-top"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <div className={cn(
                'text-xs inline-block px-2 py-0.5 rounded font-semibold',
                alive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
              )}>
                {alive ? `Жив · броня ${pilotInfo.pilotArmor ?? 0}` : 'Погиб'}
              </div>
              {survivalTest && (
                <div className={cn('text-[11px] mt-2', survivalTest.survived ? 'text-emerald-400' : 'text-red-400')}>
                  {survivalTest.survived ? '✓ Выжил' : '✗ Погиб'} (бросок {survivalTest.roll})
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {alive && (
              <button
                type="button"
                onClick={onSurvivalTest}
                disabled={isTestRunning}
                data-testid="pilot-modal-test-button"
                className={cn(
                  'flex-1 min-h-[44px] rounded-lg px-3 py-2 text-sm font-bold border flex items-center justify-center gap-1.5 transition-colors',
                  isTestRunning
                    ? 'bg-purple-950/50 border-purple-700/50 text-purple-300'
                    : 'bg-amber-950/40 border-amber-500/60 text-amber-200 hover:bg-amber-950/60'
                )}
              >
                {isTestRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Тест…</> : <><AlertTriangle className="w-4 h-4" /> Тест пилота</>}
              </button>
            )}
            <button
              type="button"
              onClick={onAssignPilot}
              className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-bold border border-slate-600/60 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60 transition-colors"
            >
              Сменить
            </button>
          </div>

          {onNavigateToUnit && pilotInfo.squadInstanceId && (
            <button
              type="button"
              onClick={() => { onClose(); onNavigateToUnit(pilotInfo.squadInstanceId); }}
              className="w-full min-h-[44px] mt-2 rounded-lg px-3 py-2 text-xs font-bold border border-purple-700/40 bg-purple-950/20 text-purple-300 hover:bg-purple-950/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowRightCircle className="w-4 h-4" />
              Перейти к отряду
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
