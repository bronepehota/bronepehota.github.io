/**
 * Preview modal - shows unit card preview as in main app
 */

'use client';

import { X } from 'lucide-react';
import { CustomSquad, CustomMachine } from '@/lib/editor/types';
import { getSoldierModifierCatalog } from '@/components/editor/SoldiersTable';

interface PreviewModalProps {
  unit: CustomSquad | CustomMachine;
  type: 'squad' | 'machine';
  onClose: () => void;
}

export function PreviewModal({ unit, type, onClose }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-semibold">Превью</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="bg-slate-900 rounded-lg p-4">
            {/* Unit name */}
            <div className="text-lg font-semibold mb-2">{unit.name}</div>
            {unit.shortName && (
              <div className="text-sm text-slate-400 mb-2">{unit.shortName}</div>
            )}

            {/* Cost */}
            <div className="text-sm text-slate-300 mb-4">
              Стоимость: {unit.cost} очков
            </div>

            {/* Squad details */}
            {type === 'squad' && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-300">Солдаты:</div>
                {(unit as CustomSquad).soldiers.map((soldier, index) => (
                  <div key={index} className="text-xs bg-slate-800 p-2 rounded">
                    <div className="flex justify-between">
                      <span>#{index + 1}</span>
                      <span>Ранг: {soldier.rank}</span>
                      <span>Скор: {soldier.speed}</span>
                      <span>Броня: {soldier.armor}</span>
                    </div>
                    <div className="flex justify-between mt-1 text-slate-400">
                      <span>Дальн: {soldier.range}</span>
                      <span>Мощн: {soldier.power}</span>
                      <span>ББ: {soldier.melee}</span>
                    </div>
                    {soldier.modifiers && soldier.modifiers.length > 0 && (() => {
                      const catalog = getSoldierModifierCatalog();
                      return (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {soldier.modifiers!.map(modId => {
                            const mod = catalog.find(m => m.id === modId);
                            return mod ? (
                              <span key={mod.id} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-600/30 text-amber-400 font-mono">
                                {mod.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* Machine details */}
            {type === 'machine' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Ранг:</span> {(unit as CustomMachine).rank}
                  </div>
                  <div>
                    <span className="text-slate-400">Скорострельность:</span> {(unit as CustomMachine).fire_rate}
                  </div>
                  <div>
                    <span className="text-slate-400">Боезапас:</span> {(unit as CustomMachine).ammo_max}
                  </div>
                  <div>
                    <span className="text-slate-400">Прочность:</span> {(unit as CustomMachine).durability_max}
                  </div>
                </div>

                {/* Weapons */}
                <div>
                  <div className="text-sm font-medium text-slate-300 mb-2">Оружие:</div>
                  <div className="space-y-2">
                    {(unit as CustomMachine).weapons.map((weapon, index) => (
                      <div key={index} className="text-xs bg-slate-800 p-2 rounded">
                        <div className="font-medium">{weapon.name}</div>
                        <div className="flex gap-4 text-slate-400 mt-1">
                          <span>Дальн: {weapon.range}</span>
                          <span>Мощн: {weapon.power}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
