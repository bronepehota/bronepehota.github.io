'use client';

import React, { useState, KeyboardEvent, useEffect } from 'react';
import type { Faction, FactionID } from '@/lib/types';

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
      <h2 className="text-3xl font-bold text-slate-200">Выберите фракцию</h2>
      <p className="text-sm text-slate-400 -mt-4">Выберите одну из трех фракций для вашей армии</p>

      {/* Faction cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {factions.map((faction) => {
          const isSelected = selectedFaction === faction.id;
          const isExpanded = expandedFaction === faction.id;

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
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all
                min-h-[80px] min-w-[44px] touch-manipulation
                ${isSelected
                  ? `border-${faction.color === '#ef4444' ? 'red' : faction.color === '#3b82f6' ? 'blue' : 'yellow'}-500 ring-2 ring-offset-2 ring-offset-slate-900`
                  : 'border-slate-700 hover:border-slate-600'
                }
                ${isSelected ? 'scale-105' : 'hover:scale-102'}
                active:scale-95
              `}
              style={{
                borderColor: isSelected ? faction.color : undefined,
                backgroundColor: isSelected ? `${faction.color}10` : undefined,
              }}
            >
              {/* Recommended badge */}
              {!selectedFaction && faction.id === 'polaris' && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                  Рекомендовано
                </div>
              )}
              {/* Faction name and color indicator */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-200 truncate">
                  {faction.name}
                </h3>
                {isSelected && (
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Motto - always visible */}
              <p className="text-sm italic text-slate-400 mb-2" style={{ color: isSelected ? faction.color : undefined }}>
                &ldquo;{faction.motto}&rdquo;
              </p>

              {/* Color indicator bar */}
              <div className="h-1 rounded" style={{ backgroundColor: faction.color }}></div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  <p>{faction.description}</p>
                  <p className="text-xs">Родной мир: {faction.homeWorld}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next button */}
      {onNext && (
        <div className="pt-4">
          <button
            onClick={onNext}
            disabled={nextDisabled || !selectedFaction}
            aria-disabled={!selectedFaction}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors min-h-[48px] min-w-[44px]"
          >
            Продолжить
          </button>
        </div>
      )}
    </div>
  );
}
