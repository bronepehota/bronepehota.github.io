'use client';

import { useMemo, useEffect, useState } from 'react';
import { Shield, ShieldOff, ChevronDown, ChevronUp } from 'lucide-react';
import type { BuffDefinition, DebuffTemplate, ModifierPhase } from '@/lib/modifier-types';
import { getAllBuffs, getAllDebuffs } from '@/lib/modifier-utils';

interface CalculatorModifierSelectorProps {
  selectedBuffs: Set<string>;
  selectedDebuffs: Set<string>;
  onToggleBuff: (id: string) => void;
  onToggleDebuff: (id: string) => void;
  phase: ModifierPhase;
  className?: string;
}

function filterByPhase<T extends { phase: ModifierPhase }>(items: T[], phase: ModifierPhase): T[] {
  if (phase === 'always') return items;
  if (phase === 'melee') return items.filter(i => i.phase === 'melee' || i.phase === 'always');
  if (phase === 'grenade') return items.filter(i => i.phase === 'grenade' || i.phase === 'shot' || i.phase === 'always');
  return items.filter(i => i.phase === 'shot' || i.phase === 'always');
}

function targetLabel(target: string): string {
  const map: Record<string, string> = {
    range_bonus: 'Дальность',
    range_multiply: 'Дальность xN',
    power_bonus: 'Мощность',
    melee_bonus: 'ББ',
    speed_multiply: 'Скорость',
    armor_bonus: 'Броня',
    distance_penalty: 'Дистанция +',
    custom: 'Особое',
  };
  return map[target] || target;
}

function formatValue(target: string, value: number): string {
  if (target === 'range_multiply' || target === 'speed_multiply') return `x${value}`;
  if (target === 'distance_penalty') return `+${value}`;
  return value > 0 ? `+${value}` : `${value}`;
}

export default function CalculatorModifierSelector({
  selectedBuffs,
  selectedDebuffs,
  onToggleBuff,
  onToggleDebuff,
  phase,
  className,
}: CalculatorModifierSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [buffs, setBuffs] = useState<BuffDefinition[]>([]);
  const [debuffs, setDebuffs] = useState<DebuffTemplate[]>([]);

  useEffect(() => {
    setBuffs(getAllBuffs());
    setDebuffs(getAllDebuffs());
  }, []);

  const filteredBuffs = useMemo(() => filterByPhase(buffs, phase), [buffs, phase]);
  const filteredDebuffs = useMemo(() => filterByPhase(debuffs, phase), [debuffs, phase]);

  const activeCount = filteredBuffs.filter(b => selectedBuffs.has(b.id)).length
    + filteredDebuffs.filter(d => selectedDebuffs.has(d.id)).length;

  if (filteredBuffs.length === 0 && filteredDebuffs.length === 0) return null;

  return (
    <div className={className}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2
          bg-slate-800/50 border border-slate-700/50 rounded-lg
          hover:bg-slate-800/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Shield className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldOff className="w-4 h-4 text-slate-500" />
          )}
          <span className="font-russo text-xs uppercase tracking-wide text-slate-300">
            Модификаторы
          </span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-ibm-mono rounded">
              {activeCount}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-1 space-y-2 max-h-60 overflow-y-auto">
          {filteredBuffs.length > 0 && (
            <div>
              <div className="text-[10px] font-ibm-mono text-emerald-400/70 uppercase tracking-wider px-1 py-0.5">
                Баффы
              </div>
              {filteredBuffs.map(buff => (
                <label
                  key={buff.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBuffs.has(buff.id)}
                    onChange={() => onToggleBuff(buff.id)}
                    className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-emerald-500
                      focus:ring-emerald-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-300 truncate">{buff.name}</span>
                      <span className="text-emerald-400 text-[10px] font-ibm-mono shrink-0">
                        {formatValue(buff.target, buff.value)} {targetLabel(buff.target)}
                      </span>
                      {buff.isCustom && (
                        <span className="px-1 py-0 bg-blue-500/20 text-blue-400 text-[8px] font-ibm-mono rounded">
                          CUSTOM
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {filteredDebuffs.length > 0 && (
            <div>
              <div className="text-[10px] font-ibm-mono text-red-400/70 uppercase tracking-wider px-1 py-0.5">
                Дебаффы
              </div>
              {filteredDebuffs.map(debuff => (
                <label
                  key={debuff.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDebuffs.has(debuff.id)}
                    onChange={() => onToggleDebuff(debuff.id)}
                    className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-red-500
                      focus:ring-red-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-300 truncate">{debuff.name}</span>
                      <span className="text-red-400 text-[10px] font-ibm-mono shrink-0">
                        {formatValue(debuff.target, debuff.value)} {targetLabel(debuff.target)}
                      </span>
                      {debuff.isCustom && (
                        <span className="px-1 py-0 bg-blue-500/20 text-blue-400 text-[8px] font-ibm-mono rounded">
                          CUSTOM
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
