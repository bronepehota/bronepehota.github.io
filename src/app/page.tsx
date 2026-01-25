'use client';

import { useState, useEffect } from 'react';
import { Army, RulesVersionID } from '@/lib/types';
import ArmyBuilder from '@/components/ArmyBuilder';
import GameSession from '@/components/GameSession';
import factionsData from '@/data/factions.json';
import { Shield, ArrowLeft, CheckCircle2, MoreVertical } from 'lucide-react';
import { isValidRulesVersion, getAllRulesVersions } from '@/lib/rules-registry';
import { cn } from '@/lib/utils';

export default function Home() {
  const [view, setView] = useState<'builder' | 'game'>('builder');
  const [showEndMenu, setShowEndMenu] = useState(false);
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
              <div className={cn(
                "relative px-2 md:px-2.5 py-1 rounded-sm border",
                factionStyles.border,
                "bg-slate-900/60"
              )}>
                <span className="text-[8px] md:text-[9px] font-mono uppercase opacity-40">ТУР</span>
                <span className={cn("text-xs md:text-sm font-mono font-black", factionStyles.primary)}>
                  {army.currentTurn || 1}
                </span>
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
      <div className={`flex-1 overflow-auto ${view === 'builder' && army.currentStep === 'unit-select' ? 'pb-20 md:pb-20' : ''}`}>
        {view === 'builder' ? (
          <ArmyBuilder
            army={army}
            setArmy={setArmy}
            onEnterBattle={handleEnterBattle}
            rulesVersion={rulesVersion}
            onRulesVersionChange={setRulesVersion}
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

      {/* Fixed footer for unit-select phase */}
      {view === 'builder' && army.currentStep === 'unit-select' && army.pointBudget && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-slate-700/50 px-3 md:px-4 py-2.5 md:py-3 shadow-xl backdrop-blur-sm bg-slate-900/95">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
            {/* Left part: budget with progress bar */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <span className="text-slate-400 text-sm md:text-base flex-shrink-0">💰</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 md:gap-2 mb-1">
                  <span className="font-bold text-sm md:text-base">{army.totalCost}</span>
                  <span className="text-slate-500 text-xs md:text-sm">/</span>
                  <span className="text-slate-400 text-xs md:text-sm">{army.pointBudget}</span>
                  <span className="text-slate-500 text-[10px] md:text-xs ml-0.5 hidden sm:inline">очков</span>
                </div>
                <div className="h-1 md:h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (1 - army.totalCost / army.pointBudget) > 0.5
                        ? 'bg-green-500'
                        : (1 - army.totalCost / army.pointBudget) > 0.2
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, (army.totalCost / army.pointBudget) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Middle: rules version */}
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-slate-800/50 flex-shrink-0">
              <div
                className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getAllRulesVersions().find(v => v.id === rulesVersion)?.color }}
              />
              <span className="font-semibold text-xs md:text-sm hidden sm:inline">
                {getAllRulesVersions().find(v => v.id === rulesVersion)?.name || ''}
              </span>
            </div>

            {/* Right part: unit counter */}
            <div className="flex items-center gap-1.5 md:gap-2 text-slate-400 flex-shrink-0">
              <span className="text-sm md:text-base">👥</span>
              <span className="font-semibold text-sm md:text-base">{army.units.length}</span>
              <span className="text-[10px] md:text-xs text-slate-500 hidden sm:inline">
                {army.units.length === 1 ? 'отряд' : army.units.length > 1 && army.units.length < 5 ? 'отряда' : 'отрядов'}
              </span>
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}

