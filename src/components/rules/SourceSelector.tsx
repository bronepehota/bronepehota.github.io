'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { ExternalLink, Lock, ArrowRight, Pencil } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import type { ArmyListSource, SourceID } from '@/lib/types';
import { FloatingContinueButton } from '../controls/FloatingContinueButton';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

interface SourceSelectorProps {
  sources: ArmyListSource[];
  selectedSource: SourceID;
  onSourceChange: (id: SourceID) => void;
  onConfirm?: () => void;
}

// Sources that are disabled (no data yet, need community help)
// Note: 'tehnolog' is enabled — imported with 33 verified squads across 3 factions.
const DISABLED_SOURCES: Set<SourceID> = new Set(['tehnolog_2026']);

// Accent colors per source
const SOURCE_COLORS: Record<string, string> = {
  star_system: '#10b981',
  tehnolog: '#f59e0b',
  tehnolog_2026: '#f59e0b',
};

function getSourceColor(sourceId: string): string {
  if (sourceId.startsWith('custom_')) return '#22c55e';
  return SOURCE_COLORS[sourceId] || '#10b981';
}

// Component to render a single source card
function SourceCard({
  source,
  selectedSource,
  expandedSourceId,
  onSourceClick,
  onKeyDown,
}: {
  source: ArmyListSource;
  selectedSource: SourceID;
  expandedSourceId: SourceID | null;
  onSourceClick: (sourceId: SourceID, isDisabled: boolean) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, sourceId: SourceID, isDisabled: boolean) => void;
}) {
  const isSelected = selectedSource === source.id;
  const isExpanded = expandedSourceId === source.id;
  const isDisabled = DISABLED_SOURCES.has(source.id);
  const isCustom = source.id.startsWith('custom_');
  const color = getSourceColor(source.id);

  return (
    <div
      key={source.id}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-expanded={isExpanded}
      onKeyDown={(e) => onKeyDown(e, source.id, isDisabled)}
      onClick={() => onSourceClick(source.id, isDisabled)}
      data-testid={`source-card-${source.id}`}
      className={clsx(
        'relative group transition-all duration-200',
        'rounded-lg border',
        isSelected ? 'ring-1' : 'hover:border-slate-600',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      style={{
        borderColor: isSelected ? color : (isCustom ? `${color}40` : '#334155'),
        backgroundColor: isSelected ? `${color}10` : 'rgba(30, 41, 59, 0.6)',
        ...(isSelected && { ringColor: `${color}50` })
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
            style={{ borderColor: isSelected ? color : undefined }}
          >
            {isSelected && (
              <svg className="w-3 h-3" style={{ color }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className={clsx(
                'font-mono font-bold text-sm tracking-wide',
                isSelected ? '' : 'text-slate-400'
              )} style={isSelected ? { color } : undefined}>
                {source.name}
              </h3>
              {isCustom && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/40">
                  МОЙ
                </span>
              )}
            </div>
          </div>

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

      {/* Disabled: tooltip on lock icon */}
      {isDisabled && (
        <div className="absolute top-3 right-3 group/lock cursor-help">
          <Lock className="w-4 h-4 text-amber-400" />
          <div className="absolute right-0 top-full mt-2 w-56 p-2.5 rounded-lg bg-slate-800 border border-amber-500/30 shadow-xl opacity-0 group-hover/lock:opacity-100 transition-opacity duration-200 z-50">
            <p className="text-xs text-amber-300 leading-relaxed mb-1.5">
              Требуется помощь сообщества по наполнению данных
            </p>
            <a
              href="https://vk.com/bp_bnp"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Отправить JSON в группу VK
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const accentColor = getSourceColor(selectedSourceData?.id || '');

  // Separate sources into official and custom
  const officialSources = sources.filter(s => !s.id.startsWith('custom_'));
  const customSources = sources.filter(s => s.id.startsWith('custom_'));

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

        {/* Official Sources */}
        <div className="space-y-2">
          {officialSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              selectedSource={selectedSource}
              expandedSourceId={expandedSourceId}
              onSourceClick={handleSourceClick}
              onKeyDown={handleKeyDown}
            />
          ))}
        </div>

        {/* Custom Sources Section */}
        {customSources.length > 0 && (
          <>
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-green-500/30" />
              <span className="text-sm font-semibold text-green-400 font-mono tracking-wider">МОИ ИСТОЧНИКИ</span>
              <div className="h-px flex-1 bg-green-500/30" />
            </div>

            <div className="space-y-2">
              {customSources.map((source) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  selectedSource={selectedSource}
                  expandedSourceId={expandedSourceId}
                  onSourceClick={handleSourceClick}
                  onKeyDown={handleKeyDown}
                />
              ))}
            </div>
          </>
        )}

        {/* Editor promo — always visible */}
        <Link
          href="/editor"
          className="group flex items-center gap-3 p-3 rounded-lg border border-dashed border-violet-500/25 bg-gradient-to-r from-violet-500/[0.04] to-fuchsia-500/[0.04] hover:border-violet-400/50 hover:from-violet-500/[0.08] hover:to-fuchsia-500/[0.08] transition-all duration-300"
        >
          <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
            <Pencil className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono font-bold text-violet-300 tracking-wide">
              Редактор армейских листов
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
              Создайте свои подразделения, баффы и сценарии
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-violet-500/40 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
        </Link>
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
