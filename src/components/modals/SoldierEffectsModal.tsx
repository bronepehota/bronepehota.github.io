'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Sparkles, Star, Infinity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuffDefinition, DebuffTemplate, SoldierModifier, ActiveBuff, ActiveDebuff } from '@/lib/modifier-types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';
import { getEffectStyles } from '@/lib/effect-colors';

type CatalogItem = BuffDefinition | DebuffTemplate;

// Display type for all active effects
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
  section: 'properties' | 'combat';
  isDebuff?: boolean;
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
  onApplyModifier: (item: CatalogItem, tabType: 'buffs' | 'debuffs' | 'abilities') => void;
  onRemoveModifier: (modifierId: string) => void;
  soldierName: string;
}

type Tab = 'buffs' | 'debuffs' | 'abilities';

// ─── Section header ───
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
      <div className="h-px flex-1 bg-gradient-to-r from-slate-700/60 to-transparent" />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-slate-700/60 to-transparent" />
    </div>
  );
}

// ─── Effect card (unique color per effect) ───
function EffectCard({
  effect,
  onRemove,
}: {
  effect: ActiveEffectEntry;
  onRemove: (id: string) => void;
}) {
  const styles = getEffectStyles(effect.id);
  const isLastTurn = effect.isLastTurn;

  // Effect card (properties, combat effects, static buffs, active buffs/debuffs)
  return (
    <div
      className={cn(
        'flex items-center gap-3 pl-3 pr-1.5 py-2.5 rounded-lg border-l-[3px]',
        styles.border,
        styles.bg,
        isLastTurn && 'animate-pulse-subtle',
      )}
      style={{ boxShadow: isLastTurn ? styles.glow.replace('0.3)', '0.5)') : styles.glow }}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800/70">
        <ModifierIcon name={effect.icon} size={16} className={styles.icon} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {/* Buff/Debuff badge for combat effects */}
          {effect.section === 'combat' && (
            <span className={cn(
              'inline-flex items-center px-1 py-px rounded text-[9px] font-bold uppercase tracking-wider leading-none shrink-0',
              effect.isDebuff
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
            )}>
              {effect.isDebuff ? '↓ ДЕБ' : '↑ БАФ'}
            </span>
          )}
          <span className="text-sm font-semibold text-slate-100 truncate leading-tight">
            {effect.name}
          </span>
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
          <div className={cn('flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-bold', styles.label)}>
            <Infinity className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono',
            isLastTurn
              ? 'bg-amber-500/20 text-amber-400'
              : cn('bg-slate-800/60', styles.label),
          )}>
            <Clock className="w-3 h-3" />
            {effect.turnInEffect}/{effect.duration}
          </div>
        )}
      </div>

      {/* Remove button */}
      {effect.removable && effect.modifierId && (
        <button
          onClick={() => onRemove(effect.modifierId!)}
          className="p-2.5 hover:bg-red-900/40 active:bg-red-900/60 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 -my-1.5"
          aria-label={`Снять ${effect.name}`}
        >
          <X className="w-4 h-4 text-red-400/70" />
        </button>
      )}
    </div>
  );
}

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
  const [catalogMode, setCatalogMode] = useState<'buffs' | 'debuffs' | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCatalogMode(null);
    }
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (catalogMode) setCatalogMode(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, catalogMode]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) closeButtonRef.current.focus();
  }, [isOpen]);

  // ─── Properties list (ALWAYS visible) ───
  const propertiesList = useMemo<ActiveEffectEntry[]>(() => [
    // Static buffs — permanent properties from unit template
    ...staticBuffs.map(b => ({
      id: `static_${b.id}`,
      name: b.name,
      description: b.description,
      icon: b.icon,
      type: 'static' as const,
      isPermanent: true,
      removable: false,
      section: 'properties' as const,
    })),
    // Abilities — permanent soldier features, always active
    ...availableAbilities.map(a => ({
      id: `ability_${a.id}`,
      name: a.name,
      description: a.description,
      icon: a.icon,
      type: 'static' as const,
      isPermanent: true,
      removable: false,
      section: 'properties' as const,
    })),
  ], [staticBuffs, availableAbilities]);

  // ─── Debuff catalog IDs for soldier modifier classification ───
  const debuffCatalogIds = useMemo(() => new Set(availableDebuffs.map(d => d.id)), [availableDebuffs]);

  // ─── Combat effects list ───
  const combatList = useMemo<ActiveEffectEntry[]>(() => [
    ...activeBuffs.map(b => {
      const turnInEffect = currentTurn ? currentTurn - b.appliedAtTurn + 1 : 1;
      const isLastTurn = currentTurn && b.expiresAtTurn ? currentTurn === b.expiresAtTurn - 1 : false;
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
        section: 'combat' as const,
        isDebuff: false,
      };
    }),
    ...soldierModifiers.map(m => {
      const isPermanent = !m.duration;
      const turnInEffect = !isPermanent && currentTurn ? currentTurn - m.appliedAtTurn + 1 : undefined;
      const isLastTurn = !isPermanent && currentTurn && m.expiresAtTurn ? currentTurn === m.expiresAtTurn - 1 : false;
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
        section: 'combat' as const,
        isDebuff: !!(m.catalogId && debuffCatalogIds.has(m.catalogId)),
      };
    }),
    ...activeDebuffs.map(d => {
      const turnInEffect = currentTurn ? currentTurn - d.appliedAtTurn + 1 : 1;
      const isLastTurn = currentTurn && d.expiresAtTurn ? currentTurn === d.expiresAtTurn - 1 : false;
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
        section: 'combat' as const,
        isDebuff: true,
      };
    }),
  ], [activeBuffs, soldierModifiers, activeDebuffs, currentTurn, debuffCatalogIds]);

  // ─── Used catalog IDs for catalog display ───
  const usedCatalogIds = useMemo(() => {
    const activeDebuffCatalogIds = activeDebuffs.map(d => {
      const lastUnderscore = d.id.lastIndexOf('_');
      if (lastUnderscore !== -1 && /^\d+$/.test(d.id.slice(lastUnderscore + 1))) {
        return d.id.slice(0, lastUnderscore);
      }
      return d.id;
    });
    return new Set([
      ...soldierModifiers.filter(m => m.catalogId).map(m => m.catalogId!),
      ...abilitiesUsed,
      ...activeDebuffCatalogIds,
    ]);
  }, [soldierModifiers, abilitiesUsed, activeDebuffs]);

  if (!isOpen) return null;

  const hasProperties = propertiesList.length > 0;
  const hasCombat = combatList.length > 0;
  const hasAnything = hasProperties || hasCombat;

  return (
    <div
      className="fixed inset-0 z-[60] md:flex md:items-center md:justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="effects-modal-title"
    >
      <div
        className="fixed bottom-0 left-0 right-0 md:relative md:max-w-md bg-slate-900 rounded-t-2xl md:rounded-xl max-h-[90vh] md:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-700/40 animate-slideUp"
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
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pt-2 pb-2">

          {hasAnything ? (
            <>
              {/* ─── PROPERTIES SECTION (always visible) ─── */}
              {hasProperties && (
                <div>
                  <SectionHeader label="Свойства" />
                  <div className="space-y-2">
                    {propertiesList.map(effect => (
                      <EffectCard
                        key={effect.id}
                        effect={effect}
                        onRemove={onRemoveModifier}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ─── COMBAT EFFECTS SECTION ─── */}
              {hasCombat && (
                <div>
                  <SectionHeader label="Эффекты боя" />
                  <div className="space-y-2">
                    {combatList.map(effect => (
                      <EffectCard
                        key={effect.id}
                        effect={effect}
                        onRemove={onRemoveModifier}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Нет активных эффектов</p>
            </div>
          )}
        </div>

        {/* ─── CATALOG PANEL (slides in when active) ─── */}
        {catalogMode && (
          <div className="flex-shrink-0 max-h-[40vh] overflow-y-auto border-t border-slate-700/30 animate-slideUp">
            {/* Catalog header */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {catalogMode === 'buffs' ? 'Баффы' : 'Дебаффы'}
              </span>
              <button
                onClick={() => setCatalogMode(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Закрыть каталог"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Catalog items */}
            {(() => {
              const items = catalogMode === 'buffs' ? availableBuffs : availableDebuffs;
              if (items.length === 0) {
                return (
                  <div className="px-4 py-6 text-center">
                    <Star className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs">Нет доступных</p>
                  </div>
                );
              }
              return (
                <div className="px-3 pb-3 space-y-2">
                  {items.map(item => {
                    const isUsed = usedCatalogIds.has(item.id);
                    const itemStyles = getEffectStyles(`catalog_${item.id}`);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 pl-3 pr-1.5 py-2.5 rounded-lg border-l-[3px] transition-all',
                          isUsed
                            ? 'border-l-slate-700 border border-slate-800/30 bg-slate-900/30 opacity-35'
                            : cn(itemStyles.border, itemStyles.bg, 'border border-transparent'),
                        )}
                        style={!isUsed ? { boxShadow: itemStyles.glow } : undefined}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-800/70">
                          <ModifierIcon name={item.icon} size={16} className={itemStyles.icon} />
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
                            onClick={() => onApplyModifier(item, catalogMode as Tab)}
                            className="p-2.5 hover:bg-slate-800/40 active:bg-slate-800/60 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 -my-1.5"
                            aria-label={`Применить ${item.name}`}
                          >
                            <Plus className={cn('w-4 h-4', itemStyles.icon)} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── ACTION BAR (always visible) ─── */}
        <div className="flex-shrink-0 px-3 py-3 border-t border-slate-700/40 bg-slate-900/90">
          <div className="flex gap-3">
            <button
              onClick={() => setCatalogMode(catalogMode === 'buffs' ? null : 'buffs')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border min-h-[44px] font-semibold text-xs uppercase tracking-wider transition-all',
                catalogMode === 'buffs'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/40 border-slate-700/30 text-slate-400 active:bg-slate-800/60',
              )}
            >
              <Plus className="w-4 h-4" />
              <span>Баф</span>
              {availableBuffs.length > 0 && (
                <span className="text-[10px] font-mono font-bold bg-slate-800/40 px-1.5 py-0.5 rounded">
                  {availableBuffs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCatalogMode(catalogMode === 'debuffs' ? null : 'debuffs')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border min-h-[44px] font-semibold text-xs uppercase tracking-wider transition-all',
                catalogMode === 'debuffs'
                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'bg-slate-800/40 border-slate-700/30 text-slate-400 active:bg-slate-800/60',
              )}
            >
              <Plus className="w-4 h-4" />
              <span>Дебаф</span>
              {availableDebuffs.length > 0 && (
                <span className="text-[10px] font-mono font-bold bg-slate-800/40 px-1.5 py-0.5 rounded">
                  {availableDebuffs.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
