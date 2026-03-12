'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Book, Check, ChevronDown, Settings, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { RulesVersion, RulesVersionID } from '@/lib/types';
import { PanicToggle } from '../toggles/PanicToggle';
import { AimedShotToggle } from '../toggles/AimedShotToggle';
import { SurpriseAttackToggle } from '../toggles/SurpriseAttackToggle';
import { StrictPilotRankToggle } from '../toggles/StrictPilotRankToggle';
import { DistanceUnitToggle } from '../toggles/DistanceUnitToggle';
import { StepToCmFactorToggle } from '../toggles/StepToCmFactorToggle';
import { AutoCompleteToggle } from '../toggles/AutoCompleteToggle';

interface RulesSelectorProps {
  versions: RulesVersion[];
  selectedVersion: RulesVersionID;
  onVersionChange: (id: RulesVersionID) => void;
  onConfirm?: () => void;
  panicEnabled?: boolean;
  onPanicEnabledChange?: (enabled: boolean) => void;
  aimedShotEnabled?: boolean;
  onAimedShotEnabledChange?: (enabled: boolean) => void;
  surpriseAttackEnabled?: boolean;
  onSurpriseAttackEnabledChange?: (enabled: boolean) => void;
  strictPilotRankEnabled?: boolean;
  onStrictPilotRankEnabledChange?: (enabled: boolean) => void;
  distanceInputUnit?: 'steps' | 'cm';
  onDistanceInputUnitChange?: (value: 'steps' | 'cm') => void;
  stepToCmFactor?: '4' | '5';
  onStepToCmFactorChange?: (value: '4' | '5') => void;
  autoCompleteEnabled?: boolean;
  onAutoCompleteEnabledChange?: (enabled: boolean) => void;
}

