'use client';

import { CombatFlowState } from '@/lib/combat-types';
import { cn } from '@/lib/utils';

interface DiceAnimationProps {
  state: CombatFlowState;
}

// Action type colors for dice
const getActionColors = (actionType: string) => {
  const colorMap = {
    shot: {
      primary: 'text-orange-400',
      border: 'border-orange-500/50',
      bg: 'bg-orange-500/10',
      accent: 'border-orange-500',
      target: 'text-orange-400',
      targetBorder: 'border-orange-500/30'
    },
    melee: {
      primary: 'text-blue-400',
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      accent: 'border-blue-500',
      target: 'text-red-400',
      targetBorder: 'border-red-500/30'
    },
    grenade: {
      primary: 'text-green-400',
      border: 'border-green-500/50',
      bg: 'bg-green-500/10',
      accent: 'border-green-500',
      target: 'text-green-400',
      targetBorder: 'border-green-500/30'
    }
  };
  return colorMap[actionType as keyof typeof colorMap] || colorMap.shot;
};

export function DiceAnimation({ state }: DiceAnimationProps) {
  const isShot = state.actionType === 'shot' || state.actionType === 'grenade';
  const isMelee = state.actionType === 'melee';
  const colors = getActionColors(state.actionType || 'shot');

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {/* Rolling indicator */}
      <div className="text-center">
        <div className={cn(
          "text-lg md:text-xl font-mono font-bold uppercase tracking-wider animate-pulse",
          colors.primary
        )}>
          Бросаем кубики...
        </div>
      </div>

      {/* Dice visuals */}
      {isShot && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {/* Your Roll */}
          <div className={cn(
            "relative bg-slate-800/80 p-4 rounded-xl border-2 backdrop-blur-sm",
            colors.border
          )}>
            {/* Corner accents */}
            <div className={cn("absolute top-0 left-0 w-2 h-2 border-l border-t", colors.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r border-b", colors.accent)} />

            <div className="text-[10px] font-mono opacity-50 uppercase mb-2 text-center tracking-wider">Бросок</div>
            <div className="flex justify-center">
              <div className={cn(
                "relative w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-3xl font-mono font-black border-2 transition-all",
                state.diceDisplay.hit !== undefined
                  ? `${colors.primary} ${colors.targetBorder}`
                  : `${colors.primary}/50 ${colors.border} animate-spin`
              )}>
                {state.diceDisplay.hit ?? '?'}
                {/* Corner accents on dice */}
                {state.diceDisplay.hit !== undefined && (
                  <>
                    <div className={cn("absolute top-0.5 left-0.5 w-1.5 h-1.5 border-l border-t opacity-50", colors.accent)} />
                    <div className={cn("absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-r border-b opacity-50", colors.accent)} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Target Value */}
          <div className="relative bg-slate-800/80 p-4 rounded-xl border-2 border-slate-700/50 backdrop-blur-sm">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-slate-600" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-slate-600" />

            <div className="text-[10px] font-mono opacity-50 uppercase mb-2 text-center tracking-wider">
              {state.actionType === 'grenade' ? 'Цель (шагов)' : 'Дистанция'}
            </div>
            <div className="flex justify-center">
              <div className="relative w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-3xl font-mono font-black border-2 border-slate-600">
                {state.parameters.distance}
                {/* Corner accents on dice */}
                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-l border-t opacity-30 border-slate-500" />
                <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-r border-b opacity-30 border-slate-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {isMelee && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {/* Attacker */}
          <div className={cn(
            "relative bg-slate-800/80 p-4 rounded-xl border-2 backdrop-blur-sm animate-pulse",
            colors.border
          )}>
            {/* Corner accents */}
            <div className={cn("absolute top-0 left-0 w-2 h-2 border-l border-t", colors.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r border-b", colors.accent)} />

            <div className="text-[10px] font-mono opacity-50 uppercase mb-2 text-center tracking-wider">Атакующий</div>
            <div className="flex justify-center">
              <div className={cn(
                "relative w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-3xl font-mono font-black border-2 transition-all",
                state.diceDisplay.meleeA !== undefined
                  ? `${colors.primary} ${colors.targetBorder}`
                  : `${colors.primary}/50 ${colors.border} animate-spin`
              )}>
                {state.diceDisplay.meleeA ?? '?'}
                {state.diceDisplay.meleeA !== undefined && (
                  <>
                    <div className={cn("absolute top-0.5 left-0.5 w-1.5 h-1.5 border-l border-t opacity-50", colors.accent)} />
                    <div className={cn("absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-r border-b opacity-50", colors.accent)} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Defender */}
          <div className="relative bg-slate-800/80 p-4 rounded-xl border-2 border-red-500/50 backdrop-blur-sm">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-red-500" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-red-500" />

            <div className="text-[10px] font-mono opacity-50 uppercase mb-2 text-center tracking-wider">Защитник</div>
            <div className="flex justify-center">
              <div className={cn(
                "relative w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center text-3xl font-mono font-black border-2 transition-all",
                state.diceDisplay.meleeD !== undefined
                  ? "text-red-400 border-red-500/30"
                  : "text-red-400/50 border-red-500/20 animate-spin"
              )}>
                {state.diceDisplay.meleeD ?? state.parameters.targetMelee}
                {state.diceDisplay.meleeD !== undefined && (
                  <>
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-l border-t opacity-50 border-red-500" />
                    <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-r border-b opacity-50 border-red-500" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading bar */}
      <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div className={cn(
          "h-full animate-in slide-in-from-left-full duration-1000",
          colors.primary
        )} style={{ backgroundColor: 'currentColor' }} />
      </div>
    </div>
  );
}
