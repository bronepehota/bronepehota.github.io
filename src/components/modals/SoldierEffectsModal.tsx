'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Sparkles, ShieldOff, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuffDefinition, DebuffTemplate, SoldierModifier } from '@/lib/modifier-types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';

type CatalogItem = BuffDefinition | DebuffTemplate;

interface SoldierEffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soldierModifiers: SoldierModifier[];
  availableBuffs: BuffDefinition[];
  availableDebuffs: DebuffTemplate[];
  availableAbilities: BuffDefinition[];
  currentTurn: number;
  abilitiesUsed: string[];          // "catalogId" keys consumed this battle for this soldier
  onApplyModifier: (item: CatalogItem) => void;
  onRemoveModifier: (modifierId: string) => void;
  soldierName: string;
}

type Tab = 'buffs' | 'debuffs' | 'abilities';

export function SoldierEffectsModal({
  isOpen,
  onClose,
  soldierModifiers,
  availableBuffs,
  availableDebuffs,
  availableAbilities,
  currentTurn,
  abilitiesUsed,
  onApplyModifier,
  onRemoveModifier,
  soldierName,
}: SoldierEffectsModalProps) {
  const [tab, setTab] = useState<Tab>('buffs');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) closeButtonRef.current.focus();
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const catalog: CatalogItem[] = tab === 'buffs'
    ? availableBuffs
    : tab === 'debuffs'
      ? availableDebuffs
      : availableAbilities;

  const usedCatalogIds = new Set([
    ...soldierModifiers.filter(m => m.catalogId).map(m => m.catalogId!),
    ...abilitiesUsed,
  ]);

  const tabConfig: { key: Tab; label: string; icon: typeof Sparkles; count: number; activeClass: string }[] = [
    { key: 'buffs', label: 'БАФЫ', icon: Sparkles, count: availableBuffs.length, activeClass: 'text-emerald-400 border-b-2 border-emerald-500' },
    { key: 'debuffs', label: 'ДЕБАФЫ', icon: ShieldOff, count: availableDebuffs.length, activeClass: 'text-red-400 border-b-2 border-red-500' },
    { key: 'abilities', label: 'СПОСОБНОСТИ', icon: Star, count: availableAbilities.length, activeClass: 'text-cyan-400 border-b-2 border-cyan-500' },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="effects-modal-title"
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
            id="effects-modal-title"
            className="text-sm font-bold uppercase tracking-wide text-slate-100"
          >
            Эффекты: {soldierName}
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

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 flex-shrink-0">
          {tabConfig.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex-1 px-3 py-2.5 text-xs font-semibold transition-all relative',
                  isActive ? t.activeClass : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <div className="flex items-center justify-center gap-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    isActive
                      ? t.key === 'buffs' ? 'bg-emerald-500/20 text-emerald-400'
                        : t.key === 'debuffs' ? 'bg-red-500/20 text-red-400'
                        : 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-700 text-slate-500'
                  )}>
                    {t.count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Active modifiers */}
          {soldierModifiers.length > 0 && (
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-2">
                АКТИВНЫЕ
              </h3>
              <div className="space-y-2">
                {soldierModifiers.map(mod => {
                  const isPermanent = !mod.duration;
                  const turnInEffect = currentTurn - mod.appliedAtTurn + 1;
                  const isLastTurn = !isPermanent && currentTurn >= (mod.expiresAtTurn ?? 0) - 1;
                  return (
                    <div
                      key={mod.id}
                      className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border-l-2 border-amber-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <ModifierIcon name={mod.icon} size={16} className={isPermanent ? 'text-cyan-400' : 'text-amber-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-100 truncate">{mod.name}</div>
                        {mod.description && (
                          <div className="text-xs text-slate-400 truncate">{mod.description}</div>
                        )}
                        {isPermanent ? (
                          <div className="text-[10px] mt-0.5 text-cyan-500">Постоянная</div>
                        ) : (
                          <div className={cn(
                            'text-[10px] mt-0.5',
                            isLastTurn ? 'text-amber-400' : 'text-slate-500'
                          )}>
                            Ход {turnInEffect}/{mod.duration}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveModifier(mod.id)}
                        className="p-2 hover:bg-red-900/30 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                        aria-label={`Снять ${mod.name}`}
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

          {/* Catalog items */}
          <div className={cn(
            'px-4 pt-4 pb-4',
            soldierModifiers.length > 0 ? 'border-t border-slate-700/50' : ''
          )}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              ДОСТУПНЫ
            </h3>
            {catalog.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Star className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Нет доступных эффектов</p>
              </div>
            ) : (
              <div className="space-y-2">
                {catalog.map(item => {
                  const isUsed = usedCatalogIds.has(item.id);
                  const iconColor = tab === 'buffs' ? 'text-emerald-500'
                    : tab === 'debuffs' ? 'text-red-400'
                    : 'text-cyan-400';
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border transition-colors',
                        isUsed
                          ? 'border-slate-800/50 opacity-40'
                          : 'border-slate-700/50 hover:border-slate-600'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                        <ModifierIcon name={item.icon} size={16} className={iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-200 truncate">{item.name}</div>
                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                      </div>
                      {isUsed ? (
                        <div className="min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 text-slate-600 text-[10px] font-bold uppercase">
                          ✓
                        </div>
                      ) : (
                        <button
                          onClick={() => onApplyModifier(item)}
                          className="p-2 hover:bg-blue-900/30 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                          aria-label={`Применить ${item.name}`}
                          title="Применить"
                        >
                          <Plus className="w-4 h-4 text-blue-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
