"use client";

import React from 'react';
import { ViewMode, FilterType, FactionID } from '@/lib/types';
import { Users, Zap, Shield, Eye, Search, X } from 'lucide-react';
import { getFactionColors } from '@/lib/faction-colors';
import { DisplayModeToggle } from './controls/DisplayModeToggle';

interface ArmyControlPanelProps {
  viewMode: ViewMode;
  filterType: FilterType;
  factionId: FactionID;
  onFilterChange: (type: FilterType) => void;
  squadCount: number;
  machineCount: number;
  mercenaryCount: number;
  currentCost: number;
  pointBudget: number;
  armyCount: number;
  displayMode: 'detailed' | 'compact';
  onDisplayModeChange: (mode: 'detailed' | 'compact') => void;
  /** Catalog name search (NOT persisted — unlike display mode). Filters the
   *  available-units list in UnitSelector, ANDs with the type filter. */
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  /** Filtered catalog size to echo next to the input; optional. */
  resultCount?: number;
}

export function ArmyControlPanel({
  viewMode,
  filterType,
  factionId,
  onFilterChange,
  squadCount,
  machineCount,
  mercenaryCount,
  currentCost,
  pointBudget,
  armyCount,
  displayMode,
  onDisplayModeChange,
  searchQuery,
  onSearchQueryChange,
  resultCount
}: ArmyControlPanelProps) {
  const colors = getFactionColors(factionId);

  // Calculate remaining budget and color
  const remaining = pointBudget - currentCost;
  const remainingRatio = remaining / pointBudget;

  const getBudgetColor = () => {
    if (remaining < 0) return 'text-red-400';
    if (remainingRatio > 0.5) return 'text-green-400';
    if (remainingRatio > 0.2) return 'text-yellow-400';
    return 'text-red-400';
  };

  const budgetColor = getBudgetColor();

  // Only show filter panel in browse mode
  if (viewMode !== 'browse') {
    return null;
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl space-y-4">
      {/* Budget + Selected row */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-lg font-mono font-bold ${budgetColor}`}>
            💰 {currentCost}/{pointBudget}
          </div>
          <div className={`text-xs font-mono ${budgetColor}`}>
            {remaining >= 0 ? `${remaining} осталось` : `${Math.abs(remaining)} свысок`}
          </div>
        </div>
        <button
          onClick={() => onFilterChange(filterType === 'selected' ? 'all' : 'selected')}
          className={`
            px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider
            transition-all duration-200 touch-manipulation border
            flex items-center gap-2
            ${filterType === 'selected'
              ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg`
              : 'bg-slate-900/30 text-slate-500 border-slate-700/30 hover:text-slate-300'
            }
          `}
        >
          <Eye className="w-4 h-4" />
          <span>Выбранные</span>
          <span className={`
            px-2 py-0.5 rounded-full text-[10px] font-mono
            ${filterType === 'selected'
              ? 'bg-slate-900/50 text-current'
              : 'bg-slate-800/50 text-slate-600'
            }
          `}>
            {armyCount}
          </span>
        </button>
      </div>

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

      {/* Catalog search — filters available units by name/shortName/faction */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="ПОИСК…"
            aria-label="Поиск по названию"
            data-testid="unit-search-input"
            className="w-full min-h-[44px] rounded-lg border border-slate-700/50 bg-slate-900/60 py-2 pl-9 pr-10 font-mono text-xs tracking-wide text-slate-200 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none touch-manipulation"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              data-testid="unit-search-clear"
              aria-label="Очистить поиск"
              className="absolute inset-y-0 right-1 flex w-10 items-center justify-center text-slate-500 hover:text-slate-300 touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery.trim() && resultCount !== undefined && (
          <span
            data-testid="unit-search-count"
            className="font-mono text-[10px] text-slate-500 tabular-nums shrink-0"
          >
            {resultCount}
          </span>
        )}
      </div>

      {/* Display mode toggle — switch between detailed cards and compact list */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Вид списка
        </span>
        <DisplayModeToggle mode={displayMode} onChange={onDisplayModeChange} />
      </div>
    </div>
  );
}
