'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Squad, Machine, FactionID, Soldier, Weapon, SpeedSector } from '@/lib/types';
import factionsData from '@/data/factions.json';
import { Save, Plus, Trash2, X, FileImage } from 'lucide-react';

type EditorMode = 'squad' | 'machine';

interface ArmlistEditorProps {
  mode?: EditorMode;
  initialSquad?: Squad;
  initialMachine?: Machine;
  onSave?: () => void;
}

export default function ArmlistEditor({ 
  mode: initialMode = 'squad', 
  initialSquad, 
  initialMachine,
  onSave 
}: ArmlistEditorProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>(initialMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Squad state
  const [squadData, setSquadData] = useState<Partial<Squad>>({
    id: '',
    name: '',
    faction: 'polaris',
    cost: 0,
    image: '',
    originalUrl: '',
    soldiers: []
  });

  // Machine state
  const [machineData, setMachineData] = useState<Partial<Machine>>({
    id: '',
    name: '',
    faction: 'polaris',
    cost: 0,
    rank: 2,
    fire_rate: 1,
    ammo_max: 0,
    durability_max: 0,
    image: '',
    originalUrl: '',
    speed_sectors: [],
    weapons: []
  });

  useEffect(() => {
    if (initialSquad) {
      setSquadData(initialSquad);
      setEditorMode('squad');
    }
    if (initialMachine) {
      setMachineData(initialMachine);
      setEditorMode('machine');
    }
  }, [initialSquad, initialMachine]);

  const generateId = (name: string, faction: string): string => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-zа-я0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `${faction}_${slug}`;
  };

  const handleImagePaste = async (e: React.ClipboardEvent, setImage: (url: string) => void) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          await uploadImage(file, setImage);
        }
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setImage: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(file, setImage);
    }
  };

  const uploadImage = async (file: File, setImage: (url: string) => void) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', editorMode === 'squad' ? 'squad' : 'machine');

      const response = await fetch('/api/armlists/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения');
      }

      const data = await response.json();
      setImage(data.path);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки изображения');
    }
  };

  const handleSaveSquad = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Generate ID if new
      const id = squadData.id || generateId(squadData.name || '', squadData.faction || 'polaris');
      
      const squad: Squad = {
        id,
        name: squadData.name || '',
        faction: (squadData.faction || 'polaris') as FactionID,
        cost: squadData.cost || 0,
        soldiers: squadData.soldiers || [],
        image: squadData.image,
        originalUrl: squadData.originalUrl
      };

      const response = await fetch('/api/armlists/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(squad)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSave?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMachine = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const id = machineData.id || generateId(machineData.name || '', machineData.faction || 'polaris');
      
      const machine: Machine = {
        id,
        name: machineData.name || '',
        faction: (machineData.faction || 'polaris') as FactionID,
        cost: machineData.cost || 0,
        rank: machineData.rank || 2,
        fire_rate: machineData.fire_rate || 1,
        ammo_max: machineData.ammo_max || 0,
        durability_max: machineData.durability_max || 0,
        speed_sectors: machineData.speed_sectors || [],
        weapons: machineData.weapons || [],
        image: machineData.image,
        originalUrl: machineData.originalUrl
      };

      const response = await fetch('/api/armlists/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(machine)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSave?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Mode selector */}
      <div className="flex gap-2 md:gap-3">
        <button
          onClick={() => setEditorMode('squad')}
          className={`flex-1 px-4 md:px-6 py-3 md:py-4 rounded-xl font-bold transition-all duration-200 min-h-[44px] md:min-h-0 border-2 ${
            editorMode === 'squad'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-105 border-blue-500'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border-slate-700'
          }`}
        >
          Взвод солдат
        </button>
        <button
          onClick={() => setEditorMode('machine')}
          className={`flex-1 px-4 md:px-6 py-3 md:py-4 rounded-xl font-bold transition-all duration-200 min-h-[44px] md:min-h-0 border-2 ${
            editorMode === 'machine'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-105 border-blue-500'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border-slate-700'
          }`}
        >
          Техника
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/40 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 duration-200">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/40 border border-green-700/50 text-green-200 px-4 py-3 rounded-xl animate-in slide-in-from-top-2 duration-200">
          Успешно сохранено!
        </div>
      )}

      {editorMode === 'squad' ? (
        <SquadEditor 
          data={squadData} 
          setData={setSquadData}
          onImagePaste={(e, setImage) => handleImagePaste(e, setImage)}
          onImageUpload={(e, setImage) => handleImageUpload(e, setImage)}
          onSave={handleSaveSquad}
          saving={saving}
        />
      ) : (
        <MachineEditor 
          data={machineData} 
          setData={setMachineData}
          onImagePaste={(e, setImage) => handleImagePaste(e, setImage)}
          onImageUpload={(e, setImage) => handleImageUpload(e, setImage)}
          onSave={handleSaveMachine}
          saving={saving}
        />
      )}
    </div>
  );
}

