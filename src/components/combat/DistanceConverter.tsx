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
 * The mode toggle is integrated into the label - tap to switch between steps/cm.
 * Now uses global stepToCmFactor instead of rules version for conversion.
 */
export function DistanceConverter({
  steps,
  onChange,
  rulesVersion: _rulesVersion = 'tehnolog',
  className,
  disabled = false,
  stepToCmFactor = 5,
  defaultMode = 'steps',
}: DistanceConverterProps) {
  const [mode, setMode] = useState<DistanceMode>(defaultMode);
  const [cmValue, setCmValue] = useState<number>(stepsToCm(steps, stepToCmFactor));

  // Sync mode when defaultMode changes (user changed distance unit preference)
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  // Sync cm value when steps prop changes from parent
  useEffect(() => {
    if (mode === 'steps') {
      setCmValue(stepsToCm(steps, stepToCmFactor));
    }
  }, [steps, stepToCmFactor, mode]);

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
          max={isEditingSteps ? 20 : 100}
          step={1}
          size="sm"
          disabled={disabled}
          className="flex-1"
        />

        {/* Secondary value hint */}
        <span className="text-sm md:text-base text-slate-500 font-mono whitespace-nowrap shrink-0">
          ({isEditingSteps ? `${hintCm} см` : `${hintSteps}шаг`})
        </span>
      </div>
    </div>
  );
}
