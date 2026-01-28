'use client';

import React from 'react';
import { ArmyUnit, FactionID, Squad, Machine } from '@/lib/types';
import { Plus } from 'lucide-react';
import { CompactArmyCard } from './CompactArmyCard';
import SquadCard from './SquadCard';
import MachineCard from './machine/MachineCard';

interface ArmySummaryViewProps {
  units: ArmyUnit[];
  onRemoveUnit: (instanceId: string) => void;
  onUnitClick?: (unit: ArmyUnit) => void;
  onAddUnits?: () => void;
  displayMode: 'detailed' | 'compact';
  factionId: FactionID;
}

export function ArmySummaryView({
  units,
  onRemoveUnit,
  onUnitClick,
  onAddUnits,
  displayMode,
  factionId,
}: ArmySummaryViewProps) {

  return (
    <div className="space-y-4" data-testid="army-summary-view">
      {/* "Add units" CTA */}
      {onAddUnits && (
        <button
          onClick={onAddUnits}
          className="w-full py-3 px-4 rounded-lg border flex items-center justify-center gap-2 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100"
        >
          <Plus className="w-5 h-5" />
          Добавить юниты
        </button>
      )}

      {/* Empty state */}
      {units.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="text-slate-600 mb-2">
            <p className="text-sm">Армия пуста</p>
          </div>
          {onAddUnits && (
            <button
              onClick={onAddUnits}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-mono bg-slate-800/50 border border-slate-700 hover:border-slate-600 text-slate-300 transition-colors"
            >
              Добавить юниты
            </button>
          )}
        </div>
      )}

      {/* Units list */}
      {units.length > 0 && (
        <>
          {displayMode === 'compact' ? (
            <div className="space-y-2">
              {units.map((unit) => (
                <CompactArmyCard
                  key={unit.instanceId}
                  unit={unit}
                  onRemove={onRemoveUnit}
                  onClick={onUnitClick}
                  factionId={factionId}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div key={unit.instanceId} className="relative">
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveUnit(unit.instanceId)}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
                    aria-label={`Удалить ${unit.data.name}`}
                  >
                    ✕
                  </button>
                  <div onClick={() => onUnitClick?.(unit)} className="cursor-pointer">
                    {unit.type === 'machine' ? (
                      <MachineCard
                        machine={unit.data as Machine}
                        onAdd={() => {}}
                        onViewDetails={() => onUnitClick?.(unit)}
                      />
                    ) : (
                      <SquadCard
                        squad={unit.data as Squad}
                        onAdd={() => {}}
                        onViewDetails={() => onUnitClick?.(unit)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
