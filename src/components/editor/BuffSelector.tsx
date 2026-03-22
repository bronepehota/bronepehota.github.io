/**
 * BuffSelector — inline component for selecting buffs from catalog.
 * Used in SquadEditor and MachineEditor.
 */

'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BuffDefinition } from '@/lib/modifier-types';
import { getStandardBuffs } from '@/lib/modifier-utils';
import { getCustomModifiers } from '@/lib/editor/modifier-storage';
import { ModifierIcon } from './ModifierIcons';

interface BuffSelectorProps {
  selectedBuffs: BuffDefinition[];
  onChange: (buffs: BuffDefinition[]) => void;
}

function scopeLabel(scope: string): string {
  return scope === 'team' ? 'командный' : 'личный';
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'always': return 'всегда';
    case 'shot': return 'стрельба';
    case 'melee': return 'ББ';
    case 'grenade': return 'граната';
    default: return phase;
  }
}

export function BuffSelector({ selectedBuffs, onChange }: BuffSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [catalog, setCatalog] = useState<BuffDefinition[]>(() => {
    const custom = getCustomModifiers();
    const standard = getStandardBuffs();
    return [...standard, ...custom.buffs];
  });

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      const custom = getCustomModifiers();
      const standard = getStandardBuffs();
      setCatalog([...standard, ...custom.buffs]);
    }
    setShowDropdown(!showDropdown);
  };

  const availableBuffs = catalog.filter(b => !selectedBuffs.some(s => s.id === b.id));

  const handleAdd = (buff: BuffDefinition) => {
    onChange([...selectedBuffs, buff]);
    setShowDropdown(false);
  };

  const handleRemove = (id: string) => {
    onChange(selectedBuffs.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-2">
      {selectedBuffs.length > 0 && (
        <div className="space-y-2">
          {selectedBuffs.map(buff => (
            <div
              key={buff.id}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/50 group"
            >
              <div className="shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center bg-emerald-950/40 text-emerald-500">
                <ModifierIcon name={buff.icon} size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-200">{buff.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-blue-950/40 border border-blue-600/30 text-blue-400">
                    {scopeLabel(buff.scope)}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-slate-700/80 text-slate-400">
                    {phaseLabel(buff.phase)}
                  </span>
                </div>
                {buff.description && (
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{buff.description}</div>
                )}
              </div>
              <button
                onClick={() => handleRemove(buff.id)}
                className="shrink-0 p-1.5 rounded-md hover:bg-red-900/30 transition-all opacity-0 group-hover:opacity-100"
                title="Удалить баф"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          onClick={handleToggleDropdown}
          disabled={availableBuffs.length === 0}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                     bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30
                     text-emerald-400 transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить баф
        </button>

        {showDropdown && availableBuffs.length > 0 && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 z-20 max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
              {availableBuffs.map(buff => (
                <button
                  key={buff.id}
                  onClick={() => handleAdd(buff)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/60 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <ModifierIcon name={buff.icon} size={14} className="shrink-0 text-emerald-500" />
                  <span className="text-xs text-slate-200 truncate">{buff.name}</span>
                  <span className="text-[9px] text-slate-500 shrink-0">{scopeLabel(buff.scope)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {availableBuffs.length === 0 && selectedBuffs.length > 0 && (
          <p className="text-[10px] text-slate-600 mt-1">Все бафы из каталога уже добавлены</p>
        )}
      </div>
    </div>
  );
}
