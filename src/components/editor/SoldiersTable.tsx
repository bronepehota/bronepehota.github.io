/**
 * Soldiers table component - displays soldiers in a table with editable fields
 * Desktop only.
 */

'use client';

import { Fragment, useMemo, useState } from 'react';
import { CustomSoldier } from '@/lib/editor/types';
import { Trash2, ImageIcon, Plus, X } from 'lucide-react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { cn } from '@/lib/utils';
import { getStandardBuffs, getStandardDebuffs } from '@/lib/modifier-utils';
import { getCustomModifiers } from '@/lib/editor/modifier-storage';
import { ModifierIcon } from './ModifierIcons';
import type { BuffDefinition, DebuffTemplate } from '@/lib/modifier-types';

interface SoldiersTableProps {
  soldiers: CustomSoldier[];
  squadName: string;
  squadCost: number;
  faction?: string;
  onUpdate: (index: number, updates: Partial<CustomSoldier>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

// Soldier field definitions with labels and validation
const soldierFields = [
  { key: 'rank' as const, label: 'Ранг', type: 'number' as const, min: 0, max: 7 },
  { key: 'speed' as const, label: 'Скор', type: 'number' as const, min: 0, max: 8 },
  { key: 'range' as const, label: 'Дальн', type: 'text' as const, placeholder: 'D6' },
  { key: 'power' as const, label: 'Мощн', type: 'text' as const, placeholder: '1D6' },
  { key: 'melee' as const, label: 'ББ', type: 'number' as const, min: 0, max: 9 },
  { key: 'armor' as const, label: 'Броня', type: 'number' as const, min: 0, max: 9 },
];

/** Build the catalog of all modifiers available for soldier assignment */
export function getSoldierModifierCatalog(): { id: string; name: string; icon?: string; description?: string }[] {
  const standardBuffs = getStandardBuffs();
  const standardDebuffs = getStandardDebuffs();
  const custom = getCustomModifiers();

  const all: (BuffDefinition | DebuffTemplate)[] = [
    ...standardBuffs,
    ...custom.buffs,
    ...standardDebuffs,
    ...custom.debuffs,
  ];

  return all.map(m => ({
    id: m.id,
    name: m.name,
    icon: m.icon,
    description: m.description,
  }));
}

// ---------------------------------------------------------------------------
// SoldierModifierModal — modal for picking modifiers from catalog
// ---------------------------------------------------------------------------

interface SoldierModifierModalProps {
  catalog: { id: string; name: string; icon?: string; description?: string }[];
  selected: string[];
  onToggle: (modId: string) => void;
  onClose: () => void;
}

function SoldierModifierModal({ catalog, selected, onToggle, onClose }: SoldierModifierModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 shrink-0">
          <h3 className="text-sm font-semibold text-slate-200">Модификатор</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2">
          {catalog.map(mod => {
            const isActive = selected.includes(mod.id);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onToggle(mod.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all active:scale-[0.98]",
                  isActive
                    ? "bg-emerald-900/30 border border-emerald-600/40"
                    : "hover:bg-slate-800/60 border border-transparent"
                )}
              >
                <div className={cn(
                  "shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                  isActive ? "bg-emerald-600/20" : "bg-slate-800"
                )}>
                  <ModifierIcon
                    name={mod.icon}
                    size={16}
                    className={isActive ? "text-emerald-400" : "text-slate-500"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      isActive ? "text-emerald-300" : "text-slate-300"
                    )}>
                      {mod.name}
                    </span>
                    {isActive && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                        назначен
                      </span>
                    )}
                  </div>
                  {mod.description && (
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">{mod.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SoldiersTable({
  soldiers,
  squadName: _squadName,
  squadCost: _squadCost,
  onUpdate,
  onRemove,
  disabled = false,
}: SoldiersTableProps) {
  const catalog = useMemo(() => getSoldierModifierCatalog(), []);
  const [pickerSoldierIdx, setPickerSoldierIdx] = useState<number | null>(null);

  const toggleModifier = (index: number, modifierId: string) => {
    const current = soldiers[index].modifiers || [];
    const updated = current.includes(modifierId)
      ? current.filter(id => id !== modifierId)
      : [...current, modifierId];
    onUpdate(index, { modifiers: updated });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400">
              <th className="w-10 px-2 text-center">№</th>
              {soldierFields.map(field => (
                <th key={field.key} className="px-2 text-center">{field.label}</th>
              ))}
              <th className="w-16 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {soldiers.map((soldier, index) => (
              <Fragment key={index}>
              {/* Row 1: stats + delete */}
              <tr className="group hover:bg-slate-800/30 transition-colors">
                <td className="px-2 text-center text-slate-500 font-mono text-xs pt-2.5">
                  {index + 1}
                </td>
                {soldierFields.map(field => (
                  <td key={field.key} className="px-1 pt-2.5">
                    {field.type === 'number' ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={soldier[field.key]}
                        onChange={(e) => onUpdate(index, { [field.key]: parseInt(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-center text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                      />
                    ) : (
                      <input
                        type="text"
                        value={soldier[field.key]}
                        onChange={(e) => onUpdate(index, { [field.key]: e.target.value })}
                        className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-center text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        placeholder={field.placeholder}
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 pt-2.5">
                  <button
                    onClick={() => onRemove(index)}
                    disabled={disabled || soldiers.length <= 1}
                    className="p-1 rounded bg-red-900/20 hover:bg-red-900/40 border border-red-600/30 disabled:opacity-50 transition-all"
                    title="Удалить солдата"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </td>
              </tr>
              {/* Row 2: image */}
              <tr className="hover:bg-slate-800/10">
                <td colSpan={soldierFields.length + 2}>
                  <div className="flex items-center gap-3 px-1 py-2">
                    {soldier.image ? (
                      <div className="w-16 aspect-[3/4] rounded border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                        <GitHubPagesImage
                          src={soldier.image}
                          alt=""
                          width={64}
                          height={85}
                          className="w-full h-full object-cover object-center"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 aspect-[3/4] rounded border border-slate-700/50 border-dashed bg-slate-900/50 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="text-[10px] text-slate-500 uppercase">Изображение</span>
                      <input
                        type="text"
                        value={soldier.image || ''}
                        onChange={(e) => onUpdate(index, { image: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        placeholder="/images/..."
                      />
                    </div>
                  </div>
                </td>
              </tr>
              {/* Row 3: modifiers */}
              <tr className="hover:bg-slate-800/10">
                <td colSpan={soldierFields.length + 2}>
                  <div className="flex items-center gap-3 px-1 py-1.5 pb-2.5">
                    <span className="text-[10px] text-slate-500 uppercase shrink-0">Модификаторы</span>
                    <div className="flex flex-wrap gap-1">
                      {(soldier.modifiers || []).map(modId => {
                        const mod = catalog.find(m => m.id === modId);
                        if (!mod) return null;
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => toggleModifier(index, mod.id)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all active:scale-95 bg-amber-950/30 border-amber-700/40 text-amber-300"
                            title={mod.description}
                          >
                            <ModifierIcon name={mod.icon} size={9} />
                            <span className="font-mono">{mod.name}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setPickerSoldierIdx(index)}
                        className="inline-flex items-center justify-center w-5 h-5 rounded border border-dashed border-slate-600/50 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modifier picker modal */}
      {pickerSoldierIdx !== null && (
        <SoldierModifierModal
          catalog={catalog}
          selected={soldiers[pickerSoldierIdx].modifiers || []}
          onToggle={(modId) => toggleModifier(pickerSoldierIdx, modId)}
          onClose={() => setPickerSoldierIdx(null)}
        />
      )}
    </div>
  );
}
