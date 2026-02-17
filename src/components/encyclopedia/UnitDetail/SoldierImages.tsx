'use client';

import { useState, useEffect } from 'react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Squad } from '@/lib/types';
import { Users, ChevronDown, ChevronUp, Footprints, Target, Zap, Sword, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoldierImagesProps {
  unit: UnitWithType;
}

export function SoldierImages({ unit }: SoldierImagesProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedSoldier, setExpandedSoldier] = useState<number | null>(null);

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
        {soldiersWithImages.map((soldier, index) => {
          const isExpanded = expandedSoldier === index;

          return (
            <div
              key={soldier.num}
              className={cn(
                'relative aspect-[3/4] folded-paper military-corners overflow-hidden',
                'group hover:scale-[1.02] transition-transform duration-300',
                'fade-in-up opacity-0 cursor-pointer',
                isLoaded && 'opacity-100'
              )}
              style={{
                animationFillMode: 'forwards',
                animationDelay: `${index * 0.05}s`,
              }}
              onClick={() => setExpandedSoldier(isExpanded ? null : index)}
            >
              {/* Soldier image */}
              <div className="relative w-full h-full">
                <GitHubPagesImage
                  src={soldier.displayImage}
                  alt={`${squad.name} — Боец №${soldier.num}`}
                  fill
                  className="object-cover"
                />
                {/* Minimal gradient overlay - only at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-military-dark/80 to-transparent" />
              </div>

              {/* Top HUD - Soldier number (compact) */}
              <div className="absolute top-2 left-2">
                <div className="px-2 py-1 backdrop-blur-md bg-military-dark/60 border border-military-rust/40 rounded-sm">
                  <span className="font-ibm-mono text-xs font-bold text-white">
                    #{soldier.num}
                  </span>
                </div>
              </div>

              {/* Top HUD - Rank badge (compact) */}
              <div className="absolute top-2 right-2">
                <div className="px-2 py-1 backdrop-blur-md bg-military-amber/20 border border-military-amber/50 rounded-sm">
                  <span className="font-ibm-mono text-xs font-bold text-military-amber">
                    Р{soldier.rank}
                  </span>
                </div>
              </div>

              {/* Expand indicator - always visible at bottom */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                <div className={cn(
                  'p-1.5 backdrop-blur-md rounded-full transition-all duration-300',
                  isExpanded
                    ? 'bg-military-amber/30 border border-military-amber/50'
                    : 'bg-military-dark/60 border border-military-rust/40'
                )}>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-military-amber" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-military-steel" />
                  )}
                </div>
              </div>

              {/* Stats panel - slides up from bottom on click/tap */}
              <div className={cn(
                'absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out z-20',
                isExpanded ? 'max-h-[60%]' : 'max-h-0'
              )}>
                <div className="backdrop-blur-md bg-military-dark/95 border-t border-military-rust/40 p-2">
                  {/* Quick stats row with icons */}
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    <div className="text-center p-1.5 bg-military-charcoal/50 rounded">
                      <Footprints className="w-3 h-3 mx-auto mb-0.5 text-military-amber/70" />
                      <div className="font-russo text-xs font-bold text-military-amber">{soldier.speed}</div>
                    </div>
                    <div className="text-center p-1.5 bg-military-charcoal/50 rounded">
                      <Target className="w-3 h-3 mx-auto mb-0.5 text-cyan-400/70" />
                      <div className="font-russo text-xs font-bold text-cyan-400">{soldier.range}</div>
                    </div>
                    <div className="text-center p-1.5 bg-military-charcoal/50 rounded">
                      <Zap className="w-3 h-3 mx-auto mb-0.5 text-red-400/70" />
                      <div className="font-russo text-xs font-bold text-red-400">{soldier.power}</div>
                    </div>
                    <div className="text-center p-1.5 bg-military-charcoal/50 rounded">
                      <Sword className="w-3 h-3 mx-auto mb-0.5 text-orange-400/70" />
                      <div className="font-russo text-xs font-bold text-orange-400">{soldier.melee}</div>
                    </div>
                    <div className="text-center p-1.5 bg-military-charcoal/50 rounded">
                      <Shield className="w-3 h-3 mx-auto mb-0.5 text-blue-400/70" />
                      <div className="font-russo text-xs font-bold text-blue-400">{soldier.armor}</div>
                    </div>
                  </div>

                  {/* Special props - if any */}
                  {soldier.props && soldier.props.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {soldier.props.map((prop, propIndex) => (
                        <span
                          key={propIndex}
                          className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono border border-green-500/30"
                        >
                          {prop}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hover scanline effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(234,88,12,0.03)_50%)] bg-[length:100%_4px]" />
              </div>

              {/* Corner bracket accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-military-rust/40" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-military-rust/40" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-military-rust/40" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-military-rust/40" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
