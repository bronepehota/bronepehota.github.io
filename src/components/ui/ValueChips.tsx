'use client';

import { cn } from '@/lib/utils';

interface ValueChipsProps {
  /** Quick-pick values, rendered as-is in order */
  values: number[];
  /** Currently selected value (gets the selected treatment) */
  selected?: number;
  onSelect: (value: number) => void;
  /** Compact variant for tight panels (grenade arming panel) */
  compact?: boolean;
  /** Relative usage frequency per value (0..1) — renders the 2px usage bar */
  freq?: number[];
  testId?: string;
}

/**
 * ValueChips — one-tap quick-pick row for numeric parameters.
 *
 * Visual language borrowed from DiceInputPopup's quick grid / recent chips
 * (selected = cyan, matching the «Тип цели» segmented control in the modal).
 */
export function ValueChips({
  values,
  selected,
  onSelect,
  compact = false,
  freq,
  testId,
}: ValueChipsProps) {
  return (
    <div data-testid={testId} className="flex flex-wrap gap-1.5">
      {values.map((v, i) => {
        const isSelected = selected === v;
        const freqRatio = freq?.[i] ?? 0;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={cn(
              'relative rounded-md border font-mono font-bold transition-all active:scale-90 touch-manipulation',
              compact
                ? 'px-2 py-1 min-h-[32px] text-xs'
                : 'px-3 py-1.5 min-h-[36px] text-xs',
              isSelected
                ? 'border-cyan-600/60 bg-cyan-950/50 text-cyan-300'
                : 'border-slate-700/80 bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:border-slate-600'
            )}
          >
            <span className="tracking-wider">{v}</span>
            {freqRatio > 0 && (
              <div className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400/60"
                  style={{ width: `${Math.max(20, freqRatio * 100)}%` }}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
