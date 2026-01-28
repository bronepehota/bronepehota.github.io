'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface UnitFilterBarProps {
  filterType: 'all' | 'squad' | 'machine';
  onFilterChange: (filter: 'all' | 'squad' | 'machine') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  squadCount: number;
  machineCount: number;
}

export function UnitFilterBar({
  filterType,
  onFilterChange,
  searchQuery: _searchQuery,
  onSearchChange: _onSearchChange,
  squadCount,
  machineCount,
}: UnitFilterBarProps) {
  const handleFilterClick = (newFilter: 'all' | 'squad' | 'machine') => {
    // Toggle off if clicking the same filter again
    if (filterType === newFilter && newFilter !== 'all') {
      onFilterChange('all');
    } else {
      onFilterChange(newFilter);
    }
  };

  return (
    <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => handleFilterClick('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap',
            'transition-all duration-200',
            'border',
            filterType === 'all'
              ? 'bg-slate-700 border-slate-600 text-slate-100'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
          )}
        >
          Все ({squadCount + machineCount})
        </button>
        <button
          onClick={() => handleFilterClick('squad')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap',
            'transition-all duration-200',
            'border',
            filterType === 'squad'
              ? 'bg-blue-900/30 border-blue-500/50 text-blue-400'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
          )}
        >
          Отряды ({squadCount})
        </button>
        <button
          onClick={() => handleFilterClick('machine')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap',
            'transition-all duration-200',
            'border',
            filterType === 'machine'
              ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
          )}
        >
          Машины ({machineCount})
        </button>
      </div>
    </div>
  );
}
