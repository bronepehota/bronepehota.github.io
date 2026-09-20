'use client';

import { AlertTriangle, Bomb, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedDice } from './AnimatedDice';

interface GrenadeBlastRulerProps {
  /** Impact point in steps from the thrower (best D6 roll) */
  grenadeDistance: number;
  /** Blast zone in steps (±1 step around the impact point) */
  blastZone: { minSteps: number; maxSteps: number };
  /** Player's step→cm factor from the global toggle (4 or 5) */
  factor: number;
  /** D6 === 1: the thrower is inside the blast zone */
  danger: boolean;
  /** Throw dice ( Tehnolog: one; community: one per rank, best precomputed upstream ) */
  throwRolls?: number[];
}

// Fixed track scale: max possible maxSteps is 7 (D6 = 6 + 1), so 8 keeps every
// throw on one consistent scale with clean per-step ticks.
const TOTAL_STEPS = 8;
const pct = (steps: number) => (steps / TOTAL_STEPS) * 100;

/**
 * GrenadeBlastRuler — the single throw block of the grenade results.
 *
 * Folds the old four blocks (danger banner, throw grid, verdict pill, ruler)
 * into one: verdict word as the title, throw dice beside it, impact readout in
 * cm on the right, tape-measure track below. cm comes from the player's
 * step→cm toggle (NOT the legacy ×4 minCm/maxCm fields — see combat-types).
 */
export function GrenadeBlastRuler({
  grenadeDistance,
  blastZone,
  factor,
  danger,
  throwRolls,
}: GrenadeBlastRulerProps) {
  const { minSteps, maxSteps } = blastZone;
  const minCm = minSteps * factor;
  const maxCm = maxSteps * factor;
  const impactCm = grenadeDistance * factor;
  const rolls = throwRolls ?? [];
  const bestRoll = rolls.length > 0 ? Math.max(...rolls) : undefined;

  return (
    <div
      data-testid="grenade-blast-ruler"
      data-danger={danger ? 'true' : undefined}
      className={cn(
        'bg-slate-900/80 p-3 rounded-lg border-2',
        danger ? 'border-red-600/50' : 'border-amber-600/40'
      )}
    >
      {/* Title row: verdict word + throw dice + impact readout */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          data-testid="grenade-throw-verdict"
          className={cn(
            'text-[10px] font-mono uppercase tracking-wider',
            danger ? 'text-red-400 font-black' : 'text-amber-400/60 font-bold'
          )}
        >
          {danger ? 'ОПАСНО' : 'ВЗРЫВ'}
        </span>
        {rolls.map((roll, i) => {
          const isBest = roll === bestRoll;
          return (
            <AnimatedDice
              key={i}
              value={roll}
              maxSide={6}
              color={isBest ? (danger ? 'red' : 'emerald') : 'blue'}
              size="sm"
              delay={i * 100}
              isHit={isBest}
              className={cn(!isBest && 'opacity-40')}
            />
          );
        })}
        <span
          data-testid="grenade-blast-impact"
          className={cn(
            'ml-auto font-mono font-black text-sm',
            danger ? 'text-red-400' : 'text-amber-400'
          )}
        >
          {impactCm} см
        </span>
      </div>

      {/* Danger: the thrower is inside their own blast */}
      {danger && (
        <div className="flex items-center gap-1.5 mt-1.5 text-red-400 font-mono text-[11px] uppercase tracking-wider animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Опасно! Вы в зоне взрыва!</span>
        </div>
      )}

      {/* Ruler body: markers above, track, cm labels below */}
      <div className="relative pt-6 mt-1">
        {/* Impact marker */}
        <div
          data-testid="grenade-blast-marker"
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${pct(grenadeDistance)}%` }}
        >
          <Bomb className={cn('w-4 h-4', danger ? 'text-red-400' : 'text-amber-300')} />
          <div className={cn('w-px h-2', danger ? 'bg-red-400/70' : 'bg-amber-400/70')} />
        </div>

        {/* Thrower at 0 */}
        <div className="absolute top-0 left-0 flex flex-col items-center">
          <Footprints className={cn('w-4 h-4', danger ? 'text-red-400' : 'text-slate-400')} />
          <div className={cn('w-px h-2', danger ? 'bg-red-400/70' : 'bg-slate-600/70')} />
        </div>

        {/* Track with per-step ticks */}
        <div className="relative h-2 rounded-sm bg-slate-800 border border-slate-700/50">
          {[...Array(TOTAL_STEPS - 1)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-y-0 w-px bg-slate-600/60"
              style={{ left: `${pct(i + 1)}%` }}
            />
          ))}

          {/* Danger: thrower's exposure — red segment from 0 to the zone start */}
          {danger && (
            <div
              className="absolute inset-y-0 left-0 rounded-l-sm bg-red-500/80 animate-pop-in"
              style={{ width: `${pct(minSteps)}%` }}
            />
          )}

          {/* Blast zone band */}
          <div
            data-testid="grenade-blast-band"
            className={cn(
              'absolute inset-y-0 rounded-sm border-x animate-pop-in',
              danger
                ? 'bg-red-500/80 border-red-300/50'
                : 'bg-amber-500/80 border-amber-300/50'
            )}
            style={{
              left: `${pct(minSteps)}%`,
              width: `${pct(maxSteps - minSteps)}%`,
            }}
          />
        </div>

        {/* cm labels at the band edges + steps reference on the right */}
        <div className="relative mt-1.5 h-4">
          <span className="absolute left-0 text-[10px] font-mono text-slate-500 leading-none">
            0
          </span>
          <span
            data-testid="grenade-blast-label-min"
            className="absolute -translate-x-1/2 text-[10px] font-mono font-black text-amber-400 leading-none whitespace-nowrap"
            style={{ left: `${pct(minSteps)}%` }}
          >
            {minCm} см
          </span>
          <span
            data-testid="grenade-blast-label-max"
            className="absolute -translate-x-1/2 text-[10px] font-mono font-black text-amber-400 leading-none whitespace-nowrap"
            style={{ left: `${pct(maxSteps)}%` }}
          >
            {maxCm} см
          </span>
          <span
            data-testid="grenade-blast-steps"
            className="absolute right-0 text-[10px] font-mono text-slate-500 leading-none whitespace-nowrap"
          >
            {minSteps}-{maxSteps} ШАГ
          </span>
        </div>
      </div>
    </div>
  );
}
