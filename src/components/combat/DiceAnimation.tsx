'use client';

import { useState, useEffect } from 'react';
import { CombatFlowState } from '@/lib/combat-types';
import { cn } from '@/lib/utils';

interface DiceAnimationProps {
  state: CombatFlowState;
}

const getActionColors = (actionType: string) => {
  const colorMap = {
    shot: {
      primary: 'text-amber-400',
      border: 'border-amber-600/40',
      bg: 'bg-amber-950/20',
      accent: 'border-amber-500',
      targetBorder: 'border-amber-500/30',
      glow: 'shadow-amber-900/20',
      glowIntense: 'shadow-amber-500/40'
    },
    melee: {
      primary: 'text-cyan-400',
      border: 'border-cyan-600/40',
      bg: 'bg-cyan-950/20',
      accent: 'border-cyan-500',
      targetBorder: 'border-cyan-500/30',
      glow: 'shadow-cyan-900/20',
      glowIntense: 'shadow-cyan-500/40'
    },
    grenade: {
      primary: 'text-emerald-400',
      border: 'border-emerald-600/40',
      bg: 'bg-emerald-950/20',
      accent: 'border-emerald-500',
      targetBorder: 'border-emerald-500/30',
      glow: 'shadow-emerald-900/20',
      glowIntense: 'shadow-emerald-500/40'
    }
  };
  return colorMap[actionType as keyof typeof colorMap] || colorMap.shot;
};

