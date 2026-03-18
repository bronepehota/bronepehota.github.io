/**
 * Machine preview - shows how machine will look in battle card
 * Styled to match main app's MachineCard component
 */

'use client';

import { CustomWeapon, CustomSpeedSector } from '@/lib/editor/types';
import { Shield, Zap, Target } from 'lucide-react';
import SafeImage from '@/components/SafeImage';

interface MachinePreviewProps {
  name: string;
  shortName?: string;
  cost: number;
  rank: number;
  fireRate: number;
  ammoMax: number;
  durabilityMax: number;
  image?: string;
  weapons: CustomWeapon[];
  speedSectors: CustomSpeedSector[];
  faction?: string;
}

export function MachinePreview({
  name,
  shortName,
  cost,
  rank,
  fireRate,
  ammoMax,
  durabilityMax,
  image,
  weapons,
  speedSectors,
  faction = 'mercenaries',
}: MachinePreviewProps) {
  // Faction colors
  const getFactionColors = () => {
    switch (faction) {
      case 'polaris':
        return {
          border: 'border-red-600/30',
          accent: 'text-red-400',
          corner: 'rgba(220, 38, 38, 0.6)',
          badge: 'bg-red-950/90 text-red-400 border-red-600/40',
        };
      case 'protectorate':
        return {
          border: 'border-cyan-600/30',
          accent: 'text-cyan-400',
          corner: 'rgba(8, 145, 178, 0.6)',
          badge: 'bg-cyan-950/90 text-cyan-400 border-cyan-600/40',
        };
      default:
        return {
          border: 'border-yellow-600/30',
          accent: 'text-yellow-400',
          corner: 'rgba(202, 138, 4, 0.6)',
          badge: 'bg-yellow-950/90 text-yellow-400 border-yellow-600/40',
        };
    }
  };

  const colors = getFactionColors();

  return (
    <div className="w-full max-w-4xl bg-slate-900/80 rounded-sm border-2 shadow-lg overflow-hidden relative"
      style={{ borderColor: colors.corner }}
    >
      {/* Tech corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 -ml-px -mt-px pointer-events-none" style={{ borderColor: colors.corner }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 -mr-px -mt-px pointer-events-none" style={{ borderColor: colors.corner }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 -ml-px -mb-px pointer-events-none" style={{ borderColor: colors.corner }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 -mr-px -mb-px pointer-events-none" style={{ borderColor: colors.corner }} />

      <div className="flex flex-col md:flex-row">
        {/* Image section */}
        <div className="w-full md:w-48 bg-slate-900/50 relative">
          {image ? (
            <SafeImage
              src={image}
              alt={name}
              fill
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-48 md:h-full flex items-center justify-center bg-slate-800">
              <Shield className={`w-16 h-16 opacity-20 ${colors.accent}`} />
            </div>
          )}

          {/* Rank badge */}
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-sm font-mono text-xs font-bold bg-slate-900/90 backdrop-blur-sm border ${colors.border} ${colors.accent}`}>
            R{rank}
          </div>

          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Content section */}
        <div className="flex-1 p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg font-mono tracking-wide ${colors.accent}`}>
                {shortName || name.toUpperCase()}
              </h3>
              <p className="text-[10px] text-slate-500 truncate font-mono">
                ТЕХНИКА
              </p>
            </div>
            {/* Cost badge */}
            <div className={`px-3 py-1 rounded-md font-mono font-bold text-lg ${colors.badge}`}>
              {cost}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${colors.badge}`}>
              <Shield className="w-3 h-3" />
              <span>Прч {durabilityMax}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700">
              <Zap className="w-3 h-3" />
              <span>Скор {speedSectors[0]?.speed || 0}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700">
              <span className="text-sm">🔥</span>
              <span>{fireRate}</span>
            </div>
            <div className={`ml-auto ${colors.accent}`}>
              {weapons.length}×
            </div>
          </div>

          {/* Weapons */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Target className="w-3 h-3" />
              Оружие
            </div>
            {weapons.map((weapon, index) => (
              <div key={index} className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{weapon.name}</span>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="text-emerald-400">{weapon.range}</span>
                    <span className="text-amber-400">{weapon.power}</span>
                    <span className="text-cyan-400">∞{weapon.ammo ?? 20}</span>
                  </div>
                </div>
                {weapon.special && (
                  <div className="text-[10px] text-slate-500 mt-1">
                    {typeof weapon.special === 'string'
                      ? weapon.special
                      : weapon.special.type === 'repair'
                        ? `Ремонт: +${weapon.special.amount}`
                        : weapon.special.type === 'aoe'
                          ? `AOE: радиус ${weapon.special.radius}${weapon.special.damage ? `, ${weapon.special.damage}` : ''}`
                          : weapon.special.type === 'burst'
                            ? `Залп: ${weapon.special.count}x${weapon.special.directions ? ` (${weapon.special.directions.join(', ')})` : ''}`
                          : 'Особое'
                    }
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Speed sectors */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              Сектора скорости
            </div>
            <div className="flex gap-1 text-xs font-mono">
              {speedSectors.map((sector, index) => (
                <div key={index} className={`px-2 py-1 rounded ${colors.badge}`}>
                  {sector.min_durability}-{sector.max_durability}: {sector.speed}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-800/50 text-xs text-slate-500 flex justify-between">
        <span>Боезапас: {ammoMax}</span>
        <span className="text-slate-600">Предпросмотр</span>
      </div>
    </div>
  );
}
