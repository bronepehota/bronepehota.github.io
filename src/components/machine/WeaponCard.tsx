'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Crosshair, Zap, Target } from 'lucide-react';
import { clsx } from 'clsx';
import type { Weapon } from '@/lib/types';

interface WeaponCardProps {
  weapon: Weapon;
  faction: 'polaris' | 'protectorate' | 'mercenaries';
  index: number;
}

export default function WeaponCard({ weapon, faction, index }: WeaponCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const factionColors = {
    polaris: 'border-red-500/30 hover:border-red-500',
    protectorate: 'border-cyan-500/30 hover:border-cyan-500',
    mercenaries: 'border-yellow-500/30 hover:border-yellow-500'
  };

  const accentColors = {
    polaris: 'text-red-400',
    protectorate: 'text-cyan-400',
    mercenaries: 'text-yellow-400'
  };

  const accent = accentColors[faction];

  return (
    <div
      className={clsx(
        'border-l-2 bg-slate-800/50 backdrop-blur-sm overflow-hidden transition-all duration-300',
        factionColors[faction],
        isExpanded ? 'py-3 px-3' : 'py-2 px-3'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header - always visible */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Crosshair className={clsx('w-4 h-4 flex-shrink-0', accent)} />
          <span className={clsx('font-mono text-sm font-semibold truncate', accent)}>
            {weapon.name}
          </span>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Stats - always visible */}
      <div className="flex items-center gap-3 mt-2 text-xs font-mono">
        <span className={clsx('flex items-center gap-1', accent)}>
          <Zap className="w-3 h-3" />
          {weapon.power}
        </span>
        <span className={clsx('flex items-center gap-1', accent)}>
          <Target className="w-3 h-3" />
          {weapon.range}
        </span>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 animate-in slide-in-from-top-2">
          {weapon.description && (
            <p className="text-xs text-slate-300 leading-relaxed">
              {weapon.description}
            </p>
          )}
          {weapon.manufacturer && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <span>ПРОИЗВОДИТЕЛЬ:</span>
              <span className="text-slate-400">{weapon.manufacturer}</span>
            </div>
          )}
          {weapon.special && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
              <span className="text-[10px] text-yellow-400 font-mono">
                ⚡ {typeof weapon.special === 'string' ? weapon.special : JSON.stringify(weapon.special)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
