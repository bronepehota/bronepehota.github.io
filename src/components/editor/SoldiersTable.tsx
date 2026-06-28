/**
 * Soldiers table component - compact single-row per soldier layout
 * Desktop only.
 */

'use client';

import { useMemo, useState } from 'react';
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

const soldierFields = [
  { key: 'rank' as const, label: 'Ранг', type: 'number' as const, min: 0, max: 7 },
  { key: 'speed' as const, label: 'Скор', type: 'number' as const, min: 0, max: 8 },
  { key: 'range' as const, label: 'Дальн', type: 'text' as const, placeholder: 'D6' },
  { key: 'power' as const, label: 'Мощн', type: 'text' as const, placeholder: '1D6' },
  { key: 'melee' as const, label: 'ББ', type: 'number' as const, min: 0, max: 9 },
  { key: 'armor' as const, label: 'Броня', type: 'number' as const, min: 0, max: 9 },
];

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
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 shrink-0">
          <h3 className="text-sm font-semibold text-slate-200">Модификатор</h3>
          <button onClick={onClose} aria-label="Закрыть" className="p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
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

const labelClass = "text-[9px] text-slate-500 uppercase tracking-wider mb-0.5 block";
const inputClass = "w-full px-1.5 py-1.5 bg-slate-900 border border-slate-700/70 rounded text-xs text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20";

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
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="w-7 px-0.5 pb-2" />
              <th className="px-1 pb-2"><span className={labelClass}>Фото</span></th>
              {soldierFields.map(field => (
                <th key={field.key} className="px-1 pb-2 text-center">
                  <span className={labelClass}>{field.label}</span>
                </th>
              ))}
              <th className="px-1 pb-2"><span className={labelClass}>Модиф.</span></th>
              <th className="w-8 px-0.5 pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {soldiers.map((soldier, index) => (
              <tr
                key={index}
                className="group hover:bg-slate-800/20 transition-colors"
              >
                {/* Number */}
                <td className="px-0.5 py-1.5 text-center">
                  <span className="text-[10px] text-slate-600 font-mono">{index + 1}</span>
                </td>

                {/* Image */}
                <td className="px-1 py-1.5">
                  <div className="relative group/img">
                    {soldier.image ? (
                      <div className="w-9 h-12 rounded border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                        <GitHubPagesImage
                          src={soldier.image}
                          alt=""
                          width={36}
                          height={48}
                          className="w-full h-full object-cover object-center"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-12 rounded border border-slate-700/50 border-dashed bg-slate-900/50 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    )}
                    {/* Hover overlay to edit image URL */}
                    <input
                      type="text"
                      value={soldier.image || ''}
                      onChange={(e) => onUpdate(index, { image: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 group-hover/img:opacity-100 bg-slate-900/90 border border-slate-600 rounded text-[9px] text-center px-0.5 focus:opacity-100 focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition-opacity"
                      placeholder="/images/..."
                    />
                  </div>
                </td>

                {/* Stat fields */}
                {soldierFields.map(field => (
                  <td key={field.key} className="px-1 py-1.5">
                    {field.type === 'number' ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={soldier[field.key]}
                        onChange={(e) => onUpdate(index, { [field.key]: parseInt(e.target.value) || 0 })}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type="text"
                        value={soldier[field.key]}
                        onChange={(e) => onUpdate(index, { [field.key]: e.target.value })}
                        className={cn(inputClass, "text-left")}
                        placeholder={field.placeholder}
                      />
                    )}
                  </td>
                ))}

                {/* Modifiers */}
                <td className="px-1 py-1.5">
                  <div className="flex flex-wrap gap-0.5 items-center min-h-[28px]">
                    {(soldier.modifiers || []).map(modId => {
                      const mod = catalog.find(m => m.id === modId);
                      if (!mod) return null;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleModifier(index, mod.id)}
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium border transition-all active:scale-95 bg-amber-950/30 border-amber-700/40 text-amber-300 hover:bg-amber-900/40"
                          title={mod.description}
                        >
                          <ModifierIcon name={mod.icon} size={8} />
                          <span className="font-mono">{mod.name}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setPickerSoldierIdx(index)}
                      className="inline-flex items-center justify-center w-5 h-5 rounded border border-dashed border-slate-600/50 text-slate-500 hover:border-emerald-600/50 hover:text-emerald-400 transition-all"
                      title="Добавить модификатор"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>

                {/* Delete */}
                <td className="px-0.5 py-1.5 text-center">
                  <button
                    onClick={() => onRemove(index)}
                    disabled={disabled || soldiers.length <= 1}
                    className="p-1 rounded bg-red-900/20 hover:bg-red-900/40 border border-red-600/30 disabled:opacity-30 transition-all"
                    title="Удалить"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
