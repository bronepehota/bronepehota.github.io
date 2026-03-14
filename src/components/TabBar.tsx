'use client';

import React from 'react';
import { FolderOpen, Shield, Sword } from 'lucide-react';
import { FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';

interface TabBarProps {
  activeTab: 'browse' | 'army';
  onTabChange: (tab: 'browse' | 'army') => void;
  availableCount: number;
  armyCount: number;
  factionId: FactionID;
  currentCost?: number;
  pointBudget?: number;
  hasUnits?: boolean; // Show start battle action when true
  onStartBattle?: () => void; // Callback for start battle action
}

export function TabBar({
  activeTab,
  onTabChange,
  availableCount,
  armyCount,
  factionId,
  currentCost = 0,
  pointBudget = 250,
  hasUnits = false,
  onStartBattle
}: TabBarProps) {
  const factionColors = getFactionColors(factionId);
  const colors = {
    bg: factionColors.bgSolid,
    text: factionColors.text,
    border: factionColors.borderSolid,
    glow: factionColors.glow,
  };

  // Calculate budget color based on remaining points
  const remainingPoints = pointBudget - currentCost;
  const remainingRatio = remainingPoints / pointBudget;

  const getBudgetColor = () => {
    if (remainingPoints < 0) return 'text-red-400';
    if (remainingRatio > 0.5) return 'text-green-400';
    if (remainingRatio > 0.2) return 'text-yellow-400';
    return 'text-red-400';
  };

  const budgetColor = getBudgetColor();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 shadow-xl">
      {hasUnits && onStartBattle ? (
        /* Action mode - show start battle button */
        <div className="flex items-stretch h-16 max-w-4xl mx-auto">
          {/* Units tab (smaller) */}
          <button
            onClick={() => onTabChange('browse')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200',
              'relative border-r border-slate-700/50 py-1 min-w-[60px]',
              activeTab === 'browse' ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
            )}
            aria-label={`Юниты (${availableCount})`}
            aria-selected={activeTab === 'browse'}
            role="tab"
          >
            <FolderOpen className={cn('w-4 h-4', activeTab === 'browse' ? 'text-slate-100' : 'text-slate-500')} />
            {availableCount > 0 && (
              <span className={cn(
                'px-1 py-0.5 rounded-full text-[10px] font-bold',
                activeTab === 'browse' ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-500'
              )}>
                {availableCount}
              </span>
            )}
          </button>

          {/* Army tab (smaller) */}
          <button
            onClick={() => onTabChange('army')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200',
              'relative border-r border-slate-700/50 py-1 min-w-[60px]',
              activeTab === 'army' ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
            )}
            aria-label={`Армия (${armyCount})`}
            aria-selected={activeTab === 'army'}
            role="tab"
          >
            <Shield className={cn('w-4 h-4', activeTab === 'army' ? 'text-slate-100' : 'text-slate-500')} />
            {armyCount > 0 && (
              <span className={cn(
                'px-1 py-0.5 rounded-full text-[10px] font-bold',
                activeTab === 'army' ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-500'
              )}>
                {armyCount}
              </span>
            )}
          </button>

          {/* Start Battle button */}
          <button
            onClick={onStartBattle}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 transition-all duration-200',
              'font-mono text-sm font-bold uppercase tracking-wider',
              'relative overflow-hidden group',
              'border-l border-slate-700/50',
              colors.bg, colors.text
            )}
          >
            {/* Animated background effect */}
            <div className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity',
              colors.bg.replace('bg-', 'bg-').replace('-500', '-500/20')
            )} />

            {/* Scanline effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent h-full w-full animate-pulse" style={{ animationDuration: '2s' }} />
            </div>

            <Sword className="w-4 h-4 relative z-10" />
            <span className="relative z-10">НАЧАТЬ БОЙ</span>

            {/* Tech corners */}
            <div className={cn(
              'absolute top-0 left-0 w-1.5 h-1.5 border-l border-t opacity-50',
              colors.border
            )} />
            <div className={cn(
              'absolute top-0 right-0 w-1.5 h-1.5 border-r border-t opacity-50',
              colors.border
            )} />
            <div className={cn(
              'absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b opacity-50',
              colors.border
            )} />
            <div className={cn(
              'absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b opacity-50',
              colors.border
            )} />
          </button>
        </div>
      ) : (
        /* Default mode - show full tabs with budget info */
        <div className="flex items-stretch h-16 md:h-20 max-w-4xl mx-auto md:border-x md:border-slate-700/50 md:rounded-t-xl">
          {/* Units tab */}
          <button
            onClick={() => onTabChange('browse')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200',
              'relative border-r border-slate-700/50 py-1',
              activeTab === 'browse' ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
            )}
            aria-label={`Юниты (${availableCount})`}
            aria-selected={activeTab === 'browse'}
            role="tab"
          >
            <div className="flex items-center gap-1.5">
              <FolderOpen className={cn('w-4 h-4', activeTab === 'browse' ? 'text-slate-100' : 'text-slate-500')} />
              <span className={cn('text-xs font-bold', activeTab === 'browse' ? 'text-slate-100' : 'text-slate-500')}>
                ЮНИТЫ
              </span>
              {availableCount > 0 && (
                <span className={cn(
                  'px-1 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === 'browse' ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-500'
                )}>
                  {availableCount}
                </span>
              )}
            </div>
            {/* Budget display */}
            <div className={cn('text-xs font-mono font-bold flex items-center gap-1', budgetColor)}>
              <span>💰</span>
              <span>{currentCost}/{pointBudget}</span>
            </div>
            {activeTab === 'browse' && (
              <div className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5', colors.bg)} />
            )}
          </button>

          {/* Army tab */}
          <button
            onClick={() => onTabChange('army')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200',
              'relative py-1',
              activeTab === 'army' ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
            )}
            aria-label={`Армия (${armyCount})`}
            aria-selected={activeTab === 'army'}
            role="tab"
          >
            <div className="flex items-center gap-1.5">
              <Shield className={cn('w-4 h-4', activeTab === 'army' ? 'text-slate-100' : 'text-slate-500')} />
              <span className={cn('text-xs font-bold', activeTab === 'army' ? 'text-slate-100' : 'text-slate-500')}>
                АРМИЯ
              </span>
              {armyCount > 0 && (
                <span className={cn(
                  'px-1 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === 'army' ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-500'
                )}>
                  {armyCount}
                </span>
              )}
            </div>
            {/* Remaining points display */}
            <div className={cn('text-xs font-mono font-bold', budgetColor)}>
              {remainingPoints >= 0 ? `${remainingPoints} осталось` : `${Math.abs(remainingPoints)} свысок`}
            </div>
            {activeTab === 'army' && (
              <div className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5', colors.bg)} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
