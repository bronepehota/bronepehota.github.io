/**
 * Units list component - shows squads and machines for a faction
 */

'use client';

import { useState } from 'react';
import { CustomSource } from '@/lib/editor/types';
import { Plus, Users, Truck, Edit } from 'lucide-react';

interface UnitsListProps {
  source: CustomSource;
  factionId: string;
  onSelectUnit: (unitId: string, type: 'squad' | 'machine') => void;
}

export function UnitsList({
  source,
  factionId,
  onSelectUnit,
}: UnitsListProps) {
  const [tab, setTab] = useState<'squad' | 'machine'>('squad');

  // Filter units by faction
  const squads = source.squads.filter(s => s.faction === factionId);
  const machines = source.machines.filter(m => m.faction === factionId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-300">Юниты</h2>
        <div className="flex gap-1">
          <button
            className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
            title="Создать отряд"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
            title="Создать технику"
          >
            <Truck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setTab('squad')}
          className={`
            flex-1 px-3 py-2 text-sm font-medium transition-colors
            ${tab === 'squad'
              ? 'text-white border-b-2 border-white'
              : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Отряды</span>
            <span className="text-xs text-slate-500">({squads.length})</span>
          </div>
        </button>
        <button
          onClick={() => setTab('machine')}
          className={`
            flex-1 px-3 py-2 text-sm font-medium transition-colors
            ${tab === 'machine'
              ? 'text-white border-b-2 border-white'
              : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Truck className="w-4 h-4" />
            <span>Техника</span>
            <span className="text-xs text-slate-500">({machines.length})</span>
          </div>
        </button>
      </div>

      {/* Units list */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'squad' ? (
          squads.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Нет отрядов в этой фракции
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {squads.map(squad => (
                <UnitCard
                  key={squad.id}
                  id={squad.id}
                  name={squad.name}
                  cost={squad.cost}
                  isCustom={squad.id.includes('_custom_')}
                  onSelect={() => onSelectUnit(squad.id, 'squad')}
                  onEdit={() => onSelectUnit(squad.id, 'squad')}
                />
              ))}
            </div>
          )
        ) : (
          machines.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Нет техники в этой фракции
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {machines.map(machine => (
                <UnitCard
                  key={machine.id}
                  id={machine.id}
                  name={machine.name}
                  cost={machine.cost}
                  isCustom={machine.id.includes('_custom_')}
                  onSelect={() => onSelectUnit(machine.id, 'machine')}
                  onEdit={() => onSelectUnit(machine.id, 'machine')}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

interface UnitCardProps {
  id: string;
  name: string;
  cost: number;
  isCustom: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

function UnitCard({
  name,
  cost,
  isCustom,
  onSelect,
  onEdit,
}: UnitCardProps) {
  return (
    <div
      className={`
        group flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer
        hover:bg-slate-800 text-slate-300
      `}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isCustom && (
            <span className="text-xs">★</span>
          )}
          <span className="font-medium truncate">{name}</span>
        </div>
        <div className="text-xs text-slate-500">{cost} очков</div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1 rounded hover:bg-slate-600"
          title="Редактировать"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
