import type { ArmyUnit, Army } from './types';
import type {
  BuffDefinition,
  ActiveDebuff,
  ActiveBuff,
  SoldierModifier,
  DebuffTemplate,
  ModifierSummary,
  ModifierPhase,
  ModifierTarget,
  ModifierDuration,
  ModifiersCatalog,
} from './modifier-types';
import { EMPTY_MODIFIER_SUMMARY } from './modifier-types';
export { EMPTY_MODIFIER_SUMMARY } from './modifier-types';
import standardModifiers from '@/data/modifiers/standard-modifiers.json';
import { getCustomModifiers } from './editor/modifier-storage';

// Re-export types for convenience
export type { ModifierDuration, ActiveBuff, SoldierModifier } from './modifier-types';

// === Catalog loading ===

let _cachedCatalog: ModifiersCatalog | null = null;

/**
 * Load the standard modifiers catalog (cached after first load).
 */
export function getStandardCatalog(): ModifiersCatalog {
  if (!_cachedCatalog) {
    _cachedCatalog = standardModifiers as ModifiersCatalog;
  }
  return _cachedCatalog;
}

/**
 * Get all standard debuff templates from catalog.
 */
export function getStandardDebuffs(): DebuffTemplate[] {
  return getStandardCatalog().debuffs;
}

/**
 * Get all standard buff definitions from catalog.
 */
export function getStandardBuffs(): BuffDefinition[] {
  return getStandardCatalog().buffs;
}

// === Unified catalog access ===

/**
 * Get ALL buff definitions — standard + custom merged, deduplicated by ID.
 * Custom buffs override standard ones with the same ID.
 */
export function getAllBuffs(): BuffDefinition[] {
  const standard = getStandardBuffs();
  const custom = getCustomModifiers().buffs;
  if (custom.length === 0) return standard;
  const customIds = new Set(custom.map(b => b.id));
  return [...standard.filter(b => !customIds.has(b.id)), ...custom];
}

/**
 * Get ALL debuff templates — standard + custom merged, deduplicated by ID.
 * Custom debuffs override standard ones with the same ID.
 */
export function getAllDebuffs(): DebuffTemplate[] {
  const standard = getStandardDebuffs();
  const custom = getCustomModifiers().debuffs;
  if (custom.length === 0) return standard;
  const customIds = new Set(custom.map(d => d.id));
  return [...standard.filter(d => !customIds.has(d.id)), ...custom];
}

/**
 * @deprecated Use getAllDebuffs() instead.
 */
export function getAllDebuffTemplates(customDebuffs?: DebuffTemplate[]): DebuffTemplate[] {
  if (customDebuffs) return getAllDebuffs();
  return getAllDebuffs();
}

// === Unit state helpers ===

/**
 * Get buffs defined on a unit's template data.
 * Filters out one-time-use buffs that have already been consumed.
 */
export function getUnitBuffs(unit: ArmyUnit): BuffDefinition[] {
  const data = unit.data as any;
  const templateBuffs: BuffDefinition[] = data.buffs || [];
  const usedBuffIds = new Set(unit.buffsUsed || []);
  return templateBuffs.filter(
    (b: BuffDefinition) => !b.oneTimeUse || !usedBuffIds.has(b.id)
  );
}

/**
 * Check if a unit is alive (for buff-giver purposes).
 * - Squads: at least one soldier alive
 * - Machines: currentDurability > 0
 */
export function isUnitAlive(unit: ArmyUnit): boolean {
  if (unit.type === 'squad') {
    const soldierCount = (unit.data as any).soldiers?.length || 0;
    const deadCount = unit.deadSoldiers?.length || 0;
    return deadCount < soldierCount;
  }
  const maxDur = (unit.data as any).durability_max || 1;
  const current = unit.currentDurability ?? maxDur;
  return current > 0;
}

/**
 * Check if a time-limited modifier (buff/debuff) is still active.
 * @param appliedAtTurn - Turn when modifier was applied
 * @param duration - Duration in turns (1, 2, or 3)
 * @param currentTurn - Current turn number (undefined = game not started)
 */
export function isModifierActive(
  appliedAtTurn: number,
  duration: ModifierDuration | undefined,
  currentTurn?: number
): boolean {
  if (duration === undefined) return true; // Permanent modifier
  if (!currentTurn) return true; // Game hasn't started yet
  return currentTurn <= appliedAtTurn + duration;
}

/**
 * Get temporary buffs applied during battle (from unit.activeBuffs).
 * Filters out expired buffs based on current turn.
 */
