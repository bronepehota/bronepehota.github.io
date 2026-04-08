'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Sparkles, ShieldOff, Star, Infinity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuffDefinition, DebuffTemplate, SoldierModifier, ActiveBuff, ActiveDebuff } from '@/lib/modifier-types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';

type CatalogItem = BuffDefinition | DebuffTemplate;

// Unified display type for all active effects
interface ActiveEffectEntry {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: 'static' | 'tempBuff' | 'soldierMod' | 'debuff';
  isPermanent: boolean;
  turnInEffect?: number;
  duration?: number;
  isLastTurn?: boolean;
  removable: boolean;
  modifierId?: string;
}

interface SoldierEffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soldierModifiers: SoldierModifier[];
  activeBuffs: ActiveBuff[];
  activeDebuffs: ActiveDebuff[];
  staticBuffs: BuffDefinition[];
  availableBuffs: BuffDefinition[];
  availableDebuffs: DebuffTemplate[];
  availableAbilities: BuffDefinition[];
  currentTurn: number;
  abilitiesUsed: string[];
  onApplyModifier: (item: CatalogItem, tabType: Tab) => void;
  onRemoveModifier: (modifierId: string) => void;
  soldierName: string;
}

type Tab = 'buffs' | 'debuffs' | 'abilities';

const EFFECT_STYLES: Record<ActiveEffectEntry['type'], { border: string; bg: string; icon: string; label: string }> = {
  static: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-950/20',
    icon: 'text-emerald-400',
    label: 'text-emerald-500',
  },
  tempBuff: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-950/20',
    icon: 'text-amber-400',
    label: 'text-amber-500',
  },
  soldierMod: {
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-950/20',
    icon: 'text-cyan-400',
    label: 'text-cyan-500',
  },
  debuff: {
    border: 'border-l-red-500',
    bg: 'bg-red-950/20',
    icon: 'text-red-400',
    label: 'text-red-500',
  },
};

