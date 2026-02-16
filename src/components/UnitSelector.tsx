'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { GitHubPagesImage as Image } from './GitHubPagesImage';
import type { Faction, Squad, Machine, ArmyUnit, FactionID, FilterType } from '@/lib/types';
import { Plus, ArrowLeft, Users, Zap, Shield } from 'lucide-react';
import { WeaponSelectorModal } from './WeaponSelectorModal';
import MachineBlueprintModal from './machine/MachineBlueprintModal';
import SquadBlueprintModal from './SquadBlueprintModal';
import { countByUnitType } from '@/lib/unit-utils';
import MachineCard from './machine/MachineCard';
import { TabBar } from './TabBar';
import { ArmyControlPanel } from './ArmyControlPanel';
import { ArmySummaryView } from './ArmySummaryView';
import { CompactUnitCard } from './CompactUnitCard';
import { clsx } from 'clsx';
import { getFactionColors } from '@/lib/faction-colors';

interface UnitSelectorProps {
  factions: Faction[];
  squads: Squad[];
  machines?: Machine[];
  selectedFaction: FactionID;
  pointBudget: number;
  army: ArmyUnit[];
  onAddUnit: (squad: Squad) => void;
  onAddMachine?: (machine: Machine, selectedWeaponIndices?: number[]) => void;
  onRemoveUnit: (instanceId: string) => void;
  onToBattle: () => void;
  onBackToFactionSelect?: () => void;
  isLoading?: boolean;
  loadError?: string | null;
  displayMode: 'detailed' | 'compact';
  onDisplayModeChange: (mode: 'detailed' | 'compact') => void;
}

type UnitDisplay = {
  type: 'squad' | 'machine';
  data: Squad | Machine;
};

/**
 * UnitSelector - Display available units with budget-aware controls
 *
 * Accessibility (FR-022, FR-023, FR-024):
 * - Keyboard: Tab to navigate, Enter to add/remove, Arrow keys within lists
 * - ARIA: aria-live for budget, aria-disabled for buttons, aria-label for units
 * - Focus: First unit receives focus, moves to newly added unit
 *
 * Mobile (FR-025, FR-027):
 * - Breakpoints: <768px (mobile), 768-1024px (tablet), >1024px (desktop)
 * - Touch targets: 48x48px for add/remove buttons
 * - Images: 120px minimum width
 */
