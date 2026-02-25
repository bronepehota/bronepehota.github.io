'use client';

import { parseRoll } from '@/lib/game-logic';
import { cn } from '@/lib/utils';

interface DiceNotationDisplayProps {
  rollStr: string;
  color?: 'blue' | 'orange' | 'red' | 'cyan';
  className?: string;
}

const colorConfig = {
  blue: {
    frame: 'border-blue-500/50 bg-blue-950/50 text-blue-400',
    bonus: 'text-blue-300',
    count: 'text-blue-400/70',
  },
  orange: {
    frame: 'border-orange-500/50 bg-orange-950/50 text-orange-400',
    bonus: 'text-orange-300',
    count: 'text-orange-400/70',
  },
  red: {
    frame: 'border-red-500/50 bg-red-950/50 text-red-400',
    bonus: 'text-red-300',
    count: 'text-red-400/70',
  },
  cyan: {
    frame: 'border-cyan-500/50 bg-cyan-950/50 text-cyan-400',
    bonus: 'text-cyan-300',
    count: 'text-cyan-400/70',
  },
};

export function DiceNotationDisplay({
  rollStr,
  color = 'blue',
  className,
}: DiceNotationDisplayProps) {
  const { dice, sides, bonus } = parseRoll(rollStr);
  const colorClasses = colorConfig[color];

  // Handle special cases like "ББ" for melee
  if (dice === 0) {
    return (
      <span className={cn("font-black text-lg", colorClasses.frame, className)}>
        {rollStr}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Count multiplier (only if more than 1 die) */}
      {dice > 1 && (
        <span className={cn("text-sm font-bold", colorClasses.count)}>
          {dice}×
        </span>
      )}

      {/* Dice frame */}
      <span className={cn(
        "inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md border-2 font-black text-base",
        colorClasses.frame
      )}>
        D{sides}
      </span>

      {/* Bonus (shown larger if present) */}
      {bonus > 0 && (
        <span className={cn("text-lg font-black", colorClasses.bonus)}>
          +{bonus}
        </span>
      )}
    </div>
  );
}
