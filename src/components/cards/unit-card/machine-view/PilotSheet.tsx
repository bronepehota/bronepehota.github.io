'use client';

import { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PilotInfo } from '@/lib/types';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';

interface PilotSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pilotInfo: PilotInfo;
  pilotImage: string | null;
  survivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  isTestRunning: boolean;
  onSurvivalTest: () => void;
  onAssignPilot: () => void;
}

export function PilotSheet({
  isOpen, onClose, pilotInfo, pilotImage, survivalTest, isTestRunning, onSurvivalTest, onAssignPilot,
}: PilotSheetProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({ onClose, isEnabled: isOpen });

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
      className="fixed inset-0 z-[150] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        {...touchHandlers}
        className="relative w-full max-w-md bg-slate-900 border border-purple-700/30 rounded-t-2xl p-4 shadow-2xl"
      >
        <div className="w-10 h-1 bg-slate-600 rounded mx-auto mb-3" aria-hidden="true" />
        <div className="flex gap-3 items-center mb-4">
          <div className="w-16 aspect-[4/5] rounded-lg overflow-hidden border border-purple-700/30 bg-slate-950/60 shrink-0">
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
            <div className="text-sm font-semibold text-slate-100">Пилот</div>
            <div className={cn(
              'text-xs mt-0.5 inline-block px-2 py-0.5 rounded',
              alive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
            )}>
              {alive ? `Жив · броня ${pilotInfo.pilotArmor ?? 0}` : 'Погиб'}
            </div>
            {survivalTest && (
              <div className={cn('text-[11px] mt-1', survivalTest.survived ? 'text-emerald-400' : 'text-red-400')}>
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
              data-testid="pilot-sheet-test-button"
              className={cn(
                'flex-1 min-h-[44px] rounded-lg px-3 py-2 text-sm font-bold border flex items-center justify-center gap-1.5 transition-colors',
                isTestRunning
                  ? 'bg-purple-950/50 border-purple-700/50 text-purple-300'
                  : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
              )}
            >
              {isTestRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Тест…</> : <><AlertTriangle className="w-4 h-4" /> Тест пилота</>}
            </button>
          )}
          <button
            type="button"
            onClick={onAssignPilot}
            className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-bold border border-slate-600/60 bg-slate-800/60 text-slate-200"
          >
            Сменить
          </button>
        </div>
      </div>
    </div>
  );
}
