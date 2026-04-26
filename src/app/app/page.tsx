'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Army, ArmyUnit, RulesVersionID } from '@/lib/types';
import ArmyBuilder from '@/components/ArmyBuilder';
import GameSession from '@/components/GameSession';
import { GoogleDriveSync } from '@/components/GoogleDriveSync';
import { CheckCircle2, MoreVertical, List, Grid, History, AlertTriangle, X, BookOpen } from 'lucide-react';
import { isValidRulesVersion } from '@/lib/rules-registry';
import { cn } from '@/lib/utils';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { CombatTargetProvider } from '@/contexts/CombatTargetContext';
import { getEncyclopediaFaction } from '@/lib/encyclopedia-registry';
import { trackScreenView } from '@/lib/analytics';

export default function Home() {
  // View state - use URL hash for persistence instead of localStorage to avoid race conditions
  const [view, setView] = useState<'builder' | 'game'>('builder');
  const [showEndMenu, setShowEndMenu] = useState(false);
  const [showCombatLog, setShowCombatLog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Display mode state with localStorage persistence - default to compact on mobile
  const [displayMode, setDisplayMode] = useState<'detailed' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bronepehota_display_mode');
      if (saved === 'compact' || saved === 'detailed') {
        return saved;
      }
      // No saved value - detect mobile
      return window.innerWidth < 768 ? 'compact' : 'detailed';
    }
    return 'detailed'; // SSR default
  });

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

  // Current unit state from GameSession for header actions
  const [currentUnitInfo, setCurrentUnitInfo] = useState<{ unit: ArmyUnit | null; isDone: boolean; isDead: boolean }>({
    unit: null,
    isDone: false,
    isDead: false
  });
  const [triggerOpenEncyclopedia, setTriggerOpenEncyclopedia] = useState(false);
  const toggleUnitDoneRef = useRef<(() => void) | null>(null);
  const handleToggleUnitDone = useCallback(() => {
    toggleUnitDoneRef.current?.();
  }, []);
  const handleOpenEncyclopedia = useCallback(() => {
    setTriggerOpenEncyclopedia(true);
    setTimeout(() => setTriggerOpenEncyclopedia(false), 100);
  }, []);

  const activeFaction = army.faction ? getEncyclopediaFaction(army.faction) : undefined;

  // Faction styles for tech blueprint design
  const getFactionStyles = (factionId: string | null) => {
    const styles = {
      polaris: {
        primary: 'text-red-400',
        border: 'border-red-600/40',
        bg: 'bg-red-950/20',
        bgSolid: 'bg-red-600',
        accent: 'border-red-500'
      },
      protectorate: {
        primary: 'text-cyan-400',
        border: 'border-cyan-600/40',
        bg: 'bg-cyan-950/20',
        bgSolid: 'bg-cyan-600',
        accent: 'border-cyan-500'
      },
      mercenaries: {
        primary: 'text-yellow-400',
        border: 'border-yellow-600/40',
        bg: 'bg-yellow-950/20',
        bgSolid: 'bg-yellow-600',
        accent: 'border-yellow-500'
      }
    };
    return styles[factionId as keyof typeof styles] || styles.polaris;
  };

  const factionStyles = getFactionStyles(army.faction || 'polaris');

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
    trackScreenView(view === 'game' ? 'battle' : 'army_builder');
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
          {/* Header - Clean Tech Style — hidden during setup steps and game mode (controls moved to dock bar) */}
          {(army.currentStep === 'unit-select' || army.currentStep === 'preparation') && (
          <header className={cn(
            "bg-slate-950/95 border-b border-slate-800/80",
            "px-2 md:px-3 py-2 sticky top-0 z-50",
            "backdrop-blur-sm"
          )}>
        {/* Tech corners - subtle */}
        <div className={cn("absolute top-0 left-0 w-2 h-2 border-l border-t z-10", factionStyles.accent)} />
        <div className={cn("absolute top-0 right-0 w-2 h-2 border-r border-t z-10", factionStyles.accent)} />

        <div className="flex items-center gap-2 md:gap-3">
          {/* Left section - Turn button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Turn button — tactical HUD style */}
            <button
              onClick={view === 'game' ? handleInitiativeTrigger : undefined}
              data-testid="new-turn-button"
              className={cn(
                "relative flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-lg transition-all",
                "border-2 min-h-[40px]",
                view === 'game'
                  ? cn("cursor-pointer active:scale-[0.97]", factionStyles.border, factionStyles.bg, "hover:brightness-125")
                  : "cursor-default border-slate-700/40 bg-slate-900/30"
              )}
              title={view === 'game' ? "Новый тур" : undefined}
            >
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-[10px] font-mono font-bold uppercase tracking-wider",
                  view === 'game' ? "text-slate-300" : "text-slate-500"
                )}>
                  Тур
                </span>
                <span
                  data-testid="turn-counter"
                  className={cn(
                    "text-base font-mono font-black leading-none",
                    view === 'game' ? factionStyles.primary : "text-slate-600"
                  )}
                >
                  {army.currentTurn || 1}
                </span>
              </div>
            </button>

            {/* Faction name */}
            <span className={cn(
              "text-[9px] font-mono font-black uppercase tracking-wider",
              factionStyles.primary
            )}>
              {activeFaction?.name}
            </span>
          </div>

          {/* Center section - spacer for balance */}
          <div className="flex-1" />

          {/* Right section - Actions */}
          <nav className="flex items-center gap-1.5 flex-shrink-0">
            {/* Encyclopedia button - subtle, small */}
            {view === 'game' && currentUnitInfo.unit && (
              <button
                onClick={handleOpenEncyclopedia}
                data-testid="unit-encyclopedia-button"
                className={cn(
                  "w-8 h-8 min-h-[44px] flex items-center justify-center rounded-sm transition-all",
                  "hover:scale-[1.02] active:scale-95",
                  "bg-slate-900/30 hover:bg-slate-800/50"
                )}
                title="Энциклопедия юнита"
              >
                <BookOpen className="w-3 h-3 text-slate-500" />
              </button>
            )}

            {/* Unit done button - prominent, primary action */}
            {view === 'game' && currentUnitInfo.unit && (
              <button
                onClick={handleToggleUnitDone}
                disabled={currentUnitInfo.isDead}
                data-testid="unit-done-button"
                className={cn(
                  "w-11 h-11 min-h-[44px] flex items-center justify-center rounded-sm border-2 transition-all",
                  "hover:scale-[1.02] active:scale-95",
                  currentUnitInfo.isDead
                    ? "bg-slate-900/50 border-slate-800/50 opacity-40 cursor-not-allowed"
                    : currentUnitInfo.isDone
                      ? "bg-emerald-950/50 border-emerald-700/60 hover:bg-emerald-950/70 hover:border-emerald-600/60"
                      : "bg-slate-900/50 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600/60"
                )}
                title={currentUnitInfo.isDone ? "Отменить завершение" : "Завершить ход"}
              >
                {currentUnitInfo.isDone ? (
                  <X className="w-5 h-5 text-emerald-400" />
                ) : (
                  <CheckCircle2 className={cn(
                    "w-5 h-5",
                    currentUnitInfo.isDead ? "text-slate-700" : "text-slate-400"
                  )} />
                )}
              </button>
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

            {/* Google Drive Import button */}
            <GoogleDriveSync
              mode="import"
              onImportComplete={() => window.location.reload()}
              compact
            />

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
      )}

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
          onCurrentUnitChange={(unit, isDone, isDead) => {
            setCurrentUnitInfo({ unit, isDone, isDead });
          }}
          onToggleUnitDoneRef={(fn) => { toggleUnitDoneRef.current = fn; }}
          triggerOpenEncyclopedia={triggerOpenEncyclopedia}
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

