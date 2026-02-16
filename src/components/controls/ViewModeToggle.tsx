'use client';

import React from 'react';
import { FolderOpen, Shield } from 'lucide-react';
import { FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ViewModeToggleProps {
  mode: 'browse' | 'army';
  onChange: (mode: 'browse' | 'army') => void;
  availableCount: number;
  armyCount: number;
  factionId: FactionID;
}

export function ViewModeToggle({ mode, onChange, availableCount, armyCount, factionId }: ViewModeToggleProps) {
  const factionColors = {
    polaris: 'bg-red-500',
    protectorate: 'bg-cyan-500',
    mercenaries: 'bg-yellow-500',
  };

  const activeColor = factionColors[factionId] || factionColors.polaris;

  return (
    <div className="hidden md:flex items-center gap-2 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <button
        onClick={() => onChange('browse')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
          mode === 'browse'
            ? 'bg-slate-700 text-slate-100 shadow-sm'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
        )}
      >
        <FolderOpen className="w-4 h-4" />
        Юниты
        {availableCount > 0 && (
          <span className={cn(
            'px-1.5 py-0.5 rounded-full text-xs font-bold',
            mode === 'browse' ? activeColor + ' text-slate-900' : 'bg-slate-700 text-slate-400'
          )}>
            {availableCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onChange('army')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
          mode === 'army'
            ? 'bg-slate-700 text-slate-100 shadow-sm'
            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
        )}
      >
        <Shield className="w-4 h-4" />
        Армия
        {armyCount > 0 && (
          <span className={cn(
            'px-1.5 py-0.5 rounded-full text-xs font-bold',
            mode === 'army' ? activeColor + ' text-slate-900' : 'bg-slate-700 text-slate-400'
          )}>
            {armyCount}
          </span>
        )}
      </button>
    </div>
  );
}
