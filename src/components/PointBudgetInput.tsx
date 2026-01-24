'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Coins, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface PointBudgetInputProps {
  presets: number[];
  value?: number;
  onChange: (value: number) => void;
  onNext?: () => void;
  disabled?: boolean;
}

/**
 * PointBudgetInput - Configure army point budget with presets and custom input
 *
 * Accessibility (FR-022, FR-023, FR-028):
 * - Keyboard: Tab to navigate, Enter to select preset, Escape to clear input
 * - ARIA: aria-pressed for presets, aria-invalid, aria-describedby for input
 *
 * Mobile (FR-025, FR-027):
 * - Breakpoints: <768px (mobile), 768-1024px (tablet), >1024px (desktop)
 * - Touch targets: 44x44px minimum, 48px height for buttons
 * - Numeric keyboard: type="number"
 */
export function PointBudgetInput({
  presets,
  value,
  onChange,
  onNext,
  disabled = false,
}: PointBudgetInputProps) {
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState('');

  const validateInput = (input: string): number | null => {
    if (!input) {
      setError('Введите количество очков');
      return null;
    }

    const num = parseInt(input, 10);

    if (isNaN(num)) {
      setError('Введите число');
      return null;
    }

    if (num <= 0) {
      setError('Введите положительное число');
      return null;
    }

    if (num > 10000) {
      setError('Максимум 10000 очков');
      return null;
    }

    setError('');
    return num;
  };

  const handlePresetClick = (preset: number) => {
    setCustomValue('');
    setError('');
    onChange(preset);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomValue(inputValue);

    const validated = validateInput(inputValue);
    if (validated !== null) {
      onChange(validated);
    }
  };

  const handleCustomBlur = () => {
    const validated = validateInput(customValue);
    if (validated !== null) {
      onChange(validated);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setCustomValue('');
      setError('');
    }
  };

  const isPresetSelected = (preset: number) => value === preset && !customValue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coins className="w-6 h-6 text-slate-500" />
          <h3 className="text-2xl font-bold text-slate-200 font-mono tracking-wider">ОЧКИ АРМИИ</h3>
          <Coins className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm text-slate-400">Выберите лимит очков для вашей армии</p>
        <p className="text-xs text-slate-500">Чем больше очков, тем больше юнитов вы можете добавить</p>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {presets.map((preset) => (
          <button
            key={preset}
            role="button"
            aria-pressed={isPresetSelected(preset)}
            aria-label={`${preset} очков`}
            onClick={() => handlePresetClick(preset)}
            disabled={disabled}
            className={clsx(
              'relative font-mono text-sm font-bold transition-all',
              'border min-h-[48px] min-w-[44px] touch-manipulation',
              'hover:scale-102 active:scale-95',
              disabled
                ? 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                : isPresetSelected(preset)
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400 ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-500'
                  : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
            )}
          >
            {preset === 350 && !value && !customValue && (
              <div className="absolute -top-1 -right-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5" />
                РЕКОМ.
              </div>
            )}
            {preset}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="space-y-2">
        <label htmlFor="custom-budget" className="block text-sm font-mono text-slate-400">
          ИЛИ ВВЕДИТЕ СВОЁ ЗНАЧЕНИЕ:
        </label>
        <div className="relative">
          <input
            id="custom-budget"
            type="number"
            value={customValue}
            onChange={handleCustomChange}
            onBlur={handleCustomBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? 'budget-error' : undefined}
            placeholder="0000"
            className={clsx(
              'w-full px-4 py-3 bg-slate-800/80 border-2 rounded-lg text-slate-200 font-mono text-center',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] transition-all',
              error ? 'border-red-500' : 'border-slate-600 focus:border-blue-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
            ОЧКОВ
          </span>
        </div>
        {error && (
          <p id="budget-error" role="alert" aria-live="assertive" className="text-sm text-red-400 flex items-center gap-2">
            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
            {error}
          </p>
        )}
      </div>

      {/* Next button */}
      {onNext && (
        <div className="pt-2 flex justify-center">
          <button
            onClick={onNext}
            disabled={disabled || !value || !!error}
            aria-disabled={!value || !!error}
            className={clsx(
              'px-8 py-3 font-mono text-sm font-bold uppercase tracking-wider',
              'border transition-all min-h-[48px] min-w-[44px]',
              'hover:scale-105 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              value ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-600 bg-slate-700 text-slate-400'
            )}
          >
            НАЧАТЬ СБОР АРМИИ
          </button>
        </div>
      )}
    </div>
  );
}
