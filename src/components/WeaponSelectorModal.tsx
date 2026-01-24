'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Target, Zap, Check } from 'lucide-react';
import type { Machine, Faction, Weapon } from '@/lib/types';
import { useBottomSheet } from '@/hooks/useBottomSheet';

interface WeaponSelectorModalProps {
  machine: Machine;
  faction: Faction;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIndices: number[]) => void;
}

/**
 * WeaponSelectorModal - Bottom sheet modal for weapon selection when adding a machine
 *
 * Features:
 * - Mobile-first bottom sheet modal (swipe-to-close via useBottomSheet hook)
 * - Displays machine name, image, and cost
 * - Lists all weapons from machine.weapons array with checkboxes
 * - Shows weapon details: name, range, power, special rules
 * - Default: all weapons selected
 * - Confirm/Cancel buttons
 */
export function WeaponSelectorModal({
  machine,
  faction,
  isOpen,
  onClose,
  onConfirm,
}: WeaponSelectorModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Load saved weapon selection for this machine type from localStorage
  // Format: { "machine_id": [0, 2, 4] }
  const getSavedSelection = (machineId: string): number[] | null => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('bronepehota_weapon_selections');
      if (saved) {
        const selections = JSON.parse(saved);
        return selections[machineId] || null;
      }
    } catch {
      return null;
    }
    return null;
  };

  // Save weapon selection for this machine type to localStorage
  const saveSelection = (machineId: string, indices: number[]) => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('bronepehota_weapon_selections');
      const selections = saved ? JSON.parse(saved) : {};
      selections[machineId] = indices;
      localStorage.setItem('bronepehota_weapon_selections', JSON.stringify(selections));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Initialize: load saved selection or default to all weapons
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() => {
    const saved = getSavedSelection(machine.id);
    return saved !== null ? saved : machine.weapons.map((_, i) => i);
  });

  // Reset selection when machine changes (load saved selection for new machine)
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedSelection(machine.id);
      setSelectedIndices(saved !== null ? saved : machine.weapons.map((_, i) => i));
    }
  }, [machine.id, machine.weapons, isOpen]);

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

  // Toggle weapon selection
  const toggleWeapon = (index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  // Handle confirm - save selection for future use
  const handleConfirm = () => {
    saveSelection(machine.id, selectedIndices);
    onConfirm(selectedIndices);
  };

  // Get weapon checkbox state
  const isWeaponSelected = (index: number) => selectedIndices.includes(index);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 md:flex md:items-center md:justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="weapon-selector-title"
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

        {/* Header section with image, name, cost */}
        <div className="relative px-4 pt-2 pb-4 md:p-6 md:pb-4 border-b border-slate-700">
          {machine.image && (
            <div className="flex justify-center mb-4 md:absolute md:right-16 md:top-1/2 md:-translate-y-1/2 md:mb-0 md:opacity-20">
              <Image
                src={machine.image}
                alt={machine.name}
                width={128}
                height={128}
                className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                unoptimized
              />
            </div>
          )}

          <div className="text-center md:text-left md:pr-12">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2" style={{ backgroundColor: `${faction.color}20`, color: faction.color }}>
              Машина
            </div>

            <h2
              id="weapon-selector-title"
              className="text-xl md:text-2xl font-bold text-white mb-1"
            >
              {machine.name}
            </h2>

            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-2xl font-bold" style={{ color: faction.color }}>
                {machine.cost}
              </span>
              <span className="text-slate-400">очков</span>
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <h3 className="text-lg font-bold text-white mb-3">
            Выберите вооружение:
          </h3>

          {machine.weapons.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              У этой машины нет вооружения
            </div>
          ) : (
            <div className="space-y-2">
              {machine.weapons.map((weapon, index) => (
                <WeaponCheckbox
                  key={index}
                  weapon={weapon}
                  index={index}
                  isSelected={isWeaponSelected(index)}
                  onToggle={() => toggleWeapon(index)}
                  factionColor={faction.color}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="p-4 md:p-6 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all min-h-[48px]"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all min-h-[48px] flex items-center justify-center gap-2"
            style={{
              backgroundColor: faction.color,
              color: 'white'
            }}
          >
            <Check size={20} />
            Добавить {machine.cost} очков
          </button>
        </div>
      </div>
    </div>
  );
}

// Weapon checkbox subcomponent
interface WeaponCheckboxProps {
  weapon: Weapon;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
  factionColor: string;
}

function WeaponCheckbox({ weapon, index: _index, isSelected, onToggle, factionColor }: WeaponCheckboxProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        w-full p-3 rounded-xl border-2 transition-all text-left
        ${isSelected
          ? 'bg-slate-700/50 border-blue-500'
          : 'bg-slate-800/30 border-slate-600 hover:border-slate-500'
        }
      `}
      style={{
        borderColor: isSelected ? factionColor : undefined,
        backgroundColor: isSelected ? `${factionColor}15` : undefined
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={`
            w-6 h-6 min-w-[24px] min-h-[24px] rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5
            ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-slate-700 border-slate-600'}
          `}
          style={{
            backgroundColor: isSelected ? factionColor : undefined,
            borderColor: isSelected ? factionColor : undefined
          }}
        >
          {isSelected && <Check size={16} className="text-white" />}
        </div>

        {/* Weapon info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-bold text-white truncate">
              {weapon.name}
            </h4>
          </div>

          {/* Stats */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-800/50 rounded px-2 py-1">
              <Target className="w-3 h-3 text-green-500" />
              <span className="text-xs font-mono font-bold text-green-400">{weapon.range}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-800/50 rounded px-2 py-1">
              <Zap className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-mono font-bold text-orange-400">{weapon.power}</span>
            </div>
          </div>

          {/* Special rules */}
          {weapon.special && (
            <div className="mt-1 text-xs text-slate-400 italic truncate">
              {typeof weapon.special === 'string' ? weapon.special : JSON.stringify(weapon.special)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
