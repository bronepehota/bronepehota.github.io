'use client';

import { useState } from 'react';
import { CombatResult, CombatParameters } from '@/lib/combat-types';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface CombatResultsProps {
  result: CombatResult;
  parameters: CombatParameters;
  rulesVersion: RulesVersionID;
  onApply: (markAsDone?: boolean) => void;
  onGoBack: () => void;
  unitType?: 'squad' | 'machine';
}

export function CombatResults({
  result,
  parameters,
  rulesVersion,
  onApply,
  onGoBack,
  unitType,
}: CombatResultsProps) {
  const isShot = result.actionType === 'shot';
  const isGrenade = result.actionType === 'grenade';
  const isMelee = result.actionType === 'melee';
  const [markAsDone, setMarkAsDone] = useState(false);

  // Only show mark as done option for squads
  const showMarkAsDone = unitType === 'squad';

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
      <span className="text-amber-400 text-sm font-mono">
        +{bonus} <span className="text-[9px] opacity-60">(FORT)</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Tech Header - After Action Report */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px flex-1 bg-emerald-600/30" />
          <div className="w-1 h-1 bg-emerald-500 rotate-45" />
          <div className="h-px flex-1 bg-emerald-600/30" />
        </div>
        <div className="text-center">
          <div className="text-xs font-mono font-bold text-emerald-400 tracking-[0.2em] uppercase">
            After Action Report
          </div>
          <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
            MISSION RESULTS // {result.actionType.toUpperCase()}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-px flex-1 bg-emerald-600/30" />
          <div className="w-1 h-1 bg-emerald-500 rotate-45" />
          <div className="h-px flex-1 bg-emerald-600/30" />
        </div>
      </div>

      {/* Shot/Grenade Results */}
      {(isShot || isGrenade) && result.hitResult && (
        <>
          {/* Hit Comparison - Tactical Displays */}
          <div className="grid grid-cols-2 gap-3">
            {/* Your Roll */}
            <div className={cn(
              "relative bg-slate-900/60 p-3 rounded-sm border-2 backdrop-blur-sm transition-all",
              result.hitResult.success
                ? "border-emerald-600/40 shadow-emerald-900/20"
                : "border-red-600/40 shadow-red-900/20"
            )}>
              {/* Tech frame corners */}
              <div className={cn(
                "absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2",
                result.hitResult.success ? "border-emerald-500" : "border-red-500"
              )} />
              <div className={cn(
                "absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2",
                result.hitResult.success ? "border-emerald-500" : "border-red-500"
              )} />
              <div className={cn(
                "absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2",
                result.hitResult.success ? "border-emerald-500" : "border-red-500"
              )} />
              <div className={cn(
                "absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2",
                result.hitResult.success ? "border-emerald-500" : "border-red-500"
              )} />

              <div className="text-[8px] font-mono opacity-40 uppercase mb-2 text-center tracking-[0.15em]">YOUR ROLL</div>
              <div className="flex flex-col items-center">
                {/* Show individual dice if available */}
                {result.hitResult?.rolls && result.hitResult.rolls.length > 1 ? (
                  <div className="flex items-center gap-1.5 mb-2">
                    {result.hitResult.rolls.map((roll, i) => {
                      const rolls = result.hitResult?.rolls ?? [];
                      const maxRoll = Math.max(...rolls);
                      const isMax = roll === maxRoll;
                      return (
                        <div key={i} className={cn(
                          "relative w-10 h-10 md:w-12 md:h-12 bg-slate-950/80 rounded-sm flex items-center justify-center text-lg md:text-xl font-mono font-black border-2",
                          isMax
                            ? "text-blue-400 border-blue-500/50 ring-2 ring-blue-400/30"
                            : "text-slate-500 border-slate-700"
                        )}>
                          {roll}
                        </div>
                      );
                    })}
                    {/* Show bonus if exists */}
                    {result.hitResult.bonus && result.hitResult.bonus > 0 && (
                      <div className="relative w-8 h-8 md:w-10 md:h-10 bg-emerald-950/60 rounded-sm flex items-center justify-center text-sm md:text-base font-mono font-black border border-emerald-500/30 text-emerald-400">
                        +{result.hitResult.bonus}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "relative w-14 h-14 bg-slate-950/80 rounded-sm flex items-center justify-center text-3xl font-mono font-black border-2 mb-1",
                    result.hitResult.success
                      ? "text-emerald-400 border-emerald-500/30"
                      : "text-red-400 border-red-500/30"
                  )}>
                    {result.hitResult.total}
                    {/* Tech decorations */}
                    <div className={cn(
                      "absolute top-1 left-1 w-1 h-1",
                      result.hitResult.success ? "bg-emerald-500/40" : "bg-red-500/40"
                    )} />
                    <div className={cn(
                      "absolute bottom-1 right-1 w-1 h-1",
                      result.hitResult.success ? "bg-emerald-500/40" : "bg-red-500/40"
                    )} />
                  </div>
                )}
                <div className={cn("text-lg md:text-xl font-mono font-black", result.hitResult.success ? "text-emerald-400" : "text-red-400")}>
                  = {result.hitResult.total}
                </div>
              </div>
            </div>

            {/* Target Value */}
            <div className="relative bg-slate-900/60 p-3 rounded-sm border-2 border-amber-600/40 backdrop-blur-sm shadow-amber-900/20">
              {/* Tech frame corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-amber-500" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-amber-500" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-amber-500" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-amber-500" />

              <div className="text-[8px] font-mono opacity-40 uppercase mb-2 text-center tracking-[0.15em]">
                {isGrenade ? 'TARGET RANGE' : 'DISTANCE'}
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-950/80 rounded-sm flex items-center justify-center text-3xl font-mono font-black text-amber-400 border-2 border-amber-500/30 mb-1">
                  {isGrenade ? parameters.distance : getEffectiveDistance()}
                </div>
                <div className="text-sm font-mono font-black text-amber-400">
                  {parameters.distance}
                  {getFortificationBonusDisplay()}
                </div>
              </div>
            </div>
          </div>

          {/* Hit Result - Status Display */}
          <div className={cn(
            "relative p-4 rounded-sm border-2 flex items-center justify-center gap-3",
            result.hitResult.success
              ? "bg-emerald-950/30 border-emerald-600/40 shadow-emerald-900/30"
              : "bg-red-950/30 border-red-600/40 shadow-red-900/30"
          )}>
            {/* Tech frame */}
            <div className={cn(
              "absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2",
              result.hitResult.success ? "border-emerald-500" : "border-red-500"
            )} />
            <div className={cn(
              "absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2",
              result.hitResult.success ? "border-emerald-500" : "border-red-500"
            )} />
            <div className={cn(
              "absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2",
              result.hitResult.success ? "border-emerald-500" : "border-red-500"
            )} />
            <div className={cn(
              "absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2",
              result.hitResult.success ? "border-emerald-500" : "border-red-500"
            )} />

            <div className="text-[8px] font-mono opacity-40 uppercase font-bold tracking-[0.2em]">STATUS</div>
            <div className={cn("text-xl md:text-2xl font-mono font-black tracking-wider",
              result.hitResult.success ? "text-emerald-400" : "text-red-400"
            )}>
              {isGrenade ? 'ВЗРЫВ!' : (result.hitResult.success ? 'ПОПАДАНИЕ' : 'ПРОМАХ')}
            </div>
          </div>

          {/* Damage Rolls (if hit succeeded) */}
          {(result.hitResult.success || isGrenade) && result.damageResult && (
            <div className={cn(
              "relative p-3 rounded-sm border-2",
              result.damageResult.damage > 0
                ? "bg-amber-950/20 border-amber-600/40 shadow-amber-900/20"
                : "bg-slate-900/60 border-slate-700"
            )}>
              {/* Tech frame corners */}
              <div className={cn(
                "absolute top-0 left-0 w-2 h-2 border-l border-t",
                result.damageResult.damage > 0 ? "border-amber-500" : "border-slate-600"
              )} />
              <div className={cn(
                "absolute top-0 right-0 w-2 h-2 border-r border-t",
                result.damageResult.damage > 0 ? "border-amber-500" : "border-slate-600"
              )} />
              <div className={cn(
                "absolute bottom-0 left-0 w-2 h-2 border-l border-b",
                result.damageResult.damage > 0 ? "border-amber-500" : "border-slate-600"
              )} />
              <div className={cn(
                "absolute bottom-0 right-0 w-2 h-2 border-r border-b",
                result.damageResult.damage > 0 ? "border-amber-500" : "border-slate-600"
              )} />

              <div className="text-[8px] font-mono opacity-40 uppercase font-bold mb-3 tracking-[0.15em] text-center">
                DAMAGE ROLLS vs ARMOR [{getEffectiveArmor()}]
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
                  {result.damageResult?.rolls.map((roll, i) => {
                    const effectiveArmor = getEffectiveArmor();
                    const penetrated = roll > effectiveArmor;
                    // For infantry (not machine), highlight the max roll
                    const isInfantry = result.unitType === 'squad';
                    const rolls = result.damageResult?.rolls ?? [];
                    const maxRoll = isInfantry ? Math.max(...rolls) : roll;
                    const isMax = isInfantry && roll === maxRoll;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "relative w-12 h-12 bg-slate-950/80 rounded-sm border-2 flex items-center justify-center text-xl font-mono font-black shadow-lg",
                          penetrated
                            ? "text-amber-400 border-amber-500"
                            : "text-slate-600 border-slate-700",
                          isMax && penetrated && "ring-2 ring-blue-400/50"
                        )}>
                          {roll}
                          {/* Tech decoration */}
                          <div className={cn(
                            "absolute top-0.5 right-0.5 w-1 h-1",
                            penetrated ? "bg-amber-500/40" : "bg-slate-600/30"
                          )} />
                          {/* Max indicator for infantry */}
                          {isMax && penetrated && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-blue-300 flex items-center justify-center">
                              <span className="text-[8px] font-black text-white">★</span>
                            </div>
                          )}
                        </div>
                        <div className={cn("text-[9px] font-mono font-bold",
                          penetrated ? "text-amber-400" : "text-slate-600"
                        )}>
                          {penetrated ? '>' : '≤'}{effectiveArmor}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Damage Summary */}
              <div className="mt-3 pt-3 border-t border-slate-800 text-center">
                <div className={cn("text-xl md:text-2xl font-mono font-black tracking-wider",
                  result.damageResult.damage > 0
                    ? "text-amber-400"
                    : "text-slate-500"
                )}>
                  {result.damageResult.damage > 0
                    ? `-${result.damageResult.damage} ${result.unitType === 'machine' ? 'HP' : 'WOUNDS'}`
                    : 'NO PENETRATION'}
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

      {/* Melee Results - Combat Display */}
      {isMelee && result.meleeResult && (() => {
        const meleeResult = result.meleeResult!;
        return (
          <div className="space-y-3">
            {/* Tech header for melee */}
            <div className="text-center">
              <div className="text-[8px] font-mono text-cyan-400/60 uppercase tracking-[0.2em]">
                CLOSE COMBAT ENGAGEMENT
              </div>
            </div>
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
            // Normal melee display - Tactical
            <div className="grid grid-cols-2 gap-3">
              {/* Attacker */}
              <div className="relative bg-slate-900/60 p-3 rounded-sm border-2 border-cyan-600/40 shadow-cyan-900/20">
                {/* Tech frame */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-500" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-500" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-cyan-500" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-cyan-500" />

                <div className="text-[8px] font-mono opacity-40 uppercase mb-2 text-center tracking-[0.15em]">ATTACKER</div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-950/80 rounded-sm flex items-center justify-center text-2xl font-mono font-black text-cyan-400 border-2 border-cyan-500/30">
                    {meleeResult.attackerRoll}
                  </div>
                  <div className="text-base font-mono font-black text-cyan-400">
                    {meleeResult.attackerTotal}
                  </div>
                </div>
              </div>

              {/* Defender */}
              <div className="relative bg-slate-900/60 p-3 rounded-sm border-2 border-red-600/40 shadow-red-900/20">
                {/* Tech frame */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-red-500" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-red-500" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-red-500" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-red-500" />

                <div className="text-[8px] font-mono opacity-40 uppercase mb-2 text-center tracking-[0.15em]">DEFENDER</div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-950/80 rounded-sm flex items-center justify-center text-2xl font-mono font-black text-red-400 border-2 border-red-500/30">
                    {meleeResult.defenderRoll}
                  </div>
                  <div className="text-base font-mono font-black text-red-400">
                    {meleeResult.defenderTotal}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Melee Result - Status Display */}
          <div className={cn(
            "relative p-4 rounded-sm border-2 flex items-center justify-center",
            meleeResult.winner === 'attacker'
              ? "bg-emerald-950/30 border-emerald-600/40 shadow-emerald-900/20"
              : meleeResult.winner === 'defender'
              ? "bg-red-950/30 border-red-600/40 shadow-red-900/20"
              : "bg-slate-900/60 border-slate-700"
          )}>
            {/* Tech frame */}
            <div className={cn(
              "absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2",
              meleeResult.winner === 'attacker'
                ? "border-emerald-500"
                : meleeResult.winner === 'defender'
                ? "border-red-500"
                : "border-slate-600"
            )} />
            <div className={cn(
              "absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2",
              meleeResult.winner === 'attacker'
                ? "border-emerald-500"
                : meleeResult.winner === 'defender'
                ? "border-red-500"
                : "border-slate-600"
            )} />
            <div className={cn(
              "absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2",
              meleeResult.winner === 'attacker'
                ? "border-emerald-500"
                : meleeResult.winner === 'defender'
                ? "border-red-500"
                : "border-slate-600"
            )} />
            <div className={cn(
              "absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2",
              meleeResult.winner === 'attacker'
                ? "border-emerald-500"
                : meleeResult.winner === 'defender'
                ? "border-red-500"
                : "border-slate-600"
            )} />

            <div className={cn("text-xl md:text-2xl font-mono font-black tracking-wider",
              meleeResult.winner === 'attacker'
                ? "text-emerald-400"
                : meleeResult.winner === 'defender'
                ? "text-red-400"
                : "text-slate-400"
            )}>
              {meleeResult.winner === 'attacker'
                ? 'VICTORY'
                : meleeResult.winner === 'defender'
                ? 'COUNTERATTACK'
                : 'DRAW'}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Action Buttons - Tactical Controls */}
      <div className="flex gap-2 pt-4">
        {/* Mark as done toggle - only for squads, compact on mobile */}
        {showMarkAsDone && (
          <button
            onClick={() => setMarkAsDone(!markAsDone)}
            className={cn(
              "shrink-0 px-3 md:px-4 py-2 md:py-3 rounded-sm font-mono text-xs md:text-sm font-bold uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-1.5 min-w-[100px] md:min-w-[120px]",
              markAsDone
                ? "bg-emerald-950/40 border-emerald-600/50 text-emerald-400"
                : "bg-slate-800/60 border-slate-700 text-slate-500 hover:bg-slate-700/60 hover:text-slate-400"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden md:inline">{markAsDone ? 'ГОТОВ' : 'ГОТОВ?'}</span>
            <span className="md:hidden">{markAsDone ? '✓' : '?'}</span>
          </button>
        )}

        {/* Accept button - flex to fill remaining space */}
        <button
          onClick={() => onApply(showMarkAsDone ? true : undefined)}
          className={cn(
            "flex-1 py-2 md:py-3 rounded-sm font-mono text-sm md:text-sm font-bold uppercase tracking-wider border-2 transition-all min-h-[48px] md:min-h-[52px]",
            (isShot || isGrenade) && result.hitResult?.success
              ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-900/30"
              : isMelee && result.meleeResult?.winner === 'attacker'
              ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-900/30"
              : "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/30"
          )}
        >
          ПРИНЯТЬ
        </button>
      </div>
    </div>
  );
}
