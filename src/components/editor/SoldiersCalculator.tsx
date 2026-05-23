'use client';

import { useMemo } from 'react';
import { Trash2, Plus, Calculator, ExternalLink, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import {
  RACES, SQUAD_TYPES, ARMOR_TYPES, WEAPONS, MELEE_WEAPONS, PROPERTIES,
} from '@/data/calculator/calculator-catalogs';
import {
  calculateSquadSoldiers, calculateSquadCost,
  type CalculatorSoldierParams, type CalculatedSoldier,
} from '@/lib/calculator-engine';

interface SoldiersCalculatorProps {
  params: CalculatorSoldierParams[];
  onParamsChange: (params: CalculatorSoldierParams[]) => void;
  onApply: (soldiers: CalculatedSoldier[], squadCost: number) => void;
  onAddSoldier: () => void;
  onRemoveSoldier: (index: number) => void;
  soldierCount: number;
}

const STAT_LABELS = [
  { key: 'rank', label: 'Ранг' },
  { key: 'speed', label: 'Скор' },
  { key: 'range', label: 'Дальн' },
  { key: 'power', label: 'Мощн' },
  { key: 'melee', label: 'ББ' },
  { key: 'armor', label: 'Брон' },
] as const;

const selectClass = "w-full px-1.5 py-1.5 bg-slate-900 border border-slate-700/70 rounded text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 appearance-none cursor-pointer";
const labelClass = "text-[9px] text-slate-500 uppercase tracking-wider mb-0.5 block";

export function SoldiersCalculator({
  params, onParamsChange, onApply, onAddSoldier, onRemoveSoldier, soldierCount,
}: SoldiersCalculatorProps) {
  const calculated = useMemo(() => calculateSquadSoldiers(params), [params]);
  const totalCost = useMemo(() => calculateSquadCost(calculated.map(c => c.costBreakdown.total)), [calculated]);

  const updateParam = (index: number, updates: Partial<CalculatorSoldierParams>) => {
    onParamsChange(params.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs border-collapse" data-testid="calculator-table">
          <thead>
            {/* Input labels */}
            <tr className="border-b border-slate-700/50">
              <th className="w-7 px-0.5 pb-1.5" />
              <th className="px-1 pb-1.5 text-left" colSpan={7}>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-medium">Параметры</span>
              </th>
              <th className="px-1 pb-1.5 text-left" colSpan={6}>
                <span className="text-[9px] text-emerald-500/70 uppercase tracking-widest font-medium">Результат</span>
              </th>
              <th className="w-8 px-0.5 pb-1.5" />
            </tr>
            <tr className="border-b border-slate-800/80">
              <th className="w-7 px-0.5 pb-2" />
              <th className="px-1 pb-2"><span className={labelClass}>Фото</span></th>
              <th className="px-1 pb-2"><span className={labelClass}>Раса</span></th>
              <th className="px-1 pb-2"><span className={labelClass}>Тип отряда</span></th>
              <th className="px-1 pb-2"><span className={labelClass}>Броня</span></th>
              <th className="px-1 pb-2"><span className={labelClass}>Оружие</span></th>
              <th className="px-1 pb-2"><span className={labelClass}>×2</span></th>
              <th className="px-1 pb-2"><span className={labelClass}>Оружие ББ</span></th>
              <th className="px-1 pb-2"><span className={labelClass}>Свойство</span></th>
              {STAT_LABELS.map(s => (
                <th key={s.key} className="px-1 pb-2 text-center">
                  <span className="text-[9px] text-emerald-400/60 uppercase tracking-wider">{s.label}</span>
                </th>
              ))}
              <th className="w-8 px-0.5 pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {params.map((p, i) => {
              const c = calculated[i];
              return (
                <tr
                  key={i}
                  className="group hover:bg-slate-800/20 transition-colors"
                  data-testid={`calculator-row-${i}`}
                >
                  {/* Number */}
                  <td className="px-0.5 py-1.5 text-center">
                    <span className="text-[10px] text-slate-600 font-mono">{i + 1}</span>
                  </td>

                  {/* Image */}
                  <td className="px-1 py-1.5">
                    <div className="relative group/img">
                      {p.image ? (
                        <div className="w-9 h-12 rounded border border-slate-700 overflow-hidden bg-slate-900 shrink-0">
                          <GitHubPagesImage
                            src={p.image}
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
                      <input
                        type="text"
                        value={p.image || ''}
                        onChange={(e) => updateParam(i, { image: e.target.value || undefined })}
                        className="absolute inset-0 w-full h-full opacity-0 group-hover/img:opacity-100 bg-slate-900/90 border border-slate-600 rounded text-[9px] text-center px-0.5 focus:opacity-100 focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition-opacity"
                        placeholder="/images/..."
                      />
                    </div>
                  </td>

                  {/* Race */}
                  <td className="px-1 py-1.5">
                    <select
                      value={p.race}
                      onChange={e => updateParam(i, { race: e.target.value })}
                      className={selectClass}
                    >
                      {RACES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>

                  {/* Squad type */}
                  <td className="px-1 py-1.5">
                    <select
                      value={p.squadType}
                      onChange={e => updateParam(i, { squadType: e.target.value })}
                      className={selectClass}
                    >
                      {SQUAD_TYPES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>

                  {/* Armor */}
                  <td className="px-1 py-1.5">
                    <select
                      value={p.armor}
                      onChange={e => updateParam(i, { armor: e.target.value })}
                      className={selectClass}
                    >
                      {ARMOR_TYPES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>

                  {/* Weapon */}
                  <td className="px-1 py-1.5">
                    <select
                      value={p.weapon}
                      onChange={e => updateParam(i, { weapon: e.target.value })}
                      className={selectClass}
                    >
                      {WEAPONS.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name}{w.isHeavy ? ' ★' : ''}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Two weapons (Macedonian) */}
                  <td className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => updateParam(i, { twoWeapons: !p.twoWeapons })}
                      className={cn(
                        "w-7 h-7 rounded border text-xs font-bold transition-all",
                        p.twoWeapons
                          ? "bg-emerald-600/20 border-emerald-600/50 text-emerald-400"
                          : "bg-slate-900 border-slate-700/70 text-slate-600 hover:border-slate-600"
                      )}
                    >
                      2
                    </button>
                  </td>

                  {/* Melee weapon */}
                  <td className="px-1 py-1.5">
                    <select
                      value={p.meleeWeapon}
                      onChange={e => updateParam(i, { meleeWeapon: e.target.value })}
                      className={selectClass}
                    >
                      {MELEE_WEAPONS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </td>

                  {/* Property */}
                  <td className="px-1 py-1.5">
                    <select
                      value={p.property ?? ''}
                      onChange={e => updateParam(i, { property: e.target.value || null })}
                      className={selectClass}
                    >
                      <option value="">—</option>
                      {PROPERTIES.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                    </select>
                  </td>

                  {/* Computed stats */}
                  <td className="px-1 py-1.5 text-center">
                    <span className="text-xs text-emerald-300/90 font-mono">{c.rank}</span>
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <span className="text-xs text-emerald-300/90 font-mono">{c.speed}</span>
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <span className="text-xs text-emerald-300/90 font-mono whitespace-nowrap">{c.range}</span>
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <span className="text-xs text-emerald-300/90 font-mono whitespace-nowrap">{c.power}</span>
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <span className="text-xs text-emerald-300/90 font-mono">{c.melee}</span>
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <span className="text-xs text-emerald-300/90 font-mono">{c.armor}</span>
                  </td>

                  {/* Delete */}
                  <td className="px-0.5 py-1.5 text-center">
                    <button
                      onClick={() => onRemoveSoldier(i)}
                      disabled={soldierCount <= 1}
                      className="p-1 rounded bg-red-900/20 hover:bg-red-900/40 border border-red-600/30 disabled:opacity-30 transition-all"
                      title="Удалить"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add soldier button + legend */}
      <div className="flex items-center gap-4">
        <button
          onClick={onAddSoldier}
          disabled={soldierCount >= 6}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/20 text-xs text-emerald-400 transition-all disabled:opacity-40"
          data-testid="calculator-add-soldier"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить солдата
        </button>
        <span className="text-[10px] text-slate-600">
          ★ — тяжёлое оружие (ББ = 0, при 3+ в отряде снижает скорость)
        </span>
      </div>

      {/* Cost summary */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-4 h-4 text-emerald-500/70" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Стоимость отряда</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Per-soldier costs */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5">
              {calculated.map((c, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/40 text-[10px]"
                >
                  <span className="text-slate-500">{i + 1}:</span>{' '}
                  <span className="text-emerald-400 font-mono font-medium">{c.costBreakdown.total}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
              <span>Сумма: {calculated.reduce((s, c) => s + c.costBreakdown.total, 0)}</span>
              <span className="text-slate-700">→</span>
              <span>/10</span>
              <span className="text-slate-700">→</span>
              <span>CEILING(_, 5)</span>
              <span className="text-slate-700">=</span>
              <span className="text-emerald-400 font-mono font-bold text-xs" data-testid="calculator-cost">{totalCost}</span>
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={() => onApply(calculated, totalCost)}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-all font-semibold text-white shadow-lg shadow-emerald-900/20 text-sm whitespace-nowrap"
            data-testid="calculator-apply"
          >
            Применить
          </button>
        </div>
      </div>

      {/* Attribution */}
      <div className="flex items-center justify-between pt-1">
        <a
          href="https://vk.com/bp_bnp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          Калькулятор от Star System
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
