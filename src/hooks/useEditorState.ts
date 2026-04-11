/**
 * Editor state management hook
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { CustomSource, CustomFaction, CustomSquad, CustomMachine } from '@/lib/editor/types';
import { getCustomSourcesStorage } from '@/lib/editor/storage';
import { generateSourceId, generateFactionId, generateUnitId } from '@/lib/editor/id-generator';

type EditorView = 'list' | 'edit-squad' | 'edit-machine';

interface EditorState {
  sources: CustomSource[];
  selectedSourceId: string | null;
  selectedFactionId: string | null;
  selectedUnitId: string | null;
  selectedUnitType: 'squad' | 'machine';
  view: EditorView;
  isDirty: boolean;
}

interface EditorActions {
  // Source actions
  createSource: (data: { name: string; description: string; baseSource: string | null }) => CustomSource;
  updateSource: (source: CustomSource) => void;
  deleteSource: (id: string) => void;

  // Faction actions
  selectFaction: (id: string | null) => void;
  createFaction: (data: { name: string; color: string }) => CustomFaction;

  // Unit actions
  selectUnit: (id: string | null, type: 'squad' | 'machine') => void;
  createSquad: (data: Partial<CustomSquad>) => CustomSquad;
  updateSquad: (squad: CustomSquad) => void;
  deleteSquad: (id: string) => void;
  createMachine: (data: Partial<CustomMachine>) => CustomMachine;
  updateMachine: (machine: CustomMachine) => void;
  deleteMachine: (id: string) => void;

  // View actions
  setView: (view: EditorView) => void;
  goBack: () => void;

  // Import/Export
  importSource: (json: string) => CustomSource;
  exportSource: (id: string) => string;
}

interface UseEditorStateReturn extends EditorState, EditorActions {
  // Derived state
  selectedSource: CustomSource | null;
  selectedFaction: CustomFaction | null;
  selectedSquad: CustomSquad | null;
  selectedMachine: CustomMachine | null;
}

export function useEditorState(): UseEditorStateReturn {
  const storage = useMemo(() => getCustomSourcesStorage(), []);

  // State
  const [sources, setSources] = useState<CustomSource[]>(() => storage.getAll());
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<'squad' | 'machine'>('squad');
  const [view, setView] = useState<EditorView>('list');
  const [isDirty, setIsDirty] = useState(false);

  // Derived state
  const selectedSource = useMemo(
    () => sources.find(s => s.id === selectedSourceId) || null,
    [sources, selectedSourceId]
  );
  const selectedFaction = useMemo(
    () => selectedSource?.factions.find(f => f.id === selectedFactionId) || null,
    [selectedSource, selectedFactionId]
  );
  const selectedSquad = useMemo(
    () => selectedSource?.squads.find(s => s.id === selectedUnitId) || null,
    [selectedSource, selectedUnitId]
  );
  const selectedMachine = useMemo(
    () => selectedSource?.machines.find(m => m.id === selectedUnitId) || null,
    [selectedSource, selectedUnitId]
  );

  // Helper to persist changes
  const persistSources = useCallback((updatedSources: CustomSource[]) => {
    setSources(updatedSources);
    setIsDirty(false);
  }, []);

  // Source actions
  const createSource = useCallback((data: { name: string; description: string; baseSource: string | null }) => {
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
    persistSources(storage.getAll());
    setSelectedSourceId(newSource.id);

    return newSource;
  }, [storage, persistSources]);

  const updateSource = useCallback((source: CustomSource) => {
    const updated = { ...source, updatedAt: new Date().toISOString() };
    storage.save(updated);
    persistSources(storage.getAll());
  }, [storage, persistSources]);

  const deleteSource = useCallback((id: string) => {
    storage.delete(id);
    persistSources(storage.getAll());

    if (selectedSourceId === id) {
      setSelectedSourceId(null);
      setSelectedFactionId(null);
      setSelectedUnitId(null);
    }
  }, [storage, persistSources, selectedSourceId]);

  // Faction actions
  const selectFaction = useCallback((id: string | null) => {
    setSelectedFactionId(id);
    setSelectedUnitId(null);
    setView('list');
  }, []);

  const createFaction = useCallback((data: { name: string; color: string }) => {
    if (!selectedSource) {
      throw new Error('No source selected');
    }

    const newFaction: CustomFaction = {
      id: generateFactionId(data.name),
      name: data.name,
      color: data.color,
    };

    const updated = {
      ...selectedSource,
      factions: [...selectedSource.factions, newFaction],
    };

    updateSource(updated);
    return newFaction;
  }, [selectedSource, updateSource]);

  // Unit actions
  const selectUnit = useCallback((id: string | null, type: 'squad' | 'machine') => {
    setSelectedUnitId(id);
    setSelectedUnitType(type);
    if (id) {
      setView(type === 'squad' ? 'edit-squad' : 'edit-machine');
    }
  }, []);

  const createSquad = useCallback((data: Partial<CustomSquad>) => {
    if (!selectedSource || !selectedFaction) {
      throw new Error('No source or faction selected');
    }

    const name = data.name || 'Новый отряд';
    const newSquad: CustomSquad = {
      id: generateUnitId(selectedFaction.id, name),
      name,
      faction: selectedFaction.id,
      cost: data.cost || 100,
      shortName: data.shortName,
      image: data.image,
      soldiers: data.soldiers || [
        { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 }
      ],
    };

    const updated = {
      ...selectedSource,
      squads: [...selectedSource.squads, newSquad],
    };

    updateSource(updated);
    return newSquad;
  }, [selectedSource, selectedFaction, updateSource]);

  const updateSquad = useCallback((squad: CustomSquad) => {
    if (!selectedSource) {
      throw new Error('No source selected');
    }

    const updated = {
      ...selectedSource,
      squads: selectedSource.squads.map(s =>
        s.id === squad.id ? squad : s
      ),
    };

    updateSource(updated);
  }, [selectedSource, updateSource]);

  const deleteSquad = useCallback((id: string) => {
    if (!selectedSource) {
      throw new Error('No source selected');
    }

    const updated = {
      ...selectedSource,
      squads: selectedSource.squads.filter(s => s.id !== id),
    };

    updateSource(updated);

    if (selectedUnitId === id) {
      setSelectedUnitId(null);
      setView('list');
    }
  }, [selectedSource, updateSource, selectedUnitId]);

  const createMachine = useCallback((data: Partial<CustomMachine>) => {
    if (!selectedSource || !selectedFaction) {
      throw new Error('No source or faction selected');
    }

    const name = data.name || 'Новая техника';
    const newMachine: CustomMachine = {
      id: generateUnitId(selectedFaction.id, name),
      name,
      faction: selectedFaction.id,
      cost: data.cost || 200,
      rank: data.rank || 2,
      fire_rate: data.fire_rate || 2,
      ammo_max: data.ammo_max || 20,
      durability_max: data.durability_max || 16,
      shortName: data.shortName,
      image: data.image,
      weapons: data.weapons || [{ name: 'Main Gun', range: 'D12', power: '2D20' }],
      speed_sectors: data.speed_sectors || [
        { min_durability: 9, max_durability: 16, speed: 2 },
        { min_durability: 1, max_durability: 8, speed: 1 },
      ],
    };

    const updated = {
      ...selectedSource,
      machines: [...selectedSource.machines, newMachine],
    };

    updateSource(updated);
    return newMachine;
  }, [selectedSource, selectedFaction, updateSource]);

  const updateMachine = useCallback((machine: CustomMachine) => {
    if (!selectedSource) {
      throw new Error('No source selected');
    }

    const updated = {
      ...selectedSource,
      machines: selectedSource.machines.map(m =>
        m.id === machine.id ? machine : m
      ),
    };

    updateSource(updated);
  }, [selectedSource, updateSource]);

  const deleteMachine = useCallback((id: string) => {
    if (!selectedSource) {
      throw new Error('No source selected');
    }

    const updated = {
      ...selectedSource,
      machines: selectedSource.machines.filter(m => m.id !== id),
    };

    updateSource(updated);

    if (selectedUnitId === id) {
      setSelectedUnitId(null);
      setView('list');
    }
  }, [selectedSource, updateSource, selectedUnitId]);

  // View actions
  const goBack = useCallback(() => {
    setView('list');
    setSelectedUnitId(null);
  }, []);

  // Import/Export
  const importSource = useCallback((json: string) => {
    const source = storage.importFromJson(json);
    storage.save(source);
    persistSources(storage.getAll());
    return source;
  }, [storage, persistSources]);

  const exportSource = useCallback((id: string) => {
    const source = storage.getById(id);
    if (!source) {
      throw new Error('Source not found');
    }
    return storage.exportToJson(source);
  }, [storage]);

  return {
    // State
    sources,
    selectedSourceId,
    selectedFactionId,
    selectedUnitId,
    selectedUnitType,
    view,
    isDirty,

    // Derived state
    selectedSource,
    selectedFaction,
    selectedSquad,
    selectedMachine,

    // Actions
    createSource,
    updateSource,
    deleteSource,
    selectFaction,
    createFaction,
    selectUnit,
    createSquad,
    updateSquad,
    deleteSquad,
    createMachine,
    updateMachine,
    deleteMachine,
    setView,
    goBack,
    importSource,
    exportSource,
  };
}
