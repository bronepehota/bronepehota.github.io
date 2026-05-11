'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Skull, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { getStandardBuffs, getStandardDebuffs } from '@/lib/modifier-utils';
import type { ModifierSummary, ModifierTarget } from '@/lib/modifier-types';

interface ModifiersSelectorProps {
  value: ModifierSummary;
  onChange: (summary: ModifierSummary) => void;
  className?: string;
  phase?: 'shot' | 'melee' | 'grenade';
}

const NUMERIC_FIELDS: Array<{ target: ModifierTarget; label: string; key: keyof ModifierSummary }> = [
  { target: 'range_bonus', label: 'Дальность', key: 'rangeBonus' },
  { target: 'power_bonus', label: 'Мощность', key: 'powerBonus' },
  { target: 'melee_bonus', label: 'Ближний бой', key: 'meleeBonus' },
  { target: 'armor_bonus', label: 'Броня', key: 'armorBonus' },
  { target: 'distance_penalty', label: '−Дистанция', key: 'distancePenalty' },
];

type Tab = 'buffs' | 'debuffs' | 'manual';

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

export function ModifiersSelector({ value, onChange, className, phase }: ModifiersSelectorProps) {
  const [tab, setTab] = useState<Tab>('buffs');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredNumericFields = useMemo(() => {
    if (!phase) return NUMERIC_FIELDS;
    if (phase === 'melee') return NUMERIC_FIELDS.filter(f => f.target === 'melee_bonus');
    return NUMERIC_FIELDS;
  }, [phase]);

  const buffs = useMemo(() => {
    const all = getStandardBuffs().filter(b => b.target !== 'speed_multiply' && b.target !== 'custom');
    if (!phase) return all;
    if (phase === 'melee') return all.filter(m => m.phase === 'melee' || m.phase === 'always');
    if (phase === 'shot') return all.filter(m => m.phase === 'shot' || m.phase === 'always');
    return all.filter(m => m.phase === 'grenade' || m.phase === 'shot' || m.phase === 'always');
  }, [phase]);

  const debuffs = useMemo(() => {
    const all = getStandardDebuffs().filter(d => d.target !== 'speed_multiply' && d.target !== 'custom');
    if (!phase) return all;
    if (phase === 'melee') return all.filter(m => m.phase === 'melee' || m.phase === 'always');
    if (phase === 'shot') return all.filter(m => m.phase === 'shot' || m.phase === 'always');
    return all.filter(m => m.phase === 'grenade' || m.phase === 'shot' || m.phase === 'always');
  }, [phase]);

  const allModifiers = useMemo(() => [
    ...buffs.map(b => ({ ...b, isBuff: true as const })),
    ...debuffs.map(d => ({ ...d, isBuff: false as const })),
  ], [buffs, debuffs]);

  const activeCount = selectedIds.size;

  const toggleItem = (id: string, modifier: { target: ModifierTarget; value: number; name: string }) => {
    const next = new Set(selectedIds);
    const descs = [...value.descriptions];
    const field = targetToField(modifier.target);

    if (next.has(id)) {
      next.delete(id);
      const idx = descs.findIndex(d => d.includes(modifier.name));
      if (idx >= 0) descs.splice(idx, 1);
      if (field === 'rangeMultiplier') {
        onChange({ ...value, rangeMultiplier: (value.rangeMultiplier || 1) / (modifier.value || 1), descriptions: descs });
      } else {
        onChange({ ...value, [field]: ((value[field] as number) || 0) - modifier.value, descriptions: descs });
      }
    } else {
      next.add(id);
      descs.push(`${modifier.name}: ${modifier.value > 0 ? '+' : ''}${modifier.value}`);
      if (field === 'rangeMultiplier') {
        onChange({ ...value, rangeMultiplier: (value.rangeMultiplier || 1) * (modifier.value || 1), descriptions: descs });
      } else {
        onChange({ ...value, [field]: ((value[field] as number) || 0) + modifier.value, descriptions: descs });
      }
    }
    setSelectedIds(next);
  };

  const handleNumericChange = (key: keyof ModifierSummary, val: number) => {
    onChange({ ...value, [key]: val });
  };

  // Check if any manual value is non-zero
  const hasManualValues = filteredNumericFields.some(
    f => ((value[f.key] as number) || 0) !== 0
  );

  const tabs: Array<{ id: Tab; label: string; icon: typeof Sparkles; badge?: number }> = [
    { id: 'buffs', label: 'Баффы', icon: Sparkles, badge: Array.from(selectedIds).filter(id => allModifiers.find(m => m.id === id)?.isBuff).length },
    { id: 'debuffs', label: 'Дебаффы', icon: Skull, badge: Array.from(selectedIds).filter(id => !allModifiers.find(m => m.id === id)?.isBuff).length },
    { id: 'manual', label: 'Ручной', icon: SlidersHorizontal, badge: hasManualValues ? 1 : undefined },
  ];

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Tab bar */}
      <div className="flex border-b border-slate-700/50 mb-3">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all relative",
              tab === id
                ? cn(
                    "text-white",
                    id === 'buffs' && "text-emerald-400",
                    id === 'debuffs' && "text-red-400",
                    id === 'manual' && "text-blue-400"
                  )
                : "text-slate-500 hover:text-slate-400"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {badge ? (
              <span className={cn(
                "ml-0.5 px-1.5 py-px rounded-full text-[8px] font-bold",
                id === 'buffs' && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                id === 'debuffs' && "bg-red-500/20 text-red-400 border border-red-500/30",
                id === 'manual' && "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              )}>
                {badge}
              </span>
            ) : null}
            {/* Active indicator */}
            {tab === id && (
              <div className={cn(
                "absolute bottom-0 left-2 right-2 h-[2px] rounded-full",
                id === 'buffs' && "bg-emerald-500/60",
                id === 'debuffs' && "bg-red-500/60",
                id === 'manual' && "bg-blue-500/60"
              )} />
            )}
          </button>
        ))}
      </div>

      {/* Active modifier chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {allModifiers
            .filter(m => selectedIds.has(m.id))
            .map(m => (
              <button
                key={m.id}
                onClick={() => toggleItem(m.id, m)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all active:scale-95",
                  m.isBuff
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50"
                    : "border-red-500/40 bg-red-950/30 text-red-400 hover:bg-red-950/50"
                )}
              >
                <span>{m.value > 0 ? '+' : ''}{m.value}</span>
                <span className="opacity-60">{m.name}</span>
                <span className="opacity-40 text-[8px]">✕</span>
              </button>
            ))}
        </div>
      )}

      {/* Tab content */}
      {tab === 'buffs' && (
        <div className="grid grid-cols-2 gap-1.5">
          {buffs.map(b => {
            const active = selectedIds.has(b.id);
            return (
              <button
                key={b.id}
                onClick={() => toggleItem(b.id, b)}
                className={cn(
                  "relative p-2 rounded-lg border-2 text-left transition-all active:scale-95 overflow-hidden",
                  active
                    ? "border-emerald-500/60 bg-emerald-950/40 shadow-sm shadow-emerald-500/10"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-emerald-500/30 hover:bg-slate-800/60"
                )}
              >
                {/* Active glow */}
                {active && (
                  <div className="absolute top-0 right-0 w-4 h-4">
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "font-mono font-black text-xs",
                    active ? "text-emerald-400" : "text-slate-300"
                  )}>
                    {b.name}
                  </span>
                  <span className={cn(
                    "font-mono text-[10px] font-bold",
                    active ? "text-emerald-400/70" : "text-emerald-500/50"
                  )}>
                    +{b.value}
                  </span>
                </div>
                <div className="text-[8px] text-slate-600 mt-0.5 leading-tight line-clamp-2">
                  {b.description}
                </div>
              </button>
            );
          })}
          {buffs.length === 0 && (
            <div className="col-span-2 text-center py-4 text-[10px] text-slate-600 font-mono">
              Нет баффов для этой фазы
            </div>
          )}
        </div>
      )}

      {tab === 'debuffs' && (
        <div className="grid grid-cols-2 gap-1.5">
          {debuffs.map(d => {
            const active = selectedIds.has(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleItem(d.id, d)}
                className={cn(
                  "relative p-2 rounded-lg border-2 text-left transition-all active:scale-95 overflow-hidden",
                  active
                    ? "border-red-500/60 bg-red-950/40 shadow-sm shadow-red-500/10"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-red-500/30 hover:bg-slate-800/60"
                )}
              >
                {active && (
                  <div className="absolute top-0 right-0 w-4 h-4">
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "font-mono font-black text-xs",
                    active ? "text-red-400" : "text-slate-300"
                  )}>
                    {d.name}
                  </span>
                  <span className={cn(
                    "font-mono text-[10px] font-bold",
                    active ? "text-red-400/70" : "text-red-500/50"
                  )}>
                    {d.value}
                  </span>
                </div>
                <div className="text-[8px] text-slate-600 mt-0.5 leading-tight line-clamp-2">
                  {d.description}
                </div>
              </button>
            );
          })}
          {debuffs.length === 0 && (
            <div className="col-span-2 text-center py-4 text-[10px] text-slate-600 font-mono">
              Нет дебаффов для этой фазы
            </div>
          )}
        </div>
      )}

      {tab === 'manual' && (
        <div className="space-y-2">
          <div className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">
            Ручная корректировка значений
          </div>
          <div className="grid grid-cols-1 gap-2">
            {filteredNumericFields.map(({ target, label, key }) => {
              const val = (value[key] as number) || 0;
              return (
                <div
                  key={target}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors",
                    val !== 0
                      ? "border-blue-500/30 bg-blue-950/20"
                      : "border-slate-700/40 bg-slate-800/30"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-mono font-bold uppercase tracking-wider",
                    val !== 0 ? "text-blue-400" : "text-slate-500"
                  )}>
                    {label}
                  </span>
                  <NumberStepper
                    value={val}
                    onChange={(v) => handleNumericChange(key, v)}
                    min={target === 'distance_penalty' ? 0 : -10}
                    max={10}
                    step={1}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
