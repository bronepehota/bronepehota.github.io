'use client';

import React, { useState } from 'react';
import { User, Zap, Plus, BookOpen } from 'lucide-react';
import { GitHubPagesImage as Image } from './GitHubPagesImage';
import { ImageModal } from './modals/ImageModal';
import type { Squad, Machine, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors, factionDisplayNames } from '@/lib/faction-colors';
import { FactionLogo } from '@/components/FactionLogo';

interface CompactUnitCardProps {
  unit: Squad | Machine;
  type: 'squad' | 'machine';
  onAdd: () => void;
  onClick: () => void;
  factionId: FactionID;
  canAfford: boolean;
  countInArmy?: number;
  /**
   * ID of an allied faction. When provided, renders a small colored "ally" pill
   * next to the unit name (set by UnitSelector for units whose faction differs
   * from the player's selected faction). The pill's color is derived from this
   * id via getFactionColors. Omitted/undefined for the player's own-faction
   * units → no badge.
   */
  allyFactionId?: FactionID;
  /**
   * Relationship label shown inside the ally pill: 'Подфракция' | 'Основная' |
   * 'Союзник' (default). Computed by UnitSelector from `relationTo(...)` so the
   * badge reflects how the unit's faction relates to the selected faction.
   */
  allyLabel?: string;
}

export function CompactUnitCard({
  unit,
  type,
  onAdd,
  onClick,
  factionId,
  canAfford,
  countInArmy = 0,
  allyFactionId,
  allyLabel
}: CompactUnitCardProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');
  const colors = getFactionColors(factionId);

  const accentColor = colors.bgSolid;
  const borderColor = colors.borderSolid.replace('border-', 'border-l-');

  const isMachine = type === 'machine';
  const Icon = isMachine ? Zap : User;

  // Get quick stats based on unit type
  const getQuickStats = () => {
    if (isMachine) {
      const machine = unit as Machine;
      const maxSpeed = Math.max(...machine.speed_sectors.map(s => s.speed));
      return `R${machine.rank} Прч${machine.durability_max} Ск${maxSpeed}`;
    } else {
      const squad = unit as Squad;
      const maxRank = Math.max(...squad.soldiers.map(s => s.rank));
      const armors = squad.soldiers.map(s => s.armor);
      const minArmor = Math.min(...armors);
      const maxArmor = Math.max(...armors);
      const armorRange = minArmor === maxArmor ? `${minArmor}` : `${minArmor}-${maxArmor}`;
      return `R${maxRank} ${squad.soldiers.length} бойцов Бр${armorRange}`;
    }
  };

  const quickStats = getQuickStats();

  const handleImageClick = (e: React.MouseEvent, src: string, alt: string) => {
    e.stopPropagation();
    setModalImageSrc(src);
    setModalImageAlt(alt);
    setImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setImageModalOpen(false);
  };

  return (
    <div
      className={cn(
        'relative h-16 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50',
        'border-l-4 flex items-stretch overflow-hidden',
        'transition-all duration-200 active:scale-[0.98]',
        canAfford ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed',
        borderColor
      )}
      data-testid={`compact-unit-card-${unit.id}`}
    >
      {/* Type icon zone - with image fallback */}
      <div className="relative w-14 flex items-center justify-center flex-shrink-0 bg-slate-900/50">
        {unit.image ? (
          /* Unit has image - show it in circle */
          (() => {
            const unitImage = unit.image;
            return (
              <button
                className="w-11 h-11 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/30 transition-all active:scale-95"
                onClick={(e) => handleImageClick(e, unitImage, unit.name)}
                aria-label={`Увеличить изображение ${unit.name}`}
                disabled={!canAfford}
              >
                <Image
                  src={unitImage}
                  alt={unit.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover object-center"
                  unoptimized
                />
              </button>
            );
          })()
        ) : !isMachine && (unit as Squad).soldiers[0]?.image ? (
          /* Squad fallback: show first soldier thumbnail in circle */
          (() => {
            const soldierImage = (unit as Squad).soldiers[0].image!;
            return (
              <button
                className="w-11 h-11 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/30 transition-all active:scale-95"
                onClick={(e) => handleImageClick(e, soldierImage, `${unit.name} - боец 1`)}
                aria-label={`Увеличить изображение бойца`}
                disabled={!canAfford}
              >
                <Image
                  src={soldierImage}
                  alt={`${unit.name} - боец 1`}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover object-center"
                  unoptimized
                />
              </button>
            );
          })()
        ) : (
          /* Final fallback: icon */
          <div className={cn('w-11 h-11 rounded-full flex items-center justify-center', accentColor, 'bg-opacity-20')}>
            <Icon className={cn('w-5 h-5', accentColor.replace('bg-', 'text-'))} />
          </div>
        )}
        {allyFactionId && (
          <span
            className="absolute top-0 left-0 inline-flex items-center justify-center w-5 h-5 rounded-full border bg-slate-900/90 backdrop-blur-sm z-10"
            style={{ borderColor: getFactionColors(allyFactionId).primary + '88' }}
            title={`${allyLabel ?? 'Союзник'}: ${factionDisplayNames[allyFactionId] ?? allyFactionId}`}
          >
            <FactionLogo faction={allyFactionId} className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Content zone */}
      <div className="flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  'font-mono font-bold text-sm truncate leading-tight',
                  canAfford ? 'text-slate-100' : 'text-slate-500'
                )}
                title={unit.name}
              >
                {unit.name}
              </h4>
              {countInArmy > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-600/80 text-white">
                  {countInArmy}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-600">
                {quickStats}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={cn(
              'font-mono font-bold text-sm',
              canAfford ? accentColor.replace('bg-', 'text-') : 'text-slate-600'
            )}>
              {unit.cost}
            </span>
          </div>
        </div>
      </div>

      {/* Info button zone — opens the in-app stats modal (no navigation, preserves the army selection) */}
      <div className="w-10 flex items-center justify-center flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canAfford) {
              onClick();
            }
          }}
          disabled={!canAfford}
          aria-label="Подробнее"
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center',
            'transition-all duration-200 active:scale-95 touch-manipulation',
            canAfford
              ? 'bg-slate-700/30 hover:bg-slate-700 border border-slate-600/50'
              : 'bg-slate-800/50 cursor-not-allowed opacity-50'
          )}
        >
          <BookOpen className={cn('w-4 h-4', canAfford ? 'text-slate-400' : 'text-slate-600')} />
        </button>
      </div>

      {/* Add button zone */}
      <div className="w-12 flex items-center justify-center flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canAfford) {
              onAdd();
            }
          }}
          data-testid={`add-compact-${unit.id}`}
          disabled={!canAfford}
          aria-label={`Добавить ${unit.name}`}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            'active:scale-95 touch-manipulation',
            canAfford
              ? cn('bg-slate-700/50 hover:bg-slate-700', 'border border-slate-600 hover:border-slate-500')
              : 'bg-slate-800/50 cursor-not-allowed opacity-50'
          )}
        >
          <Plus className={cn(
            'w-5 h-5',
            canAfford ? accentColor.replace('bg-', 'text-') : 'text-slate-600'
          )} />
        </button>
      </div>

      {/* Armor/durability indicator bar */}
      <div className={cn(
        'absolute bottom-0 left-14 right-0 h-0.5',
        canAfford ? accentColor : 'bg-slate-700'
      )} style={{ opacity: canAfford ? 0.5 : 0.3 }} />

      <ImageModal
        src={modalImageSrc}
        alt={modalImageAlt}
        isOpen={imageModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
