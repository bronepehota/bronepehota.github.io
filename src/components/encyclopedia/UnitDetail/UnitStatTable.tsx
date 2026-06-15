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
  type: 'squad' | 'machine';
}

export function UnitStatTable({ unit, type }: UnitStatTableProps) {
  if (type === 'machine') {
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
        // БОЕВОЙ РАСЧЁТ
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

// Placeholder — implemented in Task 2.
function MachineStats({ machine: _machine }: { machine: Machine }) {
  return null;
}
