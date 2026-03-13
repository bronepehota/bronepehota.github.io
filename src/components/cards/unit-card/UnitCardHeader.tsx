'use client';

import { CheckCircle2, X, ImageIcon, Bomb, UserX, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArmyUnit } from '@/lib/types';

interface UnitCardHeaderProps {
  unit: ArmyUnit;
  isDone: boolean;
  isAllDead?: boolean;
  grenadesAvailable?: boolean;
  grenadesUsed?: boolean;
  onToggleDone: () => void;
  onOpenDetails?: () => void;
  showPhotoButton?: boolean;
  onShowPhoto?: () => void;
}

export function UnitCardHeader({
  unit,
  isDone,
  isAllDead = false,
  grenadesAvailable = false,
  grenadesUsed = false,
  onToggleDone,
  onOpenDetails,
  showPhotoButton = false,
  onShowPhoto,
}: UnitCardHeaderProps) {
  const isSquad = unit.type === 'squad';
  const data = unit.data;

  return (
    <div
      className={cn(
        "p-2 md:p-3 flex justify-between items-center relative z-20 border-b border-slate-800/50",
        "sticky top-0 bg-slate-900/95",
        data.faction === 'polaris' ? "bg-red-950/20" : data.faction === 'protectorate' ? "bg-cyan-950/20" : "bg-yellow-950/20"
      )}
    >
      {/* Tech decoration - top line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-px",
        data.faction === 'polaris' ? "bg-red-600/20" : data.faction === 'protectorate' ? "bg-cyan-600/20" : "bg-yellow-600/20"
      )} />

      <div className={cn("flex-1 min-w-0", unit.instanceNumber && "pl-9 md:pl-11")}>
        {/* Row 1: Name + Done badge */}
        <div className="flex items-center gap-1 md:gap-2 min-w-0">
          <h3 className="min-w-0 flex-1 font-mono font-bold text-xs md:text-sm uppercase tracking-wide truncate" title={data.name}>{data.name}</h3>
          {isDone && !isAllDead && (
            <span className="shrink-0 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </span>
          )}
        </div>

        {/* Row 2: Status badges */}
        <div className="flex items-center gap-1 mt-0.5">
          {/* Cost */}
          <span className="text-[10px] md:text-xs font-mono font-bold text-slate-500">{data.cost} очк</span>

          {/* Grenade status - squads only */}
          {isSquad && grenadesAvailable && !isAllDead && (
            <div className={cn(
              "flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-sm border",
              grenadesUsed
                ? "bg-red-950/40 text-red-400 border-red-700/50"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-700/50"
            )}>
              <Bomb className="w-2 h-2 md:w-2.5 md:h-2.5 shrink-0" />
            </div>
          )}

          {/* All Dead badge */}
          {isAllDead && (
            <div className="bg-red-950/50 text-red-400 border border-red-700/70 px-1 py-0.5 rounded-sm text-[8px] md:text-[9px] font-mono font-black uppercase flex items-center gap-0.5">
              <UserX className="w-2 h-2 md:w-2.5 md:h-2.5 shrink-0" />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-0.5 md:gap-1" onClick={e => e.stopPropagation()}>
        {/* Machine Photo Button - Mobile only */}
        {showPhotoButton && onShowPhoto && (
          <button
            onClick={onShowPhoto}
            className="p-1.5 md:p-1 hover:bg-white/10 rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border border-slate-700/50 md:hidden"
            title="Показать фото"
            aria-label="Показать фото машины"
          >
            <ImageIcon className="w-4 h-4 opacity-50" />
          </button>
        )}
        {/* Encyclopedia button */}
        {onOpenDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="p-1.5 md:p-1 hover:bg-white/10 rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border border-slate-700/50"
            title="Энциклопедия"
            aria-label="Открыть энциклопедию"
          >
            <BookOpen className="w-4 h-4 opacity-50" />
          </button>
        )}
        <button
          onClick={onToggleDone}
          className="p-1.5 md:p-1 hover:bg-white/10 rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border border-slate-700/50"
          title={isDone ? "Отменить завершение хода" : "Завершить ход"}
        >
          {isDone ? (
            <X className="w-4 h-4 opacity-50 text-slate-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 opacity-50" />
          )}
        </button>
      </div>
    </div>
  );
}
