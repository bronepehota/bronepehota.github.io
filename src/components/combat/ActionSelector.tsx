'use client';

import { CombatActionType } from '@/lib/combat-types';
import { Target, Sword, Bomb, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionSelectorProps {
  onSelect: (action: CombatActionType) => void;
  grenadesAvailable?: boolean;
  className?: string;
}

// Military tech color scheme for action types
const getActionTechStyle = (actionType: CombatActionType) => {
  const styles = {
    shot: {
      primary: 'text-amber-400',
      border: 'border-amber-600/40',
      borderHover: 'hover:border-amber-500',
      bg: 'bg-amber-950/20',
      bgHover: 'hover:bg-amber-950/40',
      accent: 'border-amber-500',
      glow: 'shadow-amber-900/30',
      scanline: 'from-amber-500/10'
    },
    melee: {
      primary: 'text-red-400',
      border: 'border-red-600/40',
      borderHover: 'hover:border-red-500',
      bg: 'bg-red-950/20',
      bgHover: 'hover:bg-red-950/40',
      accent: 'border-red-500',
      glow: 'shadow-red-900/30',
      scanline: 'from-red-500/10'
    },
    grenade: {
      primary: 'text-emerald-400',
      border: 'border-emerald-600/40',
      borderHover: 'hover:border-emerald-500',
      bg: 'bg-emerald-950/20',
      bgHover: 'hover:bg-emerald-950/40',
      accent: 'border-emerald-500',
      glow: 'shadow-emerald-900/30',
      scanline: 'from-emerald-500/10'
    }
  };
  return styles[actionType];
};

export function ActionSelector({ onSelect, grenadesAvailable = true, className }: ActionSelectorProps) {
  // Static tech hex codes for decoration (stable across renders)
  const actions: Array<{
    type: CombatActionType;
    label: string;
    techLabel: string;
    description: string;
    icon: React.ReactNode;
    techIcon: React.ReactNode;
    disabled?: boolean;
    hexCode?: string;
  }> = [
    {
      type: 'shot',
      label: 'ВЫСТРЕЛ',
      techLabel: 'FIRE CONTROL',
      description: 'Дистанция • Броня • Укрытие',
      icon: <Target className="w-6 h-6" />,
      techIcon: <Crosshair className="w-5 h-5" />,
      hexCode: '0x3F7A',
    },
    {
      type: 'melee',
      label: 'БЛИЖНИЙ БОЙ',
      techLabel: 'CLOSE COMBAT',
      description: 'Кубики против кубиков',
      icon: <Sword className="w-6 h-6" />,
      techIcon: <Sword className="w-5 h-5" />,
      hexCode: '0xC4E2',
    },
    {
      type: 'grenade',
      label: 'ГРАНАТА',
      techLabel: 'ORDNANCE',
      description: '1D20 на площадь • D6 дистанция',
      icon: <Bomb className="w-6 h-6" />,
      techIcon: <Bomb className="w-5 h-5" />,
      disabled: !grenadesAvailable,
      hexCode: '0x8B1F',
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Tech Header */}
      <div className="relative">
        {/* Top tech line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-slate-500" />
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-slate-600" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-slate-600" />

        <div className="flex items-center justify-center gap-3 py-3">
          <div className="h-px w-8 bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-slate-500 rotate-45" />
            <span className="text-xs font-mono font-bold text-slate-400 tracking-[0.2em]">
              WEAPON SYSTEMS
            </span>
            <div className="w-1.5 h-1.5 bg-slate-500 rotate-45" />
          </div>
          <div className="h-px w-8 bg-slate-700" />
        </div>

        {/* Bottom tech line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-px bg-slate-500" />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {actions.map((action, index) => {
          const style = getActionTechStyle(action.type);
          const disabled = action.disabled;

          return (
            <button
              key={action.type}
              onClick={() => onSelect(action.type)}
              disabled={disabled}
              className={cn(
                "relative w-full overflow-hidden group",
                "transition-all duration-300 ease-out",
                "active:scale-[0.98]",
                "touch-manipulation",
                disabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:scale-[1.02]"
              )}
            >
              {/* Hover glow effect - radiates from center */}
              {!disabled && (
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  "bg-gradient-to-r from-transparent via-white/5 to-transparent",
                  "group-hover:animate-pulse"
                )} />
              )}

              {/* Main card */}
              <div className={cn(
                "relative p-4 min-h-[72px] rounded-sm border-2",
                "bg-slate-900/80 backdrop-blur-sm",
                disabled
                  ? "border-slate-700/50"
                  : `${style.border} ${style.borderHover}`,
                !disabled && style.glow,
                "shadow-lg transition-all duration-300",
                !disabled && "group-hover:shadow-2xl"
              )}>
                {/* Tech frame corners with pulsing animation */}
                {!disabled && (
                  <>
                    <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 animate-pulse", style.accent)} />
                    <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 animate-pulse stagger-100", style.accent)} />
                    <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 animate-pulse stagger-200", style.accent)} />
                    <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 animate-pulse stagger-300", style.accent)} />

                    {/* Scanline effect */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-scan-vertical",
                      style.scanline
                    )} />

                    {/* Tech data decoration - hex code */}
                    <div className={cn("absolute bottom-1.5 right-2 text-[7px] font-mono opacity-20", style.primary)}>
                      {action.hexCode}
                    </div>

                    {/* Status indicator dots */}
                    <div className="absolute top-1.5 right-2 flex gap-0.5 opacity-0 group-hover:opacity-40 transition-opacity duration-300">
                      <div className={cn("w-1 h-1 rounded-full animate-pulse", style.primary)} />
                      <div className={cn("w-1 h-1 rounded-full animate-pulse stagger-100", style.primary)} />
                      <div className={cn("w-1 h-1 rounded-full animate-pulse stagger-200", style.primary)} />
                    </div>
                  </>
                )}

                {/* Content */}
                <div className="relative flex items-center gap-4">
                  {/* Tech icon badge with hover animation */}
                  <div className={cn(
                    "relative p-3 rounded-sm border-2 shrink-0 transition-all duration-300",
                    disabled
                      ? "bg-slate-800/50 border-slate-700"
                      : `${style.bg} ${style.accent}/50 group-hover:${style.bg}/60`
                  )}>
                    {/* Tech decoration with animation */}
                    {!disabled && (
                      <>
                        <div className={cn("absolute top-0 left-0 w-1 h-1 bg-current opacity-50 group-hover:opacity-100 transition-opacity", style.primary)} />
                        <div className={cn("absolute top-0 right-0 w-1 h-1 bg-current opacity-50 group-hover:opacity-100 transition-opacity", style.primary)} />
                        <div className={cn("absolute bottom-0 left-0 w-1 h-1 bg-current opacity-50 group-hover:opacity-100 transition-opacity", style.primary)} />
                        <div className={cn("absolute bottom-0 right-0 w-1 h-1 bg-current opacity-50 group-hover:opacity-100 transition-opacity", style.primary)} />
                      </>
                    )}
                    <div className={cn(
                      "transition-transform duration-300",
                      disabled ? "text-slate-600" : style.primary,
                      !disabled && "group-hover:scale-110 group-hover:rotate-6"
                    )}>
                      {action.techIcon}
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="text-left flex-1 min-w-0">
                    {/* Main label */}
                    <div className={cn(
                      "font-mono font-black text-base uppercase tracking-wider",
                      disabled ? "text-slate-600" : style.primary
                    )}>
                      {disabled ? 'ГРАНАТЫ НЕТ' : action.label}
                    </div>

                    {/* Tech label */}
                    {!disabled && (
                      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.15em] mt-0.5">
                        {action.techLabel}
                      </div>
                    )}

                    {/* Description */}
                    <div className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider truncate">
                      {action.description}
                    </div>
                  </div>

                  {/* Arrow indicator with animation */}
                  {!disabled && (
                    <div className={cn(
                      "text-slate-700 group-hover:text-slate-500 transition-all font-mono text-lg duration-300 group-hover:translate-x-1",
                      style.primary
                    )}>
                      →
                    </div>
                  )}
                </div>

                {/* Tech measurement marks with enhanced visuals */}
                {!disabled && (
                  <>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-3 flex flex-col justify-between opacity-40 group-hover:opacity-60 transition-opacity">
                      <div className={cn("h-px", style.accent)} />
                      <div className={cn("h-px w-0.5", style.accent)} />
                      <div className={cn("h-px", style.accent)} />
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-3 flex flex-col justify-between opacity-40 group-hover:opacity-60 transition-opacity">
                      <div className={cn("h-px", style.accent)} />
                      <div className={cn("h-px w-0.5", style.accent)} />
                      <div className={cn("h-px", style.accent)} />
                    </div>

                    {/* Tech reticle decoration */}
                    <div className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500",
                      style.accent,
                      "group-hover:scale-150"
                    )} />
                  </>
                )}

                {/* Index indicator */}
                <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-700 opacity-50">
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Bottom tech decoration with status bar */}
              {!disabled && (
                <>
                  {/* Status bar */}
                  <div className="h-0.5 mt-px flex">
                    <div className={cn("flex-1 opacity-30", style.accent)} />
                    <div className="w-4" />
                    <div className={cn("flex-1 opacity-30", style.accent)} />
                  </div>

                  {/* Animated power level indicator */}
                  <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 group-hover:w-full w-0 opacity-50" style={{
                    background: `linear-gradient(90deg, transparent, currentColor, transparent)`,
                    animation: 'shimmer 2s infinite'
                  }} />
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom tech decoration */}
      <div className="relative pt-2">
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-slate-800" />
          <div className="w-2 h-2 border border-slate-700 rotate-45" />
          <div className="h-px flex-1 bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
