/**
 * Export modal - export source as JSON file
 */

'use client';

import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { CustomSource } from '@/lib/editor/types';
import { getCustomSourcesStorage } from '@/lib/editor/storage';

interface ExportModalProps {
  source: CustomSource;
  onClose: () => void;
}

export function ExportModal({ source, onClose }: ExportModalProps) {
  const [exported, setExported] = useState(false);

  const handleDownloadJson = () => {
    const storage = getCustomSourcesStorage();
    const json = storage.exportToJson(source);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${source.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="export-source-modal">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-semibold">Экспорт</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-300">
            Скачать источник &quot;{source.name}&quot; в формате JSON.
          </p>
          <button
            onClick={handleDownloadJson}
            className="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Скачать JSON
          </button>
          {exported && (
            <div className="text-center text-xs text-emerald-400">
              Файл скачан
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
