'use client';

import { X } from 'lucide-react';

interface ImportExportHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportExportHelp({ isOpen, onClose }: ImportExportHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100">
            Как перенести настройки
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4 text-sm text-slate-300">
          <div>
            <h4 className="font-semibold text-slate-100 mb-2">На компьютере (редактор)</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Откройте редактор</li>
              <li>Нажмите «Сохранить на Drive»</li>
              <li>Войдите в Google, если потребуется</li>
              <li>Готово — настройки сохранены на Google Drive</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 mb-2">На телефоне</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Нажмите «Загрузить из Drive»</li>
              <li>Войдите в Google, если потребуется</li>
              <li>Выберите файл из списка</li>
              <li>Готово!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}