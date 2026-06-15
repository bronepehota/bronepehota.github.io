'use client';

import React from 'react';
import Link from 'next/link';
import { X, Plus, BookOpen, Shield, Zap, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Squad, Machine, SourceID, FactionID } from '@/lib/types';
import { getSource } from '@/lib/sources-registry';
import { getFactionColors } from '@/lib/faction-colors';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { UnitStatTable } from './UnitDetail/UnitStatTable';

interface UnitDetailSheetProps {
  unit: Squad | Machine;
  type: 'squad' | 'machine';
  sourceId: SourceID;
  isOpen: boolean;
  onClose: () => void;
  onAdd?: () => void;
}

const factionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  polaris: Shield,
  protectorate: Zap,
  mercenaries: Skull,
};

function loreLine(unit: Squad | Machine): string | undefined {
  const enc = unit.encyclopedia as { shortDescription?: string; lore?: string } | undefined;
  return enc?.shortDescription || enc?.lore || ('description' in unit ? (unit as Machine).description : undefined);
}

export function UnitDetailSheet({ unit, type, sourceId, isOpen, onClose, onAdd }: UnitDetailSheetProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({ onClose, closeThreshold: 100, isEnabled: isOpen });
  if (!isOpen) return null;

  const colors = getFactionColors(unit.faction as FactionID);
  const sourceName = getSource(sourceId)?.source.name ?? sourceId;
  const FactionIcon = factionIcons[unit.faction as string] ?? Shield;
  const lore = loreLine(unit);

  return (
    <div
      className="fixed inset-0 z-[60] bg-military-dark/90 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        data-testid="unit-detail-sheet"
        className={cn(
          'w-full sm:max-w-3xl bg-military-dark border-2 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col',
          colors.border,
        )}
        onClick={(e) => e.stopPropagation()}
        {...touchHandlers}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-military-rust/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('p-2 rounded-lg', colors.bgSolid)}>
              <FactionIcon className={cn('w-4 h-4', colors.text)} />
            </div>
            <div className="min-w-0">
              <h2 className={cn('font-russo font-bold text-sm uppercase tracking-wider truncate', colors.text)}>
                {unit.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="inline-block px-1.5 py-0.5 -rotate-2 border border-military-rust/60 text-military-rust font-ibm-mono text-[9px] uppercase tracking-wider rounded-sm bg-military-rust/5"
                  title="Источник статов"
                >
                  ИСТ: {sourceName}
                </span>
                <span className="font-ibm-mono text-[10px] text-military-amber">{unit.cost} ОЧК</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-military-rust/30 rounded-sm"
          >
            <X className="w-4 h-4 text-military-steel" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
          <UnitStatTable unit={unit} type={type} />
          {lore && (
            <p className="font-oswald text-military-sand text-sm italic border-l-4 border-military-rust/60 pl-3">
              {lore}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-military-rust/30 flex items-center gap-2">
          <Link
            href="/encyclopedia"
            className="font-ibm-mono text-[11px] text-military-steel hover:text-military-sand inline-flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" /> Энциклопедия
          </Link>
          <div className="flex-1" />
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-4 py-2 min-h-[44px] rounded-sm bg-military-rust text-military-dark font-russo text-sm uppercase tracking-wider inline-flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" /> Добавить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
