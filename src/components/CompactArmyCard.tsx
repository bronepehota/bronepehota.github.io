'use client';

import React, { useState } from 'react';
import { X, User, Zap } from 'lucide-react';
import { ArmyUnit, FactionID, Squad } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GitHubPagesImage as Image } from './GitHubPagesImage';
import { ImageModal } from './ImageModal';

interface CompactArmyCardProps {
  unit: ArmyUnit;
  onRemove: (instanceId: string) => void;
  onClick?: (unit: ArmyUnit) => void;
  factionId: FactionID;
  dataTestId?: string;
  readonly?: boolean; // НОВОЕ
}

export function CompactArmyCard({ unit, onRemove, onClick, factionId, dataTestId, readonly = false }: CompactArmyCardProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');
  const factionColors = {
    polaris: 'bg-red-500',
    protectorate: 'bg-cyan-500',
    mercenaries: 'bg-yellow-500',
  };

  const factionBorders = {
    polaris: 'border-l-red-500',
    protectorate: 'border-l-cyan-500',
    mercenaries: 'border-l-yellow-500',
  };

  const accentColor = factionColors[factionId] || factionColors.polaris;
  const borderColor = factionBorders[factionId] || factionBorders.polaris;

  const isMachine = unit.type === 'machine';
  const Icon = isMachine ? Zap : User;
  const typeLabel = isMachine ? 'МАШИНА' : 'ОТРЯД';

  const handleCardClick = () => {
    if (onClick) {
      onClick(unit);
    }
  };

  const handleImageClick = (e: React.MouseEvent, src: string, alt: string) => {
    e.stopPropagation();
    setModalImageSrc(src);
    setModalImageAlt(alt);
    setImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setImageModalOpen(false);
  };

  const getImageSrc = (): string | null => {
    if (unit.data.image) return unit.data.image;
    if (!isMachine && (unit.data as Squad).soldiers[0]?.image) {
      return (unit.data as Squad).soldiers[0].image!;
    }
    return null;
  };

  return (
    <div
      className={cn(
        'relative h-16 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50',
        'border-l-4 flex items-stretch overflow-hidden',
        'transition-all duration-200 active:scale-[0.98]',
        borderColor
      )}
      onClick={handleCardClick}
      data-testid={dataTestId || `compact-army-card-${unit.instanceId}`}
    >
      {/* Type icon zone - with image fallback */}
      <div className="w-14 flex items-center justify-center flex-shrink-0 bg-slate-900/50">
        {unit.data.image ? (
          /* Unit has image - show it in circle */
          (() => {
            const unitImage = unit.data.image;
            return (
              <button
                className="w-11 h-11 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/30 transition-all active:scale-95"
                onClick={(e) => handleImageClick(e, unitImage, unit.data.name)}
                aria-label={`Увеличить изображение ${unit.data.name}`}
              >
                <Image
                  src={unitImage}
                  alt={unit.data.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: '50% 40%', transform: 'scale(2) translateY(10%)' }}
                  unoptimized
                />
              </button>
            );
          })()
        ) : !isMachine && (unit.data as Squad).soldiers[0]?.image ? (
          /* Squad fallback: show first soldier thumbnail in circle */
          (() => {
            const soldierImage = (unit.data as Squad).soldiers[0].image!;
            return (
              <button
                className="w-11 h-11 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/30 transition-all active:scale-95"
                onClick={(e) => handleImageClick(e, soldierImage, `${unit.data.name} - боец 1`)}
                aria-label={`Увеличить изображение бойца`}
              >
                <Image
                  src={soldierImage}
                  alt={`${unit.data.name} - боец 1`}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: '50% 40%', transform: 'scale(2) translateY(10%)' }}
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
      </div>

      {/* Content zone */}
      <div className="flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-mono font-bold text-sm text-slate-100 truncate leading-tight" title={unit.data.name}>
              {unit.data.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {typeLabel}
              </span>
              {unit.instanceNumber && unit.instanceNumber > 1 && (
                <span className="text-[10px] font-mono text-slate-600">
                  #{unit.instanceNumber}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={cn(
              'font-mono font-bold text-sm',
              accentColor.replace('bg-', 'text-')
            )}>
              {unit.data.cost}
            </span>
          </div>
        </div>
      </div>

      {/* Remove button zone - скрыть в readonly */}
      {!readonly && (
        <div className="w-14 flex items-center justify-center flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(unit.instanceId);
            }}
            data-testid={dataTestId ? dataTestId.replace('army-unit-', 'remove-unit-') : `remove-compact-${unit.instanceId}`}
            aria-label={`Удалить ${unit.data.name}`}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center',
              'bg-red-900/20 hover:bg-red-900/40',
              'border border-red-700/50 hover:border-red-600',
              'transition-all duration-200',
              'active:scale-95 touch-manipulation'
            )}
          >
            <X className={cn('w-5 h-5', accentColor.replace('bg-', 'text-').replace('red', 'text-red-400'))} />
          </button>
        </div>
      )}

      <ImageModal
        src={modalImageSrc}
        alt={modalImageAlt}
        isOpen={imageModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
