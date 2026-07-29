'use client';

import React, { KeyboardEvent } from 'react';
import type { Faction, FactionID } from '@/lib/types';
import { Check, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { FloatingContinueButton } from './FloatingContinueButton';
import { orderedFactions, getSubFactions } from '@/lib/faction-hierarchy';
import { getFactionColors } from '@/lib/faction-colors';
import { FactionLogo } from '@/components/FactionLogo';
import { Shield, Zap, Skull, Star, Anchor } from 'lucide-react';

interface FactionSelectorProps {
  factions: Faction[];
  selectedFaction?: FactionID;
  onFactionSelect: (factionId: FactionID) => void;
  onNext?: () => void;
  _nextDisabled?: boolean; // kept for callers; unused
  isLoading?: boolean;
  loadError?: string | null;
}

// Fallback glyphs (when a faction has no logo image)
const SYMBOL_ICON: Record<string, typeof Shield> = { Shield, Zap, Skull, Flag: Shield, Star, Anchor };

/**
 * FactionSelector — pick a faction (or one of its sub-factions) for the army.
 *
 * Redesign: factions render as PARENT "families" with logos; sub-factions
 * appear as selectable chips nested inside their parent's card (hierarchy is
 * visible). Selection is a single click — no expand/toggle: description is
 * always visible (clamped). Mobile-first: 1 column / desktop: 3 columns.
 */
export function FactionSelector({
  factions,
  selectedFaction,
  onFactionSelect,
  onNext,
  isLoading = false,
  loadError = null,
}: FactionSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400" />
        <span className="ml-4 text-slate-400">Загрузка...</span>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg" role="alert" aria-live="assertive">
        <p className="text-red-400 mb-4">Ошибка загрузки данных</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
          Повторить
        </button>
      </div>
    );
  }

  const parents = orderedFactions(factions).filter((f) => !f.parent);
  const subsOf = (pid: FactionID) => getSubFactions(pid, factions);

  const selectParent = (e: React.SyntheticEvent, id: FactionID) => {
    e.stopPropagation();
    onFactionSelect(id);
  };
  const onParentKey = (e: KeyboardEvent<HTMLDivElement>, id: FactionID) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFactionSelect(id);
    }
  };

  return (
    <div className="space-y-6 pb-32" data-testid="faction-selector">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-200 font-mono tracking-wider">ВЫБЕРИТЕ ФРАКЦИЮ</h2>
        <p className="text-sm text-slate-400">Выберите сторону конфликта</p>
      </div>

      {/* Faction families */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {parents.map((parent) => {
          const colors = getFactionColors(parent.id);
          const subs = subsOf(parent.id);
          const isParentSelected = selectedFaction === parent.id;
          const isFamilySelected = isParentSelected || subs.some((s) => s.id === selectedFaction);

          return (
            <div
              key={parent.id}
              className={clsx(
                'relative flex flex-col border bg-slate-800/80 backdrop-blur-sm overflow-hidden',
                'transition-all duration-200 touch-manipulation',
                isFamilySelected ? 'ring-2 ring-offset-2 ring-offset-slate-900' : 'hover:bg-slate-700/40',
                colors.border,
                colors.ring,
              )}
              style={isFamilySelected ? { borderColor: colors.primary, boxShadow: `0 0 22px -6px ${colors.primary}80` } : undefined}
            >
              {/* Color rail */}
              <div className="absolute inset-y-0 left-0 w-1" style={{ background: `linear-gradient(180deg, ${colors.primary}, transparent)` }} />

              {/* Parent area — click selects the parent faction */}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isParentSelected}
                data-testid={`faction-card-${parent.id}`}
                aria-label={`Фракция ${parent.name}`}
                onClick={(e) => selectParent(e, parent.id)}
                onKeyDown={(e) => onParentKey(e, parent.id)}
                className="relative flex items-start gap-3 p-3 md:p-4 cursor-pointer flex-1"
              >
                {/* Emblem */}
                <div
                  className="relative shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-md overflow-hidden"
                  style={{ backgroundColor: `${colors.primary}14`, border: `1px solid ${colors.primary}55`, color: colors.primary }}
                >
                  <FactionLogo faction={parent.id} className="w-3/4 h-3/4" fallback={SYMBOL_ICON[parent.symbol ?? 'Flag']} fallbackClassName="w-3/4 h-3/4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-bold text-base md:text-lg tracking-wide truncate" style={{ color: colors.primary }}>
                      {parent.name.toUpperCase()}
                    </h3>
                    {isParentSelected && (
                      <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.primary}33`, color: colors.primary }}>
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  {parent.motto && (
                    <p className="text-xs md:text-sm italic font-mono text-slate-500 truncate" title={parent.motto}>
                      «{parent.motto}»
                    </p>
                  )}
                  {parent.description && (
                    <p className="mt-1.5 text-xs md:text-sm text-slate-400 leading-snug line-clamp-2">
                      {parent.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Sub-faction chips — nested under the parent */}
              {subs.length > 0 && (
                <div className="px-3 md:px-4 pb-3 md:pb-4 pt-1 border-t border-slate-700/40">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-1.5 mt-2">Подфракции</div>
                  <div className="flex flex-wrap gap-1.5">
                    {subs.map((sub) => {
                      const subColors = getFactionColors(sub.id);
                      const isSubSelected = selectedFaction === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          aria-pressed={isSubSelected}
                          data-testid={`faction-card-${sub.id}`}
                          onClick={(e) => selectParent(e, sub.id)}
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-all',
                            isSubSelected ? 'text-white' : 'text-slate-300 hover:text-white',
                          )}
                          style={
                            isSubSelected
                              ? { backgroundColor: `${subColors.primary}22`, borderColor: subColors.primary, color: subColors.primary }
                              : { borderColor: `${subColors.primary}40` }
                          }
                        >
                          <span className="w-4 h-4 flex items-center justify-center" style={{ color: subColors.primary }}>
                            <FactionLogo faction={sub.id} className="w-full h-full" fallback={SYMBOL_ICON[sub.symbol ?? 'Flag']} fallbackClassName="w-full h-full" />
                          </span>
                          {sub.name}
                          {isSubSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating continue button */}
      {onNext && (
        <FloatingContinueButton
          text="Выбрать фракцию"
          tooltip="Выбрать фракцию"
          accentColor={selectedFaction ? factions.find((f) => f.id === selectedFaction)?.color || '#3b82f6' : '#64748b'}
          onClick={onNext}
          disabled={!selectedFaction}
          dataTestid="faction-continue-button"
          icon={<ArrowRight className="w-4 h-4" />}
        />
      )}
    </div>
  );
}
