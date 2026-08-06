/**
 * Sources list component - shows all custom sources
 * Styled with verifier chrome (hazard panels, font-display indices).
 */

'use client';

import { CustomSource } from '@/lib/editor/types';
import { Plus, Trash2, FileText, GitBranch, Database } from 'lucide-react';
import { EdPanel, StatusPill } from './ui/editor-primitives';

interface SourcesListProps {
  sources: CustomSource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDelete?: (id: string) => void;
}

export function SourcesList({
  sources,
  selectedId,
  onSelect,
  onCreateNew,
  onDelete,
}: SourcesListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-sm">
        <h2 className="font-ui text-xs uppercase tracking-widest text-[var(--muted)]">Армлисты</h2>
        <div className="flex gap-1">
          <button
            onClick={onCreateNew}
            className="p-2 rounded-lg border border-[var(--border2)] bg-[var(--panel2)] hover:bg-[var(--ru)] hover:text-white hover:border-[var(--ru)] transition-all group"
            title="Создать источник"
          >
            <Plus className="w-4 h-4 text-[var(--ru2)] group-hover:text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Sources list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {sources.length === 0 ? (
          <div className="p-6 text-center font-ui">
            <FileText className="w-12 h-12 mx-auto text-[var(--dim)] mb-3" />
            <div className="text-[var(--muted)] text-sm mb-1">Нет пользовательских источников</div>
            <div className="text-[var(--dim)] text-xs">Нажмите + чтобы создать новый</div>
          </div>
        ) : (
          <EdPanel>
            <div className="space-y-2">
              {sources.map((source, idx) => {
                const isSelected = selectedId === source.id;
                const isExtension = source.baseSource !== null;

                return (
                  <div
                    key={source.id}
                    className={`
                      group relative rounded-md p-3 transition-all duration-200 cursor-pointer overflow-hidden border
                      ${isSelected
                        ? 'ed-panel2 border-[var(--ru)]'
                        : 'ed-panel2 border-transparent hover:border-[var(--border2)]'
                      }
                    `}
                    onClick={() => onSelect(source.id)}
                  >
                    {/* Selection indicator stripe */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--ru)]" />
                    )}

                    {/* Content */}
                    <div className="flex items-start justify-between gap-3 relative z-10 pl-2">
                      <div className="flex-1 min-w-0">
                        {/* Leading index + type badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-display text-[var(--ru)] text-sm tracking-wider">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          {isExtension ? (
                            <span className="flex items-center gap-1 font-stat text-[10px] px-1.5 py-0.5 rounded border border-[var(--border2)] text-[var(--muted)]">
                              <GitBranch className="w-3 h-3" />
                              <span className="uppercase tracking-wider">Расширение</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-stat text-[10px] px-1.5 py-0.5 rounded border border-[var(--border2)] text-[var(--muted)]">
                              <Database className="w-3 h-3" />
                              <span className="uppercase tracking-wider">База</span>
                            </span>
                          )}
                          {isSelected && <StatusPill ok={true}>Выбран</StatusPill>}
                          {source.baseSource && (
                            <span className="font-stat text-[10px] text-[var(--dim)] uppercase tracking-wider">
                              {source.baseSource}
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <div className={`font-ui font-bold text-sm ${isSelected ? 'text-[var(--bone)]' : 'text-[var(--bone)]'}`}>
                          {source.name}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mt-1 font-stat text-xs text-[var(--muted)]">
                          <span className="flex items-center gap-1">
                            <span className={source.factions.length > 0 ? 'text-[var(--muted)]' : ''}>
                              {source.factions.length} фракций
                            </span>
                          </span>
                          <span>•</span>
                          <span>{source.squads.length + source.machines.length} юнитов</span>
                        </div>
                      </div>

                      {/* Delete button */}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Удалить источник "${source.name}"?`)) {
                              onDelete(source.id);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-[var(--red)]/20 opacity-0 group-hover:opacity-100 transition-all"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4 text-[var(--red)]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </EdPanel>
        )}
      </div>
    </div>
  );
}
