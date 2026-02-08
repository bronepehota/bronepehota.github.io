'use client';

import { useState, useEffect } from 'react';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Equal } from 'lucide-react';

/**
 * Gets the conversion factor based on rules version
 * @param rulesVersion - The rules version ('fan' or 'tehnolog')
 * @returns The conversion factor (cm per step)
 */
function getConversionFactor(rulesVersion: RulesVersionID): number {
  return rulesVersion === 'fan' ? 4 : 5;
}

/**
 * Converts steps to centimeters
 * @param steps - The number of steps
 * @param rulesVersion - The rules version
 * @returns The equivalent distance in centimeters
 */
function stepsToCm(steps: number, rulesVersion: RulesVersionID): number {
  return steps * getConversionFactor(rulesVersion);
}

/**
 * Converts centimeters to steps
 * @param cm - The distance in centimeters
 * @param rulesVersion - The rules version
 * @returns The equivalent number of steps (rounded)
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

/**
 * DistanceConverter - A bidirectional converter for steps and centimeters
 *
 * This component provides two synchronized inputs for distance:
 * - One in steps (game units)
 * - One in centimeters (physical distance)
 *
 * The conversion factor depends on the rules version:
 * - Fan rules: 1 step = 4 cm
 * - Tehnolog rules: 1 step = 5 cm
 *
 * Mobile-first design: compact single-row layout on mobile, side-by-side with equal sign on desktop.
 */
export function DistanceConverter({
  steps,
  onChange,
  rulesVersion,
  className,
  disabled = false,
}: DistanceConverterProps) {
  const [focusedField, setFocusedField] = useState<'steps' | 'cm' | null>(null);
  const [cm, setCm] = useState<number>(stepsToCm(steps, rulesVersion));

  // Sync cm value when steps prop changes from parent
  useEffect(() => {
    if (focusedField !== 'cm') {
      setCm(stepsToCm(steps, rulesVersion));
    }
  }, [steps, rulesVersion, focusedField]);

  const handleStepsChange = (newSteps: number) => {
    onChange(newSteps);
    setFocusedField('steps');
    setCm(stepsToCm(newSteps, rulesVersion));
  };

  const handleCmChange = (newCm: number) => {
    const newSteps = cmToSteps(newCm, rulesVersion);
    onChange(newSteps);
    setFocusedField('cm');
    setCm(newCm);
  };

  const handleStepsFocus = () => setFocusedField('steps');
  const handleCmFocus = () => setFocusedField('cm');
  const handleBlur = () => setFocusedField(null);

  const conversionFactor = getConversionFactor(rulesVersion);

  return (
    <div className={cn('space-y-1', className)}>
      {/* Distance Inputs - Mobile: compact single row, Desktop: side-by-side with equal sign */}
      <div className="grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] gap-2 md:gap-4 items-center">
        {/* Steps Input */}
        <div
          className={cn(
            'p-2 md:p-3 rounded-xl border-2 transition-all',
            focusedField === 'steps'
              ? 'bg-blue-900/20 border-blue-500'
              : 'bg-slate-800 border-slate-700'
          )}
        >
          <label className="block text-[10px] uppercase font-bold opacity-50 mb-1 md:mb-2 tracking-wider">
            Шагов
          </label>
          <NumberStepper
            value={steps}
            onChange={handleStepsChange}
            min={1}
            max={20}
            step={1}
            size="md"
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Equal Sign (Desktop) */}
        <div className="hidden md:flex items-center justify-center">
          <Equal className="w-6 h-6 text-slate-600" />
        </div>

        {/* Centimeters Input */}
        <div
          className={cn(
            'p-2 md:p-3 rounded-xl border-2 transition-all',
            focusedField === 'cm'
              ? 'bg-orange-900/20 border-orange-500'
              : 'bg-slate-800 border-slate-700'
          )}
        >
          <label className="block text-[10px] uppercase font-bold opacity-50 mb-1 md:mb-2 tracking-wider">
            Сантиметры
          </label>
          <NumberStepper
            value={cm}
            onChange={handleCmChange}
            min={conversionFactor}
            max={20 * conversionFactor}
            step={conversionFactor}
            size="md"
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>

      {/* Conversion hint text */}
      <div className="text-center text-[10px] text-slate-500 opacity-70">
        1 шаг = {conversionFactor} см
      </div>
    </div>
  );
}
