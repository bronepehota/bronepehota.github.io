'use client';

import { AlertTriangle, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PilotInfo } from '@/lib/types';

interface PilotChipProps {
  pilotInfo: PilotInfo | null;
  pilotTestUrgent: boolean;
  /** Resolved pilot label, e.g. "ЛИНЕ #3·1" (squad short name + squad № + soldier №). */
  pilotLabel?: string;
  onOpenPilot: () => void;
}

export function PilotChip({ pilotInfo, pilotTestUrgent, pilotLabel, onOpenPilot }: PilotChipProps) {
  const hasPilot = !!pilotInfo;
  const alive = !!pilotInfo?.alive;
  const urgent = hasPilot && alive && pilotTestUrgent;

  return (
    <button
      type="button"
      onClick={onOpenPilot}
      data-testid={hasPilot ? undefined : 'assign-pilot-button'}
      aria-label={
        !hasPilot ? 'Назначить пилота' :
        alive ? (urgent ? `Тест пилота: получен урон${pilotLabel ? ` (${pilotLabel})` : ''}` : `Открыть карточку пилота${pilotLabel ? `: ${pilotLabel}` : ''}`) :
        `Пилот погиб${pilotLabel ? `: ${pilotLabel}` : ''}`
      }
      className={cn(
        'w-full min-h-[44px] rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs font-semibold transition-colors',
        'border touch-manipulation',
        urgent
          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-[0_0_12px_-3px_rgba(245,158,11,0.6)]'
          : !hasPilot
            ? 'bg-slate-900/60 border-slate-700/50 text-slate-400'
            : alive
              ? 'bg-slate-900/60 border-purple-700/30 text-purple-200'
              : 'bg-red-950/40 border-red-700/40 text-red-300'
      )}
    >
      <span className="flex items-center gap-1.5 truncate">
        {urgent ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <Plane className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">
          {!hasPilot ? 'Пилота нет' : (pilotLabel || 'Пилот назначен')}
        </span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        {urgent && (
          <span className="text-[9px] uppercase tracking-wide bg-amber-600/40 px-1.5 py-0.5 rounded">Тревога</span>
        )}
        {hasPilot && !urgent && (
          <span className={cn(
            'text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded',
            alive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
          )}>
            {alive ? 'Жив' : 'Погиб'}
          </span>
        )}
        {!hasPilot && <span className="text-[9px] text-slate-500">назначить</span>}
        <span className="text-slate-500 text-[10px]">▸</span>
      </span>
    </button>
  );
}
