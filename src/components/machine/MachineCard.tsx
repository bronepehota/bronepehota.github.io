'use client';

import { useState } from 'react';
import { Shield, Zap, Plus, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import type { Machine, FactionID } from '@/lib/types';
import SafeImage from '@/components/SafeImage';
import { getFactionColors, factionDisplayNames } from '@/lib/faction-colors';
import { FactionLogo } from '@/components/FactionLogo';

interface MachineCardProps {
  machine: Machine;
  onAdd: (machine: Machine) => void;
  onViewDetails: (machine: Machine) => void;
  testId?: string;
  /**
   * ID of an allied faction. When provided, renders a small colored "ally" pill
   * next to the machine name (set by UnitSelector for machines whose faction
   * differs from the player's selected faction). The pill's color is derived
   * from this id via getFactionColors. Omitted/undefined for the player's
   * own-faction machines → no badge.
   */
  allyFactionId?: FactionID;
  /**
   * Relationship label shown inside the ally pill: 'Подфракция' | 'Основная' |
   * 'Союзник' (default). Computed by UnitSelector from `relationTo(...)`.
   */
  allyLabel?: string;
}

export default function MachineCard({ machine, onAdd, onViewDetails, testId, allyFactionId, allyLabel }: MachineCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const factionColors = {
    polaris: {
      border: 'border-red-500/50 hover:border-red-500',
      bg: 'hover:bg-red-500/10',
      accent: 'text-red-400',
      glow: 'shadow-red-500/20'
    },
    protectorate: {
      border: 'border-cyan-500/50 hover:border-cyan-500',
      bg: 'hover:bg-cyan-500/10',
      accent: 'text-cyan-400',
      glow: 'shadow-cyan-500/20'
    },
    mercenaries: {
      border: 'border-yellow-500/50 hover:border-yellow-500',
      bg: 'hover:bg-yellow-500/10',
      accent: 'text-yellow-400',
      glow: 'shadow-yellow-500/20'
    }
  };

  const colors = factionColors[machine.faction as keyof typeof factionColors];

  return (
    <div
      data-testid={`unit-card-${machine.id}`}
      className={clsx(
        'relative group transition-all duration-300',
        'border bg-slate-800/80 backdrop-blur-sm overflow-hidden',
        colors.border,
        colors.bg
      )}
    >
      {/* Corner accents */}
      <div className={clsx(
        'absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2',
        'transition-all duration-300',
        machine.faction === 'polaris' ? 'border-red-500' : 'border-cyan-500'
      )} />
      <div className={clsx(
        'absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2',
        'transition-all duration-300',
        machine.faction === 'polaris' ? 'border-red-500' : 'border-cyan-500'
      )} />
      <div className={clsx(
        'absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2',
        'transition-all duration-300',
        machine.faction === 'polaris' ? 'border-red-500' : 'border-cyan-500'
      )} />
      <div className={clsx(
        'absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2',
        'transition-all duration-300',
        machine.faction === 'polaris' ? 'border-red-500' : 'border-cyan-500'
      )} />

      {/* Image */}
      <div className="relative aspect-square bg-slate-900/50 overflow-hidden">
        {!imageError ? (
          <SafeImage
            src={machine.image}
            alt={machine.name}
            fill
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <Shield className={clsx('w-16 h-16 opacity-20', colors.accent)} />
          </div>
        )}

        {/* Rank badge */}
        <div className={clsx(
          'absolute top-2 right-2 px-2 py-0.5 rounded-sm font-mono text-xs font-bold',
          'bg-slate-900/90 backdrop-blur-sm border',
          colors.border,
          colors.accent
        )}>
          R{machine.rank}
        </div>

        {/* Info button - top left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(machine);
          }}
          className="absolute top-2 left-2 p-1.5 rounded-sm font-mono text-xs bg-slate-900/90 backdrop-blur-sm border hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center md:min-w-0 md:min-h-0"
          aria-label="Подробнее"
        >
          <BookOpen className={clsx('w-4 h-4', colors.accent)} />
        </button>

        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name row */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={clsx(
              'font-bold text-sm font-mono tracking-wide truncate',
              colors.accent
            )}>
              {machine.shortName || machine.name.toUpperCase()}
            </h3>
            <p className="text-[10px] text-slate-500 truncate font-mono">
              {machine.class?.toUpperCase()}
            </p>
          </div>
          {allyFactionId && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-mono text-[9px] font-semibold uppercase tracking-wider flex-shrink-0 border self-center"
              style={{
                backgroundColor: getFactionColors(allyFactionId).primary + '22',
                color: getFactionColors(allyFactionId).primary,
                borderColor: getFactionColors(allyFactionId).primary + '55',
              }}
              title={`${allyLabel ?? 'Союзник'}: ${factionDisplayNames[allyFactionId] ?? allyFactionId}`}
            >
              <FactionLogo faction={allyFactionId} className="w-3 h-3" />
              {allyLabel ?? 'Союзник'}
            </span>
          )}
          {/* Cost badge */}
          <div className="flex-shrink-0">
            <span className={clsx(
              'px-2 py-0.5 rounded-md font-mono font-bold text-sm',
              colors.bg,
              colors.border,
              colors.accent
            )}>
              {machine.cost}
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-700/30">ТЕХНИКА</span>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Прч {machine.durability_max}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Скор {machine.speed_sectors[0]?.speed || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs">🔥</span>
            <span>{machine.fire_rate}</span>
          </div>
          <div className={clsx('ml-auto', colors.accent)}>
            {machine.weapons?.length || 0}×
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPressed(true);
            setTimeout(() => setIsPressed(false), 200);
            onAdd(machine);
          }}
          data-testid={testId}
          className={clsx(
            'w-full py-2 flex items-center justify-center gap-2',
            'border font-mono text-xs font-bold uppercase tracking-wider',
            'transition-all duration-200',
            colors.border,
            colors.bg,
            colors.accent,
            isPressed && 'scale-95'
          )}
        >
          <Plus className={clsx('w-4 h-4', isPressed && 'rotate-90 transition-transform')} />
          В АРМИЮ
        </button>
      </div>
    </div>
  );
}
