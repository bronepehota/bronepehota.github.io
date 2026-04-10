'use client';

import { useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Minus,
  ShieldOff,
  Snail,
  Crosshair,
  Frown,
  Eye,
  Sparkles,
  Flag,
  Radio,
  Sword,
  Shield,
  Syringe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuffDefinition, ActiveDebuff, DebuffTemplate } from '@/lib/modifier-types';

interface DebuffModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBuffs: BuffDefinition[];
  activeDebuffs: ActiveDebuff[];
  availableDebuffs: DebuffTemplate[];
  onAddDebuff: (debuff: DebuffTemplate) => void;
  onRemoveDebuff: (debuffId: string) => void;
  currentTurn?: number;
}

function getDebuffIcon(iconName?: string): React.ElementType {
  const iconMap: Record<string, React.ElementType> = {
    Snail,
    Crosshair,
    Frown,
    Eye,
    ShieldOff,
  };
  return (iconName && iconMap[iconName]) || ShieldOff;
}

function getBuffIcon(iconName?: string): React.ElementType {
  const iconMap: Record<string, React.ElementType> = {
    Flag,
    Radio,
    Sword,
    Shield,
    Syringe,
  };
  return (iconName && iconMap[iconName]) || Sparkles;
}

export function DebuffModal({
  isOpen,
  onClose,
  activeBuffs,
  activeDebuffs,
  availableDebuffs,
  onAddDebuff,
  onRemoveDebuff,
  currentTurn,
}: DebuffModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock
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

  // Escape key to close
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

  // Filter out debuffs that are already active
  const activeDebuffIds = new Set(activeDebuffs.map((d) => d.id));
  const inactiveDebuffs = availableDebuffs.filter((d) => !activeDebuffIds.has(d.id));

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="debuff-modal-title"
    >
      <div
        className="fixed bottom-0 left-0 right-0 md:relative md:max-w-lg bg-slate-900 rounded-t-3xl md:rounded-xl max-h-[85vh] md:max-h-[90vh] shadow-2xl flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle - mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
          <h2
            id="debuff-modal-title"
            className="text-sm font-bold uppercase tracking-wide text-slate-100"
          >
            Эффекты
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Active Buffs Section */}
          {activeBuffs.length > 0 && (
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2">
                БАФЫ
              </h3>
              <div className="space-y-2">
                {activeBuffs.map((buff) => {
                  const BuffIcon = getBuffIcon(buff.icon);
                  return (
                    <div
                      key={buff.id}
                      className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border-l-2 border-emerald-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <BuffIcon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-100 truncate">
                          {buff.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {buff.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Debuffs Section */}
          {activeDebuffs.length > 0 && (
            <div className={cn('px-4 pt-4 pb-2', activeBuffs.length > 0 ? 'border-t border-slate-700/50' : '')}>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-2">
                ДЕБАФЫ
              </h3>
              <div className="space-y-2">
                {activeDebuffs.map((debuff) => {
                  const DebuffIcon = getDebuffIcon(debuff.icon);
                  return (
                    <div
                      key={debuff.id}
                      className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border-l-2 border-red-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <DebuffIcon className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-100 truncate">
                          {debuff.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {debuff.description}
                        </div>
                        {currentTurn !== undefined && debuff.appliedAtTurn !== undefined && debuff.duration !== undefined && (
                          <div className={cn(
                            "text-[10px] mt-0.5",
                            // Highlight last turn in yellow/orange
                            currentTurn >= debuff.expiresAtTurn - 1 ? "text-amber-400" : "text-slate-500"
                          )}>
                            Ход {currentTurn - debuff.appliedAtTurn + 1}/{debuff.duration}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveDebuff(debuff.id)}
                        className="p-2 hover:bg-red-900/30 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                        aria-label={`Снять ${debuff.name}`}
                        title="Снять"
                      >
                        <Minus className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Debuffs Section */}
          {inactiveDebuffs.length > 0 && (
            <div className={cn(
              'px-4 pt-4 pb-4',
              (activeBuffs.length > 0 || activeDebuffs.length > 0) ? 'border-t border-slate-700/50' : ''
            )}>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                НАЗНАЧИТЬ
              </h3>
              <div className="space-y-2">
                {inactiveDebuffs.map((debuff) => {
                  const DebuffIcon = getDebuffIcon(debuff.icon);
                  return (
                    <div
                      key={debuff.id}
                      className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                        <DebuffIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-200 truncate">
                          {debuff.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {debuff.description}
                        </div>
                      </div>
                      <button
                        onClick={() => onAddDebuff(debuff)}
                        className="p-2 hover:bg-blue-900/30 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                        aria-label={`Назначить ${debuff.name}`}
                        title="Назначить"
                      >
                        <Plus className="w-4 h-4 text-blue-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {activeBuffs.length === 0 && activeDebuffs.length === 0 && inactiveDebuffs.length === 0 && (
            <div className="px-4 py-12 text-center">
              <ShieldOff className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Нет активных эффектов</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
