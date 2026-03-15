/**
 * Soldiers table component - displays soldiers in a table with editable fields
 */

'use client';

import { CustomSoldier } from '@/lib/editor/types';
import { Trash2 } from 'lucide-react';

interface SoldiersTableProps {
  soldiers: CustomSoldier[];
  onUpdate: (index: number, updates: Partial<CustomSoldier>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function SoldiersTable({
  soldiers,
  onUpdate,
  onRemove,
  disabled = false,
}: SoldiersTableProps) {
  return (
    <div className="overflow-y-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-xs text-slate-400">
            <th className="w-8 px-1">№</th>
            <th className="w-12 px-1">Ранг</th>
            <th className="w-8 px-1">Скор</th>
            <th className="w-12 px-1">Дальн</th>
            <th className="w-12 px-1">Мощн</th>
            <th className="w-12 px-1">ББ</th>
            <th className="w-12 px-1">Свойства</th>
            <th className="w-8 px-1">Броня</th>
            <th className="w-16 px-1">Действия</th>
          </tr>
        </thead>
        <tbody>
          {soldiers.map((soldier, index) => (
            <tr key={index} className="border-b border-slate-700">
              <td className="w-8 px-1 text-center text-slate-400">
                {index + 1}
              </td>
              <td className="w-12 px-1">
                <input
                  type="number"
                  value={soldier.rank}
                  onChange={(e) => onUpdate(index, { rank: parseInt(e.target.value) || 0 })}
                  className="w-full px-1 py-0.5 bg-slate-800 border-slate-700 rounded text-center"
                  min="0"
                  max="7"
                />
              </td>
              <td className="w-8 px-1">
                <input
                  type="number"
                  value={soldier.speed}
                  onChange={(e) => onUpdate(index, { speed: parseInt(e.target.value) || 0 })}
                  className="w-full px-1 py-0.5 bg-slate-800 border-slate-700 rounded text-center"
                  min="0"
                  max="8"
                />
              </td>
              <td className="w-12 px-1">
                <input
                  type="text"
                  value={soldier.range}
                  onChange={(e) => onUpdate(index, { range: e.target.value })}
                  className="w-full px-1 py-0.5 bg-slate-800 border-slate-700 rounded text-center"
                />
              </td>
              <td className="w-12 px-1">
                <input
                  type="text"
                  value={soldier.power}
                  onChange={(e) => onUpdate(index, { power: e.target.value })}
                  className="w-full px-1 py-0.5 bg-slate-800 border-slate-700 rounded text-center"
                />
              </td>
              <td className="w-12 px-1">
                <input
                  type="number"
                  value={soldier.melee}
                  onChange={(e) => onUpdate(index, { melee: parseInt(e.target.value) || 0 })}
                  className="w-full px-1 py-0.5 bg-slate-800 border-slate-700 rounded text-center"
                  min="0"
                />
              </td>
              <td className="w-12 px-1">
                <input
                  type="text"
                  value={soldier.props.join(', ')}
                  onChange={(e) => onUpdate(index, { props: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-1 py-0.5 bg-slate-800 border-slate-700 rounded text-center"
                  placeholder="Г, БЫ"
                />
              </td>
              <td className="w-8 px-1">
                <input
                  type="number"
                  value={soldier.armor}
                  onChange={(e) => onUpdate(index, { armor: parseInt(e.target.value) || 0 })}
                  className="w-full px-1 py-0.5 bg-slate-800 border-slate-700 rounded text-center"
                  min="0"
                />
              </td>
              <td className="w-16 px-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => onRemove(index)}
                    disabled={disabled || soldiers.length <= 1}
                    className="p-1 rounded hover:bg-red-900 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
