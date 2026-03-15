/**
 * Factions list component - shows factions for a source
 * Styled like battle cards with tech corners and faction colors
 */

'use client';

import { CustomFaction } from '@/lib/editor/types';
import { Plus, Lock, ChevronRight, GitCompare } from 'lucide-react';

// Special ID for "CHANGES" view
export const MY_UNITS_ID = '__CHANGES__';

interface FactionsListProps {
  factions: CustomFaction[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
  myUnitsCount?: number;
}

// Get faction styling matching the main app
function getFactionStyle(factionId: string) {
  const styles: Record<string, { border: string; glow: string; bg: string; text: string; corner: string }> = {
    polaris: {
      border: 'border-red-600/30',
      glow: 'shadow-red-900/20',
      bg: 'bg-red-950/20',
      text: 'text-red-400',
      corner: 'rgba(220, 38, 38, 0.6)',
    },
    protectorate: {
      border: 'border-cyan-600/30',
      glow: 'shadow-cyan-900/20',
      bg: 'bg-cyan-950/20',
      text: 'text-cyan-400',
      corner: 'rgba(8, 145, 178, 0.6)',
    },
    mercenaries: {
      border: 'border-yellow-600/30',
      glow: 'shadow-yellow-900/20',
      bg: 'bg-yellow-950/20',
      text: 'text-yellow-400',
      corner: 'rgba(202, 138, 4, 0.6)',
    },
  };
  return styles[factionId] || styles.mercenaries;
}

export function FactionsList({
  factions,
  selectedId,
  onSelect,
  onCreateNew,
  disabled = false,
  myUnitsCount = 0,
}: FactionsListProps) {
  const isMyUnitsSelected = selectedId === MY_UNITS_ID;

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Фракции</h2>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            disabled={disabled}
            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 transition-all disabled:opacity-50 group"
            title="Создать фракцию"
          >
            <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Factions list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* CHANGES - Summary panel */}
        <button
          onClick={() => onSelect(MY_UNITS_ID)}
          disabled={disabled}
          className={`
            relative w-full text-left p-0 rounded-xl transition-all duration-200
            group overflow-hidden
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isMyUnitsSelected
              ? 'bg-violet-900/40 border-violet-500/50 shadow-violet-900/30'
              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
            }
          `}
        >
          {/* Animated gradient border */}
          <div className={`
            absolute inset-0 rounded-xl p-[2px] opacity-0 transition-opacity duration-300
            ${isMyUnitsSelected ? 'opacity-100' : 'group-hover:opacity-60'}
          `}>
            <div className="w-full h-full rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 animate-pulse" />
          </div>

          {/* Inner content */}
          <div className="relative z-10 bg-slate-900 rounded-xl p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isMyUnitsSelected ? 'bg-violet-950/50' : 'bg-slate-800'} transition-all`}>
                  <GitCompare className={`w-4 h-4 ${isMyUnitsSelected ? 'text-violet-400' : 'text-slate-500'} transition-all ${isMyUnitsSelected ? 'animate-pulse' : ''}`} />
                </div>
                <span className={`font-bold text-sm uppercase tracking-wider ${isMyUnitsSelected ? 'text-violet-300' : 'text-slate-400'}`}>
                  Изменения
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${isMyUnitsSelected ? 'text-violet-400' : 'text-slate-600'} opacity-0 group-hover:opacity-100`} />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`text-xs ${isMyUnitsSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                  Всего изменено:
                </div>
                <div className={`text-lg font-bold font-mono ${isMyUnitsSelected ? 'text-violet-300' : 'text-slate-300'}`}>
                  {myUnitsCount}
                </div>
              </div>
              <div className={`text-[10px] px-2 py-1 rounded-full ${isMyUnitsSelected ? 'bg-violet-950/50 text-violet-400 border border-violet-600/30' : 'bg-slate-800 text-slate-500'}`}>
                {isMyUnitsSelected ? 'Выбрано' : 'Показать'}
              </div>
            </div>

            {/* Subtitle */}
            {myUnitsCount > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <div className={`text-[10px] ${isMyUnitsSelected ? 'text-slate-500' : 'text-slate-600'}`}>
                  Созданные • Переопределённые • Скрытые
                </div>
              </div>
            )}
          </div>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700/50"></div>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Фракции</span>
          <div className="flex-1 h-px bg-slate-700/50"></div>
        </div>

        {/* Regular factions */}
        {factions.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-slate-600 text-sm">{disabled ? 'Выберите источник' : 'Нет фракций'}</div>
          </div>
        ) : (
          factions.map(faction => {
            const style = getFactionStyle(faction.id);
            const isSelected = selectedId === faction.id;

            return (
              <button
                key={faction.id}
                onClick={() => onSelect(faction.id)}
                disabled={disabled}
                className={`
                  relative w-full text-left p-3 rounded-lg border-2 transition-all duration-200
                  group overflow-hidden
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isSelected
                    ? `${style.border} ${style.glow} bg-slate-800`
                    : `${style.border} hover:${style.glow} bg-slate-800/30 hover:bg-slate-800/60`
                  }
                `}
                style={isSelected ? {} : {}}
              >
                {/* Tech corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t -ml-px -mt-px opacity-60" style={{ borderColor: style.corner }} />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t -mr-px -mt-px opacity-60" style={{ borderColor: style.corner }} />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b -ml-px -mb-px opacity-60" style={{ borderColor: style.corner }} />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b -mr-px -mb-px opacity-60" style={{ borderColor: style.corner }} />

                {/* Selection indicator stripe */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                )}

                {/* Content */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Faction icon with glow */}
                    <div className={`
                      relative w-8 h-8 rounded-lg flex items-center justify-center
                      ${style.bg} border ${style.border}
                    `}>
                      <div
                        className="w-4 h-4 rounded-full shadow-lg"
                        style={{ backgroundColor: faction.color, boxShadow: `0 0 12px ${faction.color}` }}
                      />
                    </div>

                    {/* Faction name */}
                    <div>
                      <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {faction.name}
                      </div>
                      {faction.isFromBase && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">База</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-white' : 'text-slate-600'} opacity-0 group-hover:opacity-100`} />
                </div>

                {/* Hover glow effect */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  bg-gradient-to-r from-transparent via-white/5 to-transparent
                `} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
