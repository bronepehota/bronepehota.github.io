'use client';

import { CombatFlowState } from '@/lib/combat-types';
import { cn } from '@/lib/utils';

interface DiceAnimationProps {
  state: CombatFlowState;
}

// Military tech colors for dice displays
const getActionColors = (actionType: string) => {
  const colorMap = {
    shot: {
      primary: 'text-amber-400',
      border: 'border-amber-600/40',
      bg: 'bg-amber-950/20',
      accent: 'border-amber-500',
      target: 'text-amber-400',
      targetBorder: 'border-amber-500/30',
      glow: 'shadow-amber-900/20'
    },
    melee: {
      primary: 'text-cyan-400',
      border: 'border-cyan-600/40',
      bg: 'bg-cyan-950/20',
      accent: 'border-cyan-500',
      target: 'text-red-400',
      targetBorder: 'border-red-500/30',
      glow: 'shadow-cyan-900/20'
    },
    grenade: {
      primary: 'text-emerald-400',
      border: 'border-emerald-600/40',
      bg: 'bg-emerald-950/20',
      accent: 'border-emerald-500',
      target: 'text-emerald-400',
      targetBorder: 'border-emerald-500/30',
      glow: 'shadow-emerald-900/20'
    }
  };
  return colorMap[actionType as keyof typeof colorMap] || colorMap.shot;
};

