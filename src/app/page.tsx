'use client';

import { useState, useEffect } from 'react';
import { Army, RulesVersionID } from '@/lib/types';
import ArmyBuilder from '@/components/ArmyBuilder';
import GameSession from '@/components/GameSession';
import factionsData from '@/data/factions.json';
import { Shield, ArrowLeft, CheckCircle2, MoreVertical, List, Grid } from 'lucide-react';
import { isValidRulesVersion } from '@/lib/rules-registry';
import { cn } from '@/lib/utils';

export default function Home() {
  const [view, setView] = useState<'builder' | 'game'>('builder');
  const [showEndMenu, setShowEndMenu] = useState(false);

  // Display mode state with localStorage persistence
  const [displayMode, setDisplayMode] = useState<'detailed' | 'compact'>('detailed');

  const [army, setArmy] = useState<Army>({
    name: 'Моя Армия',
    faction: 'polaris',
    units: [],
    totalCost: 0,
    currentStep: 'faction-select',
    isInBattle: false,
    currentTurn: 1,
  });

  // Rules version state with localStorage persistence
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>('tehnolog');

  // Load rules version from localStorage on mount (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_rules_version');
    if (saved && isValidRulesVersion(saved)) {
      setRulesVersion(saved as RulesVersionID);
    }

    // Load display mode from localStorage
    const savedDisplayMode = localStorage.getItem('bronepehota_display_mode');
    if (savedDisplayMode === 'compact' || savedDisplayMode === 'detailed') {
      setDisplayMode(savedDisplayMode);
    }
  }, []);

  // Persist rules version to localStorage on change
  useEffect(() => {
    localStorage.setItem('bronepehota_rules_version', rulesVersion);
  }, [rulesVersion]);

  // Persist display mode to localStorage on change
  useEffect(() => {
    localStorage.setItem('bronepehota_display_mode', displayMode);
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('[page.tsx] Display mode changed to:', displayMode);
    }
  }, [displayMode]);

  const activeFaction = factionsData.find(f => f.id === army.faction);

  // Faction styles for tech blueprint design
  const getFactionStyles = (factionId: string | null) => {
    const styles = {
      polaris: {
        primary: 'text-red-400',
        border: 'border-red-600/40',
        bg: 'bg-red-950/20',
        accent: 'border-red-500'
      },
      protectorate: {
        primary: 'text-cyan-400',
        border: 'border-cyan-600/40',
        bg: 'bg-cyan-950/20',
        accent: 'border-cyan-500'
      },
      mercenaries: {
        primary: 'text-yellow-400',
        border: 'border-yellow-600/40',
        bg: 'bg-yellow-950/20',
        accent: 'border-yellow-500'
      }
    };
    return styles[factionId as keyof typeof styles] || styles.polaris;
  };

  const factionStyles = getFactionStyles(army.faction);

  // Handle entering battle phase
  const handleEnterBattle = () => {
    setArmy({
      ...army,
      isInBattle: true,
      currentStep: 'battle',
    });
    setView('game');
  };

  // Handle ending battle phase (reset to fresh faction selection)
  const handleEndBattle = () => {
    setArmy({
      name: 'Моя Армия',
      faction: 'polaris',
      units: [],
      totalCost: 0,
      pointBudget: undefined,
      currentStep: 'faction-select',
      isInBattle: false,
      currentTurn: 1,
    });
    setView('builder');
  };

  // Load army from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_army');
    if (saved) {
      try {
        const loadedArmy = JSON.parse(saved);
        // Initialize currentStep if not present (for backward compatibility)
        if (!loadedArmy.currentStep) {
          loadedArmy.currentStep = 'faction-select';
        }
        if (loadedArmy.isInBattle === undefined) {
          loadedArmy.isInBattle = false;
        }
        if (!loadedArmy.currentTurn) {
          loadedArmy.currentTurn = 1;
        }
        setArmy(loadedArmy);
      } catch (e) {
        console.error('Failed to load army', e);
      }
    }
  }, []);

  // Save army to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
  }, [army]);

  return (
    <main className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header - Tech Blueprint Style */}
      <header className="bg-slate-900/90 backdrop-blur-sm border-b-2 border-slate-800/50 px-2 md:px-4 py-2 md:py-2.5 sticky top-0 z-50 shadow-lg relative">
        {/* Tech corners - faction-colored */}
        <div className={cn("absolute top-0 left-0 w-2 h-2 border-l border-t z-10", factionStyles.accent)} />
        <div className={cn("absolute top-0 right-0 w-2 h-2 border-r border-t z-10", factionStyles.accent)} />

        <div className="flex items-center gap-2 md:gap-4">
          {/* Left section - Faction badge */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div
              className={cn(
                "p-1.5 md:p-2 rounded-sm border-2 transition-all duration-300",
                factionStyles.border,
                factionStyles.bg,
                view === 'game' && !army.isInBattle
                  ? 'hover:scale-105 active:scale-95 cursor-pointer'
                  : ''
              )}
              onClick={() => {
                if (view === 'game' && !army.isInBattle) {
                  setView('builder');
                }
              }}
              title={view === 'game' && !army.isInBattle ? 'Вернуться в Штаб' : undefined}
            >
              <Shield className={cn("w-5 h-5 md:w-6 md:h-6", factionStyles.primary)} />
            </div>
            <div className={cn("relative group", view === 'game' && !army.isInBattle ? 'cursor-pointer' : '')}
              onClick={() => {
                if (view === 'game' && !army.isInBattle) {
                  setView('builder');
                }
              }}
            >
              <div className="flex items-center gap-1.5">
                {view === 'game' && !army.isInBattle && (
                  <ArrowLeft className="w-3 h-3 text-slate-400" />
                )}
                <h1 className={cn(
                  "text-sm md:text-base font-mono font-bold uppercase tracking-wider leading-none",
                  factionStyles.primary
                )}>
                  <span className="hidden md:inline">БРОНЕПЕХОТА</span>
                  <span className="md:hidden">БП</span>
                </h1>
              </div>
              <span className={cn(
                "text-[8px] md:text-[9px] font-mono font-black uppercase tracking-wider transition-colors duration-300",
                factionStyles.primary
              )}>
                {activeFaction?.name}
              </span>
            </div>
          </div>

          {/* Center section - spacer for balance */}
          <div className="flex-1" />

          {/* Right section - Actions */}
          <nav className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Turn counter */}
            {view === 'game' && (
              <div
                data-testid="turn-counter"
                className={cn(
                  "relative px-2 md:px-2.5 py-1 rounded-sm border",
                  factionStyles.border,
                  "bg-slate-900/60"
                )}
              >
                <span className="text-[8px] md:text-[9px] font-mono uppercase opacity-40">ТУР</span>
                <span className={cn("text-xs md:text-sm font-mono font-black", factionStyles.primary)}>
                  {army.currentTurn || 1}
                </span>
              </div>
            )}

            {/* Display mode toggle - only in builder on unit-select step */}
            {view === 'builder' && army.currentStep === 'unit-select' && (
              <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-slate-700/30 relative z-50">
                <button
                  data-testid="display-mode-compact-header"
                  onClick={() => {
                    console.log('[Header] Clicking compact button');
                    setDisplayMode('compact');
                  }}
                  className={cn(
                    'p-1.5 rounded-md transition-all duration-200 touch-manipulation',
                    'min-w-[32px] min-h-[32px] flex items-center justify-center',
                    displayMode === 'compact'
                      ? `${factionStyles.bg} ${factionStyles.primary} ${factionStyles.border} border shadow-lg`
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                  aria-label="Компактный вид"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  data-testid="display-mode-detailed-header"
                  onClick={() => {
                    console.log('[Header] Clicking detailed button');
                    setDisplayMode('detailed');
                  }}
                  className={cn(
                    'p-1.5 rounded-md transition-all duration-200 touch-manipulation',
                    'min-w-[32px] min-h-[32px] flex items-center justify-center',
                    displayMode === 'detailed'
                      ? `${factionStyles.bg} ${factionStyles.primary} ${factionStyles.border} border shadow-lg`
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                  aria-label="Подробный вид"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* End Battle button - dropdown menu */}
            {view === 'game' && army.isInBattle && (
              <div className="relative">
                <button
                  onClick={() => setShowEndMenu(!showEndMenu)}
                  className="p-2 hover:bg-slate-800 rounded-sm transition-colors text-slate-400 hover:text-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showEndMenu && (
                  <div className="absolute right-0 top-12 bg-slate-800 border border-slate-700 rounded-sm shadow-xl py-1 min-w-[150px] z-50">
                    <button
                      onClick={() => { handleEndBattle(); setShowEndMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-950/30 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Завершить бой
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* "Бой" status badge - tech style with faction color */}
            {view === 'game' && !army.isInBattle && (
              <span className={cn(
                "text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase border",
                factionStyles.border,
                factionStyles.bg,
                factionStyles.primary
              )}>
                БОЙ
              </span>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className={`flex-1 overflow-auto ${view === 'builder' && army.currentStep === 'unit-select' ? 'pb-20' : ''}`}>
        {view === 'builder' ? (
          <ArmyBuilder
            army={army}
            setArmy={setArmy}
            onEnterBattle={handleEnterBattle}
            rulesVersion={rulesVersion}
            onRulesVersionChange={setRulesVersion}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
          />
        ) : (
          <GameSession
            army={army}
            setArmy={setArmy}
            isInBattle={army.isInBattle}
            onEndBattle={handleEndBattle}
          />
        )}
      </div>
    </main>
  );
}

