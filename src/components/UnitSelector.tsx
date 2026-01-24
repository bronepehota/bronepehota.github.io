'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Faction, Squad, Machine, ArmyUnit, FactionID } from '@/lib/types';
import { Check, X, Plus, ArrowLeft, Info, RotateCcw, Users, Zap, Shield, Star } from 'lucide-react';
import { UnitDetailsModal } from './UnitDetailsModal';
import { WeaponSelectorModal } from './WeaponSelectorModal';
import { countByUnitType } from '@/lib/unit-utils';
import MachineCard from './machine/MachineCard';
import MachineBlueprintModal from './machine/MachineBlueprintModal';
import TechGridBackground from './machine/TechGridBackground';

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
  onResetFully?: () => void;
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
  onResetFully,
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

  // Get unit description/role
  const getUnitRole = (unit: UnitDisplay): string => {
    if (unit.type === 'squad') {
      const squad = unit.data as Squad;
      const soldierCount = squad.soldiers.length;
      return `${soldierCount} бойцов`;
    }
    const machine = unit.data as Machine;
    const weaponCount = machine.weapons.length;
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
    <div className="space-y-6">
      {/* Back to faction select button */}
      <div className="flex gap-3 mb-6">
        {onBackToFactionSelect && (
          <button
            onClick={onBackToFactionSelect}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Назад к фракции</span>
            <span className="sm:hidden">Назад</span>
          </button>
        )}
        {onResetFully && (
          <button
            onClick={onResetFully}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Начать игру заново с выбора фракции"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Начать заново</span>
            <span className="sm:hidden">Заново</span>
          </button>
        )}
      </div>

      {/* Warning toast */}
      {showWarning && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg text-yellow-200"
        >
          Недостаточно очков
        </div>
      )}

      {/* Available units */}
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-slate-200">Доступные юниты</h3>
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
                    onAdd={(machine) => handleAddUnit(unit)}
                    onViewDetails={(machine) => {
                      setBlueprintMachine(machine);
                      setIsBlueprintOpen(true);
                    }}
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

            // Render squads with existing card format
            const typeBadge = getUnitTypeBadge(unit.type);
            const TypeIcon = typeBadge.icon;
            const squad = unit.data as Squad;

            return (
              <div
                key={unit.data.id}
                onClick={() => handleUnitClick(unit)}
                className={`
                  relative group cursor-pointer transition-all duration-300
                  border bg-slate-800/80 backdrop-blur-sm overflow-hidden
                  min-h-[120px] min-w-[44px] touch-manipulation
                  ${affordable ? 'hover:scale-102' : ''}
                  active:scale-95
                `}
                style={{
                  borderColor: affordable && faction ? faction.color : '#334155',
                  ...(affordable && faction && {
                    boxShadow: `0 0 10px ${faction.color}40`
                  })
                }}
              >
                {/* Corner accents for selected faction */}
                {affordable && faction && (
                  <>
                    <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2" style={{ borderColor: faction.color }} />
                    <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2" style={{ borderColor: faction.color }} />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2" style={{ borderColor: faction.color }} />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2" style={{ borderColor: faction.color }} />
                  </>
                )}

                {/* Unit image */}
                {unit.data.image && (
                  <Image
                    src={unit.data.image}
                    alt={unit.data.name}
                    width={200}
                    height={120}
                    className="w-full h-[120px] object-cover mb-3 min-w-[120px]"
                    loading="lazy"
                    unoptimized
                  />
                )}

                {/* Rank badge */}
                <div className="absolute top-2 right-2 bg-slate-700/80 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] font-mono font-bold text-yellow-400">
                    R{getSquadMaxRank(squad)}
                  </span>
                </div>

                {/* Type badge */}
                <div className="absolute top-2 left-2 bg-slate-700/80 backdrop-blur-sm rounded-full p-1.5">
                  <TypeIcon className={`w-4 h-4 ${typeBadge.color}`} />
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  {/* Header: Name + Cost */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-mono font-bold text-sm tracking-wide truncate" style={{ color: affordable && faction ? faction.color : '#94a3b8' }}>
                      {unit.data.name.toUpperCase()}
                    </h4>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-bold text-sm" style={{ color: affordable ? '#22c55e' : '#ef4444' }}>
                        {unit.data.cost}
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
                  </div>

                  {/* Color indicator bar */}
                  {faction && (
                    <div className="h-0.5 rounded-full" style={{ backgroundColor: faction.color }}></div>
                  )}
                </div>

                {/* Add button - stopPropagation to prevent opening modal when clicking add */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddUnit(unit);
                  }}
                  disabled={!affordable}
                  aria-disabled={!affordable}
                  aria-label={`Добавить ${unit.data.name}`}
                  className={`
                    w-full py-2 flex items-center justify-center gap-2
                    border font-mono text-xs font-bold uppercase tracking-wider
                    transition-all duration-200
                    touch-manipulation
                  `}
                  style={{
                    borderColor: affordable && faction ? faction.color : '#475569',
                    color: affordable && faction ? faction.color : '#94a3b8',
                    backgroundColor: affordable && faction ? `${faction.color}10` : 'rgba(51, 65, 85, 0.4)'
                  }}
                >
                  <Plus size={16} />
                  В АРМИЮ
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected army */}
      {army.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-slate-200">Ваша армия ({army.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {army.map((unit) => {
              const typeBadge = getUnitTypeBadge(unit.type);
              const TypeIcon = typeBadge.icon;

              return (
                <div
                  key={unit.instanceId}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    scale-102
                  `}
                  style={{
                    borderColor: '#22c55e', // green-500
                    backgroundColor: 'rgba(34, 197, 94, 0.1)', // green-500/10
                  }}
                >
                  {/* Unit image */}
                  {unit.data.image && (
                    <Image
                      src={unit.data.image}
                      alt={unit.data.name}
                      width={200}
                      height={120}
                      className="w-full h-[120px] object-cover rounded mb-3 min-w-[120px]"
                      loading="lazy"
                      unoptimized
                    />
                  )}

                  {/* Type badge */}
                  <div className="absolute top-2 left-2 bg-slate-700/80 rounded-full p-1.5">
                    <TypeIcon className={`w-4 h-4 ${typeBadge.color}`} />
                  </div>

                  {/* Remove button in top-right */}
                  <button
                    onClick={() => onRemoveUnit(unit.instanceId)}
                    aria-label={`Удалить ${unit.data.name}`}
                    className="absolute top-2 right-2 p-1.5 bg-red-900/80 hover:bg-red-800 rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation transition-colors"
                  >
                    <X size={16} className="text-red-400" />
                  </button>

                  {/* Content - adjusted for image presence */}
                  <div className={unit.data.image ? 'mt-2' : 'mt-6'}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-slate-200">{unit.data.name}</h4>
                        <p className="text-sm text-green-400 font-bold">{unit.data.cost} очков</p>
                      </div>
                    </div>

                    {/* Machine stats */}
                    {unit.type === 'machine' && (
                      <div className="flex gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <span>⚡</span>
                          {(unit.data as Machine).speed_sectors[0]?.speed || 0}-{(unit.data as Machine).speed_sectors[(unit.data as Machine).speed_sectors.length - 1]?.speed || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🛡️</span>
                          {(unit.data as Machine).durability_max}
                        </span>
                      </div>
                    )}

                    {/* Color indicator bar */}
                    <div className="h-1 rounded mt-3" style={{ backgroundColor: '#22c55e' }}></div>
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
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all min-h-[48px]"
          >
            В бой
            <Check className="inline ml-2" size={20} />
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
