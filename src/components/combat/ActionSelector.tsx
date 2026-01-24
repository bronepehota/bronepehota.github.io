'use client';

import { CombatActionType } from '@/lib/combat-types';
import { Target, Sword, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionSelectorProps {
  onSelect: (action: CombatActionType) => void;
  grenadesAvailable?: boolean;
  className?: string;
}

export function ActionSelector({ onSelect, grenadesAvailable = true, className }: ActionSelectorProps) {
  const actions: Array<{
    type: CombatActionType;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    border: string;
    bg: string;
    accent: string;
    disabled?: boolean;
  }> = [
    {
      type: 'shot',
      label: 'ВЫСТРЕЛ',
      description: 'Дистанция, броня, укрытие',
      icon: <Target className="w-6 h-6" />,
      color: 'text-orange-400',
      border: 'border-orange-500/50 hover:border-orange-500',
      bg: 'hover:bg-orange-500/10',
      accent: 'border-orange-500',
    },
    {
      type: 'melee',
      label: 'БЛИЖНИЙ БОЙ',
      description: 'Кубики против кубиков',
      icon: <Sword className="w-6 h-6" />,
      color: 'text-red-400',
      border: 'border-red-500/50 hover:border-red-500',
      bg: 'hover:bg-red-500/10',
      accent: 'border-red-500',
    },
    {
      type: 'grenade',
      label: 'ГРАНАТА',
      description: '1D20 на площадь, D6 дистанция',
      icon: <Bomb className="w-6 h-6" />,
      color: 'text-green-400',
      border: 'border-green-500/50 hover:border-green-500',
      bg: 'hover:bg-green-500/10',
      accent: 'border-green-500',
      disabled: !grenadesAvailable,
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
        <span className="text-sm font-mono font-bold text-slate-400 tracking-wider">ВЫБЕРИТЕ ДЕЙСТВИЕ</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
      </div>

      {actions.map((action) => (
        <button
          key={action.type}
          onClick={() => onSelect(action.type)}
          disabled={action.disabled}
          className={cn(
            "relative w-full p-4 min-h-[64px] bg-slate-800/80 backdrop-blur-sm border-2 rounded-xl overflow-hidden",
            "flex items-center gap-4 transition-all group active:scale-[0.98]",
            "touch-manipulation",
            action.disabled ? "border-slate-700 opacity-50 cursor-not-allowed" : action.border,
            !action.disabled && action.bg
          )}
        >
          {/* Corner accents */}
          {!action.disabled && (
            <>
              <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", action.accent)} />
              <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", action.accent)} />
              <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", action.accent)} />
              <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", action.accent)} />
            </>
          )}

          {/* Icon */}
          <div className={cn(
            "p-3 rounded-xl border-2 relative shrink-0",
            action.disabled ? "bg-slate-700/50 border-slate-600" : `${action.color}/20 ${action.accent}/50`
          )}>
            <div className={cn(action.disabled ? "text-slate-500" : action.color)}>
              {action.icon}
            </div>
          </div>

          {/* Text content */}
          <div className="text-left flex-1">
            <div className={cn("font-mono font-bold text-base uppercase tracking-wider", action.disabled ? "text-slate-500" : action.color)}>
              {action.disabled ? 'ГРАНАТЫ НЕТ' : action.label}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
              {action.description}
            </div>
          </div>

          {/* Arrow indicator */}
          {!action.disabled && (
            <div className={cn("text-slate-600 group-hover:text-slate-400 transition-colors", action.color)}>
              →
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
