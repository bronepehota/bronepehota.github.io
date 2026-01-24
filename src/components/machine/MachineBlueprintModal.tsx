'use client';

import { X, ExternalLink, Shield, Zap, Target, Wrench } from 'lucide-react';
import { clsx } from 'clsx';
import type { Machine } from '@/lib/types';
import WeaponCard from './WeaponCard';
import StatBar from './StatBar';

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

  const factionColors = {
    polaris: {
      primary: 'text-red-400',
      secondary: 'text-red-300',
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      accent: 'border-red-500'
    },
    protectorate: {
      primary: 'text-cyan-400',
      secondary: 'text-cyan-300',
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-500/10',
      accent: 'border-cyan-500'
    },
    mercenaries: {
      primary: 'text-yellow-400',
      secondary: 'text-yellow-300',
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/10',
      accent: 'border-yellow-500'
    }
  };

  const colors = factionColors[machine.faction as keyof typeof factionColors];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={clsx(
          'relative w-full sm:max-w-lg sm:rounded-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto',
          'bg-slate-900 sm:border-t-4 sm:border border-slate-700 shadow-2xl',
          colors.border,
          'animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className={clsx('font-mono font-bold text-lg tracking-wider', colors.primary)}>
                {machine.name.toUpperCase()}
              </h2>
              <span className={clsx('px-2 py-0.5 text-xs font-mono border rounded', colors.border, colors.secondary)}>
                R{machine.rank}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Image with overlay */}
          <div className="relative h-48 sm:h-56 bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
            <img
              src={machine.image}
              alt={machine.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          </div>

          {/* Description */}
          {machine.description && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
              <p className="text-sm text-slate-300 leading-relaxed italic">
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
            <h3 className={clsx('font-mono text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
              <Wrench className="w-4 h-4" />
              Технические характеристики
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {machine.class && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2">
                  <span className="text-[10px] text-slate-500 font-mono block">КЛАСС</span>
                  <span className="text-sm text-slate-300">{machine.class}</span>
                </div>
              )}
              {machine.type && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2">
                  <span className="text-[10px] text-slate-500 font-mono block">ТИП</span>
                  <span className="text-sm text-slate-300">{machine.type}</span>
                </div>
              )}
              {machine.developer && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2">
                  <span className="text-[10px] text-slate-500 font-mono block">РАЗРАБОТЧИК</span>
                  <span className="text-sm text-slate-300 truncate">{machine.developer}</span>
                </div>
              )}
              {machine.monoblock && machine.monoblock !== '---' && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2">
                  <span className="text-[10px] text-slate-500 font-mono block">МОНОБЛОК</span>
                  <span className="text-sm text-slate-300">{machine.monoblock}</span>
                </div>
              )}
              {machine.mass && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2">
                  <span className="text-[10px] text-slate-500 font-mono block">МАССА</span>
                  <span className="text-sm text-slate-300">{machine.mass}</span>
                </div>
              )}
              {machine.crew && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2">
                  <span className="text-text-slate-500 font-mono block">ЭКИПАЖ</span>
                  <span className="text-sm text-slate-300">{machine.crew}</span>
                </div>
              )}
            </div>
          </div>

          {/* Вооружение */}
          <div>
            <h3 className={clsx('font-mono text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
              <Target className="w-4 h-4" />
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

          {/* Характеристики */}
          <div>
            <h3 className={clsx('font-mono text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2', colors.primary)}>
              <Zap className="w-4 h-4" />
              Характеристики
            </h3>
            <div className="space-y-3">
              <StatBar
                value={machine.currentDurability || machine.durability_max}
                max={machine.durability_max}
                icon={Shield}
                label="ПРОЧНОСТЬ"
                color={machine.faction === 'polaris' ? '#ef4444' : (machine.faction === 'protectorate' ? '#06b6d4' : '#eab308')}
              />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-2">
                  <span className="text-[10px] text-slate-500 font-mono block">ТЕМП</span>
                  <span className={clsx('text-lg font-bold', colors.primary)}>{machine.fire_rate}</span>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-2">
                  <span className="text-[10px] text-slate-500 font-mono block">БОЕЗАПАС</span>
                  <span className={clsx('text-lg font-bold', colors.primary)}>{machine.ammo_max}</span>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-2">
                  <span className="text-[10px] text-slate-500 font-mono block">СКОРОСТЬ</span>
                  <span className={clsx('text-lg font-bold', colors.primary)}>
                    {machine.speed_sectors?.[0]?.speed || '?'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 px-4 py-3 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-600 font-mono text-sm hover:bg-slate-800 transition-colors"
          >
            ЗАКРЫТЬ
          </button>
          <button
            onClick={() => onAdd(machine)}
            className={clsx(
              'flex-1 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider',
              'border transition-all hover:scale-105',
              colors.border,
              colors.bg,
              colors.accent
            )}
          >
            В АРМИЮ
          </button>
        </div>
      </div>
    </div>
  );
}
