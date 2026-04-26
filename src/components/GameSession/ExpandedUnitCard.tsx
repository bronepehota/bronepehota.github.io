// src/components/GameSession/ExpandedUnitCard.tsx
'use client';

import { memo } from 'react';
import { ArmyUnit, Squad, Machine, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';
import { BASE_PATH } from '@/lib/constants';
import type { UnitStatus } from '@/lib/unit-status';

interface ExpandedUnitCardProps {
  unit: ArmyUnit;
  originalIndex: number;
  isActive: boolean;
  section: UnitStatus;
  isMachine: boolean;
  onClick: () => void;
  faction: FactionID;
}

const sectionStyles: Record<UnitStatus, {
  cardBg: string;
  cardBorder: string;
  imageBg: string;
  text: string;
  opacity: string;
}> = {
  active: {
    cardBg: 'bg-transparent',
    cardBorder: '',
    imageBg: 'bg-gradient-to-br from-[#1f1f2e] to-[#161625]',
    text: 'text-slate-200',
    opacity: '',
  },
  done: {
    cardBg: 'bg-gradient-to-b from-[#071a0d] to-[#051209]',
    cardBorder: 'border-green-800',
    imageBg: 'bg-gradient-to-br from-[#0a2a12] to-[#071a0d]',
    text: 'text-green-300',
    opacity: 'opacity-70',
  },
  dead: {
    cardBg: 'bg-gradient-to-b from-[#1a0707] to-[#120505]',
    cardBorder: 'border-red-900',
    imageBg: 'bg-gradient-to-br from-[#2a0a0a] to-[#1a0707]',
    text: 'text-red-300 line-through',
    opacity: 'opacity-50',
  },
};

function getUnitStats(unit: ArmyUnit, isMachine: boolean): string[] {
  if (isMachine) {
    const machine = unit.data as Machine;
    const hp = `${unit.currentDurability ?? 0}/${machine.durability_max}`;
    return [`HP ${hp}`];
  }
  const squad = unit.data as Squad;
  const alive = squad.soldiers.length - (unit.deadSoldiers?.length || 0);
  return [`♥ ${alive}`];
}

export const ExpandedUnitCard = memo(function ExpandedUnitCard({
  unit,
  isActive,
  section,
  isMachine,
  onClick,
  faction,
}: Omit<ExpandedUnitCardProps, 'originalIndex'>) {
  const styles = sectionStyles[section];
  const factionColors = section === 'active' ? getFactionColors(faction) : null;
  const stats = getUnitStats(unit, isMachine);

  const imageUrl = isMachine
    ? unit.data.image!
    : ((unit.data as Squad).soldiers[0]?.image || unit.data.image!)!;
  const finalSrc = imageUrl?.startsWith('/images/')
    ? `${BASE_PATH}${imageUrl}`
    : imageUrl;

  return (
    <button
      onClick={onClick}
      aria-label={`${unit.data.name}, ${section === 'active' ? 'активный' : section === 'done' ? 'походил' : 'убит'}`}
      className={cn(
        'w-[100px] rounded overflow-hidden relative transition-all duration-200',
        'hover:scale-105 active:scale-95',
        styles.cardBg,
        styles.opacity,
        isActive && 'ring-2 ring-offset-1 ring-offset-slate-950',
        section === 'active' && factionColors
          ? cn('border', factionColors.borderSolid, isActive && factionColors.ring)
          : styles.cardBorder
      )}
      data-testid={`expanded-unit-${unit.instanceId}`}
    >
      <div className={cn('h-[55px] flex items-center justify-center relative', styles.imageBg)}>
        {finalSrc ? (
          <img
            src={finalSrc}
            alt={unit.data.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 20%' }}
          />
        ) : (
          <span className="text-slate-500 text-xs">IMG</span>
        )}
        <div
          className="absolute top-[3px] left-[3px] px-1 rounded-sm"
          style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${section === 'active' && factionColors ? factionColors.primary : section === 'done' ? '#166534' : '#7f1d1d'}` }}
        >
          <span className={cn(
            'text-[8px] font-bold font-mono',
            section === 'active' ? 'text-slate-300' : section === 'done' ? 'text-green-400' : 'text-red-400'
          )}>
            #{unit.instanceNumber || ''}
          </span>
        </div>
        {section === 'active' && factionColors && (
          <div
            className="absolute top-[3px] right-[3px] w-[6px] h-[6px]"
            style={{
              backgroundColor: factionColors.primary,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            }}
          />
        )}
        {section === 'done' && (
          <span className="text-green-500 text-sm">✓</span>
        )}
        {section === 'dead' && (
          <span className="text-red-600 text-base">✕</span>
        )}
      </div>

      <div className="px-2 py-1.5">
        <div className={cn('text-[10px] font-bold mb-1 truncate', styles.text)}>
          {(unit.data.shortName || unit.data.name || '').substring(0, 7).toUpperCase()}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {stats.map((stat, i) => (
            <span
              key={i}
              className={cn(
                'text-[8px]',
                section === 'active' ? 'text-slate-400' :
                section === 'done' ? 'text-green-600' : 'text-red-700'
              )}
            >
              {stat}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}, (prev, next) => {
  return (
    prev.unit.instanceId === next.unit.instanceId &&
    prev.isActive === next.isActive &&
    prev.section === next.section &&
    prev.faction === next.faction &&
    prev.isMachine === next.isMachine &&
    prev.unit.currentDurability === next.unit.currentDurability &&
    prev.unit.deadSoldiers?.length === next.unit.deadSoldiers?.length
  );
});
