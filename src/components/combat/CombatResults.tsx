'use client';

import { useState, useEffect, useRef } from 'react';
import { CombatResult, CombatParameters } from '@/lib/combat-types';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skull, Shield, Footprints, Crosshair, X } from 'lucide-react';
import { AnimatedDice } from './AnimatedDice';
import { GrenadeBlastRuler } from './GrenadeBlastRuler';
import { DiceInputPopup } from './DiceInputPopup';

interface CombatResultsProps {
  result: CombatResult;
  parameters: CombatParameters;
  rulesVersion: RulesVersionID;
  onApply: (markAsDone?: boolean) => void;
  onGoBack: () => void;
  unitType?: 'squad' | 'machine';
  onGrenadeCheckTarget?: (armor: number) => void;
  autoCompleteEnabled?: boolean;
  stepToCmFactor?: number;
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
  stepToCmFactor = 5,
}: CombatResultsProps) {
  const isShot = result.actionType === 'shot';
  const isGrenade = result.actionType === 'grenade';
  const isMelee = result.actionType === 'melee';
  const isRam = result.actionType === 'ram';
  const ramResults = result.ramInfantryResults ?? [];
  const ramKilled = ramResults.filter(r => r.killed).length;
  // Auto-complete logic: mark as done if enabled and it's a squad (not a machine)
  const markAsDone = autoCompleteEnabled && unitType === 'squad';
  // Seeded from the armor already entered in PARAMETERS (was a hardcoded 2)
  const [grenadeTargetArmor, setGrenadeTargetArmor] = useState(parameters.targetArmor ?? 2);
  const [armorPopupOpen, setArmorPopupOpen] = useState(false);

  // Grenade target-check derived state (Phase 2)
  const grenadeChecks = result.grenadeBlastChecks ?? [];
  const grenadeHits = grenadeChecks.filter((c) => c.hit).length;
  const grenadeTotal = grenadeChecks.length;
  const isGrenadeDanger = isGrenade && (result.hitResult?.roll ?? 0) === 1;

  // After each blast check, snap the modal content back to the top where the
  // fresh verdict banner and the blast zone live: on mobile the thumb taps
  // ВЗРЫВ on the sticky strip at the bottom, the answer lands at the top.
  const rootRef = useRef<HTMLDivElement>(null);
  const prevChecksRef = useRef(grenadeTotal);
  useEffect(() => {
    if (grenadeTotal > prevChecksRef.current) {
      const scroller = rootRef.current?.closest('[data-combat-scroll]');
      if (scroller) scroller.scrollTop = 0;
    }
    prevChecksRef.current = grenadeTotal;
  }, [grenadeTotal]);

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
    <div className="space-y-4" ref={rootRef}>
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
          {/* Verdict summary — instant, full-width: hit/miss + armor outcome.
              Three glanceable states: miss=red, hit with damage=emerald,
              hit but armor held=amber («попал, но броню не пробил»). */}
          {(() => {
            const hit = result.hitResult.success;
            const penetrated = hit && (result.damageResult?.damage ?? 0) > 0;
            const tone = !hit
              ? { box: 'bg-red-950/80 border-red-500/70 shadow-red-900/30', text: 'text-red-400', sub: 'text-red-300', detail: 'text-slate-300 border-red-500/30', Icon: X }
              : penetrated
              ? { box: 'bg-emerald-950/80 border-emerald-500/70 shadow-emerald-900/30', text: 'text-emerald-400', sub: 'text-emerald-300', detail: 'text-amber-300 border-emerald-500/30', Icon: Crosshair }
              : { box: 'bg-amber-950/80 border-amber-500/70 shadow-amber-900/30', text: 'text-amber-400', sub: 'text-amber-300', detail: 'text-slate-300 border-amber-500/30', Icon: Crosshair };
            return (
              <div
                key={result.timestamp}
                data-testid="shot-verdict-banner"
                role="status"
                className={cn('result-reveal w-full px-4 py-3 rounded-lg border-2 shadow-lg', tone.box)}
              >
                <div className="flex items-center justify-center gap-3">
                  <tone.Icon className={cn('w-7 h-7 shrink-0', tone.text)} />
                  <span className={cn('font-mono text-2xl font-black uppercase tracking-wider', tone.text)}>
                    {hit ? 'ПОПАДАНИЕ' : 'ПРОМАХ'}
                  </span>
                  <span className={cn('ml-auto font-mono text-sm font-black opacity-80 whitespace-nowrap', tone.sub)}>
                    {result.hitResult.total}:{getEffectiveDistance()}
                  </span>
                </div>
                {hit && result.damageResult && (
                  <div className={cn('mt-2 pt-2 border-t text-center font-mono text-sm font-black uppercase tracking-wider', tone.detail)}>
                    {penetrated
                      ? `-${result.damageResult.damage} ${result.unitType === 'machine' ? 'HP' : 'УРОНА'}`
                      : 'БРОНЯ НЕ ПРОБИТА'}
                  </div>
                )}
              </div>
            );
          })()}

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
                      resultLabel="none"
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
                {/* cm equivalent from the player's step factor toggle */}
                <div className="text-xs font-mono text-slate-500">
                  {getEffectiveDistance() * stepToCmFactor} см
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

      {/* Grenade Results — verdict banner + one throw block + compact target log */}
      {isGrenade && result.hitResult && result.grenadeBlastZone && (
        <>
          {/* Latest check verdict — the banner language of shots, carries the running tally */}
          {grenadeTotal > 0 && (() => {
            const last = grenadeChecks[grenadeTotal - 1];
            const tone = last.hit
              ? { box: 'bg-orange-950/80 border-orange-500/70 shadow-orange-900/30', text: 'text-orange-400', sub: 'text-orange-300', Icon: Skull }
              : { box: 'bg-amber-950/80 border-amber-500/70 shadow-amber-900/30', text: 'text-amber-400', sub: 'text-amber-300', Icon: Shield };
            return (
              <div
                key={grenadeTotal}
                data-testid="grenade-verdict-banner"
                role="status"
                className={cn('result-reveal w-full px-3 py-2.5 rounded-lg border-2 shadow-lg', tone.box)}
              >
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  <tone.Icon className={cn('w-6 h-6 shrink-0', tone.text)} />
                  <span className={cn('font-mono text-xl md:text-2xl font-black uppercase tracking-wider', tone.text)}>
                    {last.hit ? 'ПРОБИТО' : 'НЕ ПРОБИТО'}
                  </span>
                  <span className={cn('ml-auto font-mono text-xs font-black whitespace-nowrap', tone.sub)}>
                    ЦЕЛЬ {grenadeTotal} · D20 {last.roll}{last.hit ? '>' : '≤'}{last.armor}
                  </span>
                </div>
                <div
                  data-testid="grenade-hit-tally"
                  className="mt-1.5 pt-1.5 border-t border-white/10 text-center font-mono text-[11px] font-black uppercase tracking-wider text-slate-300"
                >
                  💥 {grenadeHits}/{grenadeTotal} пробито
                </div>
              </div>
            );
          })()}

          {/* Throw block: verdict + dice + tape ruler in a single box */}
          <GrenadeBlastRuler
            grenadeDistance={result.grenadeDistance ?? (result.hitResult.roll ?? 0)}
            blastZone={{
              minSteps: result.grenadeBlastZone.minSteps,
              maxSteps: result.grenadeBlastZone.maxSteps,
            }}
            factor={stepToCmFactor}
            danger={isGrenadeDanger}
            aimSteps={parameters.distance > 0 ? parameters.distance : undefined}
            throwRolls={
              result.hitResult.rolls && result.hitResult.rolls.length > 0
                ? result.hitResult.rolls
                : [result.hitResult.roll ?? 0]
            }
          />

          {/* Target log — one line per check, newest ringed */}
          {grenadeTotal > 0 && (
            <div data-testid="grenade-blast-checks" className="space-y-1.5">
              {result.grenadeBlastChecks!.map((check, idx) => {
                const isLast = idx === grenadeTotal - 1;
                return (
                  <div
                    key={idx}
                    data-testid="grenade-blast-check"
                    data-hit={check.hit ? 'true' : 'false'}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border',
                      isLast && 'ring-2 ring-emerald-400/50',
                      check.hit
                        ? 'bg-orange-950/30 border-orange-700/40'
                        : 'bg-slate-900/60 border-slate-700/50'
                    )}
                  >
                    <span className="min-w-[52px] text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400/80">
                      ЦЕЛЬ {idx + 1}
                    </span>
                    <span
                      className={cn(
                        'w-8 h-8 shrink-0 rounded border flex items-center justify-center font-mono font-black text-sm',
                        check.hit
                          ? 'bg-orange-950/60 border-orange-500/50 text-orange-300'
                          : 'bg-slate-800/60 border-slate-600 text-slate-400'
                      )}
                    >
                      {check.roll}
                    </span>
                    <span className="font-mono text-xs text-slate-400 whitespace-nowrap">
                      {check.hit ? '>' : '≤'} {check.armor}
                    </span>
                    <span
                      className={cn(
                        'ml-auto flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-wider',
                        check.hit ? 'text-orange-400' : 'text-slate-500'
                      )}
                    >
                      {check.hit
                        ? <Skull className="w-3.5 h-3.5 shrink-0" />
                        : <Shield className="w-3.5 h-3.5 shrink-0" />}
                      {check.hit ? 'ПРОБИТО' : 'НЕ ПРОБИТО'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Arming panel — sticky single strip: armor stepper + ВЗРЫВ side by side */}
          {isGrenade && onGrenadeCheckTarget && (
            <div
              data-testid="grenade-target-check-section"
              className={cn(
                'sticky bottom-0 z-10 bg-slate-800/95 backdrop-blur-sm p-2.5 rounded-lg border border-slate-700 border-t-2 shadow-[0_-10px_20px_rgba(0,0,0,0.45)]',
                isGrenadeDanger ? 'border-t-red-500 animate-pulse' : 'border-t-emerald-600/70'
              )}
            >
              <div className="flex items-center gap-1">
                <Shield
                  className="w-4 h-4 text-slate-400 shrink-0"
                  aria-label="Броня цели"
                />
                <button
                  type="button"
                  onClick={() => setGrenadeTargetArmor(Math.max(0, grenadeTargetArmor - 1))}
                  aria-label="Уменьшить броню цели"
                  className="w-11 h-12 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-slate-600 flex items-center justify-center text-xl font-bold transition-all active:scale-95 shrink-0"
                >
                  −
                </button>
                <button
                  type="button"
                  data-testid="grenade-armor-input"
                  onClick={() => setArmorPopupOpen(true)}
                  aria-label="Броня цели input"
                  className={cn(
                    'w-11 h-12 shrink-0 bg-slate-900 border-2 border-emerald-600/50 rounded-lg',
                    'flex items-center justify-center font-mono font-black text-white text-center text-lg',
                    'hover:border-emerald-500 active:scale-[0.98] transition-all touch-manipulation'
                  )}
                >
                  {grenadeTargetArmor}
                </button>
                <button
                  type="button"
                  onClick={() => setGrenadeTargetArmor(Math.min(99, grenadeTargetArmor + 1))}
                  aria-label="Увеличить броню цели"
                  className="w-11 h-12 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-slate-600 flex items-center justify-center text-xl font-bold transition-all active:scale-95 shrink-0"
                >
                  +
                </button>
                <button
                  type="button"
                  data-testid="grenade-explode-button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                      navigator.vibrate(30);
                    }
                    onGrenadeCheckTarget(grenadeTargetArmor);
                  }}
                  className="flex-1 min-w-[92px] h-12 rounded-lg font-mono text-sm font-bold uppercase tracking-wider border-2 transition-all active:scale-95 bg-emerald-950/20 border-emerald-600/50 text-emerald-400 hover:bg-emerald-950/40"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">💣</span>
                    <span>ВЗРЫВ</span>
                    <span className="text-emerald-500/60 text-[10px] font-mono hidden md:inline">1D20</span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Таран results (#125) */}
      {isRam && ramResults.length > 0 && (
        <div data-testid="ram-infantry-results" className="space-y-2">
          {ramResults.map((r) => (
            <div key={r.index} data-testid="ram-infantry-result"
              className={cn('flex items-center justify-between px-3 py-2 rounded-lg border',
                r.killed ? 'bg-red-950/30 border-red-700/40' : 'bg-slate-900/40 border-slate-700/40')}>
              <span className="text-xs text-slate-400">Пехотинец {r.index + 1}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-200">D6: {r.roll}</span>
                <span className={cn('text-xs font-bold', r.killed ? 'text-red-400' : 'text-slate-400')}>
                  {r.killed ? 'Убит' : 'Отброшен'}
                </span>
              </span>
            </div>
          ))}
          <div data-testid="ram-kill-tally" className="text-center text-sm font-bold text-amber-300">
            💀 {ramKilled}/{ramResults.length} убито
          </div>
        </div>
      )}

      {/* Melee Results */}
      {isMelee && result.meleeResult && (() => {
        const meleeResult = result.meleeResult!;
        return (
          <div className="space-y-3">
            {result.meleeOutcome && (
              <div className={cn('text-center px-4 py-3 rounded-lg border-2',
                result.meleeOutcome.outcome === 'destroyed' ? 'bg-red-900/30 border-red-500/50' :
                result.meleeOutcome.outcome === 'damage' ? 'bg-amber-900/30 border-amber-500/50' :
                'bg-slate-800/40 border-slate-600/50')}>
                <div className="text-lg font-black text-slate-100">
                  {result.meleeOutcome.outcome === 'destroyed' ? 'Цель уничтожена' :
                   result.meleeOutcome.outcome === 'damage' ? `Повреждений: ${result.meleeOutcome.damage}` :
                   'Атака отбита'}
                </div>
              </div>
            )}
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
                {result.meleeOutcome && parameters.targetType === 'artillery' ? (
                  // Artillery (machine melee) defender rolls NO D6 — defense = armor only (#125).
                  <div className="flex flex-col items-center justify-center gap-1 py-2">
                    <div className="text-base font-black text-red-400">Броня: {parameters.targetArmor}</div>
                  </div>
                ) : (
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
                )}
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

      {/* Quick armor input for the arming panel (standard values modal) */}
      {isGrenade && armorPopupOpen && (
        <DiceInputPopup
          title="БРОНЯ ЦЕЛИ"
          field="armor"
          color="emerald"
          mode="number"
          numericValue={grenadeTargetArmor}
          min={0}
          max={99}
          quickValues={[0, 1, 2, 3, 4, 5, 6, 7, 8, 10]}
          onSubmit={(value) => {
            const n = parseInt(value, 10);
            if (!isNaN(n)) setGrenadeTargetArmor(n);
            setArmorPopupOpen(false);
          }}
          onClose={() => setArmorPopupOpen(false)}
        />
      )}

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
