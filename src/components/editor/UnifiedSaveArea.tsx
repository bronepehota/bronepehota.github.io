'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UploadCloud,
  DownloadCloud,
  Download,
  HelpCircle,
  Loader2,
  X,
  Save,
  FolderOpen,
} from 'lucide-react';
import {
  createConfigEnvelope,
  validateConfigEnvelope,
  generateConfigFileName,
  CURRENT_CONFIG_VERSION,
  type ConfigExportEnvelope,
} from '@/lib/config-export';
import {
  isGisAvailable,
  loadGisScript,
  requestAccessToken,
  listConfigFiles,
  downloadFile,
  uploadConfigFile,
  type DriveFile,
} from '@/lib/google-drive';
import { getCustomSourcesStorage } from '@/lib/editor/storage';
import { getCustomModifiers, importCustomModifiers } from '@/lib/editor/modifier-storage';
import { ImportExportHelp } from '@/components/modals/ImportExportHelp';

interface UnifiedSaveAreaProps {
  mode: 'full' | 'import-only';
  onImportComplete?: () => void;
  compact?: boolean;
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function UnifiedSaveArea({
  mode,
  onImportComplete,
  compact = false,
}: UnifiedSaveAreaProps) {
  const [token, setToken] = useState<string | null>(null);
  const [gisAvailable, setGisAvailable] = useState<boolean | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<ConfigExportEnvelope['data'] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Config metadata
  const sources = getCustomSourcesStorage().getAll();
  const modifiers = getCustomModifiers();
  const sourceCount = sources.length;
  const modifierCount = modifiers.buffs.length + modifiers.debuffs.length;
  const lastUpdated = sources.length > 0
    ? formatDate(new Date(Math.max(...sources.map(s => new Date(s.updatedAt).getTime()))).toISOString())
    : null;

  // Check GIS availability on mount
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setGisAvailable(false);
      return;
    }

    let cancelled = false;
    loadGisScript()
      .then(() => { if (!cancelled) setGisAvailable(isGisAvailable()); })
      .catch(() => { if (!cancelled) setGisAvailable(false); });

