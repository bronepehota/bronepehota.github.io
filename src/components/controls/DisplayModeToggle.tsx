'use client';

import React, { useEffect } from 'react';
import { List, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DisplayMode = 'detailed' | 'compact';

interface DisplayModeToggleProps {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

const STORAGE_KEY = 'bronepehota_display_mode';

export function DisplayModeToggle({ mode, onChange }: DisplayModeToggleProps) {
  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'detailed' || saved === 'compact') {
      onChange(saved);
    }
  }, [onChange]);

  // Persist to localStorage when mode changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return (
    <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/50">
      <button
        onClick={() => onChange('detailed')}
        aria-label="Подробный вид"
        aria-pressed={mode === 'detailed'}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
          'min-h-[44px] touch-manipulation',
          mode === 'detailed'
            ? 'bg-slate-700 text-slate-100 shadow-sm'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
        )}
        data-testid="display-mode-detailed"
      >
        <Grid3x3 className="w-4 h-4" />
        <span className="hidden sm:inline">Подробно</span>
      </button>
      <button
        onClick={() => onChange('compact')}
        aria-label="Компактный вид"
        aria-pressed={mode === 'compact'}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
          'min-h-[44px] touch-manipulation',
          mode === 'compact'
            ? 'bg-slate-700 text-slate-100 shadow-sm'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
        )}
        data-testid="display-mode-compact"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Компактно</span>
      </button>
    </div>
  );
}

export type { DisplayMode };
