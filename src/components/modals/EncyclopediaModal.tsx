'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { EnrichedUnit } from '@/lib/encyclopedia-utils';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { SoldierImages } from '@/components/encyclopedia/UnitDetail/SoldierImages';
import { MachineImages } from '@/components/encyclopedia/UnitDetail/MachineImages';
import Image from 'next/image';
import { Shield, Zap, Skull } from 'lucide-react';
import { getFactionColors } from '@/lib/faction-colors';
import { FactionLogo } from '@/components/FactionLogo';

interface EncyclopediaModalProps {
  unit: EnrichedUnit;
  isOpen: boolean;
  onClose: () => void;
  scrollTarget?: 'soldier-images' | 'machine-images';
}

const factionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  polaris: Shield,
  protectorate: Zap,
  mercenaries: Skull,
};

const factionBadges: Record<string, string> = {
  polaris: 'ИМП',
  protectorate: 'ПРОТ',
  mercenaries: 'НАЁМ',
};

const factionNames: Record<string, string> = {
  polaris: 'Империя Полярис',
  protectorate: 'Торговый Протекторат',
  mercenaries: 'Наёмники',
};

export function EncyclopediaModal({
  unit,
  isOpen,
  onClose,
  scrollTarget,
}: EncyclopediaModalProps) {
  useEscapeToClose(isOpen, onClose);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: isOpen,
  });

  // Auto-scroll to target section on mount
  useEffect(() => {
    if (isOpen && scrollTarget && scrollContainerRef.current) {
      const targetElement = document.getElementById(scrollTarget);
      if (targetElement) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [isOpen, scrollTarget]);

  if (!isOpen) return null;

  const colors = getFactionColors(unit.faction);
  const faction = {
    name: factionNames[unit.faction] || unit.faction,
    icon: factionIcons[unit.faction] || Shield,
    badge: factionBadges[unit.faction] || '',
  };
  const FactionIcon = faction.icon;

  return (
    <div
      className="fixed inset-0 z-[60] bg-military-dark/95 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        ref={sheetRef}
        className={cn(
          "w-full sm:max-w-3xl bg-military-dark/90 backdrop-blur-sm border-2 shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col relative",
          colors.border
        )}
        onClick={(e) => e.stopPropagation()}
        {...touchHandlers}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-military-rust/30 shrink-0 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.bg}` }}>
              <div className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.text }}>
                <FactionLogo faction={unit.faction} className="w-full h-full" fallback={FactionIcon} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={cn("font-russo font-bold text-sm sm:text-base uppercase tracking-wider truncate", colors.text)}>
                {unit.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className={cn("px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono border rounded-sm", colors.border, colors.bg, colors.text)}>
                  {faction.badge}
                </span>
                <span className="text-[8px] sm:text-[9px] text-military-steel font-mono">
                  {unit.cost} ОЧК.
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="p-2 hover:bg-military-steel/20 rounded-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-military-rust/30"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-military-steel" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4"
        >
          {/* Unit image */}
          {unit.image && (
            <div className="relative aspect-[3/4] w-full sm:w-48 sm:mx-auto folded-paper military-corners overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src={unit.image}
                  alt={unit.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-military-dark/60 to-transparent" />
              </div>

              {/* Type indicator */}
              <div className="absolute top-3 right-3">
                <div className="px-3 py-1 backdrop-blur-sm bg-military-amber/20 border border-military-amber/40 rounded-sm">
                  <span className="text-sm">
                    {unit.type === 'squad' ? '◆' : '▲'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats section */}
          <section className="folded-paper military-corners p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                DATA_STATS
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-military-charcoal/50 rounded">
                <div className="text-military-amber text-xl mb-1">⬡</div>
                <div className="font-russo text-xl font-bold text-white">{unit.cost}</div>
                <div className="font-ibm-mono text-xs text-military-steel">очков</div>
              </div>
              <div className="text-center p-3 bg-military-charcoal/50 rounded">
                <div className="mb-1">
                  <div className="w-5 h-5 mx-auto" style={{ color: colors.text }}>
                    <FactionLogo faction={unit.faction} className="w-full h-full" fallback={FactionIcon} />
                  </div>
                </div>
                <div className="font-oswald text-sm text-military-sand">{faction.badge}</div>
                <div className="font-ibm-mono text-xs text-military-steel">фракция</div>
              </div>
              <div className="text-center p-3 bg-military-charcoal/50 rounded">
                <div className="text-military-amber text-xl mb-1">
                  {unit.type === 'squad' ? '◆' : '▲'}
                </div>
                <div className="font-oswald text-sm text-military-sand">
                  {unit.type === 'squad' ? 'Пехота' : 'Техника'}
                </div>
                <div className="font-ibm-mono text-xs text-military-steel">тип</div>
              </div>
              <div className="text-center p-3 bg-military-charcoal/50 rounded">
                <div className="text-military-rust text-xl mb-1">#</div>
                <div className="font-ibm-mono text-sm text-military-sand truncate px-2">
                  {unit.id}
                </div>
                <div className="font-ibm-mono text-xs text-military-steel">ID</div>
              </div>
            </div>
          </section>

          {/* Lore section */}
          {unit.encyclopedia?.lore && (
            <section className="folded-paper military-corners p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                  DATA_LORE
                </span>
              </div>
              <p className="font-oswald text-military-sand leading-relaxed italic border-l-4 border-military-rust/60 pl-4">
                {unit.encyclopedia.lore}
              </p>
            </section>
          )}

          {/* Tactics section */}
          {unit.encyclopedia?.tactics && (
            <section className="folded-paper military-corners p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                  DATA_TACTICS
                </span>
              </div>
              <p className="font-oswald text-military-sand leading-relaxed">
                {unit.encyclopedia.tactics}
              </p>
            </section>
          )}

          {/* History section */}
          {unit.encyclopedia?.history && (
            <section className="folded-paper military-corners p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                  DATA_HISTORY
                </span>
              </div>
              <p className="font-oswald text-military-sand leading-relaxed">
                {unit.encyclopedia.history}
              </p>
            </section>
          )}

          {/* Traditions section */}
          {unit.encyclopedia?.traditions && (
            <section className="folded-paper military-corners p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                  DATA_TRADITIONS
                </span>
              </div>
              <p className="font-oswald text-military-sand leading-relaxed italic border-l-4 border-military-amber/60 pl-4">
                {unit.encyclopedia.traditions}
              </p>
            </section>
          )}

          {/* Soldier Images section */}
          <SoldierImages unit={unit} />

          {/* Machine Images section */}
          <MachineImages unit={unit} />
        </div>
      </div>
    </div>
  );
}
