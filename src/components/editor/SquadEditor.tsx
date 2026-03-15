/**
 * Squad editor component
 */

'use client';

import { useState } from 'react';
import { CustomSquad, CustomSource, CustomSoldier } from '@/lib/editor/types';
import { generateUnitId } from '@/lib/editor/id-generator';
import { Save, X, Plus } from 'lucide-react';
import { SoldiersTable } from './SoldiersTable';

interface SquadEditorProps {
  squad?: CustomSquad;
  source: CustomSource;
  factionId: string;
  onSave: (squad: CustomSquad) => void;
  onCancel: () => void;
}

export function SquadEditor({ squad, source, factionId, onSave, onCancel }: SquadEditorProps) {
  const [name, setName] = useState(squad?.name || '');
  const [shortName, setShortName] = useState(squad?.shortName || '');
  const [cost, setCost] = useState(squad?.cost || 100);
  const [image, setImage] = useState(squad?.image || '');
  const [soldiers, setSoldiers] = useState<CustomSoldier[]>(
    squad?.soldiers || [
      { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
    ]
  );

  const handleAddSoldier = () => {
    if (soldiers.length < 6) {
      setSoldiers([
        ...soldiers,
        { rank: 7, speed: 4, range: 'D6', power: '1D6', melee: 0, props: [], armor: 2 }
      ]);
    }
  };

  const handleRemoveSoldier = (index: number) => {
    if (soldiers.length > 1) {
      setSoldiers(soldiers.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSoldier = (index: number, updates: Partial<CustomSoldier>) => {
    setSoldiers(soldiers.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Введите название отряда');
      return;
    }

    const squadData: CustomSquad = {
      id: squad?.id || generateUnitId(factionId, name),
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      faction: factionId,
      cost,
      image: image.trim() || undefined,
      soldiers,
    };

    onSave(squadData);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h2 className="text-lg font-semibold">
          {squad ? 'Редактирование отряда' : 'Новый отряд'}
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

        {/* Soldiers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">
              Солдаты ({soldiers.length}/6)
            </h3>
            <button
              onClick={handleAddSoldier}
              disabled={soldiers.length >= 6}
              className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <SoldiersTable
            soldiers={soldiers}
            onUpdate={handleUpdateSoldier}
            onRemove={handleRemoveSoldier}
          />
        </div>
      </div>
    </div>
  );
}
