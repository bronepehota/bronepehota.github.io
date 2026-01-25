'use client';

import { X, ExternalLink, Shield, Zap, Target, Wrench, ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import type { Machine } from '@/lib/types';
import WeaponCard from './WeaponCard';
import { cn } from '@/lib/utils';

interface MachineBlueprintModalProps {
  machine: Machine;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (machine: Machine) => void;
}

export default function MachineBlueprintModal({
  machine,
  isOpen,
  onClose,
  onAdd
}: MachineBlueprintModalProps) {
  if (!isOpen) return null;

  const getFactionColor = () => {
    const colorMap = {
      polaris: {
        primary: 'text-red-400',
        border: 'border-red-600/40',
        bg: 'bg-red-950/20',
        accent: 'border-red-500'
      },
      protectorate: {
        primary: 'text-cyan-400',
        border: 'border-cyan-600/40',
        bg: 'bg-cyan-950/20',
        accent: 'border-cyan-500'
      },
      mercenaries: {
        primary: 'text-yellow-400',
        border: 'border-yellow-600/40',
        bg: 'bg-yellow-950/20',
        accent: 'border-yellow-500'
      }
    };
    return colorMap[machine.faction as keyof typeof colorMap] || colorMap.polaris;
  };

  const colors = getFactionColor();

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className={cn(
          "w-full sm:max-w-[600px] bg-slate-900/90 backdrop-blur-sm border-t-2 sm:border-2 shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col relative",
          colors.border
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner accents */}
        <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 z-10", colors.accent)} />
        <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 z-10", colors.accent)} />
        <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 z-10", colors.accent)} />
        <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 z-10", colors.accent)} />

        {/* Tech Header */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-800/50 shrink-0 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/80 rounded-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700/50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className={cn("font-mono font-bold text-sm sm:text-base uppercase tracking-wider truncate", colors.primary)}>
                {machine.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className={cn("px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono border rounded-sm", colors.border, colors.bg, colors.primary)}>
                  R{machine.rank}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono">
                  {machine.cost} ОЧК.
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/80 rounded-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700/50"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Image with tech frame */}
          <div className="relative h-40 sm:h-48 bg-slate-800/50 rounded-sm overflow-hidden border-2 border-slate-700/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={machine.image}
              alt={machine.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            {/* Tech overlay corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-slate-600/30" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-slate-600/30" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-slate-600/30" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-slate-600/30" />
          </div>

          {/* Description */}
          {machine.description && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-sm p-3 relative">
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-slate-600/40" />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-slate-600/40" />
              <p className="text-sm text-slate-300 leading-relaxed">
                "{machine.description}"
              </p>
              {machine.sourceUrl && (
                <a
                  href={machine.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Подробнее
                </a>
              )}
            </div>
          )}

          {/* Технические характеристики */}
          <div>
            <h3 className={cn('font-mono text-[10px] sm:text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Технические характеристики
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {machine.class && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">КЛАСС</span>
                  <span className="text-sm text-slate-300">{machine.class}</span>
                </div>
              )}
              {machine.type && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">ТИП</span>
                  <span className="text-sm text-slate-300">{machine.type}</span>
                </div>
              )}
              {machine.developer && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">РАЗРАБОТЧИК</span>
                  <span className="text-sm text-slate-300 truncate">{machine.developer}</span>
                </div>
              )}
              {machine.monoblock && machine.monoblock !== '---' && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">МОНОБЛОК</span>
                  <span className="text-sm text-slate-300">{machine.monoblock}</span>
                </div>
              )}
              {machine.mass && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">МАССА</span>
                  <span className="text-sm text-slate-300">{machine.mass}</span>
                </div>
              )}
              {machine.crew && (
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-3 py-2">
                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono block">ЭКИПАЖ</span>
                  <span className="text-sm text-slate-300">{machine.crew}</span>
                </div>
              )}
            </div>
          </div>

          {/* Вооружение */}
          <div>
            <h3 className={cn('font-mono text-[10px] sm:text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Вооружение ({machine.weapons?.length || 0})
            </h3>
            <div className="space-y-2">
              {machine.weapons?.map((weapon, index) => (
                <WeaponCard
                  key={index}
                  weapon={weapon}
                  faction={machine.faction}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Характеристики - Tech Layout */}
          <div>
            <h3 className={cn('font-mono text-[10px] sm:text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Характеристики
            </h3>
            <div className="space-y-3">
              {/* Segmented Durability Bar */}
              <div className="relative bg-slate-900/60 p-2 rounded-sm border border-slate-700/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] sm:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Прочность
                  </span>
                  <span className={cn("text-sm sm:text-base font-mono font-black", colors.primary)}>
                    {machine.durability_max}
                  </span>
                </div>
                <div className="flex items-center gap-px">
                  {Array.from({ length: machine.durability_max }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 rounded-sm transition-all flex-1",
                        machine.faction === 'polaris' ? "bg-red-500" :
                        machine.faction === 'protectorate' ? "bg-cyan-500" :
                        "bg-yellow-500"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Stats Grid - Responsive */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-2 py-2">
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono block">ТЕМП</span>
                  <span className={cn('text-base sm:text-lg font-bold', colors.primary)}>{machine.fire_rate}</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-2 py-2">
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono block">БОЕЗАПАС</span>
                  <span className={cn('text-base sm:text-lg font-bold', colors.primary)}>{machine.ammo_max}</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-sm px-2 py-2">
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono block">СКОРОСТЬ</span>
                  <span className={cn('text-base sm:text-lg font-bold', colors.primary)}>
                    {machine.speed_sectors?.[0]?.speed || '?'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions - Tech Controls */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 px-3 py-2 sm:px-4 sm:py-3 flex gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-700 font-mono text-xs sm:text-sm hover:bg-slate-800/60 transition-colors rounded-sm min-h-[44px]"
          >
            ЗАКРЫТЬ
          </button>
          <button
            onClick={() => onAdd(machine)}
            className={cn(
              'flex-1 px-3 py-2.5 sm:px-4 sm:py-3 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider',
              'border-2 transition-all hover:scale-[1.02] active:scale-95 rounded-sm min-h-[44px]',
              colors.border,
              colors.bg,
              colors.primary
            )}
          >
            В АРМИЮ
          </button>
        </div>
      </div>
    </div>
  );
}
