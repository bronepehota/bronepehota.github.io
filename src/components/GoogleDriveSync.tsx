'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UploadCloud,
  DownloadCloud,
  Upload,
  Download,
  HelpCircle,
  Loader2,
  X,
} from 'lucide-react';
import {
  createConfigEnvelope,
  validateConfigEnvelope,
  generateConfigFileName,
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

interface GoogleDriveSyncProps {
  mode: 'export' | 'import';
  onImportComplete?: () => void;
  compact?: boolean;
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function GoogleDriveSync({
  mode,
  onImportComplete,
  compact = false,
}: GoogleDriveSyncProps) {
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

  // Check GIS availability on mount
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setGisAvailable(false);
      return;
    }

    let cancelled = false;
    loadGisScript()
      .then(() => {
        if (!cancelled) setGisAvailable(isGisAvailable());
      })
      .catch(() => {
        if (!cancelled) setGisAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  const showSuccess = useCallback((message: string) => {
    clearSuccess();
    setSuccessMessage(message);
    successTimerRef.current = setTimeout(() => {
      setSuccessMessage(null);
      successTimerRef.current = null;
    }, 3000);
  }, [clearSuccess]);

  const ensureToken = useCallback(async (): Promise<string> => {
    if (token) return token;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const newToken = await requestAccessToken(clientId);
    setToken(newToken);
    return newToken;
  }, [token]);

  // ---- Export via Google Drive ----
  const handleDriveExport = useCallback(async () => {
    setLoading(true);
    setError(null);
    clearSuccess();

    try {
      const accessToken = await ensureToken();
      const sources = getCustomSourcesStorage().getAll();
      const modifiers = getCustomModifiers();
      const envelope = createConfigEnvelope(sources, modifiers);
      await uploadConfigFile(accessToken, generateConfigFileName(), JSON.stringify(envelope));
      showSuccess('Настройки сохранены на Google Drive');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения на Google Drive');
    } finally {
      setLoading(false);
    }
  }, [ensureToken, showSuccess, clearSuccess]);

  // ---- Import via Google Drive: fetch file list ----
  const handleDriveImportList = useCallback(async () => {
    setLoading(true);
    setError(null);
    clearSuccess();
    setFiles([]);

    try {
      const accessToken = await ensureToken();
      const driveFiles = await listConfigFiles(accessToken);

      if (driveFiles.length === 0) {
        setError('На Google Drive нет сохранённых настроек. Сначала экспортируйте настройки с компьютера.');
        return;
      }

      setFiles(driveFiles);
      setShowFileList(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки списка файлов');
    } finally {
      setLoading(false);
    }
  }, [ensureToken, clearSuccess]);

  // ---- Import: select file from list ----
  const handleFileSelect = useCallback(async (file: DriveFile) => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = token || await ensureToken();
      const content = await downloadFile(accessToken, file.id);
      const result = validateConfigEnvelope(content);

      if (!result.valid) {
        setError(result.error || 'Файл повреждён или имеет неверный формат');
        return;
      }

      setPendingImportData(result.data!);
      setShowFileList(false);
      setShowConfirm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла');
    } finally {
      setLoading(false);
    }
  }, [token, ensureToken]);

  // ---- Import: confirm and apply ----
  const handleConfirmImport = useCallback(() => {
    if (!pendingImportData) return;

    try {
      const storage = getCustomSourcesStorage();
      for (const source of pendingImportData.sources) {
        storage.save(source);
      }

      const modResult = importCustomModifiers(JSON.stringify(pendingImportData.modifiers));

      const totalMods = modResult.added + modResult.updated;
      const totalSources = pendingImportData.sources.length;
      showSuccess(`Загружено: ${totalSources} армлистов, ${totalMods} способностей`);
      setShowConfirm(false);
      setPendingImportData(null);
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта настроек');
    }
  }, [pendingImportData, showSuccess, onImportComplete]);

  // ---- Fallback: export to file download ----
  const handleFileExport = useCallback(() => {
    setLoading(true);
    setError(null);
    clearSuccess();

    try {
      const sources = getCustomSourcesStorage().getAll();
      const modifiers = getCustomModifiers();
      const envelope = createConfigEnvelope(sources, modifiers);
      const json = JSON.stringify(envelope, null, 2);

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generateConfigFileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Настройки сохранены в файл');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения файла');
    } finally {
      setLoading(false);
    }
  }, [showSuccess, clearSuccess]);

  // ---- Fallback: import from file upload ----
  const handleFileImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      clearSuccess();

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const result = validateConfigEnvelope(content);

        if (!result.valid) {
          setError(result.error || 'Файл повреждён или имеет неверный формат');
          return;
        }

        setPendingImportData(result.data!);
        setShowConfirm(true);
      };
      reader.onerror = () => {
        setError('Ошибка чтения файла');
      };
      reader.readAsText(file);

      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [clearSuccess],
  );

  const dismissError = useCallback(() => setError(null), []);
  const dismissConfirm = useCallback(() => {
    setShowConfirm(false);
    setPendingImportData(null);
  }, []);
  const dismissFileList = useCallback(() => setShowFileList(false), []);

  // ---- Determine which mode to render ----
  const isFallback = gisAvailable === false;
  const isChecking = gisAvailable === null;

  // Main action button
  const renderMainButton = () => {
    if (isChecking) {
      return (
        <button
          disabled
          className={`${compact ? 'p-2' : 'px-4 py-2'} rounded-xl bg-slate-700/50 border border-slate-600/30 text-slate-400 flex items-center gap-2`}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          {!compact && <span className="text-sm">Проверка...</span>}
        </button>
      );
    }

    if (mode === 'export') {
      if (isFallback) {
        return (
          <button
            onClick={handleFileExport}
            disabled={loading}
            className={`${compact ? 'p-2' : 'px-4 py-2'} rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-300 flex items-center gap-2 transition-colors disabled:opacity-50`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {!compact && <span className="text-sm font-medium">Скачать настройки</span>}
          </button>
        );
      }

      return (
        <button
          onClick={handleDriveExport}
          disabled={loading}
          className={`${compact ? 'p-2' : 'px-4 py-2'} rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-300 flex items-center gap-2 transition-colors disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          {!compact && <span className="text-sm font-medium">Сохранить на Drive</span>}
        </button>
      );
    }

    // mode === 'import'
    if (isFallback) {
      return (
        <>
          <button
            onClick={handleFileImport}
            disabled={loading}
            className={`${compact ? 'p-2' : 'px-4 py-2'} rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-300 flex items-center gap-2 transition-colors disabled:opacity-50`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {!compact && <span className="text-sm font-medium">Импорт из файла</span>}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </>
      );
    }

    return (
      <button
        onClick={handleDriveImportList}
        disabled={loading}
        className={`${compact ? 'p-2' : 'px-4 py-2'} rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-300 flex items-center gap-2 transition-colors disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <DownloadCloud className="w-4 h-4" />
        )}
        {!compact && <span className="text-sm font-medium">Загрузить из Drive</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {renderMainButton()}

        <button
          onClick={() => setShowHelp(true)}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
          title="Как перенести настройки"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-900/30 border border-emerald-600/30 text-emerald-300 text-sm">
          <span className="flex-1">{successMessage}</span>
          <button
            onClick={clearSuccess}
            className="p-0.5 rounded hover:bg-emerald-800/30"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-900/30 border border-amber-600/30 text-amber-300 text-sm">
          <span className="flex-1">{error}</span>
          <button
            onClick={dismissError}
            className="p-0.5 rounded hover:bg-amber-800/30 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file input for fallback export (never used — export uses programmatic download) */}

      {/* File list modal */}
      {showFileList && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-100">
                Файлы на Google Drive
              </h3>
              <button
                onClick={dismissFileList}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileSelect(file)}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-3 disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{file.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDate(file.modifiedTime)}
                    </div>
                  </div>
                  <DownloadCloud className="w-4 h-4 text-blue-400 shrink-0" />
                </button>
              ))}
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-2 p-3 border-t border-slate-700/50 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">
              Подтвердите загрузку
            </h3>
            <p className="text-sm text-slate-300 mb-6">
              Будут заменены существующие армлисты и способности. Продолжить?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={dismissConfirm}
                className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Загрузить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help modal */}
      <ImportExportHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
