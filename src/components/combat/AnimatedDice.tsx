'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedDiceProps {
  value: number;
  maxSide?: 6 | 12 | 20;
  color?: 'blue' | 'emerald' | 'red' | 'orange' | 'cyan' | 'purple' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  isHit?: boolean;
  bonus?: number;
  total?: number;
  targetValue?: number;
  resultLabel?: 'hit' | 'miss' | 'none';
  className?: string;
}

interface AnimatedDiceGroupProps {
  values: number[];
  maxSide?: 6 | 12 | 20;
  color?: 'blue' | 'emerald' | 'red' | 'orange' | 'cyan' | 'purple' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  staggerDelay?: number;
  highlightFn?: (value: number, index: number) => boolean;
  className?: string;
}

const colorConfig = {
  blue: {
    bg: 'bg-blue-950/60',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30',
    accent: 'bg-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/30',
    accent: 'bg-emerald-600',
  },
  red: {
    bg: 'bg-red-950/60',
    border: 'border-red-500/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/30',
    accent: 'bg-red-600',
  },
  orange: {
    bg: 'bg-orange-950/60',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/30',
    accent: 'bg-orange-600',
  },
  cyan: {
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/30',
    accent: 'bg-cyan-600',
  },
  purple: {
    bg: 'bg-purple-950/60',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/30',
    accent: 'bg-purple-600',
  },
  amber: {
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30',
    accent: 'bg-amber-600',
  },
};

const sizeConfig = {
  sm: { box: 'w-12 h-12 text-xl', text: 'text-xl' },
  md: { box: 'w-16 h-16 text-3xl', text: 'text-3xl' },
  lg: { box: 'w-20 h-20 text-4xl', text: 'text-4xl' },
};

export function AnimatedDice({
  value,
  maxSide = 6,
  color = 'blue',
  size = 'md',
  delay = 0,
  isHit: _isHit = true,
  bonus,
  total,
  targetValue,
  resultLabel = 'none',
  className,
}: AnimatedDiceProps) {
  const [displayValue, setDisplayValue] = useState(1);
  const [isRolling, setIsRolling] = useState(true);
  const [hasLanded, setHasLanded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const colors = colorConfig[color];
  const sizes = sizeConfig[size];

  useEffect(() => {
    // Start rolling animation after delay
    const startTimeout = setTimeout(() => {
      // Rolling phase - cycle through random numbers rapidly
      let rollCount = 0;
      const totalRolls = 15 + Math.floor(Math.random() * 10); // 15-25 rolls

      intervalRef.current = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * maxSide) + 1);
        rollCount++;

        // Slow down towards the end
        if (rollCount >= totalRolls) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setDisplayValue(value);
          setIsRolling(false);

          // Trigger land animation
          setTimeout(() => setHasLanded(true), 50);
        }
      }, 50 + Math.floor(rollCount * 3)); // Gradually slow down
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [value, maxSide, delay]);

  return (
    <div className={cn("relative flex items-center gap-2 pb-8", className)}>
      {/* Glow effect when landed */}
      {hasLanded && (
        <div
          className={cn(
            "absolute inset-0 rounded-xl blur-xl opacity-60 animate-pulse",
            colors.accent
          )}
        />
      )}

      {/* Dice container with 3D perspective */}
      <div
        className={cn(
          "relative rounded-xl border-2 flex items-center justify-center font-mono font-black",
          "transition-all duration-300 transform-gpu",
          sizes.box,
          colors.bg,
          colors.border,
          isRolling && "animate-dice-roll",
          hasLanded && "animate-dice-land shadow-lg",
          hasLanded && colors.glow
        )}
        style={{
          perspective: '200px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Inner shadow for depth */}
        <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none" />

        {/* Corner accents */}
        <div className={cn("absolute top-0.5 left-0.5 w-1.5 h-1.5 border-l border-t opacity-40", colors.border)} />
        <div className={cn("absolute top-0.5 right-0.5 w-1.5 h-1.5 border-r border-t opacity-40", colors.border)} />
        <div className={cn("absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-l border-b opacity-40", colors.border)} />
        <div className={cn("absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-r border-b opacity-40", colors.border)} />

        {/* Dice value */}
        <span
          className={cn(
            "relative z-10 transition-all duration-200",
            sizes.text,
            colors.text,
            isRolling && "opacity-90",
            hasLanded && "animate-bounce-subtle"
          )}
        >
          {displayValue}
        </span>

        {/* Rolling motion blur effect */}
        {isRolling && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn("w-8 h-8 rounded-full blur-md opacity-30", colors.accent)} />
          </div>
        )}

        {/* Bonus badge on dice */}
        {hasLanded && bonus !== undefined && bonus > 0 && (
          <div
            className={cn(
              "absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full border-2 flex items-center justify-center",
              "bg-emerald-600 border-emerald-400 text-white",
              "animate-pop-in font-mono text-sm font-black"
            )}
          >
            +{bonus}
          </div>
        )}
      </div>

      {/* Result label plate - positioned below dice */}
      {hasLanded && resultLabel !== 'none' && (
        <div className={cn(
          "absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap",
          "px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-black uppercase tracking-wider animate-pop-in",
          resultLabel === 'hit'
            ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
            : "bg-red-950/80 border-red-500/50 text-red-400"
        )}>
          {resultLabel === 'hit' ? 'ПОПАДАНИЕ' : 'ПРОМАХ'}
          {total !== undefined && targetValue !== undefined && (
            <span className="ml-2 opacity-70">
              {total}:{targetValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Multiple dice for damage rolls
export function AnimatedDiceGroup({
  values,
  maxSide = 20,
  color = 'orange',
  size = 'sm',
  staggerDelay = 100,
  highlightFn,
  className,
}: AnimatedDiceGroupProps) {
  return (
    <div className={cn("flex gap-2 flex-wrap justify-center", className)}>
      {values.map((value, index) => (
        <AnimatedDice
          key={index}
          value={value}
          maxSide={maxSide}
          color={color}
          size={size}
          delay={index * staggerDelay}
          isHit={highlightFn ? highlightFn(value, index) : true}
        />
      ))}
    </div>
  );
}