export function getActiveBuffs(unit: ArmyUnit, army: Army): ActiveBuff[] {
  const activeBuffs = unit.activeBuffs || [];
  const currentTurn = army.currentTurn;
  return activeBuffs.filter(buff =>
    isModifierActive(buff.appliedAtTurn, buff.duration, currentTurn)
  );
}

/**
 * Get modifiers applied to a specific soldier.
 * Filters out expired modifiers based on current turn.
 */
export function getSoldierModifiers(unit: ArmyUnit, soldierIndex: number, army: Army): SoldierModifier[] {
  if (unit.type !== 'squad') return [];
  const soldierModifiers = unit.soldierModifiers || [];
  const currentTurn = army.currentTurn;
  return soldierModifiers.filter(mod =>
    mod.soldierIndex === soldierIndex &&
    isModifierActive(mod.appliedAtTurn, mod.duration, currentTurn)
  );
}

// === Collection ===

/**
 * Collect all applicable buffs for a specific unit from the entire army.
 * - Static buffs (no duration): from unit data, always active
 * - Personal buffs: only from the unit itself
 * - Team buffs: from all alive units in the army (including self)
 */
export function collectBuffsForUnit(
  unit: ArmyUnit,
  army: Army,
  phase?: ModifierPhase
): BuffDefinition[] {
  const buffs: BuffDefinition[] = [];

  for (const armyUnit of army.units) {
    if (!isUnitAlive(armyUnit)) continue;

    const unitBuffs = getUnitBuffs(armyUnit);

    for (const buff of unitBuffs) {
      // Skip temporary buffs (with duration) - they're in activeBuffs, not template data
      if (buff.duration) continue;

      // Phase filter: skip if buff doesn't match requested phase
      if (phase && phase !== 'always' && buff.phase !== 'always' && buff.phase !== phase) continue;

      // Army-level: only for the buff-giver itself unless applyTo includes 'army'
      if (!buff.applyTo.includes('army') && armyUnit.instanceId !== unit.instanceId) continue;

      buffs.push(buff);
    }
  }

  return buffs;
}

/**
 * Collect all active buffs (temporary effects applied during battle) for a unit.
 */
export function collectActiveBuffsForUnit(
  unit: ArmyUnit,
  army: Army,
  phase?: ModifierPhase
): ActiveBuff[] {
  const activeBuffs = getActiveBuffs(unit, army);
  if (!phase) return activeBuffs;
  return activeBuffs.filter(b => b.phase === 'always' || b.phase === phase);
}

/**
 * Collect all active debuffs on a unit, optionally filtered by phase.
 * Filters out debuffs that have expired based on their duration.
 */
export function collectDebuffsForUnit(
  unit: ArmyUnit,
  army: Army,
  phase?: ModifierPhase
): ActiveDebuff[] {
  const debuffs = unit.activeDebuffs || [];
  const currentTurn = army.currentTurn;

  return debuffs.filter(d => {
    // Filter by phase if specified
    if (phase && d.phase !== 'always' && d.phase !== phase) return false;

    // Filter out expired debuffs
    return isModifierActive(d.appliedAtTurn, d.duration, currentTurn);
  });
}

// === Cleanup ===

/**
 * Remove expired modifiers (buffs and debuffs) from all units in the army.
 * Called at the start of each new turn.
 */
export function cleanupExpiredModifiers(army: Army): Army {
  if (!army.currentTurn) return army;

  return {
    ...army,
    units: army.units.map(unit => {
      const activeDebuffs = (unit.activeDebuffs || []).filter(debuff =>
        isModifierActive(debuff.appliedAtTurn, debuff.duration, army.currentTurn)
      );

      const activeBuffs = (unit.activeBuffs || []).filter(buff =>
        isModifierActive(buff.appliedAtTurn, buff.duration, army.currentTurn)
      );

      const soldierModifiers = (unit.soldierModifiers || []).filter(mod =>
        isModifierActive(mod.appliedAtTurn, mod.duration, army.currentTurn)
      );

      return {
        ...unit,
        activeDebuffs: activeDebuffs.length > 0 ? activeDebuffs : undefined,
        activeBuffs: activeBuffs.length > 0 ? activeBuffs : undefined,
        soldierModifiers: soldierModifiers.length > 0 ? soldierModifiers : undefined,
      };
    }),
  };
}

// === Resolution ===

/**
 * Apply a single modifier value to the summary.
 */