export function DiceAnimation({ state }: DiceAnimationProps) {
  const isShot = state.actionType === 'shot' || state.actionType === 'grenade';
  const isMelee = state.actionType === 'melee';
  const colors = getActionColors(state.actionType || 'shot');

  // Rolling animation state
  const [rollingValue, setRollingValue] = useState<number | null>(null);
  const [rollingMeleeA, setRollingMeleeA] = useState<number | null>(null);
  const [rollingMeleeD, setRollingMeleeD] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Get actual dice roll value (without bonus)
  const hitRoll = state.diceDisplay.hitRolls?.[0];
  const hitBonus = state.diceDisplay.hitBonus || 0;

  useEffect(() => {
    if (state.phase === 'ROLLING') {
      // Brief shake effect, then show result
      setShakeIntensity(1);

      const flashTimer = setTimeout(() => {
        setShowFlash(true);
        setShakeIntensity(0);
        setTimeout(() => {
          setRollingValue(null);
          setRollingMeleeA(null);
          setRollingMeleeD(null);
          setShowParticles(true);
        }, 100);
        setTimeout(() => setShowFlash(false), 150);
      }, 250);

      return () => {
        clearTimeout(flashTimer);
      };
    } else {
      setShakeIntensity(0);
      setShowFlash(false);
      setShowParticles(false);
    }
  }, [state.phase, isShot, isMelee]);

  // Display rolling or final value
  const displayHit = rollingValue !== null ? rollingValue : hitRoll;
  const displayMeleeA = rollingMeleeA !== null ? rollingMeleeA : state.diceDisplay.meleeA;
  const displayMeleeD = rollingMeleeD !== null ? rollingMeleeD : state.diceDisplay.meleeD;

  const isCritical = hitRoll !== undefined &&
    ['shot', 'grenade'].includes(state.actionType || '') &&
    hitRoll >= (state.actionType === 'grenade' ? 6 : 20);

  // Calculate total for display
  const displayTotal = displayHit !== undefined ? displayHit + hitBonus : undefined;

  // Shake animation style
  const shakeStyle = shakeIntensity > 0 ? {
    transform: `translate(${(Math.random() - 0.5) * shakeIntensity}px, ${(Math.random() - 0.5) * shakeIntensity}px)`
  } : {};

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-2px, 1px) rotate(-0.5deg); }
          50% { transform: translate(2px, -1px) rotate(0.5deg); }
          75% { transform: translate(-1px, 2px) rotate(-0.5deg); }
        }
        @keyframes pulse-intense {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes flash-bang {
          0% { opacity: 0; }
          10% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-pulse-intense {
          animation: pulse-intense 0.3s ease-in-out infinite;
        }
        .animate-flash {
          animation: flash-bang 0.3s ease-out forwards;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        {showFlash && (
          <div className="fixed inset-0 bg-white/20 animate-flash pointer-events-none z-50" />
        )}

        {/* Status header */}
        <div className="relative w-full max-w-xs">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div className="w-full h-1 bg-gradient-to-b from-transparent via-white to-transparent animate-[scanline_1.5s_linear_infinite]" />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className={cn("h-px flex-1", colors.accent, "opacity-40")} />
            <div className={cn("w-2 h-2 rotate-45", colors.primary, "animate-pulse")} />
            <div className={cn("h-px flex-1", colors.accent, "opacity-40")} />
          </div>

          <div className="text-center">
            <div className={cn(
              "text-lg font-mono font-black uppercase tracking-widest",
              colors.primary,
              "animate-pulse-intense"
            )}>
              {state.actionType === 'melee' ? 'ВЫЧИСЛЕНИЕ...' : 'СКАНИРОВАНИЕ...'}
            </div>
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-2">
              {state.actionType === 'shot' ? 'СИСТЕМА ОГНЯ' :
               state.actionType === 'grenade' ? 'СИСТЕМА ГРАНАТ' : 'БЛИЖНИЙ БОЙ'}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className={cn("h-px flex-1", colors.accent, "opacity-40")} />
            <div className={cn("w-2 h-2 rotate-45", colors.primary, "animate-pulse")} />
            <div className={cn("h-px flex-1", colors.accent, "opacity-40")} />
          </div>
        </div>

        {/* Dice visuals */}
        {isShot && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {/* Your Roll - with roll + bonus + total */}
            <div className={cn(
              "relative bg-slate-900/90 p-4 rounded-xl border-2 overflow-hidden",
              colors.border,
              shakeIntensity > 0 ? colors.glowIntense : colors.glow,
              "transition-shadow duration-150"
            )}>
              <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", colors.accent)} />
              <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", colors.accent)} />
              <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", colors.accent)} />
              <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", colors.accent)} />

              {shakeIntensity > 0 && (
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                  <div className="w-full h-2 bg-gradient-to-b from-transparent via-white to-transparent animate-[scanline_0.8s_linear_infinite]" />
                </div>
              )}

              <div className="relative">
                <div className={cn("text-xs font-mono opacity-70 mb-3 text-center tracking-wider", colors.primary)}>
                  ВАШ БРОСОК
                </div>
                <div className="flex flex-col items-center gap-2">
                  {/* Dice with roll value */}
                  <div
                    className={cn(
                      "relative w-20 h-20 bg-slate-950/90 rounded-xl flex items-center justify-center text-5xl font-mono font-black border-2 transition-all duration-150",
                      displayHit !== undefined
                        ? `${colors.primary} ${colors.targetBorder} shadow-2xl`
                        : `${colors.primary}/20 ${colors.border}`,
                      shakeIntensity > 0 && "animate-pulse-intense",
                      isCritical && displayHit !== undefined && "ring-4 ring-white/60 ring-offset-4 ring-offset-slate-900"
                    )}
                    style={shakeStyle}
                  >
                    {displayHit !== undefined ? displayHit : <span className="text-slate-700">—</span>}
                  </div>

                  {/* Bonus display */}
                  {hitBonus > 0 && displayHit !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className={cn("text-2xl font-mono font-bold", colors.primary)}>
                        {displayHit}
                      </span>
                      <span className="text-emerald-400 text-xl font-mono font-bold">
                        +{hitBonus}
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className={cn("text-2xl font-mono font-bold", colors.primary)}>
                        {displayTotal}
                      </span>
                    </div>
                  )}

                  {/* No bonus - just show roll */}
                  {hitBonus === 0 && displayHit !== undefined && (
                    <div className={cn("text-xl font-mono font-bold", colors.primary)}>
                      {displayHit}
                    </div>
                  )}
                </div>

                {/* Tech dots */}
                {displayHit !== undefined && (
                  <>
                    <div className={cn("absolute top-2 left-2 w-2 h-2 rounded-full", colors.accent, "animate-pulse")} />
                    <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full", colors.accent, "animate-pulse delay-100")} />
                    <div className={cn("absolute bottom-2 left-2 w-2 h-2 rounded-full", colors.accent, "animate-pulse delay-200")} />
                    <div className={cn("absolute bottom-2 right-2 w-2 h-2 rounded-full", colors.accent, "animate-pulse delay-300")} />
                  </>
                )}

                {/* Particles */}
                {showParticles && displayHit !== undefined && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => {
                      const angle = (i * 45) * Math.PI / 180;
                      const tx = Math.cos(angle) * 40;
                      const ty = Math.sin(angle) * 40;
                      return (
                        <div
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{
                            '--tx': `${tx}px`,
                            '--ty': `${ty}px`,
                            backgroundColor: colors.primary.replace('text-', '').replace('-400', ''),
                            animation: `particle-fly 0.5s ease-out ${i * 30}ms forwards`
                          } as React.CSSProperties}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Target Value */}
            <div className="relative bg-slate-900/80 p-4 rounded-xl border-2 border-slate-700/60 overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-slate-600" />
              <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-slate-600" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-slate-600" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-slate-600" />

              <div className="text-xs font-mono opacity-70 text-amber-400 mb-3 text-center tracking-wider">
                ДИСТАНЦИЯ
              </div>
              <div className="flex justify-center">
                <div className="relative w-20 h-20 bg-slate-950/90 rounded-xl flex items-center justify-center text-5xl font-mono font-black border-2 border-slate-700 shadow-xl">
                  {state.parameters.distance}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Melee dice */}
        {isMelee && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {/* Attacker */}
            <div className={cn(
              "relative bg-slate-900/90 p-4 rounded-xl border-2 overflow-hidden",
              colors.border,
              shakeIntensity > 0 ? colors.glowIntense : colors.glow,
              "transition-shadow duration-150"
            )}>
              <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", colors.accent)} />
              <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", colors.accent)} />
              <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", colors.accent)} />
              <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", colors.accent)} />

              {shakeIntensity > 0 && (
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                  <div className="w-full h-2 bg-gradient-to-b from-transparent via-white to-transparent animate-[scanline_0.8s_linear_infinite]" />
                </div>
              )}

              <div className={cn("text-xs font-mono opacity-70 mb-3 text-center tracking-wider", colors.primary)}>
                АТАКУЮЩИЙ
              </div>
              <div className="flex justify-center">
                <div
                  className={cn(
                    "relative w-20 h-20 bg-slate-950/90 rounded-xl flex items-center justify-center text-5xl font-mono font-black border-2 transition-all duration-150",
                    displayMeleeA !== undefined
                      ? `${colors.primary} ${colors.targetBorder} shadow-2xl`
                      : `${colors.primary}/20 ${colors.border}`,
                    shakeIntensity > 0 && "animate-pulse-intense"
                  )}
                  style={shakeStyle}
                >
                  {displayMeleeA !== undefined ? displayMeleeA : <span className="text-slate-700">—</span>}
                  {displayMeleeA !== undefined && (
                    <>
                      <div className={cn("absolute top-2 left-2 w-2 h-2 rounded-full", colors.accent, "animate-pulse")} />
                      <div className={cn("absolute bottom-2 right-2 w-2 h-2 rounded-full", colors.accent, "animate-pulse delay-150")} />
                    </>
                  )}
                </div>
              </div>

              {showParticles && displayMeleeA !== undefined && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => {
                    const angle = (i * 60) * Math.PI / 180;
                    return (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{
                          '--tx': `${Math.cos(angle) * 35}px`,
                          '--ty': `${Math.sin(angle) * 35}px`,
                          backgroundColor: '#22d3ee',
                          animation: `particle-fly 0.5s ease-out ${i * 40}ms forwards`
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Defender */}
            <div className="relative bg-slate-900/80 p-4 rounded-xl border-2 border-red-600/50 shadow-red-900/30 overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-red-500" />
              <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-red-500" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-red-500" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-500" />

              <div className="text-xs font-mono opacity-70 text-red-400 mb-3 text-center tracking-wider">
                ЗАЩИЩАЮЩИЙСЯ
              </div>
              <div className="flex justify-center">
                <div
                  className={cn(
                    "relative w-20 h-20 bg-slate-950/90 rounded-xl flex items-center justify-center text-5xl font-mono font-black border-2 transition-all duration-150",
                    displayMeleeD !== undefined
                      ? "text-red-400 border-red-500/40 shadow-2xl"
                      : "text-red-400/20 border-red-500/20",
                    shakeIntensity > 0 && "animate-pulse-intense"
                  )}
                  style={shakeStyle}
                >
                  {displayMeleeD !== undefined ? displayMeleeD : state.parameters.targetMelee}
                  {displayMeleeD !== undefined && (
                    <>
                      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse delay-150" />
                    </>
                  )}
                </div>
              </div>

              {showParticles && displayMeleeD !== undefined && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => {
                    const angle = (i * 60) * Math.PI / 180;
                    return (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{
                          '--tx': `${Math.cos(angle) * 35}px`,
                          '--ty': `${Math.sin(angle) * 35}px`,
                          backgroundColor: '#f87171',
                          animation: `particle-fly 0.5s ease-out ${i * 40}ms forwards`
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading bar */}
        <div className="w-full max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("h-px flex-1", colors.accent, "opacity-30")} />
            <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              Вычисление
            </div>
            <div className={cn("h-px flex-1", colors.accent, "opacity-30")} />
          </div>
          <div className="h-1.5 bg-slate-950/90 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              className={cn(
                "h-full animate-pulse relative overflow-hidden",
                colors.primary
              )}
              style={{ width: '70%' }}
            >
              <div className="absolute inset-0">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]" />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <div className="w-1 h-1 bg-slate-700" />
            <div className="w-1 h-1 bg-slate-700" />
            <div className="w-1 h-1 bg-slate-700" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes particle-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-150 { animation-delay: 150ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
      `}</style>
    </>
  );
}
