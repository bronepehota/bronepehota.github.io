'use client';

import { CombatFlowState } from '@/lib/combat-types';
import { cn } from '@/lib/utils';

interface DiceAnimationProps {
  state: CombatFlowState;
}

export function DiceAnimation({ state }: DiceAnimationProps) {
  const isShot = state.actionType === 'shot' || state.actionType === 'grenade';
  const isMelee = state.actionType === 'melee';

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {/* Rolling indicator */}
      <div className="text-center">
        <div className="text-2xl font-black text-blue-400 animate-pulse">
          Бросаем кубики...
        </div>
      </div>

      {/* Dice visuals */}
      {isShot && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {/* Your Roll */}
          <div className="bg-slate-800 p-4 rounded-xl border-2 border-blue-500/50 animate-pulse">
            <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Ваш бросок</div>
            <div className="flex justify-center">
              <div className={cn(
                "w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black border-2",
                state.diceDisplay.hit !== undefined
                  ? "text-blue-400 border-blue-500/30"
                  : "text-blue-400/50 border-blue-500/20 animate-spin"
              )}>
                {state.diceDisplay.hit ?? '?'}
              </div>
            </div>
          </div>

          {/* Target Value */}
          <div className="bg-slate-800 p-4 rounded-xl border-2 border-orange-500/50">
            <div className="text-[10px] opacity-50 uppercase mb-2 text-center">
              {state.actionType === 'grenade' ? 'Цель (шагов)' : 'Дистанция цели'}
            </div>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black text-orange-400 border-2 border-orange-500/30">
                {state.parameters.distance}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMelee && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {/* Attacker */}
          <div className="bg-slate-800 p-4 rounded-xl border-2 border-blue-500/50 animate-pulse">
            <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Вы</div>
            <div className="flex justify-center">
              <div className={cn(
                "w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black border-2",
                state.diceDisplay.meleeA !== undefined
                  ? "text-blue-400 border-blue-500/30"
                  : "text-blue-400/50 border-blue-500/20 animate-spin"
              )}>
                {state.diceDisplay.meleeA ?? '?'}
              </div>
            </div>
          </div>

          {/* Defender */}
          <div className="bg-slate-800 p-4 rounded-xl border-2 border-red-500/50">
            <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Цель</div>
            <div className="flex justify-center">
              <div className={cn(
                "w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black border-2",
                state.diceDisplay.meleeD !== undefined
                  ? "text-red-400 border-red-500/30"
                  : "text-red-400/50 border-red-500/20 animate-spin"
              )}>
                {state.diceDisplay.meleeD ?? state.parameters.targetMelee}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading bar */}
      <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-in slide-in-from-left-full duration-1000" />
      </div>
    </div>
  );
}
