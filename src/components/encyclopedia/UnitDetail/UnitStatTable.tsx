'use client';

import React from 'react';
import type { Squad, Machine, Soldier } from '@/lib/types';
import { getStandardBuffs } from '@/lib/modifier-utils';
import { ModifierIcon } from '@/components/editor/ModifierIcons';

// Canonical semantic stat colors (mirrors SoldierImages palette).
const STAT_TEXT: Record<string, string> = {
  rank: 'text-amber-400',
  speed: 'text-military-sand',
  range: 'text-cyan-400',
  power: 'text-red-400',
  melee: 'text-orange-400',
  armor: 'text-blue-400',
};

function modifierMeta(id: string): { name: string; icon?: string } | undefined {
  const found = getStandardBuffs().find((b) => b.id === id);
  return found ? { name: found.name, icon: found.icon } : undefined;
}

interface UnitStatTableProps {
  unit: Squad | Machine;
  type: 'squad' | 'machine' | 'орудие';
}

export function UnitStatTable({ unit, type }: UnitStatTableProps) {
  // Орудия имеют ту же структуру данных, что и машины (прочность, вооружение)
  if (type === 'machine' || type === 'орудие') {
    return <MachineStats machine={unit as Machine} />;
  }
  return <SquadStats squad={unit as Squad} />;
}

function isSpecial(s: Soldier): boolean {
  return Boolean(s.modifiers?.length) || s.rank >= 3;
}

function SquadStats({ squad }: { squad: Squad }) {
  return (
    <section className="folded-paper military-corners p-3" data-testid="unit-stat-table" aria-label="Боевой расчёт">
      <div className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
        {'// БОЕВОЙ РАСЧЁТ'}
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm font-ibm-mono">
          <thead>
            <tr className="text-military-steel text-[10px] uppercase">
              <th className="px-1 py-1 text-left font-medium">№</th>
              <th className="px-1 py-1 font-medium">А</th>
              <th className="px-1 py-1 font-medium">Ск</th>
              <th className="px-1 py-1 font-medium">Дальн</th>
              <th className="px-1 py-1 font-medium">Мощн</th>
              <th className="px-1 py-1 font-medium">ББ</th>
              <th className="px-1 py-1 font-medium">Св</th>
              <th className="px-1 py-1 font-medium">Бр</th>
            </tr>
          </thead>
          <tbody>
            {squad.soldiers.map((s, i) => {
              const mod = s.modifiers?.[0] ? modifierMeta(s.modifiers[0]) : undefined;
              const special = isSpecial(s);
              return (
                <tr
                  key={s.num ?? i}
                  className={`border-t border-military-steel/20 ${special ? 'bg-military-amber/5' : ''}`}
                >
                  <td className="px-1 py-1.5 text-military-taupe">{s.num ?? i + 1}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.rank}`}>{s.rank}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.speed}`}>{s.speed}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.range}`}>{s.range || '—'}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.power}`}>{s.power || '—'}</td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.melee}`}>{s.melee}</td>
                  <td className="px-1 py-1.5 text-center">
                    {mod ? (
                      <span className="inline-flex items-center gap-1 px-1 rounded-sm bg-military-steel/30 text-military-sand text-[10px]">
                        {mod.icon && <ModifierIcon name={mod.icon} size={10} className="text-military-amber" />}
                        {mod.name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={`px-1 py-1.5 text-center ${STAT_TEXT.armor}`}>{s.armor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MachineStats({ machine }: { machine: Machine }) {
  const speeds = Array.from(new Set(machine.speed_sectors.map((s) => s.speed))).join(' / ');
  const tiles = [
    { label: 'Ранг', value: String(machine.rank), cls: STAT_TEXT.rank },
    { label: 'Прочн.', value: String(machine.durability_max), cls: 'text-military-sand' },
    { label: 'Б/с', value: String(machine.fire_rate), cls: 'text-amber-400' },
    { label: 'Боезапас', value: String(machine.ammo_max), cls: 'text-military-sand' },
    { label: 'Скорость', value: speeds, cls: STAT_TEXT.speed },
  ];
  return (
    <section className="folded-paper military-corners p-3" data-testid="unit-stat-table" aria-label="Боевой расчёт">
      <div className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-2">
        {'// БОЕВОЙ РАСЧЁТ'}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
        {tiles.map((t) => (
          <div key={t.label} className="text-center p-2 bg-military-charcoal/50 rounded">
            <div className={`font-russo text-base font-bold ${t.cls}`}>{t.value}</div>
            <div className="font-ibm-mono text-[10px] text-military-steel uppercase">{t.label}</div>
          </div>
        ))}
      </div>
      <ul className="space-y-1">
        {machine.weapons.map((w, i) => (
          <li key={i} className="flex items-center justify-between gap-2 font-ibm-mono text-xs">
            <span className="text-military-sand truncate">{w.name}</span>
            <span className="flex items-center gap-2 shrink-0">
              <span className={STAT_TEXT.range}>{w.range}</span>
              <span className={STAT_TEXT.power}>{w.power}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