export function DiceAnimation({ state }: DiceAnimationProps) {
  const isShot = state.actionType === 'shot' || state.actionType === 'grenade';
  const isMelee = state.actionType === 'melee';
  const colors = getActionColors(state.actionType || 'shot');

  // Check for critical roll (max value) to add shake effect
  const isCritical = state.diceDisplay.hit !== undefined &&
    ['shot', 'grenade'].includes(state.actionType || '') &&
    state.diceDisplay.hit >= (state.actionType === 'grenade' ? 6 : 20);

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-5">
      {/* Tech header - Scanning status */}
      <div className="relative w-full max-w-xs">
        {/* Top decorative line */}
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("h-px flex-1", colors.accent, "opacity-40")} />
          <div className={cn("w-1.5 h-1.5 rotate-45", colors.primary, "opacity-60 animate-pulse")} />
          <div className={cn("h-px flex-1", colors.accent, "opacity-40")} />
        </div>

        {/* Rolling indicator with glitch effect on critical */}
        <div className="text-center">
          <div className={cn(
            "text-sm md:text-base font-mono font-bold uppercase tracking-[0.2em] animate-pulse",
            colors.primary,
            isCritical && "animate-shake"
          )}>
            {state.actionType === 'melee' ? 'ВЫЧИСЛЕНИЕ...' : 'СКАНИРОВАНИЕ...'}
          </div>
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mt-1">
            {state.actionType === 'shot' ? 'FIRE CONTROL SYSTEM' :
             state.actionType === 'grenade' ? 'ORDNANCE SYSTEM' : 'CLOSE COMBAT'}
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="flex items-center gap-2 mt-3">
          <div className={cn("h-px flex-1", colors.accent, "opacity-40")} />
          <div className={cn("w-1.5 h-1.5 rotate-45", colors.primary, "opacity-60 animate-pulse")} />
          <div className={cn("h-px flex-1", colors.accent, "opacity-40")} />
        </div>
      </div>

      {/* Dice visuals - HUD Style with 3D effects */}
      {isShot && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {/* Your Roll - Tactical Display with 3D perspective */}
          <div className={cn(
            "relative bg-slate-900/60 p-3 rounded-sm border-2 backdrop-blur-sm overflow-hidden",
            colors.border,
            colors.glow,
            isCritical && "animate-shake"
          )}>
            {/* Tech frame corners */}
            <div className={cn("absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2", colors.accent)} />
            <div className={cn("absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2", colors.accent)} />
            <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2", colors.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2", colors.accent)} />

            {/* Background scan effect */}
            <div className={cn(
              "absolute inset-0 opacity-20 animate-scan-vertical",
              "bg-gradient-to-b from-transparent via-white/10 to-transparent"
            )} />

            <div className="relative">
              <div className="text-[8px] font-mono opacity-40 uppercase mb-2 text-center tracking-[0.15em]">ROLL VALUE</div>
              <div className="flex justify-center">
                {/* 3D dice container */}
                <div className="relative perspective-200">
                  <div className={cn(
                    "relative w-16 h-16 bg-slate-950/80 rounded-sm flex items-center justify-center text-3xl font-mono font-black border-2 transition-all",
                    state.diceDisplay.hit !== undefined
                      ? `${colors.primary} ${colors.targetBorder} shadow-lg result-reveal`
                      : `${colors.primary}/30 ${colors.border} dice-spin`,
                    isCritical && "ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900"
                  )}>
                    {state.diceDisplay.hit ?? <span className="text-slate-700">···</span>}

                    {/* 3D depth effect */}
                    {state.diceDisplay.hit !== undefined && (
                      <>
                        <div className={cn("absolute top-1 left-1 w-1 h-1", colors.accent, "opacity-60")} />
                        <div className={cn("absolute top-1 right-1 w-1 h-1", colors.accent, "opacity-60")} />
                        <div className={cn("absolute bottom-1 left-1 w-1 h-1", colors.accent, "opacity-60")} />
                        <div className={cn("absolute bottom-1 right-1 w-1 h-1", colors.accent, "opacity-60")} />

                        {/* Inner glow for critical */}
                        {isCritical && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-sm animate-pulse" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Shadow for 3D effect */}
                  {state.diceDisplay.hit !== undefined && (
                    <div className="absolute -bottom-1 left-2 right-2 h-1 bg-black/50 blur-sm rounded-sm" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Target Value - Reference Display with 3D effect */}
          <div className="relative bg-slate-900/60 p-3 rounded-sm border-2 border-slate-700/50 backdrop-blur-sm overflow-hidden">
            {/* Tech frame corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-slate-600" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-slate-600" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-slate-600" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-slate-600" />

            <div className="text-[8px] font-mono opacity-40 uppercase mb-2 text-center tracking-[0.15em]">
              {state.actionType === 'grenade' ? 'TARGET RANGE' : 'DISTANCE'}
            </div>
            <div className="flex justify-center">
              {/* 3D dice container */}
              <div className="relative perspective-200">
                <div className="relative w-16 h-16 bg-slate-950/80 rounded-sm flex items-center justify-center text-3xl font-mono font-black border-2 border-slate-700 shadow-lg">
                  {state.parameters.distance}
                  {/* Tech decorations */}
                  <div className="absolute top-1 left-1 w-1 h-1 border-slate-600 opacity-40" />
                  <div className="absolute top-1 right-1 w-1 h-1 border-slate-600 opacity-40" />
                  <div className="absolute bottom-1 left-1 w-1 h-1 border-slate-600 opacity-40" />
                  <div className="absolute bottom-1 right-1 w-1 h-1 border-slate-600 opacity-40" />

                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-transparent rounded-sm pointer-events-none" />
                </div>

                {/* Shadow for 3D effect */}
                <div className="absolute -bottom-1 left-2 right-2 h-1 bg-black/50 blur-sm rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {isMelee && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {/* Attacker - Tactical Display with 3D effect */}
          <div className={cn(
            "relative bg-slate-900/60 p-3 rounded-sm border-2 backdrop-blur-sm overflow-hidden",
            colors.border,
            colors.glow
          )}>
            {/* Tech frame corners */}
            <div className={cn("absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2", colors.accent)} />
            <div className={cn("absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2", colors.accent)} />
            <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2", colors.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2", colors.accent)} />

            {/* Background scan effect */}
            <div className={cn(
              "absolute inset-0 opacity-10 animate-scan-vertical",
              "bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"
            )} />

            <div className="text-[8px] font-mono opacity-40 uppercase mb-2 text-center tracking-[0.15em]">ATTACKER</div>
            <div className="flex justify-center">
              {/* 3D dice container */}
              <div className="relative perspective-200">
                <div className={cn(
                  "relative w-16 h-16 bg-slate-950/80 rounded-sm flex items-center justify-center text-3xl font-mono font-black border-2 transition-all",
                  state.diceDisplay.meleeA !== undefined
                    ? `${colors.primary} ${colors.targetBorder} shadow-lg result-reveal`
                    : `${colors.primary}/30 ${colors.border} dice-spin`
                )}>
                  {state.diceDisplay.meleeA ?? <span className="text-slate-700">···</span>}
                  {state.diceDisplay.meleeA !== undefined && (
                    <>
                      <div className={cn("absolute top-1 left-1 w-1 h-1", colors.accent, "opacity-60")} />
                      <div className={cn("absolute top-1 right-1 w-1 h-1", colors.accent, "opacity-60")} />
                      <div className={cn("absolute bottom-1 left-1 w-1 h-1", colors.accent, "opacity-60")} />
                      <div className={cn("absolute bottom-1 right-1 w-1 h-1", colors.accent, "opacity-60")} />
                    </>
                  )}
                </div>

                {/* Shadow for 3D effect */}
                {state.diceDisplay.meleeA !== undefined && (
                  <div className="absolute -bottom-1 left-2 right-2 h-1 bg-black/50 blur-sm rounded-sm" />
                )}
              </div>
            </div>
          </div>

          {/* Defender - Hostile Display with 3D effect */}
          <div className="relative bg-slate-900/60 p-3 rounded-sm border-2 border-red-600/40 backdrop-blur-sm shadow-red-900/20 overflow-hidden">
            {/* Tech frame corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-red-500" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-red-500" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-red-500" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-red-500" />

            {/* Background scan effect */}
            <div className="absolute inset-0 opacity-10 animate-scan-vertical bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />

            <div className="text-[8px] font-mono opacity-40 uppercase mb-2 text-center tracking-[0.15em]">DEFENDER</div>
            <div className="flex justify-center">
              {/* 3D dice container */}
              <div className="relative perspective-200">
                <div className={cn(
                  "relative w-16 h-16 bg-slate-950/80 rounded-sm flex items-center justify-center text-3xl font-mono font-black border-2 transition-all",
                  state.diceDisplay.meleeD !== undefined
                    ? "text-red-400 border-red-500/30 shadow-lg result-reveal"
                    : "text-red-400/30 border-red-500/20 dice-spin"
                )}>
                  {state.diceDisplay.meleeD ?? state.parameters.targetMelee}
                  {state.diceDisplay.meleeD !== undefined && (
                    <>
                      <div className="absolute top-1 left-1 w-1 h-1 border-red-500 opacity-60" />
                      <div className="absolute top-1 right-1 w-1 h-1 border-red-500 opacity-60" />
                      <div className="absolute bottom-1 left-1 w-1 h-1 border-red-500 opacity-60" />
                      <div className="absolute bottom-1 right-1 w-1 h-1 border-red-500 opacity-60" />
                    </>
                  )}
                </div>

                {/* Shadow for 3D effect */}
                {state.diceDisplay.meleeD !== undefined && (
                  <div className="absolute -bottom-1 left-2 right-2 h-1 bg-black/50 blur-sm rounded-sm" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tech Loading Bar with enhanced effects */}
      <div className="w-full max-w-xs h-2 bg-slate-950/90 rounded-full overflow-hidden border border-slate-800 relative">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)`
        }} />

        {/* Animated progress bar */}
        <div className={cn(
          "h-full animate-in slide-in-from-left-full duration-1000 relative overflow-hidden",
          colors.primary
        )}>
          {/* Scanline effect inside bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1s_infinite]" />

          {/* Glowing leading edge */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-sm" />
        </div>

        {/* Status indicator dots */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
          <div className={cn("w-0.5 h-0.5 rounded-full animate-pulse", colors.primary)} />
          <div className={cn("w-0.5 h-0.5 rounded-full animate-pulse stagger-100", colors.primary)} />
          <div className={cn("w-0.5 h-0.5 rounded-full animate-pulse stagger-200", colors.primary)} />
        </div>
      </div>
    </div>
  );
}
