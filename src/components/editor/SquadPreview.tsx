/**
 * Squad preview - shows how squad will look in battle card
 * Mirrors the exact layout of SoldierCard from battle view
 */

'use client';

import { CustomSoldier } from '@/lib/editor/types';
import { SoldierImage } from '@/components/cards/soldier-card/SoldierImage';
import { SoldierStats } from '@/components/cards/soldier-card/SoldierStats';
import { getFactionColors } from '@/lib/faction-colors';
import { cn } from '@/lib/utils';

interface SquadPreviewProps {
  soldiers: CustomSoldier[];
  squadName: string;
  squadCost: number;
  faction?: string;
}

export function SquadPreview({
  soldiers,
  squadName,
  squadCost,
  faction = 'mercenaries',
}: SquadPreviewProps) {
  const colors = getFactionColors(faction);

  return (
    <div className="w-full max-w-4xl">
      {/* Unit Header - matches UnitCardHeader style */}
      <div className={cn(
        "px-2 md:px-3 py-2 flex justify-between items-center relative z-20 border-b border-slate-800/50",
        "sticky top-0 bg-slate-900/95",
        colors.bg
      )}>
        <div className="flex-1 min-w-0">
          <h3 className="min-w-0 font-mono font-bold text-xs md:text-sm uppercase tracking-wide truncate text-slate-200">{squadName}</h3>
        </div>
        <div className="text-lg font-bold text-white ml-3 shrink-0">{squadCost}</div>
      </div>

      {/* Soldiers - exact copy of SoldierCard layout */}
      <div className="grid grid-cols-1 gap-1 md:gap-1.5 p-1 md:p-1.5">
        {soldiers.map((soldier, index) => (
          <div
            key={index}
            className={cn(
              "relative p-1 md:p-1.5 rounded-sm border flex items-center gap-1.5 md:gap-2 transition-all overflow-hidden",
              "bg-slate-800/30 border-slate-700/50"
            )}
          >
            {/* Status stripe - active (transparent) for preview */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

            {/* Soldier image - reusing battle component */}
            <SoldierImage
              imageUrl={soldier.image || '/images/soldiers/empty.png'}
              soldierIndex={index}
              isDead={false}
              isDone={false}
              isInPanic={false}
              isMounted={true}
              onImageClick={() => {}}
            />

            {/* Stats - reusing battle component */}
            <SoldierStats
              soldier={soldier}
              distanceInputUnit="steps"
              stepToCmFactor={5}
              className="flex-1"
            />

            {/* Action button placeholder - mirrors SoldierActions position */}
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center">
                <span className="text-[8px] md:text-[9px] font-mono font-bold text-emerald-400/40 uppercase tracking-wider">ДЕЙСТВИЕ</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-800/50 text-xs text-slate-500 flex justify-between">
        <span>Всего солдат: {soldiers.length}</span>
        <span className="text-slate-600">Предпросмотр</span>
      </div>
    </div>
  );
}
