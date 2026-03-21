/**
 * Units list component - shows squads and machines for a faction
 * Styled with battle card aesthetics
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { CustomSource, CustomSquad, CustomMachine, CustomFaction } from '@/lib/editor/types';
import { getSource } from '@/lib/sources-registry';
import { Users, Truck, Edit, Copy, Lock, Eye, EyeOff, RotateCw, Trash2, Undo } from 'lucide-react';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { MY_UNITS_ID } from './FactionsList';

interface UnitsListProps {
  source: CustomSource;
  baseSourceId: string | null;
  factionId: string;
  factions?: CustomFaction[];
  onSelectUnit: (unitId: string, type: 'squad' | 'machine') => void;
  onCloneUnit: (unitId: string, type: 'squad' | 'machine') => void;
  onOverrideUnit: (unitId: string, type: 'squad' | 'machine', unitData: CustomSquad | CustomMachine) => void;
  onHideUnit: (unitId: string) => void;
  onRestoreUnit: (unitId: string) => void;
  onCreateSquad: () => void;
  onCreateMachine: () => void;
}

const STORAGE_KEY = LOCAL_STORAGE_KEYS.EDITOR_SHOW_BASE_UNITS;

// Get faction styling
function getFactionStyle(factionId: string) {
  const styles: Record<string, { border: string; glow: string; bg: string; text: string; corner: string; badge: string }> = {
    polaris: {
      border: 'border-red-600/30',
      glow: 'shadow-red-900/20',
      bg: 'bg-red-950/20',
      text: 'text-red-400',
      corner: 'rgba(220, 38, 38, 0.6)',
      badge: 'bg-red-950/90 text-red-400 border-red-600/40',
    },
    protectorate: {
      border: 'border-cyan-600/30',
      glow: 'shadow-cyan-900/20',
      bg: 'bg-cyan-950/20',
      text: 'text-cyan-400',
      corner: 'rgba(8, 145, 178, 0.6)',
      badge: 'bg-cyan-950/90 text-cyan-400 border-cyan-600/40',
    },
    mercenaries: {
      border: 'border-yellow-600/30',
      glow: 'shadow-yellow-900/20',
      bg: 'bg-yellow-950/20',
      text: 'text-yellow-400',
      corner: 'rgba(202, 138, 4, 0.6)',
      badge: 'bg-yellow-950/90 text-yellow-400 border-yellow-600/40',
    },
  };
  return styles[factionId] || styles.mercenaries;
}

export function UnitsList({
  source,
  baseSourceId,
  factionId,
  onSelectUnit,
  onCloneUnit,
  onOverrideUnit,
  onHideUnit,
  onRestoreUnit,
  onCreateSquad,
  onCreateMachine,
  factions = [],
}: UnitsListProps) {
  const [tab, setTab] = useState<'squad' | 'machine'>('squad');

  // Create faction lookup for MY_UNITS view
  const factionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    factions.forEach(f => map.set(f.id, f.name));
    return map;
  }, [factions]);
  const [showBaseUnits, setShowBaseUnits] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== 'false';
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(showBaseUnits));
  }, [showBaseUnits]);

  // Hidden units set for quick lookup
  const hiddenUnitsSet = useMemo(() => new Set(source.hiddenUnits || []), [source.hiddenUnits]);

  // Check if MY_UNITS view is active
  const isMyUnitsView = factionId === MY_UNITS_ID;

  // Get all squads: custom + base source squads for this faction
  const { customSquads, baseSquads, hiddenSquads, overriddenSquadIds } = useMemo(() => {
    // For MY_UNITS view: show ALL custom squads and ALL hidden base squads
    if (isMyUnitsView) {
      const custom = source.squads;

      let hidden: CustomSquad[] = [];
      let allBaseIds = new Set<string>();

      if (baseSourceId) {
        const baseData = getSource(baseSourceId);
        if (baseData) {
          allBaseIds = new Set(baseData.squads.map(s => s.id));
          hidden = baseData.squads.filter(s => hiddenUnitsSet.has(s.id));
        }
      }

      const overriddenIds = custom.filter(s => allBaseIds.has(s.id)).map(s => s.id);

      return {
        customSquads: custom,
        baseSquads: [],
        hiddenSquads: hidden,
        overriddenSquadIds: new Set(overriddenIds)
      };
    }

    // Normal faction view
    const custom = source.squads.filter(s => s.faction === factionId);
    const customIds = new Set(custom.map(s => s.id));

    let base: CustomSquad[] = [];
    let hidden: CustomSquad[] = [];
    let allBaseIds = new Set<string>();

    if (baseSourceId) {
      const baseData = getSource(baseSourceId);
      if (baseData) {
        const baseFactionSquads = baseData.squads.filter(s => s.faction === factionId);
        allBaseIds = new Set(baseFactionSquads.map(s => s.id));

        // Separate visible and hidden base squads (immutable)
        base = baseFactionSquads.filter(s =>
          !customIds.has(s.id) && !hiddenUnitsSet.has(s.id)
        );
        hidden = baseFactionSquads.filter(s =>
          !customIds.has(s.id) && hiddenUnitsSet.has(s.id)
        );
      }
    }

    // Overridden units: custom units with IDs that exist in base source
    const overriddenIds = custom.filter(s => allBaseIds.has(s.id)).map(s => s.id);

    return { customSquads: custom, baseSquads: base, hiddenSquads: hidden, overriddenSquadIds: new Set(overriddenIds) };
  }, [source, baseSourceId, factionId, hiddenUnitsSet, isMyUnitsView]);

  // Get all machines: custom + base source machines for this faction
  const { customMachines, baseMachines, hiddenMachines, overriddenMachineIds } = useMemo(() => {
    // For MY_UNITS view: show ALL custom machines and ALL hidden base machines
    if (isMyUnitsView) {
      const custom = source.machines;

      let hidden: CustomMachine[] = [];
      let allBaseIds = new Set<string>();

      if (baseSourceId) {
        const baseData = getSource(baseSourceId);
        if (baseData) {
          allBaseIds = new Set(baseData.machines.map(m => m.id));
          hidden = baseData.machines.filter(m => hiddenUnitsSet.has(m.id));
        }
      }

      const overriddenIds = custom.filter(m => allBaseIds.has(m.id)).map(m => m.id);

      return {
        customMachines: custom,
        baseMachines: [],
        hiddenMachines: hidden,
        overriddenMachineIds: new Set(overriddenIds)
      };
    }

    // Normal faction view
    const custom = source.machines.filter(m => m.faction === factionId);
    const customIds = new Set(custom.map(m => m.id));

    let base: CustomMachine[] = [];
    let hidden: CustomMachine[] = [];
    let allBaseIds = new Set<string>();

    if (baseSourceId) {
      const baseData = getSource(baseSourceId);
      if (baseData) {
        const baseFactionMachines = baseData.machines.filter(m => m.faction === factionId);
        allBaseIds = new Set(baseFactionMachines.map(m => m.id));

        // Separate visible and hidden base machines (immutable)
        base = baseFactionMachines.filter(m =>
          !customIds.has(m.id) && !hiddenUnitsSet.has(m.id)
        );
        hidden = baseFactionMachines.filter(m =>
          !customIds.has(m.id) && hiddenUnitsSet.has(m.id)
        );
      }
    }

    // Overridden units: custom units with IDs that exist in base source
    const overriddenIds = custom.filter(m => allBaseIds.has(m.id)).map(m => m.id);

    return { customMachines: custom, baseMachines: base, hiddenMachines: hidden, overriddenMachineIds: new Set(overriddenIds) };
  }, [source, baseSourceId, factionId, hiddenUnitsSet, isMyUnitsView]);

  // Filtered lists based on showBaseUnits toggle (includes hidden units at the end)
  // For MY_UNITS view: always show custom + hidden (no base units)
  const displaySquads = isMyUnitsView
    ? [...customSquads, ...hiddenSquads]
    : showBaseUnits ? [...customSquads, ...baseSquads, ...hiddenSquads] : customSquads;
  const displayMachines = isMyUnitsView
    ? [...customMachines, ...hiddenMachines]
    : showBaseUnits ? [...customMachines, ...baseMachines, ...hiddenMachines] : customMachines;

  const hasBaseUnits = baseSquads.length > 0 || baseMachines.length > 0;
  const hasHiddenUnits = hiddenSquads.length > 0 || hiddenMachines.length > 0;

  const handleUnitClick = (unitId: string, type: 'squad' | 'machine') => {
    const isCustom = type === 'squad'
      ? customSquads.some(s => s.id === unitId)
      : customMachines.some(m => m.id === unitId);

    if (isCustom) {
      onSelectUnit(unitId, type);
    } else {
      // Base unit - trigger override
      const unit = type === 'squad'
        ? baseSquads.find(s => s.id === unitId)
        : baseMachines.find(m => m.id === unitId);

      if (unit) {
        onOverrideUnit(unitId, type, unit);
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
          {isMyUnitsView ? 'ИЗМЕНЕНИЯ' : 'Юниты'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateSquad}
            disabled={isMyUnitsView}
            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Создать отряд"
          >
            <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={onCreateMachine}
            disabled={isMyUnitsView}
            className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Создать технику"
          >
            <Truck className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Show base units toggle - hide in MY_UNITS view */}
      {!isMyUnitsView && (hasBaseUnits || hasHiddenUnits) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/30 bg-slate-800/30">
          <span className="text-xs text-slate-400">Юниты из базы</span>
          <button
            onClick={() => setShowBaseUnits(!showBaseUnits)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all
              ${showBaseUnits ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-500'}
            `}
          >
            {showBaseUnits ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Показаны</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Скрыты</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setTab('squad')}
          className={`
            flex-1 px-4 py-3 text-sm font-semibold transition-all relative
            ${tab === 'squad'
              ? 'text-white border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            <span>Отряды</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${tab === 'squad' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
              {displaySquads.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setTab('machine')}
          className={`
            flex-1 px-4 py-3 text-sm font-semibold transition-all relative
            ${tab === 'machine'
              ? 'text-white border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Truck className="w-4 h-4" />
            <span>Техника</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${tab === 'machine' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
              {displayMachines.length}
            </span>
          </div>
        </button>
      </div>

      {/* Units list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {tab === 'squad' ? (
          displaySquads.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-slate-600 text-sm">
                {showBaseUnits ? 'Нет отрядов в этой фракции' : 'Нет собственных отрядов'}
              </div>
            </div>
          ) : (
            <>
              {/* Custom squads */}
              {customSquads.map((squad) => (
                <UnitCard
                  key={squad.id}
                  id={squad.id}
                  name={squad.name}
                  cost={squad.cost}
                  isCustom={true}
                  isOverride={overriddenSquadIds.has(squad.id)}
                  isHidden={false}
                  factionId={squad.faction}
                  showFactionName={isMyUnitsView}
                  factionName={factionNameMap.get(squad.faction)}
                  onSelect={() => onSelectUnit(squad.id, 'squad')}
                />
              ))}
              {/* Base squads */}
              {showBaseUnits && baseSquads.map((squad) => (
                <UnitCard
                  key={squad.id}
                  id={squad.id}
                  name={squad.name}
                  cost={squad.cost}
                  isCustom={false}
                  isOverride={false}
                  isHidden={false}
                  factionId={squad.faction}
                  showFactionName={isMyUnitsView}
                  factionName={factionNameMap.get(squad.faction)}
                  onOverride={() => handleUnitClick(squad.id, 'squad')}
                  onHide={() => onHideUnit(squad.id)}
                  onClone={() => onCloneUnit(squad.id, 'squad')}
                />
              ))}
              {/* Hidden squads */}
              {showBaseUnits && hiddenSquads.map((squad) => (
                <UnitCard
                  key={squad.id}
                  id={squad.id}
                  name={squad.name}
                  cost={squad.cost}
                  isCustom={false}
                  isOverride={false}
                  isHidden={true}
                  factionId={squad.faction}
                  showFactionName={isMyUnitsView}
                  factionName={factionNameMap.get(squad.faction)}
                  onRestore={() => onRestoreUnit(squad.id)}
                  onClone={() => onCloneUnit(squad.id, 'squad')}
                />
              ))}
            </>
          )
        ) : (
          displayMachines.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-slate-600 text-sm">
                {showBaseUnits ? 'Нет техники в этой фракции' : 'Нет собственной техники'}
              </div>
            </div>
          ) : (
            <>
              {/* Custom machines */}
              {customMachines.map((machine) => (
                <UnitCard
                  key={machine.id}
                  id={machine.id}
                  name={machine.name}
                  cost={machine.cost}
                  isCustom={true}
                  isOverride={overriddenMachineIds.has(machine.id)}
                  isHidden={false}
                  factionId={machine.faction}
                  showFactionName={isMyUnitsView}
                  factionName={factionNameMap.get(machine.faction)}
                  onSelect={() => onSelectUnit(machine.id, 'machine')}
                />
              ))}
              {/* Base machines */}
              {showBaseUnits && baseMachines.map((machine) => (
                <UnitCard
                  key={machine.id}
                  id={machine.id}
                  name={machine.name}
                  cost={machine.cost}
                  isCustom={false}
                  isOverride={false}
                  isHidden={false}
                  factionId={machine.faction}
                  showFactionName={isMyUnitsView}
                  factionName={factionNameMap.get(machine.faction)}
                  onOverride={() => handleUnitClick(machine.id, 'machine')}
                  onHide={() => onHideUnit(machine.id)}
                  onClone={() => onCloneUnit(machine.id, 'machine')}
                />
              ))}
              {/* Hidden machines */}
              {showBaseUnits && hiddenMachines.map((machine) => (
                <UnitCard
                  key={machine.id}
                  id={machine.id}
                  name={machine.name}
                  cost={machine.cost}
                  isCustom={false}
                  isOverride={false}
                  isHidden={true}
                  factionId={machine.faction}
                  showFactionName={isMyUnitsView}
                  factionName={factionNameMap.get(machine.faction)}
                  onRestore={() => onRestoreUnit(machine.id)}
                  onClone={() => onCloneUnit(machine.id, 'machine')}
                />
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
}

interface UnitCardProps {
  id: string;
  name: string;
  cost: number;
  isCustom: boolean;
  isOverride: boolean;
  isHidden: boolean;
  factionId: string;
  factionName?: string;
  showFactionName?: boolean;
  onSelect?: () => void;
  onClone?: () => void;
  onOverride?: () => void;
  onHide?: () => void;
  onRestore?: () => void;
}

function UnitCard({
  name,
  cost,
  isCustom,
  isOverride,
  isHidden,
  factionId,
  factionName,
  showFactionName = false,
  onSelect,
  onOverride,
  onHide,
  onRestore,
  onClone,
}: UnitCardProps) {
  const factionStyle = getFactionStyle(factionId);

  return (
    <div
      className={`
        group relative rounded-lg border-2 p-3 transition-all duration-200
        ${isCustom && onSelect && !isHidden ? 'cursor-pointer hover:scale-[1.02]' : ''}
        ${isHidden ? 'opacity-40 line-through' : ''}
        ${isCustom && !isHidden
          ? `${factionStyle.border} ${factionStyle.glow} bg-slate-800`
          : 'bg-slate-800/40 border-slate-700/50'
        }
        ${isOverride && !isHidden ? 'border-orange-500/50 shadow-orange-900/20' : ''}
      `}
      onClick={isCustom && onSelect && !isHidden ? onSelect : undefined}
    >
      {/* Tech corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t opacity-40" style={{ borderColor: factionStyle.corner }} />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t opacity-40" style={{ borderColor: factionStyle.corner }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b opacity-40" style={{ borderColor: factionStyle.corner }} />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b opacity-40" style={{ borderColor: factionStyle.corner }} />

      {/* Override indicator */}
      {isOverride && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-600" />
      )}

      {/* Content */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-1.5">
            {isCustom ? (
              <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${isOverride ? 'bg-orange-950/50 border border-orange-600/30 text-orange-400' : factionStyle.bg + ' border ' + factionStyle.border + ' ' + factionStyle.text} font-medium`}>
                {isOverride ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="uppercase tracking-wider">Переопределён</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="uppercase tracking-wider">Ваш</span>
                  </>
                )}
              </div>
            ) : isHidden ? (
              <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-950/30 border border-red-600/20 text-red-400/50 font-medium">
                <EyeOff className="w-3 h-3" />
                <span className="uppercase tracking-wider">Скрыт</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30 text-slate-400 font-medium">
                <Lock className="w-3 h-3" />
                <span className="uppercase tracking-wider">База</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div className={`font-bold text-sm ${isHidden ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
            {name}
          </div>

          {/* Faction name (shown in MY_UNITS view) */}
          {showFactionName && factionName && (
            <div className={`text-[10px] ${isHidden ? 'text-slate-600' : 'text-slate-500'} uppercase tracking-wider`}>
              {factionName}
            </div>
          )}

          {/* Cost */}
          <div className={`text-xs font-mono ${isHidden ? 'text-slate-600' : 'text-slate-500'}`}>
            {cost} очков
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {isCustom && onSelect && !isHidden ? (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className="p-2 rounded-lg hover:bg-emerald-900/30"
                title="Редактировать"
              >
                <Edit className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          ) : isHidden ? (
            <>
              {onRestore && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRestore(); }}
                  className="p-2 rounded-lg hover:bg-green-900/30 transition-all"
                  title="Восстановить"
                >
                  <Undo className="w-4 h-4 text-green-400" />
                </button>
              )}
              {onClone && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClone(); }}
                  className="p-2 rounded-lg hover:bg-blue-900/30 transition-all"
                  title="Клонировать"
                >
                  <Copy className="w-4 h-4 text-blue-400" />
                </button>
              )}
            </>
          ) : (
            <>
              {onOverride && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOverride(); }}
                  className="p-2 rounded-lg hover:bg-orange-900/30 transition-all"
                  title="Переопределить"
                >
                  <RotateCw className="w-4 h-4 text-orange-400" />
                </button>
              )}
              {onHide && (
                <button
                  onClick={(e) => { e.stopPropagation(); onHide(); }}
                  className="p-2 rounded-lg hover:bg-red-900/30 transition-all"
                  title="Скрыть"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              )}
              {onClone && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClone(); }}
                  className="p-2 rounded-lg hover:bg-blue-900/30 transition-all"
                  title="Клонировать"
                >
                  <Copy className="w-4 h-4 text-blue-400" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hover glow */}
      {!isHidden && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      )}
    </div>
  );
}
