'use client';

import { CombatActionType } from '@/lib/combat-types';
import { ArmyUnit, Squad } from '@/lib/types';
import { Target, Sword, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionSelectorProps {
  onSelect: (action: CombatActionType) => void;
  grenadesAvailable?: boolean;
  className?: string;
  unit?: ArmyUnit;
  soldierIndex?: number | null;
}

// Color scheme for action types
const getActionStyle = (actionType: CombatActionType) => {
  const styles = {
    shot: {
      primary: 'text-amber-400',
      border: 'border-amber-600/50',
      bg: 'bg-amber-950/30',
      hover: 'hover:bg-amber-950/50 hover:border-amber-500/60',
      shadow: 'shadow-amber-900/20',
    },
    melee: {
      primary: 'text-red-400',
      border: 'border-red-600/50',
      bg: 'bg-red-950/30',
      hover: 'hover:bg-red-950/50 hover:border-red-500/60',
      shadow: 'shadow-red-900/20',
    },
    grenade: {
      primary: 'text-emerald-400',
      border: 'border-emerald-600/50',
      bg: 'bg-emerald-950/30',
      hover: 'hover:bg-emerald-950/50 hover:border-emerald-500/60',
      shadow: 'shadow-emerald-900/20',
    },
    ram: {
      primary: 'text-orange-400',
      border: 'border-orange-600/50',
      bg: 'bg-orange-950/30',
      hover: 'hover:bg-orange-950/50 hover:border-orange-500/60',
      shadow: 'shadow-orange-900/20',
    },
  };
  return styles[actionType];
};

// Check if soldier has shot capability
const canSoldierShoot = (unit?: ArmyUnit, soldierIndex?: number | null): boolean => {
  if (!unit || soldierIndex === null || soldierIndex === undefined) {
    return true; // For machines, always allow
  }
  if (unit.type !== 'squad') {
    return true; // For machines, always allow
  }

  const squad = unit.data as Squad;
  const soldier = squad.soldiers[soldierIndex];

  // Soldier can shoot if they have range and it's not '0' or 'ББ' (melee only)
  const range = soldier.range;
  return Boolean(range && range !== '0' && range !== 'ББ');
};

// Check if soldier has melee capability
const canSoldierMelee = (unit?: ArmyUnit, soldierIndex?: number | null): boolean => {
  if (!unit || soldierIndex === null || soldierIndex === undefined) {
    return true; // For machines, always allow
  }
  if (unit.type !== 'squad') {
    return true; // For machines, always allow
  }

  // Squads can always melee - melee stat is just a bonus
  return true;
};

export function ActionSelector({
  onSelect,
  grenadesAvailable = true,
  className,
  unit,
  soldierIndex,
}: ActionSelectorProps) {
  // Calculator mode (combatantData, no unit): always show all actions
  const canShoot = unit
    ? canSoldierShoot(unit, soldierIndex)
    : true;
  const canMelee = canSoldierMelee(unit, soldierIndex);

  const actions: Array<{
    type: CombatActionType;
    label: string;
    description: string;
    icon: React.ReactNode;
    disabled?: boolean;
    hidden?: boolean;
  }> = [
    {
      type: 'shot',
      label: 'ВЫСТРЕЛ',
      description: 'Дистанция • Броня • Укрытие',
      icon: <Target className="w-6 h-6" />,
      disabled: !canShoot,
      hidden: !canShoot, // Hide completely if cannot shoot
    },
    {
      type: 'melee',
      label: 'БЛИЖНИЙ БОЙ',
      description: 'Кубики против кубиков',
      icon: <Sword className="w-6 h-6" />,
      disabled: !canMelee,
      hidden: !canMelee, // Hide completely if cannot melee
    },
    {
      type: 'grenade',
      label: 'ГРАНАТА',
      description: '1D20 на площадь • D6 дистанция',
      icon: <Bomb className="w-6 h-6" />,
      disabled: !grenadesAvailable,
    },
  ];

  // Filter out hidden actions
  const visibleActions = actions.filter(a => !a.hidden);

  // If only one action is available, auto-select it
  if (visibleActions.length === 1 && !visibleActions[0].disabled) {
    onSelect(visibleActions[0].type);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* If only one action, show brief message */}
      {visibleActions.length === 1 ? (
        <div className="text-center py-4">
          <div className={cn(
            "text-sm font-mono uppercase tracking-wider mb-2",
            getActionStyle(visibleActions[0].type).primary
          )}>
            {visibleActions[0].label}
          </div>
          <div className="text-xs text-slate-500">
            Выполняется...
          </div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="space-y-2">
          {visibleActions.map((action) => {
            const style = getActionStyle(action.type);
            const disabled = action.disabled;

            return (
              <button
                key={action.type}
                onClick={() => onSelect(action.type)}
                disabled={disabled}
                className={cn(
                  "relative w-full overflow-hidden group",
                  "transition-all duration-200 ease-out",
                  "active:scale-[0.98]",
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:scale-[1.01]"
                )}
              >
                <div className={cn(
                  "relative p-2 md:p-3 rounded-lg border-2",
                  "bg-slate-900/80 backdrop-blur-sm",
                  disabled
                    ? "border-slate-700/50"
                    : `${style.border} ${style.hover}`,
                  !disabled && style.shadow,
                  "shadow-md transition-all duration-200",
                )}>
                  {/* Content */}
                  <div className="relative flex items-center gap-2 md:gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "relative p-1.5 md:p-2 rounded-lg border shrink-0",
                      disabled
                        ? "bg-slate-800/50 border-slate-700"
                        : `${style.bg} ${style.border}`
                    )}>
                      <div className={cn(
                        disabled ? "text-slate-600" : style.primary,
                        !disabled && "group-hover:scale-110 transition-transform duration-200"
                      )}>
                        {action.icon}
                      </div>
                    </div>

                    {/* Text content */}
                    <div className="text-left flex-1 min-w-0">
                      <div className={cn(
                        "font-mono font-black text-sm md:text-base uppercase tracking-wider",
                        disabled ? "text-slate-600" : style.primary
                      )}>
                        {action.label}
                      </div>
                      <div className="text-[10px] md:text-xs text-slate-500 mt-0.5 font-mono uppercase tracking-wider truncate">
                        {action.description}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    {!disabled && (
                      <div className="text-slate-700 group-hover:text-slate-500 transition-all font-mono text-base md:text-lg duration-200">
                        →
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
