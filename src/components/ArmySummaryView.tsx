'use client';

import React from 'react';
import { ArmyUnit, FactionID } from '@/lib/types';
import { Plus } from 'lucide-react';
import { CompactArmyCard } from './CompactArmyCard';
import { cn } from '@/lib/utils';

interface ArmySummaryViewProps {
  units: ArmyUnit[];
  onRemoveUnit: (instanceId: string) => void;
  onUnitClick?: (unit: ArmyUnit) => void;
  onAddUnits?: () => void;
  pointBudget: number;
  totalCost: number;
  filterType: 'all' | 'squad' | 'machine';
  factionId: FactionID;
}

export function ArmySummaryView({
  units,
  onRemoveUnit,
  onUnitClick,
  onAddUnits,
  pointBudget,
  totalCost,
  filterType,
  factionId,
}: ArmySummaryViewProps) {
  const remainingPoints = pointBudget - totalCost;

  // Filter units by type
  const filteredUnits = React.useMemo(() => {
    if (filterType === 'all') return units;
    return units.filter(unit => unit.type === filterType);
  }, [units, filterType]);

  const factionColors = {
    polaris: 'text-red-400 border-red-500/50 hover:border-red-500',
    protectorate: 'text-cyan-400 border-cyan-500/50 hover:border-cyan-500',
    mercenaries: 'text-yellow-400 border-yellow-500/50 hover:border-yellow-500',
  };

  const accentColor = factionColors[factionId] || factionColors.polaris;

  return (
    <div className="space-y-4" data-testid="army-summary-view">
      {/* Budget display */}
      <div className={cn(
        'px-4 py-3 rounded-lg border bg-slate-800/50 backdrop-blur-sm',
        accentColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base">{totalCost}</span>
              <span className="text-slate-500 text-sm">/</span>
              <span className="text-slate-400 text-sm">{pointBudget}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              'text-sm font-mono',
              remainingPoints >= 0 ? 'text-slate-400' : 'text-red-400'
            )}>
              {remainingPoints >= 0 ? `+${remainingPoints}` : remainingPoints}
            </span>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">очков</p>
          </div>
        </div>
      </div>

      {/* "Add units" CTA */}
      {onAddUnits && (
        <button
          onClick={onAddUnits}
          className={cn(
            'w-full py-3 px-4 rounded-lg border flex items-center justify-center gap-2',
            'font-mono text-sm font-bold uppercase tracking-wider',
            'transition-all duration-200 active:scale-[0.98]',
            'bg-slate-800/50 border-slate-700 hover:border-slate-600',
            'text-slate-300 hover:text-slate-100'
          )}
        >
          <Plus className="w-5 h-5" />
          Добавить юниты
        </button>
      )}

      {/* Empty state */}
      {filteredUnits.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="text-slate-600 mb-2">
            {filterType === 'all' && units.length === 0 && (
              <p className="text-sm">Армия пуста</p>
            )}
            {filterType === 'all' && units.length > 0 && (
              <p className="text-sm">Нет отфильтрованных юнитов</p>
            )}
            {filterType !== 'all' && (
              <p className="text-sm">
                Нет {filterType === 'squad' ? 'отрядов' : 'машин'} в армии
              </p>
            )}
          </div>
          {onAddUnits && (
            <button
              onClick={onAddUnits}
              className={cn(
                'mt-4 px-4 py-2 rounded-lg text-sm font-mono',
                'bg-slate-800/50 border border-slate-700',
                'hover:border-slate-600 text-slate-300',
                'transition-colors'
              )}
            >
              Добавить {filterType === 'machine' ? 'машины' : filterType === 'squad' ? 'отряды' : 'юниты'}
            </button>
          )}
        </div>
      )}

      {/* Units list */}
      {filteredUnits.length > 0 && (
        <div className="space-y-2">
          {filteredUnits.map((unit) => (
            <CompactArmyCard
              key={unit.instanceId}
              unit={unit}
              onRemove={onRemoveUnit}
              onClick={onUnitClick}
              factionId={factionId}
            />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {units.length > 0 && (
        <div className="px-4 py-2 bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>
              {units.filter(u => u.type === 'squad').length} отрядов
            </span>
            <span>
              {units.filter(u => u.type === 'machine').length} машин
            </span>
            <span className={cn(
              remainingPoints >= 0 ? 'text-slate-400' : 'text-red-400'
            )}>
              {totalCost} очков
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
