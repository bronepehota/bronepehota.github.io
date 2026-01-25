'use client';

import React, { useState, useMemo } from 'react';
import { GitHubPagesImage as Image } from './GitHubPagesImage';
import type { Faction, Squad, Machine, ArmyUnit, FactionID } from '@/lib/types';
import { Check, X, Plus, ArrowLeft, Users, Zap, Shield } from 'lucide-react';
import { UnitDetailsModal } from './UnitDetailsModal';
import { WeaponSelectorModal } from './WeaponSelectorModal';
import { countByUnitType } from '@/lib/unit-utils';
import MachineCard from './machine/MachineCard';
import MachineBlueprintModal from './machine/MachineBlueprintModal';
import TechGridBackground from './machine/TechGridBackground';
import { clsx } from 'clsx';

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
}: UnitSelectorProps) {
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

  // Machine blueprint modal state
  const [blueprintMachine, setBlueprintMachine] = useState<Machine | null>(null);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

  // Calculate remaining points
  const totalCost = army.reduce((sum, unit) => {
    return sum + unit.data.cost;
  }, 0);
  const remainingPoints = pointBudget - totalCost;

  // Filter units by selected faction
  const availableSquads = squads.filter(s => s.faction === selectedFaction);
  const availableMachines = machines.filter(m => m.faction === selectedFaction);

  // Combine all available units
  const availableUnits: UnitDisplay[] = [
    ...availableSquads.map(s => ({ type: 'squad' as const, data: s })),
    ...availableMachines.map(m => ({ type: 'machine' as const, data: m })),
  ];

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

  // Get unit type badge
  const getUnitTypeBadge = (type: 'squad' | 'machine') => {
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

  // Faction color system for squad cards
  const getFactionColors = (factionId: FactionID) => {
    const colorMap = {
      polaris: {
        border: 'border-red-500/50 hover:border-red-500',
        bg: 'hover:bg-red-500/10',
        accent: 'text-red-400',
        glow: 'shadow-red-500/20',
        corner: 'border-red-500',
        disabled: 'border-slate-700 text-slate-500'
      },
      protectorate: {
        border: 'border-cyan-500/50 hover:border-cyan-500',
        bg: 'hover:bg-cyan-500/10',
        accent: 'text-cyan-400',
        glow: 'shadow-cyan-500/20',
        corner: 'border-cyan-500',
        disabled: 'border-slate-700 text-slate-500'
      },
      mercenaries: {
        border: 'border-yellow-500/50 hover:border-yellow-500',
        bg: 'hover:bg-yellow-500/10',
        accent: 'text-yellow-400',
        glow: 'shadow-yellow-500/20',
        corner: 'border-yellow-500',
        disabled: 'border-slate-700 text-slate-500'
      }
    };
    return colorMap[factionId] || colorMap.polaris;
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
      {/* Back to faction select button */}
      <div className="flex gap-3 mb-6">
        {onBackToFactionSelect && (
          <button
            data-testid="back-to-faction-button"
            onClick={onBackToFactionSelect}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Назад к фракции</span>
            <span className="sm:hidden">Назад</span>
          </button>
        )}
      </div>

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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          <h3 className="text-xl font-mono font-bold text-slate-200 tracking-wider">ДОСТУПНЫЕ ЮНИТЫ</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableUnits.map((unit) => {
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
                      setBlueprintMachine(machine);
                      setIsBlueprintOpen(true);
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
            const colors = getFactionColors(selectedFaction);

            return (
              <div key={unit.data.id} className="relative">
                <div
                  onClick={() => handleUnitClick(unit)}
                  data-testid={`unit-card-${unit.data.id}`}
                  className={clsx(
                    'relative group cursor-pointer transition-all duration-300',
                    'border bg-slate-800/80 backdrop-blur-sm overflow-hidden',
                    affordable ? colors.border : colors.disabled,
                    affordable ? colors.bg : ''
                  )}
                >
                  {/* Corner accents */}
                  <div className={clsx(
                    'absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2',
                    'transition-all duration-300',
                    affordable ? colors.corner : 'border-slate-700'
                  )} />
                  <div className={clsx(
                    'absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2',
                    'transition-all duration-300',
                    affordable ? colors.corner : 'border-slate-700'
                  )} />
                  <div className={clsx(
                    'absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2',
                    'transition-all duration-300',
                    affordable ? colors.corner : 'border-slate-700'
                  )} />
                  <div className={clsx(
                    'absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2',
                    'transition-all duration-300',
                    affordable ? colors.corner : 'border-slate-700'
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
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Users className={clsx('w-16 h-16 opacity-20', affordable ? colors.accent : 'text-slate-600')} />
                      </div>
                    )}

                    {/* Rank badge */}
                    <div className={clsx(
                      'absolute top-2 right-2 px-2 py-0.5 rounded-sm font-mono text-xs font-bold',
                      'bg-slate-900/90 backdrop-blur-sm border',
                      affordable ? colors.border : 'border-slate-700',
                      affordable ? colors.accent : 'text-slate-500'
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
                          affordable ? colors.accent : 'text-slate-500'
                        )}>
                          {squad.shortName || squad.name.toUpperCase()}
                        </h3>
                        <p className="text-[10px] text-slate-500 truncate font-mono">
                          ОТРЯД
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={clsx('font-mono font-bold text-sm', affordable ? colors.accent : 'text-slate-500')}>
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
                      <div className={clsx('ml-auto', affordable ? colors.accent : 'text-slate-600')}>
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
                        affordable ? colors.border : 'border-slate-700',
                        affordable ? colors.bg : '',
                        affordable ? colors.accent : 'text-slate-500',
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
      </div>

      {/* Selected army */}
      {army.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
            <h3 className="text-xl font-mono font-bold text-green-400 tracking-wider">ВАША АРМИЯ ({army.length})</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {army.map((unit) => {
              const typeBadge = getUnitTypeBadge(unit.type);
              const TypeIcon = typeBadge.icon;

              return (
                <div
                  key={unit.instanceId}
                  data-testid={`army-unit-${unit.instanceId}`}
                  className={clsx(
                    'relative group cursor-pointer transition-all duration-300',
                    'border bg-slate-800/80 backdrop-blur-sm overflow-hidden',
                    'border-green-500/50 hover:border-green-500',
                    'hover:bg-green-500/10'
                  )}
                >
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-green-500 transition-all duration-300" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-green-500 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-green-500 transition-all duration-300" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-green-500 transition-all duration-300" />

                  {/* Image container */}
                  {unit.data.image && (
                    <div className="relative aspect-[4/3] bg-slate-900/50 overflow-hidden">
                      <Image
                        src={unit.data.image}
                        alt={unit.data.name}
                        fill
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        unoptimized
                      />
                      {/* Holographic overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-sm rounded-full p-1.5 border border-slate-600">
                    <TypeIcon className={clsx('w-4 h-4', typeBadge.color)} />
                  </div>

                  {/* Remove button in top-right */}
                  <button
                    onClick={() => onRemoveUnit(unit.instanceId)}
                    data-testid={`remove-unit-${unit.instanceId}`}
                    aria-label={`Удалить ${unit.data.name}`}
                    className="absolute top-2 right-2 p-1.5 bg-red-900/80 hover:bg-red-800 rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation transition-colors border border-red-700"
                  >
                    <X size={16} className="text-red-400" />
                  </button>

                  {/* Content */}
                  <div className="p-3 space-y-2">
                    {/* Name and cost */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-mono font-bold text-sm tracking-wide truncate text-green-400">
                          {unit.data.shortName || unit.data.name.toUpperCase()}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate font-mono">
                          {unit.type === 'machine' ? 'МАШИНА' : 'ОТРЯД'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-green-400">
                          {unit.data.cost}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-mono">очков</span>
                      </div>
                    </div>

                    {/* Squad stats */}
                    {unit.type === 'squad' && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{(unit.data as Squad).soldiers.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>Бр {getSquadArmorRange(unit.data as Squad)}</span>
                        </div>
                      </div>
                    )}

                    {/* Machine stats */}
                    {unit.type === 'machine' && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>Прч {(unit.data as Machine).durability_max}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>Скор {(unit.data as Machine).speed_sectors[0]?.speed || 0}</span>
                        </div>
                      </div>
                    )}

                    {/* Color indicator bar */}
                    <div className="h-0.5 rounded-full bg-green-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* To Battle button */}
      {army.length > 0 && (
        <div className="pt-4">
          <button
            onClick={onToBattle}
            data-testid="to-battle-button"
            className={clsx(
              'w-full py-3 flex items-center justify-center gap-2',
              'border font-mono text-sm font-bold uppercase tracking-wider',
              'transition-all duration-200 min-h-[48px]',
              'border-green-500 bg-green-500/10 text-green-400',
              'hover:bg-green-500/20 hover:scale-102',
              'active:scale-95'
            )}
          >
            В БОЙ
            <Check className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Unit details modal */}
      {selectedUnit && faction && (
        <UnitDetailsModal
          unit={selectedUnit.data}
          unitType={selectedUnit.type}
          faction={faction}
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

      {/* Machine blueprint modal */}
      {blueprintMachine && (
        <MachineBlueprintModal
          machine={blueprintMachine}
          isOpen={isBlueprintOpen}
          onClose={() => {
            setIsBlueprintOpen(false);
            setBlueprintMachine(null);
          }}
          onAdd={(machine) => {
            if (onAddMachine) {
              onAddMachine(machine);
            }
            setIsBlueprintOpen(false);
            setBlueprintMachine(null);
          }}
        />
      )}

      {/* Tech grid background */}
      <TechGridBackground />
    </div>
  );
}
