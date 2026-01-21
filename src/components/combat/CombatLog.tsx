'use client';

import { useState, useMemo } from 'react';
import { CombatLogEntry, CombatResult } from '@/lib/combat-types';
import { History, Download, Trash2, ChevronDown, ChevronUp, Target, Sword, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CombatLogProps {
  entries: CombatLogEntry[];
  onClear?: () => void;
  onExport?: () => void;
  className?: string;
}

export function CombatLog({ entries, onClear, onExport, className }: CombatLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.timestamp - a.timestamp);
  }, [entries]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'shot':
        return <Target className="w-4 h-4 text-orange-400" />;
      case 'melee':
        return <Sword className="w-4 h-4 text-red-400" />;
      case 'grenade':
        return <Bomb className="w-4 h-4 text-green-400" />;
      default:
        return null;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'shot':
        return 'Выстрел';
      case 'melee':
        return 'Ближний бой';
      case 'grenade':
        return 'Граната';
      default:
        return actionType;
    }
  };

  const getResultSummary = (result: CombatResult) => {
    if (result.actionType === 'melee' && result.meleeResult) {
      return result.meleeResult.winner === 'attacker' ? 'Победа' :
             result.meleeResult.winner === 'defender' ? 'Контратака' : 'Ничья';
    }
    if (result.hitResult) {
      if (!result.hitResult.success) return 'Промах';
      if (result.damageResult) {
        const dmg = result.damageResult.damage;
        if (dmg === 0) return 'Не пробито';
        return `-${dmg} ${result.unitType === 'machine' ? 'HP' : 'ранений'}`;
      }
    }
    return 'Завершено';
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    // Default export to JSON
    const data = JSON.stringify(sortedEntries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combat-log-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "fixed bottom-36 left-4 z-[60]",
          "md:bottom-auto md:top-20 md:right-4 md:left-auto",
          "bg-slate-800 hover:bg-slate-700",
          "border-2 border-slate-700 rounded-xl",
          "p-3 shadow-lg transition-all",
          "flex items-center gap-2",
          className
        )}
      >
        <History className="w-5 h-5 text-blue-400" />
        <span className="text-sm font-bold text-slate-300">
          История ({entries.length})
        </span>
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-36 left-4 right-4 z-[60]",
      "md:bottom-auto md:top-20 md:right-4 md:left-auto md:w-96",
      "bg-slate-900 border-2 border-slate-700 rounded-xl",
      "shadow-2xl max-h-[60vh] flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
            История боя ({entries.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Экспортировать"
              >
                <Download className="w-4 h-4" />
              </button>
              {onClear && (
                <button
                  onClick={onClear}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-red-400 hover:text-red-300 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Очистить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            История пуста. Начните бой, чтобы увидеть записи.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
              >
                {/* Summary Bar */}
                <button
                  onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors"
                >
                  {getActionIcon(entry.result.actionType)}
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-slate-200">
                      {entry.result.unitName}
                      {entry.result.soldierIndex !== undefined && ` #${entry.result.soldierIndex + 1}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {getActionLabel(entry.result.actionType)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-sm font-bold",
                      entry.result.hitResult?.success
                        ? "text-green-400"
                        : entry.result.actionType === 'melee'
                        ? entry.result.meleeResult?.winner === 'attacker'
                          ? "text-green-400"
                          : "text-red-400"
                        : "text-red-400"
                    )}>
                      {getResultSummary(entry.result)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatTime(entry.timestamp)}
                    </div>
                  </div>
                  {expandedEntry === entry.id ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {/* Expanded Details */}
                {expandedEntry === entry.id && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-700/50">
                    <CombatLogDetail entry={entry} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CombatLogDetailProps {
  entry: CombatLogEntry;
}

function CombatLogDetail({ entry }: CombatLogDetailProps) {
  const { result } = entry;

  return (
    <div className="space-y-2 text-xs">
      {/* Parameters */}
      <div className="bg-slate-900/50 p-2 rounded">
        <div className="text-[10px] opacity-50 uppercase font-bold mb-1">Параметры</div>
        <div className="grid grid-cols-2 gap-2 text-slate-400">
          <div>Дистанция: {result.parameters.distance}</div>
          <div>Броня цели: {result.parameters.targetArmor}</div>
          {result.actionType === 'melee' && (
            <div>ББ цели: {result.parameters.targetMelee}</div>
          )}
          <div>Укрытие: {result.parameters.fortification === 'none' ? 'Нет' : result.parameters.fortification}</div>
        </div>
      </div>

      {/* Hit Result */}
      {result.hitResult && (
        <div className="bg-slate-900/50 p-2 rounded">
          <div className="text-[10px] opacity-50 uppercase font-bold mb-1">Бросок на попадание</div>
          <div className="text-slate-400">
            Бросок: {result.hitResult.roll} → Итого: {result.hitResult.total}
            <span className={cn("ml-2", result.hitResult.success ? "text-green-400" : "text-red-400")}>
              ({result.hitResult.success ? 'Попадание' : 'Промах'})
            </span>
          </div>
        </div>
      )}

      {/* Damage Result */}
      {result.damageResult && (
        <div className="bg-slate-900/50 p-2 rounded">
          <div className="text-[10px] opacity-50 uppercase font-bold mb-1">Броски урона</div>
          <div className="text-slate-400">
            Броски: [{result.damageResult.rolls.join(', ')}]
            <span className={cn("ml-2", result.damageResult.damage > 0 ? "text-orange-400" : "text-slate-500")}>
              → {result.damageResult.damage > 0 ? `-${result.damageResult.damage} ранений` : 'Не пробито'}
            </span>
          </div>
        </div>
      )}

      {/* Melee Result */}
      {result.meleeResult && (
        <div className="bg-slate-900/50 p-2 rounded">
          <div className="text-[10px] opacity-50 uppercase font-bold mb-1">Ближний бой</div>
          <div className="grid grid-cols-2 gap-2 text-slate-400">
            <div>
              Атакующий: {result.meleeResult.attackerRoll} + ББ = {result.meleeResult.attackerTotal}
            </div>
            <div>
              Защитник: {result.meleeResult.defenderRoll} + ББ = {result.meleeResult.defenderTotal}
            </div>
          </div>
          <div className={cn(
            "mt-1 font-bold",
            result.meleeResult.winner === 'attacker' ? "text-green-400" :
            result.meleeResult.winner === 'defender' ? "text-red-400" : "text-slate-400"
          )}>
            {result.meleeResult.winner === 'attacker' ? 'Победа' :
             result.meleeResult.winner === 'defender' ? 'Контратака' : 'Ничья'}
          </div>
        </div>
      )}

      {/* Status */}
      <div className={cn(
        "text-[10px] font-bold flex items-center gap-1",
        entry.applied ? "text-green-400" : "text-orange-400"
      )}>
        {entry.applied ? '✓ Применено' : '○ Не применено'}
      </div>
    </div>
  );
}
