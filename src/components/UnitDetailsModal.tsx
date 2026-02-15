'use client';

import { useEffect, useRef, useState } from 'react';
import { GitHubPagesImage as Image } from './GitHubPagesImage';
import { ImageModal } from './ImageModal';
import { X, Shield, Sword, Zap, Target, Gauge, ShieldCheck, Info, Cpu, Crosshair, Activity, Users, Sparkles } from 'lucide-react';
import type { Squad, Machine, Faction, Soldier, Weapon, SpeedSector } from '@/lib/types';
import { useBottomSheet } from '@/hooks/useBottomSheet';

interface UnitDetailsModalProps {
  unit: Squad | Machine;
  unitType: 'squad' | 'machine';
  faction: Faction;
  isOpen: boolean;
  onClose: () => void;
}

// T014: Create SoldierStats subcomponent to display individual soldier stats
interface SoldierStatsProps {
  soldier: Soldier;
  index: number;
  factionColor: string;
  onImageClick?: (src: string, alt: string) => void;
}

function SoldierStats({ soldier, index, factionColor, onImageClick }: SoldierStatsProps) {
  // T017: Tooltip/popover for special property explanation
  const propDescriptions: Record<string, string> = {
    'Г': 'Граната',
    'Сн': 'Снайпер',
    'Мед': 'Медик',
    'Инж': 'Инженер',
  };

  // T053: Add visual error indication for negative stat values (red color)
  const getStatColor = (value: number) => {
    if (value < 0) return 'text-red-400';
    return 'text-white';
  };

  return (
    <div className="bg-slate-700/40 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-600" style={{ color: factionColor }}>
            {index + 1}
          </span>
          Боец #{index + 1}
        </h4>
        {/* T018: Implement soldier image display alongside stats */}
        {soldier.image && (
          <button
            className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/30 transition-all active:scale-95"
            onClick={() => onImageClick?.(soldier.image!, `Боец ${index + 1}`)}
            aria-label={`Увеличить изображение бойца ${index + 1}`}
          >
            <Image
              src={soldier.image}
              alt={`Боец ${index + 1}`}
              width={48}
              height={64}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              unoptimized
            />
          </button>
        )}
      </div>

      {/* T015: Implement soldier stat display items (rank, speed, range, power, melee, armor) with icons */}
      {/* T052: Empty state handling for invalid data - check for negative/empty values */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Rank */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Shield className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Ранг</div>
            <div className={`text-sm font-bold ${getStatColor(soldier.rank)}`}>
              {soldier.rank >= 0 ? soldier.rank : 'Н/Д'}
            </div>
          </div>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Gauge className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Скорость</div>
            <div className={`text-sm font-bold ${getStatColor(soldier.speed)}`}>
              {soldier.speed >= 0 ? soldier.speed : 'Н/Д'}
            </div>
          </div>
        </div>

        {/* Range - T033: Dice notation formatting with monospace font */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Target className="w-4 h-4 text-green-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Дальность</div>
            <div className={`text-sm font-mono font-bold ${soldier.range ? 'text-green-400' : 'text-red-400'}`}>
              {soldier.range || 'Н/Д'}
            </div>
          </div>
        </div>

        {/* Power - T033: Dice notation formatting with monospace font */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Мощь</div>
            <div className={`text-sm font-mono font-bold ${soldier.power ? 'text-orange-400' : 'text-red-400'}`}>
              {soldier.power || 'Н/Д'}
            </div>
          </div>
        </div>

        {/* Melee */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Sword className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Бой</div>
            <div className={`text-sm font-bold ${getStatColor(soldier.melee)}`}>
              {soldier.melee >= 0 ? soldier.melee : 'Н/Д'}
            </div>
          </div>
        </div>

        {/* Armor */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <ShieldCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Защита</div>
            <div className={`text-sm font-bold ${getStatColor(soldier.armor)}`}>
              {soldier.armor >= 0 ? soldier.armor : 'Н/Д'}
            </div>
          </div>
        </div>
      </div>

      {/* T016: Implement special properties (props) display as badges with visual highlighting */}
      {soldier.props && soldier.props.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {soldier.props.map((prop, propIndex) => (
            <div
              key={propIndex}
              className="group relative inline-flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-lg px-2 py-1 transition-colors"
              title={propDescriptions[prop] || prop}
            >
              <span className="text-xs font-bold text-blue-400 font-mono">{prop}</span>
              <Info className="w-3 h-3 text-blue-400 opacity-50" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// T026: Create MachineStats subcomponent to display basic machine stats
interface MachineStatsProps {
  machine: Machine;
  factionColor: string;
}

function MachineStats({ machine, factionColor }: MachineStatsProps) {
  return (
    <div className="bg-slate-700/40 rounded-xl p-4 border border-slate-600/50">
      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
        <Cpu className="w-5 h-5" style={{ color: factionColor }} />
        Характеристики
      </h3>
      {/* T027: Implement machine stat display items (rank, fire_rate, ammo_max, durability_max) with icons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Rank */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Shield className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Ранг</div>
            <div className="text-sm font-bold text-white">{machine.rank}</div>
          </div>
        </div>

        {/* Fire Rate */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Crosshair className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Скоростр.</div>
            <div className="text-sm font-bold text-white">{machine.fire_rate}</div>
          </div>
        </div>

        {/* Ammo Max */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Activity className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Боезапас</div>
            <div className="text-sm font-bold text-white">{machine.ammo_max}</div>
          </div>
        </div>

        {/* Durability Max */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <ShieldCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Прочность</div>
            <div className="text-sm font-bold text-white">{machine.durability_max}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// T028: Create SpeedSectorsTable subcomponent to display speed ranges in table format
interface SpeedSectorsTableProps {
  speedSectors: SpeedSector[];
}

function SpeedSectorsTable({ speedSectors }: SpeedSectorsTableProps) {
  if (speedSectors.length === 0) {
    // T030: Add empty state message when speed_sectors array is empty
    return (
      <div className="text-center py-4 text-slate-400">
        Нет данных о скорости
      </div>
    );
  }

  return (
    <div className="bg-slate-700/40 rounded-xl p-4 border border-slate-600/50">
      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
        <Gauge className="w-5 h-5 text-blue-400" />
        Секторы скорости
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="text-left py-2 px-3 text-slate-400 font-semibold">Прочность</th>
              <th className="text-left py-2 px-3 text-slate-400 font-semibold">Скорость</th>
            </tr>
          </thead>
          <tbody>
            {speedSectors.map((sector, index) => (
              // T029: Implement speed sector display (min-max durability range, speed value)
              <tr key={index} className="border-b border-slate-700/50 last:border-0">
                <td className="py-2 px-3 text-white font-mono">
                  {sector.min_durability}-{sector.max_durability}
                </td>
                <td className="py-2 px-3 text-white font-bold">
                  {sector.speed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// T031: Create WeaponCard subcomponent to display individual weapon details
interface WeaponCardProps {
  weapon: Weapon;
  index: number;
}

function WeaponCard({ weapon, index: _index }: WeaponCardProps) {
  return (
    <div className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/50 hover:border-slate-500/50 transition-all">
      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-red-400" />
        {weapon.name}
      </h4>
      {/* T032: Implement weapon display (name, range, power, special rules) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Range - T033: Dice notation formatting with monospace font */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Target className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase text-slate-500 font-bold">Дальность</div>
            <div className="text-xs font-mono font-bold text-green-400">{weapon.range}</div>
          </div>
        </div>

        {/* Power - T033: Dice notation formatting with monospace font */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
          <Zap className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase text-slate-500 font-bold">Мощь</div>
            <div className="text-xs font-mono font-bold text-orange-400">{weapon.power}</div>
          </div>
        </div>
      </div>

      {/* Special rules */}
      {weapon.special && (
        <div className="mt-2 text-xs text-slate-400 italic">
          {typeof weapon.special === 'string' ? weapon.special : JSON.stringify(weapon.special)}
        </div>
      )}
    </div>
  );
}

// Key stats card component for bottom sheet hero section
interface KeyStatsCardProps {
  unit: Squad | Machine;
  unitType: 'squad' | 'machine';
  factionColor: string;
}

function KeyStatsCard({ unit, unitType, factionColor }: KeyStatsCardProps) {
  if (unitType === 'squad') {
    const squad = unit as Squad;
    const soldierCount = squad.soldiers.length;
    const armorValues = squad.soldiers.map(s => s.armor).filter(a => a >= 0);
    const avgArmor = armorValues.length > 0
      ? Math.round(armorValues.reduce((a, b) => a + b, 0) / armorValues.length)
      : 0;
    const allProps = squad.soldiers.flatMap(s => s.props || []);
    const uniqueProps = Array.from(new Set(allProps));

    return (
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5">
          <Users className="w-4 h-4" style={{ color: factionColor }} />
          <span className="text-sm font-semibold text-white">{soldierCount} бойцов</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Защита {avgArmor}</span>
        </div>
        {uniqueProps.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">{uniqueProps.join(', ')}</span>
          </div>
        )}
      </div>
    );
  } else {
    const machine = unit as Machine;
    return (
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5">
          <Activity className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">{machine.ammo_max} боезапас</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">{machine.durability_max} прочность</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5">
          <Crosshair className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-white">{machine.weapons.length} вооружение</span>
        </div>
      </div>
    );
  }
}

// Compact stat row for mobile-friendly display
export function UnitDetailsModal({
  unit,
  unitType,
  faction,
  isOpen,
  onClose,
}: UnitDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');

  const handleImageClick = (src: string, alt: string) => {
    setModalImageSrc(src);
    setModalImageAlt(alt);
    setImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
  };

  // Bottom sheet hook for swipe-down gesture on mobile
  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: isOpen,
  });

  // Body scroll lock when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key to close functionality
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Click-outside-to-close functionality
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Bottom sheet container - mobile: fixed at bottom, desktop: centered card */}
      <div
        ref={sheetRef}
        {...touchHandlers}
        className="fixed bottom-0 left-0 right-0 md:relative md:max-w-2xl bg-slate-800 rounded-t-3xl md:rounded-xl max-h-[85vh] md:max-h-[90vh] shadow-2xl flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle - visible on mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
        </div>

        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-white transition-colors z-10"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Закрыть"
        >
          <X size={20} className="md:hidden" />
          <X size={24} className="hidden md:block" />
        </button>

        {/* Hero section with image, name, cost */}
        <div className="relative px-4 pt-2 pb-4 md:p-6 md:pb-4 border-b border-slate-700">
          {unit.image ? (
            /* Squad has image - show single large image */
            <div className="flex justify-center mb-4 md:absolute md:right-16 md:top-1/2 md:-translate-y-1/2 md:mb-0 md:opacity-20">
              <Image
                src={unit.image}
                alt={unit.name}
                width={128}
                height={128}
                className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                unoptimized
              />
            </div>
          ) : unitType === 'squad' ? (
            /* Squad fallback: show soldier grid */
            (() => {
              const squad = unit as Squad;
              const soldiersWithImages = squad.soldiers.filter(s => s.image);

              if (soldiersWithImages.length === 0) {
                /* No soldier images - show placeholder */
                return (
                  <div className="flex justify-center mb-4 md:absolute md:right-16 md:top-1/2 md:-translate-y-1/2 md:mb-0 md:opacity-20">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl shadow-lg bg-slate-800 flex items-center justify-center">
                      <Shield className="w-12 h-12 text-slate-600" />
                    </div>
                  </div>
                );
              }

              /* Show soldier images in tactical grid layout */
              const displayCount = Math.min(soldiersWithImages.length, 4);
              const gridClass = displayCount === 1 ? 'grid-cols-1' :
                                displayCount === 2 ? 'grid-cols-2' :
                                'grid-cols-2';

              return (
                <div className="flex justify-center mb-4 md:absolute md:right-16 md:top-1/2 md:-translate-y-1/2 md:mb-0 md:opacity-20">
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-xl shadow-lg bg-slate-800 overflow-hidden grid ${gridClass} gap-0.5`}>
                    {soldiersWithImages.slice(0, 4).map((soldier, idx) => (
                      <div key={idx} className="relative bg-slate-900 overflow-hidden">
                        <Image
                          src={soldier.image!}
                          alt={`${squad.name} - боец ${soldier.num || idx + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          ) : null}

          <div className="text-center md:text-left md:pr-12">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2" style={{ backgroundColor: `${faction.color}20`, color: faction.color }}>
              {unitType === 'squad' ? 'Отряд' : 'Машина'}
            </div>

            <h2
              id="modal-title"
              className="text-xl md:text-2xl font-bold text-white mb-1"
            >
              {unit.name}
            </h2>

            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-2xl font-bold" style={{ color: faction.color }}>
                {unit.cost}
              </span>
              <span className="text-slate-400">очков</span>
            </div>

            {/* Key stats card */}
            <KeyStatsCard unit={unit} unitType={unitType} factionColor={faction.color} />
          </div>
        </div>

        {/* Scrollable content area */}
        <div key={`${unitType}-${unit.id}`} className="flex-1 overflow-y-auto p-4 md:p-6 animate-fadeIn">
          {unitType === 'squad' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: faction.color }} />
                Состав отряда
              </h3>

              {(unit as Squad).soldiers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Нет данных о солдатах
                </div>
              ) : (
                <div className="space-y-3">
                  {(unit as Squad).soldiers.map((soldier, index) => (
                    <SoldierStats
                      key={index}
                      soldier={soldier}
                      index={index}
                      factionColor={faction.color}
                      onImageClick={handleImageClick}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Machine basic stats */}
              <MachineStats machine={unit as Machine} factionColor={faction.color} />

              {/* Speed sectors table */}
              <SpeedSectorsTable speedSectors={(unit as Machine).speed_sectors} />

              {/* Weapons list */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Sword className="w-5 h-5" style={{ color: faction.color }} />
                  Вооружение
                </h3>

                {(unit as Machine).weapons.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    Нет вооружения
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(unit as Machine).weapons.map((weapon, index) => (
                      <WeaponCard key={index} weapon={weapon} index={index} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ImageModal
        src={modalImageSrc}
        alt={modalImageAlt}
        isOpen={imageModalOpen}
        onClose={handleCloseImageModal}
      />
    </div>
  );
}