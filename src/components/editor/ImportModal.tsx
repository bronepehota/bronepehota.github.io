/**
 * Import modal - import source from JSON file or code
 */

'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileJson } from 'lucide-react';
import { CustomSource } from '@/lib/editor/types';
import { getCustomSourcesStorage } from '@/lib/editor/storage';

interface ImportModalProps {
  onClose: () => void;
  onImport: (source: CustomSource) => void;
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      readFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      tryImport(content);
    };
    reader.onerror = () => {
      setError('Ошибка чтения файла');
    };
    reader.readAsText(file);
  };

  const handleCodeImport = () => {
    if (!code.trim()) {
      setError('Введите код или вставьте JSON');
      return;
    }
    tryImport(code);
  };

  const tryImport = (content: string) => {
    try {
      const storage = getCustomSourcesStorage();
      const source = storage.importFromJson(content);
      onImport(source);
      onClose();
    } catch (err) {
      setError('Неверный формат JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-semibold">Импорт</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File drop zone */}
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${dragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileJson className="w-12 h-12 mx-auto mb-2 text-slate-500" />
            <div className="text-sm text-slate-300">
              Перетащите JSON файл сюда
            </div>
            <div className="text-xs text-slate-500 mt-1">
              или нажмите для выбора файла
            </div>
          </div>

          {/* Code input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Или вставьте JSON код
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md resize-none font-mono text-xs"
              rows={6}
              placeholder='{"id": "custom_...", "name": "...", ...}'
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 p-2 rounded">
              {error}
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
            onClick={handleCodeImport}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Импортировать
          </button>
        </div>
      </div>
    </div>
  );
}
