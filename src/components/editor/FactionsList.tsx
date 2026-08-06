/**
 * Factions list component - shows factions for a source
 * Verifier chrome: hazard panels, font-display indices, faction colors preserved.
 */

'use client';

import { CustomFaction } from '@/lib/editor/types';
import { Plus, Lock, ChevronRight, GitCompare } from 'lucide-react';
import { EdPanel, StatusPill } from './ui/editor-primitives';

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

// Get faction styling matching the main app (faction-identity colors preserved)
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-sm">
        <h2 className="font-ui text-xs uppercase tracking-widest text-[var(--muted)]">Фракции</h2>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            disabled={disabled}
            className="p-2 rounded-lg border border-[var(--border2)] bg-[var(--panel2)] hover:bg-[var(--ru)] hover:text-white hover:border-[var(--ru)] transition-all disabled:opacity-50 group"
            title="Создать фракцию"
          >
            <Plus className="w-4 h-4 text-[var(--ru2)] group-hover:text-white group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Factions list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {/* CHANGES - Summary panel */}
        <button
          onClick={() => onSelect(MY_UNITS_ID)}
          disabled={disabled}
          className={`
            relative w-full text-left p-0 rounded-md transition-all duration-200
            group overflow-hidden border
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isMyUnitsSelected
              ? 'ed-panel2 border-[var(--ru)]'
              : 'ed-panel2 border-transparent hover:border-[var(--border2)]'
            }
          `}
        >
          {/* Inner content */}
          <div className="relative z-10 p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-[var(--ru)] text-sm tracking-wider">Δ</span>
                <div className={`p-1.5 rounded-lg ${isMyUnitsSelected ? 'bg-violet-950/50' : 'bg-[var(--panel3)]'} transition-all`}>
                  <GitCompare className={`w-4 h-4 ${isMyUnitsSelected ? 'text-violet-400' : 'text-[var(--muted)]'} transition-all ${isMyUnitsSelected ? 'animate-pulse' : ''}`} />
                </div>
                <span className={`font-ui font-bold text-sm uppercase tracking-wider ${isMyUnitsSelected ? 'text-violet-300' : 'text-[var(--muted)]'}`}>
                  Изменения
                </span>
                {isMyUnitsSelected && <StatusPill ok={true}>Выбрано</StatusPill>}
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${isMyUnitsSelected ? 'text-violet-400' : 'text-[var(--dim)]'} opacity-0 group-hover:opacity-100`} />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`font-ui text-xs ${isMyUnitsSelected ? 'text-[var(--muted)]' : 'text-[var(--muted)]'}`}>
                  Всего изменено:
                </div>
                <div className={`font-stat text-lg font-bold ${isMyUnitsSelected ? 'text-violet-300' : 'text-[var(--bone)]'}`}>
                  {myUnitsCount}
                </div>
              </div>
              <div className={`font-stat text-[10px] px-2 py-1 rounded border ${isMyUnitsSelected ? 'bg-violet-950/50 text-violet-400 border-violet-600/30' : 'bg-[var(--panel3)] text-[var(--muted)] border-[var(--border2)]'}`}>
                {isMyUnitsSelected ? 'Выбрано' : 'Показать'}
              </div>
            </div>

            {/* Subtitle */}
            {myUnitsCount > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--border)]">
                <div className={`font-stat text-[10px] ${isMyUnitsSelected ? 'text-[var(--dim)]' : 'text-[var(--dim)]'}`}>
                  Созданные • Переопределённые • Скрытые
                </div>
              </div>
            )}
          </div>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)]"></div>
          <span className="font-stat text-[10px] text-[var(--dim)] uppercase tracking-wider">Фракции</span>
          <div className="flex-1 h-px bg-[var(--border)]"></div>
        </div>

        {/* Regular factions */}
        {factions.length === 0 ? (
          <div className="p-6 text-center font-ui">
            <div className="text-[var(--dim)] text-sm">{disabled ? 'Выберите источник' : 'Нет фракций'}</div>
          </div>
        ) : (
          <EdPanel>
            <div className="space-y-2">
              {factions.map((faction) => {
                const style = getFactionStyle(faction.id);
                const isSelected = selectedId === faction.id;

                return (
                  <button
                    key={faction.id}
                    onClick={() => onSelect(faction.id)}
                    disabled={disabled}
                    className={`
                      relative w-full text-left p-3 rounded-md border transition-all duration-200
                      group overflow-hidden
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isSelected
                        ? `${style.border} bg-[var(--panel2)]`
                        : `${style.border} bg-[var(--panel)] hover:bg-[var(--panel2)]`
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
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--ru)]" />
                    )}

                    {/* Content */}
                    <div className="flex items-center justify-between relative z-10 pl-2">
                      <div className="flex items-center gap-3">
                        {/* Leading font-display letter */}
                        <span className="font-display text-[var(--ru)] text-sm tracking-wider w-5 text-center">
                          {(faction.name || faction.id).charAt(0).toUpperCase()}
                        </span>

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
                          <div className={`font-ui font-bold text-sm ${isSelected ? 'text-[var(--bone)]' : 'text-[var(--bone)]'}`}>
                            {faction.name}
                          </div>
                          {faction.isFromBase && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Lock className="w-3 h-3 text-[var(--muted)]" />
                              <span className="font-stat text-[10px] text-[var(--muted)] uppercase tracking-wider">База</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && <StatusPill ok={true}>Выбрана</StatusPill>}
                        {/* Chevron */}
                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[var(--bone)]' : 'text-[var(--dim)]'} opacity-0 group-hover:opacity-100`} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </EdPanel>
        )}
      </div>
    </div>
  );
}
