/**
 * Sources list component - shows all custom sources
 */

'use client';

import { CustomSource } from '@/lib/editor/types';
import { Plus, Trash2 } from 'lucide-react';

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
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-300">Источники</h2>
        <button
          onClick={onCreateNew}
          className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
          title="Создать источник"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto">
        {sources.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            Нет пользовательских источников.
            <br />
            Нажмите + чтобы создать новый.
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sources.map(source => (
              <div
                key={source.id}
                className={`
                  group flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer
                  ${selectedId === source.id
                    ? 'bg-slate-700 text-white'
                    : 'hover:bg-slate-800 text-slate-300'
                  }
                `}
                onClick={() => onSelect(source.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {source.baseSource ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900 text-blue-300">
                        Расширение
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-900 text-green-300">
                        Новый
                      </span>
                    )}
                  </div>
                  <div className="font-medium mt-1">{source.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {source.factions.length} фракций • {source.squads.length + source.machines.length} юнитов
                  </div>
                </div>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить источник "${source.name}"?`)) {
                        onDelete(source.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