    return () => { cancelled = true; };
  }, []);

  // Cleanup success timer
  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); };
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
    if (successTimerRef.current) { clearTimeout(successTimerRef.current); successTimerRef.current = null; }
  }, []);

  const showSuccess = useCallback((message: string) => {
    clearSuccess();
    setSuccessMessage(message);
    successTimerRef.current = setTimeout(() => { setSuccessMessage(null); successTimerRef.current = null; }, 3000);
  }, [clearSuccess]);

  const ensureToken = useCallback(async (): Promise<string> => {
    if (token) return token;
    const newToken = await requestAccessToken(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!);
    setToken(newToken);
    return newToken;
  }, [token]);

  // ---- Save to file ----
  const handleFileExport = useCallback(() => {
    setLoading(true); setError(null); clearSuccess();
    try {
      const allSources = getCustomSourcesStorage().getAll();
      const allMods = getCustomModifiers();
      const envelope = createConfigEnvelope(allSources, allMods);
      const json = JSON.stringify(envelope, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = generateConfigFileName();
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      showSuccess('Настройки сохранены в файл');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения файла');
    } finally { setLoading(false); }
  }, [showSuccess, clearSuccess]);

  // ---- Save to Drive ----
  const handleDriveExport = useCallback(async () => {
    setLoading(true); setError(null); clearSuccess();
    try {
      const accessToken = await ensureToken();
      const allSources = getCustomSourcesStorage().getAll();
      const allMods = getCustomModifiers();
      const envelope = createConfigEnvelope(allSources, allMods);
      await uploadConfigFile(accessToken, generateConfigFileName(), JSON.stringify(envelope));
      showSuccess('Настройки сохранены на Google Drive');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения на Google Drive');
    } finally { setLoading(false); }
  }, [ensureToken, showSuccess, clearSuccess]);

  // ---- Load from file ----
  const handleFileImport = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); clearSuccess();
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = validateConfigEnvelope(event.target?.result as string);
      if (!result.valid) { setError(result.error || 'Файл повреждён'); return; }
      setPendingImportData(result.data!); setShowConfirm(true);
    };
    reader.onerror = () => { setError('Ошибка чтения файла'); };
    reader.readAsText(file);
    e.target.value = '';
  }, [clearSuccess]);

  // ---- Load from Drive ----
  const handleDriveImportList = useCallback(async () => {
    setLoading(true); setError(null); clearSuccess(); setFiles([]);
    try {
      const accessToken = await ensureToken();
      const driveFiles = await listConfigFiles(accessToken);
      if (driveFiles.length === 0) {
        setError('На Google Drive нет сохранённых настроек. Сначала экспортируйте настройки с компьютера.');
        return;
      }
      setFiles(driveFiles); setShowFileList(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки списка файлов');
    } finally { setLoading(false); }
  }, [ensureToken, clearSuccess]);

  const handleFileSelect = useCallback(async (file: DriveFile) => {
    setLoading(true); setError(null);
    try {
      const accessToken = token || await ensureToken();
      const content = await downloadFile(accessToken, file.id);
      const result = validateConfigEnvelope(content);
      if (!result.valid) { setError(result.error || 'Файл повреждён'); return; }
      setPendingImportData(result.data!); setShowFileList(false); setShowConfirm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла');
    } finally { setLoading(false); }
  }, [token, ensureToken]);

  // ---- Confirm import ----
  const handleConfirmImport = useCallback(() => {
    if (!pendingImportData) return;
    try {
      const storage = getCustomSourcesStorage();
      for (const source of pendingImportData.sources) { storage.save(source); }
      const modResult = importCustomModifiers(JSON.stringify(pendingImportData.modifiers));
      showSuccess(`Загружено: ${pendingImportData.sources.length} армлистов, ${modResult.added + modResult.updated} способностей`);
      setShowConfirm(false); setPendingImportData(null);
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    }
  }, [pendingImportData, showSuccess, onImportComplete]);

  const driveReady = gisAvailable === true;
  const isChecking = gisAvailable === null;

  // ---- Compact mode (header, mobile) ----
  if (compact) {
    return (
      <>
        <div className="flex items-center gap-1">
          {mode === 'full' && (
            <>
              <button onClick={handleFileExport} disabled={loading} title="Сохранить в файл"
                className="p-2 rounded-lg bg-slate-600/20 hover:bg-slate-600/40 border border-slate-500/30 text-slate-300 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              {driveReady && (
                <button onClick={handleDriveExport} disabled={loading} title="Сохранить на Drive"
                  className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 transition-colors disabled:opacity-50">
                  <UploadCloud className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          <button onClick={handleFileImport} disabled={loading} title="Загрузить из файла"
            className="p-2 rounded-lg bg-slate-600/20 hover:bg-slate-600/40 border border-slate-500/30 text-slate-300 transition-colors disabled:opacity-50">
            <FolderOpen className="w-4 h-4" />
          </button>
          {driveReady && (
            <button onClick={handleDriveImportList} disabled={loading} title="Загрузить из Drive"
              className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 transition-colors disabled:opacity-50">
              <DownloadCloud className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setShowHelp(true)} title="Как перенести настройки"
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileInputChange} />

        {/* Modals */}
        {successMessage && !showFileList && !showConfirm && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-900/80 border border-emerald-600/40 text-emerald-200 text-sm backdrop-blur-sm shadow-lg">
            {successMessage}
          </div>
        )}
        {error && !showFileList && !showConfirm && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm px-4 py-2 rounded-xl bg-amber-900/80 border border-amber-600/40 text-amber-200 text-sm backdrop-blur-sm shadow-lg flex items-center gap-2">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-0.5"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {showFileList && (
          <FileListModal files={files} loading={loading} onSelect={handleFileSelect} onClose={() => setShowFileList(false)} />
        )}
        {showConfirm && (
          <ConfirmDialog onConfirm={handleConfirmImport} onCancel={() => { setShowConfirm(false); setPendingImportData(null); }} />
        )}
        <ImportExportHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </>
    );
  }

  // ---- Full mode (desktop editor) ----
  return (
    <div className="border-b border-slate-700/50">
      {/* Metadata row */}
      <div className="px-4 py-2.5 flex items-center gap-3 bg-slate-900/50">
        <span className="text-xs font-mono text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
          v{CURRENT_CONFIG_VERSION}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400">
            {sourceCount > 0 ? `${sourceCount} армлистов` : 'Нет армлистов'}
            {modifierCount > 0 && `, ${modifierCount} способностей`}
          </div>
          <div className="text-xs text-slate-600">
            {lastUpdated ? `Сохранено: ${lastUpdated}` : 'Не сохранено'}
          </div>
        </div>
        <button onClick={() => setShowHelp(true)} title="Как перенести настройки"
          className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action buttons */}
      {mode === 'full' && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          <button onClick={handleFileExport} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/30 text-slate-300 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Сохранить в файл
          </button>
          {driveReady && (
            <button onClick={handleDriveExport} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 transition-colors disabled:opacity-50">
              <UploadCloud className="w-3.5 h-3.5" />
              Сохранить на Drive
            </button>
          )}
          <button onClick={handleFileImport} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/30 text-slate-300 transition-colors disabled:opacity-50">
            <FolderOpen className="w-3.5 h-3.5" />
            Загрузить из файла
          </button>
          {driveReady && (
            <button onClick={handleDriveImportList} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 transition-colors disabled:opacity-50">
              <DownloadCloud className="w-3.5 h-3.5" />
              Загрузить из Drive
            </button>
          )}
          {isChecking && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Проверка Drive...
            </div>
          )}
        </div>
      )}

      {mode === 'import-only' && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          <button onClick={handleFileImport} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/30 text-slate-300 transition-colors disabled:opacity-50">
            <FolderOpen className="w-3.5 h-3.5" />
            Загрузить из файла
          </button>
          {driveReady && (
            <button onClick={handleDriveImportList} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 transition-colors disabled:opacity-50">
              <DownloadCloud className="w-3.5 h-3.5" />
              Загрузить из Drive
            </button>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileInputChange} />

      {/* Messages */}
      {successMessage && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-600/30 text-emerald-300 text-xs">
          <span className="flex-1">{successMessage}</span>
          <button onClick={clearSuccess} className="p-0.5 rounded hover:bg-emerald-800/30"><X className="w-3 h-3" /></button>
        </div>
      )}
      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 px-3 py-1.5 rounded-lg bg-amber-900/30 border border-amber-600/30 text-amber-300 text-xs">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="p-0.5 rounded hover:bg-amber-800/30 shrink-0"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Modals */}
      {showFileList && (
        <FileListModal files={files} loading={loading} onSelect={handleFileSelect} onClose={() => setShowFileList(false)} />
      )}
      {showConfirm && (
        <ConfirmDialog onConfirm={handleConfirmImport} onCancel={() => { setShowConfirm(false); setPendingImportData(null); }} />
      )}
      <ImportExportHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

// ---- Sub-components ----

function FileListModal({ files, loading, onSelect, onClose }: {
  files: DriveFile[];
  loading: boolean;
  onSelect: (file: DriveFile) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100">Файлы на Google Drive</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {files.map((file) => (
            <button key={file.id} onClick={() => onSelect(file)} disabled={loading}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-3 disabled:opacity-50">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-200 truncate">{file.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{formatDate(file.modifiedTime)}</div>
              </div>
              <DownloadCloud className="w-4 h-4 text-blue-400 shrink-0" />
            </button>
          ))}
        </div>
        {loading && (
          <div className="flex items-center justify-center gap-2 p-3 border-t border-slate-700/50 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Загрузка...
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-3">Подтвердите загрузку</h3>
        <p className="text-sm text-slate-300 mb-6">Будут заменены существующие армлисты и способности. Продолжить?</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800 transition-colors">Отмена</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors">Загрузить</button>
        </div>
      </div>
    </div>
  );
}
