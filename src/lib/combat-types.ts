import { FortificationType, HitResult, DamageResult, MeleeResult } from './types';
import type { ModifierSummary } from './modifier-types';

/**
 * Combat flow phases for the state machine
 */
export type CombatPhase =
  | 'IDLE'              // No combat in progress
  | 'ACTION_SELECT'     // Choose action: shot/melee/grenade
  | 'PARAMETERS'        // Set distance, armor, cover
  | 'ROLLING'           // Dice animation in progress
  | 'RESULTS'           // Show combat results
  | 'APPLY'             // Apply damage/effects to unit
  | 'GRENADE_DISTANCE'; // Grenade: roll for explosion distance

/**
 * Combat action types
 */
export type CombatActionType = 'shot' | 'melee' | 'grenade';

/**
 * Unit type for combat
 */
export type CombatUnitType = 'squad' | 'machine';

/**
 * Combat parameters set by user before rolling
 */
export interface CombatParameters {
  distance: number;           // Distance to target (hex steps)
  targetArmor: number;        // Target's armor value
  targetMelee: number;        // Target's melee stat (for melee combat)
  fortification: FortificationType;  // Target's cover/fortification
  weaponIndex?: number;       // For machines: which weapon to use
  isSurpriseAttack?: boolean; // Attack from behind (Fan rules: roll twice, take best; machine's BB ignored)
  isAimedShot?: boolean;      // Aimed shot: squad only shoots (no movement/melee), doubles range
  activeModifiers?: ModifierSummary; // Resolved buffs/debuffs for this combat action
}

/**
 * Dice roll display state during animation
 */
export interface DiceDisplay {
  hit?: number;               // Range/distance roll (deprecated - use hitTotal)
  hitBonus?: number;          // Bonus added to hit roll
  hitRolls?: number[];        // Individual dice rolls for hit
  hitTotal?: number;          // Total hit result (roll + bonus)
  power?: number[];           // Damage rolls
  meleeA?: number;            // Attacker melee roll
  meleeD?: number;            // Defender melee roll
}

/**
 * Result of a single grenade blast check
 */
export interface GrenadeBlastResult {
  armor: number;
  roll: number;
  hit: boolean;
}

/**
 * Complete combat result
 */
export interface CombatResult {
  actionType: CombatActionType;
  unitType: CombatUnitType;
  parameters: CombatParameters;
  hitResult?: HitResult;
  damageResult?: DamageResult;
  meleeResult?: MeleeResult;
  timestamp: number;
  unitName: string;
  unitId: string;
  soldierIndex?: number;      // For squads: which soldier
  pilotDied?: boolean;        // Pilot died from armor/survival test
  armorTestRoll?: number;     // Armor test roll (D12) for machines with pilots
  survivalTestRoll?: number;  // Pilot survival test roll (D6)
  // Grenade-specific fields
  grenadeDistance?: number;   // D6 + rank = explosion distance
  grenadeBlastZone?: { minSteps: number; maxSteps: number; minCm: number; maxCm: number };
  grenadeBlastChecks?: GrenadeBlastResult[]; // Multiple target checks
  soldierRank?: number;       // Soldier's army rank for grenade throw
}

/**
 * Combat log entry for history
 */
export interface CombatLogEntry {
  id: string;
  timestamp: number;
  result: CombatResult;
  applied: boolean;           // Whether results were applied to unit state
}

/**
 * State for combat flow machine
 */
export interface CombatFlowState {
  phase: CombatPhase;
  actionType: CombatActionType | null;
  unit: any;                  // ArmyUnit
  unitType: CombatUnitType;
  soldierIndex: number | null; // For squads
  parameters: CombatParameters;
  diceDisplay: DiceDisplay;
  result: CombatResult | null;
  isRolling: boolean;
  // Grenade-specific state
  grenadeData?: {
    distanceRoll: number;      // Final D6 roll selected (or single roll for tehnolog)
    soldierRank: number;       // Soldier's army rank
    totalDistance: number;     // Final distance (calculated differently per rules version)
    blastZone: { minSteps: number; maxSteps: number; minCm: number; maxCm: number };
    blastChecks: GrenadeBlastResult[];
    allRolls?: number[];       // All D6 rolls made (for community_star_system display)
  };
}

/**
 * Actions that can be dispatched to combat flow
 */
export type CombatFlowAction =
  | { type: 'START_COMBAT'; unit: any; soldierIndex?: number; weaponIndex?: number; actionType?: CombatActionType }
  | { type: 'SELECT_ACTION'; actionType: CombatActionType }
  | { type: 'SET_PARAMETERS'; parameters: Partial<CombatParameters> }
  | { type: 'EXECUTE_ROLL' }
  | { type: 'UPDATE_DICE'; diceDisplay?: DiceDisplay }
  | { type: 'ROLL_COMPLETE'; result: CombatResult; diceDisplay?: DiceDisplay; grenadeData?: CombatFlowState['grenadeData'] }
  | { type: 'APPLY_RESULT' }
  | { type: 'GO_BACK_TO_ACTION_SELECT' }
  | { type: 'GO_BACK_TO_PARAMETERS' }
  | { type: 'CLOSE_COMBAT' }
  | { type: 'CANCEL' }
  // Grenade-specific actions
  | { type: 'GRENADE_CHECK_TARGET'; armor: number; d20Roll?: number }
  | { type: 'GRENADE_SET_ARMOR'; armor: number };

/**
 * Weapon selection for vehicle combat
 */
export interface WeaponSelection {
  weaponIndex: number;
  weapon: {
    name: string;
    range: string;
    power: string;
    special?: any;
  };
}

/**
 * Combat configuration
 */
export interface CombatConfig {
  rulesVersion: string;       // 'tehnolog' or 'community_star_system'
  enableSound?: boolean;      // Dice roll sounds
  animationSpeed?: 'fast' | 'normal' | 'slow';
}
