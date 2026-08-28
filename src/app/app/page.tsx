'use client';

import { useState, useEffect, useRef } from 'react';
import { Army, ArmyUnit, FactionID, RulesVersionID } from '@/lib/types';
import ArmyBuilder from '@/components/ArmyBuilder';
import GameSession from '@/components/GameSession';
import { AlertTriangle, X } from 'lucide-react';
import { isValidRulesVersion } from '@/lib/rules-registry';
import { getDefaultSource, getSourceWithCustom } from '@/lib/sources-registry';
import { factionParamToApply } from '@/lib/deep-link';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { loadArmy, saveArmy } from '@/lib/army-storage';
import { CombatTargetProvider } from '@/contexts/CombatTargetContext';

export default function Home() {
  // View state - use URL hash for persistence instead of localStorage to avoid race conditions
  const [view, setView] = useState<'builder' | 'game'>('builder');
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
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bronepehota_rules_version');
      if (saved && isValidRulesVersion(saved)) return saved as RulesVersionID;
    }
    return 'tehnolog';
  });

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

  // Current unit state from GameSession for header actions
  const [_currentUnitInfo, setCurrentUnitInfo] = useState<{ unit: ArmyUnit | null; isDone: boolean; isDead: boolean }>({
    unit: null,
    isDone: false,
    isDead: false
  });
  const [triggerOpenEncyclopedia, setTriggerOpenEncyclopedia] = useState(false);
  const toggleUnitDoneRef = useRef<(() => void) | null>(null);

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
    const loadedArmy = loadArmy();
    if (loadedArmy) {
      setArmy(loadedArmy);
    }
    // Mark army as loaded regardless of whether localStorage had data
    setIsArmyLoaded(true);
  }, [isMounted]);

  // Deep-link /app?faction=<id> — мост из энциклопедии: предвыбор фракции.
  // Только для «свежей» армии (см. factionParamToApply): армию вернувшегося
  // игрока не перезаписываем. Параметр вычищаем из URL, чтобы F5 не применял его снова.
  useEffect(() => {
    if (!isArmyLoaded || typeof window === 'undefined') return;
    const source = getSourceWithCustom(army.sourceId ?? getDefaultSource());
    const validFactions = source ? source.factions.map((f) => String(f.id)) : [];
    const faction = factionParamToApply(window.location.search, army, validFactions);
    if (!faction) return;
    setArmy((prev) => ({ ...prev, faction: faction as FactionID }));
    window.history.replaceState({}, '', window.location.pathname);
  }, [isArmyLoaded, army]);

  // view='game' без юнитов (битый localStorage) — чиним состояние, а не только рендер:
  // иначе первый добавленный юнит перескочил бы в бой, минуя подготовку.
  useEffect(() => {
    if (!isArmyLoaded) return;
    if (view === 'game' && army.units.length === 0) setView('builder');
  }, [isArmyLoaded, view, army.units]);

  // Save army to localStorage when it changes. Debounced (300ms) — serializing a
  // large army on every action caused main-thread jank on mobile. Only after load.
  useEffect(() => {
    if (!isArmyLoaded) return;
    const timer = setTimeout(() => saveArmy(army), 300);
    return () => clearTimeout(timer);
  }, [army, isArmyLoaded]);

  // Flush on page hide (reload/close/tab-switch) so the debounce never loses data.
  const armyRef = useRef(army);
  useEffect(() => { armyRef.current = army; }, [army]);
  useEffect(() => {
    if (!isArmyLoaded) return;
    const flush = () => saveArmy(armyRef.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [isArmyLoaded]);

  return (
    <CombatTargetProvider>
      <main className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
        {/* Scrollable wrapper containing both header and content */}
        <div className="flex-1 overflow-auto min-h-0">
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

