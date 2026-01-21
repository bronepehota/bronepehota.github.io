'use client';

import { CombatResult, CombatParameters } from '@/lib/combat-types';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CombatResultsProps {
  result: CombatResult;
  parameters: CombatParameters;
  rulesVersion: RulesVersionID;
  onApply: () => void;
  onGoBack: () => void;
}

export function CombatResults({
  result,
  parameters,
  rulesVersion,
  onApply,
  onGoBack,
}: CombatResultsProps) {
  const isShot = result.actionType === 'shot';
  const isGrenade = result.actionType === 'grenade';
  const isMelee = result.actionType === 'melee';

  // Calculate effective distance/armor for display
  const getEffectiveDistance = () => {
    if (rulesVersion === 'fan' && parameters.fortification !== 'none') {
      const bonus = parameters.fortification === 'light' ? 1 : 2;
      return parameters.distance + bonus;
    }
    return parameters.distance;
  };

  const getEffectiveArmor = () => {
    if (rulesVersion === 'tehnolog' && parameters.fortification !== 'none') {
      const bonus = parameters.fortification === 'light' ? 1 : 2;
      return parameters.targetArmor + bonus;
    }
    return parameters.targetArmor;
  };

  const getFortificationBonusDisplay = () => {
    if (parameters.fortification === 'none') return null;
    const bonus = parameters.fortification === 'light' ? 1 : 2;
    return (
      <span className="text-orange-400 text-sm">
        +{bonus} (укрытие)
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Shot/Grenade Results */}
      {(isShot || isGrenade) && result.hitResult && (
        <>
          {/* Hit Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Your Roll */}
            <div className={cn(
              "bg-slate-800 p-4 rounded-xl border-2 transition-all",
              result.hitResult.success ? "border-green-500/50" : "border-red-500/50"
            )}>
              <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Ваш бросок</div>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black border-2 mb-1",
                  result.hitResult.success
                    ? "text-blue-400 border-blue-500/30"
                    : "text-red-400 border-red-500/30"
                )}>
                  {result.hitResult.total}
                </div>
                <div className="text-sm font-black text-blue-400">
                  {result.hitResult.roll}
                </div>
              </div>
            </div>

            {/* Target Value */}
            <div className="bg-slate-800 p-4 rounded-xl border-2 border-orange-500/50">
              <div className="text-[10px] opacity-50 uppercase mb-2 text-center">
                {isGrenade ? 'Цель (шагов)' : 'Дистанция цели'}
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black text-orange-400 border-2 border-orange-500/30 mb-1">
                  {isGrenade ? parameters.distance : getEffectiveDistance()}
                </div>
                <div className="text-sm font-black text-orange-400">
                  {parameters.distance}
                  {getFortificationBonusDisplay()}
                </div>
              </div>
            </div>
          </div>

          {/* Hit Result */}
          <div className={cn(
            "p-4 rounded-xl border-2 flex items-center justify-center gap-3",
            result.hitResult.success
              ? "bg-green-900/20 border-green-500/50"
              : "bg-red-900/20 border-red-500/50"
          )}>
            <div className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Результат</div>
            <div className={cn("text-2xl font-black",
              result.hitResult.success ? "text-green-400" : "text-red-400"
            )}>
              {isGrenade ? 'ВЗРЫВ!' : (result.hitResult.success ? 'ПОПАДАНИЕ' : 'ПРОМАХ')}
            </div>
          </div>

          {/* Damage Rolls (if hit succeeded) */}
          {(result.hitResult.success || isGrenade) && result.damageResult && (
            <div className={cn(
              "p-4 rounded-xl border-2",
              result.damageResult.damage > 0
                ? "bg-orange-900/20 border-orange-500/50"
                : "bg-slate-800 border-slate-600"
            )}>
              <div className="text-[10px] opacity-50 uppercase font-bold mb-3 tracking-widest text-center">
                Броски урона vs Броня
              </div>
              <div className="flex justify-center items-start gap-3 flex-wrap">
                {result.damageResult.rolls.map((roll, i) => {
                  const effectiveArmor = getEffectiveArmor();
                  const penetrated = roll > effectiveArmor;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={cn(
                        "w-14 h-14 bg-slate-800 rounded-lg border-2 flex items-center justify-center text-xl font-black shadow-lg",
                        penetrated
                          ? "text-orange-400 border-orange-400"
                          : "text-slate-500 border-slate-600"
                      )}>
                        {roll}
                      </div>
                      <div className={cn("text-[10px] font-bold",
                        penetrated ? "text-orange-400" : "text-slate-600"
                      )}>
                        {penetrated ? '>' : '≤'}{effectiveArmor}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Damage Summary */}
              <div className="mt-4 pt-3 border-t border-slate-700 text-center">
                <div className="text-[10px] opacity-40 mb-1">
                  Броня цели: {parameters.targetArmor}
                  {getFortificationBonusDisplay()}
                </div>
                <div className={cn("text-2xl font-black",
                  result.damageResult.damage > 0
                    ? "text-orange-400"
                    : "text-slate-400"
                )}>
                  {result.damageResult.damage > 0
                    ? `-${result.damageResult.damage} ${result.unitType === 'machine' ? 'HP' : 'РАНЕНИЙ'}`
                    : 'НЕ ПРОБИТО'}
                </div>
              </div>

              {/* Special effects */}
              {result.damageResult.special && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-purple-400 font-medium text-center">
                    {result.damageResult.special.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Melee Results */}
      {isMelee && result.meleeResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Attacker */}
            <div className="bg-slate-800 p-4 rounded-xl border-2 border-blue-500/50">
              <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Вы</div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black text-blue-400 border-2 border-blue-500/30 mb-1">
                  {result.meleeResult.attackerRoll}
                </div>
                <div className="text-xl font-black text-blue-400">
                  {result.meleeResult.attackerTotal}
                </div>
                <div className="text-[10px] opacity-30 mt-1">
                  D6 + ББ
                </div>
              </div>
            </div>

            {/* Defender */}
            <div className="bg-slate-800 p-4 rounded-xl border-2 border-red-500/50">
              <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Цель</div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black text-red-400 border-2 border-red-500/30 mb-1">
                  {result.meleeResult.defenderRoll}
                </div>
                <div className="text-xl font-black text-red-400">
                  {result.meleeResult.defenderTotal}
                </div>
                <div className="text-[10px] opacity-30 mt-1">
                  D6 + ББ({parameters.targetMelee})
                </div>
              </div>
            </div>
          </div>

          {/* Melee Result */}
          <div className={cn(
            "p-6 rounded-2xl border-2 flex flex-col items-center",
            result.meleeResult.winner === 'attacker'
              ? "bg-green-900/20 border-green-500/50"
              : result.meleeResult.winner === 'defender'
              ? "bg-red-900/20 border-red-500/50"
              : "bg-slate-800 border-slate-700"
          )}>
            <div className="text-xs opacity-50 uppercase font-bold mb-1 tracking-widest">Итог</div>
            <div className={cn("text-3xl font-black",
              result.meleeResult.winner === 'attacker'
                ? "text-green-400"
                : result.meleeResult.winner === 'defender'
                ? "text-red-400"
                : "text-slate-400"
            )}>
              {result.meleeResult.winner === 'attacker'
                ? 'ПОБЕДА'
                : result.meleeResult.winner === 'defender'
                ? 'КОНТРАТАКА'
                : 'НИЧЬЯ'}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onGoBack}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-sm transition-all min-h-[48px]"
        >
          Назад
        </button>
        <button
          onClick={onApply}
          className={cn(
            "flex-1 py-3 rounded-xl font-bold text-sm transition-all min-h-[48px]",
            (isShot || isGrenade) && result.hitResult?.success
              ? "bg-green-600 hover:bg-green-500"
              : isMelee && result.meleeResult?.winner === 'attacker'
              ? "bg-green-600 hover:bg-green-500"
              : "bg-blue-600 hover:bg-blue-500"
          )}
        >
          Принять
        </button>
      </div>
    </div>
  );
}