export function RulesSelector({
  versions,
  selectedVersion,
  onVersionChange,
  onConfirm,
  panicEnabled = true,
  onPanicEnabledChange,
  aimedShotEnabled = false,
  onAimedShotEnabledChange,
  surpriseAttackEnabled = false,
  onSurpriseAttackEnabledChange,
  strictPilotRankEnabled = true,
  onStrictPilotRankEnabledChange,
  distanceInputUnit = 'steps',
  onDistanceInputUnitChange,
  stepToCmFactor = '5',
  onStepToCmFactorChange,
  autoCompleteEnabled = true,
  onAutoCompleteEnabledChange,
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
    onVersionChange(rulesId);
    setExpandedRulesId(rulesId === expandedRulesId ? null : rulesId);

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

  // Get selected version for styling
  const selectedVersionData = versions.find(v => v.id === selectedVersion);
  const accentColor = selectedVersionData?.color || '#10b981';

  return (
    <>
      <div id="rules-selector" className="space-y-4 max-w-2xl mx-auto pb-32">
        {/* Compact Header */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-px flex-1 bg-slate-700/50" />
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-300 font-mono tracking-wider">ПРАВИЛА</h2>
          </div>
          <div className="h-px flex-1 bg-slate-700/50" />
        </div>

        {/* Rules Version Selector - Compact accordion style */}
        <div className="space-y-2">
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
                onKeyDown={(e) => handleKeyDown(e, version.id)}
                onClick={() => handleRulesClick(version.id)}
                data-testid={`rules-card-${version.id}`}
                className={clsx(
                  'relative group cursor-pointer transition-all duration-200',
                  'rounded-lg border overflow-hidden',
                  isSelected ? 'ring-1' : 'hover:border-slate-600'
                )}
                style={{
                  borderColor: isSelected ? version.color : '#334155',
                  backgroundColor: isSelected ? `${version.color}10` : 'rgba(30, 41, 59, 0.6)',
                  ...(isSelected && { ringColor: `${version.color}50` })
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
                      style={{ borderColor: isSelected ? version.color : undefined }}
                    >
                      {isSelected && <Check className="w-3 h-3" style={{ color: version.color }} />}
                    </div>

                    <div>
                      <h3 className={clsx(
                        'font-mono font-bold text-sm tracking-wide',
                        isSelected ? '' : 'text-slate-400'
                      )} style={isSelected ? { color: version.color } : undefined}>
                        {version.name}
                      </h3>
                    </div>
                  </div>

                  <ChevronDown
                    className={clsx(
                      'w-4 h-4 text-slate-500 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                      {version.description || 'Стандартные правила настольной игры'}
                    </p>
                    {version.features && version.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {version.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 font-mono"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                    {version.link && (
                      <a
                        href={version.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline block mt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Подробнее →
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Rules Section - Compact toggles */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-slate-700/30" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Опциональные правила</span>
            <div className="h-px flex-1 bg-slate-700/30" />
          </div>

          {/* Side-by-side toggles on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {onPanicEnabledChange && (
              <PanicToggle
                enabled={panicEnabled}
                onEnabledChange={onPanicEnabledChange}
                rulesVersion={selectedVersion}
              />
            )}
            {onAimedShotEnabledChange && (
              <AimedShotToggle
                enabled={aimedShotEnabled}
                onEnabledChange={onAimedShotEnabledChange}
              />
            )}
            {onSurpriseAttackEnabledChange && (
              <SurpriseAttackToggle
                enabled={surpriseAttackEnabled}
                onEnabledChange={onSurpriseAttackEnabledChange}
              />
            )}
            {onStrictPilotRankEnabledChange && (
              <StrictPilotRankToggle
                enabled={strictPilotRankEnabled}
                onEnabledChange={onStrictPilotRankEnabledChange}
              />
            )}
          </div>
        </div>

        {/* Configuration Section - Distance settings */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-slate-700/30" />
            <div className="flex items-center gap-1.5">
              <Settings className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Конфигурация</span>
            </div>
            <div className="h-px flex-1 bg-slate-700/30" />
          </div>

          {/* Side-by-side toggles on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {onDistanceInputUnitChange && (
              <DistanceUnitToggle
                value={distanceInputUnit}
                onValueChange={onDistanceInputUnitChange}
              />
            )}
            {onStepToCmFactorChange && (
              <StepToCmFactorToggle
                value={stepToCmFactor}
                onValueChange={onStepToCmFactorChange}
              />
            )}
            {onAutoCompleteEnabledChange && (
              <AutoCompleteToggle
                enabled={autoCompleteEnabled}
                onEnabledChange={onAutoCompleteEnabledChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating confirm button - fixed at bottom */}
      {onConfirm && (
        <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-4">
          <div className="relative group" style={{ maxWidth: '400px', width: '100%' }}>
            {/* Scroll indicator at top - gradient fade showing content continues */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full" />
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-slate-600 to-transparent rounded-full" />
              <div className="w-4 h-0.5 bg-slate-700 rounded-full animate-pulse" />
            </div>

            {/* Outer glow */}
            <div
              className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
              style={{
                backgroundColor: accentColor,
                opacity: 0.3
              }}
            />

            {/* Main button - more transparent to show content behind */}
            <button
              onClick={onConfirm}
              data-testid="rules-confirm-button"
              className={clsx(
                "relative w-full pointer-events-auto",
                "py-4 px-6 rounded-lg",
                "flex items-center justify-center gap-3",
                "font-mono text-base md:text-lg font-bold uppercase tracking-wider",
                "transition-all duration-200",
                "border-2",
                // More transparent background
                "bg-slate-900/80 backdrop-blur-md text-white",
                "hover:scale-[1.02] hover:bg-slate-900/90",
                "active:scale-95",
                "shadow-lg hover:shadow-xl"
              )}
              style={{ borderColor: accentColor }}
            >
              {/* Top fade indicator - subtle gradient showing content behind */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-slate-950/50 to-transparent pointer-events-none rounded-t-lg" />

              {/* Animated background effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: accentColor, opacity: 0.15 }}
              />

              {/* Scanline effect */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent h-full w-full animate-pulse"
                  style={{ animationDuration: '2s' }}
                />
              </div>

              {/* Icon */}
              <ArrowRight className="w-5 h-5 relative z-10" />

              {/* Text */}
              <span className="relative z-10">Продолжить</span>

              {/* Tech corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 opacity-50" style={{ borderColor: accentColor }} />
              <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 opacity-50" style={{ borderColor: accentColor }} />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 opacity-50" style={{ borderColor: accentColor }} />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 opacity-50" style={{ borderColor: accentColor }} />
            </button>

            {/* Tooltip on hover */}
            <div className={clsx(
              "absolute -top-12 left-1/2 -translate-x-1/2",
              "whitespace-nowrap px-3 py-1.5 rounded",
              "bg-slate-900/95 text-slate-300 text-xs font-mono font-medium",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "border border-slate-700/50 shadow-lg",
              "pointer-events-none"
            )}>
              Выбрать фракцию
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-slate-700/50" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
