/**
 * Create source modal
 */

'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { getAllSources } from '@/lib/sources-registry';

interface CreateSourceModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; description: string; baseSource: string | null }) => void;
}

export function CreateSourceModal({ onClose, onCreate }: CreateSourceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'new' | 'extension'>('new');
  const [baseSource, setBaseSource] = useState<string | null>(null);

  const allSources = getAllSources();

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Введите название источника');
      return;
    }

    if (type === 'extension' && !baseSource) {
      alert('Выберите базовый источник');
      return;
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      baseSource: type === 'extension' ? baseSource : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
                  Создать новый источник с пустыми фракциями
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
            </div>
          </div>

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
