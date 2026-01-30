'use client';

import React from 'react';
import { ArmyUnit, FactionID } from '@/lib/types';
import { Shield, Sword, Plus } from 'lucide-react';
import { CompactArmyCard } from './CompactArmyCard';
import SquadCard from './SquadCard';
import MachineCard from './machine/MachineCard';
import { cn } from '@/lib/utils';

interface ArmySummaryViewProps {
  units: ArmyUnit[];
  onRemoveUnit: (instanceId: string) => void;
  onUnitClick?: (unit: ArmyUnit) => void;
  onToBattle?: () => void;
  onAddUnits?: () => void;
  displayMode: 'detailed' | 'compact';
  factionId: FactionID;
}

const factionColors = {
  polaris: {
    primary: 'red',
    accent: 'bg-red-500',
    accentText: 'text-red-400',
    accentBorder: 'border-red-500',
    accentGlow: 'shadow-red-500/20',
    bg: 'bg-red-950/20',
  },
  protectorate: {
    primary: 'cyan',
    accent: 'bg-cyan-500',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500',
    accentGlow: 'shadow-cyan-500/20',
    bg: 'bg-cyan-950/20',
  },
  mercenaries: {
    primary: 'yellow',
    accent: 'bg-yellow-500',
    accentText: 'text-yellow-400',
    accentBorder: 'border-yellow-500',
    accentGlow: 'shadow-yellow-500/20',
    bg: 'bg-yellow-950/20',
  },
};

export function ArmySummaryView({
  units,
  onRemoveUnit,
  onUnitClick,
  onToBattle,
  onAddUnits,
  displayMode,
  factionId,
}: ArmySummaryViewProps) {
  const colors = factionColors[factionId] || factionColors.polaris;
  const isEmpty = units.length === 0;
  const canGoToBattle = !isEmpty && onToBattle;

  return (
    <div className="space-y-4" data-testid="army-summary-view">

      {/* Empty state - Single clear CTA */}
      {isEmpty ? (
        <div className="relative py-16 px-6 text-center">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 left-4 w-2 h-2 border-l border-t border-slate-500" />
            <div className="absolute top-4 right-4 w-2 h-2 border-r border-t border-slate-500" />
            <div className="absolute bottom-4 left-4 w-2 h-2 border-l border-b border-slate-500" />
            <div className="absolute bottom-4 right-4 w-2 h-2 border-r border-b border-slate-500" />
          </div>

          <div className="relative">
            {/* Empty icon */}
            <div className={cn(
              'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
              'bg-slate-900/50 border-2 border-slate-800'
            )}>
              <Shield className="w-10 h-10 text-slate-700" />
            </div>

            <h3 className="text-lg font-mono font-bold text-slate-400 mb-2">АРМИЯ ПУСТА</h3>
            <p className="text-sm text-slate-600 mb-6 max-w-xs mx-auto">
              Перейдите на вкладку «Юниты», чтобы собрать свою армию
            </p>

            {onAddUnits && (
              <button
                onClick={onAddUnits}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-lg',
                  'font-mono text-sm font-bold uppercase tracking-wider',
                  'transition-all duration-200 min-h-[48px]',
                  'border-2',
                  colors.accentBorder,
                  colors.bg,
                  colors.accentText,
                  'hover:scale-105 active:scale-95',
                  'shadow-lg hover:shadow-xl',
                  colors.accentGlow.replace('shadow-', 'hover:shadow-')
                )}
              >
                <Plus className="w-5 h-5" />
                Собрать армию
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Units list */}
          <div className={displayMode === 'compact' ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
            {units.map((unit) => (
              displayMode === 'compact' ? (
                <CompactArmyCard
                  key={unit.instanceId}
                  unit={unit}
                  onRemove={onRemoveUnit}
                  onClick={onUnitClick}
                  factionId={factionId}
                  dataTestId={`army-unit-${unit.instanceId}`}
                />
              ) : (
                <div key={unit.instanceId} className="relative" data-testid={`army-unit-${unit.instanceId}`}>
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveUnit(unit.instanceId)}
                    data-testid={`remove-unit-${unit.instanceId}`}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
                    aria-label={`Удалить ${unit.data.name}`}
                  >
                    ✕
                  </button>
                  <div onClick={() => onUnitClick?.(unit)} className="cursor-pointer">
                    {unit.type === 'machine' ? (
                      <MachineCard
                        machine={unit.data as any}
                        onAdd={() => {}}
                        onViewDetails={() => onUnitClick?.(unit)}
                      />
                    ) : (
                      <SquadCard
                        squad={unit.data as any}
                        onAdd={() => {}}
                        onViewDetails={() => onUnitClick?.(unit)}
                      />
                    )}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Action buttons row */}
          <div className="pt-4">
            {/* Primary: TO BATTLE */}
            {canGoToBattle && (
              <button
                onClick={onToBattle}
                data-testid="to-battle-button"
                className={cn(
                  'w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2',
                  'font-mono text-sm font-bold uppercase tracking-wider',
                  'transition-all duration-200 min-h-[48px]',
                  'border-2 relative overflow-hidden group',
                  colors.accentBorder,
                  colors.bg,
                  colors.accentText,
                  'hover:scale-[1.02] active:scale-95',
                  'shadow-lg hover:shadow-xl',
                  colors.accentGlow.replace('shadow-', 'hover:shadow-')
                )}
              >
                {/* Animated background effect */}
                <div className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity',
                  colors.bg.replace('/20', '/40')
                )} />

                {/* Scanline effect */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent h-full w-full animate-pulse" style={{ animationDuration: '2s' }} />
                </div>

                <Sword className="w-5 h-5 relative z-10" />
                <span className="relative z-10">В БОЙ</span>

                {/* Tech corners */}
                <div className={cn(
                  'absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2',
                  colors.accentText.replace('text-', 'border-'),
                  'opacity-50'
                )} />
                <div className={cn(
                  'absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2',
                  colors.accentText.replace('text-', 'border-'),
                  'opacity-50'
                )} />
                <div className={cn(
                  'absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2',
                  colors.accentText.replace('text-', 'border-'),
                  'opacity-50'
                )} />
                <div className={cn(
                  'absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2',
                  colors.accentText.replace('text-', 'border-'),
                  'opacity-50'
                )} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
