'use client';

import { useState, useEffect } from 'react';
import { Army, RulesVersionID } from '@/lib/types';
import ArmyBuilder from '@/components/ArmyBuilder';
import GameSession from '@/components/GameSession';
import factionsData from '@/data/factions.json';
import { Shield, ArrowLeft, CheckCircle2, MoreVertical } from 'lucide-react';
import { isValidRulesVersion, getAllRulesVersions } from '@/lib/rules-registry';

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
      {/* Header */}
      <header className="glass-strong border-b border-slate-700/50 px-2 md:px-4 py-2 md:py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Left section - Faction badge */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div
              className={`p-2 md:p-2.5 rounded-xl shadow-lg transition-all duration-300 ${
                view === 'game' && !army.isInBattle
                  ? 'hover:scale-105 active:scale-95 cursor-pointer'
                  : ''
              }`}
              style={{
                backgroundColor: activeFaction?.color || '#ef4444',
                boxShadow: `0 4px 14px 0 ${(activeFaction?.color || '#ef4444')}40`
              }}
              onClick={() => {
                if (view === 'game' && !army.isInBattle) {
                  setView('builder');
                }
              }}
              title={view === 'game' && !army.isInBattle ? 'Вернуться в Штаб' : undefined}
            >
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className={`relative group ${view === 'game' && !army.isInBattle ? 'cursor-pointer' : ''}`}
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
                <h1 className="text-sm md:text-xl font-bold tracking-tight leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  <span className="hidden md:inline">БРОНЕПЕХОТА</span>
                  <span className="md:hidden">БП</span>
                </h1>
              </div>
              <span
                className="text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors duration-300"
                style={{ color: activeFaction?.color || '#ef4444' }}
              >
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
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500">Тур</span>
                <span className="text-xs md:text-sm font-black text-blue-400">{army.currentTurn || 1}</span>
              </div>
            )}

            {/* End Battle button - replaced with dropdown menu */}
            {view === 'game' && army.isInBattle && (
              <div className="relative">
                <button
                  onClick={() => setShowEndMenu(!showEndMenu)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showEndMenu && (
                  <div className="absolute right-0 top-12 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 min-w-[150px] z-50">
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

            {view === 'game' && !army.isInBattle && (
              <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-600/30">
                Бой
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

