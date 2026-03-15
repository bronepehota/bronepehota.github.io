/**
 * Editor layout with responsive design
 * Desktop: 3-column sidebar
 * Mobile (< 768px): Tabs + bottom sheet for editing
 */

'use client';

import { useState, useMemo } from 'react';
import { CustomSource, CustomFaction, CustomSquad, CustomMachine } from '@/lib/editor/types';
import { getCustomSourcesStorage } from '@/lib/editor/storage';
import { generateSourceId, generateFactionId } from '@/lib/editor/id-generator';
import { getSource } from '@/lib/sources-registry';
import { getEncyclopediaFaction } from '@/lib/encyclopedia-registry';
import { SourcesList } from './SourcesList';
import { FactionsList } from './FactionsList';
import { UnitsList } from './UnitsList';
import { SquadEditor } from './SquadEditor';
import { MachineEditor } from './MachineEditor';
import { CreateSourceModal } from './CreateSourceModal';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';

type EditorView = 'list' | 'edit-squad' | 'edit-machine' | 'create-squad' | 'create-machine' | 'override-squad' | 'override-machine';
type MobileTab = 'sources' | 'factions' | 'units';

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<MobileTab>('sources');

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
  }) => {
    const storage = getCustomSourcesStorage();
    const now = new Date().toISOString();

    // If creating an extension, copy base source factions
    let factions: CustomFaction[] = [];
    if (data.baseSource) {
      const baseSourceData = getSource(data.baseSource);
      if (baseSourceData) {
        factions = baseSourceData.factions.map(f => {
          // Get full faction data from encyclopedia
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
    }

    const newSource: CustomSource = {
      id: generateSourceId(),
      name: data.name,
      description: data.description,
      version: '1.0',
      baseSource: data.baseSource,
      factions,
      squads: [],
      machines: [],
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

  const handleImportSource = (importedSource: CustomSource) => {
    const storage = getCustomSourcesStorage();

    // Check if source with same ID already exists
    const existing = storage.getById(importedSource.id);

    if (existing) {
      // Generate new ID for duplicate
      const newSource = {
        ...importedSource,
        id: generateSourceId(),
        name: `${importedSource.name} (импорт)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storage.save(newSource);
    } else {
      storage.save(importedSource);
    }

    setSources(storage.getAll());
    setShowImportModal(false);
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

  // Mobile tab content
  const renderMobileContent = () => {
    switch (mobileTab) {
      case 'sources':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-3">
              <SourcesList
                sources={sources}
                selectedId={selectedSourceId}
                onSelect={(id) => {
                  setSelectedSourceId(id);
                  // Auto-navigate to factions on mobile
                  if (id) setMobileTab('factions');
                }}
                onCreateNew={() => setShowCreateModal(true)}
                onDelete={handleDeleteSource}
                onExport={() => selectedSource && setShowExportModal(true)}
                onImport={() => setShowImportModal(true)}
              />
            </div>
          </div>
        );
      case 'factions':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-3">
              {selectedSource ? (
                <FactionsList
                  factions={allFactions}
                  selectedId={selectedFactionId}
                  onSelect={(id) => {
                    setSelectedFactionId(id);
                    // Auto-navigate to units on mobile
                    if (id) setMobileTab('units');
                  }}
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
                <div className="p-6 text-center">
                  <div className="text-slate-500 text-sm">Сначала выберите источник</div>
                </div>
              )}
            </div>
          </div>
        );
      case 'units':
        return (
          <div className="h-full flex flex-col">
            {selectedFactionId && selectedSource ? (
              <UnitsList
                source={selectedSource}
                baseSourceId={selectedSource.baseSource}
                factionId={selectedFactionId}
                factions={allFactions}
                onSelectUnit={(unitId, type) => {
                  setSelectedUnitId(unitId);
                  setView(type === 'squad' ? 'edit-squad' : 'edit-machine');
                }}
                onCloneUnit={handleCloneUnit}
                onOverrideUnit={handleOverrideUnit}
                onHideUnit={handleHideUnit}
                onRestoreUnit={handleRestoreUnit}
                onCreateSquad={handleCreateSquad}
                onCreateMachine={handleCreateMachine}
              />
            ) : (
              <div className="p-6 text-center">
                <div className="text-slate-500 text-sm">Сначала выберите фракцию</div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-950">
      {/* Desktop layout */}
      <div className="hidden md:flex flex-1">
        <div className="flex w-full">
          {/* Left column: Sources list */}
          <div className="w-72 border-r border-slate-800/50 overflow-y-auto">
            <SourcesList
              sources={sources}
              selectedId={selectedSourceId}
              onSelect={setSelectedSourceId}
              onCreateNew={() => setShowCreateModal(true)}
              onDelete={handleDeleteSource}
              onExport={() => selectedSource && setShowExportModal(true)}
              onImport={() => setShowImportModal(true)}
            />
          </div>

          {/* Middle column: Factions list */}
          <div className="w-80 border-r border-slate-800/50 overflow-y-auto">
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

          {/* Right column: Units list or Editor */}
          <div className="flex-1 overflow-hidden bg-slate-900/30">
            {view === 'list' && selectedFactionId && selectedSource && (
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
            )}

            {view === 'list' && !selectedFactionId && (
              <div className="p-4 text-slate-500 text-center">
                Выберите фракцию для просмотра юнитов
              </div>
            )}

            {view === 'create-squad' && selectedSource && selectedFactionId && (
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
            )}

            {view === 'create-machine' && selectedSource && selectedFactionId && (
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
            )}

            {view === 'edit-squad' && selectedSource && selectedSquad && (
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
            )}

            {view === 'edit-machine' && selectedSource && selectedMachine && (
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
            )}

            {view === 'override-squad' && selectedSource && selectedFactionId && overrideSquadData && (
              <SquadEditor
                squad={overrideSquadData}
                source={selectedSource}
                factionId={selectedFactionId}
                isOverride={true}
                onSave={(overrideSquad: CustomSquad) => {
                  // Override: keep same ID as base unit, replace if already exists
                  const existingIndex = selectedSource.squads.findIndex(s => s.id === overrideSquadData.id);
                  const customSquad: CustomSquad = {
                    ...overrideSquad,
                    id: overrideSquadData.id, // Keep base unit ID
                    faction: selectedFactionId,
                  };

                  let newSquads: CustomSquad[];
                  if (existingIndex >= 0) {
                    // Replace existing override
                    newSquads = selectedSource.squads.map((s, i) =>
                      i === existingIndex ? customSquad : s
                    );
                  } else {
                    // Add new override
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
            )}

            {view === 'override-machine' && selectedSource && selectedFactionId && overrideMachineData && (
              <MachineEditor
                machine={overrideMachineData}
                source={selectedSource}
                factionId={selectedFactionId}
                isOverride={true}
                onSave={(overrideMachine: CustomMachine) => {
                  // Override: keep same ID as base unit, replace if already exists
                  const existingIndex = selectedSource.machines.findIndex(m => m.id === overrideMachineData.id);
                  const customMachine: CustomMachine = {
                    ...overrideMachine,
                    id: overrideMachineData.id, // Keep base unit ID
                    faction: selectedFactionId,
                  };

                  let newMachines: CustomMachine[];
                  if (existingIndex >= 0) {
                    // Replace existing override
                    newMachines = selectedSource.machines.map((m, i) =>
                      i === existingIndex ? customMachine : m
                    );
                  } else {
                    // Add new override
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
            )}
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {view === 'list' ? (
            renderMobileContent()
          ) : (
            /* Editor as bottom sheet on mobile */
            <div className="h-full overflow-y-auto">
              {view === 'create-squad' && selectedSource && selectedFactionId && (
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
              )}

              {view === 'create-machine' && selectedSource && selectedFactionId && (
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
              )}

              {view === 'edit-squad' && selectedSource && selectedSquad && (
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
              )}

              {view === 'edit-machine' && selectedSource && selectedMachine && (
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
              )}

              {view === 'override-squad' && selectedSource && selectedFactionId && overrideSquadData && (
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
              )}

              {view === 'override-machine' && selectedSource && selectedFactionId && overrideMachineData && (
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
              )}
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        {view === 'list' && (
          <div className="flex items-center justify-around border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm px-2 py-2">
            <button
              onClick={() => setMobileTab('sources')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                mobileTab === 'sources'
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <span className="text-lg">📁</span>
              <span className="text-[10px]">Источники</span>
            </button>
            <button
              onClick={() => selectedSource && setMobileTab('factions')}
              disabled={!selectedSource}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                mobileTab === 'factions'
                  ? 'bg-cyan-600/20 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-400 disabled:opacity-50'
              }`}
            >
              <span className="text-lg">⚔️</span>
              <span className="text-[10px]">Фракции</span>
            </button>
            <button
              onClick={() => selectedFactionId && setMobileTab('units')}
              disabled={!selectedFactionId}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                mobileTab === 'units'
                  ? 'bg-amber-600/20 text-amber-400'
                  : 'text-slate-500 hover:text-slate-400 disabled:opacity-50'
              }`}
            >
              <span className="text-lg">🎖️</span>
              <span className="text-[10px]">Юниты</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Source Modal */}
      {showCreateModal && (
        <CreateSourceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSource}
        />
      )}

      {/* Export Modal */}
      {showExportModal && selectedSource && (
        <ExportModal
          source={selectedSource}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportSource}
        />
      )}
    </div>
  );
}
