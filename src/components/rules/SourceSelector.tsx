'use client';

import { useState, useEffect, useRef, KeyboardEvent, useMemo } from 'react';
import { ExternalLink, Lock, ArrowRight, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { ArmyListSource, SourceID } from '@/lib/types';
import { FloatingContinueButton } from '../controls/FloatingContinueButton';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { getCustomSourcesStorage, from '@/lib/editor/storage';
import type { CustomSource } from '@/lib/editor/types';

interface SourceSelectorProps {
  sources: ArmyListSource[];
  selectedSource: SourceID;
  onSourceChange: (id: SourceID) => void;
  onConfirm?: () => void;
}

// Sources that are disabled
const DISABLED_SOURCES: Set<SourceID> = new Set(['tehnolog']);

export function SourceSelector({
  sources,
  selectedSource,
  onSourceChange,
  onConfirm,
}: SourceSelectorProps) {
  const [expandedSourceId, setExpandedSourceId] = useState<SourceID | null>(null);
  const debouncedSaveRef = useRef<NodeJS.Timeout>();

  // Auto-expand selected source on mount
  useEffect(() => {
    if (selectedSource && expandedSourceId !== selectedSource) {
      setExpandedSourceId(selectedSource);
    }
  }, [selectedSource, expandedSourceId]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, []);

  const handleSourceClick = (sourceId: SourceID, isDisabled: boolean) => {
    if (isDisabled) return;

    onSourceChange(sourceId);
    setExpandedSourceId(sourceId === expandedSourceId ? null : sourceId);

    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ARMY_LIST_SOURCE, sourceId);
    }, 300);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, sourceId: SourceID, isDisabled: boolean) => {
    if (isDisabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSourceClick(sourceId, isDisabled);
    } else if (e.key === 'Escape' && expandedSourceId === sourceId) {
      setExpandedSourceId(null);
    }
  };

  // Get selected source for styling
  const selectedSourceData = sources.find(s => s.id === selectedSource);
  const accentColor = selectedSourceData?.id === 'tehnolog' ? '#f59e0b' : '#10b981';

  return (
    <>
      <div id="source-selector" className="space-y-4 max-w-2xl mx-auto pb-32">
        {/* Compact Header */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-px flex-1 bg-slate-700/50" />
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-300 font-mono tracking-wider">АРМ.ТЕХ ЛИСТЫ</span>
          </div>
          <div className="h-px flex-1 bg-slate-700/50" />
        </div>

        {/* Source Version Selector - Compact accordion style */}
        <div className="space-y-2">
          {sources.map((source) => {
            const isSelected = selectedSource === source.id;
            const isExpanded = expandedSourceId === source.id;
            const isDisabled = DISABLED_SOURCES.has(source.id);

            return (
              <div
                key={source.id}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-pressed={isSelected}
                aria-expanded={isExpanded}
                onKeyDown={(e) => handleKeyDown(e, source.id, isDisabled)}
                onClick={() => handleSourceClick(source.id, isDisabled)}
                data-testid={`source-card-${source.id}`}
                className={clsx(
                  'relative group transition-all duration-200',
                  'rounded-lg border overflow-hidden',
                  isSelected ? 'ring-1' : 'hover:border-slate-600',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  borderColor: isSelected ? (source.id === 'tehnolog' ? '#f59e0b' : '#10b981') : '#334155',
                  backgroundColor: isSelected ? `${(source.id === 'tehnolog' ? '#f59e0b' : '#10b981')}10` : 'rgba(30, 41, 59, 0.6)',
                  ...(isSelected && { ringColor: `${(source.id === 'tehnolog' ? '#f59e0b' : '#10b981')}50` })
                }}
              >
                {/* Main row - always visible */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {/* Selection indicator */}
                    <div
                      className={clsx(
                        'w-5 h-5 rounded flex items-center justify-center border-2 transition-all',
                        isSelected ? 'border-current' : 'border-slate-600'
                      )}
                      style={{ borderColor: isSelected ? (source.id === 'tehnolog' ? '#f59e0b' : '#10b981') : undefined }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" style={{ color: source.id === 'tehnolog' ? '#f59e0b' : '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <h3 className={clsx(
                        'font-mono font-bold text-sm tracking-wide',
                        isSelected ? '' : 'text-slate-400'
                      )} style={isSelected ? { color: source.id === 'tehnolog' ? '#f59e0b' : '#10b981' } : undefined}>
                        {source.name}
                      </h3>
                    </div>

                    {isDisabled && (
                      <Lock className="w-4 h-4 text-amber-400 ml-2" />
                    )}
                  </div>

                  {!isDisabled && (
                    <svg className={clsx(
                      'w-4 h-4 text-slate-500 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && !isDisabled && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                      {source.description}
                    </p>
                    {source.link && (
                      <a
                        href={source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Подробнее →
                      </a>
                    )}
                  </div>
                )}

                {/* Disabled message */}
                {isDisabled && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
                    <p className="text-xs text-amber-400 leading-relaxed">
                      🔒 Скоро. Требуется помощь сообщества.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating confirm button - fixed at bottom */}
      {onConfirm && (
        <FloatingContinueButton
          text="Выбрать источник"
          tooltip="Выбрать источник"
          accentColor={accentColor}
          onClick={onConfirm}
          dataTestid="source-confirm-button"
          icon={<ArrowRight className="w-4 h-4" />}
        />
      )}
    </>
  );
}
