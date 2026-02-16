"use client";

import React from 'react';
import { ViewMode, FilterType, FactionID } from '@/lib/types';
import { Users, Zap, Shield } from 'lucide-react';
import { getFactionColors } from '@/lib/faction-colors';

interface ArmyControlPanelProps {
  viewMode: ViewMode;
  filterType: FilterType;
  factionId: FactionID;
  onFilterChange: (type: FilterType) => void;
  squadCount: number;
  machineCount: number;
  mercenaryCount: number;
}

export function ArmyControlPanel({
  viewMode,
  filterType,
  factionId,
  onFilterChange,
  squadCount,
  machineCount,
  mercenaryCount
}: ArmyControlPanelProps) {
  const colors = getFactionColors(factionId);

  // Only show filter panel in browse mode
  if (viewMode !== 'browse') {
    return null;
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl">
      {/* Type filter */}
      <div className="flex flex-row gap-2">
        <button
          onClick={() => onFilterChange(filterType === 'squad' ? 'all' : 'squad')}
          className={`
            flex-1 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider
            transition-all duration-200 touch-manipulation border
            flex items-center justify-center gap-2
            ${filterType === 'squad' || filterType === 'all'
              ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg transform scale-105`
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
              ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg transform scale-105`
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
              ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg transform scale-105`
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
    </div>
  );
}
