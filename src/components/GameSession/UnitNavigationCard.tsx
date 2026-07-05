'use client';

import { memo } from 'react';
import { ArmyUnit, Squad, FactionID } from '@/lib/types';
import { Check, X, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BASE_PATH } from '@/lib/constants';

interface UnitNavigationCardProps {
  unit: ArmyUnit;
  originalIndex: number;
  isActive: boolean;
  isDone: boolean;
  isDead: boolean;
  isCaptured?: boolean;
  isMachine: boolean;
  onClick: () => void;
  faction: FactionID;
  dockStyles: Record<string, string>;
}

// Helper outside component to avoid recreation (not used here, but kept for potential future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getDockStyles = (factionId: string) => {
  const colors = {
    polaris: { borderSolid: 'border-red-500', bgSolid: 'bg-red-500', border: 'border-red-500/30', bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/50', accent: 'border-red-400' },
    protectorate: { borderSolid: 'border-cyan-500', bgSolid: 'bg-cyan-500', border: 'border-cyan-500/30', bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/50', accent: 'border-cyan-400' },
    mercenaries: { borderSolid: 'border-yellow-500', bgSolid: 'bg-yellow-500', border: 'border-yellow-500/30', bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/50', accent: 'border-yellow-400' },
  }[factionId] || {
    borderSolid: 'border-red-500', bgSolid: 'bg-red-500', border: 'border-red-500/30', bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/50', accent: 'border-red-400'
  };

  return {
    primary: colors.borderSolid,
    primaryBg: colors.bgSolid,
    muted: colors.border,
    mutedBg: colors.bg,
    text: colors.text,
    activeGlow: colors.glow,
    accent: colors.accent
  };
};

export const UnitNavigationCard = memo(function UnitNavigationCard({
  unit,
  isActive,
  isDone,
  isDead,
  isCaptured,
  isMachine,
  onClick,
  dockStyles,
}: Omit<UnitNavigationCardProps, 'originalIndex' | 'faction'>) {
  const imageUrl = isMachine
    ? unit.data.image!
    : ((unit.data as Squad).soldiers[0]?.image || unit.data.image!)!;

  // Add basePath to image paths for GitHub Pages
  const finalSrc = imageUrl.startsWith('/images/')
    ? `${BASE_PATH}${imageUrl}`
    : imageUrl;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative shrink-0 snap-start rounded-md border-2 transition-all duration-300 overflow-hidden group",
        "hover:scale-105 active:scale-95 shadow-md",
        "h-14 w-[56px]",
        isActive
          ? cn("scale-110 shadow-2xl border-current z-20", dockStyles.activeGlow, dockStyles.primaryBg, dockStyles.primary)
          : "border-slate-700/50 opacity-80 hover:opacity-100 grayscale hover:grayscale-0 z-10"
      )}
      data-testid={`unit-nav-${unit.instanceId}`}
    >
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finalSrc}
          alt={unit.data.name}
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 85%' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {isActive && <div className="absolute inset-0 bg-slate-700/30" />}
      {isDead && <div className="absolute inset-0 bg-red-900/50" />}
      {isCaptured && <div className="absolute inset-0 bg-orange-900/50" />}

      <div className={cn(
        "absolute w-4 h-4 transition-all z-20",
        isMachine ? "bottom-0 right-0" : "bottom-0 left-0",
        isMachine
          ? cn("border-r-2 border-t-2", dockStyles.accent || dockStyles.primary)
          : cn("border-l-2 border-t-2", dockStyles.muted)
      )} />

      {isActive && (
        <>
          <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 z-30", dockStyles.primary)} />
          <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 z-30", dockStyles.primary)} />
          <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 z-30", dockStyles.primary)} />
          <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 z-30", dockStyles.primary)} />
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className={cn("px-2 pb-1 pt-1", isActive ? "bg-slate-800/90" : "bg-black/70")}>
          <div className="flex items-center justify-center gap-1">
            {unit.instanceNumber && (
              <span className="font-mono text-[8px] font-black text-white/90">
                {unit.instanceNumber}
              </span>
            )}
            <span className="font-mono text-[9px] font-bold text-white tracking-wide">
              {(unit.data.shortName || unit.data.name || '').substring(0, 4).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {isDone && !isDead && (
        <div className="absolute top-1 left-1 w-5 h-5 md:w-6 md:h-6
                     bg-emerald-500 rounded-full border-2 border-white
                     flex items-center justify-center z-30
                     shadow-lg">
          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
        </div>
      )}

      {isDead && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-red-900/40">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-full flex items-center justify-center shadow-xl">
            <X className="w-5 h-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {isCaptured && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-orange-900/30">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-600 rounded-full flex items-center justify-center shadow-xl">
            <Flag className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
          </div>
        </div>
      )}
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.unit.instanceId === nextProps.unit.instanceId &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isDone === nextProps.isDone &&
    prevProps.isDead === nextProps.isDead &&
    prevProps.isCaptured === nextProps.isCaptured
  );
});
