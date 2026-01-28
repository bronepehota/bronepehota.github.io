"use client";

import React from 'react';
import { ViewMode, DisplayMode, FilterType, FactionID } from '@/lib/types';
import { List, Grid, Users, Zap, Shield } from 'lucide-react';

interface ArmyControlPanelProps {
  viewMode: ViewMode;
  displayMode: DisplayMode;
  filterType: FilterType;
  factionId: FactionID;
  onViewModeChange: (mode: ViewMode) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onFilterChange: (type: FilterType) => void;
  squadCount: number;
  machineCount: number;
  mercenaryCount: number;
}

export function ArmyControlPanel({
  viewMode,
  displayMode,
  filterType,
  factionId,
  onViewModeChange,
  onDisplayModeChange,
  onFilterChange,
  squadCount,
  machineCount,
  mercenaryCount
}: ArmyControlPanelProps) {
  const getFactionColors = (factionId: FactionID) => {
    const colorMap = {
      polaris: {
        bg: 'bg-red-500/10',
        accent: 'text-red-400',
        border: 'border-red-500/50',
      },
      protectorate: {
        bg: 'bg-cyan-500/10',
        accent: 'text-cyan-400',
        border: 'border-cyan-500/50',
      },
      mercenaries: {
        bg: 'bg-yellow-500/10',
        accent: 'text-yellow-400',
        border: 'border-yellow-500/50',
      }
    };
    return colorMap[factionId] || colorMap.polaris;
  };

  const colors = getFactionColors(factionId);

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl">
      {/* Top row: View mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700/30">
          <button
            data-testid="view-mode-browse"
            onClick={() => onViewModeChange('browse')}
            className={`
              px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200
              flex items-center gap-2 touch-manipulation
              ${viewMode === 'browse'
                ? `${colors.bg} ${colors.accent} ${colors.border} border shadow-lg`
                : 'text-slate-500 hover:text-slate-300'
              }
            `}
          >
            <List className="w-4 h-4" />
            ЮНИТЫ
          </button>
          <button
            data-testid="view-mode-army"
            onClick={() => onViewModeChange('army')}
            className={`
              px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200
              flex items-center gap-2 touch-manipulation relative
              ${viewMode === 'army'
                ? `${colors.bg} ${colors.accent} ${colors.border} border shadow-lg`
                : 'text-slate-500 hover:text-slate-300'
              }
            `}
          >
            <Grid className="w-4 h-4" />
            АРМИЯ
          </button>
        </div>

        {/* Display mode toggle - shown for both modes */}
        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700/30">
          <button
            data-testid="display-mode-compact"
            onClick={() => onDisplayModeChange('compact')}
            className={`
              px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200
              flex items-center gap-2 touch-manipulation
              ${displayMode === 'compact'
                ? `${colors.bg} ${colors.accent} ${colors.border} border shadow-lg`
                : 'text-slate-500 hover:text-slate-300'
              }
            `}
          >
            <List className="w-3 h-3" />
          </button>
          <button
            data-testid="display-mode-detailed"
            onClick={() => onDisplayModeChange('detailed')}
            className={`
              px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200
              flex items-center gap-2 touch-manipulation
              ${displayMode === 'detailed'
                ? `${colors.bg} ${colors.accent} ${colors.border} border shadow-lg`
                : 'text-slate-500 hover:text-slate-300'
              }
            `}
          >
            <Grid className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bottom row: Type filter - only shown for browse mode */}
      {viewMode === 'browse' && (
        <div className="flex flex-row gap-2">
          <button
            onClick={() => onFilterChange(filterType === 'squad' ? 'all' : 'squad')}
            className={`
              flex-1 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider
              transition-all duration-200 touch-manipulation border
              flex items-center justify-center gap-2
              ${filterType === 'squad' || filterType === 'all'
                ? `${colors.bg} ${colors.accent} ${colors.border} shadow-lg transform scale-105`
                : 'bg-slate-900/30 text-slate-500 border-slate-700/30 hover:text-slate-300'
              }
            `}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Отряды</span>
            <span className={`
              px-2 py-0.5 rounded-full text-[10px] font-mono
              ${filterType === 'squad' || filterType === 'all'
                ? 'bg-slate-900/50 text-current'
                : 'bg-slate-800/50 text-slate-600'
              }
            `}>
              {squadCount}
            </span>
          </button>

          <button
            onClick={() => onFilterChange(filterType === 'machine' ? 'all' : 'machine')}
            className={`
              flex-1 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider
              transition-all duration-200 touch-manipulation border
              flex items-center justify-center gap-2
              ${filterType === 'machine' || filterType === 'all'
                ? `${colors.bg} ${colors.accent} ${colors.border} shadow-lg transform scale-105`
                : 'bg-slate-900/30 text-slate-500 border-slate-700/30 hover:text-slate-300'
              }
            `}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Машины</span>
            <span className={`
              px-2 py-0.5 rounded-full text-[10px] font-mono
              ${filterType === 'machine' || filterType === 'all'
                ? 'bg-slate-900/50 text-current'
                : 'bg-slate-800/50 text-slate-600'
              }
            `}>
              {machineCount}
            </span>
          </button>

          <button
            onClick={() => onFilterChange(filterType === 'mercenary' ? 'all' : 'mercenary')}
            className={`
              flex-1 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider
              transition-all duration-200 touch-manipulation border
              flex items-center justify-center gap-2
              ${filterType === 'mercenary' || filterType === 'all'
                ? `${colors.bg} ${colors.accent} ${colors.border} shadow-lg transform scale-105`
                : 'bg-slate-900/30 text-slate-500 border-slate-700/30 hover:text-slate-300'
              }
            `}
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Наёмники</span>
            <span className={`
              px-2 py-0.5 rounded-full text-[10px] font-mono
              ${filterType === 'mercenary' || filterType === 'all'
                ? 'bg-slate-900/50 text-current'
                : 'bg-slate-800/50 text-slate-600'
              }
            `}>
              {mercenaryCount}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}