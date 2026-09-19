'use client';

import { Bomb, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrenadeBlastRulerProps {
  /** Impact point in steps from the thrower (best D6 roll) */
  grenadeDistance: number;
  /** Blast zone in steps (±1 step around the impact point) */
  blastZone: { minSteps: number; maxSteps: number };
  /** Player's step→cm factor from the global toggle (4 or 5) */
  factor: number;
  /** D6 === 1: the thrower is inside the blast zone */
  danger: boolean;
}

// Fixed track scale: max possible maxSteps is 7 (D6 = 6 + 1), so 8 keeps every
// throw on one consistent scale with clean per-step ticks.
const TOTAL_STEPS = 8;
const pct = (steps: number) => (steps / TOTAL_STEPS) * 100;

/**
 * GrenadeBlastRuler — tape-measure visualization of the blast zone.
 *
 * Shows the thrower at 0, the impact marker at the rolled distance and the
 * ±1-step blast band, labeled in cm computed from the player's step→cm toggle
 * (NOT the legacy ×4 minCm/maxCm fields on the result — see combat-types).
 */
export function GrenadeBlastRuler({
  grenadeDistance,
  blastZone,
  factor,
  danger,
}: GrenadeBlastRulerProps) {
  const { minSteps, maxSteps } = blastZone;
  const minCm = minSteps * factor;
  const maxCm = maxSteps * factor;
  const impactCm = grenadeDistance * factor;

  return (
    <div
      data-testid="grenade-blast-ruler"
      data-danger={danger ? 'true' : undefined}
      className="bg-slate-900/80 p-3 rounded-lg border-2 border-amber-600/40"
    >
      {/* Header: label + impact readout in cm */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/60">
          Линейка взрыва
        </span>
        <span
          data-testid="grenade-blast-impact"
          className={cn(
            "font-mono font-black text-sm",
            danger ? "text-red-400" : "text-amber-400"
          )}
        >
          {impactCm} см
        </span>
      </div>

      {/* Ruler body: markers above, track, cm labels below */}
      <div className="relative pt-6">
        {/* Impact marker */}
        <div
          data-testid="grenade-blast-marker"
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${pct(grenadeDistance)}%` }}
        >
          <Bomb className={cn("w-4 h-4", danger ? "text-red-400" : "text-amber-300")} />
          <div className={cn("w-px h-2", danger ? "bg-red-400/70" : "bg-amber-400/70")} />
        </div>

        {/* Thrower at 0 */}
        <div className="absolute top-0 left-0 flex flex-col items-center">
          <Footprints className={cn("w-4 h-4", danger ? "text-red-400" : "text-slate-400")} />
          <div className={cn("w-px h-2", danger ? "bg-red-400/70" : "bg-slate-600/70")} />
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
              "absolute inset-y-0 rounded-sm border-x animate-pop-in",
              danger
                ? "bg-red-500/80 border-red-300/50"
                : "bg-amber-500/80 border-amber-300/50"
            )}
            style={{
              left: `${pct(minSteps)}%`,
              width: `${pct(maxSteps - minSteps)}%`,
            }}
          />
        </div>

        {/* cm labels at the band edges */}
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
        </div>
      </div>
    </div>
  );
}
