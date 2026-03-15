/**
 * Units list component - shows squads and machines for a faction
 */

'use client';

import { useState, useMemo } from 'react';
import { CustomSource, CustomSquad, CustomMachine } from '@/lib/editor/types';
import { getSource } from '@/lib/sources-registry';
import { Plus, Users, Truck, Edit, Copy, Lock } from 'lucide-react';

interface UnitsListProps {
  source: CustomSource;
  baseSourceId: string | null;
  factionId: string;
  onSelectUnit: (unitId: string, type: 'squad' | 'machine') => void;
  onCloneUnit: (unitId: string, type: 'squad' | 'machine') => void;
  onCreateSquad: () => void;
  onCreateMachine: () => void;
}

export function UnitsList({
  source,
  baseSourceId,
  factionId,
  onSelectUnit,
  onCloneUnit,
  onCreateSquad,
  onCreateMachine,
}: UnitsListProps) {
  const [tab, setTab] = useState<'squad' | 'machine'>('squad');

  // Get all squads: custom + base source squads for this faction
  const { customSquads, baseSquads } = useMemo(() => {
    const custom = source.squads.filter(s => s.faction === factionId);
    const customIds = new Set(custom.map(s => s.id));

    let base: CustomSquad[] = [];
    if (baseSourceId) {
      const baseData = getSource(baseSourceId);
      if (baseData) {
        base = baseData.squads.filter(s => s.faction === factionId && !customIds.has(s.id));
      }
    }

    return { customSquads: custom, baseSquads: base };
  }, [source, baseSourceId, factionId]);

  // Get all machines: custom + base source machines for this faction
  const { customMachines, baseMachines } = useMemo(() => {
    const custom = source.machines.filter(m => m.faction === factionId);
    const customIds = new Set(custom.map(m => m.id));

    let base: CustomMachine[] = [];
    if (baseSourceId) {
      const baseData = getSource(baseSourceId);
      if (baseData) {
        base = baseData.machines.filter(m => m.faction === factionId && !customIds.has(m.id));
      }
    }

    return { customMachines: custom, baseMachines: base };
  }, [source, baseSourceId, factionId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-300">Юниты</h2>
        <div className="flex gap-1">
          <button
            onClick={onCreateSquad}
            className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
            title="Создать отряд"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onCreateMachine}
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
            <span className="text-xs text-slate-500">({customSquads.length + baseSquads.length})</span>
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
            <span className="text-xs text-slate-500">({customMachines.length + baseMachines.length})</span>
          </div>
        </button>
      </div>

      {/* Units list */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'squad' ? (
          customSquads.length + baseSquads.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Нет отрядов в этой фракции
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Custom squads */}
              {customSquads.map((squad) => (
                <UnitCard
                  key={squad.id}
                  id={squad.id}
                  name={squad.name}
                  cost={squad.cost}
                  isCustom
                  onSelect={() => onSelectUnit(squad.id, 'squad')}
                />
              ))}
              {/* Base squads */}
              {baseSquads.map((squad) => (
                <UnitCard
                  key={squad.id}
                  id={squad.id}
                  name={squad.name}
                  cost={squad.cost}
                  isCustom={false}
                  onClone={() => onCloneUnit(squad.id, 'squad')}
                />
              ))}
            </div>
          )
        ) : (
          customMachines.length + baseMachines.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Нет техники в этой фракции
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Custom machines */}
              {customMachines.map((machine) => (
                <UnitCard
                  key={machine.id}
                  id={machine.id}
                  name={machine.name}
                  cost={machine.cost}
                  isCustom
                  onSelect={() => onSelectUnit(machine.id, 'machine')}
                />
              ))}
              {/* Base machines */}
              {baseMachines.map((machine) => (
                <UnitCard
                  key={machine.id}
                  id={machine.id}
                  name={machine.name}
                  cost={machine.cost}
                  isCustom={false}
                  onClone={() => onCloneUnit(machine.id, 'machine')}
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
  onSelect?: () => void;
  onClone?: () => void;
}

function UnitCard({
  name,
  cost,
  isCustom,
  onSelect,
  onClone,
}: UnitCardProps) {
  return (
    <div
      className={`
        group flex items-center justify-between px-3 py-2 rounded-md transition-colors
        ${isCustom && onSelect ? 'hover:bg-slate-800 cursor-pointer text-slate-300' : 'bg-slate-800/50 text-slate-400'}
      `}
      onClick={isCustom && onSelect ? onSelect : undefined}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!isCustom && (
            <div title="Из базового источника">
              <Lock className="w-3 h-3 text-slate-500" />
            </div>
          )}
          <span className="font-medium truncate">{name}</span>
        </div>
        <div className="text-xs text-slate-500">{cost} очков</div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {isCustom && onSelect ? (
          // Custom units: show edit button on hover
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="p-1 rounded hover:bg-slate-600"
              title="Редактировать"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : onClone && (
          // Base units: show clone button
          <button
            onClick={(e) => { e.stopPropagation(); onClone(); }}
            className="p-1 rounded hover:bg-slate-700 text-slate-400"
            title="Клонировать"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
