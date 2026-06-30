'use client';

import { useState } from 'react';
import { CombatResult, CombatParameters } from '@/lib/combat-types';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Skull, Shield, Footprints, Bomb } from 'lucide-react';
import { AnimatedDice } from './AnimatedDice';

interface CombatResultsProps {
  result: CombatResult;
  parameters: CombatParameters;
  rulesVersion: RulesVersionID;
  onApply: (markAsDone?: boolean) => void;
  onGoBack: () => void;
  unitType?: 'squad' | 'machine';
  onGrenadeCheckTarget?: (armor: number) => void;
  autoCompleteEnabled?: boolean;
}

export function CombatResults({
  result,
  parameters,
  rulesVersion,
  onApply,
  onGoBack: _onGoBack,
  unitType,
  onGrenadeCheckTarget,
  autoCompleteEnabled = true,
}: CombatResultsProps) {
  const isShot = result.actionType === 'shot';
  const isGrenade = result.actionType === 'grenade';
  const isMelee = result.actionType === 'melee';
  // Auto-complete logic: mark as done if enabled and it's a squad (not a machine)
  const markAsDone = autoCompleteEnabled && unitType === 'squad';
  const [grenadeTargetArmor, setGrenadeTargetArmor] = useState(2);

  // Grenade target-check derived state (Phase 2)
  const grenadeChecks = result.grenadeBlastChecks ?? [];
  const grenadeHits = grenadeChecks.filter((c) => c.hit).length;
  const grenadeTotal = grenadeChecks.length;
  const isGrenadeDanger = isGrenade && (result.hitResult?.roll ?? 0) === 1;

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
                        <AnimatedDice
                          key={i}
                          value={roll}
                          maxSide={20}
                          color={isMax ? "blue" : "blue"}
                          size="sm"
                          delay={i * 100}
                          isHit={isMax}
                          className={cn(!isMax && "opacity-50")}
                        />
                      );
                    })}
                    {result.hitResult.bonus && result.hitResult.bonus > 0 && (
                      <div className="relative w-10 h-10 bg-emerald-950/60 rounded-lg flex items-center justify-center text-base font-mono font-black border border-emerald-500/30 text-emerald-400">
                        +{result.hitResult.bonus}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single dice - animated */
                  <div className="flex flex-col items-center gap-2">
                    <AnimatedDice
                      value={result.hitResult.roll}
                      maxSide={20}
                      color={result.hitResult.success ? "emerald" : "red"}
                      size="md"
                      delay={0}
                      isHit={result.hitResult.success}
                      bonus={result.hitResult.bonus}
                      total={result.hitResult.total}
                      targetValue={getEffectiveDistance()}
                      resultLabel={result.hitResult.success ? 'hit' : 'miss'}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Target Value */}
            <div className="relative bg-slate-900/80 p-4 rounded-lg border-2 border-amber-600/50">
              <div className="text-xs font-mono opacity-60 text-amber-400 mb-3 text-center">
                Дистанция
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <Footprints className="w-6 h-6 text-amber-500" />
                  <span className="text-3xl font-mono font-black text-amber-400">
                    {getEffectiveDistance()}
                  </span>
                </div>
                {getFortificationBonusDisplay() && (
                  <div className="text-xs opacity-70">{getFortificationBonusDisplay()}</div>
                )}
              </div>
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

              {parameters.isSurpriseAttack && result.damageResult.isSurpriseAttack && result.damageResult.bothRolls ? (
                <div className="space-y-2">
                  {result.damageResult.bothRolls.map((rollSet: number[], setIndex: number) => {
                    const isFirstSet = setIndex === 0;
                    const rolls = result.damageResult!.bothRolls!;
                    const firstSetDamage = rolls[0].filter((r: number) => r > getEffectiveArmor()).length;
                    const secondSetDamage = rolls[1].filter((r: number) => r > getEffectiveArmor()).length;
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
                              <AnimatedDice
                                key={i}
                                value={roll}
                                maxSide={20}
                                color={penetrated ? "orange" : "blue"}
                                size="sm"
                                delay={setIndex * 200 + i * 80}
                                isHit={penetrated}
                              />
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

                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <AnimatedDice
                          value={roll}
                          maxSide={20}
                          color={penetrated ? "amber" : "blue"}
                          size="sm"
                          delay={i * 100}
                          isHit={penetrated}
                          className={cn(isMax && penetrated && "ring-2 ring-blue-400/50 ring-offset-1 ring-offset-slate-900 rounded-xl")}
                        />
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
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center">
                <div className={cn(
                  "px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-black uppercase tracking-wider animate-pop-in",
                  result.damageResult.damage > 0
                    ? "bg-amber-950/80 border-amber-500/50 text-amber-400"
                    : "bg-slate-800/80 border-slate-600/50 text-slate-500"
                )}>
                  {result.damageResult.damage > 0
                    ? `-${result.damageResult.damage} ${result.unitType === 'machine' ? 'HP' : 'УРОНА'}`
                    : 'НЕ ПРОБИТО'}
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
          {/* Danger Warning */}
          {(result.hitResult.roll ?? 0) === 1 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-red-950/30 rounded-lg border-2 border-red-600/50">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              <span className="text-red-400 font-bold font-mono text-sm uppercase tracking-wider">
                Опасно! Вы в зоне взрыва!
              </span>
            </div>
          )}

          {/* Hit Comparison - same style as shot */}
          <div className="grid grid-cols-2 gap-3">
            {/* Your Roll */}
            <div className={cn(
              "relative bg-slate-900/80 p-4 rounded-lg border-2",
              (result.hitResult.roll ?? 0) === 1
                ? "border-red-600/50"
                : "border-emerald-600/50"
            )}>
              <div className={cn(
                "text-xs font-mono opacity-60 mb-3 text-center",
                (result.hitResult.roll ?? 0) === 1 ? "text-red-400" : "text-emerald-400"
              )}>
                Ваш бросок
              </div>
              <div className="flex flex-col items-center">
                {result.hitResult?.rolls && result.hitResult.rolls.length > 1 ? (
                  // Community Star System: Show all rolls, highlight best
                  <div className="flex items-center gap-2 mb-2">
                    {result.hitResult.rolls.map((roll, i) => {
                      const rolls = result.hitResult?.rolls ?? [];
                      const maxRoll = Math.max(...rolls);
                      const isMax = roll === maxRoll;
                      return (
                        <AnimatedDice
                          key={i}
                          value={roll}
                          maxSide={6}
                          color={isMax ? "emerald" : "blue"}
                          size="sm"
                          delay={i * 100}
                          isHit={isMax}
                          className={cn(!isMax && "opacity-40")}
                        />
                      );
                    })}
                  </div>
                ) : (
                  // Tehnolog rules: Single dice, no bonus
                  <AnimatedDice
                    value={result.hitResult.roll ?? 0}
                    maxSide={6}
                    color={(result.hitResult.roll ?? 0) === 1 ? "red" : "emerald"}
                    size="md"
                    delay={0}
                    isHit={(result.hitResult.roll ?? 0) !== 1}
                    bonus={0}
                    total={result.grenadeDistance}
                  />
                )}
              </div>
            </div>

            {/* Blast Zone */}
            <div className="relative bg-slate-900/80 p-4 rounded-lg border-2 border-amber-600/50">
              <div className="text-xs font-mono opacity-60 text-amber-400 mb-3 text-center">
                Зона взрыва
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Bomb className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-mono font-black text-amber-400">
                    {result.grenadeBlastZone.minSteps}-{result.grenadeBlastZone.maxSteps}
                  </span>
                  <Footprints className="w-4 h-4 text-amber-500/60" />
                </div>
                <div className="text-xs font-mono text-slate-500">
                  [{result.grenadeBlastZone.minCm}-{result.grenadeBlastZone.maxCm} см]
                </div>
              </div>
            </div>
          </div>

          {/* Result Label */}
          <div className="flex justify-center">
            <div className={cn(
              "px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-black uppercase tracking-wider animate-pop-in",
              (result.hitResult.roll ?? 0) === 1
                ? "bg-red-950/80 border-red-500/50 text-red-400"
                : "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
            )}>
              {(result.hitResult.roll ?? 0) === 1 ? 'ОПАСНО' : 'ВЗРЫВ'}
            </div>
          </div>

          {/* Target Checks Section */}
          {result.grenadeBlastChecks && result.grenadeBlastChecks.length > 0 && (
            <div data-testid="grenade-blast-checks" className="space-y-3">
              {result.grenadeBlastChecks.map((check, idx) => {
                const isLast = idx === result.grenadeBlastChecks!.length - 1;
                return (
                <div
                  key={idx}
                  data-testid="grenade-blast-check"
                  className={cn(
                    "space-y-3 rounded-lg",
                    isLast && "ring-2 ring-emerald-400/50 ring-offset-0"
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Per-target label */}
                  <div className="flex items-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400/80 bg-emerald-950/40 border border-emerald-700/40 rounded px-1.5 py-0.5">
                      ЦЕЛЬ {idx + 1}
                    </span>
                  </div>
                  {/* Grid layout - same as shot */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* D20 Roll */}
                    <div className={cn(
                      "relative bg-slate-900/80 p-4 rounded-lg border-2",
                      check.hit
                        ? "border-orange-600/50"
                        : "border-slate-600/50"
                    )}>
                      <div className={cn(
                        "text-xs font-mono opacity-60 mb-3 text-center",
                        check.hit ? "text-orange-400" : "text-slate-400"
                      )}>
                        Бросок D20
                      </div>
                      <div className="flex flex-col items-center">
                        <AnimatedDice
                          value={check.roll}
                          maxSide={20}
                          color={check.hit ? "orange" : "blue"}
                          size="md"
                          delay={idx * 200}
                          isHit={check.hit}
                          targetValue={check.armor}
                          total={check.roll}
                          resultLabel={check.hit ? 'hit' : 'miss'}
                        />
                      </div>
                    </div>

                    {/* Armor */}
                    <div className="relative bg-slate-900/80 p-4 rounded-lg border-2 border-slate-600/50">
                      <div className="text-xs font-mono opacity-60 text-slate-400 mb-3 text-center">
                        Броня цели
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-6 h-6 text-slate-500" />
                          <span className="text-3xl font-mono font-black text-slate-400">
                            {check.armor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Result Label */}
                  <div className="flex justify-center">
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-black uppercase tracking-wider animate-pop-in",
                      check.hit
                        ? "bg-orange-950/80 border-orange-500/50 text-orange-400"
                        : "bg-slate-800/80 border-slate-600/50 text-slate-500"
                    )}>
                      {check.hit ? (
                        <>
                          <Skull className="w-4 h-4 inline mr-1" />
                          ПРОБИТО {check.roll}:{check.armor}
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 inline mr-1" />
                          НЕ ПРОБИТО {check.roll}:{check.armor}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Grenade Target Check Input Section — sticky arming panel */}
          {isGrenade && onGrenadeCheckTarget && (
            <div
              data-testid="grenade-target-check-section"
              className={cn(
                "sticky bottom-0 z-10 bg-slate-800 p-4 rounded-lg border border-slate-700 border-t-2 shadow-[0_-10px_20px_rgba(0,0,0,0.45)]",
                isGrenadeDanger ? "border-t-red-500 animate-pulse" : "border-t-emerald-600/70"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs opacity-60 uppercase font-bold tracking-wider">
                  ПРОВЕРИТЬ ЦЕЛЬ В ЗОНЕ ВЗРЫВА
                </div>
                {grenadeTotal > 0 ? (
                  <span
                    data-testid="grenade-hit-tally"
                    className={cn(
                      "font-mono font-black text-xs whitespace-nowrap",
                      grenadeHits > 0 ? "text-emerald-400" : "text-slate-500"
                    )}
                  >
                    💥 {grenadeHits}/{grenadeTotal} пробито
                  </span>
                ) : null}
              </div>

              {grenadeTotal === 0 && (
                <div className="text-center text-[11px] text-slate-500 font-mono uppercase tracking-wider mb-3">
                  <Bomb className="inline w-3.5 h-3.5 mr-1 align-middle" />
                  Цели в зоне взрыва не проверены
                </div>
              )}

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
                    "relative w-full py-2 md:py-3 rounded-lg font-mono text-base font-bold uppercase tracking-wider border-2 transition-all min-h-[48px] md:min-h-[52px]",
                    "active:scale-95",
                    "bg-emerald-950/20 border-emerald-600/50 text-emerald-400 hover:bg-emerald-950/40"
                  )}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl md:text-2xl">💣</span>
                    <span>ВЗРЫВ</span>
                    <span className="text-emerald-500/60 text-sm font-mono hidden md:inline">1D20</span>
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
            {parameters.isSurpriseAttack && meleeResult.attackerRolls ? (
              <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-700">
                <div className="flex items-center justify-center gap-3">
                  {meleeResult.attackerRolls.map((roll: number, index: number) => {
                    const isBest = roll === meleeResult.attackerRoll;
                  return (
                    <AnimatedDice
                      key={index}
                      value={roll}
                      maxSide={6}
                      color={isBest ? "purple" : "blue"}
                      size="sm"
                      delay={index * 100}
                      isHit={isBest}
                      className={cn(!isBest && "opacity-50")}
                    />
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
                  <AnimatedDice
                    value={meleeResult.attackerRoll}
                    maxSide={6}
                    color="cyan"
                    size="md"
                    delay={0}
                    isHit={meleeResult.winner === 'attacker'}
                    bonus={meleeResult.attackerTotal - meleeResult.attackerRoll}
                    total={meleeResult.attackerTotal}
                  />
                </div>
              </div>

              {/* Defender */}
              <div className="bg-slate-900/60 p-4 rounded-lg border-2 border-red-600/50">
                <div className="text-xs font-mono opacity-60 text-red-400 mb-3 text-center">Защищающийся</div>
                <div className="flex flex-col items-center">
                  <AnimatedDice
                    value={meleeResult.defenderRoll}
                    maxSide={6}
                    color="red"
                    size="md"
                    delay={150}
                    isHit={meleeResult.winner === 'defender'}
                    bonus={meleeResult.defenderTotal - meleeResult.defenderRoll}
                    total={meleeResult.defenderTotal}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Melee Result */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center">
            <div className={cn(
              "px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-black uppercase tracking-wider animate-pop-in",
              meleeResult.winner === 'attacker'
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
                : meleeResult.winner === 'defender'
                ? "bg-red-950/80 border-red-500/50 text-red-400"
                : "bg-slate-800/80 border-slate-600/50 text-slate-500"
            )}>
              {meleeResult.winner === 'attacker'
                ? `ПОБЕДА ${meleeResult.attackerTotal}:${meleeResult.defenderTotal}`
                : meleeResult.winner === 'defender'
                ? `КОНТРАТАКА ${meleeResult.defenderTotal}:${meleeResult.attackerTotal}`
                : `НИЧЬЯ ${meleeResult.attackerTotal}:${meleeResult.defenderTotal}`}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Action Buttons */}
      <div className="flex gap-2 md:gap-3 pt-4">
        <button
          onClick={() => onApply(markAsDone || undefined)}
          className={cn(
            "flex-1 px-2 md:px-6 py-2 md:py-3 rounded-lg font-mono text-sm font-bold uppercase tracking-wider border-2 transition-all min-h-[44px] md:min-h-[48px]",
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
