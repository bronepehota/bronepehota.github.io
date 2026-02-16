"use client";

import { List, Grid3x3, Users, Zap } from "lucide-react";
import { clsx } from "clsx";
import { getFactionColors } from '@/lib/faction-colors';

interface UnifiedControlPanelProps {
  displayMode: 'compact' | 'detailed';
  onDisplayModeChange: (mode: 'compact' | 'detailed') => void;
  filterType: 'all' | 'squad' | 'machine';
  onFilterChange: (type: 'all' | 'squad' | 'machine') => void;
  selectedFaction: string;
}

export function UnifiedControlPanel({
  displayMode,
  onDisplayModeChange,
  filterType,
  onFilterChange,
  selectedFaction,
}: UnifiedControlPanelProps) {
  const colors = getFactionColors(selectedFaction as 'polaris' | 'protectorate' | 'mercenaries');

  // Build active state from base colors
  const activeState = `${colors.bg} ${colors.borderSolid} ${colors.text}`;

  return (
    <div className="flex items-center justify-between gap-3 mb-4 px-1">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
        <button
          onClick={() => onDisplayModeChange('compact')}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200',
            displayMode === 'compact'
              ? activeState
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">Кратко</span>
        </button>
        <button
          onClick={() => onDisplayModeChange('detailed')}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200',
            displayMode === 'detailed'
              ? activeState
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Grid3x3 className="w-4 h-4" />
          <span className="hidden sm:inline">Подробно</span>
        </button>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
        <button
          onClick={() => onFilterChange(filterType === 'squad' ? 'all' : 'squad')}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200',
            filterType === 'squad' || filterType === 'all'
              ? activeState
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Отряды</span>
        </button>
        <button
          onClick={() => onFilterChange(filterType === 'machine' ? 'all' : 'machine')}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200',
            filterType === 'machine' || filterType === 'all'
              ? activeState
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">Машины</span>
        </button>
      </div>
    </div>
  );
}