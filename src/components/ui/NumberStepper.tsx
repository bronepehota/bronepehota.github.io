'use client';

import { useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  className,
  size = 'md',
  disabled = false,
}: NumberStepperProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const decrement = () => {
    const newValue = Math.max(min, value - step);
    if (newValue !== value) {
      onChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const increment = () => {
    const newValue = Math.min(max, value + step);
    if (newValue !== value) {
      onChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsed = parseInt(newValue);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseInt(inputValue);
    if (isNaN(parsed)) {
      setInputValue(value.toString());
    } else {
      const clamped = Math.max(min, Math.min(max, parsed));
      setInputValue(clamped.toString());
      onChange(clamped);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Select all text when focused for easy overwriting
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const canDecrement = value > min;
  const canIncrement = value < max;

  const _sizeClasses = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg',
  };

  const inputSizeClasses = {
    sm: 'w-14 h-10 text-sm',
    md: 'w-16 h-12 text-base',
    lg: 'w-20 h-14 text-lg',
  };

  const buttonSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && (
        <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap min-w-fit">{label}</label>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={decrement}
          disabled={!canDecrement || disabled}
          className={cn(
            buttonSizeClasses[size],
            'flex items-center justify-center rounded-lg transition-all active:scale-95',
            'bg-slate-700 hover:bg-slate-600 text-slate-300',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-700',
            'border border-slate-600'
          )}
          aria-label={`Decrease ${label || 'value'}`}
        >
          <Minus className={iconSizeClasses[size]} />
        </button>

        <input
          ref={inputRef}
          type="number"
          value={isFocused ? inputValue : value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={cn(
            inputSizeClasses[size],
            'bg-slate-800 border-2 border-slate-600 rounded-lg',
            'flex items-center justify-center font-mono font-bold text-white',
            'text-center focus:outline-none focus:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Remove spinner buttons
            '[&_::-webkit-inner-spin-button]:m-0 [&_::-webkit-inner-spin-button]:appearance-none',
            '[&_::-webkit-outer-spin-button]:m-0 [&_::-webkit-outer-spin-button]:appearance-none',
            '-moz-appearance-none appearance-none'
          )}
          aria-label={`${label || 'value'} input`}
        />

        <button
          type="button"
          onClick={increment}
          disabled={!canIncrement || disabled}
          className={cn(
            buttonSizeClasses[size],
            'flex items-center justify-center rounded-lg transition-all active:scale-95',
            'bg-slate-700 hover:bg-slate-600 text-slate-300',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-700',
            'border border-slate-600'
          )}
          aria-label={`Increase ${label || 'value'}`}
        >
          <Plus className={iconSizeClasses[size]} />
        </button>
      </div>
    </div>
  );
}
