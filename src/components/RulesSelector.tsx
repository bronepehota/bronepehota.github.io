'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Book, Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { RulesVersion, RulesVersionID } from '@/lib/types';
import { PanicToggle } from './PanicToggle';

interface RulesSelectorProps {
  versions: RulesVersion[];
  selectedVersion: RulesVersionID;
  onVersionChange: (id: RulesVersionID) => void;
  onConfirm?: () => void;
  panicEnabled?: boolean;
  onPanicEnabledChange?: (enabled: boolean) => void;
}

export function RulesSelector({
  versions,
  selectedVersion,
  onVersionChange,
  onConfirm,
  panicEnabled = true,
  onPanicEnabledChange,
}: RulesSelectorProps) {
  const [expandedRulesId, setExpandedRulesId] = useState<RulesVersionID | null>(null);
  const debouncedSaveRef = useRef<NodeJS.Timeout>();

  // Auto-expand selected version on mount
  useEffect(() => {
    if (selectedVersion && expandedRulesId !== selectedVersion) {
      setExpandedRulesId(selectedVersion);
    }
  }, [selectedVersion, expandedRulesId]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, []);

  const handleRulesClick = (rulesId: RulesVersionID) => {
    // Immediate UI update
    onVersionChange(rulesId);
    setExpandedRulesId(rulesId === expandedRulesId ? null : rulesId);

    // Debounced localStorage write
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = setTimeout(() => {
      localStorage.setItem('bronepehota_rules_version', rulesId);
    }, 300);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, rulesId: RulesVersionID) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRulesClick(rulesId);
    } else if (e.key === 'Escape' && expandedRulesId === rulesId) {
      setExpandedRulesId(null);
    }
  };

  return (
    <div id="rules-selector" className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Book className="w-6 h-6 text-slate-500" />
          <h2 className="text-2xl font-bold text-slate-200 font-mono tracking-wider">ПРАВИЛА ИГРЫ</h2>
          <Book className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm text-slate-400">Выберите версию правил для вашей партии</p>
      </div>

      {/* Panic toggle - optional setting */}
      {onPanicEnabledChange && (
        <div className="max-w-2xl mx-auto">
          <PanicToggle
            enabled={panicEnabled}
            onEnabledChange={onPanicEnabledChange}
            rulesVersion={selectedVersion}
          />
        </div>
      )}

      {/* Responsive grid: single column mobile, 2-3 columns desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {versions.map((version) => {
          const isSelected = selectedVersion === version.id;
          const isExpanded = expandedRulesId === version.id;

          return (
            <div
              key={version.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-expanded={isExpanded}
              aria-label={`Версия правил ${version.name}, ${isSelected ? 'выбрана' : 'не выбрана'}`}
              onKeyDown={(e) => handleKeyDown(e, version.id)}
              onClick={() => handleRulesClick(version.id)}
              data-testid={`rules-card-${version.id}`}
              className={clsx(
                'relative group cursor-pointer transition-all duration-300',
                'border bg-slate-800/80 backdrop-blur-sm overflow-hidden',
                'min-h-[120px] min-w-[44px] touch-manipulation',
                isSelected ? 'scale-105' : 'hover:scale-102',
                'active:scale-95'
              )}
              style={{
                borderColor: isSelected ? version.color : '#334155',
                ...(isSelected && {
                  boxShadow: `0 0 20px ${version.color}40`
                })
              }}
            >
              {/* Corner accents for selected version */}
              {isSelected && (
                <>
                  <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2" style={{ borderColor: version.color }} />
                  <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2" style={{ borderColor: version.color }} />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2" style={{ borderColor: version.color }} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2" style={{ borderColor: version.color }} />
                </>
              )}

              {/* Book icon in background */}
              <div className="absolute bottom-3 right-3 opacity-10">
                <Book className="w-12 h-12" style={{ color: version.color }} />
              </div>

              {/* Content */}
              <div className="relative z-10 p-4">
                {/* Name and status */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className={clsx('font-mono font-bold text-sm tracking-wide', isSelected ? 'text-slate-200' : 'text-slate-400')}>
                    {version.name.toUpperCase()}
                  </h3>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-500/20 border border-green-500">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className={clsx('text-xs italic mb-3 font-mono', isSelected ? 'text-slate-400' : 'text-slate-500')}>
                  {version.description || 'Описание недоступно'}
                </p>

                {/* Color indicator bar */}
                <div className="h-0.5 rounded-full" style={{ backgroundColor: version.color }}></div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                    {version.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">{version.description}</p>
                    )}
                    {version.features && version.features.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 font-mono">
                        {version.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm button */}
      {onConfirm && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={onConfirm}
            data-testid="rules-confirm-button"
            className={clsx(
              'px-8 py-3 font-mono text-sm font-bold uppercase tracking-wider',
              'border transition-all min-h-[48px] min-w-[44px]',
              'hover:scale-105 active:scale-95',
              'border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
            )}
          >
            НАЧАТЬ ИГРУ
          </button>
        </div>
      )}
    </div>
  );
}
