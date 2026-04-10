/**
 * ModifierExportImport - JSON export/import for custom modifiers.
 * Two buttons: export downloads a Blob, import reads a .json file and merges.
 */

'use client';

import { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import {
  exportCustomModifiers,
  importCustomModifiers,
} from '@/lib/editor/modifier-storage';

interface ModifierExportImportProps {
  onImportComplete: () => void;
}

export function ModifierExportImport({ onImportComplete }: ModifierExportImportProps) {
  const [result, setResult] = useState<{ added: number; updated: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportCustomModifiers();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-modifiers.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setResult(null);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const importResult = importCustomModifiers(content);
      setResult(importResult);
      if (importResult.added > 0 || importResult.updated > 0) {
        onImportComplete();
      }
    };
    reader.onerror = () => {
      setResult({ added: 0, updated: 0, errors: ['Ошибка чтения файла'] });
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50
                     text-slate-200 transition-all"
          title="Экспортировать пользовательские модификаторы в JSON"
        >
          <Download className="w-3.5 h-3.5" />
          Экспорт JSON
        </button>

        <button
          onClick={handleImportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50
                     text-slate-200 transition-all"
          title="Импортировать модификаторы из JSON файла"
        >
          <Upload className="w-3.5 h-3.5" />
          Импорт JSON
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {result && (
        <div
          className={`text-xs px-3 py-2 rounded-lg border ${
            result.errors.length > 0
              ? 'bg-amber-950/40 border-amber-700/30 text-amber-300'
              : 'bg-emerald-950/40 border-emerald-700/30 text-emerald-300'
          }`}
        >
          {result.added > 0 && <span>Добавлено: {result.added}. </span>}
          {result.updated > 0 && <span>Обновлено: {result.updated}. </span>}
          {result.errors.length > 0 && (
            <span className="text-red-400">Ошибки: {result.errors.join('; ')}</span>
          )}
          {result.added === 0 && result.updated === 0 && result.errors.length === 0 && (
            <span>Новых модификаторов не найдено.</span>
          )}
        </div>
      )}
    </div>
  );
}
