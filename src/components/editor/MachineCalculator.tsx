'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { machineCost, weaponCost } from '@/lib/machine-calculator-engine';
import { MONOBLOCKS, CHASSIS, ARSENAL_PRESETS } from '@/data/calculator/machine-catalogs';
import type { MachineCalculatorParams, WeaponSlotConfig, ChassisId } from '@/lib/editor/types';

const SLOT_NAMES = ['Верх', 'Верх', 'Манипулятор', 'Манипулятор', 'Нижнее'];

interface Props {
  params: MachineCalculatorParams;
  onParamsChange: (p: MachineCalculatorParams) => void;
  onApply: (cost: number) => void;
}

const empty = (): WeaponSlotConfig => ({ preset: 'empty', range: '', power: '', ammo: 0, property: null });

export function MachineCalculator({ params, onParamsChange, onApply }: Props) {
  const breakdown = useMemo(() => machineCost(params), [params]);

  const setMonoblock = (monoblock: MachineCalculatorParams['monoblock']) => onParamsChange({ ...params, monoblock });
  const setChassis = (chassis: ChassisId) => onParamsChange({ ...params, chassis });
  const setSlot = (i: number, over: Partial<WeaponSlotConfig>) => {
    const slots = params.slots.map((s, idx) => (idx === i ? { ...s, ...over } : s));
    onParamsChange({ ...params, slots });
  };
  const applyPreset = (i: number, presetId: string) => {
    if (presetId === 'empty') return setSlot(i, { preset: 'empty', range: '', power: '', ammo: 0, property: null });
    if (presetId === 'custom') return setSlot(i, { preset: 'custom' });
    const p = ARSENAL_PRESETS.find(a => a.id === presetId)!;
    setSlot(i, { preset: presetId, range: p.range, power: p.power, ammo: p.ammo, property: p.property });
  };

  const isOrudie = params.chassis === 'Стационарное';
  const selectCls = 'w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm cursor-pointer';

  return (
    <div className="space-y-4" data-testid="machine-calculator">
      {/* Моноблок + Шасси */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Моноблок</span>
          <select className={selectCls} data-testid="mc-monoblock"
            value={params.monoblock} onChange={e => setMonoblock(e.target.value as MachineCalculatorParams['monoblock'])}>
            {MONOBLOCKS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Шасси</span>
          <select className={selectCls} data-testid="mc-chassis"
            value={params.chassis} onChange={e => setChassis(e.target.value as ChassisId)}>
            {CHASSIS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {/* Derived readout */}
      <div className="flex gap-2 text-xs flex-wrap" data-testid="mc-readout">
        <span className="px-2 py-1 bg-slate-800 rounded">Броня <b className="text-emerald-400">{breakdown.armor}</b></span>
        {!isOrudie && <span className="px-2 py-1 bg-slate-800 rounded">Скорость <b className="text-emerald-400">{breakdown.speed}</b></span>}
        <span className="px-2 py-1 bg-slate-800 rounded">БК <b className="text-emerald-400">{breakdown.derived.ammo_max}</b></span>
        {isOrudie && <span className="px-2 py-1 bg-orange-900/40 text-orange-300 rounded">⊕ орудие · неподвижно</span>}
        {breakdown.flyerPremium && <span className="px-2 py-1 bg-orange-900/40 text-orange-300 rounded">✈ полёт +40%</span>}
      </div>

      {/* 5 weapon slots */}
      <div className="space-y-2" data-testid="mc-slots">
        {params.slots.map((s, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-2 items-center p-2 bg-slate-900/60 border border-slate-800 rounded" data-testid={`mc-slot-${i}`}>
            <span className="text-xs text-slate-500 w-24">Слот {i + 1} · {SLOT_NAMES[i]}</span>
            <div className="flex flex-wrap gap-2 items-center">
              <select className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs"
                value={s.preset} onChange={e => applyPreset(i, e.target.value)} data-testid={`mc-slot-${i}-preset`}>
                <option value="empty">(ничего)</option>
                <option value="custom">— своё —</option>
                {ARSENAL_PRESETS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {s.range === 'ББ' || /^[-+]?\d+$/.test(s.power) ? (
                <label className="text-xs text-slate-400 flex items-center gap-1">ББ ранг
                  <input type="number" min={1} max={3} className="w-12 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs"
                    value={s.power} onChange={e => setSlot(i, { range: 'ББ', power: e.target.value })} />
                </label>
              ) : (
                <>
                  <input placeholder="Дальн (D12)" className="w-20 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono"
                    value={s.range} onChange={e => setSlot(i, { range: e.target.value, preset: 'custom' })} />
                  <input placeholder="Мощн (2D20)" className="w-20 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono"
                    value={s.power} onChange={e => setSlot(i, { power: e.target.value, preset: 'custom' })} />
                  <input type="number" placeholder="БК" className="w-12 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono"
                    value={s.ammo || ''} onChange={e => setSlot(i, { ammo: parseInt(e.target.value, 10) || 0, preset: 'custom' })} />
                  <select className="px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs"
                    value={s.property ?? ''} onChange={e => setSlot(i, { property: (e.target.value || null) as WeaponSlotConfig['property'], preset: 'custom' })}>
                    <option value="">—</option>
                    <option value="burst3">3 выстрела</option>
                    <option value="blast1">Взрыв 1шг</option>
                    <option value="blast2">Взрыв 2шг</option>
                  </select>
                </>
              )}
            </div>
            <span className="text-sm font-mono text-emerald-400 w-10 text-right" data-testid={`mc-slot-${i}-cost`}>
              {weaponCost(s)}
            </span>
          </div>
        ))}
      </div>

      {/* Cost breakdown */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 space-y-1.5" data-testid="mc-breakdown">
        <Row label={`Σ орудий`} value={breakdown.weapons} />
        <Row label={`броня ${breakdown.armor}×10`} value={breakdown.armorCost} />
        {!isOrudie && <Row label={`скорость ${breakdown.speed}×10`} value={breakdown.speedCost} />}
        {breakdown.flyerPremium && <Row label={`полёт (+второй ход, ×1.4)`} value={undefined} muted />}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Итого</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono" data-testid="mc-total">{breakdown.total}</span>
        </div>
        <button onClick={() => onApply(breakdown.total)}
          className="mt-2 w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white"
          data-testid="mc-apply">
          Применить стоимость
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: number | undefined; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-xs ${muted ? 'text-orange-300/80' : 'text-slate-400'}`}>
      <span>{label}</span>
      {value !== undefined && <span className="font-mono text-slate-300">{value}</span>}
    </div>
  );
}
