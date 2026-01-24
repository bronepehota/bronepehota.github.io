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
              "p-3 rounded-xl border-2",
              result.damageResult.damage > 0
                ? "bg-orange-900/20 border-orange-500/50"
                : "bg-slate-800 border-slate-600"
            )}>
              <div className="text-[10px] opacity-50 uppercase font-bold mb-2 tracking-widest text-center">
                Броски урона vs Броня {getEffectiveArmor()}
              </div>

              {/* Surprise Attack - Show both roll sets (compact for mobile) */}
              {parameters.isSurpriseAttack && result.damageResult.isSurpriseAttack && (result.damageResult as any).bothRolls ? (
                <div className="space-y-2">
                  {(result.damageResult as any).bothRolls.map((rollSet: number[], setIndex: number) => {
                    const isFirstSet = setIndex === 0;
                    const firstSetDamage = (result.damageResult as any).bothRolls[0].filter((r: number) => r > getEffectiveArmor()).length;
                    const secondSetDamage = (result.damageResult as any).bothRolls[1].filter((r: number) => r > getEffectiveArmor()).length;
                    const thisSetDamage = isFirstSet ? firstSetDamage : secondSetDamage;
                    const isWinner = thisSetDamage > (isFirstSet ? secondSetDamage : firstSetDamage);

                    return (
                      <div
                        key={setIndex}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border",
                          isWinner
                            ? "bg-purple-900/30 border-purple-500"
                            : "bg-slate-800/50 border-slate-600"
                        )}
                      >
                        <span className={cn("text-[9px] uppercase font-bold min-w-[40px]",
                          isWinner ? "text-purple-300" : "text-slate-400"
                        )}>
                          Бросок {setIndex + 1}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {rollSet.map((roll, i) => {
                            const penetrated = roll > getEffectiveArmor();
                            return (
                              <div key={i} className={cn(
                                "w-9 h-9 bg-slate-900 rounded flex items-center justify-center text-sm font-black",
                                penetrated
                                  ? "text-orange-400"
                                  : "text-slate-600"
                              )}>
                                {roll}
                              </div>
                            );
                          })}
                        </div>
                        {isWinner && (
                          <span className="text-[8px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold ml-auto">
                            ВЫБРАН
                          </span>
                        )}
                        <span className={cn(
                          "text-sm font-black",
                          thisSetDamage > 0 ? "text-orange-400" : "text-slate-500"
                        )}>
                          {thisSetDamage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Normal single roll display
                <div className="flex justify-center items-start gap-2 flex-wrap">
                  {result.damageResult.rolls.map((roll, i) => {
                    const effectiveArmor = getEffectiveArmor();
                    const penetrated = roll > effectiveArmor;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "w-12 h-12 bg-slate-800 rounded-lg border-2 flex items-center justify-center text-xl font-black shadow-lg",
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
              )}

              {/* Damage Summary */}
              <div className="mt-3 pt-2 border-t border-slate-700 text-center">
                <div className={cn("text-xl font-black",
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
      {isMelee && result.meleeResult && (() => {
        const meleeResult = result.meleeResult!;
        return (
          <div className="space-y-3">
            {/* Surprise Attack - Show both attacker rolls (compact for mobile) */}
            {parameters.isSurpriseAttack && (meleeResult as any).attackerRolls ? (
              <div className="bg-purple-900/20 p-2 rounded-lg border border-purple-700">
                <div className="flex items-center justify-center gap-3">
                  {(meleeResult as any).attackerRolls.map((roll: number, index: number) => {
                    const isBest = roll === meleeResult.attackerRoll;
                  return (
                    <div key={index} className="flex items-center gap-1">
                      <div className={cn(
                        "w-10 h-10 bg-slate-900 rounded border flex items-center justify-center text-lg font-black",
                        isBest
                          ? "text-purple-400 border-purple-500"
                          : "text-slate-500 border-slate-600"
                      )}>
                        {roll}
                      </div>
                      <span className={cn("text-[8px] font-bold",
                        isBest ? "text-purple-400" : "text-slate-500"
                      )}>
                        {isBest ? '✓' : ''}
                      </span>
                    </div>
                  );
                })}
                <div className="border-l border-slate-600 pl-2">
                  <div className="text-sm font-black text-blue-400">
                    {meleeResult.attackerTotal}
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Вы
                  </div>
                </div>
                <div className="border-l border-slate-600 pl-2">
                  <div className="text-sm font-black text-red-400">
                    {meleeResult.defenderTotal}
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Цель
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Normal melee display
            <div className="grid grid-cols-2 gap-3">
              {/* Attacker */}
              <div className="bg-slate-800 p-3 rounded-xl border-2 border-blue-500/50">
                <div className="text-[10px] opacity-50 uppercase mb-1 text-center">Вы</div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-2xl font-black text-blue-400 border-2 border-blue-500/30">
                    {meleeResult.attackerRoll}
                  </div>
                  <div className="text-lg font-black text-blue-400">
                    {meleeResult.attackerTotal}
                  </div>
                </div>
              </div>

              {/* Defender */}
              <div className="bg-slate-800 p-3 rounded-xl border-2 border-red-500/50">
                <div className="text-[10px] opacity-50 uppercase mb-1 text-center">Цель</div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-2xl font-black text-red-400 border-2 border-red-500/30">
                    {meleeResult.defenderRoll}
                  </div>
                  <div className="text-lg font-black text-red-400">
                    {meleeResult.defenderTotal}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Melee Result */}
          <div className={cn(
            "p-3 rounded-xl border-2 flex items-center justify-center",
            meleeResult.winner === 'attacker'
              ? "bg-green-900/20 border-green-500/50"
              : meleeResult.winner === 'defender'
              ? "bg-red-900/20 border-red-500/50"
              : "bg-slate-800 border-slate-700"
          )}>
            <div className={cn("text-xl font-black",
              meleeResult.winner === 'attacker'
                ? "text-green-400"
                : meleeResult.winner === 'defender'
                ? "text-red-400"
                : "text-slate-400"
            )}>
              {meleeResult.winner === 'attacker'
                ? 'ПОБЕДА'
                : meleeResult.winner === 'defender'
                ? 'КОНТРАТАКА'
                : 'НИЧЬЯ'}
            </div>
          </div>
        </div>
        );
      })()}

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
