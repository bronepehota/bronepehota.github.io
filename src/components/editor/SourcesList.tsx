/**
 * Sources list component - shows all custom sources
 * Styled with battle card aesthetics
 */

'use client';

import { CustomSource } from '@/lib/editor/types';
import { Plus, Trash2, FileText, GitBranch, Database, Download, Upload } from 'lucide-react';

interface SourcesListProps {
  sources: CustomSource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDelete?: (id: string) => void;
  onExport?: () => void;
  onImport?: () => void;
}

export function SourcesList({
  sources,
  selectedId,
  onSelect,
  onCreateNew,
  onDelete,
  onExport,
  onImport,
}: SourcesListProps) {
  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Армлисты</h2>
        <div className="flex gap-1">
          {onImport && (
            <button
              onClick={onImport}
              className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 transition-all group"
              title="Импорт"
            >
              <Upload className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 border border-violet-600/30 transition-all group"
              title="Экспорт"
            >
              <Download className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </button>
          )}
          <button
            onClick={onCreateNew}
            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 transition-all group"
            title="Создать источник"
          >
            <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sources.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <div className="text-slate-600 text-sm mb-1">Нет пользовательских источников</div>
            <div className="text-slate-700 text-xs">Нажмите + чтобы создать новый</div>
          </div>
        ) : (
          sources.map(source => {
            const isSelected = selectedId === source.id;
            const isExtension = source.baseSource !== null;

            return (
              <div
                key={source.id}
                className={`
                  group relative rounded-lg border-2 p-3 transition-all duration-200
                  cursor-pointer overflow-hidden
                  ${isSelected
                    ? 'bg-slate-800 border-emerald-500/50 shadow-emerald-900/20'
                    : 'bg-slate-800/40 border-slate-700 hover:border-slate-600 hover:bg-slate-800/60'
                  }
                `}
                onClick={() => onSelect(source.id)}
              >
                {/* Tech corners for selection */}
                {isSelected && (
                  <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-emerald-500/60 -ml-px -mt-px" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-emerald-500/60 -mr-px -mt-px" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-emerald-500/60 -ml-px -mb-px" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-emerald-500/60 -mr-px -mb-px" />
                  </>
                )}

                {/* Selection indicator stripe */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                )}

                {/* Content */}
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <div className="flex items-center gap-2 mb-2">
                      {isExtension ? (
                        <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 border border-blue-600/30 text-blue-400 font-medium">
                          <GitBranch className="w-3 h-3" />
                          <span className="uppercase tracking-wider">Расширение</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-600/30 text-emerald-400 font-medium">
                          <Database className="w-3 h-3" />
                          <span className="uppercase tracking-wider">База</span>
                        </div>
                      )}
                      {source.baseSource && (
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {source.baseSource}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {source.name}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className={source.factions.length > 0 ? 'text-slate-400' : ''}>
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
                      className="p-2 rounded-lg hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
