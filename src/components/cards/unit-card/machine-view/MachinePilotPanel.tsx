'use client';

import { Plane, Skull } from 'lucide-react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { PilotInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface MachinePilotPanelProps {
  pilotInfo: PilotInfo | null;
  pilotImage: string | null;
  survivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  onAssignPilot: () => void;
  onSurvivalTest: () => void;
  isTestRunning?: boolean;
}

export function MachinePilotPanel({
  pilotInfo,
  pilotImage,
  survivalTest,
  onAssignPilot,
  onSurvivalTest,
  isTestRunning = false
}: MachinePilotPanelProps) {
  return (
    <div className="row-span-2 w-12 h-28 md:w-14 md:h-28 shrink-0 relative">
      <button
        onClick={onAssignPilot}
        className="w-full h-full rounded-sm border-2 border-slate-700/50 overflow-hidden bg-slate-900/60 relative"
      >
        {/* Tech corners */}
        <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/40" />
        <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-slate-600/40" />
        <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-slate-600/40" />
        <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/40" />

        {pilotInfo ? (
          <>
            <GitHubPagesImage
              src={pilotImage || '/images/soldiers/empty.png'}
              width={48}
              height={64}
              className="w-full h-full object-cover object-center"
              alt="Пилот"
            />
            {/* Status overlay - Tech Style */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 text-[7px] md:text-[8px] font-mono font-bold text-center py-0.5 border-t",
              pilotInfo.alive
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-700/50"
                : "bg-red-950/90 text-red-300 border-red-700/50"
            )}>
              {pilotInfo.alive ? 'ЖИВ' : 'ПОГИБ'}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-0.5">
            <Plane className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[8px] md:text-[9px] font-mono font-bold uppercase">Пилот</span>
          </div>
        )}
      </button>

      {/* Survival Test Button - Overlay at bottom-right corner */}
      {pilotInfo && pilotInfo.alive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSurvivalTest();
          }}
          disabled={isTestRunning}
          className={cn(
            "absolute -bottom-1 -right-1 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-transform border-2 min-w-[36px] min-h-[36px]",
            isTestRunning && "animate-pulse",
            survivalTest
              ? survivalTest.survived
                ? "bg-green-600 border-green-900 text-white"
                : "bg-red-600 border-red-900 text-white"
              : isTestRunning
              ? "bg-purple-600 border-purple-900 text-white animate-spin"
              : "bg-purple-900 border-purple-950 text-purple-300 hover:bg-purple-800 hover:scale-110"
          )}
          title={survivalTest ? `Повторить тест (последний: ${survivalTest.survived ? 'ВЫЖИЛ' : 'ПОГИБ'})` : "Тест выживаемости пилота (D12 + D6)"}
        >
          <Skull className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      )}
    </div>
  );
}
