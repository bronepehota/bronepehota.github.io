/**
 * Editor layout — desktop only
 * Mobile shows a notice with import/export functionality
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, Zap, Monitor } from 'lucide-react';
import { CustomSource, CustomFaction, CustomSquad, CustomMachine } from '@/lib/editor/types';
import { getCustomSourcesStorage } from '@/lib/editor/storage';
import { generateSourceId, generateFactionId, generateUnitId } from '@/lib/editor/id-generator';
import { getSource } from '@/lib/sources-registry';
import { getEncyclopediaFaction } from '@/lib/encyclopedia-registry';
import { SourcesList } from './SourcesList';
import { FactionsList } from './FactionsList';
import { UnitsList } from './UnitsList';
import { SquadEditor } from './SquadEditor';
import { MachineEditor } from './MachineEditor';
import { CreateSourceModal } from './CreateSourceModal';
import { ModifiersEditor } from './ModifiersEditor';
import { UnifiedSaveArea } from '@/components/editor/UnifiedSaveArea';

type EditorView = 'list' | 'edit-squad' | 'edit-machine' | 'create-squad' | 'create-machine' | 'override-squad' | 'override-machine';

export function EditorLayout() {
  // State
  const [sources, setSources] = useState<CustomSource[]>(() => {
    const storage = getCustomSourcesStorage();
    return storage.getAll();
  });

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [view, setView] = useState<EditorView>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Desktop tab state: 'units' shows 3-column list, 'modifiers' shows ModifiersEditor
  const [desktopTab, setDesktopTab] = useState<'units' | 'modifiers'>('units');

  // Override data from base source when editing base units
  const [overrideSquadData, setOverrideSquadData] = useState<CustomSquad | null>(null);
  const [overrideMachineData, setOverrideMachineData] = useState<CustomMachine | null>(null);

  // Derived state
  const selectedSource = sources.find(s => s.id === selectedSourceId) || null;

  // Get all factions (custom + base source factions for extensions)
  const allFactions = useMemo(() => {
    if (!selectedSource) return [];

    let factions = [...selectedSource.factions];

    // If this is an extension, add base source factions
    if (selectedSource.baseSource) {
      const baseSourceData = getSource(selectedSource.baseSource);
      if (baseSourceData) {
        const customFactionIds = new Set(selectedSource.factions.map(f => f.id));
        const baseFactions = baseSourceData.factions
          .filter(f => !customFactionIds.has(f.id))
          .map(f => {
            // Get full faction data from encyclopedia
            const encFaction = getEncyclopediaFaction(f.id);
            return {
              id: f.id,
              name: encFaction?.name || f.name || f.id,
              color: encFaction?.color || f.color || '#6b7280',
              description: encFaction?.description,
              isFromBase: true,
            } as CustomFaction;
          });

        factions = [...factions, ...baseFactions];
      }
    }

    return factions;
  }, [selectedSource]);

  // Handlers
  const handleCreateSource = (data: {
    name: string;
    description: string;
    baseSource: string | null;
    factionIds?: string[];
    importSourceId?: string;
    importFactionIds?: string[];
  }) => {
    const storage = getCustomSourcesStorage();
    const now = new Date().toISOString();

    // Build factions list
    let factions: CustomFaction[] = [];
    const importedSquads: CustomSquad[] = [];
    const importedMachines: CustomMachine[] = [];

    if (data.baseSource) {
      // Extension: copy base source factions
      const baseSourceData = getSource(data.baseSource);
      if (baseSourceData) {
        factions = baseSourceData.factions.map(f => {
          const encFaction = getEncyclopediaFaction(f.id);
          return {
            id: f.id,
            name: encFaction?.name || f.name || f.id,
            color: encFaction?.color || f.color || '#6b7280',
            description: encFaction?.description,
            isFromBase: true,
          };
        });
      }
    } else if (data.importSourceId && data.importFactionIds) {
      // Import: copy factions and units from selected source
      const sourceData = getSource(data.importSourceId);
      if (sourceData) {
        factions = data.importFactionIds.map(fId => {
          const encFaction = getEncyclopediaFaction(fId);
          const srcFaction = sourceData.factions.find(f => f.id === fId);
          return {
            id: fId,
            name: encFaction?.name || srcFaction?.name || fId,
            color: encFaction?.color || srcFaction?.color || '#6b7280',
            description: encFaction?.description,
          };
        });

        // Copy squads for selected factions
        const importedSquadIds = new Set<string>();
        for (const factionId of data.importFactionIds) {
          for (const squad of sourceData.squads) {
            if (squad.faction !== factionId) continue;
            const newId = generateUnitId(factionId, squad.name);
            if (importedSquadIds.has(newId)) {
              // Avoid duplicates by appending timestamp
              const uniqueId = `${newId}_${Date.now()}`;
              importedSquadIds.add(uniqueId);
              importedSquads.push({ ...squad, id: uniqueId, faction: factionId });
            } else {
              importedSquadIds.add(newId);
              importedSquads.push({ ...squad, id: newId, faction: factionId });
            }
          }
        }

        // Copy machines for selected factions
        const importedMachineIds = new Set<string>();
        for (const factionId of data.importFactionIds) {
          for (const machine of sourceData.machines) {
            if (machine.faction !== factionId) continue;
            const newId = generateUnitId(factionId, machine.name);
            if (importedMachineIds.has(newId)) {
              const uniqueId = `${newId}_${Date.now()}`;
              importedMachineIds.add(uniqueId);
              importedMachines.push({ ...machine, id: uniqueId, faction: factionId });
            } else {
              importedMachineIds.add(newId);
              importedMachines.push({ ...machine, id: newId, faction: factionId });
            }
          }
        }
      }
    } else if (data.factionIds && data.factionIds.length > 0) {
      // New source: use selected standard factions
      factions = data.factionIds.map(fId => {
        const encFaction = getEncyclopediaFaction(fId);
        return {
          id: fId,
          name: encFaction?.name || fId,
          color: encFaction?.color || '#6b7280',
          description: encFaction?.description,
        };
      });
    }

    const newSource: CustomSource = {
      id: generateSourceId(),
      name: data.name,
      description: data.description,
      version: '1.0',
      baseSource: data.baseSource,
      factions,
      squads: importedSquads,
      machines: importedMachines,
      hiddenUnits: [],
      createdAt: now,
      updatedAt: now,
    };

    storage.save(newSource);
    setSources(storage.getAll());
    setSelectedSourceId(newSource.id);
    setShowCreateModal(false);
  };

  const handleUpdateSource = (updated: CustomSource) => {
    const storage = getCustomSourcesStorage();
    storage.save(updated);
    setSources(storage.getAll());
  };

  const handleDeleteSource = (id: string) => {
    const storage = getCustomSourcesStorage();
    storage.delete(id);
    setSources(storage.getAll());

    if (selectedSourceId === id) {
      setSelectedSourceId(null);
      setSelectedFactionId(null);
      setSelectedUnitId(null);
    }
  };

  const handleCreateSquad = () => {
    if (!selectedSource || !selectedFactionId) {
      alert('Сначала выберите фракцию');
      return;
    }

    setSelectedUnitId(null);
    setView('create-squad');
  };

  const handleCreateMachine = () => {
    if (!selectedSource || !selectedFactionId) {
      alert('Сначала выберите фракцию');
      return;
    }

    setSelectedUnitId(null);
    setView('create-machine');
  };

  const handleCloneUnit = (unitId: string, type: 'squad' | 'machine') => {
    if (!selectedSource || !selectedFactionId) return;

    const clonedId = `${unitId}_custom_${Date.now()}`;

    if (type === 'squad') {
      // Find unit in base source or custom source
      let unitToClone = selectedSource.squads.find(s => s.id === unitId);

      if (!unitToClone && selectedSource.baseSource) {
        const baseSource = getSource(selectedSource.baseSource);
        if (baseSource) {
          unitToClone = baseSource.squads.find(s => s.id === unitId);
        }
      }

      if (unitToClone) {
        const cloned: CustomSquad = {
          ...unitToClone,
          id: clonedId,
          name: `${unitToClone.name} (копия)`,
          faction: selectedFactionId,
        };
        const updated = {
          ...selectedSource,
          squads: [...selectedSource.squads, cloned],
        };
        handleUpdateSource(updated);
      }
    } else {
      let unitToClone = selectedSource.machines.find(m => m.id === unitId);

      if (!unitToClone && selectedSource.baseSource) {
        const baseSource = getSource(selectedSource.baseSource);
        if (baseSource) {
          unitToClone = baseSource.machines.find(m => m.id === unitId);
        }
      }

      if (unitToClone) {
        const cloned: CustomMachine = {
          ...unitToClone,
          id: clonedId,
          name: `${unitToClone.name} (копия)`,
          faction: selectedFactionId,
        };
        const updated = {
          ...selectedSource,
          machines: [...selectedSource.machines, cloned],
        };
        handleUpdateSource(updated);
      }
    }
  };

  const handleSelectUnit = (unitId: string, type: 'squad' | 'machine') => {
    setSelectedUnitId(unitId);
    setView(type === 'squad' ? 'edit-squad' : 'edit-machine');
  };

  const handleOverrideUnit = (unitId: string, type: 'squad' | 'machine', unitData: CustomSquad | CustomMachine) => {
    // Store base unit data for the editor to use as override template
    if (type === 'squad') {
      setOverrideSquadData(unitData as CustomSquad);
      setOverrideMachineData(null);
    } else {
      setOverrideMachineData(unitData as CustomMachine);
      setOverrideSquadData(null);
    }

    setSelectedUnitId(unitId);
    setView(type === 'squad' ? 'override-squad' : 'override-machine');
  };

  const handleHideUnit = (unitId: string) => {
    if (!selectedSource) return;

    const hiddenUnits = selectedSource.hiddenUnits || [];
    const updated = {
      ...selectedSource,
      hiddenUnits: [...hiddenUnits, unitId],
      updatedAt: new Date().toISOString(),
    };
    handleUpdateSource(updated);
  };

  const handleRestoreUnit = (unitId: string) => {
    if (!selectedSource) return;

    const hiddenUnits = selectedSource.hiddenUnits || [];
    const updated = {
      ...selectedSource,
      hiddenUnits: hiddenUnits.filter(id => id !== unitId),
      updatedAt: new Date().toISOString(),
    };
    handleUpdateSource(updated);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedUnitId(null);
    setOverrideSquadData(null);
    setOverrideMachineData(null);
  };

  const selectedSquad = selectedSource?.squads.find(s => s.id === selectedUnitId);
  const selectedMachine = selectedSource?.machines.find(m => m.id === selectedUnitId);

  // Shared editor views (used by desktop)
  const renderEditorView = () => {
    if (view === 'create-squad' && selectedSource && selectedFactionId) {
      return (
        <SquadEditor
          source={selectedSource}
          factionId={selectedFactionId}
          onSave={(newSquad: CustomSquad) => {
            const updated = {
              ...selectedSource,
              squads: [...selectedSource.squads, newSquad],
            };
            handleUpdateSource(updated);
            handleBackToList();
          }}
          onCancel={handleBackToList}
        />
      );
    }

    if (view === 'create-machine' && selectedSource && selectedFactionId) {
      return (
        <MachineEditor
          source={selectedSource}
          factionId={selectedFactionId}
          onSave={(newMachine: CustomMachine) => {
            const updated = {
              ...selectedSource,
              machines: [...selectedSource.machines, newMachine],
            };
            handleUpdateSource(updated);
            handleBackToList();
          }}
          onCancel={handleBackToList}
        />
      );
    }

    if (view === 'edit-squad' && selectedSource && selectedSquad) {
      return (
        <SquadEditor
          squad={selectedSquad}
          source={selectedSource}
          factionId={selectedSquad.faction}
          onSave={(updatedSquad: CustomSquad) => {
            const updated = {
              ...selectedSource,
              squads: selectedSource.squads.map(s =>
                s.id === updatedSquad.id ? updatedSquad : s
              ),
            };
            handleUpdateSource(updated);
            handleBackToList();
          }}
          onCancel={handleBackToList}
        />
      );
    }

    if (view === 'edit-machine' && selectedSource && selectedMachine) {
      return (
        <MachineEditor
          machine={selectedMachine}
          source={selectedSource}
          factionId={selectedMachine.faction}
          onSave={(updatedMachine: CustomMachine) => {
            const updated = {
              ...selectedSource,
              machines: selectedSource.machines.map(m =>
                m.id === updatedMachine.id ? updatedMachine : m
              ),
            };
            handleUpdateSource(updated);
            handleBackToList();
          }}
          onCancel={handleBackToList}
        />
      );
    }

    if (view === 'override-squad' && selectedSource && selectedFactionId && overrideSquadData) {
      return (
        <SquadEditor
          squad={overrideSquadData}
          source={selectedSource}
          factionId={selectedFactionId}
          isOverride={true}
          onSave={(overrideSquad: CustomSquad) => {
            const existingIndex = selectedSource.squads.findIndex(s => s.id === overrideSquadData.id);
            const customSquad: CustomSquad = {
              ...overrideSquad,
              id: overrideSquadData.id,
              faction: selectedFactionId,
            };

            let newSquads: CustomSquad[];
            if (existingIndex >= 0) {
              newSquads = selectedSource.squads.map((s, i) =>
                i === existingIndex ? customSquad : s
              );
            } else {
              newSquads = [...selectedSource.squads, customSquad];
            }

            const updated = {
              ...selectedSource,
              squads: newSquads,
            };
            handleUpdateSource(updated);
            handleBackToList();
          }}
          onCancel={handleBackToList}
        />
      );
    }

    if (view === 'override-machine' && selectedSource && selectedFactionId && overrideMachineData) {
      return (
        <MachineEditor
          machine={overrideMachineData}
          source={selectedSource}
          factionId={selectedFactionId}
          isOverride={true}
          onSave={(overrideMachine: CustomMachine) => {
            const existingIndex = selectedSource.machines.findIndex(m => m.id === overrideMachineData.id);
            const customMachine: CustomMachine = {
              ...overrideMachine,
              id: overrideMachineData.id,
              faction: selectedFactionId,
            };

            let newMachines: CustomMachine[];
            if (existingIndex >= 0) {
              newMachines = selectedSource.machines.map((m, i) =>
                i === existingIndex ? customMachine : m
              );
            } else {
              newMachines = [...selectedSource.machines, customMachine];
            }

            const updated = {
              ...selectedSource,
              machines: newMachines,
            };
            handleUpdateSource(updated);
            handleBackToList();
          }}
          onCancel={handleBackToList}
        />
      );
    }

    return null;
  };

  // Breadcrumb info for context
  const factionName = allFactions.find(f => f.id === selectedFactionId)?.name;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-950">
      {/* Desktop layout */}
      <div className="hidden md:flex flex-col flex-1 min-h-0" id="editor-desktop">
        {/* Desktop top tab bar */}
        {view === 'list' && (
          <div className="flex items-center border-b border-slate-800/50 bg-slate-900/80 shrink-0 px-4">
            <button
              onClick={() => setDesktopTab('units')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                desktopTab === 'units'
                  ? 'text-white border-emerald-500'
                  : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              Юниты
            </button>
            <button
              onClick={() => setDesktopTab('modifiers')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                desktopTab === 'modifiers'
                  ? 'text-white border-violet-500'
                  : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              <Zap className="w-4 h-4" />
              Модификаторы
            </button>
            {/* Save/load controls in toolbar */}
            <div className="ml-auto">
              <UnifiedSaveArea mode="full" variant="toolbar" onImportComplete={() => { const s = getCustomSourcesStorage(); setSources(s.getAll()); }} />
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
        {view === 'list' ? (
          desktopTab === 'modifiers' ? (
            <div className="flex-1 min-h-0 overflow-hidden">
              <ModifiersEditor onRefresh={() => {}} />
            </div>
          ) : (
          <div className="flex w-full h-full min-h-0">
            {/* Left column: Sources list */}
            <div className="w-72 border-r border-slate-800/50 overflow-y-auto min-h-0">
              <SourcesList
                sources={sources}
                selectedId={selectedSourceId}
                onSelect={setSelectedSourceId}
                onCreateNew={() => setShowCreateModal(true)}
                onDelete={handleDeleteSource}
              />
            </div>

            {/* Middle column: Factions list */}
            <div className="w-80 border-r border-slate-800/50 overflow-y-auto min-h-0">
              {selectedSource ? (
                <FactionsList
                  factions={allFactions}
                  selectedId={selectedFactionId}
                  onSelect={setSelectedFactionId}
                  onCreateNew={() => {
                    const newFaction: CustomFaction = {
                      id: generateFactionId('Новая фракция'),
                      name: 'Новая фракция',
                      color: '#6b7280',
                    };
                    handleUpdateSource({
                      ...selectedSource,
                      factions: [...selectedSource.factions, newFaction],
                    });
                  }}
                  myUnitsCount={selectedSource.squads.length + selectedSource.machines.length + (selectedSource.hiddenUnits?.length || 0)}
                />
              ) : (
                <div className="p-4 text-slate-500 text-center">
                  Выберите источник для просмотра фракций
                </div>
              )}
            </div>

            {/* Right column: Units list */}
            <div className="flex-1 min-h-0 overflow-hidden bg-slate-900/30">
              {selectedFactionId && selectedSource ? (
                <UnitsList
                  source={selectedSource}
                  baseSourceId={selectedSource.baseSource}
                  factionId={selectedFactionId}
                  factions={allFactions}
                  onSelectUnit={handleSelectUnit}
                  onCloneUnit={handleCloneUnit}
                  onOverrideUnit={handleOverrideUnit}
                  onHideUnit={handleHideUnit}
                  onRestoreUnit={handleRestoreUnit}
                  onCreateSquad={handleCreateSquad}
                  onCreateMachine={handleCreateMachine}
                />
              ) : (
                <div className="p-4 text-slate-500 text-center">
                  Выберите фракцию для просмотра юнитов
                </div>
              )}
            </div>
          </div>
          )
        ) : (
          /* Full-width editor */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Breadcrumb bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/50 bg-slate-900/80 shrink-0">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
              <span className="text-slate-700">/</span>
              <span className="text-sm text-slate-400">{selectedSource?.name}</span>
              {factionName && (
                <>
                  <span className="text-slate-700">/</span>
                  <span className="text-sm text-slate-400">{factionName}</span>
                </>
              )}
            </div>
            {/* Editor content */}
            <div className="flex-1 overflow-hidden">
              {renderEditorView()}
            </div>
          </div>
        )}
        </div>
      </div>
      {/* Mobile notice — editor is desktop only */}
      <div className="md:hidden flex flex-col flex-1 min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
            <Monitor className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-2 max-w-xs">
            <h2 className="text-lg font-bold text-white">Редактор доступен на десктопе</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Перейдите на компьютер для полного редактирования юнитов, фракций и модификаторов.
            </p>
          </div>
          <UnifiedSaveArea mode="full" variant="compact" onImportComplete={() => { const s = getCustomSourcesStorage(); setSources(s.getAll()); }} />
        </div>
      </div>

      {/* Create Source Modal */}
      {showCreateModal && (
        <CreateSourceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSource}
        />
      )}
    </div>
  );
}
