/**
 * Editor layout with 3-column sidebar for desktop
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

type EditorView = 'list' | 'edit-squad' | 'edit-machine' | 'create-squad' | 'create-machine';

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
    // Check if unit is from custom source (editable) or base source (read-only)
    const isCustom = type === 'squad'
      ? selectedSource?.squads.some(s => s.id === unitId)
      : selectedSource?.machines.some(m => m.id === unitId);

    if (isCustom) {
      setSelectedUnitId(unitId);
      setView(type === 'squad' ? 'edit-squad' : 'edit-machine');
    }
    // Base source units are read-only - can only be cloned
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedUnitId(null);
  };

  const selectedSquad = selectedSource?.squads.find(s => s.id === selectedUnitId);
  const selectedMachine = selectedSource?.machines.find(m => m.id === selectedUnitId);

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left column: Sources list */}
      <div className="w-64 border-r border-slate-700 overflow-y-auto">
        <SourcesList
          sources={sources}
          selectedId={selectedSourceId}
          onSelect={setSelectedSourceId}
          onCreateNew={() => setShowCreateModal(true)}
          onDelete={handleDeleteSource}
        />
      </div>

      {/* Middle column: Factions list */}
      <div className="w-64 border-r border-slate-700 overflow-y-auto">
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
          />
        ) : (
          <div className="p-4 text-slate-500 text-center">
            Выберите источник для просмотра фракций
          </div>
        )}
      </div>

      {/* Right column: Units list or Editor */}
      <div className="flex-1 overflow-y-auto">
        {view === 'list' && selectedFactionId && selectedSource && (
          <UnitsList
            source={selectedSource}
            baseSourceId={selectedSource.baseSource}
            factionId={selectedFactionId}
            onSelectUnit={handleSelectUnit}
            onCloneUnit={handleCloneUnit}
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
