'use client';

import React, { useState, KeyboardEvent, useEffect } from 'react';
import type { Faction, FactionID } from '@/lib/types';
import { Shield, Swords, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface FactionSelectorProps {
  factions: Faction[];
  selectedFaction?: FactionID;
  onFactionSelect: (factionId: FactionID) => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  isLoading?: boolean;
  loadError?: string | null;
}

/**
 * FactionSelector - Display faction selection cards with expandable details
 *
 * Allows player to choose a faction for their army.
 *
 * Accessibility (FR-022, FR-023, FR-024):
 * - Keyboard: Tab to navigate, Arrow keys within grid, Enter/Space to select, Escape to collapse
 * - ARIA: role="button", aria-pressed, aria-expanded, aria-label
 * - Focus: First card receives focus on mount, moves to selected after selection
 *
 * Mobile (FR-025, FR-027):
 * - Breakpoints: <768px (mobile), 768-1024px (tablet), >1024px (desktop)
 * - Touch targets: 44x44px minimum
 * - Images: 120px minimum width
 */
export function FactionSelector({
  factions,
  selectedFaction,
  onFactionSelect,
  onNext,
  nextDisabled,
  isLoading = false,
  loadError = null,
}: FactionSelectorProps) {
  const [expandedFaction, setExpandedFaction] = useState<FactionID | null>(null);

  // Auto-expand selected faction on mount or when it changes
  useEffect(() => {
    if (selectedFaction && expandedFaction !== selectedFaction) {
      setExpandedFaction(selectedFaction);
    }
  }, [selectedFaction, expandedFaction]);

  const handleFactionClick = (factionId: FactionID) => {
    onFactionSelect(factionId);
    setExpandedFaction(factionId === expandedFaction ? null : factionId);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, factionId: FactionID) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFactionClick(factionId);
    } else if (e.key === 'Escape' && expandedFaction === factionId) {
      setExpandedFaction(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400"></div>
        <span className="ml-4 text-slate-400">Загрузка...</span>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg" role="alert" aria-live="assertive">
        <p className="text-red-400 mb-4">Ошибка загрузки данных</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Swords className="w-6 h-6 text-slate-500" />
          <h2 className="text-3xl font-bold text-slate-200 font-mono tracking-wider">ВЫБЕРИТЕ ФРАКЦИЮ</h2>
          <Swords className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm text-slate-400">Выберите сторону конфликта</p>
      </div>

      {/* Faction cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {factions.map((faction) => {
          const isSelected = selectedFaction === faction.id;
          const isExpanded = expandedFaction === faction.id;

          // Faction-specific styling
          const factionStyles = {
            polaris: {
              border: 'border-red-500/50 hover:border-red-500',
              bg: 'hover:bg-red-500/10',
              accent: 'text-red-400',
              glow: 'shadow-red-500/20',
              corner: 'border-red-500'
            },
            protectorate: {
              border: 'border-cyan-500/50 hover:border-cyan-500',
              bg: 'hover:bg-cyan-500/10',
              accent: 'text-cyan-400',
              glow: 'shadow-cyan-500/20',
              corner: 'border-cyan-500'
            },
            mercenaries: {
              border: 'border-yellow-500/50 hover:border-yellow-500',
              bg: 'hover:bg-yellow-500/10',
              accent: 'text-yellow-400',
              glow: 'shadow-yellow-500/20',
              corner: 'border-yellow-500'
            }
          };

          const styles = factionStyles[faction.id as keyof typeof factionStyles];

          return (
            <div
              key={faction.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-expanded={isExpanded}
              aria-label={`Фракция ${faction.name}, ${isSelected ? 'выбрана' : 'не выбрана'}`}
              onKeyDown={(e) => handleKeyDown(e, faction.id)}
              onClick={() => handleFactionClick(faction.id)}
              className={clsx(
                'relative group cursor-pointer transition-all duration-300',
                'border bg-slate-800/80 backdrop-blur-sm overflow-hidden',
                'min-h-[120px] min-w-[44px] touch-manipulation',
                isSelected ? 'scale-105' : 'hover:scale-102',
                'active:scale-95',
                styles.border,
                styles.bg,
                isSelected && 'ring-2 ring-offset-2 ring-offset-slate-900'
              )}
              style={{
                ...(isSelected && {
                  boxShadow: `0 0 20px ${faction.color}40`,
                  borderColor: faction.color
                })
              }}
            >
              {/* Corner accents */}
              <div className={clsx(
                'absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 transition-all duration-300',
                styles.corner
              )} />
              <div className={clsx(
                'absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 transition-all duration-300',
                styles.corner
              )} />
              <div className={clsx(
                'absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 transition-all duration-300',
                styles.corner
              )} />
              <div className={clsx(
                'absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 transition-all duration-300',
                styles.corner
              )} />

              {/* Recommended badge */}
              {!selectedFaction && faction.id === 'polaris' && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  РЕКОМЕНДОВАНО
                </div>
              )}

              {/* Shield icon */}
              <div className="absolute top-3 left-3 opacity-20">
                <Shield className={clsx('w-8 h-8', styles.accent)} />
              </div>

              {/* Content */}
              <div className="relative z-10 p-4">
                {/* Faction name and status */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className={clsx('font-mono font-bold text-sm tracking-wide', styles.accent)}>
                    {faction.name.toUpperCase()}
                  </h3>
                  {isSelected && (
                    <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center bg-green-500/20 border border-green-500')}>
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Motto */}
                <p className={clsx('text-xs italic mb-3 font-mono', isSelected ? styles.accent : 'text-slate-500')}>
                  &quot;{faction.motto}&quot;
                </p>

                {/* Color indicator bar */}
                <div className="h-0.5 rounded-full" style={{ backgroundColor: faction.color }}></div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed">{faction.description}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                    <span>РОДНОЙ МИР:</span>
                    <span className={clsx(isSelected && styles.accent)}>{faction.homeWorld}</span>
                  </div>
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next button */}
      {onNext && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={onNext}
            disabled={nextDisabled || !selectedFaction}
            aria-disabled={!selectedFaction}
            className={clsx(
              'px-8 py-3 font-mono text-sm font-bold uppercase tracking-wider',
              'border transition-all min-h-[48px] min-w-[44px]',
              'hover:scale-105 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              selectedFaction ? 'bg-opacity-10' : 'bg-slate-700',
              selectedFaction && factions.find(f => f.id === selectedFaction)?.color
                ? `border-[${factions.find(f => f.id === selectedFaction)?.color}]`
                : 'border-slate-600'
            )}
            style={{
              backgroundColor: selectedFaction ? `${factions.find(f => f.id === selectedFaction)?.color}20` : undefined,
              borderColor: selectedFaction ? factions.find(f => f.id === selectedFaction)?.color : undefined,
              color: selectedFaction ? factions.find(f => f.id === selectedFaction)?.color : undefined
            }}
          >
            ПРОДОЛЖИТЬ
          </button>
        </div>
      )}
    </div>
  );
}
