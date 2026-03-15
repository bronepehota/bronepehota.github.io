/**
 * Soldiers table component - displays soldiers in a table with editable fields
 * Mobile: Card-based layout, Desktop: Table layout
 */

'use client';

import { CustomSoldier } from '@/lib/editor/types';
import { Trash2, User } from 'lucide-react';
import { getFactionColors } from '@/lib/faction-colors';
import { cn } from '@/lib/utils';

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
  { key: 'rank' as const, label: 'Ранг', type: 'number', min: 0, max: 7, width: 'w-16' },
  { key: 'speed' as const, label: 'Скор', type: 'number', min: 0, max: 8, width: 'w-14' },
  { key: 'range' as const, label: 'Дальн', type: 'text', placeholder: 'D6', width: 'w-16' },
  { key: 'power' as const, label: 'Мощн', type: 'text', placeholder: '1D6', width: 'w-16' },
  { key: 'melee' as const, label: 'ББ', type: 'number', min: 0, max: 9, width: 'w-14' },
  { key: 'armor' as const, label: 'Броня', type: 'number', min: 0, max: 9, width: 'w-14' },
];

// Props options with hints
const propsOptions = [
  { value: 'Г', label: 'Г', hint: 'Граната' },
  { value: 'БЫ', label: 'БЫ', hint: 'Медик' },
  { value: 'П', label: 'П', hint: 'Пилот' },
];

export function SoldiersTable({
  soldiers,
  squadName: _squadName,
  squadCost: _squadCost,
  faction = 'mercenaries',
  onUpdate,
  onRemove,
  disabled = false,
}: SoldiersTableProps) {
  const colors = getFactionColors(faction);

  const toggleProp = (index: number, prop: string) => {
    const current = soldiers[index].props || [];
    const updated = current.includes(prop)
      ? current.filter(p => p !== prop)
      : [...current, prop];
    onUpdate(index, { props: updated });
  };

  // Mobile card layout for each soldier
  const SoldierCard = ({ soldier, index }: { soldier: CustomSoldier; index: number }) => (
    <div className={cn(
      "bg-slate-800/50 rounded-lg border p-3 space-y-3",
      colors.border
    )}>
      {/* Card header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <User className={cn("w-4 h-4", colors.text)} />
          <span className="text-sm font-semibold text-slate-300">Солдат {index + 1}</span>
        </div>
        <button
          onClick={() => onRemove(index)}
          disabled={disabled || soldiers.length <= 1}
          className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-600/30 disabled:opacity-50 transition-all"
          title="Удалить солдата"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {soldierFields.map(field => (
          <div key={field.key} className="space-y-1">
            <label className="block text-[10px] text-slate-500 uppercase">{field.label}</label>
            {field.type === 'number' ? (
              <input
                type="number"
                value={soldier[field.key]}
                onChange={(e) => onUpdate(index, { [field.key]: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                min={field.min}
                max={field.max}
              />
            ) : (
              <input
                type="text"
                value={soldier[field.key]}
                onChange={(e) => onUpdate(index, { [field.key]: e.target.value })}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {/* Properties toggles */}
      <div className="space-y-1">
        <label className="block text-[10px] text-slate-500 uppercase">Свойства</label>
        <div className="flex flex-wrap gap-1.5">
          {propsOptions.map(prop => (
            <button
              key={prop.value}
              type="button"
              onClick={() => toggleProp(index, prop.value)}
              className={cn(
                "px-2 py-1 rounded text-xs font-mono border transition-all",
                (soldier.props || []).includes(prop.value)
                  ? `${colors.bgSolid} ${colors.borderSolid} text-white`
                  : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600"
              )}
              title={prop.hint}
            >
              {prop.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image URL */}
      <div className="space-y-1">
        <label className="block text-[10px] text-slate-500 uppercase">Изображение</label>
        <input
          type="text"
          value={soldier.image || ''}
          onChange={(e) => onUpdate(index, { image: e.target.value })}
          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          placeholder="/images/soldiers/..."
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3">
        {soldiers.map((soldier, index) => (
          <SoldierCard key={index} soldier={soldier} index={index} />
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs text-slate-400">
              <th className="w-10 px-2 text-center">№</th>
              {soldierFields.map(field => (
                <th key={field.key} className="px-2 text-center">{field.label}</th>
              ))}
              <th className="px-2 text-center">Свойства</th>
              <th className="px-2">Изображение</th>
              <th className="w-16 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {soldiers.map((soldier, index) => (
              <tr key={index} className={cn(
                "border-b border-slate-700/50 group hover:bg-slate-800/30 transition-colors",
                colors.border
              )}>
                <td className="px-2 text-center text-slate-500 font-mono text-xs">
                  {index + 1}
                </td>
                {soldierFields.map(field => (
                  <td key={field.key} className="px-1">
                    {field.type === 'number' ? (
                      <input
                        type="number"
                        value={soldier[field.key]}
                        onChange={(e) => onUpdate(index, { [field.key]: parseInt(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-center text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        min={field.min}
                        max={field.max}
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
                <td className="px-1">
                  <div className="flex gap-1 justify-center">
                    {propsOptions.map(prop => (
                      <button
                        key={prop.value}
                        type="button"
                        onClick={() => toggleProp(index, prop.value)}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-mono border transition-all",
                          (soldier.props || []).includes(prop.value)
                            ? `${colors.bgSolid} ${colors.borderSolid} text-white`
                            : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600"
                        )}
                        title={prop.hint}
                      >
                        {prop.label}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-1">
                  <input
                    type="text"
                    value={soldier.image || ''}
                    onChange={(e) => onUpdate(index, { image: e.target.value })}
                    className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    placeholder="/images/..."
                  />
                </td>
                <td className="px-2">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
