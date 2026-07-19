'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { GitHubPagesImage as Image } from './GitHubPagesImage';
import type { Faction, Squad, Machine, ArmyUnit, FactionID, FilterType, SourceID } from '@/lib/types';
import { Plus, Users, Shield, BookOpen, X, Sword } from 'lucide-react';
import { UnitDetailSheet } from './encyclopedia/UnitDetailSheet';
import MachineCard from './machine/MachineCard';
import { ArmyControlPanel } from './ArmyControlPanel';
import { CompactUnitCard } from './CompactUnitCard';
import { FloatingContinueButton } from './controls/FloatingContinueButton';
import { clsx } from 'clsx';
import { getFactionColors, factionDisplayNames } from '@/lib/faction-colors';
import { FactionLogo } from '@/components/FactionLogo';


interface UnitSelectorProps {
  factions: Faction[];
  squads: Squad[];
  machines?: Machine[];
  selectedFaction?: FactionID; // Optional to handle case where no faction is selected yet
  /**
   * Set of faction ids allied with `selectedFaction` (symmetric + wildcard;
   * computed by ArmyBuilder via getAlliedFactions). A unit is available when its
   * faction matches `selectedFaction` OR is in this set. Replaces the former
   * hardcoded `selectedFaction === 'mercenaries'` special-cases.
   */
  alliedFactionIds: Set<FactionID>;
  pointBudget: number;
  army: ArmyUnit[];
  onAddUnit: (squad: Squad) => void;
  onAddMachine?: (machine: Machine, selectedWeaponIndices?: number[]) => void;
  onRemoveUnit: (instanceId: string) => void;
  onToBattle: () => void;
  isLoading?: boolean;
  loadError?: string | null;
  displayMode: 'detailed' | 'compact';
  onDisplayModeChange: (mode: 'detailed' | 'compact') => void;
  sourceId: SourceID;
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
  factions: _factions, // factions prop kept for backward compatibility, no longer needed after WeaponSelectorModal removal
  squads,
  machines = [],
  selectedFaction,
  alliedFactionIds,
  pointBudget,
  army,
  onAddUnit,
  onAddMachine,
  onRemoveUnit,
  onToBattle,
  isLoading = false,
  loadError = null,
  displayMode,
  onDisplayModeChange,
  sourceId,
}: UnitSelectorProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');

  const [showWarning, setShowWarning] = useState(false);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  // Modal state for viewing unit details
  const [selectedUnit, setSelectedUnit] = useState<UnitDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate remaining points
  const totalCost = army.reduce((sum, unit) => {
    return sum + unit.data.cost;
  }, 0);

  // A unit (squad or machine) is available when it belongs to the selected
  // faction OR to an allied faction. Mercenaries (`allies:["*"]`) are allied
  // with every faction, and every faction is allied with them, so they flow
  // through this same rule — no hardcoded `mercenaries` special-case.
  const isAvailable = useCallback(
    (faction: FactionID) => faction === selectedFaction || alliedFactionIds.has(faction),
    [selectedFaction, alliedFactionIds],
  );

  const availableSquads = useMemo(
    () => squads.filter((s) => isAvailable(s.faction)),
    [squads, isAvailable],
  );
  const availableMachines = useMemo(
    () => machines.filter((m) => isAvailable(m.faction)),
    [machines, isAvailable],
  );

  // Mercenary squads within the available set — surfaced via the 'mercenary'
  // filter tab. Computed from availableSquads so the count tracks the alliance
  // model (a non-merc faction sees its allied merc squads; the merc faction
  // itself sees its own merc squads here, other factions' squads under 'all').
  const availableMercenarySquads = useMemo(
    () => availableSquads.filter((s) => s.faction === 'mercenaries'),
    [availableSquads],
  );

  const availableUnits: UnitDisplay[] = useMemo(
    () => {
      const units: UnitDisplay[] = [
        ...availableSquads.map((s) => ({ type: 'squad' as const, data: s })),
        ...availableMachines.map((m) => ({ type: 'machine' as const, data: m })),
      ];
      // Own-faction units first, allied units after (stable sort keeps source
      // order within each group). selectedFaction's squads+machines lead, then allies.
      return units.sort(
        (a, b) =>
          (a.data.faction === selectedFaction ? 0 : 1) -
          (b.data.faction === selectedFaction ? 0 : 1),
      );
    },
    [availableSquads, availableMachines, selectedFaction],
  );

  // Apply type filter to available units
  const filteredAvailableUnits = useMemo(() => {
    let units = availableUnits;
    if (filterType === 'selected') {
      // Show only units that are in the army
      units = units.filter(u => army.some(a => a.data.id === u.data.id));
    } else if (filterType !== 'all') {
      if (filterType === 'mercenary') {
        // Show only mercenaries squads
        units = units.filter(u => u.type === 'squad' && (u.data as Squad).faction === 'mercenaries');
      } else {
        // Show squads or machines
        units = units.filter(u => u.type === filterType);
      }
    }
    return units;
  }, [availableUnits, filterType, army]);

  // Get instance count for a unit
  const getInstanceCount = (unitId: string): number => {
    return army.filter(u => u.data.id === unitId).length;
  };

  // Get most recent instance of a unit
  const getLatestInstance = (unitId: string): ArmyUnit | undefined => {
    const instances = army.filter(u => u.data.id === unitId);
    if (instances.length === 0) return undefined;
    return instances[instances.length - 1];
  };

  // Check if unit can be afforded
  const canAffordUnit = (cost: number) => cost <= (pointBudget - totalCost);

  // Resolve the faction id of an allied unit, or undefined when the unit
  // belongs to the player's own faction (or no faction is selected). Drives the
  // colored "Союзник" pill shown next to the unit name in all three render
  // paths — the badge derives its label and color from this id (see
  // CompactUnitCard / MachineCard).
  const allyFactionIdFor = (unit: UnitDisplay): FactionID | undefined => {
    if (!selectedFaction || unit.data.faction === selectedFaction) return undefined;
    return unit.data.faction as FactionID;
  };

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
      // Add machine directly with all weapons selected (default behavior)
      onAddMachine(unit.data as Machine);
    }
  };

  // Handle unit card click
  const handleUnitClick = (unit: UnitDisplay) => {
    setExpandedUnitId(unit.data.id === expandedUnitId ? null : unit.data.id);
    setSelectedUnit(unit);
    setIsModalOpen(true);
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
        <p className="text-slate-500 text-sm">Используйте навигацию выше для выбора другой фракции</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="unit-selector">
      {/* Unified control panel */}
      <ArmyControlPanel
        viewMode="browse"
        filterType={filterType}
        factionId={selectedFaction || ''}
        onFilterChange={setFilterType}
        squadCount={availableSquads.length}
        machineCount={availableMachines.length}
        mercenaryCount={availableMercenarySquads.length}
        currentCost={totalCost}
        pointBudget={pointBudget}
        armyCount={army.length}
        displayMode={displayMode}
        onDisplayModeChange={onDisplayModeChange}
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

      {/* Available units */}
      <div className="space-y-4 pb-32">
        {filteredAvailableUnits.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <p className="text-slate-500 text-sm">
              {filterType === 'selected' ? 'Нет выбранных юнитов' : 'Нет юнитов выбранного типа'}
            </p>
          </div>
        ) : displayMode === 'compact' ? (
          /* Compact view - list of compact cards */
          <div className="space-y-2">
            {filteredAvailableUnits.map((unit) => {
              const affordable = canAffordUnit(unit.data.cost);
              const count = getInstanceCount(unit.data.id);
              const instance = getLatestInstance(unit.data.id);
              const isInArmy = count > 0;
              const allyFactionId = allyFactionIdFor(unit);
              // Always use the unit's own faction for the card frame/ring — for
              // an ALLIED machine this means the ally's color (matches the ally
              // badge) instead of the selected faction's color. For own-faction
              // units, data.faction === selectedFaction so nothing changes.
              const unitFaction = unit.data.faction as FactionID;

              return (
                <div key={unit.data.id} className={clsx('relative', isInArmy && 'ring-2 ring-offset-2 ring-offset-slate-900', isInArmy && getFactionColors(unitFaction).ring)}>
                  <CompactUnitCard
                    unit={unit.data}
                    type={unit.type}
                    onAdd={() => handleAddUnit(unit)}
                    onClick={() => handleUnitClick(unit)}
                    factionId={unitFaction}
                    canAfford={affordable}
                    countInArmy={count}
                    allyFactionId={allyFactionId}
                  />

                  {/* Count badge */}
                  {count > 0 && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-xs font-bold z-10">
                      ×{count}
                    </span>
                  )}

                  {/* Remove button */}
                  {count > 0 && instance && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveUnit(instance.instanceId);
                      }}
                      className="absolute top-2 right-10 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center z-10"
                      aria-label="Удалить из армии"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Detailed view - grid of full cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailableUnits.map((unit) => {
              const affordable = canAffordUnit(unit.data.cost);
              const count = getInstanceCount(unit.data.id);
              const instance = getLatestInstance(unit.data.id);
              const isInArmy = count > 0;
              // Always use the unit's own faction for the card frame/ring — for
              // an ALLIED machine this means the ally's color (matches the ally
              // badge) instead of the selected faction's color. For own-faction
              // units, data.faction === selectedFaction so nothing changes.
              const unitFaction = unit.data.faction as FactionID;
              const colors = getFactionColors(unitFaction);
              const allyFactionId = allyFactionIdFor(unit);

              // Render machines with MachineCard component
              if (unit.type === 'machine') {
                return (
                  <div key={unit.data.id} className={clsx('relative', isInArmy && 'ring-2 ring-offset-2 ring-offset-slate-900', isInArmy && colors.ring)}>
                    <MachineCard
                      machine={unit.data as Machine}
                      onAdd={(_machine) => handleAddUnit(unit)}
                      onViewDetails={(machine) => {
                        setSelectedUnit({ type: 'machine', data: machine });
                        setIsModalOpen(true);
                      }}
                      testId={`add-unit-${unit.data.id}`}
                      allyFactionId={allyFactionId}
                    />

                    {/* Count badge */}
                    {count > 0 && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-xs font-bold z-10">
                        ×{count}
                      </span>
                    )}

                    {/* Remove button */}
                    {count > 0 && instance && (
                      <button
                        onClick={() => onRemoveUnit(instance.instanceId)}
                        className="absolute top-2 right-10 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center z-10"
                        aria-label="Удалить из армии"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              }

              // Render squads with Military Tech Blueprint design matching MachineCard
              const squad = unit.data as Squad;
              const disabledColors = 'border-slate-700 text-slate-500';

              // Construct combined hover classes for border and bg
              const borderWithHover = `${colors.border} hover:${colors.borderSolid}`;
              const bgHover = colors.bg.replace('bg-', 'hover:bg-');

              return (
                <div key={unit.data.id} className={clsx('relative', isInArmy && 'ring-2 ring-offset-2 ring-offset-slate-900', isInArmy && colors.ring)}>
                  <div
                    data-testid={`unit-card-${unit.data.id}`}
                    className={clsx(
                      'relative group transition-all duration-300',
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

                      {/* Info button - top left */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnitClick(unit);
                        }}
                        className="absolute top-2 left-2 p-1.5 rounded-sm font-mono text-xs bg-slate-900/90 backdrop-blur-sm border hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center md:min-w-0 md:min-h-0 z-10"
                        aria-label="Подробнее"
                      >
                        <BookOpen className={clsx('w-4 h-4', affordable ? colors.text : 'text-slate-500')} />
                      </button>

                      {/* Holographic overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-2">
                      {/* Name row */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0 flex items-center gap-1">
                          <h3 className={clsx(
                            'font-bold text-sm font-mono tracking-wide truncate flex-1 min-w-0',
                            affordable ? colors.text : 'text-slate-500'
                          )} title={squad.name}>
                            {squad.name.toUpperCase()}
                          </h3>
                          {allyFactionId && (
                            <span
                              className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded flex-shrink-0"
                              style={{ backgroundColor: getFactionColors(allyFactionId).primary + '33' }}
                              title={`Союзник: ${factionDisplayNames[allyFactionId] ?? allyFactionId}`}
                            >
                              <FactionLogo faction={allyFactionId} className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        {/* Cost badge - absolutely positioned top-right */}
                        <div className="flex-shrink-0">
                          <span className={clsx(
                            'px-2 py-0.5 rounded-md font-mono font-bold text-sm',
                            affordable ? colors.bgSolid.replace('bg-', 'bg-') + '/20 ' + colors.border : 'bg-slate-700/30 border-slate-600',
                            affordable ? colors.text : 'text-slate-500'
                          )}>
                            {squad.cost}
                          </span>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-700/30">ОТРЯД</span>
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
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-xs font-bold z-10">
                      ×{count}
                    </span>
                  )}

                  {/* Remove button */}
                  {count > 0 && instance && (
                    <button
                      onClick={() => onRemoveUnit(instance.instanceId)}
                      className="absolute top-2 right-10 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center z-10"
                      aria-label="Удалить из армии"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unit details sheet (lean, stats-first) */}
      {selectedUnit && (
        <UnitDetailSheet
          unit={selectedUnit.data}
          type={selectedUnit.type}
          sourceId={sourceId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={() => {
            handleAddUnit(selectedUnit);
            setIsModalOpen(false);
          }}
        />
      )}

      {/* FloatingContinueButton - show when army has units */}
      {army.length > 0 && (
        <FloatingContinueButton
          text="НАЧАТЬ БОЙ"
          tooltip="Начать бой"
          accentColor={getFactionColors(selectedFaction || '').primary}
          onClick={onToBattle}
          dataTestid="to-battle-button"
          icon={<Sword className="w-4 h-4" />}
        />
      )}
    </div>
  );
}
