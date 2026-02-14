'use client';

import { useState, useEffect } from 'react';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Gets the conversion factor based on rules version
 */
function getConversionFactor(rulesVersion: RulesVersionID): number {
  return rulesVersion === 'community_star_system' ? 4 : 5;
}

/**
 * Converts steps to centimeters
 */
function stepsToCm(steps: number, rulesVersion: RulesVersionID): number {
  return steps * getConversionFactor(rulesVersion);
}

/**
 * Converts centimeters to steps
 */
function cmToSteps(cm: number, rulesVersion: RulesVersionID): number {
  return Math.round(cm / getConversionFactor(rulesVersion));
}

export interface DistanceConverterProps {
  /** Current distance in steps */
  steps: number;
  /** Callback when the distance changes (receives the new steps value) */
  onChange: (steps: number) => void;
  /** The rules version to use for conversion */
  rulesVersion: RulesVersionID;
  /** Optional CSS class name */
  className?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
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
 */
export function DistanceConverter({
  steps,
  onChange,
  rulesVersion,
  className,
  disabled = false,
}: DistanceConverterProps) {
  const [mode, setMode] = useState<DistanceMode>('steps');
  const [cmValue, setCmValue] = useState<number>(stepsToCm(steps, rulesVersion));

  const conversionFactor = getConversionFactor(rulesVersion);

  // Sync cm value when steps prop changes from parent
  useEffect(() => {
    if (mode === 'steps') {
      setCmValue(stepsToCm(steps, rulesVersion));
    }
  }, [steps, rulesVersion, mode]);

  const handleStepsChange = (newSteps: number) => {
    onChange(newSteps);
    setCmValue(stepsToCm(newSteps, rulesVersion));
  };

  const handleCmChange = (newCm: number) => {
    const newSteps = cmToSteps(newCm, rulesVersion);
    onChange(newSteps);
    setCmValue(newCm);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'steps' ? 'cm' : 'steps'));
  };

  const isEditingSteps = mode === 'steps';
  const displaySteps = mode === 'steps' ? steps : cmToSteps(cmValue, rulesVersion);
  const displayCm = mode === 'cm' ? cmValue : stepsToCm(steps, rulesVersion);

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
            min={isEditingSteps ? 1 : conversionFactor}
            max={isEditingSteps ? 20 : 20 * conversionFactor}
            step={isEditingSteps ? 1 : conversionFactor}
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
