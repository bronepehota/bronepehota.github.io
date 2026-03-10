'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Army, ArmyUnit, RulesVersionID } from '@/lib/types';
import ArmyBuilder from '@/components/ArmyBuilder';
import GameSession from '@/components/GameSession';
import factionsData from '@/data/factions.json';
import { Shield, ArrowLeft, CheckCircle2, MoreVertical, List, Grid, History, Heart, UserX, AlertTriangle, X, BookOpen } from 'lucide-react';
import { isValidRulesVersion } from '@/lib/rules-registry';
import { cn } from '@/lib/utils';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { CombatTargetProvider } from '@/contexts/CombatTargetContext';

export default function Home() {
  // View state - use URL hash for persistence instead of localStorage to avoid race conditions
  const [view, setView] = useState<'builder' | 'game'>('builder');
  const [showEndMenu, setShowEndMenu] = useState(false);
  const [showCombatLog, setShowCombatLog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Display mode state with localStorage persistence
  const [displayMode, setDisplayMode] = useState<'detailed' | 'compact'>('detailed');

  // Load view and displayMode from localStorage after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedView = localStorage.getItem('bronepehota_view');
    if (savedView === 'builder' || savedView === 'game') {
      setView(savedView);
    }
    const savedDisplayMode = localStorage.getItem('bronepehota_display_mode');
    if (savedDisplayMode === 'compact' || savedDisplayMode === 'detailed') {
      setDisplayMode(savedDisplayMode);
    }
  }, []);

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

  // Strict pilot rank enabled state - persisted in localStorage
  const [strictPilotRankEnabled, setStrictPilotRankEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.STRICT_PILOT_RANK_ENABLED);
      return saved !== null ? saved === 'true' : true; // Default to enabled
    }
    return true;
  });

  // Distance input unit state - persisted in localStorage
  const [distanceInputUnit, setDistanceInputUnit] = useState<'steps' | 'cm'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.DISTANCE_INPUT_UNIT);
      return saved === 'cm' ? 'cm' : 'steps'; // Default to steps
    }
    return 'steps';
  });

  // Step to cm factor state - persisted in localStorage
  const [stepToCmFactor, setStepToCmFactor] = useState<'4' | '5'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.STEP_TO_CM_FACTOR);
      return saved === '4' ? '4' : '5'; // Default to 5
    }
    return '5';
  });

  // Auto-complete enabled state - persisted in localStorage
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTO_COMPLETE_ENABLED);
      return saved !== null ? saved === 'true' : true; // Default to enabled
    }
    return true;
  });

  // Persist rules version to localStorage on change
  useEffect(() => {
    localStorage.setItem('bronepehota_rules_version', rulesVersion);
  }, [rulesVersion]);

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

  // Handle return to faction selection (shows confirmation)
  const handleReturnToFactionSelect = () => {
    setShowResetConfirm(true);
  };

  // Handle ending battle phase (shows confirmation)
  const handleEndBattle = () => {
    setShowResetConfirm(true);
  };

  // Confirm and execute reset
  const confirmReset = () => {
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
    setShowResetConfirm(false);
  };

  // Cancel reset
  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  // Track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);
  // Track if initial army has been loaded from localStorage
  const [isArmyLoaded, setIsArmyLoaded] = useState(false);

  // Set mounted flag on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Persist display mode to localStorage on change (only after mount to avoid overwriting saved value)
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;
    localStorage.setItem('bronepehota_display_mode', displayMode);
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('[page.tsx] Display mode changed to:', displayMode);
    }
  }, [displayMode, isMounted]);

  // Persist view state to localStorage on change (only after mount to avoid overwriting saved value)
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;
    localStorage.setItem('bronepehota_view', view);
  }, [view, isMounted]);

  // Load army from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isMounted) return;
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

        // Reset machine shot counters if battle is stale (more than 1 hour since last action)
        // This prevents buttons being disabled after page reload in old sessions
        const STALE_BATTLE_MS = 60 * 60 * 1000; // 1 hour
        const now = Date.now();
        const lastBattleTime = loadedArmy.lastBattleDate ? new Date(loadedArmy.lastBattleDate).getTime() : 0;
        const isStaleBattle = loadedArmy.isInBattle && lastBattleTime && (now - lastBattleTime) > STALE_BATTLE_MS;

        if (isStaleBattle) {
          console.log('[Bronepehota] Stale battle detected, resetting machine shot counters');
          loadedArmy.units = loadedArmy.units.map((unit: ArmyUnit) => {
            if (unit.type === 'machine') {
              return {
                ...unit,
                machineShotsUsed: 0,
                machineWeaponShots: {},
                isMachineShot: false,
                isMachineMoved: false,
                isMachineMelee: false,
                isMachineDone: false,
              };
            }
            // Also reset squad action states for stale battles
            if (unit.type === 'squad' && unit.actionsUsed) {
              return {
                ...unit,
                actionsUsed: (unit.data as any).soldiers.map(() => ({
                  moved: false,
                  shot: false,
                  melee: false,
                  done: false,
                })),
              };
            }
            return unit;
          });
        }

        setArmy(loadedArmy);
      } catch (e) {
        console.error('Failed to load army', e);
      }
    }
    // Mark army as loaded regardless of whether localStorage had data
    setIsArmyLoaded(true);
  }, [isMounted]);

  // Save army to localStorage when it changes (only after initial load)
  useEffect(() => {
    if (!isArmyLoaded) return;
    localStorage.setItem('bronepehota_army', JSON.stringify(army));
  }, [army, isArmyLoaded]);

  return (
    <CombatTargetProvider>
      <main className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
        {/* Scrollable wrapper containing both header and content */}
        <div className="flex-1 overflow-auto min-h-0">
          {/* Header - Tech Blueprint Style - Optimized for mobile */}
          <header className={cn(
            "backdrop-blur-sm border-b px-2 md:px-3 py-1 md:py-2 sticky top-0 z-50 transition-all duration-300",
            view === 'game' && army.isInBattle
              ? "bg-slate-950/95 border-slate-700/70"
              : "bg-slate-900/90 border-slate-800/50"
          )}>
        {/* Battle mode: additional tactical HUD elements */}
        {view === 'game' && army.isInBattle && (
          <>
            {/* Scanline effect overlay on header */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-scan" />
            </div>

            {/* Tech corners - enhanced for battle */}
            <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 z-10 animate-pulse-slow", factionStyles.accent)} />
            <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 z-10 animate-pulse-slow", factionStyles.accent)} />
            <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 z-10 animate-pulse-slow", factionStyles.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 z-10 animate-pulse-slow", factionStyles.accent)} />
          </>
        )}

        {/* Non-battle mode: simple tech corners */}
        {!(view === 'game' && army.isInBattle) && (
          <>
            <div className={cn("absolute top-0 left-0 w-2 h-2 border-l border-t z-10", factionStyles.accent)} />
            <div className={cn("absolute top-0 right-0 w-2 h-2 border-r border-t z-10", factionStyles.accent)} />
          </>
        )}

        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Left section - Faction badge */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Can click to return to faction select from game view (not in battle) or builder unit-select */}
            {((view === 'game' && !army.isInBattle) || (view === 'builder' && army.currentStep === 'unit-select')) ? (
              <>
                <button
                  onClick={handleReturnToFactionSelect}
                  data-testid="back-to-faction-button"
                  className={cn(
                    "p-1 md:p-1.5 rounded-sm border-2 transition-all duration-300",
                    factionStyles.border,
                    factionStyles.bg,
                    "hover:scale-105 active:scale-95"
                  )}
                  title="Вернуться к выбору фракции"
                >
                  <Shield className={cn("w-4 h-4 md:w-5 md:h-5", factionStyles.primary)} />
                </button>
                <div
                  className="relative group cursor-pointer"
                  onClick={handleReturnToFactionSelect}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleReturnToFactionSelect();
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowLeft className="w-3 h-3 text-slate-400" />
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
              </>
            ) : (
              <>
                <div
                  className={cn(
                    "p-1 md:p-1.5 rounded-sm border-2",
                    factionStyles.border,
                    factionStyles.bg
                  )}
                >
                  <Shield className={cn("w-4 h-4 md:w-5 md:h-5", factionStyles.primary)} />
                </div>
                <div className="relative group">
                  <h1 className={cn(
                    "text-sm md:text-base font-mono font-bold uppercase tracking-wider leading-none",
                    factionStyles.primary
                  )}>
                    <span className="hidden md:inline">БРОНЕПЕХОТА</span>
                    <span className="md:hidden">БП</span>
                  </h1>
                  <span className={cn(
                    "text-[8px] md:text-[9px] font-mono font-black uppercase tracking-wider transition-colors duration-300",
                    factionStyles.primary
                  )}>
                    {activeFaction?.name}
                  </span>
                </div>
              </>
            )}
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

            {/* Encyclopedia link - always visible in header */}
            <Link
              href="/encyclopedia"
              data-testid="encyclopedia-link"
              className={cn(
                'p-1 rounded transition-all duration-200 touch-manipulation',
                'min-w-[36px] min-h-[36px] flex items-center justify-center',
                'relative z-50',
                'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              )}
              aria-label="Энциклопедия"
              title="Энциклопедия"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </Link>

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

      {/* Content - loading or builder/game */}
      {!isMounted ? (
        // Loading placeholder during SSR/hydration
        <div className="flex items-center justify-center h-full">
          <div className="text-slate-500 text-sm">Загрузка...</div>
        </div>
      ) : view === 'builder' ? (
        <ArmyBuilder
          army={army}
          setArmy={setArmy}
          rulesVersion={rulesVersion}
          onRulesVersionChange={setRulesVersion}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          onStartBattle={() => setView('game')}
          strictPilotRankEnabled={strictPilotRankEnabled}
          onStrictPilotRankEnabledChange={setStrictPilotRankEnabled}
          distanceInputUnit={distanceInputUnit}
          onDistanceInputUnitChange={setDistanceInputUnit}
          stepToCmFactor={stepToCmFactor}
          onStepToCmFactorChange={setStepToCmFactor}
          autoCompleteEnabled={autoCompleteEnabled}
          onAutoCompleteEnabledChange={setAutoCompleteEnabled}
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
          strictPilotRankEnabled={strictPilotRankEnabled}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={parseInt(stepToCmFactor, 10)}
          autoCompleteEnabled={autoCompleteEnabled}
        />
      )}
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={cancelReset}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelReset}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {army.isInBattle ? 'Завершить бой' : 'Сбросить армию'}
                </h2>
              </div>
              <button
                onClick={cancelReset}
                className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                aria-label="Отмена"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-slate-300">
                {army.isInBattle
                  ? 'Вы уверены, что хотите завершить бой? Весь прогресс боя будет потерян.'
                  : 'Вы уверены, что хотите сбросить армию? Все добавленные юниты будут удалены.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelReset}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all touch-manipulation min-h-[48px]"
              >
                Отмена
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all touch-manipulation min-h-[48px]"
              >
                {army.isInBattle ? 'Завершить' : 'Сбросить'}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </CombatTargetProvider>
  );
}

