import React from 'react';
import { List, Grid } from 'lucide-react';
import { clsx } from 'clsx';

type DisplayMode = 'compact' | 'detailed';
type FilterType = 'all' | 'squad' | 'machine';

interface SharedControlPanelProps {
  displayMode: DisplayMode;
  filterType: FilterType;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onFilterChange: (type: FilterType) => void;
  factionColor: string;
}

export function SharedControlPanel({
  displayMode,
  filterType,
  onDisplayModeChange,
  onFilterChange,
  factionColor
}: SharedControlPanelProps) {
  const _toggleFilter = () => {
    onFilterChange(filterType === 'squad' ? 'machine' : 'squad');
  };

  const toggleDisplayMode = () => {
    onDisplayModeChange(displayMode === 'compact' ? 'detailed' : 'compact');
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 z-20">
      {/* Compact/Detailed Toggle - Слева */}
      <button
        onClick={toggleDisplayMode}
        className={clsx(
          'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200',
          'border touch-manipulation',
          displayMode === 'detailed'
            ? `bg-${factionColor}/20 border-${factionColor} text-${factionColor}`
            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300'
        )}
        title={displayMode === 'compact' ? 'Подробный вид' : 'Компактный вид'}
      >
        {displayMode === 'compact' ? (
          <Grid className="w-5 h-5" />
        ) : (
          <List className="w-5 h-5" />
        )}
      </button>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Filter Toggle - Справа */}
      <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-slate-700">
        <button
          onClick={() => onFilterChange('squad')}
          className={clsx(
            'px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200',
            'touch-manipulation min-w-[60px]',
            filterType === 'squad'
              ? `bg-${factionColor} text-white shadow-sm`
              : 'text-slate-400 hover:text-slate-300'
          )}
        >
          Отряды
        </button>
        <button
          onClick={() => onFilterChange('machine')}
          className={clsx(
            'px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200',
            'touch-manipulation min-w-[60px]',
            filterType === 'machine'
              ? `bg-${factionColor} text-white shadow-sm`
              : 'text-slate-400 hover:text-slate-300'
          )}
        >
          Машины
        </button>
      </div>
    </div>
  );
}