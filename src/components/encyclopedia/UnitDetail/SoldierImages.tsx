'use client';

import { useState, useEffect } from 'react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { EnrichedUnit } from '@/lib/encyclopedia-utils';
import { Squad } from '@/lib/types';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoldierImagesProps {
  unit: EnrichedUnit;
}

export function SoldierImages({ unit }: SoldierImagesProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Only show soldier images for squads
  if (unit.type !== 'squad') {
    return null;
  }

  const squad = unit as Squad;

  // Get the first soldier's image as fallback
  const firstSoldierImage = squad.soldiers[0]?.image || squad.image;

  // If no images at all, don't show the section
  if (!firstSoldierImage) {
    return null;
  }

  // Full stats live in the UnitStatTable above; here each card shows just a compact
  // combat footer (weapon stats for shooters, melee+armor for melee troops) — no
  // expand panel, so it stays clean and readable on small mobile screens.
  const soldiersWithImages = squad.soldiers.map((soldier) => ({
    ...soldier,
    displayImage: soldier.image || firstSoldierImage,
    isShooter: Boolean(soldier.range && soldier.power),
  }));

  return (
    <section id="soldier-images" className="folded-paper military-corners p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-4 h-4 text-military-rust/60" />
        <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
          DATA_PERSONNEL
        </span>
      </div>

      <h3 className="font-russo text-xl text-white mb-6 flex items-center gap-3">
        <span className="text-military-amber">◆</span>
        Личный состав
        <span className="font-ibm-mono text-sm text-military-steel/60">
          ({squad.soldiers.length} бойцов)
        </span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {soldiersWithImages.map((soldier, index) => (
          <div
            key={soldier.num}
            className={cn(
              'relative aspect-[3/4] folded-paper military-corners overflow-hidden',
              'transition-transform duration-300 hover:scale-[1.02]',
              'fade-in-up opacity-0',
              isLoaded && 'opacity-100'
            )}
            style={{
              animationFillMode: 'forwards',
              animationDelay: `${index * 0.05}s`,
            }}
          >
            {/* Soldier image */}
            <div className="relative w-full h-full">
              <GitHubPagesImage
                src={soldier.displayImage}
                alt={`${squad.name} — Боец №${soldier.num}`}
                fill
                className="object-cover"
              />
            </div>

            {/* Top HUD - Soldier number */}
            <div className="absolute top-2 left-2">
              <div className="px-2 py-1 backdrop-blur-md bg-military-dark/60 border border-military-rust/40 rounded-sm">
                <span className="font-ibm-mono text-xs font-bold text-white">
                  #{soldier.num}
                </span>
              </div>
            </div>

            {/* Top HUD - Rank badge */}
            <div className="absolute top-2 right-2">
              <div className="px-2 py-1 backdrop-blur-md bg-military-amber/20 border border-military-amber/50 rounded-sm">
                <span className="font-ibm-mono text-xs font-bold text-military-amber">
                  Р{soldier.rank}
                </span>
              </div>
            </div>

            {/* Compact combat footer — weapon stats (shooters) or melee+armor */}
            <div className="absolute bottom-0 left-0 right-0 px-2 pt-6 pb-1.5 bg-gradient-to-t from-military-dark via-military-dark/90 to-transparent">
              <div className="flex items-center justify-center gap-2.5 font-ibm-mono text-[11px] font-bold">
                {soldier.isShooter ? (
                  <>
                    <span className="text-cyan-400" title="Дальность">
                      <span className="text-military-steel/60 font-normal">Д </span>{soldier.range}
                    </span>
                    <span className="text-red-400" title="Мощность">
                      <span className="text-military-steel/60 font-normal">М </span>{soldier.power}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-orange-400" title="Ближний бой">
                      <span className="text-military-steel/60 font-normal">ББ </span>{soldier.melee}
                    </span>
                    <span className="text-blue-400" title="Броня">
                      <span className="text-military-steel/60 font-normal">Бр </span>{soldier.armor}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Corner bracket accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-military-rust/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-military-rust/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-military-rust/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-military-rust/40" />
          </div>
        ))}
      </div>
    </section>
  );
}
