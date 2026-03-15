/**
 * Factions list component - shows factions for a source
 */

'use client';

import { CustomFaction } from '@/lib/editor/types';
import { Plus, Lock } from 'lucide-react';

interface FactionsListProps {
  factions: CustomFaction[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
}

export function FactionsList({
  factions,
  selectedId,
  onSelect,
  onCreateNew,
  disabled = false,
}: FactionsListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-300">Фракции</h2>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            disabled={disabled}
            className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
            title="Создать фракцию"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Factions list */}
      <div className="flex-1 overflow-y-auto">
        {factions.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            {disabled ? 'Выберите источник' : 'Нет фракций'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {factions.map(faction => (
              <button
                key={faction.id}
                onClick={() => onSelect(faction.id)}
                disabled={disabled}
                className={`
                  w-full text-left px-3 py-2 rounded-md transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${selectedId === faction.id
                    ? 'bg-slate-700 text-white'
                    : 'hover:bg-slate-800 text-slate-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: faction.color }}
                    />
                    <span className="font-medium">{faction.name}</span>
                    {faction.isFromBase && (
                      <div className="flex items-center" title="Из базового источника">
                        <Lock className="w-3 h-3 text-slate-500" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
