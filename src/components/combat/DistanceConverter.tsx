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

  const toggleMode = () => {
    setMode((prev) => (prev === 'steps' ? 'cm' : 'steps'));
  };

  const isEditingSteps = mode === 'steps';
  const displaySteps = mode === 'steps' ? steps : cmToSteps(cmValue, stepToCmFactor);
  const displayCm = mode === 'cm' ? cmValue : stepsToCm(steps, stepToCmFactor);

  return (
    <div className={cn('space-y-1', className)}>
      {/* Main input row - matches ParameterInputs style */}
      <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
        {/* Label with mode toggle and sublabel */}
        <button
          type="button"
          onClick={toggleMode}
          disabled={disabled}
          className="text-left"
        >
          <div className="text-xs opacity-50 uppercase font-bold whitespace-nowrap hover:opacity-80 transition-opacity">
            {isEditingSteps ? 'Дистанция' : 'Расстояние'}
          </div>
          <div className="text-[9px] opacity-40 font-mono normal-case">
            {isEditingSteps ? 'шагов' : 'сантиметров'}
          </div>
        </button>

        {/* Input field */}
        <div className="relative">
          <NumberStepper
            value={isEditingSteps ? displaySteps : displayCm}
            onChange={isEditingSteps ? handleStepsChange : handleCmChange}
            min={isEditingSteps ? 1 : stepToCmFactor}
            max={isEditingSteps ? 20 : 20 * stepToCmFactor}
            step={isEditingSteps ? 1 : stepToCmFactor}
            size="lg"
            disabled={disabled}
            className="flex-1 justify-start"
          />

          {/* Other value hint */}
          <span className="absolute -bottom-4 left-0 text-[9px] text-slate-600 font-mono whitespace-nowrap">
            {isEditingSteps ? `${displayCm} см` : `${displaySteps} шаг`}
          </span>
        </div>
      </div>
    </div>
  );
}
