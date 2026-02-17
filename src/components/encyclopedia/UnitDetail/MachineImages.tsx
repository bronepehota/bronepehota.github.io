'use client';

import { useState, useEffect } from 'react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Machine } from '@/lib/types';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MachineImagesProps {
  unit: UnitWithType;
}

export function MachineImages({ unit }: MachineImagesProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Only show for machines
  if (unit.type !== 'machine') {
    return null;
  }

  const machine = unit as Machine;

  // If no image, don't show the section
  if (!machine.image) {
    return null;
  }

  // Get max speed from speed sectors
  const maxSpeed = machine.speed_sectors[machine.speed_sectors.length - 1]?.speed || 0;

  return (
    <section id="machine-images" className="folded-paper military-corners p-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-4 h-4 text-military-rust/60" />
        <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
          DATA_VEHICLE
        </span>
      </div>

      <h3 className="font-russo text-xl text-white mb-6 flex items-center gap-3">
        <span className="text-military-amber">▲</span>
        Характеристики машины
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine image card */}
        <div
          className={cn(
            'relative aspect-[4/3] folded-paper military-corners overflow-hidden',
            'group hover:scale-[1.02] transition-transform duration-300',
            'fade-in-up opacity-0',
            isLoaded && 'opacity-100'
          )}
          style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}
        >
          {/* Machine image */}
          <div className="relative w-full h-full">
            <GitHubPagesImage
              src={machine.image}
              alt={machine.name}
              fill
              className="object-cover"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-military-dark/90 via-military-dark/20 to-transparent" />
          </div>

          {/* Rank badge - top right */}
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1 backdrop-blur-sm bg-military-amber/20 border border-military-amber/40 rounded-sm">
              <span className="font-ibm-mono text-xs font-bold text-military-amber">
                РАНГ {machine.rank}
              </span>
            </div>
          </div>

          {/* Scanline effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(234,88,12,0.05)_50%)] bg-[length:100%_4px]" />
          </div>

          {/* Corner bracket accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-military-rust/40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-military-rust/40" />
        </div>

        {/* Stats panel */}
        <div className="space-y-4">
          {/* Core stats */}
          <div
            className={cn(
              'folded-paper military-corners p-4',
              'fade-in-up opacity-0',
              isLoaded && 'opacity-100'
            )}
            style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                DATA_CORE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Durability */}
              <div className="text-center p-3 bg-military-charcoal/50 rounded">
                <div className="font-ibm-mono text-[10px] text-military-steel uppercase">Прочность</div>
                <div className="font-russo text-xl font-bold text-red-400">{machine.durability_max}</div>
              </div>
              {/* Speed */}
              <div className="text-center p-3 bg-military-charcoal/50 rounded">
                <div className="font-ibm-mono text-[10px] text-military-steel uppercase">Скорость</div>
                <div className="font-russo text-xl font-bold text-green-400">{maxSpeed}</div>
              </div>
              {/* Fire Rate */}
              <div className="text-center p-3 bg-military-charcoal/50 rounded">
                <div className="font-ibm-mono text-[10px] text-military-steel uppercase">Скорострельность</div>
                <div className="font-russo text-xl font-bold text-orange-400">{machine.fire_rate}</div>
              </div>
              {/* Ammo */}
              <div className="text-center p-3 bg-military-charcoal/50 rounded">
                <div className="font-ibm-mono text-[10px] text-military-steel uppercase">Боезапас</div>
                <div className="font-russo text-xl font-bold text-cyan-400">{machine.ammo_max}</div>
              </div>
            </div>
          </div>

          {/* Weapons */}
          <div
            className={cn(
              'folded-paper military-corners p-4',
              'fade-in-up opacity-0',
              isLoaded && 'opacity-100'
            )}
            style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                DATA_WEAPONS
              </span>
            </div>
            <div className="space-y-3">
              {machine.weapons.map((weapon, index) => (
                <div
                  key={index}
                  className="p-3 bg-military-charcoal/50 rounded border border-military-rust/20"
                >
                  <div className="font-russo text-sm font-bold text-white mb-2">{weapon.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="font-ibm-mono text-[8px] text-military-steel uppercase">Дальность</div>
                      <div className="font-ibm-mono text-xs text-cyan-400">{weapon.range}</div>
                    </div>
                    <div>
                      <div className="font-ibm-mono text-[8px] text-military-steel uppercase">Мощность</div>
                      <div className="font-ibm-mono text-xs text-red-400">{weapon.power}</div>
                    </div>
                    <div>
                      <div className="font-ibm-mono text-[8px] text-military-steel uppercase">Особое</div>
                      <div className="font-ibm-mono text-xs text-yellow-400">
                        {typeof weapon.special === 'string' ? weapon.special : weapon.special ? 'Да' : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Speed sectors */}
          <div
            className={cn(
              'folded-paper military-corners p-4',
              'fade-in-up opacity-0',
              isLoaded && 'opacity-100'
            )}
            style={{ animationFillMode: 'forwards', animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                DATA_SPEED_SECTORS
              </span>
            </div>
            <div className="space-y-2">
              {machine.speed_sectors.map((sector, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-military-charcoal/50 rounded text-sm"
                >
                  <span className="font-ibm-mono text-military-steel">
                    {sector.min_durability}-{sector.max_durability} █
                  </span>
                  <span className="font-russo font-bold text-green-400">{sector.speed} шаг</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
