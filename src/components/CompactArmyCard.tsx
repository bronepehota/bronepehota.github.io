'use client';

import React from 'react';
import { X, User, Zap } from 'lucide-react';
import { ArmyUnit, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GitHubPagesImage as Image } from './GitHubPagesImage';

interface CompactArmyCardProps {
  unit: ArmyUnit;
  onRemove: (instanceId: string) => void;
  onClick?: (unit: ArmyUnit) => void;
  factionId: FactionID;
}

export function CompactArmyCard({ unit, onRemove, onClick, factionId }: CompactArmyCardProps) {
  const factionColors = {
    polaris: 'bg-red-500',
    protectorate: 'bg-cyan-500',
    mercenaries: 'bg-yellow-500',
  };

  const factionBorders = {
    polaris: 'border-l-red-500',
    protectorate: 'border-l-cyan-500',
    mercenaries: 'border-l-yellow-500',
  };

  const accentColor = factionColors[factionId] || factionColors.polaris;
  const borderColor = factionBorders[factionId] || factionBorders.polaris;

  const isMachine = unit.type === 'machine';
  const Icon = isMachine ? Zap : User;
  const typeLabel = isMachine ? 'МАШИНА' : 'ОТРЯД';

  const handleCardClick = () => {
    if (onClick) {
      onClick(unit);
    }
  };

  return (
    <div
      className={cn(
        'relative h-16 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50',
        'border-l-4 flex items-stretch overflow-hidden',
        'transition-all duration-200 active:scale-[0.98]',
        borderColor
      )}
      onClick={handleCardClick}
      data-testid={`compact-army-card-${unit.instanceId}`}
    >
      {/* Type icon zone */}
      <div className="w-11 flex items-center justify-center flex-shrink-0 bg-slate-900/50">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', accentColor, 'bg-opacity-20')}>
          <Icon className={cn('w-4 h-4', accentColor.replace('bg-', 'text-'))} />
        </div>
      </div>

      {/* Content zone */}
      <div className="flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-mono font-bold text-sm text-slate-100 truncate leading-tight">
              {unit.data.shortName || unit.data.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {typeLabel}
              </span>
              {unit.instanceNumber && unit.instanceNumber > 1 && (
                <span className="text-[10px] font-mono text-slate-600">
                  #{unit.instanceNumber}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={cn(
              'font-mono font-bold text-sm',
              accentColor.replace('bg-', 'text-')
            )}>
              {unit.data.cost}
            </span>
          </div>
        </div>
      </div>

      {/* Remove button zone */}
      <div className="w-11 flex items-center justify-center flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(unit.instanceId);
          }}
          data-testid={`remove-compact-${unit.instanceId}`}
          aria-label={`Удалить ${unit.data.name}`}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center',
            'bg-red-900/20 hover:bg-red-900/40',
            'border border-red-700/50 hover:border-red-600',
            'transition-all duration-200',
            'active:scale-95 touch-manipulation'
          )}
        >
          <X className={cn('w-4 h-4', accentColor.replace('bg-', 'text-').replace('red', 'text-red-400'))} />
        </button>
      </div>

      {/* Optional: small image preview on right edge */}
      {unit.data.image && (
        <div className="absolute right-12 top-0 bottom-0 w-12 overflow-hidden opacity-20">
          <Image
            src={unit.data.image}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
