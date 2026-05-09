'use client';

import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { getStandardBuffs, getStandardDebuffs } from '@/lib/modifier-utils';
import type { ModifierSummary, ModifierTarget } from '@/lib/modifier-types';

interface ModifiersSelectorProps {
  value: ModifierSummary;
  onChange: (summary: ModifierSummary) => void;
  className?: string;
}

const NUMERIC_FIELDS: Array<{ target: ModifierTarget; label: string; key: keyof ModifierSummary }> = [
  { target: 'range_bonus', label: '+Дальность', key: 'rangeBonus' },
  { target: 'power_bonus', label: '+Мощность', key: 'powerBonus' },
  { target: 'melee_bonus', label: '+Ближний бой', key: 'meleeBonus' },
  { target: 'armor_bonus', label: '+Броня', key: 'armorBonus' },
  { target: 'distance_penalty', label: '−Дистанция', key: 'distancePenalty' },
];

function targetToField(target: ModifierTarget): keyof ModifierSummary {
  switch (target) {
    case 'range_bonus': return 'rangeBonus';
    case 'range_multiply': return 'rangeMultiplier';
    case 'power_bonus': return 'powerBonus';
    case 'melee_bonus': return 'meleeBonus';
    case 'armor_bonus': return 'armorBonus';
    case 'distance_penalty': return 'distancePenalty';
    default: return 'descriptions';
  }
}

export function ModifiersSelector({ value, onChange, className }: ModifiersSelectorProps) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(new Set());

  const allModifiers = useMemo(() => {
    const buffs = getStandardBuffs().filter(b => b.target !== 'speed_multiply' && b.target !== 'custom');
    const debuffs = getStandardDebuffs().filter(d => d.target !== 'speed_multiply' && d.target !== 'custom');
    return [...buffs.map(b => ({ ...b, isBuff: true as const })), ...debuffs.map(d => ({ ...d, isBuff: false as const }))];
  }, []);

  const handleNumericChange = (key: keyof ModifierSummary, val: number) => {
    onChange({ ...value, [key]: val });
  };

  const toggleCatalogItem = (id: string, modifier: { target: ModifierTarget; value: number; name: string; isBuff?: boolean }) => {
    const next = new Set(selectedCatalogIds);
    const nextDescs = [...value.descriptions];
    const field = targetToField(modifier.target);

    if (next.has(id)) {
      next.delete(id);
      const idx = nextDescs.findIndex(d => d.includes(modifier.name));
      if (idx >= 0) nextDescs.splice(idx, 1);
      if (field === 'rangeMultiplier') {
        onChange({ ...value, rangeMultiplier: (value.rangeMultiplier || 1) / (modifier.value || 1), descriptions: nextDescs });
      } else {
        onChange({ ...value, [field]: ((value[field] as number) || 0) - modifier.value, descriptions: nextDescs });
      }
    } else {
      next.add(id);
      nextDescs.push(`${modifier.name}: ${modifier.value > 0 ? '+' : ''}${modifier.value}`);
      if (field === 'rangeMultiplier') {
        onChange({ ...value, rangeMultiplier: (value.rangeMultiplier || 1) * (modifier.value || 1), descriptions: nextDescs });
      } else {
        onChange({ ...value, [field]: ((value[field] as number) || 0) + modifier.value, descriptions: nextDescs });
      }
    }
    setSelectedCatalogIds(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Модификаторы</div>
        <button
          onClick={() => setShowCatalog(!showCatalog)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all",
            showCatalog
              ? "border-purple-500 bg-purple-950/30 text-purple-400"
              : "border-slate-600 bg-slate-800 text-slate-400"
          )}
        >
          <Plus className="w-3 h-3" />
          Каталог
        </button>
      </div>

      {selectedCatalogIds.size > 0 && (
        <div className="flex flex-wrap gap-1">
          {allModifiers
            .filter(m => selectedCatalogIds.has(m.id))
            .map(m => (
              <button
                key={m.id}
                onClick={() => toggleCatalogItem(m.id, m)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border",
                  m.isBuff
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-400"
                    : "border-red-500/40 bg-red-950/30 text-red-400"
                )}
              >
                {m.name}
                <X className="w-3 h-3" />
              </button>
            ))}
        </div>
      )}

      {showCatalog && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg max-h-40 overflow-y-auto custom-scrollbar">
          {allModifiers.map(m => (
            <button
              key={m.id}
              onClick={() => toggleCatalogItem(m.id, m)}
              className={cn(
                "w-full text-left px-3 py-2 text-xs border-b border-slate-700/50 transition-colors",
                selectedCatalogIds.has(m.id)
                  ? "bg-slate-700/50"
                  : "hover:bg-slate-700/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "font-mono font-bold",
                  m.isBuff ? "text-emerald-400" : "text-red-400"
                )}>{m.name}</span>
                <span className="text-slate-500 text-[10px]">{m.value > 0 ? '+' : ''}{m.value}</span>
              </div>
              <div className="text-slate-500 text-[10px] mt-0.5">{m.description}</div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {NUMERIC_FIELDS.map(({ target, label, key }) => (
          <div key={target} className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap min-w-[60px]">{label}</span>
            <NumberStepper
              value={(value[key] as number) || 0}
              onChange={(val) => handleNumericChange(key, val)}
              min={target === 'distance_penalty' ? 0 : -10}
              max={10}
              step={1}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
