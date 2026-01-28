'use client';

import React from 'react';
import { User, Zap, Plus } from 'lucide-react';
import type { Squad, Machine, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CompactUnitCardProps {
  unit: Squad | Machine;
  type: 'squad' | 'machine';
  onAdd: () => void;
  onClick: () => void;
  factionId: FactionID;
  canAfford: boolean;
  countInArmy?: number;
}

export function CompactUnitCard({
  unit,
  type,
  onAdd,
  onClick,
  factionId,
  canAfford,
  countInArmy = 0
}: CompactUnitCardProps) {
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

  const isMachine = type === 'machine';
  const Icon = isMachine ? Zap : User;
  const typeLabel = isMachine ? 'МАШИНА' : 'ОТРЯД';

  // Get quick stats based on unit type
  const getQuickStats = () => {
    if (isMachine) {
      const machine = unit as Machine;
      const maxSpeed = Math.max(...machine.speed_sectors.map(s => s.speed));
      return `R${machine.rank} Прч${machine.durability_max} Ск${maxSpeed}`;
    } else {
      const squad = unit as Squad;
      const maxRank = Math.max(...squad.soldiers.map(s => s.rank));
      const armors = squad.soldiers.map(s => s.armor);
      const minArmor = Math.min(...armors);
      const maxArmor = Math.max(...armors);
      const armorRange = minArmor === maxArmor ? `${minArmor}` : `${minArmor}-${maxArmor}`;
      return `R${maxRank} ${squad.soldiers.length} бойцов Бр${armorRange}`;
    }
  };

  const quickStats = getQuickStats();

  return (
    <div
      className={cn(
        'relative h-16 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50',
        'border-l-4 flex items-stretch overflow-hidden',
        'transition-all duration-200 active:scale-[0.98]',
        canAfford ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed',
        borderColor
      )}
      onClick={canAfford ? onClick : undefined}
      data-testid={`compact-unit-card-${unit.id}`}
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
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-mono font-bold text-sm truncate leading-tight',
                canAfford ? 'text-slate-100' : 'text-slate-500'
              )} title={unit.name}>
                {unit.name}
              </h4>
              {countInArmy > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-600/80 text-white">
                  {countInArmy}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {typeLabel}
              </span>
              <span className="text-[10px] font-mono text-slate-600">
                {quickStats}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={cn(
              'font-mono font-bold text-sm',
              canAfford ? accentColor.replace('bg-', 'text-') : 'text-slate-600'
            )}>
              {unit.cost}
            </span>
          </div>
        </div>
      </div>

      {/* Add button zone */}
      <div className="w-11 flex items-center justify-center flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canAfford) {
              onAdd();
            }
          }}
          data-testid={`add-compact-${unit.id}`}
          disabled={!canAfford}
          aria-label={`Добавить ${unit.name}`}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            'active:scale-95 touch-manipulation',
            canAfford
              ? cn('bg-slate-700/50 hover:bg-slate-700', 'border border-slate-600 hover:border-slate-500')
              : 'bg-slate-800/50 cursor-not-allowed opacity-50'
          )}
        >
          <Plus className={cn(
            'w-4 h-4',
            canAfford ? accentColor.replace('bg-', 'text-') : 'text-slate-600'
          )} />
        </button>
      </div>

      {/* Armor/durability indicator bar */}
      <div className={cn(
        'absolute bottom-0 left-11 right-0 h-0.5',
        canAfford ? accentColor : 'bg-slate-700'
      )} style={{ opacity: canAfford ? 0.5 : 0.3 }} />
    </div>
  );
}
