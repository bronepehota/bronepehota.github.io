/**
 * ApplyBuffModal - modal for applying temporary buffs during battle.
 * Shows units and available temporary buffs (those with duration).
 */

'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSquad } from '@/lib/types';
import type { BuffDefinition, ActiveBuff } from '@/lib/modifier-types';
import type { Army } from '@/lib/types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';

interface ApplyBuffModalProps {
  isOpen: boolean;
  onClose: () => void;
  army: Army;
  availableBuffs: BuffDefinition[];  // Only temporary buffs (with duration)
  onApplyBuff: (unitInstanceId: string, buff: ActiveBuff) => void;
  currentTurn: number;
}

export function ApplyBuffModal({
  isOpen,
  onClose,
  army,
  availableBuffs,
  onApplyBuff,
  currentTurn,
}: ApplyBuffModalProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedBuffId, setSelectedBuffId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter alive units
  const aliveUnits = army.units.filter(unit => {
    if (isSquad(unit)) {
      const soldierCount = unit.data.soldiers.length;
      const deadCount = unit.deadSoldiers?.length || 0;
      return deadCount < soldierCount;
    }
    return (unit.currentDurability || 0) > 0;
  });

  const selectedBuff = availableBuffs.find(b => b.id === selectedBuffId);

  const handleApply = () => {
    if (!selectedUnitId || !selectedBuff) return;

    const activeBuff: ActiveBuff = {
      id: `${selectedBuff.id}_${Date.now()}`,
      name: selectedBuff.name,
      description: selectedBuff.description,
      applyTo: selectedBuff.applyTo,
      target: selectedBuff.target,
      value: selectedBuff.value,
      phase: selectedBuff.phase,
      icon: selectedBuff.icon,
      appliedAtTurn: currentTurn,
      duration: selectedBuff.duration!,  // Required for temporary buffs
      expiresAtTurn: currentTurn + selectedBuff.duration!,
    };

    onApplyBuff(selectedUnitId, activeBuff);

    // Reset selection
    setSelectedUnitId(null);
    setSelectedBuffId(null);
  };

  const canApply = selectedUnitId && selectedBuff;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Применить баф</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Unit Selection */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              ЮНИТ
            </h3>
            <div className="space-y-1">
              {aliveUnits.map(unit => (
                <button
                  key={unit.instanceId}
                  onClick={() => setSelectedUnitId(unit.instanceId)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                    selectedUnitId === unit.instanceId
                      ? "bg-amber-900/30 border border-amber-600/50"
                      : "bg-slate-800 hover:bg-slate-700 border border-transparent"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-200 truncate">
                      {unit.data.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {unit.type === 'squad' ? 'Отряд' : 'Машина'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Buff Selection */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              БАФ
            </h3>
            <div className="space-y-1">
              {availableBuffs.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Нет доступных временных бафов. Создайте их в редакторе.
                </div>
              ) : (
                availableBuffs.map(buff => (
                  <button
                    key={buff.id}
                    onClick={() => setSelectedBuffId(buff.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                      selectedBuffId === buff.id
                        ? "bg-amber-900/30 border border-amber-600/50"
                        : "bg-slate-800 hover:bg-slate-700 border border-transparent"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <ModifierIcon name={buff.icon} size={16} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-200 truncate">
                        {buff.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {buff.description}
                      </div>
                      <div className="text-[10px] text-amber-400 mt-0.5">
                        {buff.duration} {buff.duration === 1 ? 'ход' : 'ходов'}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
          >
            Отмена
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
