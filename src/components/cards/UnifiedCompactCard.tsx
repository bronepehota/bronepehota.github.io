'use client';

import React, { useState } from 'react';
import { Plus, X, User, Zap } from 'lucide-react';
import { ImageModal } from '@/components/modals/ImageModal';
import { GitHubPagesImage as Image } from '@/components/GitHubPagesImage';
import { getFactionColors } from '@/lib/faction-colors';
import { cn } from '@/lib/utils';
import type { UnifiedCompactCardProps } from './types';
import type { Squad, Machine, ArmyUnit } from '@/lib/types';

export function UnifiedCompactCard({
  unit,
  mode,
  onAction,
  onClick,
  factionId,
  canAfford = true,
  countInArmy = 0,
  dataTestId,
  readonly = false
}: UnifiedCompactCardProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');

  const colors = getFactionColors(factionId);

  // Determine if this is an ArmyUnit or template (Squad/Machine)
  const isArmyUnit = 'instanceId' in unit;
  const isMachine = isArmyUnit
    ? (unit as ArmyUnit).type === 'machine'
    : 'durability_max' in unit;

  const Icon = isMachine ? Zap : User;
  const typeLabel = isMachine ? 'МАШИНА' : 'ОТРЯД';

  // Get data based on unit type
  const getData = () => {
    if (isArmyUnit) {
      const armyUnit = unit as ArmyUnit;
      return {
        name: armyUnit.data.name,
        cost: armyUnit.data.cost,
        image: armyUnit.data.image,
        instanceNumber: armyUnit.instanceNumber,
        data: armyUnit.data
      };
    } else {
      const template = unit as Squad | Machine;
      return {
        name: template.name,
        cost: template.cost,
        image: template.image,
        instanceNumber: undefined,
        data: template
      };
    }
  };

  const data = getData();

  // Get quick stats
  const getQuickStats = () => {
    if (isMachine) {
      const machineData = (isArmyUnit ? (unit as ArmyUnit).data : unit) as Machine;
      const maxSpeed = Math.max(...machineData.speed_sectors.map(s => s.speed));
      return `R${machineData.rank} Прч${machineData.durability_max} Ск${maxSpeed}`;
    } else {
      const squadData = (isArmyUnit ? (unit as ArmyUnit).data : unit) as Squad;
      const maxRank = Math.max(...squadData.soldiers.map(s => s.rank));
      const armors = squadData.soldiers.map(s => s.armor);
      const minArmor = Math.min(...armors);
      const maxArmor = Math.max(...armors);
      const armorRange = minArmor === maxArmor ? `${minArmor}` : `${minArmor}-${maxArmor}`;
      return `R${maxRank} ${squadData.soldiers.length} бойцов Бр${armorRange}`;
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

  const handleCardClick = () => {
    if (onClick) {
      onClick(unit);
    } else if (mode === 'add' && canAfford && onAction) {
      onAction(unit);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(unit);
    }
  };

  const testId = dataTestId || `compact-unit-card-${isArmyUnit ? (unit as ArmyUnit).instanceId : (isMachine ? (data.data as Machine).id : (data.data as Squad).id)}`;

  // Get image source
  const getImageSrc = (): string | null => {
    if (data.image) return data.image;
    if (!isMachine) {
      const squadData = data.data as Squad;
      if (squadData.soldiers[0]?.image) {
        return squadData.soldiers[0].image;
      }
    }
    return null;
  };

  const imageSrc = getImageSrc();

  return (
    <div
      className={cn(
        'relative h-16 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50',
        'border-l-4 flex items-stretch overflow-hidden',
        'transition-all duration-200 active:scale-[0.98]',
        mode === 'add' && canAfford ? 'cursor-pointer' : '',
        mode === 'add' && !canAfford ? 'opacity-60 cursor-not-allowed' : '',
        colors.accent
      )}
      onClick={mode === 'add' ? handleCardClick : (onClick ? () => onClick(unit) : undefined)}
      data-testid={testId}
    >
      {/* Type icon zone */}
      <div className="w-14 flex items-center justify-center flex-shrink-0 bg-slate-900/50">
        {imageSrc ? (
          <button
            className="w-11 h-11 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/30 transition-all active:scale-95"
            onClick={(e) => handleImageClick(e, imageSrc, data.name)}
            aria-label={`Увеличить изображение ${data.name}`}
            disabled={mode === 'add' && !canAfford}
          >
            <Image
              src={imageSrc}
              alt={data.name}
              width={32}
              height={32}
              className="w-full h-full object-cover object-center"
              unoptimized
            />
          </button>
        ) : (
          <div className={cn('w-11 h-11 rounded-full flex items-center justify-center', colors.bgSolid, 'bg-opacity-20')}>
            <Icon className={cn('w-5 h-5', colors.text)} />
          </div>
        )}
      </div>

      {/* Content zone */}
      <div className="flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-mono font-bold text-sm truncate leading-tight',
                mode === 'add' && !canAfford ? 'text-slate-500' : 'text-slate-100'
              )} title={data.name}>
                {data.name}
              </h4>
              {countInArmy > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-600/80 text-white">
                  {countInArmy}
                </span>
              )}
              {data.instanceNumber && data.instanceNumber > 1 && (
                <span className="text-[10px] font-mono text-slate-600">
                  #{data.instanceNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {typeLabel}
              </span>
              {mode === 'add' && (
                <span className="text-[10px] font-mono text-slate-600">
                  {quickStats}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={cn(
              'font-mono font-bold text-sm',
              mode === 'add' && !canAfford ? 'text-slate-600' : colors.text
            )}>
              {data.cost}
            </span>
          </div>
        </div>
      </div>

      {/* Action button zone */}
      {mode === 'add' && (
        <div className="w-14 flex items-center justify-center flex-shrink-0">
          <button
            onClick={handleActionClick}
            data-testid={`add-compact-${(data.data as Squad | Machine).id}`}
            disabled={!canAfford}
            aria-label={`Добавить ${data.name}`}
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
              canAfford ? colors.text : 'text-slate-600'
            )} />
          </button>
        </div>
      )}

      {mode === 'remove' && !readonly && (
        <div className="w-14 flex items-center justify-center flex-shrink-0">
          <button
            onClick={handleActionClick}
            data-testid={dataTestId ? dataTestId.replace('army-unit-', 'remove-unit-') : `remove-compact-${isArmyUnit ? (unit as ArmyUnit).instanceId : (data.data as Squad | Machine).id}`}
            aria-label={`Удалить ${data.name}`}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center',
              'bg-red-900/20 hover:bg-red-900/40',
              'border border-red-700/50 hover:border-red-600',
              'transition-all duration-200',
              'active:scale-95 touch-manipulation'
            )}
          >
            <X className="w-5 h-5 text-red-400" />
          </button>
        </div>
      )}

      {/* Indicator bar */}
      <div className={cn(
        'absolute bottom-0 left-14 right-0 h-0.5',
        mode === 'add' ? (canAfford ? colors.progress : 'bg-slate-700') : colors.progress
      )} style={{ opacity: mode === 'add' ? (canAfford ? 0.5 : 0.3) : 0.5 }} />

      <ImageModal
        src={modalImageSrc}
        alt={modalImageAlt}
        isOpen={imageModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
