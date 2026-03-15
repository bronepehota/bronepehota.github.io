/**
 * Export modal - export source as JSON or QR codes
 */

'use client';

import { useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSource } from '@/lib/editor/types';
import { getCustomSourcesStorage } from '@/lib/editor/storage';
import { splitForQr, generateQrCode } from '@/lib/editor/qr-code';

interface ExportModalProps {
  source: CustomSource;
  onClose: () => void;
}

export function ExportModal({ source, onClose }: ExportModalProps) {
  const [tab, setTab] = useState<'json' | 'qr'>('json');
  const [qrChunks, setQrChunks] = useState<string[]>([]);
  const [currentQr, setCurrentQr] = useState(0);

  const handleGenerateQr = async () => {
    const chunks = splitForQr(source);
    const qrCodes: string[] = [];
    for (const chunk of chunks) {
      const qrCode = await generateQrCode(chunk);
      qrCodes.push(qrCode);
    }
    setQrChunks(qrCodes);
    setCurrentQr(0);
  };

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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setTab('json')}
            className={`
              flex-1 px-3 py-2 text-sm font-medium transition-colors
              ${tab === 'json'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-400 hover:text-slate-300'
              }
            `}
          >
            JSON файл
          </button>
          <button
            onClick={() => {
              setTab('qr');
              handleGenerateQr();
            }}
            className={`
              flex-1 px-3 py-2 text-sm font-medium transition-colors
              ${tab === 'qr'
                ? 'text-white border-b-2 border-white'
                : 'text-slate-400 hover:text-slate-300'
              }
            `}
          >
            QR коды
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {tab === 'json' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Скачать источник "{source.name}" в формате JSON.
              </p>
              <button
                onClick={handleDownloadJson}
                className="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Скачать JSON
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {qrChunks.length > 0 ? (
                <>
                  <div className="flex items-center justify-center">
                    <img
                      src={qrChunks[currentQr]}
                      alt={`QR код ${currentQr + 1}`}
                      className="max-w-full"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCurrentQr(Math.max(0, currentQr - 1))}
                      disabled={currentQr === 0}
                      className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-slate-300">
                      {currentQr + 1} / {qrChunks.length}
                    </span>
                    <button
                      onClick={() => setCurrentQr(Math.min(qrChunks.length - 1, currentQr + 1))}
                      disabled={currentQr === qrChunks.length - 1}
                      className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  Генерация QR кодов...
                </div>
              )}
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
