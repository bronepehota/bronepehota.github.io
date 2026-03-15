/**
 * Editor layout with 3-column sidebar for desktop
 */

'use client';

import { useState } from 'react';
import { CustomSource, CustomFaction, CustomSquad, CustomMachine } from '@/lib/editor/types';
import { getCustomSourcesStorage } from '@/lib/editor/storage';
import { generateSourceId, generateFactionId } from '@/lib/editor/id-generator';
import { SourcesList } from './SourcesList';
import { FactionsList } from './FactionsList';
import { UnitsList } from './UnitsList';
import { SquadEditor } from './SquadEditor';
import { MachineEditor } from './MachineEditor';
import { CreateSourceModal } from './CreateSourceModal';

type EditorView = 'list' | 'edit-squad' | 'edit-machine';

export function EditorLayout() {
  // State
  const [sources, setSources] = useState<CustomSource[]>(() => {
    const storage = getCustomSourcesStorage();
    return storage.getAll();
  });

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<'squad' | 'machine'>('squad');
  const [view, setView] = useState<EditorView>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Derived state
  const selectedSource = sources.find(s => s.id === selectedSourceId) || null;
  const selectedFaction = selectedSource?.factions.find(f => f.id === selectedFactionId) || null;

  // Handlers
  const handleCreateSource = (data: {
    name: string;
    description: string;
    baseSource: string | null;
  }) => {
    const storage = getCustomSourcesStorage();
    const now = new Date().toISOString();

    const newSource: CustomSource = {
      id: generateSourceId(),
      name: data.name,
      description: data.description,
      version: '1.0',
      baseSource: data.baseSource,
      factions: [],
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

  const handleSelectUnit = (unitId: string, type: 'squad' | 'machine') => {
    setSelectedUnitId(unitId);
    setSelectedUnitType(type);
    setView(type === 'squad' ? 'edit-squad' : 'edit-machine');
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
            factions={selectedSource.factions}
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
        {view === 'list' && selectedFaction && selectedSource && (
          <UnitsList
            source={selectedSource}
            factionId={selectedFaction.id}
            onSelectUnit={handleSelectUnit}
          />
        )}

        {view === 'list' && !selectedFaction && (
          <div className="p-4 text-slate-500 text-center">
            Выберите фракцию для просмотра юнитов
          </div>
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
