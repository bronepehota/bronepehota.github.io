'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Squad } from '@/lib/types';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoldierImagesProps {
  unit: UnitWithType;
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

  // Map all soldiers, using first soldier's image for those without individual images
  const soldiersWithImages = squad.soldiers.map((soldier) => ({
    ...soldier,
    displayImage: soldier.image || firstSoldierImage,
  }));

  return (
    <section className="folded-paper military-corners p-6">
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
              'group hover:scale-105 transition-transform duration-300',
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
              <Image
                src={soldier.displayImage}
                alt={`${squad.name} — Боец №${soldier.num}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-military-dark/90 via-military-dark/20 to-transparent" />
            </div>

            {/* Rank badge - top right */}
            <div className="absolute top-2 right-2">
              <div className="px-2 py-1 backdrop-blur-sm bg-military-amber/20 border border-military-amber/40 rounded-sm">
                <span className="font-ibm-mono text-xs font-bold text-military-amber">
                  Р{soldier.rank}
                </span>
              </div>
            </div>

            {/* Soldier stats panel - shows on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <div className="backdrop-blur-sm bg-military-dark/90 rounded border border-military-rust/30 overflow-hidden">
                {/* Soldier number */}
                <div className="text-center py-1 border-b border-military-rust/20">
                  <div className="font-russo text-sm font-bold text-white">
                    №{soldier.num}
                  </div>
                </div>

                {/* Stats grid - hidden by default, shown on hover */}
                <div className="grid grid-cols-3 gap-px bg-military-rust/20 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Speed */}
                  <div className="text-center px-1">
                    <div className="font-ibm-mono text-[8px] text-military-steel uppercase">SPD</div>
                    <div className="font-russo text-xs font-bold text-military-amber">{soldier.speed}</div>
                  </div>
                  {/* Range */}
                  <div className="text-center px-1">
                    <div className="font-ibm-mono text-[8px] text-military-steel uppercase">RNG</div>
                    <div className="font-russo text-xs font-bold text-cyan-400">{soldier.range}</div>
                  </div>
                  {/* Power */}
                  <div className="text-center px-1">
                    <div className="font-ibm-mono text-[8px] text-military-steel uppercase">PWR</div>
                    <div className="font-russo text-xs font-bold text-red-400">{soldier.power}</div>
                  </div>
                  {/* Melee */}
                  <div className="text-center px-1">
                    <div className="font-ibm-mono text-[8px] text-military-steel uppercase">MEL</div>
                    <div className="font-russo text-xs font-bold text-orange-400">{soldier.melee}</div>
                  </div>
                  {/* Armor */}
                  <div className="text-center px-1">
                    <div className="font-ibm-mono text-[8px] text-military-steel uppercase">ARM</div>
                    <div className="font-russo text-xs font-bold text-blue-400">{soldier.armor}</div>
                  </div>
                  {/* Props */}
                  <div className="text-center px-1">
                    <div className="font-ibm-mono text-[8px] text-military-steel uppercase">PROP</div>
                    <div className="font-russo text-xs font-bold text-green-400">{soldier.props?.[0] || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scanline effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(234,88,12,0.05)_50%)] bg-[length:100%_4px]" />
            </div>

            {/* Corner bracket accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-military-rust/40" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-military-rust/40" />
          </div>
        ))}
      </div>
    </section>
  );
}
