/**
 * Machine editor component
 */

'use client';

import { useState } from 'react';
import { CustomMachine, CustomSource, CustomWeapon, CustomSpeedSector } from '@/lib/editor/types';
import { generateUnitId } from '@/lib/editor/id-generator';
import { Save, X, Plus, Trash2 } from 'lucide-react';

interface MachineEditorProps {
  machine?: CustomMachine;
  source: CustomSource;
  factionId: string;
  onSave: (machine: CustomMachine) => void;
  onCancel: () => void;
}

export function MachineEditor({ machine, source, factionId, onSave, onCancel }: MachineEditorProps) {
  const [name, setName] = useState(machine?.name || '');
  const [shortName, setShortName] = useState(machine?.shortName || '');
  const [cost, setCost] = useState(machine?.cost || 200);
  const [rank, setRank] = useState(machine?.rank || 2);
  const [fireRate, setFireRate] = useState(machine?.fire_rate || 2);
  const [ammoMax, setAmmoMax] = useState(machine?.ammo_max || 20);
  const [durabilityMax, setDurabilityMax] = useState(machine?.durability_max || 16);
  const [image, setImage] = useState(machine?.image || '');
  const [weapons, setWeapons] = useState<CustomWeapon[]>(
    machine?.weapons || [{ name: 'Main Gun', range: 'D12', power: '2D20' }]
  );
  const [speedSectors, setSpeedSectors] = useState<CustomSpeedSector[]>(
    machine?.speed_sectors || [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 },
    ]
  );

  const handleAddWeapon = () => {
    if (weapons.length < 4) {
      setWeapons([...weapons, { name: 'New Weapon', range: 'D6', power: '1D6' }]);
    }
  };

  const handleRemoveWeapon = (index: number) => {
    if (weapons.length > 1) {
      setWeapons(weapons.filter((_, i) => i !== index));
    }
  };

  const handleUpdateWeapon = (index: number, updates: Partial<CustomWeapon>) => {
    setWeapons(weapons.map((w, i) => (i === index ? { ...w, ...updates } : w)));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Введите название техники');
      return;
    }

    const machineData: CustomMachine = {
      id: machine?.id || generateUnitId(factionId, name),
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      faction: factionId,
      cost,
      rank,
      fire_rate: fireRate,
      ammo_max: ammoMax,
      durability_max: durabilityMax,
      image: image.trim() || undefined,
      weapons,
      speed_sectors: speedSectors,
    };

    onSave(machineData);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h2 className="text-lg font-semibold">
          {machine ? 'Редактирование техники' : 'Новая техника'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-500 transition-colors"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Краткое название</label>
            <input
              type="text"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md"
              placeholder="Опционально"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Стоимость</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md"
              min="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ранг</label>
              <input
                type="number"
                value={rank}
                onChange={(e) => setRank(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Скорострельность</label>
              <input
                type="number"
                value={fireRate}
                onChange={(e) => setFireRate(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md"
                min="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Боезапас</label>
              <input
                type="number"
                value={ammoMax}
                onChange={(e) => setAmmoMax(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Прочность</label>
              <input
                type="number"
                value={durabilityMax}
                onChange={(e) => setDurabilityMax(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">URL изображения</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md"
            placeholder="https://..."
          />
        </div>

        {/* Weapons */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Оружие</h3>
            <button
              onClick={handleAddWeapon}
              disabled={weapons.length >= 4}
              className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {weapons.map((weapon, index) => (
              <div key={index} className="bg-slate-800 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={weapon.name}
                    onChange={(e) => handleUpdateWeapon(index, { name: e.target.value })}
                    className="flex-1 px-2 bg-slate-900 border border-slate-700 rounded text-sm"
                    placeholder="Название"
                  />
                  <button
                    onClick={() => handleRemoveWeapon(index)}
                    disabled={weapons.length <= 1}
                    className="p-1 ml-2 text-slate-400 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Дальность</label>
                    <input
                      type="text"
                      value={weapon.range}
                      onChange={(e) => handleUpdateWeapon(index, { range: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Мощность</label>
                    <input
                      type="text"
                      value={weapon.power}
                      onChange={(e) => handleUpdateWeapon(index, { power: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Sectors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Сектора скорости</h3>
          </div>

          <div className="bg-slate-800 rounded-md p-3 space-y-2">
            {speedSectors.map((sector, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 w-20">
                  {sector.min_durability}-{sector.max_durability}:
                </span>
                <span className="text-white">{sector.speed} шаг(а)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
