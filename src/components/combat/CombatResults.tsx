'use client';

import { useState, useEffect } from 'react';
import { CombatResult, CombatParameters } from '@/lib/combat-types';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Skull, Shield } from 'lucide-react';

interface CombatResultsProps {
  result: CombatResult;
  parameters: CombatParameters;
  rulesVersion: RulesVersionID;
  onApply: (markAsDone?: boolean) => void;
  onGoBack: () => void;
  unitType?: 'squad' | 'machine';
  onGrenadeCheckTarget?: (armor: number) => void;
  rememberMarkAsDone?: boolean;
  setRememberMarkAsDone?: (value: boolean) => void;
}

export function CombatResults({
  result,
  parameters,
  rulesVersion,
  onApply,
  onGoBack: _onGoBack,
  unitType,
  onGrenadeCheckTarget,
  rememberMarkAsDone = false,
  setRememberMarkAsDone,
}: CombatResultsProps) {
  const isShot = result.actionType === 'shot';
  const isGrenade = result.actionType === 'grenade';
  const isMelee = result.actionType === 'melee';
  const [markAsDone, setMarkAsDone] = useState(rememberMarkAsDone);
  const [grenadeTargetArmor, setGrenadeTargetArmor] = useState(2);

  // Update local state when rememberMarkAsDone prop changes
  useEffect(() => {
    setMarkAsDone(rememberMarkAsDone);
  }, [rememberMarkAsDone]);

  const showMarkAsDone = unitType === 'squad';

  const getEffectiveDistance = () => {
    if (rulesVersion === 'community_star_system' && parameters.fortification !== 'none') {
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
        +{bonus} <span className="text-[9px] opacity-60">(укрытие)</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Attack modifiers display */}
      {isShot && (parameters.isSurpriseAttack || parameters.isAimedShot) && (
        <div className="flex justify-center gap-2">
          {parameters.isAimedShot && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-cyan-950/30 border border-cyan-700/50 rounded-lg text-cyan-400 text-xs font-mono uppercase">
              <span>Прицельный</span>
              <span className="text-cyan-500">x2 дальность</span>
            </div>
          )}
          {parameters.isSurpriseAttack && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-950/30 border border-purple-700/50 rounded-lg text-purple-400 text-xs font-mono uppercase">
              <span>С тыла</span>
              <span className="text-purple-500">x2 урон</span>
            </div>
          )}
        </div>
      )}

      {/* Shot Results */}
      {isShot && result.hitResult && (
        <>
          {/* Hit Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Your Roll */}
            <div className={cn(
              "relative bg-slate-900/80 p-4 rounded-lg border-2",
              result.hitResult.success
                ? "border-emerald-600/50"
                : "border-red-600/50"
            )}>
              <div className={cn(
                "text-xs font-mono opacity-60 mb-3 text-center",
                result.hitResult.success ? "text-emerald-400" : "text-red-400"
              )}>
                Ваш бросок
              </div>
              <div className="flex flex-col items-center">
                {result.hitResult?.rolls && result.hitResult.rolls.length > 1 ? (
                  <div className="flex items-center gap-2 mb-2">
                    {result.hitResult.rolls.map((roll, i) => {
                      const rolls = result.hitResult?.rolls ?? [];
                      const maxRoll = Math.max(...rolls);
                      const isMax = roll === maxRoll;
                      return (
                        <div key={i} className={cn(
                          "relative w-12 h-12 bg-slate-950/80 rounded-lg flex items-center justify-center text-lg font-mono font-black border-2",
                          isMax
                            ? "text-blue-400 border-blue-500/50"
                            : "text-slate-500 border-slate-700"
                        )}>
                          {roll}
                          {isMax && maxRoll >= 20 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border border-amber-300 flex items-center justify-center">
                              <span className="text-[8px] font-black text-white">★</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {result.hitResult.bonus && result.hitResult.bonus > 0 && (
                      <div className="relative w-10 h-10 bg-emerald-950/60 rounded-lg flex items-center justify-center text-base font-mono font-black border border-emerald-500/30 text-emerald-400">
                        +{result.hitResult.bonus}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single dice - show roll + bonus + total */
                  <div className="flex flex-col items-center gap-2">
                    {/* The dice roll value */}
                    <div className={cn(
                      "relative w-16 h-16 bg-slate-950/80 rounded-lg flex items-center justify-center text-3xl font-mono font-black border-2",
                      result.hitResult.success
                        ? "text-emerald-400 border-emerald-500/30"
                        : "text-red-400 border-red-500/30"
                    )}>
                      {result.hitResult.roll}
                    </div>

                    {/* Show roll + bonus + total if bonus exists */}
                    {result.hitResult.bonus && result.hitResult.bonus > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xl font-mono font-bold",
                          result.hitResult.success ? "text-emerald-400" : "text-red-400"
                        )}>
                          {result.hitResult.roll}
                        </span>
                        <span className="text-emerald-400 text-lg font-mono font-bold">
                          +{result.hitResult.bonus}
                        </span>
                        <span className="text-slate-500">=</span>
                        <span className={cn(
                          "text-xl font-mono font-black",
                          result.hitResult.success ? "text-emerald-400" : "text-red-400"
                        )}>
                          {result.hitResult.total}
                        </span>
                      </div>
                    ) : (
                      /* No bonus - just show total */
                      <div className={cn("text-xl font-mono font-black", result.hitResult.success ? "text-emerald-400" : "text-red-400")}>
                        {result.hitResult.total}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Target Value */}
            <div className="relative bg-slate-900/80 p-4 rounded-lg border-2 border-amber-600/50">
              <div className="text-xs font-mono opacity-60 text-amber-400 mb-3 text-center">
                Дистанция
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-950/80 rounded-lg flex items-center justify-center text-3xl font-mono font-black text-amber-400 border-2 border-amber-500/30 mb-2">
                  {getEffectiveDistance()}
                </div>
                <div className="text-base font-mono font-black text-amber-400">
                  {parameters.distance}
                  {getFortificationBonusDisplay()}
                </div>
              </div>
            </div>
          </div>

          {/* Hit Result */}
          <div className={cn(
            "relative p-4 rounded-lg border-2 flex items-center justify-center",
            result.hitResult.success
              ? "bg-emerald-950/30 border-emerald-600/50"
              : "bg-red-950/30 border-red-600/50"
          )}>
            <div className={cn("text-2xl font-mono font-black tracking-wider",
              result.hitResult.success ? "text-emerald-400" : "text-red-400"
            )}>
              {isGrenade ? 'ВЗРЫВ!' : (result.hitResult.success ? 'ПОПАДАНИЕ' : 'ПРОМАХ')}
            </div>
          </div>

          {/* Damage Rolls */}
          {(result.hitResult.success || isGrenade) && result.damageResult && (
            <div className={cn(
              "relative p-4 rounded-lg border-2",
              result.damageResult.damage > 0
                ? "bg-amber-950/20 border-amber-600/50"
                : "bg-slate-900/60 border-slate-700"
            )}>
              <div className="text-xs font-mono opacity-60 font-bold mb-3 text-center">
                Урон vs Броня [{getEffectiveArmor()}]
              </div>

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
                          "flex items-center gap-2 p-3 rounded-lg border",
                          isWinner
                            ? "bg-purple-900/30 border-purple-500"
                            : "bg-slate-800/50 border-slate-600"
                        )}
                      >
                        <span className={cn("text-xs font-bold min-w-[50px]",
                          isWinner ? "text-purple-300" : "text-slate-400"
                        )}>
                          Бросок {setIndex + 1}
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {rollSet.map((roll, i) => {
                            const penetrated = roll > getEffectiveArmor();
                            return (
                              <div key={i} className={cn(
                                "w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-sm font-black",
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
                          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded font-bold ml-auto">
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
                <div className="flex justify-center items-start gap-2 flex-wrap">
                  {result.damageResult?.rolls.map((roll, i) => {
                    const effectiveArmor = getEffectiveArmor();
                    const penetrated = roll > effectiveArmor;
                    const isInfantry = result.unitType === 'squad';
                    const rolls = result.damageResult?.rolls ?? [];
                    const maxRoll = isInfantry ? Math.max(...rolls) : roll;
                    const isMax = isInfantry && roll === maxRoll;
                    const isCritical = roll >= 20 || roll >= 12;

                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "relative w-12 h-12 bg-slate-950/80 rounded-lg border-2 flex items-center justify-center text-xl font-mono font-black",
                          penetrated
                            ? "text-amber-400 border-amber-500"
                            : "text-slate-600 border-slate-700",
                          isMax && penetrated && "ring-2 ring-blue-400/50 ring-offset-1 ring-offset-slate-900",
                          isCritical && penetrated && "animate-pulse"
                        )}>
                          {roll}
                          {isMax && penetrated && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border border-blue-300 flex items-center justify-center animate-pulse">
                              <span className="text-[8px] font-black text-white">★</span>
                            </div>
                          )}
                          {isCritical && penetrated && (
                            <div className="absolute -top-1 -left-1 w-4 h-4 bg-amber-500 rounded-full border border-amber-300 flex items-center justify-center animate-pulse">
                              <span className="text-[8px] font-black text-white">!</span>
                            </div>
                          )}
                        </div>
                        <div className={cn("text-xs font-mono font-bold",
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
              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                <div className={cn("text-2xl font-mono font-black tracking-wider",
                  result.damageResult.damage > 0
                    ? "text-amber-400"
                    : "text-slate-500"
                )}>
                  {result.damageResult.damage > 0
                    ? `-${result.damageResult.damage} ${result.unitType === 'machine' ? 'HP' : 'урона'}`
                    : 'Не пробито'}
                </div>
              </div>

              {result.damageResult.special && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="text-xs text-purple-400 font-medium text-center">
                    {result.damageResult.special.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Grenade Results */}
      {isGrenade && result.hitResult && result.grenadeBlastZone && (
        <>
          <div
            data-testid="grenade-blast-zone"
            className={cn(
              "relative p-5 rounded-lg border-2",
              (result.hitResult.roll ?? 0) === 1
                ? "bg-red-950/30 border-red-600/50"
                : "bg-emerald-950/20 border-emerald-600/50"
            )}
          >
            {(result.hitResult.roll ?? 0) === 1 && (
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-red-700/30">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-red-400 font-bold font-mono text-sm uppercase tracking-wider">
                  Опасно! Вы в зоне взрыва!
                </span>
              </div>
            )}

            <div className="text-center space-y-2">
              <div className={cn(
                "text-3xl font-mono font-black uppercase tracking-wider",
                (result.hitResult.roll ?? 0) === 1 ? "text-red-400" : "text-emerald-400"
              )}>
                ВЗРЫВ
              </div>
              <div className="text-lg font-mono font-bold text-slate-300">
                {result.grenadeBlastZone.minSteps}-{result.grenadeBlastZone.maxSteps} шагов
              </div>
              <div className="text-base font-mono text-slate-500">
                [{result.grenadeBlastZone.minCm}-{result.grenadeBlastZone.maxCm} см]
              </div>
              <div className="text-xs font-mono text-slate-600 uppercase tracking-wider mt-3">
                Радиус взрыва: ±1 шаг
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-800/50 flex justify-center items-center gap-4">
              <div className="text-xs font-mono text-slate-600 uppercase tracking-wider">
                Бросок D6
              </div>
              <div className={cn(
                "relative w-16 h-16 bg-slate-950/80 rounded-lg flex items-center justify-center text-2xl font-mono font-black border-2",
                (result.hitResult.roll ?? 0) === 1 ? "border-red-600/50" : "border-emerald-600/50"
              )}>
                {result.hitResult.roll ?? 0}
              </div>
              <div className={cn("text-xl font-mono font-black",
                (result.hitResult.roll ?? 0) === 1 ? "text-red-400" : "text-emerald-400"
              )}>
                +{result.soldierRank || 0} = {result.grenadeDistance}
              </div>
            </div>
          </div>

          {/* Target Checks Section */}
          {result.grenadeBlastChecks && result.grenadeBlastChecks.length > 0 && (
            <div data-testid="grenade-blast-checks" className="space-y-2">
              <div className="text-xs font-mono text-slate-600 uppercase tracking-wider text-center">
                РЕЗУЛЬТАТЫ ПРОВЕРКИ ЦЕЛЕЙ
              </div>
              {result.grenadeBlastChecks.map((check, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative p-4 rounded-lg border-2 flex items-center justify-between",
                    check.hit
                      ? "bg-orange-950/20 border-orange-600/50"
                      : "bg-slate-800/60 border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xs font-mono opacity-60 mb-1">БРОНЯ</div>
                      <div className="w-12 h-12 bg-slate-950/80 rounded-lg border border-slate-700 flex items-center justify-center text-xl font-mono font-bold text-slate-300">
                        {check.armor}
                      </div>
                    </div>

                    <div className="text-slate-500 text-2xl">vs</div>

                    <div className="text-center">
                      <div className="text-xs font-mono opacity-60 mb-1">D20</div>
                      <div className={cn(
                        "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-mono font-bold",
                        check.hit
                          ? "bg-orange-900/40 border-orange-500 text-orange-400"
                          : "bg-slate-900/80 border-slate-600 text-slate-500"
                      )}>
                        {check.roll}
                        {check.hit && check.roll === 20 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border border-amber-300 flex items-center justify-center animate-pulse">
                            <span className="text-[8px] font-black text-white">!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-2 pl-4 border-l border-slate-700",
                    check.hit ? "border-orange-700/30" : ""
                  )}>
                    {check.hit ? (
                      <>
                        <Skull className="w-5 h-5 text-orange-400 animate-pulse" />
                        <span className="text-sm font-mono font-bold text-orange-400 uppercase">
                          ПРОБИТО
                        </span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 text-slate-500" />
                        <span className="text-sm font-mono font-bold text-slate-500 uppercase">
                          НЕ ПРОБИТО
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grenade Target Check Input Section */}
          {isGrenade && onGrenadeCheckTarget && (
            <div data-testid="grenade-target-check-section" className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-xs opacity-60 uppercase font-bold mb-4 tracking-wider">
                ПРОВЕРИТЬ ЦЕЛЬ В ЗОНЕ ВЗРЫВА
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm opacity-70 uppercase font-bold whitespace-nowrap min-w-[90px]">
                    Броня цели
                  </label>
                  <div className="flex-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGrenadeTargetArmor(Math.max(0, grenadeTargetArmor - 1))}
                      className="w-14 h-14 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-slate-600 flex items-center justify-center text-2xl font-bold transition-all active:scale-95"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      data-testid="grenade-armor-input"
                      value={grenadeTargetArmor}
                      onChange={(e) => setGrenadeTargetArmor(Math.max(0, parseInt(e.target.value) || 0))}
                      min={0}
                      max={99}
                      className={cn(
                        "flex-1 h-14 bg-slate-900 border-2 border-emerald-600/50 rounded-lg",
                        "flex items-center justify-center font-mono font-bold text-white text-center",
                        "focus:outline-none focus:border-emerald-500 transition-colors",
                        '[&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none',
                        '[&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
                        '-moz-appearance:none appearance-none text-lg'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setGrenadeTargetArmor(Math.min(99, grenadeTargetArmor + 1))}
                      className="w-14 h-14 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-slate-600 flex items-center justify-center text-2xl font-bold transition-all active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  data-testid="grenade-explode-button"
                  onClick={() => onGrenadeCheckTarget(grenadeTargetArmor)}
                  className={cn(
                    "relative w-full py-4 rounded-lg font-mono text-base font-bold uppercase tracking-wider border-2 transition-all min-h-[56px]",
                    "active:scale-95",
                    "bg-emerald-950/20 border-emerald-600/50 text-emerald-400 hover:bg-emerald-950/40"
                  )}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">💣</span>
                    <span>ВЗРЫВ</span>
                    <span className="text-emerald-500/60 text-sm font-mono">1D20</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Melee Results */}
      {isMelee && result.meleeResult && (() => {
        const meleeResult = result.meleeResult!;
        return (
          <div className="space-y-3">
            {parameters.isSurpriseAttack && (meleeResult as any).attackerRolls ? (
              <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-700">
                <div className="flex items-center justify-center gap-3">
                  {(meleeResult as any).attackerRolls.map((roll: number, index: number) => {
                    const isBest = roll === meleeResult.attackerRoll;
                  return (
                    <div key={index} className="flex items-center gap-1">
                      <div className={cn(
                        "w-11 h-11 bg-slate-900 rounded-lg border flex items-center justify-center text-lg font-black",
                        isBest
                          ? "text-purple-400 border-purple-500"
                          : "text-slate-500 border-slate-600"
                      )}>
                        {roll}
                      </div>
                      <span className={cn("text-xs font-bold",
                        isBest ? "text-purple-400" : "text-slate-500"
                      )}>
                        {isBest ? '✓' : ''}
                      </span>
                    </div>
                  );
                })}
                <div className="border-l border-slate-600 pl-3">
                  <div className="text-base font-black text-blue-400">
                    {meleeResult.attackerTotal}
                  </div>
                  <div className="text-xs text-slate-400">
                    Вы
                  </div>
                </div>
                <div className="border-l border-slate-600 pl-3">
                  <div className="text-base font-black text-red-400">
                    {meleeResult.defenderTotal}
                  </div>
                  <div className="text-xs text-slate-400">
                    Цель
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Attacker */}
              <div className="bg-slate-900/60 p-4 rounded-lg border-2 border-cyan-600/50">
                <div className="text-xs font-mono opacity-60 text-cyan-400 mb-3 text-center">Атакующий</div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-slate-950/80 rounded-lg flex items-center justify-center text-2xl font-mono font-black text-cyan-400 border-2 border-cyan-500/30 mb-2">
                    {meleeResult.attackerRoll}
                  </div>
                  <div className="text-lg font-mono font-black text-cyan-400">
                    {meleeResult.attackerTotal}
                  </div>
                </div>
              </div>

              {/* Defender */}
              <div className="bg-slate-900/60 p-4 rounded-lg border-2 border-red-600/50">
                <div className="text-xs font-mono opacity-60 text-red-400 mb-3 text-center">Защищающийся</div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-slate-950/80 rounded-lg flex items-center justify-center text-2xl font-mono font-black text-red-400 border-2 border-red-500/30 mb-2">
                    {meleeResult.defenderRoll}
                  </div>
                  <div className="text-lg font-mono font-black text-red-400">
                    {meleeResult.defenderTotal}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Melee Result */}
          <div className={cn(
            "relative p-5 rounded-lg border-2 flex items-center justify-center",
            meleeResult.winner === 'attacker'
              ? "bg-emerald-950/30 border-emerald-600/50"
              : meleeResult.winner === 'defender'
              ? "bg-red-950/30 border-red-600/50"
              : "bg-slate-900/60 border-slate-700"
          )}>
            <div className={cn("text-2xl font-mono font-black tracking-wider",
              meleeResult.winner === 'attacker'
                ? "text-emerald-400"
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
        {showMarkAsDone && (
          <button
            onClick={() => {
              const newValue = !markAsDone;
              setMarkAsDone(newValue);
              setRememberMarkAsDone?.(newValue);
            }}
            className={cn(
              "shrink-0 px-4 py-3 rounded-lg font-mono text-sm font-bold uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-2 min-w-[110px]",
              markAsDone
                ? "bg-emerald-950/40 border-emerald-600/50 text-emerald-400"
                : "bg-slate-800/60 border-slate-700 text-slate-500 hover:bg-slate-700/60"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{markAsDone ? 'ГОТОВ' : 'ГОТОВ?'}</span>
          </button>
        )}

        <button
          onClick={() => onApply(showMarkAsDone ? markAsDone : undefined)}
          className={cn(
            "flex-1 py-3 rounded-lg font-mono text-sm font-bold uppercase tracking-wider border-2 transition-all min-h-[52px]",
            (isShot || isGrenade) && result.hitResult?.success
              ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white"
              : isMelee && result.meleeResult?.winner === 'attacker'
              ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white"
              : "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white"
          )}
        >
          ПРИНЯТЬ
        </button>
      </div>
    </div>
  );
}
