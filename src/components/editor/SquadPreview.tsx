/**
 * Squad preview - shows how squad will look in battle card
 * Reuses existing SoldierCard components with minimal props
 */

'use client';

import { CustomSoldier } from '@/lib/editor/types';
import { SoldierImage } from '@/components/cards/soldier-card/SoldierImage';
import { SoldierStats } from '@/components/cards/soldier-card/SoldierStats';
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
  // Faction colors
  const getFactionColors = () => {
    switch (faction) {
      case 'polaris':
        return {
          border: 'border-red-600/30',
          badge: 'bg-red-950/90 text-red-400 border-red-600/40',
          corner: 'rgba(220, 38, 38, 0.6)',
        };
      case 'protectorate':
        return {
          border: 'border-cyan-600/30',
          badge: 'bg-cyan-950/90 text-cyan-400 border-cyan-600/40',
          corner: 'rgba(8, 145, 178, 0.6)',
        };
      default:
        return {
          border: 'border-yellow-600/30',
          badge: 'bg-yellow-950/90 text-yellow-400 border-yellow-600/40',
          corner: 'rgba(202, 138, 4, 0.6)',
        };
    }
  };

  const colors = getFactionColors();

  return (
    <div className="w-full max-w-4xl bg-slate-900/80 rounded-sm border-2 shadow-lg overflow-hidden relative"
      style={{ borderColor: colors.corner }}
    >
      {/* Tech corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 -ml-px -mt-px pointer-events-none" style={{ borderColor: colors.corner }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 -mr-px -mt-px pointer-events-none" style={{ borderColor: colors.corner }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 -ml-px -mb-px pointer-events-none" style={{ borderColor: colors.corner }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 -mr-px -mb-px pointer-events-none" style={{ borderColor: colors.corner }} />

      {/* Unit Header */}
      <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800/50 px-3 py-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">{squadName}</div>
            <div className="text-2xl font-bold text-white mt-0.5">{squadCost} очков</div>
          </div>
        </div>
      </div>

      {/* Soldiers - reusing SoldierCard layout */}
      <div className="p-2 md:p-3 space-y-1.5">
        {soldiers.map((soldier, index) => (
          <div
            key={index}
            className={cn(
              "relative p-1 md:p-1.5 rounded-sm border flex gap-1.5 md:gap-2 transition-all overflow-hidden",
              "bg-slate-800/30 border-slate-700/50"
            )}
          >
            {/* Status stripe - green for preview */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />

            {/* Soldier image - reusing component */}
            <SoldierImage
              imageUrl={soldier.image || '/images/soldiers/empty.png'}
              soldierIndex={index}
              isDead={false}
              isDone={false}
              isInPanic={false}
              isMounted={true}
              onImageClick={() => {}}
            />

            {/* Left side: placeholder for actions (none in preview) + stats */}
            <div className="flex-1 flex flex-col justify-center min-w-0 gap-1.5">
              {/* Actions placeholder - grayed out */}
              <div className="flex gap-1 opacity-30">
                <div className="flex-1 h-6 bg-emerald-900/30 rounded flex items-center justify-center text-xs text-emerald-400/50">
                  ДЕЙСТВИЕ
                </div>
              </div>

              {/* Stats - reusing component */}
              <SoldierStats soldier={soldier} distanceInputUnit="steps" stepToCmFactor={5} />
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