export function UnitSelector({
  factions,
  squads,
  machines = [],
  selectedFaction,
  pointBudget,
  army,
  onAddUnit,
  onAddMachine,
  onRemoveUnit,
  onToBattle,
  onBackToFactionSelect,
  isLoading = false,
  loadError = null,
  displayMode,
  onDisplayModeChange: _onDisplayModeChange,
}: UnitSelectorProps) {
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<'browse' | 'army'>('browse');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Load view mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_view_mode');
    if (saved === 'browse' || saved === 'army') {
      setViewMode(saved);
    }
  }, []);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem('bronepehota_view_mode', viewMode);
  }, [viewMode]);

  const [showWarning, setShowWarning] = useState(false);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  // Count units by type for badges
  const unitCounts = useMemo(() => {
    return countByUnitType(army);
  }, [army]);

  // Modal state for viewing unit details
  const [selectedUnit, setSelectedUnit] = useState<UnitDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Weapon selector modal state for machines
  const [weaponSelectorMachine, setWeaponSelectorMachine] = useState<Machine | null>(null);
  const [isWeaponSelectorOpen, setIsWeaponSelectorOpen] = useState(false);

  // Calculate remaining points
  const totalCost = army.reduce((sum, unit) => {
    return sum + unit.data.cost;
  }, 0);
  const remainingPoints = pointBudget - totalCost;

  // Filter units by selected faction
  const availableSquads = useMemo(() => squads.filter(s => s.faction === selectedFaction), [squads, selectedFaction]);
  const availableMachines = useMemo(() => machines.filter(m => m.faction === selectedFaction), [machines, selectedFaction]);

  // All mercenaries squads - available to all factions
  const allMercenaries = useMemo(() => squads.filter(s => s.faction === 'mercenaries'), [squads]);

  // Combine all available units (including mercenaries for non-mercenaries factions)
  const availableUnits: UnitDisplay[] = useMemo(() => {
    const units: UnitDisplay[] = [
      ...availableSquads.map(s => ({ type: 'squad' as const, data: s })),
      ...availableMachines.map(m => ({ type: 'machine' as const, data: m })),
    ];
    // Add mercenaries if not playing as mercenaries faction (they're already included above)
    if (selectedFaction !== 'mercenaries') {
      units.push(...allMercenaries.map(s => ({ type: 'squad' as const, data: s })));
    }
    return units;
  }, [availableSquads, availableMachines, allMercenaries, selectedFaction]);

  // Apply type filter to available units
  const filteredAvailableUnits = useMemo(() => {
    let units = availableUnits;
    if (filterType !== 'all') {
      if (filterType === 'mercenary') {
        // Show only mercenaries squads
        units = units.filter(u => u.type === 'squad' && (u.data as Squad).faction === 'mercenaries');
      } else {
        // Show squads or machines
        units = units.filter(u => u.type === filterType);
      }
    }
    return units;
  }, [availableUnits, filterType]);

  // Check if unit can be afforded
  const canAffordUnit = (cost: number) => cost <= remainingPoints;

  // Get faction for styling
  const faction = factions.find(f => f.id === selectedFaction);

  // Handle add unit with budget check
  const handleAddUnit = (unit: UnitDisplay) => {
    if (!canAffordUnit(unit.data.cost)) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }
    if (unit.type === 'squad') {
      onAddUnit(unit.data as Squad);
    } else if (unit.type === 'machine' && onAddMachine) {
      // Open weapon selector modal for machines
      setWeaponSelectorMachine(unit.data as Machine);
      setIsWeaponSelectorOpen(true);
    }
  };

  // Handle weapon selection confirmation
  const handleWeaponSelectionConfirm = (selectedIndices: number[]) => {
    if (weaponSelectorMachine && onAddMachine) {
      onAddMachine(weaponSelectorMachine, selectedIndices);
    }
    setIsWeaponSelectorOpen(false);
    setWeaponSelectorMachine(null);
  };

  // Handle weapon selection cancel
  const handleWeaponSelectionCancel = () => {
    setIsWeaponSelectorOpen(false);
    setWeaponSelectorMachine(null);
  };

  // Handle unit card click
  const handleUnitClick = (unit: UnitDisplay) => {
    setExpandedUnitId(unit.data.id === expandedUnitId ? null : unit.data.id);
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  // Get unit type badge (unused)
  const _getUnitTypeBadge = (type: 'squad' | 'machine') => {
    if (type === 'squad') {
      return { icon: Users, label: 'Отряд', color: 'text-blue-400' };
    }
    return { icon: Zap, label: 'Машина', color: 'text-yellow-400' };
  };

  // Get unit description/role (unused)
  const _getUnitRole = (unit: UnitDisplay): string => {
    if (unit.type === 'squad') {
      const squad = unit.data as Squad;
      const soldierCount = squad.soldiers.length;
      return `${soldierCount} бойцов`;
    }
    const _machine = unit.data as Machine;
    const weaponCount = _machine.weapons.length;
    return `${weaponCount} оруж.`;
  };

  // Get squad max rank
  const getSquadMaxRank = (squad: Squad): number => {
    return Math.max(...squad.soldiers.map(s => s.rank));
  };

  // Get squad armor range
  const getSquadArmorRange = (squad: Squad): string => {
    const armors = squad.soldiers.map(s => s.armor);
    const min = Math.min(...armors);
    const max = Math.max(...armors);
    return min === max ? `${min}` : `${min}-${max}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12" role="status" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400"></div>
        <span className="ml-4 text-slate-400">Загрузка...</span>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg" role="alert" aria-live="assertive">
        <p className="text-red-400 mb-4">Ошибка загрузки данных</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          Повторить
        </button>
      </div>
    );
  }

  // Empty state
  if (availableUnits.length === 0) {
    return (
      <div className="text-center p-6 sm:p-12 bg-slate-700/40 rounded-lg space-y-6">
        <p className="text-slate-400 text-base sm:text-lg">Для этой фракции пока нет доступных юнитов</p>
        {onBackToFactionSelect && (
          <button
            onClick={onBackToFactionSelect}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 mx-auto min-h-[48px] touch-manipulation"
          >
            <ArrowLeft size={20} className="flex-shrink-0" />
            <span className="hidden sm:inline">Вернуться к выбору фракции</span>
            <span className="sm:hidden">Назад к фракции</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="unit-selector">
      {/* Unified control panel */}
      <ArmyControlPanel
        viewMode={viewMode}
        filterType={filterType}
        factionId={selectedFaction}
        onFilterChange={setFilterType}
        squadCount={availableSquads.length}
        machineCount={availableMachines.length}
        mercenaryCount={allMercenaries.length}
      />

      {/* Warning toast */}
      {showWarning && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-yellow-900/50 border border-yellow-500/50 backdrop-blur-sm rounded-lg text-yellow-200 font-mono text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            НЕДОСТАТОЧНО ОЧКОВ
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'browse' ? (
        /* Available units */
        <div className="space-y-4">
          {filteredAvailableUnits.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <p className="text-slate-500 text-sm">
                Нет юнитов выбранного типа
              </p>
            </div>
          ) : displayMode === 'compact' ? (
            /* Compact view - list of compact cards */
            <div className="space-y-2">
              {filteredAvailableUnits.map((unit) => {
                const affordable = canAffordUnit(unit.data.cost);
                const count = unitCounts[unit.data.id] || 0;

                return (
                  <CompactUnitCard
                    key={unit.data.id}
                    unit={unit.data}
                    type={unit.type}
                    onAdd={() => handleAddUnit(unit)}
                    onClick={() => handleUnitClick(unit)}
                    factionId={unit.type === 'squad' ? (unit.data as Squad).faction as FactionID : selectedFaction}
                    canAfford={affordable}
                    countInArmy={count}
                  />
                );
              })}
            </div>
          ) : (
            /* Detailed view - grid of full cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailableUnits.map((unit) => {
                const affordable = canAffordUnit(unit.data.cost);
                const count = unitCounts[unit.data.id] || 0;

                // Render machines with MachineCard component
                if (unit.type === 'machine') {
                  return (
                    <div key={unit.data.id} className="relative">
                      <MachineCard
                        machine={unit.data as Machine}
                        onAdd={(_machine) => handleAddUnit(unit)}
                        onViewDetails={(machine) => {
                          setSelectedUnit({ type: 'machine', data: machine });
                          setIsModalOpen(true);
                        }}
                        testId={`add-unit-${unit.data.id}`}
                      />
                      {/* Count badge */}
                      {count > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 min-w-[24px] flex items-center justify-center border-2 border-slate-900 z-10">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                }

                // Render squads with Military Tech Blueprint design matching MachineCard
                const squad = unit.data as Squad;
                // Use squad's faction for colors (important for mercenaries)
                const squadFaction = squad.faction as FactionID;
                const colors = getFactionColors(squadFaction);
                const disabledColors = 'border-slate-700 text-slate-500';

                // Construct combined hover classes for border and bg
                const borderWithHover = `${colors.border} hover:${colors.borderSolid}`;
                const bgHover = colors.bg.replace('bg-', 'hover:bg-');

                return (
                  <div key={unit.data.id} className="relative">
                    <div
                      onClick={() => handleUnitClick(unit)}
                      data-testid={`unit-card-${unit.data.id}`}
                      className={clsx(
                        'relative group cursor-pointer transition-all duration-300',
                        'border bg-slate-800/80 backdrop-blur-sm overflow-hidden',
                        affordable ? borderWithHover : disabledColors,
                        affordable ? bgHover : ''
                      )}
                    >
                      {/* Corner accents */}
                      <div className={clsx(
                        'absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2',
                        'transition-all duration-300',
                        affordable ? colors.borderSolid : 'border-slate-700'
                      )} />
                      <div className={clsx(
                        'absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2',
                        'transition-all duration-300',
                        affordable ? colors.borderSolid : 'border-slate-700'
                      )} />
                      <div className={clsx(
                        'absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2',
                        'transition-all duration-300',
                        affordable ? colors.borderSolid : 'border-slate-700'
                      )} />
                      <div className={clsx(
                        'absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2',
                        'transition-all duration-300',
                        affordable ? colors.borderSolid : 'border-slate-700'
                      )} />

                      {/* Image container */}
                      <div className="relative aspect-[4/3] bg-slate-900/50 overflow-hidden">
                        {unit.data.image ? (
                          <Image
                            src={unit.data.image}
                            alt={unit.data.name}
                            fill
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            unoptimized
                          />
                        ) : squad.soldiers[0]?.image ? (
                          /* Fallback: show first soldier thumbnail */
                          <Image
                            src={squad.soldiers[0].image}
                            alt={`${squad.name} - боец 1`}
                            fill
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            unoptimized
                          />
                        ) : (
                          /* Final fallback: placeholder icon */
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <Users className={clsx('w-16 h-16 opacity-20', affordable ? colors.text : 'text-slate-600')} />
                          </div>
                        )}

                        {/* Rank badge */}
                        <div className={clsx(
                          'absolute top-2 right-2 px-2 py-0.5 rounded-sm font-mono text-xs font-bold',
                          'bg-slate-900/90 backdrop-blur-sm border',
                          affordable ? colors.border : 'border-slate-700',
                          affordable ? colors.text : 'text-slate-500'
                        )}>
                          R{getSquadMaxRank(squad)}
                        </div>

                        {/* Holographic overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                      </div>

                      {/* Content */}
                      <div className="p-3 space-y-2">
                        {/* Name and cost */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={clsx(
                              'font-bold text-sm font-mono tracking-wide truncate',
                              affordable ? colors.text : 'text-slate-500'
                            )} title={squad.name}>
                              {squad.name.toUpperCase()}
                            </h3>
                            <p className="text-[10px] text-slate-500 truncate font-mono">
                              ОТРЯД
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={clsx('font-mono font-bold text-sm', affordable ? colors.text : 'text-slate-500')}>
                              {squad.cost}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">очков</span>
                          </div>
                        </div>

                        {/* Quick stats */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono flex-wrap">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{squad.soldiers.length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>Бр {getSquadArmorRange(squad)}</span>
                          </div>
                          <div className={clsx('ml-auto', affordable ? colors.text : 'text-slate-600')}>
                            R{getSquadMaxRank(squad)}
                          </div>
                        </div>

                        {/* Add button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddUnit(unit);
                          }}
                          data-testid={`add-unit-${unit.data.id}`}
                          disabled={!affordable}
                          aria-disabled={!affordable}
                          aria-label={`Добавить ${unit.data.name}`}
                          className={clsx(
                            'w-full py-2 flex items-center justify-center gap-2',
                            'border font-mono text-xs font-bold uppercase tracking-wider',
                            'transition-all duration-200',
                            'touch-manipulation',
                            affordable ? borderWithHover : 'border-slate-700',
                            affordable ? bgHover : '',
                            affordable ? colors.text : 'text-slate-500',
                            !affordable && 'bg-slate-800/50 cursor-not-allowed opacity-50'
                          )}
                        >
                          <Plus className="w-4 h-4" />
                          В АРМИЮ
                        </button>
                      </div>
                    </div>

                    {/* Count badge */}
                    {count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 min-w-[24px] flex items-center justify-center border-2 border-slate-900 z-10">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Army view mode */}
          <ArmySummaryView
            units={army}
            onRemoveUnit={onRemoveUnit}
            onUnitClick={(unit: ArmyUnit) => {
              setSelectedUnit({ type: unit.type, data: unit.data });
              setIsModalOpen(true);
            }}
            onToBattle={onToBattle}
            displayMode={displayMode}
            factionId={selectedFaction}
          />
        </>
      )}

      {/* Unit details modal */}
      {selectedUnit && selectedUnit.type === 'squad' && (
        <SquadBlueprintModal
          squad={selectedUnit.data as any}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {selectedUnit && selectedUnit.type === 'machine' && (
        <MachineBlueprintModal
          machine={selectedUnit.data as any}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Weapon selector modal for machines */}
      {weaponSelectorMachine && faction && (
        <WeaponSelectorModal
          machine={weaponSelectorMachine}
          faction={faction}
          isOpen={isWeaponSelectorOpen}
          onClose={handleWeaponSelectionCancel}
          onConfirm={handleWeaponSelectionConfirm}
        />
      )}

      {/* Tab bar (mobile only) */}
      <TabBar
        activeTab={viewMode}
        onTabChange={setViewMode}
        availableCount={availableUnits.length}
        armyCount={army.length}
        factionId={selectedFaction}
        currentCost={totalCost}
        pointBudget={pointBudget}
      />
    </div>
  );
}
