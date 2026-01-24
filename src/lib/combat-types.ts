import { FortificationType, HitResult, DamageResult, MeleeResult } from './types';

/**
 * Combat flow phases for the state machine
 */
export type CombatPhase =
  | 'IDLE'              // No combat in progress
  | 'ACTION_SELECT'     // Choose action: shot/melee/grenade
  | 'PARAMETERS'        // Set distance, armor, cover
  | 'ROLLING'           // Dice animation in progress
  | 'RESULTS'           // Show combat results
  | 'APPLY';            // Apply damage/effects to unit

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
}

/**
 * Dice roll display state during animation
 */
export interface DiceDisplay {
  hit?: number;               // Range/distance roll
  power?: number[];           // Damage rolls
  meleeA?: number;            // Attacker melee roll
  meleeD?: number;            // Defender melee roll
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
  | { type: 'ROLL_COMPLETE'; result: CombatResult; diceDisplay?: DiceDisplay }
  | { type: 'APPLY_RESULT' }
  | { type: 'GO_BACK_TO_ACTION_SELECT' }
  | { type: 'GO_BACK_TO_PARAMETERS' }
  | { type: 'CLOSE_COMBAT' }
  | { type: 'CANCEL' };

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
  rulesVersion: string;       // 'tehnolog' or 'fan'
  enableSound?: boolean;      // Dice roll sounds
  animationSpeed?: 'fast' | 'normal' | 'slow';
}
