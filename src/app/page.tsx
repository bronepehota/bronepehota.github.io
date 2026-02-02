'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Army, RulesVersionID } from '@/lib/types';
import ArmyBuilder from '@/components/ArmyBuilder';
import GameSession from '@/components/GameSession';
import factionsData from '@/data/factions.json';
import { Shield, ArrowLeft, CheckCircle2, MoreVertical, List, Grid, History, Heart, UserX } from 'lucide-react';
import { isValidRulesVersion } from '@/lib/rules-registry';
import { cn } from '@/lib/utils';

export default function Home() {
  // View state with localStorage persistence - lazy init to avoid race condition
  const [view, setView] = useState<'builder' | 'game'>(() => {
    if (typeof window === 'undefined') return 'builder';
    const saved = localStorage.getItem('bronepehota_view');
    return (saved === 'builder' || saved === 'game') ? saved : 'builder';
  });
  const [showEndMenu, setShowEndMenu] = useState(false);
const [showCombatLog, setShowCombatLog] = useState(false);

  // Display mode state with localStorage persistence - lazy init to avoid race condition
  const [displayMode, setDisplayMode] = useState<'detailed' | 'compact'>(() => {
    if (typeof window === 'undefined') return 'detailed';
    const saved = localStorage.getItem('bronepehota_display_mode');
    return (saved === 'compact' || saved === 'detailed') ? saved : 'detailed';
  });

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

  // Persist view state to localStorage on change
  useEffect(() => {
    localStorage.setItem('bronepehota_view', view);
  }, [view]);

  // Initiative trigger function from GameSession - use ref to persist across remounts
  const triggerInitiativeRef = useRef<(() => void) | null>(null);
  const handleInitiativeTrigger = useCallback(() => {
    triggerInitiativeRef.current?.();
  }, []);

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

  // Handle return to faction selection (resets army)
  const handleReturnToFactionSelect = () => {
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

  // Track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);

  // Load army from localStorage on mount (client-side only)
  useEffect(() => {
    setIsMounted(true);
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

  // Save army to localStorage when it changes (only after mount)
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
    }
  }, [army, isMounted]);

  return (
    <main className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Header - Tech Blueprint Style - Optimized for mobile */}
      <header className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800/50 px-2 md:px-3 py-1 md:py-2 sticky top-0 z-50 relative">
        {/* Tech corners - faction-colored */}
        <div className={cn("absolute top-0 left-0 w-2 h-2 border-l border-t z-10", factionStyles.accent)} />
        <div className={cn("absolute top-0 right-0 w-2 h-2 border-r border-t z-10", factionStyles.accent)} />

        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Left section - Faction badge */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <div
              className={cn(
                "p-1 md:p-1.5 rounded-sm border-2 transition-all duration-300",
                factionStyles.border,
                factionStyles.bg,
                view === 'game' && !army.isInBattle
                  ? 'hover:scale-105 active:scale-95 cursor-pointer'
                  : ''
              )}
              onClick={() => {
                if (view === 'game' && !army.isInBattle) {
                  handleReturnToFactionSelect();
                }
              }}
              title={view === 'game' && !army.isInBattle ? 'Вернуться к выбору фракции' : undefined}
            >
              <Shield className={cn("w-4 h-4 md:w-5 md:h-5", factionStyles.primary)} />
            </div>
            <div className={cn("relative group", view === 'game' && !army.isInBattle ? 'cursor-pointer' : '')}
              onClick={() => {
                if (view === 'game' && !army.isInBattle) {
                  handleReturnToFactionSelect();
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
          <nav className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Turn counter - clickable button with distinct initiative color */}
            {view === 'game' && (
              <button
                onClick={handleInitiativeTrigger}
                data-testid="new-turn-button"
                className="flex items-center gap-1.5 px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] bg-purple-950/60 border-2 border-purple-500/50 hover:bg-purple-950/80 hover:border-purple-400/70"
                title="Новый тур"
              >
                <span className="text-[10px] md:text-xs font-mono text-purple-400 uppercase tracking-wider">ТУР</span>
                <span data-testid="turn-counter" className="text-sm md:text-base font-mono font-black text-purple-300">
                  {army.currentTurn || 1}
                </span>
              </button>
            )}

            {/* Stats - live and dead units - only in game view */}
            {view === 'game' && (
              <div className="flex flex-col items-end gap-0.5 px-1">
                <span className="text-blue-400 flex items-center gap-1 text-[9px] md:text-[10px] font-bold uppercase leading-tight">
                  <Heart className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>{army.units.filter(u => {
                    if (u.type === 'squad') {
                      return (u.deadSoldiers?.length || 0) < (u.data as any).soldiers.length;
                    }
                    return (u.currentDurability || 0) > 0;
                  }).length}</span>
                </span>
                <span className="text-red-400 flex items-center gap-1 text-[9px] md:text-[10px] font-bold uppercase leading-tight">
                  <UserX className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>{army.units.filter(u => {
                    if (u.type === 'squad') {
                      return (u.deadSoldiers?.length || 0) === (u.data as any).soldiers.length;
                    }
                    return (u.currentDurability || 0) === 0;
                  }).length}</span>
                </span>
              </div>
            )}

            {/* Display mode toggle - only in builder on unit-select step - compact inline */}
            {view === 'builder' && army.currentStep === 'unit-select' && (
              <div className="flex items-center gap-0.5">
                <button
                  data-testid="display-mode-compact-header"
                  onClick={() => {
                    console.log('[Header] Clicking compact button');
                    setDisplayMode('compact');
                  }}
                  className={cn(
                    'p-1 rounded transition-all duration-200 touch-manipulation',
                    'min-w-[36px] min-h-[36px] flex items-center justify-center',
                    'relative z-50',
                    displayMode === 'compact'
                      ? `${factionStyles.bg} ${factionStyles.primary} ${factionStyles.border} border`
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
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
                    'p-1 rounded transition-all duration-200 touch-manipulation',
                    'min-w-[36px] min-h-[36px] flex items-center justify-center',
                    'relative z-50',
                    displayMode === 'detailed'
                      ? `${factionStyles.bg} ${factionStyles.primary} ${factionStyles.border} border`
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
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
                      onClick={() => { setShowCombatLog(true); setShowEndMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2 border-b border-slate-700/50"
                    >
                      <History className="w-4 h-4 text-blue-400" />
                      История боя
                    </button>
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
        {!isMounted ? (
          // Loading placeholder during SSR/hydration
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-500 text-sm">Загрузка...</div>
          </div>
        ) : view === 'builder' ? (
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
            onInitiativeTriggerRef={(fn) => { triggerInitiativeRef.current = fn; }}
            showCombatLog={showCombatLog}
            setShowCombatLog={setShowCombatLog}
          />
        )}
      </div>
    </main>
  );
}

