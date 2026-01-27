'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
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
  searchQuery,
  onSearchChange,
  squadCount,
  machineCount,
}: UnitFilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const hasActiveFilter = filterType !== 'all' || searchQuery.length > 0;

  const clearFilters = () => {
    onFilterChange('all');
    onSearchChange('');
  };

  return (
    <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors',
          isSearchFocused ? 'text-slate-400' : 'text-slate-600'
        )} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Поиск по названию..."
          className={cn(
            'w-full pl-10 pr-10 py-2.5 rounded-lg',
            'bg-slate-800/50 border border-slate-700/50',
            'text-sm text-slate-100 placeholder-slate-600',
            'focus:outline-none focus:border-slate-600 focus:bg-slate-800/70',
            'transition-all'
          )}
        />
        {searchQuery.length > 0 && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700/50 transition-colors"
            aria-label="Очистить поиск"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onFilterChange('all')}
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
          onClick={() => onFilterChange('squad')}
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
          onClick={() => onFilterChange('machine')}
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

        {/* Clear filters button */}
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-all"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