// Squad Editor Component
interface SquadEditorProps {
  data: Partial<Squad>;
  setData: (data: Partial<Squad>) => void;
  onImagePaste: (e: React.ClipboardEvent, setImage: (url: string) => void) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, setImage: (url: string) => void) => void;
  onSave: () => void;
  saving: boolean;
}

function SquadEditor({ data, setData, onImagePaste, onImageUpload, onSave, saving }: SquadEditorProps) {
  const addSoldier = () => {
    const soldiers = data.soldiers || [];
    setData({
      ...data,
      soldiers: [...soldiers, {
        rank: 2,
        speed: 4,
        range: 'D6',
        power: '1D6',
        melee: 0,
        props: [],
        armor: 2
      }]
    });
  };

  const removeSoldier = (index: number) => {
    const soldiers = data.soldiers || [];
    setData({
      ...data,
      soldiers: soldiers.filter((_, i) => i !== index)
    });
  };

  const updateSoldier = (index: number, field: keyof Soldier, value: any) => {
    const soldiers = data.soldiers || [];
    const updated = [...soldiers];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, soldiers: updated });
  };

  const addSoldierProp = (soldierIndex: number, prop: string) => {
    const soldiers = data.soldiers || [];
    const updated = [...soldiers];
    const props = updated[soldierIndex].props || [];
    if (!props.includes(prop)) {
      updated[soldierIndex].props = [...props, prop];
      setData({ ...data, soldiers: updated });
    }
  };

  const removeSoldierProp = (soldierIndex: number, propIndex: number) => {
    const soldiers = data.soldiers || [];
    const updated = [...soldiers];
    updated[soldierIndex].props = (updated[soldierIndex].props || []).filter((_, i) => i !== propIndex);
    setData({ ...data, soldiers: updated });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold">Редактор взвода</h2>

      {/* Basic info */}
      <div className="glass-strong p-5 md:p-6 rounded-2xl border border-slate-700/50 space-y-5 shadow-xl">
        <h3 className="text-lg font-semibold">Основная информация</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Фракция *</label>
            <select
              value={data.faction || 'polaris'}
              onChange={(e) => setData({ ...data, faction: e.target.value as FactionID })}
              className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-500"
            >
              {factionsData.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Стоимость *</label>
            <input
              type="number"
              value={data.cost || 0}
              onChange={(e) => setData({ ...data, cost: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Название *</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-500"
            placeholder="Например: Легкая штурмовая клон-пехота"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ссылка на армлист</label>
          <input
            type="url"
            value={data.originalUrl || ''}
            onChange={(e) => setData({ ...data, originalUrl: e.target.value })}
            className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-500"
            placeholder="https://vk.com/photo-..."
          />
        </div>

        <ImageUploadField
          label="Изображение армлиста"
          value={data.image || ''}
          onChange={(url) => setData({ ...data, image: url })}
          onPaste={onImagePaste}
          onUpload={onImageUpload}
        />
      </div>

      {/* Soldiers */}
      <div className="glass-strong p-5 md:p-6 rounded-2xl border border-slate-700/50 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Солдаты</h3>
          <button
            onClick={addSoldier}
            disabled={(data.soldiers?.length || 0) >= 6}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all min-h-[44px] md:min-h-0 shadow-lg shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить солдата</span>
          </button>
        </div>

        {(data.soldiers || []).map((soldier, idx) => (
          <SoldierEditor
            key={idx}
            soldier={soldier}
            index={idx}
            onUpdate={(field, value) => updateSoldier(idx, field, value)}
            onRemove={() => removeSoldier(idx)}
            onAddProp={(prop) => addSoldierProp(idx, prop)}
            onRemoveProp={(propIndex) => removeSoldierProp(idx, propIndex)}
            onImagePaste={onImagePaste}
            onImageUpload={onImageUpload}
          />
        ))}

        {(!data.soldiers || data.soldiers.length === 0) && (
          <p className="text-slate-400 text-sm text-center py-6">Добавьте солдат в взвод</p>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={saving || !data.name || !data.faction || (data.soldiers?.length || 0) === 0}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 transition-all active:scale-[0.98] min-h-[52px]"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Сохранение...' : 'Сохранить взвод'}
      </button>
    </div>
  );
}

// Soldier Editor Component
interface SoldierEditorProps {
  soldier: Soldier;
  index: number;
  onUpdate: (field: keyof Soldier, value: any) => void;
  onRemove: () => void;
  onAddProp: (prop: string) => void;
  onRemoveProp: (propIndex: number) => void;
  onImagePaste: (e: React.ClipboardEvent, setImage: (url: string) => void) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, setImage: (url: string) => void) => void;
}

function SoldierEditor({ 
  soldier, 
  index, 
  onUpdate, 
  onRemove, 
  onAddProp, 
  onRemoveProp,
  onImagePaste,
  onImageUpload
}: SoldierEditorProps) {
  const [newProp, setNewProp] = useState('');

  return (
    <div className="bg-slate-800/60 p-4 md:p-5 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-base md:text-lg">Солдат {index + 1}</h4>
        <button
          onClick={onRemove}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5">Ранг *</label>
          <input
            type="number"
            value={soldier.rank}
            onChange={(e) => onUpdate('rank', parseInt(e.target.value) || 0)}
            className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Скорость *</label>
          <input
            type="number"
            value={soldier.speed}
            onChange={(e) => onUpdate('speed', parseInt(e.target.value) || 0)}
            className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Дальность *</label>
          <input
            type="text"
            value={soldier.range}
            onChange={(e) => onUpdate('range', e.target.value)}
            className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
            placeholder="D6, D12, ББ"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Мощность *</label>
          <input
            type="text"
            value={soldier.power}
            onChange={(e) => onUpdate('power', e.target.value)}
            className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
            placeholder="1D6, 2D12"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">ББ *</label>
          <input
            type="number"
            value={soldier.melee}
            onChange={(e) => onUpdate('melee', parseInt(e.target.value) || 0)}
            className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5">Броня *</label>
          <input
            type="number"
            value={soldier.armor}
            onChange={(e) => onUpdate('armor', parseInt(e.target.value) || 0)}
            className="w-full bg-slate-800 border-2 border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium mb-2">Изображение солдата</label>
        <ImageUploadField
          value={soldier.image || ''}
          onChange={(url) => onUpdate('image', url)}
          onPaste={onImagePaste}
          onUpload={onImageUpload}
          compact
        />
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium mb-2">Спец свойства</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newProp}
            onChange={(e) => setNewProp(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newProp.trim()) {
                onAddProp(newProp.trim());
                setNewProp('');
              }
            }}
            className="flex-1 bg-slate-800 border-2 border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
            placeholder="Например: Г (граната)"
          />
          <button
            onClick={() => {
              if (newProp.trim()) {
                onAddProp(newProp.trim());
                setNewProp('');
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all min-h-[44px] md:min-h-0"
          >
            Добавить
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(soldier.props || []).map((prop, propIdx) => (
            <span
              key={propIdx}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700/50 rounded-lg text-sm border border-slate-600/50"
            >
              {prop}
              <button
                onClick={() => onRemoveProp(propIdx)}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Machine Editor Component
interface MachineEditorProps {
  data: Partial<Machine>;
  setData: (data: Partial<Machine>) => void;
  onImagePaste: (e: React.ClipboardEvent, setImage: (url: string) => void) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, setImage: (url: string) => void) => void;
  onSave: () => void;
  saving: boolean;
}

function MachineEditor({ data, setData, onImagePaste, onImageUpload, onSave, saving }: MachineEditorProps) {
  const addWeapon = () => {
    const weapons = data.weapons || [];
    setData({
      ...data,
      weapons: [...weapons, { name: '', range: '', power: '' }]
    });
  };

  const removeWeapon = (index: number) => {
    const weapons = data.weapons || [];
    setData({
      ...data,
      weapons: weapons.filter((_, i) => i !== index)
    });
  };

  const updateWeapon = (index: number, field: keyof Weapon, value: string) => {
    const weapons = data.weapons || [];
    const updated = [...weapons];
    const newValue = field === 'special' && !value.trim() ? undefined : value;
    updated[index] = { ...updated[index], [field]: newValue };
    setData({ ...data, weapons: updated });
  };

  const addSpeedSector = () => {
    const sectors = data.speed_sectors || [];
    setData({
      ...data,
      speed_sectors: [...sectors, { min_durability: 1, max_durability: 0, speed: 1 }]
    });
  };

  const removeSpeedSector = (index: number) => {
    const sectors = data.speed_sectors || [];
    setData({
      ...data,
      speed_sectors: sectors.filter((_, i) => i !== index)
    });
  };

  const updateSpeedSector = (index: number, field: keyof SpeedSector, value: number) => {
    const sectors = data.speed_sectors || [];
    const updated = [...sectors];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, speed_sectors: updated });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Редактор техники</h2>

      {/* Basic info */}
      <div className="bg-slate-800 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">Основная информация</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Фракция *</label>
          <select
            value={data.faction || 'polaris'}
            onChange={(e) => setData({ ...data, faction: e.target.value as FactionID })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
          >
            {factionsData.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Название *</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
            placeholder="Например: Demolisher"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Стоимость *</label>
            <input
              type="number"
              value={data.cost || 0}
              onChange={(e) => setData({ ...data, cost: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ранг *</label>
            <input
              type="number"
              value={data.rank || 2}
              onChange={(e) => setData({ ...data, rank: parseInt(e.target.value) || 2 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Боезапас *</label>
            <input
              type="number"
              value={data.ammo_max || 0}
              onChange={(e) => setData({ ...data, ammo_max: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Прочность *</label>
            <input
              type="number"
              value={data.durability_max || 0}
              onChange={(e) => setData({ ...data, durability_max: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Скорость стрельбы</label>
          <input
            type="number"
            value={data.fire_rate || 1}
            onChange={(e) => setData({ ...data, fire_rate: parseInt(e.target.value) || 1 })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ссылка на армлист</label>
          <input
            type="url"
            value={data.originalUrl || ''}
            onChange={(e) => setData({ ...data, originalUrl: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
            placeholder="https://vk.com/photo-..."
          />
        </div>

        <ImageUploadField
          label="Изображение армлиста"
          value={data.image || ''}
          onChange={(url) => setData({ ...data, image: url })}
          onPaste={onImagePaste}
          onUpload={onImageUpload}
        />
      </div>

      {/* Speed sectors */}
      <div className="bg-slate-800 p-4 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Секторы скорости</h3>
          <button
            onClick={addSpeedSector}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded"
          >
            <Plus className="w-4 h-4" />
            Добавить сектор
          </button>
        </div>

        {(data.speed_sectors || []).map((sector, idx) => (
          <div key={idx} className="bg-slate-700/50 p-3 rounded border border-slate-600">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Сектор {idx + 1}</span>
              <button
                onClick={() => removeSpeedSector(idx)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Мин. прочность</label>
                <input
                  type="number"
                  value={sector.min_durability}
                  onChange={(e) => updateSpeedSector(idx, 'min_durability', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Макс. прочность</label>
                <input
                  type="number"
                  value={sector.max_durability}
                  onChange={(e) => updateSpeedSector(idx, 'max_durability', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Скорость</label>
                <input
                  type="number"
                  value={sector.speed}
                  onChange={(e) => updateSpeedSector(idx, 'speed', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weapons */}
      <div className="bg-slate-800 p-4 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Оружие</h3>
          <button
            onClick={addWeapon}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded"
          >
            <Plus className="w-4 h-4" />
            Добавить оружие
          </button>
        </div>

        {(data.weapons || []).map((weapon, idx) => (
          <div key={idx} className="bg-slate-700/50 p-3 rounded border border-slate-600">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Оружие {idx + 1}</span>
              <button
                onClick={() => removeWeapon(idx)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={weapon.name}
                onChange={(e) => updateWeapon(idx, 'name', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                placeholder="Название оружия"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={weapon.range}
                  onChange={(e) => updateWeapon(idx, 'range', e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                  placeholder="Дальность (D6, D12, ББ)"
                />
                <input
                  type="text"
                  value={weapon.power}
                  onChange={(e) => updateWeapon(idx, 'power', e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                  placeholder="Мощность (1D6, 2D12)"
                />
              </div>
              <input
                type="text"
                value={typeof weapon.special === 'string' ? weapon.special : JSON.stringify(weapon.special || '')}
                onChange={(e) => updateWeapon(idx, 'special', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
                placeholder="Спец свойство (опционально)"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={saving || !data.name || !data.faction}
        className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Сохранение...' : 'Сохранить технику'}
      </button>
    </div>
  );
}

// Image Upload Field Component
interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  onPaste: (e: React.ClipboardEvent, setImage: (url: string) => void) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, setImage: (url: string) => void) => void;
  compact?: boolean;
}

function ImageUploadField({ label, value, onChange, onPaste, onUpload, compact }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPasting, setIsPasting] = useState(false);

  return (
    <div className={compact ? '' : 'space-y-2'}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div
        className={`border-2 border-dashed border-slate-600 rounded-lg p-4 ${
          isPasting ? 'border-blue-500 bg-blue-900/20' : 'hover:border-slate-500'
        } transition-colors`}
        onPaste={(e) => {
          setIsPasting(true);
          onPaste(e, onChange);
          setTimeout(() => setIsPasting(false), 500);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            const fakeEvent = {
              target: { files: [file] }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            onUpload(fakeEvent, onChange);
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e, onChange)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {value ? (
            <>
              <Image src={value} alt="Preview" width={200} height={192} className="max-w-full max-h-48 rounded" unoptimized />
              <button
                onClick={() => onChange('')}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Удалить изображение
              </button>
            </>
          ) : (
            <>
              <FileImage className="w-8 h-8 text-slate-400" />
              <div className="text-sm text-slate-400">
                <p>Перетащите изображение сюда или</p>
                <p>нажмите для выбора файла</p>
                <p className="text-xs mt-1">или вставьте из буфера обмена (Ctrl+V)</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              >
                Выбрать файл
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

