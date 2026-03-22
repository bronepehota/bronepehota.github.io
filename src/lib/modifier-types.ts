/**
 * Modifier system types for buffs and debuffs.
 *
 * Buffs (positive): static, defined in unit JSON data, auto-collected from living army units.
 * Debuffs (negative): dynamic, applied by player during gameplay, stored on ArmyUnit runtime state.
 */

// === Modifier Target ===
// What combat stat a modifier affects
export type ModifierTarget =
  | 'range_bonus'      // Additive: +N to hit roll (D6 → D6+1)
  | 'range_multiply'   // Multiplicative: multiply range dice (D6 → D12 for x2)
  | 'power_bonus'      // Additive: +N to damage roll
  | 'melee_bonus'      // Additive: +N to melee total
  | 'speed_multiply'   // Multiplicative: speed * factor (0.5 for slow)
  | 'armor_bonus'      // Additive: +N to effective armor
  | 'distance_penalty' // Additive: +N to effective distance (makes hitting harder)
  | 'custom';          // Free-text description, no automatic calculation

// === Scope & Phase ===
export type BuffScope = 'personal' | 'team';
export type ModifierPhase = 'always' | 'shot' | 'melee' | 'grenade';

// === Duration for temporary effects ===
export type ModifierDuration = 1 | 2 | 3;

export const DURATION_OPTIONS: { value: ModifierDuration; label: string }[] = [
  { value: 1, label: '1 ход' },
  { value: 2, label: '2 хода' },
  { value: 3, label: '3 хода' },
] as const;

// === Buff (static, from unit data or catalog) ===
export interface BuffDefinition {
  id: string;
  name: string;
  description: string;
  scope: BuffScope;
  target: ModifierTarget;
  value: number;
  phase: ModifierPhase;
  icon?: string;             // Lucide icon name or external URL
  oneTimeUse?: boolean;      // Can only be used once per battle
  duration?: ModifierDuration; // If set - temporary effect for battle use; if undefined - static bonus
  canApplyToSoldier?: boolean; // If true, can be applied to individual soldiers (not just whole squad)
  isCustom?: boolean;        // User-created via editor
}

// === Debuff (dynamic, applied during gameplay) ===
export interface ActiveDebuff {
  id: string;
  name: string;
  description: string;
  target: ModifierTarget;
  value: number;
  phase: ModifierPhase;
  appliedAtTurn: number;     // Which turn it was applied
  duration: ModifierDuration; // REQUIRED for debuffs (1-3 turns)
  expiresAtTurn: number;      // Calculated: appliedAtTurn + duration
  icon?: string;
  isCustom?: boolean;
}

// === ActiveBuff (temporary buff applied during battle) ===
export interface ActiveBuff {
  id: string;
  name: string;
  description: string;
  scope: BuffScope;
  target: ModifierTarget;
  value: number;
  phase: ModifierPhase;
  appliedAtTurn: number;     // Which turn it was applied
  duration: ModifierDuration; // REQUIRED for active buffs (1-3 turns)
  expiresAtTurn: number;      // Calculated: appliedAtTurn + duration
  icon?: string;
}

// === SoldierModifier (applied to individual soldier within a squad) ===
export interface SoldierModifier {
  id: string;
  name: string;
  description: string;
  target: ModifierTarget;
  value: number;
  phase: ModifierPhase;
  appliedAtTurn: number;     // Which turn it was applied
  duration: ModifierDuration; // REQUIRED for soldier modifiers (1-3 turns)
  expiresAtTurn: number;      // Calculated: appliedAtTurn + duration
  icon?: string;
  soldierIndex: number;       // Which soldier in the squad (0-based index)
}

// === Debuff template from catalog (for selection UI) ===
export interface DebuffTemplate {
  id: string;
  name: string;
  description: string;
  target: ModifierTarget;
  value: number;
  phase: ModifierPhase;
  icon?: string;
  canApplyToSoldier?: boolean; // If true, can be applied to individual soldiers
  isCustom?: boolean;
}

// === Computed modifier summary for combat ===
export interface ModifierSummary {
  rangeBonus: number;
  rangeMultiplier: number;
  powerBonus: number;
  meleeBonus: number;
  speedMultiplier: number;
  armorBonus: number;
  distancePenalty: number;
  descriptions: string[];    // Human-readable list of all active modifiers
}

// === JSON catalog structure ===
export interface ModifiersCatalog {
  version: string;
  lastUpdated: string;
  buffs: BuffDefinition[];
  debuffs: DebuffTemplate[];
}

// === Empty modifier summary (no active effects) ===
export const EMPTY_MODIFIER_SUMMARY: ModifierSummary = {
  rangeBonus: 0,
  rangeMultiplier: 1,
  powerBonus: 0,
  meleeBonus: 0,
  speedMultiplier: 1,
  armorBonus: 0,
  distancePenalty: 0,
  descriptions: [],
};
