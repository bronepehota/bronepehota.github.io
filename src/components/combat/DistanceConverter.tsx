'use client';

import { useState, useEffect } from 'react';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Repeat } from 'lucide-react';

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

type DistanceMode = 'steps' | 'cm';

/**
 * DistanceConverter - A compact bidirectional converter for steps and centimeters
 *
 * This component provides a single input field with a mode toggle:
 * - Steps mode: edit steps, show centimeters as label
 * - Centimeters mode: edit cm, show steps as label
 *
 * The conversion factor depends on the rules version:
 * - Fan rules: 1 step = 4 cm
 * - Tehnolog rules: 1 step = 5 cm
 *
 * Compact unified design: works well on mobile and desktop
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
    setCmValue(stepsToCm(steps, rulesVersion));
  }, [steps, rulesVersion]);

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

  const displaySteps = mode === 'steps' ? steps : cmToSteps(cmValue, rulesVersion);
  const displayCm = mode === 'cm' ? cmValue : stepsToCm(steps, rulesVersion);
  const isEditingSteps = mode === 'steps';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Input Field with Mode Toggle */}
      <div className="flex items-center gap-2">
        {/* Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleMode}
          disabled={disabled}
          className={cn(
            'px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 min-w-[50px]',
            isEditingSteps
              ? 'bg-blue-900/30 border-2 border-blue-500 text-blue-400'
              : 'bg-orange-900/30 border-2 border-orange-500 text-orange-400'
          )}
          title={isEditingSteps ? 'Переключить на сантиметры' : 'Переключить на шаги'}
        >
          {isEditingSteps ? 'ШАГИ' : 'СМ'}
        </button>

        {/* Input Field */}
        <div className="flex-1 p-2 rounded-lg border-2 bg-slate-800 border-slate-700">
          <NumberStepper
            value={isEditingSteps ? displaySteps : displayCm}
            onChange={isEditingSteps ? handleStepsChange : handleCmChange}
            min={isEditingSteps ? 1 : conversionFactor}
            max={isEditingSteps ? 20 : 20 * conversionFactor}
            step={isEditingSteps ? 1 : conversionFactor}
            size="md"
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={toggleMode}
          disabled={disabled}
          className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-all shrink-0"
          title="Переключить единицы измерения"
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* Conversion Info */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
        <span className={cn(
          'font-mono',
          isEditingSteps ? 'text-white font-bold' : ''
        )}>
          {displaySteps} шагов
        </span>
        <span className="text-slate-600">=</span>
        <span className={cn(
          'font-mono',
          !isEditingSteps ? 'text-white font-bold' : ''
        )}>
          {displayCm} см
        </span>
        <span className="text-slate-600">(1 шаг = {conversionFactor} см)</span>
      </div>
    </div>
  );
}
