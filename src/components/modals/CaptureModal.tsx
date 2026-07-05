'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { GitHubPagesImage as Image } from '../GitHubPagesImage';
import {
  CaptureCandidate,
  filterCaptureCatalog,
  getCaptureCandidates,
  opposingFaction,
} from '@/lib/capture-catalog';
import { Shield, X, ArrowLeft, Crosshair, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  armyFaction: string;
  capturingSoldierRank: number;
  strictPilotRankEnabled: boolean;
  onConfirm: (
    machine: CaptureCandidate,
    currentDurability: number,
    currentAmmo: number
  ) => void;
}

type StepState = 'machine' | 'state';

export function CaptureModal({
  isOpen,
  onClose,
  armyFaction,
  capturingSoldierRank,
  strictPilotRankEnabled,
  onConfirm,
}: CaptureModalProps) {
  useEscapeToClose(isOpen, onClose);
  const focusRef = useRef<HTMLDivElement>(null);
  useFocusTrap(focusRef, isOpen);

  const allCatalog = useMemo(() => getCaptureCandidates(), []);
  const allFactions = useMemo(
    () => Array.from(new Set(allCatalog.map((m) => m.faction))),
    [allCatalog]
  );

  const [factionFilter, setFactionFilter] = useState<string | null>(
    () => opposingFaction(armyFaction, allFactions.length ? allFactions : [armyFaction])
  );
  const [step, setStep] = useState<StepState>('machine');
  const [selected, setSelected] = useState<CaptureCandidate | null>(null);
  const [durability, setDurability] = useState<number>(1);
  const [ammo, setAmmo] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize + reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('machine');
      setSelected(null);
      setSearchQuery('');
      setFactionFilter(
        opposingFaction(
          armyFaction,
          allFactions.length ? allFactions : [armyFaction]
        )
      );
    }
  }, [isOpen, armyFaction, allFactions]);

  // When a new machine is selected, default durability/ammo to its max (most
  // convenient for the player — they reduce as damage is taken / ammo is spent).
  useEffect(() => {
    if (selected) {
      setDurability(selected.durability_max);
      setAmmo(selected.ammo_max);
    }
  }, [selected]);

  const candidates = useMemo(
    () =>
      filterCaptureCatalog(allCatalog, {
        soldierRank: capturingSoldierRank,
        strictRank: strictPilotRankEnabled,
        factionFilter,
      }).filter((m) => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [
      allCatalog,
      capturingSoldierRank,
      strictPilotRankEnabled,
      factionFilter,
      searchQuery,
    ]
  );

  const handleConfirm = () => {
    if (!selected) return;
    const d = Math.max(1, Math.min(selected.durability_max, durability));
    const a = Math.max(0, Math.min(selected.ammo_max, ammo));
    onConfirm(selected, d, a);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 'state' && (
              <button
                onClick={() => setStep('machine')}
                aria-label="Назад"
                className="p-1.5 -ml-1.5 hover:bg-slate-800 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center mr-1"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <div className="p-2 bg-amber-900/30 rounded-lg">
              <Crosshair className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">
                Захват техники
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'machine'
                  ? 'Выберите машину противника'
                  : selected?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-2 border-b border-slate-700 flex-shrink-0">
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
              step === 'machine'
                ? 'bg-amber-900/30 text-amber-400'
                : 'bg-slate-800 text-slate-500'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                step === 'machine'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-500'
              )}
            >
              1
            </div>
            Машина
          </div>
          <div
            className={cn(
              'w-8 h-0.5',
              step === 'state' ? 'bg-amber-600' : 'bg-slate-700'
            )}
          />
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
              step === 'state'
                ? 'bg-amber-900/30 text-amber-400'
                : 'bg-slate-800 text-slate-500'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                step === 'state'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-500'
              )}
            >
              2
            </div>
            Состояние
          </div>
        </div>

        {/* Content */}
        <div ref={focusRef} className="flex-1 overflow-auto p-4">
          {/* Step 1: Machine picker */}
          {step === 'machine' && (
            <>
              {/* Faction chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setFactionFilter(null)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-bold transition-colors min-h-[36px]',
                    factionFilter === null
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  )}
                >
                  Все
                </button>
                {allFactions.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFactionFilter(f)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-bold transition-colors min-h-[36px] capitalize',
                      factionFilter === f
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Search by name */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени…"
                className="w-full mb-3 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 min-h-[44px]"
              />

              {/* Machine list */}
              {candidates.length === 0 ? (
                <div className="text-center py-8">
                  <Crosshair className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Нет машин для захвата</p>
                  <p className="text-slate-600 text-xs mt-1">
                    {strictPilotRankEnabled
                      ? `Требуется ранг бойца ≥ ранга машины`
                      : 'Измените фильтр фракции'}
                  </p>
                </div>
              ) : (
                <div
                  className="space-y-2 animate-in slide-in-from-bottom-2 duration-200"
                  role="listbox"
                  aria-label="Машины для захвата"
                >
                  {candidates.map((m) => {
                    const isSelected = selected?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelected(m);
                          setStep('state');
                        }}
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all active:scale-95',
                          isSelected
                            ? 'bg-amber-900/30 border-amber-600'
                            : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Machine image */}
                          <div
                            className={cn(
                              'w-12 h-12 rounded-lg border overflow-hidden flex-shrink-0 bg-slate-900 relative',
                              isSelected
                                ? 'border-amber-600'
                                : 'border-slate-600'
                            )}
                          >
                            <Image
                              src={
                                m.image ||
                                '/images/machines/empty.png'
                              }
                              alt={m.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover object-center"
                              unoptimized
                            />
                            {/* Rank badge */}
                            <div className="absolute top-0.5 right-0.5 bg-slate-900/90 px-1 rounded text-[8px] font-bold text-yellow-400">
                              {m.rank}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">
                              {m.name}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span className="capitalize">{m.faction}</span>
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                {m.durability_max}
                              </span>
                              <span className="flex items-center gap-1">
                                <Crosshair className="w-3 h-3" />
                                {m.ammo_max}
                              </span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="text-slate-600 shrink-0">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 2: Durability + ammo entry */}
          {step === 'state' && selected && (
            <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-200">
              {/* Selected machine summary */}
              <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
                <div className="w-12 h-12 rounded-lg border border-slate-600 overflow-hidden flex-shrink-0 bg-slate-900 relative">
                  <Image
                    src={
                      selected.image || '/images/machines/empty.png'
                    }
                    alt={selected.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover object-center"
                    unoptimized
                  />
                  <div className="absolute top-0.5 right-0.5 bg-slate-900/90 px-1 rounded text-[8px] font-bold text-yellow-400">
                    {selected.rank}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">
                    {selected.name}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">
                    {selected.faction}
                  </div>
                </div>
              </div>

              {/* Durability stepper */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="capture-durability"
                    className="text-sm font-bold flex items-center gap-1.5"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    Прочность
                  </label>
                  <span className="text-xs text-slate-500">
                    макс. {selected.durability_max}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setDurability((d) => Math.max(1, d - 1))
                    }
                    disabled={durability <= 1}
                    aria-label="Уменьшить прочность"
                    className={cn(
                      'w-11 h-11 rounded-lg flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]',
                      durability <= 1
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="capture-durability"
                    type="number"
                    min={1}
                    max={selected.durability_max}
                    value={durability}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setDurability(Number.isNaN(v) ? 1 : v);
                    }}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (Number.isNaN(v) || v < 1) setDurability(1);
                      else if (v > selected.durability_max)
                        setDurability(selected.durability_max);
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-center text-lg font-bold min-h-[44px] focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDurability((d) =>
                        Math.min(selected.durability_max, d + 1)
                      )
                    }
                    disabled={durability >= selected.durability_max}
                    aria-label="Увеличить прочность"
                    className={cn(
                      'w-11 h-11 rounded-lg flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]',
                      durability >= selected.durability_max
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Ammo stepper */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="capture-ammo"
                    className="text-sm font-bold flex items-center gap-1.5"
                  >
                    <Crosshair className="w-4 h-4 text-slate-400" />
                    Боезапас
                  </label>
                  <span className="text-xs text-slate-500">
                    макс. {selected.ammo_max}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAmmo((a) => Math.max(0, a - 1))}
                    disabled={ammo <= 0}
                    aria-label="Уменьшить боезапас"
                    className={cn(
                      'w-11 h-11 rounded-lg flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]',
                      ammo <= 0
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="capture-ammo"
                    type="number"
                    min={0}
                    max={selected.ammo_max}
                    value={ammo}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setAmmo(Number.isNaN(v) ? 0 : v);
                    }}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (Number.isNaN(v) || v < 0) setAmmo(0);
                      else if (v > selected.ammo_max)
                        setAmmo(selected.ammo_max);
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-center text-lg font-bold min-h-[44px] focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAmmo((a) => Math.min(selected.ammo_max, a + 1))
                    }
                    disabled={ammo >= selected.ammo_max}
                    aria-label="Увеличить боезапас"
                    className={cn(
                      'w-11 h-11 rounded-lg flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]',
                      ammo >= selected.ammo_max
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 flex gap-2 flex-shrink-0">
          {step === 'machine' ? (
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700 transition-colors min-h-[44px]"
            >
              Отмена
            </button>
          ) : (
            <>
              <button
                onClick={() => setStep('machine')}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Назад
              </button>
              <button
                onClick={handleConfirm}
                data-testid="confirm-capture"
                className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-bold text-sm hover:bg-amber-500 transition-colors min-h-[44px]"
              >
                <Crosshair className="w-4 h-4 inline mr-1" />
                Захватить
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
