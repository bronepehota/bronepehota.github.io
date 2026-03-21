/**
 * Create source modal
 */

'use client';

import { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { getAllSources, getSource } from '@/lib/sources-registry';
import { getFactions } from '@/lib/encyclopedia-registry';

interface CreateSourceModalProps {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    baseSource: string | null;
    factionIds?: string[];
    importSourceId?: string;
    importFactionIds?: string[];
  }) => void;
}

export function CreateSourceModal({ onClose, onCreate }: CreateSourceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'new' | 'extension' | 'import'>('new');
  const [baseSource, setBaseSource] = useState<string | null>(null);
  const [selectedFactionIds, setSelectedFactionIds] = useState<string[]>([]);
  const [importSourceId, setImportSourceId] = useState<string | null>(null);
  const [importFactionIds, setImportFactionIds] = useState<string[]>([]);

  const allSources = getAllSources();
  const standardFactions = getFactions();

  // Factions from the selected import source with unit counts
  const importFactions = useMemo(() => {
    if (type !== 'import' || !importSourceId) return [];
    const sourceData = getSource(importSourceId);
    if (!sourceData) return [];
    const factionSet = new Set<string>();
    sourceData.factions.forEach(f => factionSet.add(f.id));
    return Array.from(factionSet).map(fId => {
      const encFaction = getFactions().find(f => f.id === fId);
      const squadsCount = sourceData.squads.filter(s => s.faction === fId).length;
      const machinesCount = sourceData.machines.filter(m => m.faction === fId).length;
      return {
        id: fId,
        name: encFaction?.name || fId,
        squadsCount,
        machinesCount,
        totalUnits: squadsCount + machinesCount,
      };
    });
  }, [type, importSourceId]);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Введите название источника');
      return;
    }

    if (type === 'extension' && !baseSource) {
      alert('Выберите базовый источник');
      return;
    }

    if (type === 'import' && !importSourceId) {
      alert('Выберите источник для импорта');
      return;
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      baseSource: type === 'extension' ? baseSource : null,
      factionIds: type === 'new' ? selectedFactionIds : undefined,
      importSourceId: type === 'import' ? importSourceId! : undefined,
      importFactionIds: type === 'import' ? importFactionIds : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="create-source-modal">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-semibold">Новый источник</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Название
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md"
              placeholder="Мой армлист"
              data-testid="source-name-input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md resize-none"
              rows={2}
              placeholder="Опциональное описание"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Тип источника
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setType('new')}
                className={`
                  w-full px-4 py-3 rounded-md border text-left transition-colors
                  ${type === 'new'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                <div className="font-medium">Новый источник</div>
                <div className="text-sm text-slate-400 mt-0.5">
                  Создать новый источник
                </div>
              </button>

              <button
                onClick={() => setType('extension')}
                className={`
                  w-full px-4 py-3 rounded-md border text-left transition-colors
                  ${type === 'extension'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                <div className="font-medium">Расширение существующего</div>
                <div className="text-sm text-slate-400 mt-0.5">
                  Добавить юнитов к существующему источнику
                </div>
              </button>

              <button
                onClick={() => setType('import')}
                className={`
                  w-full px-4 py-3 rounded-md border text-left transition-colors
                  ${type === 'import'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                <div className="font-medium">Импорт из источника</div>
                <div className="text-sm text-slate-400 mt-0.5">
                  Скопировать юниты из существующего источника
                </div>
              </button>
            </div>
          </div>

          {/* Faction selection for new source */}
          {type === 'new' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Фракции
              </label>
              <div className="space-y-1.5">
                {standardFactions.map(faction => {
                  const isSelected = selectedFactionIds.includes(faction.id);
                  return (
                    <label
                      key={faction.id}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors
                        ${isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedFactionIds(prev =>
                            isSelected
                              ? prev.filter(id => id !== faction.id)
                              : [...prev, faction.id]
                          );
                        }}
                        className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                      />
                      <span className="text-sm text-slate-200">{faction.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Выберите фракции для включения в источник
              </p>
            </div>
          )}

          {/* Base source selector */}
          {type === 'extension' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Базовый источник
              </label>
              <select
                value={baseSource || ''}
                onChange={(e) => setBaseSource(e.target.value || null)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md"
              >
                <option value="">Выберите источник</option>
                {allSources.map(source => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Import source selector */}
          {type === 'import' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Источник для импорта
                </label>
                <select
                  value={importSourceId || ''}
                  onChange={(e) => {
                    const newSourceId = e.target.value || null;
                    setImportSourceId(newSourceId);
                    setImportFactionIds([]);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md"
                >
                  <option value="">Выберите источник</option>
                  {allSources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faction selection for import */}
              {importFactions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Фракции для импорта
                    </label>
                    <button
                      onClick={() => {
                        if (importFactionIds.length === importFactions.length) {
                          setImportFactionIds([]);
                        } else {
                          setImportFactionIds(importFactions.map(f => f.id));
                        }
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {importFactionIds.length === importFactions.length
                        ? 'Снять все'
                        : 'Все фракции'}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {importFactions.map(faction => {
                      const isSelected = importFactionIds.includes(faction.id);
                      return (
                        <label
                          key={faction.id}
                          className={`
                            flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors
                            ${isSelected
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setImportFactionIds(prev =>
                                  isSelected
                                    ? prev.filter(id => id !== faction.id)
                                    : [...prev, faction.id]
                                );
                              }}
                              className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                            />
                            <span className="text-sm text-slate-200">{faction.name}</span>
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">
                            {faction.totalUnits > 0
                              ? `${faction.squadsCount} отр. / ${faction.machinesCount} тех.`
                              : 'нет юнитов'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Юниты будут скопированы как кастомные
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