function applyModifier(
  summary: ModifierSummary,
  target: ModifierTarget,
  value: number,
  name: string,
  isBuff: boolean
): void {
  const prefix = isBuff ? '+' : '';
  switch (target) {
    case 'range_bonus':
      summary.rangeBonus += value;
      if (value !== 0) summary.descriptions.push(`${name}: ${prefix}${value} дальность`);
      break;
    case 'range_multiply':
      summary.rangeMultiplier *= value;
      if (value !== 1) summary.descriptions.push(`${name}: дальность x${value}`);
      break;
    case 'power_bonus':
      summary.powerBonus += value;
      if (value !== 0) summary.descriptions.push(`${name}: ${prefix}${value} мощность`);
      break;
    case 'melee_bonus':
      summary.meleeBonus += value;
      if (value !== 0) summary.descriptions.push(`${name}: ${prefix}${value} ББ`);
      break;
    case 'speed_multiply':
      summary.speedMultiplier *= value;
      if (value !== 1) summary.descriptions.push(`${name}: скорость x${value}`);
      break;
    case 'armor_bonus':
      summary.armorBonus += value;
      if (value !== 0) summary.descriptions.push(`${name}: ${prefix}${value} броня`);
      break;
    case 'distance_penalty':
      summary.distancePenalty += value;
      if (value !== 0) summary.descriptions.push(`${name}: +${value} дистанция`);
      break;
    case 'custom':
      summary.descriptions.push(name);
      break;
  }
}

/**
 * Resolve all modifiers into a ModifierSummary for combat calculation.
 * Combines static buffs (from army), active buffs (temporary), debuffs (from unit runtime state),
 * and soldier-level modifiers (if soldierIndex provided).
 */
export function resolveModifierSummary(
  unit: ArmyUnit,
  army: Army,
  phase: ModifierPhase,
  soldierIndex?: number
): ModifierSummary {
  const buffs = collectBuffsForUnit(unit, army, phase);
  const activeBuffs = collectActiveBuffsForUnit(unit, army, phase);
  const debuffs = collectDebuffsForUnit(unit, army, phase);
  const soldierMods = soldierIndex !== undefined
    ? getSoldierModifiers(unit, soldierIndex, army).filter(
        m => m.phase === 'always' || m.phase === phase
      )
    : [];

  if (buffs.length === 0 && activeBuffs.length === 0 && debuffs.length === 0 && soldierMods.length === 0) {
    return EMPTY_MODIFIER_SUMMARY;
  }

  const summary: ModifierSummary = { ...EMPTY_MODIFIER_SUMMARY, descriptions: [] };

  for (const buff of buffs) {
    applyModifier(summary, buff.target, buff.value, buff.name, true);
  }
  for (const buff of activeBuffs) {
    applyModifier(summary, buff.target, buff.value, buff.name, true);
  }
  for (const debuff of debuffs) {
    applyModifier(summary, debuff.target, debuff.value, debuff.name, false);
  }
  for (const mod of soldierMods) {
    applyModifier(summary, mod.target, mod.value, mod.name, true);
  }

  return summary;
}

/**
 * Check if a modifier summary has any active effects.
 */
export function hasActiveModifiers(summary: ModifierSummary): boolean {
  return summary.descriptions.length > 0;
}

/**
 * Get the modifier effect description for a specific target.
 * Useful for showing next to stat values (e.g., "D6+1" instead of "D6").
 */
export function getRangeModifierText(summary: ModifierSummary): string {
  if (summary.rangeBonus !== 0) {
    return summary.rangeBonus > 0 ? `+${summary.rangeBonus}` : `${summary.rangeBonus}`;
  }
  if (summary.rangeMultiplier !== 1) {
    return `x${summary.rangeMultiplier}`;
  }
  return '';
}

export function getPowerModifierText(summary: ModifierSummary): string {
  if (summary.powerBonus !== 0) {
    return summary.powerBonus > 0 ? `+${summary.powerBonus}` : `${summary.powerBonus}`;
  }
  return '';
}

export function getMeleeModifierText(summary: ModifierSummary): string {
  if (summary.meleeBonus !== 0) {
    return summary.meleeBonus > 0 ? `+${summary.meleeBonus}` : `${summary.meleeBonus}`;
  }
  return '';
}

export function getArmorModifierText(summary: ModifierSummary): string {
  if (summary.armorBonus !== 0) {
    return summary.armorBonus > 0 ? `+${summary.armorBonus}` : `${summary.armorBonus}`;
  }
  return '';
}

export function getSpeedModifierText(summary: ModifierSummary): string {
  if (summary.speedMultiplier !== 1) {
    return `x${summary.speedMultiplier}`;
  }
  return '';
}
