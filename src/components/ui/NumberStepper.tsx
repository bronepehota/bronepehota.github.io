'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  /** Скрывает ВИДИМЫЙ label (aria-label'ы остаются), когда родительская
   *  строка уже несёт свой заголовок — иначе двойные «Дистанция»/«Броня
   *  цели» (плейтест после #241) */
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** When set, the value becomes a tappable button (modal input) instead of a number input */
  onInputActivate?: () => void;
}

// Hold-to-repeat: a short tap is ±1; holding the button sweeps the range
const HOLD_DELAY_MS = 450;
const REPEAT_INTERVAL_MS = 140;

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  showLabel = true,
  className,
  size = 'md',
  disabled = false,
  onInputActivate,
}: NumberStepperProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const repeatTimerRef = useRef<number | null>(null);
  // Whether repeats already fired for this press — suppresses the trailing
  // click so a held sweep doesn't jump one extra step on release
  const repeatFiredRef = useRef(false);
  // Latest step functions — the interval calls through refs so each tick sees
  // the CURRENT value prop (controlled parents re-render between ticks; a
  // captured closure would freeze the sweep after one step)
  const applyRef = useRef<{ inc: () => void; dec: () => void }>({ inc: () => {}, dec: () => {} });

  const stopRepeat = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (repeatTimerRef.current !== null) {
      window.clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  useEffect(() => stopRepeat, [stopRepeat]);

  const startRepeat = useCallback((direction: 'inc' | 'dec') => {
    stopRepeat();
    repeatFiredRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      repeatFiredRef.current = true;
      repeatTimerRef.current = window.setInterval(() => {
        direction === 'inc' ? applyRef.current.inc() : applyRef.current.dec();
      }, REPEAT_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  }, [stopRepeat]);

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

  applyRef.current = { inc: increment, dec: decrement };

  const handleDecrementClick = () => {
    if (repeatFiredRef.current) {
      repeatFiredRef.current = false;
      return;
    }
    decrement();
  };

  const handleIncrementClick = () => {
    if (repeatFiredRef.current) {
      repeatFiredRef.current = false;
      return;
    }
    increment();
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
      {label && showLabel && (
        <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap min-w-fit">{label}</label>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrementClick}
          onPointerDown={() => !disabled && canDecrement && startRepeat('dec')}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          onFocus={() => { repeatFiredRef.current = false; }}
          disabled={!canDecrement || disabled}
          className={cn(
            buttonSizeClasses[size],
            'flex items-center justify-center rounded-lg transition-all active:scale-95',
            'bg-slate-700 hover:bg-slate-600 text-slate-300',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-700',
            'border border-slate-600',
            'touch-manipulation select-none'
          )}
          aria-label={`Decrease ${label || 'value'}`}
        >
          <Minus className={iconSizeClasses[size]} />
        </button>

        {onInputActivate ? (
          <button
            type="button"
            onClick={onInputActivate}
            disabled={disabled}
            className={cn(
              inputSizeClasses[size],
              'bg-slate-800 border-2 border-slate-600 rounded-lg',
              'flex items-center justify-center font-mono font-bold text-white',
              'text-center active:scale-95 transition-all touch-manipulation',
              'hover:border-slate-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label={`${label || 'value'} input`}
          >
            {value}
          </button>
        ) : (
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
        )}

        <button
          type="button"
          onClick={handleIncrementClick}
          onPointerDown={() => !disabled && canIncrement && startRepeat('inc')}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          onFocus={() => { repeatFiredRef.current = false; }}
          disabled={!canIncrement || disabled}
          className={cn(
            buttonSizeClasses[size],
            'flex items-center justify-center rounded-lg transition-all active:scale-95',
            'bg-slate-700 hover:bg-slate-600 text-slate-300',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-700',
            'border border-slate-600',
            'touch-manipulation select-none'
          )}
          aria-label={`Increase ${label || 'value'}`}
        >
          <Plus className={iconSizeClasses[size]} />
        </button>
      </div>
    </div>
  );
}
