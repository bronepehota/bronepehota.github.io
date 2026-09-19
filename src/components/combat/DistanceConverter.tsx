'use client';

import { useState, useEffect } from 'react';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { stepsToCm, cmToSteps } from '@/lib/distance-utils';

export interface DistanceConverterProps {
  /** Current distance in steps */
  steps: number;
  /** Callback when the distance changes (receives the new steps value) */
  onChange: (steps: number) => void;
  /** The rules version (kept for backwards compatibility, but not used for conversion) */
  rulesVersion?: RulesVersionID;
  /** Optional CSS class name */
  className?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Step to cm conversion factor (4 or 5) - overrides rules version */
  stepToCmFactor?: number;
  /** Default mode (respects global distanceInputUnit setting) */
  defaultMode?: 'steps' | 'cm';
  /** When set, the value becomes a tappable button (modal input) instead of a number input */
  onInputActivate?: () => void;
}

type DistanceMode = 'steps' | 'cm';

/**
 * DistanceConverter - Compact bidirectional converter matching ParameterInputs style
 *
 * Matches the design pattern used by other parameter fields:
 * - Label on left (100px width)
 * - Input on right (flex-1)
 * - Same size="lg" and spacing
 *
 * The unit (steps/cm) is controlled by the parent via defaultMode; the
 * «ШАГИ|СМ» switch lives in the quick-input modal (DiceInputPopup.unitSwitch).
 * Conversion uses the global stepToCmFactor, not the rules version.
 */
export function DistanceConverter({
  steps,
  onChange,
  rulesVersion: _rulesVersion = 'tehnolog',
  className,
  disabled = false,
  stepToCmFactor = 5,
  defaultMode = 'steps',
  onInputActivate,
}: DistanceConverterProps) {
  const mode: DistanceMode = defaultMode;
  const [cmValue, setCmValue] = useState<number>(stepsToCm(steps, stepToCmFactor));

  // Sync cm value when steps prop changes from parent.
  // In cm mode, typed values round-trip (cmToSteps(cmValue) === steps) and are
  // kept as typed; an external steps change (e.g. the quick-input modal) that
  // does NOT match the current cm display resyncs it.
  useEffect(() => {
    if (mode === 'steps') {
      setCmValue(stepsToCm(steps, stepToCmFactor));
    } else if (cmToSteps(cmValue, stepToCmFactor) !== steps) {
      setCmValue(stepsToCm(steps, stepToCmFactor));
    }
  }, [steps, stepToCmFactor, mode, cmValue]);

  const handleStepsChange = (newSteps: number) => {
    onChange(newSteps);
    setCmValue(stepsToCm(newSteps, stepToCmFactor));
  };

  const handleCmChange = (newCm: number) => {
    const newSteps = cmToSteps(newCm, stepToCmFactor);
    onChange(newSteps);
    setCmValue(newCm);
  };

  const isEditingSteps = mode === 'steps';
  const stepperValue = isEditingSteps ? steps : cmValue;
  const hintCm = stepsToCm(steps, stepToCmFactor);
  const hintSteps = cmToSteps(cmValue, stepToCmFactor);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* Label row */}
      <div className="text-[10px] md:text-xs opacity-50 uppercase font-bold">
        Дистанция
      </div>

      {/* Input row with inline hint */}
      <div className="flex items-center gap-2">
        <NumberStepper
          value={stepperValue}
          onChange={isEditingSteps ? handleStepsChange : handleCmChange}
          min={1}
          max={isEditingSteps ? 40 : 200}
          step={1}
          size="md"
          disabled={disabled}
          className="flex-1"
          label="Дистанция"
          onInputActivate={onInputActivate}
        />

        {/* Secondary value hint */}
        <span className="text-sm md:text-base text-slate-500 font-mono whitespace-nowrap shrink-0">
          ({isEditingSteps ? `${hintCm} см` : `${hintSteps}шаг`})
        </span>
      </div>
    </div>
  );
}
