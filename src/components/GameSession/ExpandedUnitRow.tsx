// src/components/GameSession/ExpandedUnitRow.tsx
'use client';

import { memo } from 'react';
import { ArmyUnit, Squad, Machine, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';
import { BASE_PATH } from '@/lib/constants';
import { getAliveSoldiersCount, checkSquadUniformStats, getMachineSpeed } from '@/lib/unit-utils';
import type { UnitStatus } from '@/lib/unit-status';

interface ExpandedUnitRowProps {
  unit: ArmyUnit;
  /** focusedUnitIdx === idx (selection ring) */
  isActive: boolean;
  section: UnitStatus;
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
  captured: {
    cardBg: 'bg-gradient-to-b from-[#1a1207] to-[#120a05]',
    cardBorder: 'border-orange-700',
    imageBg: 'bg-gradient-to-br from-[#2a1a0a] to-[#1a1207]',
    text: 'text-orange-300',
    opacity: 'opacity-50',
  },
};

/** Однострочная сводка статов: отряд — живые/броня/скорость, машина — HP/скорость. */
function getRowStatsLine(unit: ArmyUnit): string {
  if (unit.type === 'machine') {
    const machine = unit.data as Machine;
    const hp = `${unit.currentDurability ?? 0}/${machine.durability_max}`;
    return `HP ${hp} · 👣 ${getMachineSpeed(unit)}`;
  }
  const squad = unit.data as Squad;
  const parts = [`♥ ${getAliveSoldiersCount(unit)}/${squad.soldiers.length}`];
  const uniform = checkSquadUniformStats(unit);
  if (uniform.isUniformArmor && uniform.commonArmor !== undefined) {
    parts.push(`🛡 ${uniform.commonArmor}`);
  }
  if (uniform.isUniformSpeed && uniform.commonSpeed !== undefined) {
    parts.push(`👣 ${uniform.commonSpeed}`);
  }
  return parts.join(' · ');
}

const statusGlyph: Record<UnitStatus, { char: string; className: string }> = {
  active: { char: '', className: '' },
  done: { char: '✓', className: 'text-green-500' },
  dead: { char: '✕', className: 'text-red-600' },
  captured: { char: '⚑', className: 'text-orange-400' },
};

/**
 * Полноширинная строка юнита в развёрнутом навигаторе — главный способ
 * навигации в бою (плейтест: чипы 100px с обрезанным именем были нечитаемы).
 * Фото + полное имя + статы + статус-глиф справа.
 */
export const ExpandedUnitRow = memo(function ExpandedUnitRow({
  unit,
  isActive,
  section,
  onClick,
  faction,
}: ExpandedUnitRowProps) {
  const styles = sectionStyles[section];
  const factionColors = section === 'active' ? getFactionColors(faction) : null;
  const isMachine = unit.type === 'machine';

  const imageUrl = isMachine
    ? unit.data.image!
    : ((unit.data as Squad).soldiers[0]?.image || unit.data.image!)!;
  const finalSrc = imageUrl?.startsWith('/images/')
    ? `${BASE_PATH}${imageUrl}`
    : imageUrl;

  const statusWord = section === 'active' ? 'активный' : section === 'done' ? 'походил' : section === 'dead' ? 'убит' : 'захвачен';
  const glyph = statusGlyph[section];

  return (
    <button
      onClick={onClick}
      aria-label={`${unit.data.name}, ${statusWord}`}
      className={cn(
        'w-full flex items-center gap-2.5 min-h-[76px] px-2 py-1.5 rounded-md border text-left',
        'transition-all duration-200 hover:brightness-125 active:scale-[0.99]',
        styles.cardBg,
        styles.opacity,
        isActive && 'ring-2 ring-offset-2 ring-offset-slate-950',
        section === 'active' && factionColors
          ? cn('border', factionColors.borderSolid, isActive && factionColors.ring)
          : styles.cardBorder
      )}
      data-testid={`expanded-unit-${unit.instanceId}`}
    >
      {/* Фото — узкий портрет, № инстанса в углу */}
      <div className={cn('relative w-14 shrink-0 aspect-[3/4] rounded-sm overflow-hidden', styles.imageBg)}>
        {finalSrc ? (
          <img
            src={finalSrc}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 20%' }}
          />
        ) : (
          <span className="text-slate-500 text-xs">IMG</span>
        )}
        <span className="absolute bottom-[2px] left-[2px] px-1 rounded-sm bg-black/70">
          <span className="text-[9px] font-bold font-mono text-slate-300">
            #{unit.instanceNumber || ''}
          </span>
        </span>
      </div>

      {/* Полное имя + строка статов */}
      <div className="flex-1 min-w-0">
        <div className={cn('text-xs font-bold font-mono uppercase tracking-wide truncate', styles.text)}>
          {unit.data.name}
        </div>
        <div className="mt-0.5 text-[10px] font-mono text-slate-400 truncate">
          {getRowStatsLine(unit)}
        </div>
      </div>

      {/* Статус справа */}
      <div className="shrink-0 w-7 flex items-center justify-center text-base">
        {section === 'active' && factionColors && (
          <div
            className="w-2 h-2"
            style={{
              backgroundColor: factionColors.primary,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            }}
          />
        )}
        {glyph.char && <span className={glyph.className} aria-hidden="true">{glyph.char}</span>}
      </div>
    </button>
  );
}, (prev, next) => {
  return (
    prev.unit.instanceId === next.unit.instanceId &&
    prev.isActive === next.isActive &&
    prev.section === next.section &&
    prev.faction === next.faction &&
    prev.unit.type === next.unit.type &&
    prev.unit.currentDurability === next.unit.currentDurability &&
    prev.unit.deadSoldiers?.length === next.unit.deadSoldiers?.length
  );
});