const TAB_CONFIG: { key: Tab; label: string; icon: typeof Sparkles; activeClass: string }[] = [
  { key: 'buffs', label: 'Бафы', icon: Sparkles, activeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' },
  { key: 'debuffs', label: 'Дебафы', icon: ShieldOff, activeClass: 'bg-red-500/15 text-red-400 border-red-500/40' },
  { key: 'abilities', label: 'Способности', icon: Star, activeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40' },
];

export function SoldierEffectsModal({
  isOpen,
  onClose,
  soldierModifiers,
  activeBuffs,
  activeDebuffs,
  staticBuffs,
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
  const [catalogOpen, setCatalogOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCatalogOpen(false);
    }
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

  if (!isOpen) return null;

  // Merge all active effects into unified list
  const allActive: ActiveEffectEntry[] = [
    ...staticBuffs.map(b => ({
      id: `static_${b.id}`,
      name: b.name,
      description: b.description,
      icon: b.icon,
      type: 'static' as const,
      isPermanent: true,
      removable: false,
    })),
    ...activeBuffs.map(b => {
      const turnInEffect = currentTurn ? currentTurn - b.appliedAtTurn + 1 : 1;
      const isLastTurn = currentTurn ? currentTurn >= b.expiresAtTurn - 1 : false;
      return {
        id: `buff_${b.id}`,
        name: b.name,
        description: b.description,
        icon: b.icon,
        type: 'tempBuff' as const,
        isPermanent: false,
        turnInEffect,
        duration: b.duration,
        isLastTurn,
        removable: false,
      };
    }),
    ...soldierModifiers.map(m => {
      const isPermanent = !m.duration;
      const turnInEffect = !isPermanent && currentTurn ? currentTurn - m.appliedAtTurn + 1 : undefined;
      const isLastTurn = !isPermanent && currentTurn && m.expiresAtTurn ? currentTurn >= m.expiresAtTurn - 1 : false;
      return {
        id: `mod_${m.id}`,
        name: m.name,
        description: m.description,
        icon: m.icon,
        type: 'soldierMod' as const,
        isPermanent,
        turnInEffect,
        duration: m.duration,
        isLastTurn,
        removable: true,
        modifierId: m.id,
      };
    }),
    ...activeDebuffs.map(d => {
      const turnInEffect = currentTurn ? currentTurn - d.appliedAtTurn + 1 : 1;
      const isLastTurn = currentTurn ? currentTurn >= d.expiresAtTurn - 1 : false;
      return {
        id: `debuff_${d.id}`,
        name: d.name,
        description: d.description,
        icon: d.icon,
        type: 'debuff' as const,
        isPermanent: false,
        turnInEffect,
        duration: d.duration,
        isLastTurn,
        removable: false,
      };
    }),
  ];

  const catalog: CatalogItem[] = tab === 'buffs'
    ? availableBuffs
    : tab === 'debuffs'
      ? availableDebuffs
      : availableAbilities;

  // Extract catalog IDs from activeDebuffs (format: `${catalogId}_${timestamp}`)
  const activeDebuffCatalogIds = activeDebuffs.map(d => {
    const lastUnderscore = d.id.lastIndexOf('_');
    if (lastUnderscore !== -1 && /^\d+$/.test(d.id.slice(lastUnderscore + 1))) {
      return d.id.slice(0, lastUnderscore);
    }
    return d.id;
  });

  const usedCatalogIds = new Set([
    ...soldierModifiers.filter(m => m.catalogId).map(m => m.catalogId!),
    ...abilitiesUsed,
    ...activeDebuffCatalogIds,
  ]);

  const hasActiveEffects = allActive.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="effects-modal-title"
    >
      <div
        className="fixed bottom-0 left-0 right-0 md:relative md:max-w-md bg-slate-900 rounded-t-2xl md:rounded-xl max-h-[90vh] md:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-700/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        <div className="flex justify-center pt-3 pb-1.5 md:hidden">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
            <h2
              id="effects-modal-title"
              className="text-sm font-bold uppercase tracking-wider text-slate-200"
            >
              {soldierName}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* ─── Scrollable body ─── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* ─── ACTIVE EFFECTS ─── */}
          {hasActiveEffects ? (
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700/60 to-transparent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
                  Активные
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-slate-700/60 to-transparent" />
              </div>
              <div className="space-y-2">
                {allActive.map((effect) => {
                  const style = EFFECT_STYLES[effect.type];
                  return (
                    <div
                      key={effect.id}
                      className={cn(
                        'flex items-center gap-3 pl-3 pr-1.5 py-2.5 rounded-lg border-l-[3px]',
                        style.border,
                        style.bg,
                        effect.isLastTurn && 'animate-pulse-subtle',
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800/70',
                      )}>
                        <ModifierIcon name={effect.icon} size={16} className={style.icon} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-100 truncate leading-tight">
                          {effect.name}
                        </div>
                        {effect.description && (
                          <div className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                            {effect.description}
                          </div>
                        )}
                      </div>

                      {/* Duration badge */}
                      <div className="flex-shrink-0 self-start mt-0.5">
                        {effect.isPermanent ? (
                          <div className={cn('flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-bold', style.label)}>
                            <Infinity className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono',
                            effect.isLastTurn
                              ? (effect.type === 'debuff'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400')
                              : cn('bg-slate-800/60', style.label),
                          )}>
                            <Clock className="w-3 h-3" />
                            {effect.turnInEffect}/{effect.duration}
                          </div>
                        )}
                      </div>

                      {/* Remove button — full 44px touch target */}
                      {effect.removable && effect.modifierId && (
                        <button
                          onClick={() => onRemoveModifier(effect.modifierId!)}
                          className="p-2.5 hover:bg-red-900/40 active:bg-red-900/60 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 -my-1.5"
                          aria-label={`Снять ${effect.name}`}
                        >
                          <X className="w-4 h-4 text-red-400/70" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Нет активных эффектов</p>
            </div>
          )}

          {/* ─── CATALOG TOGGLE ─── */}
          <div className="px-3 pb-1">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all min-h-[44px]',
                catalogOpen
                  ? 'bg-slate-800/60 border-slate-600/50'
                  : 'bg-slate-800/30 border-slate-700/30 active:bg-slate-800/50',
              )}
            >
              <div className="flex items-center gap-2.5">
                <Plus className={cn('w-4 h-4 transition-transform', catalogOpen ? 'rotate-45 text-slate-400' : 'text-slate-500')} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Добавить эффект
                </span>
              </div>
              <div className="flex gap-1.5">
                {availableBuffs.length > 0 && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                {availableDebuffs.length > 0 && <div className="w-2 h-2 rounded-full bg-red-500" />}
                {availableAbilities.length > 0 && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
              </div>
            </button>
          </div>

          {/* ─── CATALOG SECTION ─── */}
          {catalogOpen && (
            <div className="px-3 pb-4">
              {/* Tab pills */}
              <div className="flex gap-2 mb-3 mt-2">
                {TAB_CONFIG.map(t => {
                  const Icon = t.icon;
                  const isActive = tab === t.key;
                  const count = t.key === 'buffs' ? availableBuffs.length
                    : t.key === 'debuffs' ? availableDebuffs.length
                    : availableAbilities.length;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all flex-1 justify-center min-h-[44px]',
                        isActive
                          ? t.activeClass
                          : 'border-slate-700/40 text-slate-500 active:bg-slate-800/40',
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                      {count > 0 && (
                        <span className={cn(
                          'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded',
                          isActive ? 'bg-slate-800/40' : 'bg-slate-800/40 text-slate-500',
                        )}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Catalog items */}
              {catalog.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Star className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Нет доступных эффектов</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {catalog.map(item => {
                    const isUsed = usedCatalogIds.has(item.id);
                    const tabStyle = tab === 'buffs' ? 'text-emerald-400'
                      : tab === 'debuffs' ? 'text-red-400'
                      : 'text-cyan-400';
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 pl-3 pr-1.5 py-2.5 rounded-lg border transition-all',
                          isUsed
                            ? 'border-slate-800/30 bg-slate-900/30 opacity-35'
                            : 'border-slate-700/30 bg-slate-800/30 active:bg-slate-800/50',
                        )}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-700/40">
                          <ModifierIcon name={item.icon} size={16} className={tabStyle} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn('text-sm font-semibold truncate leading-tight', isUsed ? 'text-slate-500 line-through' : 'text-slate-200')}>
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-600 truncate leading-tight mt-0.5">
                            {item.description}
                          </div>
                        </div>
                        {isUsed ? (
                          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-slate-600">✓</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onApplyModifier(item, tab)}
                            className="p-2.5 hover:bg-blue-900/30 active:bg-blue-900/50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 -my-1.5"
                            aria-label={`Применить ${item.name}`}
                          >
                            <Plus className="w-4 h-4 text-blue-400/80" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
